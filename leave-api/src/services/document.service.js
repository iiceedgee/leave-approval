class DocumentService {
  constructor(db) {
    // ⚠️ เดิม: constructor(store) — ตอนนี้ใช้ "db" (InMemoryStore / SupabaseStore)
    this.db = db;
  }

  async pretempPass(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== 'P') return { error: 'ไม่สามารถตรวจสอบความครบถ้วนได้ สถานะปัจจุบันไม่ใช่รอตรวจสอบเอกสาร (P)' };
    const updated = await this.db.updateLeave(leaveId, { current_status: 'T' });
    await this._addVerification(leaveId, 'pretemp', 'pass', userId, role, remark);
    await this._addHistory(leaveId, 'T', userId, role, remark || 'ผ่านการตรวจสอบความครบถ้วน');
    return updated;
  }

  async pretempSendBack(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== 'P') return { error: 'ไม่สามารถส่งกลับได้ สถานะปัจจุบันไม่ใช่รอตรวจสอบเอกสาร (P)' };
    const updated = await this.db.updateLeave(leaveId, {
      current_status: 'F',
      flag_send_back: 'Y',
      send_back_count: (leave.send_back_count || 0) + 1,
    });
    await this._addVerification(leaveId, 'pretemp', 'sendback', userId, role, remark);
    await this._addHistory(leaveId, 'B', userId, role, remark || 'ส่งกลับแก้ไขเอกสาร');
    return updated;
  }

  async tempPass(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== 'T') return { error: 'ไม่สามารถตรวจสอบความถูกต้องได้ สถานะปัจจุบันไม่ใช่ตรวจสอบความถูกต้อง (T)' };
    const updated = await this.db.updateLeave(leaveId, { current_status: 'M' });
    await this._addVerification(leaveId, 'temp', 'pass', userId, role, remark);
    await this._addHistory(leaveId, 'M', userId, role, remark || 'ผ่านการตรวจสอบความถูกต้อง');
    return updated;
  }

  async tempSendBack(leaveId, userId, role, remark) {
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== 'T') return { error: 'ไม่สามารถส่งกลับได้ สถานะปัจจุบันไม่ใช่ตรวจสอบความถูกต้อง (T)' };
    const updated = await this.db.updateLeave(leaveId, {
      current_status: 'F',
      flag_send_back: 'Y',
      send_back_count: (leave.send_back_count || 0) + 1,
    });
    await this._addVerification(leaveId, 'temp', 'sendback', userId, role, remark);
    await this._addHistory(leaveId, 'B', userId, role, remark || 'ส่งกลับแก้ไขเอกสาร');
    return updated;
  }

  async getVerifications(leaveId) {
    const verifications = await this.db.listVerificationsByLeave(leaveId);
    const allUsers = await this.db.listUsers();
    return verifications.map(v => {
      const user = allUsers.find(u => u.id === v.verified_by);
      return { ...v, verified_by_name: user ? user.full_name : '' };
    });
  }

  async _addVerification(leaveId, stage, result, userId, role, remark) {
    await this.db.addVerification({
      leave_request_id: leaveId,
      stage,
      result,
      verified_by: userId,
      verified_role: role,
      remark: remark || '',
    });
  }

  async _addHistory(leaveId, statusCode, userId, role, remark) {
    await this.db.addHistory({
      leave_request_id: leaveId,
      status_code: statusCode,
      action_by: userId,
      action_role: role,
      remark: remark || '',
    });
  }
}

module.exports = DocumentService;