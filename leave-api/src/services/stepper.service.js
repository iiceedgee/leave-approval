/**
 * Stepper Service — centralized status via ../constants/status
 * แทน cms_status ของ EEC แบบ in-code ไม่ต้อง JOIN
 * STATUS กลางอยู่ที่ leave-api/src/constants/status.js
 * Flow ย่อเหลือ 4 ขั้น: SU -> DC -> MA -> AP (VC ถูกรวมเข้ากับ DC)
 */
'use strict';

const { STATUS, getStatusThai } = require('../constants/status');

const BASE_STEPS = [
  { seq: 1, icon: 'fa-solid fa-file-pen',    name: 'ยื่นคำขอ',       status: STATUS.SU.code },
  { seq: 2, icon: 'fa-solid fa-file-shield', name: 'ตรวจสอบเอกสาร',  status: STATUS.DC.code },
  { seq: 3, icon: 'fa-solid fa-user-check',  name: 'หัวหน้าอนุมัติ',  status: STATUS.MA.code },
];

// Polymorphic final — อนุมัติ/ไม่อนุมัติ/ยกเลิก ใช้ slot เดียวกัน (seq 4) สลับ icon/name/state ตาม terminal
function getFinalStep(currentStatus) {
  if (currentStatus === STATUS.RJ.code) return { seq: 4, icon: 'fa-solid fa-circle-xmark', name: 'ไม่อนุมัติ', status: STATUS.RJ.code };
  if (currentStatus === STATUS.CX.code) return { seq: 4, icon: 'fa-solid fa-ban',           name: 'ยกเลิก',    status: STATUS.CX.code };
  return { seq: 4, icon: 'fa-solid fa-circle-check', name: 'เสร็จสิ้น', status: STATUS.AP.code };
}

// For backward compat keep STEPPER_STEPS as 4-step AP variant
const STEPPER_STEPS = [...BASE_STEPS, getFinalStep(STATUS.AP.code)];

function getMaxReachedIndex(history, currentStatus) {
  const map = { SU: 0, F: 0, DC: 1, VC: 1, MA: 2, AP: 3 };
  let max = -1;
  (history || []).forEach(h => {
    if (h.status_code === STATUS.RJ.code || h.status_code === STATUS.CX.code || h.status_code === STATUS.SB.code) return;
    if (map[h.status_code] != null) max = Math.max(max, map[h.status_code]);
  });
  if (currentStatus && map[currentStatus] != null && currentStatus !== STATUS.RJ.code && currentStatus !== STATUS.CX.code) {
    max = Math.max(max, map[currentStatus]);
  }
  // Terminal with empty history — at least show first step as done (ยื่นคำขอ)
  if (max === -1 && (currentStatus === STATUS.RJ.code || currentStatus === STATUS.CX.code)) max = 0;
  return max;
}

function getCurrentStepIndex(currentStatus, flagSendBack) {
  if (currentStatus === STATUS.CX.code || currentStatus === STATUS.RJ.code) {
    return -1;
  }
  if (flagSendBack === 'Y') {
    return 0;
  }
  if (currentStatus === STATUS.SU.code) return 0;
  if (currentStatus === STATUS.DC.code) return 1;
  if (currentStatus === STATUS.MA.code) return 2;
  if (currentStatus === STATUS.AP.code) return -1;
  // รองรับ F/VC เก่าให้มองเป็น SU/DC เพื่อ backward compat
  if (currentStatus === 'F') return 0;
  if (currentStatus === 'VC') return 1; // legacy VC → treat as DC
  return -1;
}

function getStepperSteps(currentStatus, flagSendBack, history, role) {
  const steps = [...BASE_STEPS, getFinalStep(currentStatus)];
  const maxReached = getMaxReachedIndex(history, currentStatus);

  const stepState = (step, index) => {
    // Terminal polymorphic — only final step (seq 4) is rejected/cancelled, 0-2 done/pending by how far it reached
    if (currentStatus === STATUS.AP.code) return 'done';
    if (currentStatus === STATUS.RJ.code) {
      if (index === 3) return 'rejected';
      return index <= maxReached ? 'done' : 'pending';
    }
    if (currentStatus === STATUS.CX.code) {
      if (index === 3) return 'cancelled';
      return index <= maxReached ? 'done' : 'pending';
    }
    if (flagSendBack === 'Y' && index === 0) return 'current';
    if (flagSendBack === 'Y') return 'pending';

    if (currentStatus === STATUS.SU.code) {
      if (index === 0) return 'current';
      return 'pending';
    }

    if (currentStatus === 'F') {
      if (index === 0) return 'current';
      return 'pending';
    }

    if (currentStatus === STATUS.DC.code || currentStatus === 'VC') {
      if (index === 0) return 'done';
      if (index === 1) return 'current';
      return 'pending';
    }

    if (currentStatus === STATUS.MA.code) {
      if (index <= 1) return 'done';
      if (index === 2) return 'current';
      return 'pending';
    }

    return 'pending';
  };

  return steps.map((step, index) => ({
    seq: step.seq,
    icon: step.icon,
    name: step.name,
    statusCode: step.status,
    state: stepState(step, index),
  }));
}

function buildHistoryTimeline(history) {
  if (!history || history.length === 0) {
    return [{ state: 'current', name: 'รอดำเนินการ', time: null }];
  }

  return history.map((h, i) => {
    const isLast = i === history.length - 1;
    let state = isLast ? 'current' : 'done';
    if (h.status_code === STATUS.RJ.code) state = 'rejected';
    else if (h.status_code === STATUS.CX.code) state = 'cancelled';
    else if (h.status_code === STATUS.SB.code) state = isLast ? 'current' : 'done';
    return {
      state,
      name: `${getStatusThai(h.status_code)}${h.remark ? ': ' + h.remark : ''}`,
      actionBy: h.action_by_name || '',
      actionRole: h.action_role || '',
      time: h.created_at,
    };
  });
}

function getApprovableSteps(role) {
  if (role === 'mgr') return ['หัวหน้าอนุมัติ'];
  if (role === 'hr') return ['ตรวจสอบเอกสาร'];
  return [];
}

module.exports = {
  STEPPER_STEPS,
  getStepperSteps,
  buildHistoryTimeline,
  getStatusThai,
  getApprovableSteps,
  getCurrentStepIndex,
};
