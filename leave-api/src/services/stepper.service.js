/**
 * Stepper Service — centralized status via ../constants/status
 * แทน cms_status ของ EEC แบบ in-code ไม่ต้อง JOIN
 * STATUS กลางอยู่ที่ leave-api/src/constants/status.js
 */
'use strict';

const { STATUS, getStatusThai } = require('../constants/status');

const STEPPER_STEPS = [
  { seq: 1, icon: 'fa-solid fa-file-pen',         name: 'ยื่นคำขอ',            status: STATUS.SU.code },
  { seq: 2, icon: 'fa-solid fa-file-shield',      name: 'ตรวจสอบครบถ้วน',      status: STATUS.DC.code },
  { seq: 3, icon: 'fa-solid fa-file-circle-check', name: 'ตรวจสอบถูกต้อง',      status: STATUS.VC.code },
  { seq: 4, icon: 'fa-solid fa-user-check',       name: 'หัวหน้าอนุมัติ',       status: STATUS.MA.code },
  { seq: 5, icon: 'fa-solid fa-circle-check',     name: 'เสร็จสิ้น',            status: STATUS.AP.code },
];

function getCurrentStepIndex(currentStatus, flagSendBack) {
  if (currentStatus === STATUS.CX.code || currentStatus === STATUS.RJ.code) {
    return -1;
  }
  if (flagSendBack === 'Y') {
    return 0;
  }
  if (currentStatus === STATUS.SU.code) return 0;
  if (currentStatus === STATUS.DC.code) return 1;
  if (currentStatus === STATUS.VC.code) return 2;
  if (currentStatus === STATUS.MA.code) return 3;
  if (currentStatus === STATUS.AP.code) return -1;
  // รองรับ F เก่าให้มองเป็น SU
  if (currentStatus === 'F') return 0;
  return -1;
}

function getStepperSteps(currentStatus, flagSendBack, history, role) {
  const currentIndex = getCurrentStepIndex(currentStatus, flagSendBack);

  let lastApprovedIndex = -1;
  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].status_code === STATUS.AP.code) {
        const stepIdx = STEPPER_STEPS.findIndex(s => s.status === STATUS.AP.code);
        lastApprovedIndex = Math.max(lastApprovedIndex, stepIdx);
      }
    }
  }

  const stepState = (step, index) => {
    if (currentStatus === STATUS.CX.code) return index <= 0 ? 'done' : 'cancelled';
    if (currentStatus === STATUS.RJ.code) return index <= 0 ? 'done' : 'rejected';
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

    if (currentStatus === STATUS.DC.code) {
      if (index === 0) return 'done';
      if (index === 1) return 'current';
      return 'pending';
    }

    if (currentStatus === STATUS.VC.code) {
      if (index <= 1) return 'done';
      if (index === 2) return 'current';
      return 'pending';
    }

    if (currentStatus === STATUS.MA.code) {
      if (index <= 2) return 'done';
      if (index === 3) return 'current';
      return 'pending';
    }

    if (currentStatus === STATUS.AP.code) {
      if (index <= 3) return 'done';
      if (index === 4) return 'done';
      return 'pending';
    }

    return 'pending';
  };

  return STEPPER_STEPS.map((step, index) => ({
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

  return history.map((h, i) => ({
    state: i === history.length - 1 ? 'current' : 'done',
    name: `${getStatusThai(h.status_code)}${h.remark ? ': ' + h.remark : ''}`,
    actionBy: h.action_by_name || '',
    actionRole: h.action_role || '',
    time: h.created_at,
  }));
}

function getApprovableSteps(role) {
  if (role === 'mgr') return ['หัวหน้าอนุมัติ'];
  if (role === 'hr') return ['ตรวจสอบครบถ้วน', 'ตรวจสอบถูกต้อง'];
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
