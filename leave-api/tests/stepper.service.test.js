// =====================================================
//  Unit Test สำหรับ Stepper Service
//
//  Stepper มี 5 ขั้น:
//  1. ยื่นคำขอ (F)
//  2. ตรวจสอบเอกสาร (P)
//  3. หัวหน้าตรวจสอบ (M)
//  4. HR อนุมัติ (S)
//  5. เสร็จสิ้น (S)
//
//  แต่ละขั้นมี state: current | done | pending | cancelled | rejected
// =====================================================

const {
  getStepperSteps,
  buildHistoryTimeline,
  getStatusThai,
} = require('../src/services/stepper.service');

describe('getStepperSteps — สถานะ F (ยื่นคำขอ)', () => {
  it('F → step 1 = current, ที่เหลือ = pending', () => {
    const steps = getStepperSteps('F', 'N', []);

    expect(steps[0].state).toBe('current'); // ยื่นคำขอ
    expect(steps[1].state).toBe('pending'); // ตรวจสอบเอกสาร
    expect(steps[2].state).toBe('pending'); // หัวหน้าตรวจสอบ
    expect(steps[3].state).toBe('pending'); // HR อนุมัติ
    expect(steps[4].state).toBe('pending'); // เสร็จสิ้น
  });

  it('F + flag_send_back=Y → step 1 = current', () => {
    const steps = getStepperSteps('F', 'Y', []);

    expect(steps[0].state).toBe('current');
    expect(steps[1].state).toBe('pending');
  });
});

describe('getStepperSteps — สถานะ P (รอตรวจสอบเอกสาร)', () => {
  it('P → step 1 = done, step 2 = current', () => {
    const steps = getStepperSteps('P', 'N', []);

    expect(steps[0].state).toBe('done');    // ยื่นคำขอ
    expect(steps[1].state).toBe('current'); // ตรวจสอบเอกสาร
    expect(steps[2].state).toBe('pending');
  });
});

describe('getStepperSteps — สถานะ T (ตรวจสอบความถูกต้อง)', () => {
  it('T → step 1 = done, step 2 = current', () => {
    const steps = getStepperSteps('T', 'N', []);

    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('current');
  });
});

describe('getStepperSteps — สถานะ M (รอหัวหน้าอนุมัติ)', () => {
  it('M → step 1-2 = done, step 3 = current', () => {
    const steps = getStepperSteps('M', 'N', []);

    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('done');
    expect(steps[2].state).toBe('current'); // หัวหน้าตรวจสอบ
    expect(steps[3].state).toBe('pending');
    expect(steps[4].state).toBe('pending');
  });
});

describe('getStepperSteps — สถานะ S (อนุมัติแล้ว)', () => {
  it('S → step 1-3 = done, step 4-5 = done', () => {
    const history = [
      { status_code: 'F', action_by_name: 'สมชาย', created_at: '2026-07-27' },
      { status_code: 'S', action_by_name: 'สมชาย', created_at: '2026-07-28' },
    ];
    const steps = getStepperSteps('S', 'N', history);

    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('done');
    expect(steps[2].state).toBe('done');
    expect(steps[3].state).toBe('done');
    expect(steps[4].state).toBe('done');
  });
});

describe('getStepperSteps — สถานะ C (ยกเลิก)', () => {
  it('C → step 1 = done, ที่เหลือ = cancelled', () => {
    const steps = getStepperSteps('C', 'N', []);

    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('cancelled');
    expect(steps[2].state).toBe('cancelled');
    expect(steps[3].state).toBe('cancelled');
    expect(steps[4].state).toBe('cancelled');
  });
});

describe('getStepperSteps — สถานะ U (ไม่อนุมัติ)', () => {
  it('U → step 1 = done, ที่เหลือ = rejected', () => {
    const steps = getStepperSteps('U', 'N', []);

    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('rejected');
    expect(steps[2].state).toBe('rejected');
    expect(steps[3].state).toBe('rejected');
    expect(steps[4].state).toBe('rejected');
  });
});

describe('buildHistoryTimeline', () => {
  it('ไม่มี history → ได้ 1 รายการ state=current ชื่อ "รอดำเนินการ"', () => {
    const timeline = buildHistoryTimeline([]);

    expect(timeline.length).toBe(1);
    expect(timeline[0].state).toBe('current');
    expect(timeline[0].name).toBe('รอดำเนินการ');
  });

  it('มี 2 history → อันแรก done, อันหลัง current', () => {
    const history = [
      { status_code: 'F', action_by_name: 'สมชาย', action_role: 'emp', remark: 'ยื่นคำขอ', created_at: '2026-07-27' },
      { status_code: 'P', action_by_name: 'สมชาย', action_role: 'emp', remark: 'อัปโหลดเอกสาร', created_at: '2026-07-28' },
    ];

    const timeline = buildHistoryTimeline(history);

    expect(timeline.length).toBe(2);
    expect(timeline[0].state).toBe('done');
    expect(timeline[1].state).toBe('current');
    expect(timeline[1].actionBy).toBe('สมชาย');
  });

  it('remark ว่าง → ไม่มี ": " ต่อท้าย', () => {
    const history = [
      { status_code: 'F', action_by_name: 'สมชาย', action_role: 'emp', remark: '', created_at: '2026-07-27' },
    ];

    const timeline = buildHistoryTimeline(history);

    expect(timeline[0].name).toBe('ยื่นคำขอ');
  });
});

describe('getStatusThai', () => {
  it('F → "ยื่นคำขอ"', () => {
    expect(getStatusThai('F')).toBe('ยื่นคำขอ');
  });

  it('S → "ผ่านการตรวจสอบ"', () => {
    expect(getStatusThai('S')).toBe('ผ่านการตรวจสอบ');
  });

  it('C → "ยกเลิก"', () => {
    expect(getStatusThai('C')).toBe('ยกเลิก');
  });

  it('U → "ไม่อนุมัติ"', () => {
    expect(getStatusThai('U')).toBe('ไม่อนุมัติ');
  });

  it('B → "ส่งกลับแก้ไข"', () => {
    expect(getStatusThai('B')).toBe('ส่งกลับแก้ไข');
  });

  it('รหัสที่ไม่รู้จัก → คืนค่ารหัสเดิม', () => {
    expect(getStatusThai('X')).toBe('X');
  });
});
