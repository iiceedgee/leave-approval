'use strict';

const { STATUS } = require('../constants/status');

class DocumentService {
  constructor(db) {
    // ⚠️ เดิม: constructor(store) — ตอนนี้ใช้ "db" (InMemoryStore / SupabaseStore)
    this.db = db;
  }

  /**
   * pretempPass — ตรวจสอบความครบถ้วนผ่าน: DC -> MA (simplified flow, VC removed)
   * Legacy: เคยเป็น DC -> VC -> MA, ตอนนี้ข้าม VC ไป MA เลย
   */
  async pretempPass(leaveId, userId, role, remark) {
    if (!leaveId || !userId) return { error: 'พารามิเตอร์ไม่ครบ' };
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== STATUS.DC.code) return { error: 'ไม่สามารถตรวจสอบความครบถ้วนได้ สถานะปัจจุบันไม่ใช่รอตรวจสอบเอกสาร (DC)' };
    if (!['hr', 'mgr'].includes(role)) return { error: 'ไม่มีสิทธิ์ดำเนินการ' };

    // Simplified: DC directly to MA (no VC intermediate)
    const updated = await this.db.updateLeave(leaveId, { current_status: STATUS.MA.code });
    await this._addVerification(leaveId, 'pretemp', 'pass', userId, role, remark);
    await this._addHistory(leaveId, STATUS.MA.code, userId, role, remark || 'ผ่านการตรวจสอบความครบถ้วน — ส่งต่อรอหัวหน้าอนุมัติ');
    return updated;
  }

  async pretempSendBack(leaveId, userId, role, remark) {
    if (!leaveId || !userId) return { error: 'พารามิเตอร์ไม่ครบ' };
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    if (leave.current_status !== STATUS.DC.code) return { error: 'ไม่สามารถส่งกลับได้ สถานะปัจจุบันไม่ใช่รอตรวจสอบเอกสาร (DC)' };
    if (!['hr', 'mgr'].includes(role)) return { error: 'ไม่มีสิทธิ์ดำเนินการ' };
    if (!remark || !String(remark).trim()) return { error: 'กรุณาระบุเหตุผลที่ส่งกลับ' };

    const updated = await this.db.updateLeave(leaveId, {
      current_status: STATUS.SU.code,
      flag_send_back: 'Y',
      send_back_count: (leave.send_back_count || 0) + 1,
    });
    await this._addVerification(leaveId, 'pretemp', 'sendback', userId, role, remark);
    await this._addHistory(leaveId, STATUS.SB.code, userId, role, remark || 'ส่งกลับแก้ไขเอกสาร');
    return updated;
  }

  /**
   * @deprecated VC flow removed — kept for backward compat with legacy leaves still in VC.
   * New flow uses pretempPass (DC->MA). This method now delegates or handles legacy VC->MA.
   */
  async tempPass(leaveId, userId, role, remark) {
    if (!leaveId || !userId) return { error: 'พารามิเตอร์ไม่ครบ' };
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    // Support legacy VC only; DC should use pretempPass now
    const LEGACY_VC = 'VC';
    if (leave.current_status !== LEGACY_VC) {
      // For backward compat, also allow DC -> MA via tempPass (redirect)
      if (leave.current_status === STATUS.DC.code) {
        console.warn('[document.service] tempPass called at DC — delegating to pretempPass (VC deprecated)');
        return this.pretempPass(leaveId, userId, role, remark);
      }
      return { error: 'ไม่สามารถตรวจสอบความถูกต้องได้ สถานะปัจจุบันไม่ใช่ตรวจสอบความถูกต้อง (VC) — ใช้ pretemp แทน' };
    }
    console.warn('[document.service] tempPass: legacy VC->MA transition');
    const updated = await this.db.updateLeave(leaveId, { current_status: STATUS.MA.code });
    await this._addVerification(leaveId, 'temp', 'pass', userId, role, remark);
    await this._addHistory(leaveId, STATUS.MA.code, userId, role, remark || 'ผ่านการตรวจสอบความถูกต้อง (legacy VC)');
    return updated;
  }

  /**
   * @deprecated VC flow removed — kept for backward compat.
   */
  async tempSendBack(leaveId, userId, role, remark) {
    if (!leaveId || !userId) return { error: 'พารามิเตอร์ไม่ครบ' };
    const leave = await this.db.getLeaveById(leaveId);
    if (!leave) return { error: 'ไม่พบคำขอ' };
    const LEGACY_VC = 'VC';
    if (leave.current_status !== LEGACY_VC) {
      if (leave.current_status === STATUS.DC.code) {
        console.warn('[document.service] tempSendBack called at DC — delegating to pretempSendBack (VC deprecated)');
        return this.pretempSendBack(leaveId, userId, role, remark);
      }
      return { error: 'ไม่สามารถส่งกลับได้ สถานะปัจจุบันไม่ใช่ตรวจสอบความถูกต้อง (VC)' };
    }
    if (!remark || !String(remark).trim()) return { error: 'กรุณาระบุเหตุผลที่ส่งกลับ' };
    console.warn('[document.service] tempSendBack: legacy VC->SU');
    const updated = await this.db.updateLeave(leaveId, {
      current_status: STATUS.SU.code,
      flag_send_back: 'Y',
      send_back_count: (leave.send_back_count || 0) + 1,
    });
    await this._addVerification(leaveId, 'temp', 'sendback', userId, role, remark);
    await this._addHistory(leaveId, STATUS.SB.code, userId, role, remark || 'ส่งกลับแก้ไขเอกสาร (legacy VC)');
    return updated;
  }

  async getVerifications(leaveId) {
    if (!leaveId) return [];
    try {
      const verifications = await this.db.listVerificationsByLeave(leaveId);
      const allUsers = await this.db.listUsers();
      return (verifications || []).map(v => {
        const user = allUsers.find(u => u.id === v.verified_by);
        return { ...v, verified_by_name: user ? user.full_name : '' };
      });
    } catch (e) {
      console.error('[document.service] getVerifications error', e.message);
      return [];
    }
  }

  async _addVerification(leaveId, stage, result, userId, role, remark) {
    try {
      await this.db.addVerification({
        leave_request_id: leaveId,
        stage,
        result,
        verified_by: userId,
        verified_role: role,
        remark: remark || '',
      });
    } catch (e) {
      console.error('[document.service] _addVerification failed', e.message);
    }
  }

  async _addHistory(leaveId, statusCode, userId, role, remark) {
    try {
      await this.db.addHistory({
        leave_request_id: leaveId,
        status_code: statusCode,
        action_by: userId,
        action_role: role,
        remark: remark || '',
      });
    } catch (e) {
      console.error('[document.service] _addHistory failed', e.message);
    }
  }
}

module.exports = DocumentService;
