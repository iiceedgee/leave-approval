'use strict';

const stepperService = require('./stepper.service');
const leaveQuota = require('../config/leave-quota');
const { STATUS } = require('../constants/status');

class LeaveService {
  constructor(db) {
    // ⚠️ เดิม: constructor(store) + this.store.leaves.find(...)
    // ตอนนี้ใช้ "db" ซึ่งเป็น InMemoryStore หรือ SupabaseStore ก็ได้
    // (ทั้ง 2 ตัวมี method ชื่อเดียวกัน → service ไม่ต้องรู้ว่าเก็บที่ไหน)
    this.db = db;
  }

  // พนักงานยื่นคำขอลา → status = SU
  async create(userId, data) {
    if (!userId) throw Object.assign(new Error('ไม่พบผู้ใช้'), { statusCode: 401 });
    const allowed = Object.keys(require('../config/leave-quota'));
    if (!data.leave_type || !allowed.includes(data.leave_type.trim())) throw Object.assign(new Error(`leave_type ต้องเป็น ${allowed.join(', ')}`), {statusCode:400});
    if (!data.start_date || !data.end_date || isNaN(Date.parse(data.start_date)) || isNaN(Date.parse(data.end_date))) throw Object.assign(new Error('รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)'), {statusCode:400});
    if (new Date(data.end_date) < new Date(data.start_date)) throw Object.assign(new Error('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม'), {statusCode:400});
    if (!data.reason || data.reason.trim().length < 5) throw Object.assign(new Error('เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร'), {statusCode:400});
    const leave = await this.db.createLeave({
      user_id: userId,
      leave_type: data.leave_type.trim(),
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason.trim(),
      current_status: STATUS.SU.code,
      flag_send_back: 'N',
      send_back_count: 0,
    });

    // บันทึก history
    await this.db.addHistory({
      leave_request_id: leave.id,
      status_code: STATUS.SU.code,
      action_by: userId,
      action_role: 'emp',
      remark: 'ยื่นคำขอลา',
    });

    return leave;
  }

  // ดึง leaves ตาม role — manager เห็นของลูกทีม, HR เห็นทั้งหมด
  async getLeaves(userId, role) {
    const allLeaves = await this.db.listLeaves();
    const allUsers = await this.db.listUsers();
    const nameMap = new Map(allUsers.map(u => [u.id, u.full_name]));

    let leaves;
    if (role === 'hr') {
      leaves = allLeaves;
    } else if (role === 'mgr') {
      // manager เห็น leaves ของ employees ใน department เดียวกัน
      const mgr = allUsers.find(u => u.id === userId);
      if (!mgr) return [];
      leaves = allLeaves.filter(l => {
        const u = allUsers.find(x => x.id === l.user_id);
        return u && u.department === mgr.department;
      });
    } else {
      // employee เห็นเฉพาะของตัวเอง
      leaves = allLeaves.filter(l => l.user_id === userId);
    }

    // เพิ่มชื่อเจ้าของคำขอ (owner_name) — เรียงจาก DB แล้ว (updated_at DESC) ไม่ต้อง sort ซ้ำ
    return leaves.map(l => ({ ...l, owner_name: nameMap.get(l.user_id) || l.user_id }));
  }

  async getById(id) {
    if (!id) return null;
    return this.db.getLeaveById(id);
  }

  // ★ อนุมัติ — ต้อง status MA และ role=mgr เท่านั้น (หัวหน้าคนเดียว) — กันชน 2 คนกดพร้อมกัน
  async approve(leaveId, userId, role, remark) {
    if (!leaveId || !userId) return { error: 'พารามิเตอร์ไม่ครบ' };
    if (role !== 'mgr') return { error: 'เฉพาะหัวหน้า (mgr) เท่านั้นที่อนุมัติได้' };
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== STATUS.MA.code) return { error: 'ไม่สามารถอนุมัติได้ สถานะปัจจุบันไม่ใช่รอหัวหน้าตรวจสอบ (MA)' };
    const res = await this.transition(leaveId, userId, role, STATUS.AP.code, remark, STATUS.MA.code);
    if (res && res.statusCode === 409) return res;
    return res;
  }

  // ★ ส่งกลับแก้ไข — DC ให้ hr/mgr, MA ให้ mgr คนเดียว (VC removed, but legacy VC still supported deprecated)
  async sendBack(leaveId, userId, role, remark) {
    if (!leaveId || !userId) return { error: 'พารามิเตอร์ไม่ครบ' };
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };

    // Simplified allowed: DC and MA (VC deprecated — keep for backward compat warning)
    const allowedStatuses = [STATUS.DC.code, STATUS.MA.code];
    // Legacy VC support: allow but warn
    const isLegacyVC = leave.current_status === 'VC';
    if (!allowedStatuses.includes(leave.current_status) && !isLegacyVC) {
      return { error: 'ไม่สามารถส่งกลับได้ สถานะปัจจุบันไม่รอการตรวจสอบ (DC/MA)' };
    }
    if (isLegacyVC) {
      console.warn('[leave.service] sendBack: legacy VC status — allowing for backward compat');
    }
    if (leave.current_status === STATUS.MA.code && role !== 'mgr') return { error: 'เฉพาะหัวหน้าเท่านั้นที่ส่งกลับที่ MA ได้' };
    if (!remark || !String(remark).trim()) return { error: 'กรุณาระบุเหตุผลที่ส่งกลับ' };

    // กันชน 2 คนกดพร้อมกัน: UPDATE WHERE current_status เท่านั้น — ถ้าโดนชิงไปแล้วจะได้ null → 409
    const prevStatus = leave.current_status;
    const where = isLegacyVC ? { current_status: 'VC' } : { current_status: prevStatus };
    const updatePayload = {
      current_status: STATUS.SU.code,
      flag_send_back: 'Y',
      send_back_count: (leave.send_back_count || 0) + 1,
    };
    let updated = null;
    if (typeof this.db.updateLeaveWhere === 'function') {
      updated = await this.db.updateLeaveWhere(leaveId, updatePayload, where);
      if (!updated) {
        const fresh = await this.db.getLeaveById(leaveId);
        if (fresh && fresh.current_status !== prevStatus) {
          return { error: 'คำขอนี้ถูกดำเนินการไปแล้ว กรุณารีเฟรช', statusCode: 409 };
        }
        return { error: 'ไม่สามารถส่งกลับได้ สถานะปัจจุบันไม่รอการตรวจสอบ (DC/MA)' };
      }
    } else {
      updated = await this.db.updateLeave(leaveId, updatePayload);
    }

    await this.db.addHistory({
      leave_request_id: leaveId,
      status_code: STATUS.SB.code,
      action_by: userId,
      action_role: role,
      remark: remark || 'ส่งกลับแก้ไข',
    });

    return updated;
  }

  // ★ ไม่อนุมัติ — DC ให้ hr/mgr, MA ให้ mgr คนเดียว (VC removed) — กันชน 2 คนกดพร้อมกัน
  async reject(leaveId, userId, role, remark) {
    if (!leaveId || !userId) return { error: 'พารามิเตอร์ไม่ครบ' };
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };

    // Simplified: DC and MA can reject (VC removed but legacy VC allowed deprecated)
    const allowedStatuses = [STATUS.DC.code, STATUS.MA.code];
    const isLegacyVC = leave.current_status === 'VC';
    if (!allowedStatuses.includes(leave.current_status) && !isLegacyVC) {
      return { error: 'ไม่สามารถไม่อนุมัติได้ สถานะปัจจุบันไม่ใช่รอตรวจสอบหรือรอหัวหน้าตรวจสอบ (DC/MA)' };
    }
    if (isLegacyVC) {
      console.warn('[leave.service] reject: legacy VC status — allowing for backward compat');
    }
    if (leave.current_status === STATUS.MA.code && role !== 'mgr') return { error: 'เฉพาะหัวหน้าเท่านั้นที่ไม่อนุมัติที่ MA ได้' };
    if (!remark || !String(remark).trim()) return { error: 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' };
    // กันชน: transition แบบ WHERE status เดิม — ถ้าโดนชิงไปแล้วจะได้ 409
    const res = await this.transition(leaveId, userId, role, STATUS.RJ.code, remark, leave.current_status);
    if (res && res.statusCode === 409) return res;
    if (res && res.error) return res;
    return res;
  }

  // ★ ยกเลิก — เฉพาะ status SU
  async cancel(leaveId, userId, role, remark) {
    if (!leaveId || !userId) return { error: 'พารามิเตอร์ไม่ครบ' };
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== STATUS.SU.code) return { error: 'ไม่สามารถยกเลิกได้ สถานะปัจจุบันไม่ใช่รอดำเนินการ (SU)' };
    // Only owner or hr/mgr? Currently any role can cancel if status SU? Keep check for emp owner is done at route level.
    return this.transition(leaveId, userId, role, STATUS.CX.code, remark);
  }

  // แก้ไขหลังจากถูกส่งกลับ (flag_send_back → N) — ส่งพร้อมไฟล์ทีเดียว ไม่แยกยิง file ก่อน
  async resubmit(leaveId, userId, data) {
    if (!leaveId || !userId) return { error: 'พารามิเตอร์ไม่ครบ' };
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.user_id !== userId) return { error: 'ไม่ใช่เจ้าของคำขอนี้' };
    if (leave.flag_send_back !== 'Y') return { error: 'คำขอนี้ไม่ได้ถูกส่งกลับแก้ไข' };
    if (leave.current_status !== STATUS.SU.code) return { error: 'สถานะปัจจุบันไม่ใช่รอแก้ไข (SU)' };

    // validate fields — same rules as create (reuse leave-quota keys)
    if (data.leave_type !== undefined) {
      const allowed = Object.keys(leaveQuota);
      if (!data.leave_type || !allowed.includes(String(data.leave_type).trim())) throw Object.assign(new Error(`leave_type ต้องเป็น ${allowed.join(', ')}`), { statusCode: 400 });
    }
    if (data.start_date !== undefined && isNaN(Date.parse(data.start_date))) throw Object.assign(new Error('รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)'), { statusCode: 400 });
    if (data.end_date !== undefined && isNaN(Date.parse(data.end_date))) throw Object.assign(new Error('รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)'), { statusCode: 400 });
    const effStart = data.start_date || leave.start_date;
    const effEnd = data.end_date || leave.end_date;
    if (effStart && effEnd && new Date(effEnd) < new Date(effStart)) throw Object.assign(new Error('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม'), { statusCode: 400 });
    if (data.reason !== undefined && (!data.reason || String(data.reason).trim().length < 5)) throw Object.assign(new Error('เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร'), { statusCode: 400 });

    const updateFields = { current_status: STATUS.DC.code, flag_send_back: 'N' };
    if (data.leave_type) updateFields.leave_type = String(data.leave_type).trim();
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.reason) updateFields.reason = String(data.reason).trim();

    // Atomic: UPDATE WHERE flag='Y' AND status='SU' — กัน 2 tab แย่งกัน (optimistic lock)
    let updated = null;
    if (typeof this.db.updateLeaveWhere === 'function') {
      updated = await this.db.updateLeaveWhere(leaveId, updateFields, { flag_send_back: 'Y', current_status: STATUS.SU.code });
      if (!updated) {
        // ลองเช็ค F legacy (DB เก่า) — ถ้าแถวเป็น F ก็ให้ผ่านเหมือนกัน
        const legacyWhere = { flag_send_back: 'Y', current_status: 'F' };
        updated = await this.db.updateLeaveWhere(leaveId, { ...updateFields, current_status: 'F' }, legacyWhere);
        if (updated) updated = { ...updated, current_status: STATUS.SU.code };
      }
      if (!updated) {
        const fresh = await this.db.getLeaveById(leaveId);
        if (fresh && fresh.current_status === STATUS.DC.code && fresh.flag_send_back === 'N') {
          return { error: 'คำขอนี้ถูกส่งไปแล้ว กำลังรีเฟรช', statusCode: 409 };
        }
        return { error: 'คำขอนี้ไม่ได้ถูกส่งกลับแก้ไข' };
      }
    } else {
      updated = await this.db.updateLeave(leaveId, updateFields);
    }

    await this.db.addHistory({
      leave_request_id: leaveId,
      status_code: STATUS.DC.code,
      action_by: userId,
      action_role: 'emp',
      remark: 'ส่งคำขออีกครั้งหลังจากแก้ไข',
    });

    return updated;
  }

  // logic กลางสำหรับเปลี่ยน status + บันทึก history — กันชน 2 คนกดพร้อมกันด้วย WHERE status เดิม
  async transition(leaveId, userId, role, targetStatus, remark, expectedStatus) {
    if (!leaveId || !userId || !targetStatus) return null;
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return null;

    // ถ้ามี expectedStatus ให้ใช้ atomic WHERE กัน 2 tab/2 คนกดพร้อมกัน
    const whereStatus = expectedStatus || leave.current_status;
    let updated = null;
    if (typeof this.db.updateLeaveWhere === 'function' && whereStatus) {
      updated = await this.db.updateLeaveWhere(leaveId, { current_status: targetStatus }, { current_status: whereStatus });
      if (!updated) {
        const fresh = await this.db.getLeaveById(leaveId);
        if (fresh && fresh.current_status !== whereStatus) {
          return { error: 'คำขอนี้ถูกดำเนินการไปแล้ว กรุณารีเฟรช', statusCode: 409 };
        }
        return { error: 'ไม่สามารถเปลี่ยนสถานะได้ สถานะปัจจุบันไม่ใช่ค่าที่คาดไว้' };
      }
    } else {
      updated = await this.db.updateLeave(leaveId, { current_status: targetStatus });
    }

    await this.db.addHistory({
      leave_request_id: leaveId,
      status_code: targetStatus,
      action_by: userId,
      action_role: role,
      remark: remark || '',
    });

    return updated;
  }

  // ★ ดึง stepper steps
  async getStepper(leaveId) {
    if (!leaveId) return stepperService.getStepperSteps(STATUS.SU.code, 'N', []);
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return stepperService.getStepperSteps(STATUS.SU.code, 'N', []);

    const history = await this.db.listHistoryByLeave(leaveId);
    return stepperService.getStepperSteps(leave.current_status, leave.flag_send_back, history);
  }

  // ★ ดึง history timeline
  async getHistory(leaveId) {
    if (!leaveId) return [];
    return this._historyWithNames(leaveId).then(h => stepperService.buildHistoryTimeline(h));
  }

  async getHistoryRaw(leaveId) {
    if (!leaveId) return [];
    return this._historyWithNames(leaveId);
  }

  async _historyWithNames(leaveId) {
    const history = await this.db.listHistoryByLeave(leaveId);
    const allUsers = await this.db.listUsers();

    return (history || []).map(h => {
      const user = allUsers.find(u => u.id === h.action_by);
      return { ...h, action_by_name: user ? user.full_name : '' };
    });
  }

  // ★ คำนวณจำนวนวันลา (รวมวันเริ่มต้นและวันสิ้นสุด)
  static calcLeaveDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1;
  }

  // ★ ดึงประวัติการลาของพนักงานตามปี
  async getMyHistory(userId, year) {
    if (!userId) return [];
    const targetYear = year || new Date().getFullYear();
    const allLeaves = await this.db.listLeaves();
    return allLeaves
      .filter(l => l.user_id === userId && new Date(l.start_date).getFullYear() === targetYear)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(l => ({
        ...l,
        used_days: LeaveService.calcLeaveDays(l.start_date, l.end_date),
      }));
  }

  // ★ ดึงยอดคงเหลือการลาของพนักงานตามปี
  async getMyBalance(userId, year) {
    if (!userId) return [];
    const targetYear = year || new Date().getFullYear();
    const allLeaves = await this.db.listLeaves();
    const approvedLeaves = allLeaves.filter(l =>
      l.user_id === userId
      && l.current_status === STATUS.AP.code
      && new Date(l.start_date).getFullYear() === targetYear
    );

    // รวมจำนวนวันที่ใช้ไปตามประเภทลา
    const usedMap = {};
    approvedLeaves.forEach(l => {
      const days = LeaveService.calcLeaveDays(l.start_date, l.end_date);
      usedMap[l.leave_type] = (usedMap[l.leave_type] || 0) + days;
    });

    // สร้างผลลัพธ์จาก quota config
    return Object.keys(leaveQuota).map(leaveType => ({
      leave_type: leaveType,
      quota: leaveQuota[leaveType],
      used: usedMap[leaveType] || 0,
      remaining: leaveQuota[leaveType] - (usedMap[leaveType] || 0),
    }));
  }
}

module.exports = LeaveService;
