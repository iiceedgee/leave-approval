const STEPPER_STEPS = [
  { seq: 1, icon: 'fa-solid fa-file-pen',    name: 'ยื่นคำขอ',          status: 'F' },
  { seq: 2, icon: 'fa-solid fa-file-shield',  name: 'ตรวจสอบเอกสาร',     status: 'P' },
  { seq: 3, icon: 'fa-solid fa-user-check',   name: 'หัวหน้าตรวจสอบ',    status: 'M' },
  { seq: 4, icon: 'fa-solid fa-building',     name: 'HR อนุมัติ',         status: 'S' },
  { seq: 5, icon: 'fa-solid fa-circle-check', name: 'เสร็จสิ้น',          status: 'S' },
];

function getCurrentStepIndex(currentStatus, flagSendBack) {
  if (currentStatus === 'C' || currentStatus === 'U') {
    return -1;
  }
  if (flagSendBack === 'Y') {
    return 0;
  }
  if (currentStatus === 'F') return 0;
  if (currentStatus === 'P') return 1;
  if (currentStatus === 'T') return 1;
  if (currentStatus === 'M') return 2;
  if (currentStatus === 'S') return -1;
  return -1;
}

function getStepperSteps(currentStatus, flagSendBack, history, role) {
  const currentIndex = getCurrentStepIndex(currentStatus, flagSendBack);

  let lastApprovedIndex = -1;
  if (history && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].status_code === 'S') {
        const stepIdx = STEPPER_STEPS.findIndex(s => s.status === 'S');
        lastApprovedIndex = Math.max(lastApprovedIndex, stepIdx);
      }
    }
  }

  const stepState = (step, index) => {
    if (currentStatus === 'C') return index <= 0 ? 'done' : 'cancelled';
    if (currentStatus === 'U') return index <= 0 ? 'done' : 'rejected';
    if (flagSendBack === 'Y' && index === 0) return 'current';
    if (flagSendBack === 'Y') return 'pending';

    if (currentStatus === 'F') {
      if (index === 0) return 'current';
      return 'pending';
    }

    if (currentStatus === 'P' || currentStatus === 'T') {
      if (index === 0) return 'done';
      if (index === 1) return 'current';
      return 'pending';
    }

    if (currentStatus === 'M') {
      if (index === 0) return 'done';
      if (index === 1) return 'done';
      if (index === 2) return 'current';
      return 'pending';
    }

    if (currentStatus === 'S') {
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

function getStatusThai(code) {
  const map = {
    'F': 'ยื่นคำขอ',
    'P': 'รอตรวจสอบเอกสาร',
    'T': 'ตรวจสอบความถูกต้อง',
    'M': 'หัวหน้าอนุมัติ',
    'S': 'ผ่านการตรวจสอบ',
    'B': 'ส่งกลับแก้ไข',
    'C': 'ยกเลิก',
    'U': 'ไม่อนุมัติ',
  };
  return map[code] || code;
}

function getApprovableSteps(role) {
  if (role === 'mgr') return ['หัวหน้าตรวจสอบ'];
  if (role === 'hr') return ['HR อนุมัติ'];
  return [];
}

module.exports = {
  STEPPER_STEPS,
  getStepperSteps,
  buildHistoryTimeline,
  getStatusThai,
  getApprovableSteps,
};
