const stepperService = require('./stepper.service');
const leaveQuota = require('../config/leave-quota');

class LeaveService {
  constructor(db) {
    // ⚠️ เดิม: constructor(store) + this.store.leaves.find(...)
    // ตอนนี้ใช้ "db" ซึ่งเป็น InMemoryStore หรือ SupabaseStore ก็ได้
    // (ทั้ง 2 ตัวมี method ชื่อเดียวกัน → service ไม่ต้องรู้ว่าเก็บที่ไหน)
    this.db = db;
  }

  // พนักงานยื่นคำขอลา → status = F
  async create(userId, data) {
    const leave = await this.db.createLeave({
      user_id: userId,
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason,
    });

    // บันทึก history
    await this.db.addHistory({
      leave_request_id: leave.id,
      status_code: 'F',
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

    if (role === 'hr') return allLeaves;
    if (role === 'mgr') {
      // manager เห็น leaves ของ employees ใน department เดียวกัน
      const mgr = allUsers.find(u => u.id === userId);
      return allLeaves.filter(l => {
        const u = allUsers.find(x => x.id === l.user_id);
        return u && u.department === mgr.department;
      });
    }
    // employee เห็นเฉพาะของตัวเอง
    return allLeaves.filter(l => l.user_id === userId);
  }

  async getById(id) {
    return this.db.getLeaveById(id);
  }

  // ★ อนุมัติ — ต้อง status M (หลังตรวจเอกสารผ่าน) → set S
  async approve(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== 'M') return { error: 'ไม่สามารถอนุมัติได้ สถานะปัจจุบันไม่ใช่รอหัวหน้าตรวจสอบ (M)' };
    return this.transition(leaveId, userId, role, 'S', remark);
  }

  // ★ ส่งกลับแก้ไข — เฉพาะ status P/T/M
  async sendBack(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (!['P', 'T', 'M'].includes(leave.current_status)) return { error: 'ไม่สามารถส่งกลับได้ สถานะปัจจุบันไม่รอการตรวจสอบ (P/T/M)' };

    const updated = await this.db.updateLeave(leaveId, {
      current_status: 'F',
      flag_send_back: 'Y',
      send_back_count: (leave.send_back_count || 0) + 1,
    });

    await this.db.addHistory({
      leave_request_id: leaveId,
      status_code: 'B',
      action_by: userId,
      action_role: role,
      remark: remark || 'ส่งกลับแก้ไข',
    });

    return updated;
  }

  // ★ ไม่อนุมัติ — เฉพาะ status T/M
  async reject(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (!['T', 'M'].includes(leave.current_status)) return { error: 'ไม่สามารถไม่อนุมัติได้ สถานะปัจจุบันไม่ใช่รอตรวจสอบหรือรอหัวหน้าตรวจสอบ (T/M)' };
    return this.transition(leaveId, userId, role, 'U', remark);
  }

  // ★ ยกเลิก — เฉพาะ status F
  async cancel(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== 'F') return { error: 'ไม่สามารถยกเลิกได้ สถานะปัจจุบันไม่ใช่รอดำเนินการ (F)' };
    return this.transition(leaveId, userId, role, 'C', remark);
  }

  // แก้ไขหลังจากถูกส่งกลับ (flag_send_back → N)
  async resubmit(leaveId, userId, data) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return null;
    if (leave.user_id !== userId) return null;
    if (leave.flag_send_back !== 'Y') return null;

    const updateFields = { current_status: 'P', flag_send_back: 'N' };
    if (data.leave_type) updateFields.leave_type = data.leave_type;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.reason) updateFields.reason = data.reason;

    const updated = await this.db.updateLeave(leaveId, updateFields);

    await this.db.addHistory({
      leave_request_id: leaveId,
      status_code: 'P',
      action_by: userId,
      action_role: 'emp',
      remark: 'ส่งคำขออีกครั้งหลังจากแก้ไข',
    });

    return updated;
  }

  // logic กลางสำหรับเปลี่ยน status + บันทึก history
  async transition(leaveId, userId, role, targetStatus, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return null;

    const updated = await this.db.updateLeave(leaveId, { current_status: targetStatus });

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
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return stepperService.getStepperSteps('F', 'N', []);

    const history = await this.db.listHistoryByLeave(leaveId);
    return stepperService.getStepperSteps(leave.current_status, leave.flag_send_back, history);
  }

  // ★ ดึง history timeline
  async getHistory(leaveId) {
    return this._historyWithNames(leaveId).then(h => stepperService.buildHistoryTimeline(h));
  }

  async getHistoryRaw(leaveId) {
    return this._historyWithNames(leaveId);
  }

  async _historyWithNames(leaveId) {
    const history = await this.db.listHistoryByLeave(leaveId);
    const allUsers = await this.db.listUsers();

    return history.map(h => {
      const user = allUsers.find(u => u.id === h.action_by);
      return { ...h, action_by_name: user ? user.full_name : '' };
    });
  }

  // ★ คำนวณจำนวนวันลา (รวมวันเริ่มต้นและวันสิ้นสุด)
  static calcLeaveDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.floor((endUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1;
  }

  // ★ ดึงประวัติการลาของพนักงานตามปี
  async getMyHistory(userId, year) {
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
    const targetYear = year || new Date().getFullYear();
    const allLeaves = await this.db.listLeaves();
    const approvedLeaves = allLeaves.filter(l =>
      l.user_id === userId
      && l.current_status === 'S'
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