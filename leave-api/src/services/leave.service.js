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
      leaves = allLeaves.filter(l => {
        const u = allUsers.find(x => x.id === l.user_id);
        return u && u.department === mgr.department;
      });
    } else {
      // employee เห็นเฉพาะของตัวเอง
      leaves = allLeaves.filter(l => l.user_id === userId);
    }

    // เพิ่มชื่อเจ้าของคำขอ (owner_name) ให้ทุกรายการ — ใช้กับหน้า dashboard
    return leaves.map(l => ({ ...l, owner_name: nameMap.get(l.user_id) || l.user_id }));
  }

  async getById(id) {
    return this.db.getLeaveById(id);
  }

  // ★ อนุมัติ — ต้อง status MA (หลังตรวจเอกสารผ่าน) → set AP
  async approve(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== STATUS.MA.code) return { error: 'ไม่สามารถอนุมัติได้ สถานะปัจจุบันไม่ใช่รอหัวหน้าตรวจสอบ (MA)' };
    return this.transition(leaveId, userId, role, STATUS.AP.code, remark);
  }

  // ★ ส่งกลับแก้ไข — เฉพาะ status DC/VC/MA
  async sendBack(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (![STATUS.DC.code, STATUS.VC.code, STATUS.MA.code].includes(leave.current_status)) return { error: 'ไม่สามารถส่งกลับได้ สถานะปัจจุบันไม่รอการตรวจสอบ (DC/VC/MA)' };

    const updated = await this.db.updateLeave(leaveId, {
      current_status: STATUS.SU.code,
      flag_send_back: 'Y',
      send_back_count: (leave.send_back_count || 0) + 1,
    });

    await this.db.addHistory({
      leave_request_id: leaveId,
      status_code: STATUS.SB.code,
      action_by: userId,
      action_role: role,
      remark: remark || 'ส่งกลับแก้ไข',
    });

    return updated;
  }

  // ★ ไม่อนุมัติ — เฉพาะ status VC/MA
  async reject(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (![STATUS.VC.code, STATUS.MA.code].includes(leave.current_status)) return { error: 'ไม่สามารถไม่อนุมัติได้ สถานะปัจจุบันไม่ใช่รอตรวจสอบหรือรอหัวหน้าตรวจสอบ (VC/MA)' };
    return this.transition(leaveId, userId, role, STATUS.RJ.code, remark);
  }

  // ★ ยกเลิก — เฉพาะ status SU
  async cancel(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== STATUS.SU.code) return { error: 'ไม่สามารถยกเลิกได้ สถานะปัจจุบันไม่ใช่รอดำเนินการ (SU)' };
    return this.transition(leaveId, userId, role, STATUS.CX.code, remark);
  }

  // แก้ไขหลังจากถูกส่งกลับ (flag_send_back → N)
  async resubmit(leaveId, userId, data) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return null;
    if (leave.user_id !== userId) return null;
    if (leave.flag_send_back !== 'Y') return null;

    const updateFields = { current_status: STATUS.DC.code, flag_send_back: 'N' };
    if (data.leave_type) updateFields.leave_type = data.leave_type;
    if (data.start_date) updateFields.start_date = data.start_date;
    if (data.end_date) updateFields.end_date = data.end_date;
    if (data.reason) updateFields.reason = data.reason;

    const updated = await this.db.updateLeave(leaveId, updateFields);

    await this.db.addHistory({
      leave_request_id: leaveId,
      status_code: STATUS.DC.code,
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
    if (!leave) return stepperService.getStepperSteps(STATUS.SU.code, 'N', []);

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
