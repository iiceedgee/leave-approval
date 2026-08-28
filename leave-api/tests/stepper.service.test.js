// =====================================================
//  Unit Test สำหรับ Stepper Service — ย่อเหลือ 4 ขั้น (VC ถูกรวมเข้ากับ DC)
//
//  Stepper มี 4 ขั้น (Flow ใหม่: HR ตรวจ 1 ด่าน):
//  1. ยื่นคำขอ (SU)
//  2. ตรวจสอบเอกสาร (DC) — HR (รวม VC)
//  3. หัวหน้าอนุมัติ (MA) — MGR
//  4. เสร็จสิ้น (AP)
//
//  แต่ละขั้นมี state: current | done | pending | cancelled | rejected
// =====================================================

const {
  getStepperSteps,
  buildHistoryTimeline,
  getStatusThai,
} = require('../src/services/stepper.service');

describe('getStepperSteps — สถานะ SU (ยื่นคำขอ)', () => {
  it('SU → step 1 = current, ที่เหลือ = pending (4 ขั้น)', () => {
    const steps = getStepperSteps('SU', 'N', []);

    expect(steps.length).toBe(4);
    expect(steps[0].state).toBe('current'); // ยื่นคำขอ
    expect(steps[1].state).toBe('pending'); // ตรวจสอบเอกสาร
    expect(steps[2].state).toBe('pending'); // หัวหน้าอนุมัติ
    expect(steps[3].state).toBe('pending'); // เสร็จสิ้น
  });

  it('SU + flag_send_back=Y → step 1 = current', () => {
    const steps = getStepperSteps('SU', 'Y', []);

    expect(steps[0].state).toBe('current');
    expect(steps[1].state).toBe('pending');
  });
});

describe('getStepperSteps — สถานะ DC (รอตรวจสอบเอกสาร)', () => {
  it('DC → step 1 = done, step 2 = current', () => {
    const steps = getStepperSteps('DC', 'N', []);

    expect(steps.length).toBe(4);
    expect(steps[0].state).toBe('done');    // ยื่นคำขอ
    expect(steps[1].state).toBe('current'); // ตรวจสอบเอกสาร
    expect(steps[2].state).toBe('pending'); // หัวหน้าอนุมัติ
    expect(steps[3].state).toBe('pending'); // เสร็จสิ้น
  });
});

describe('getStepperSteps — สถานะ VC (legacy — ถูกรวมเข้ากับ DC)', () => {
  it('VC (legacy) → ควรทำเหมือน DC: step 1 = done, step 2 = current', () => {
    const steps = getStepperSteps('VC', 'N', []);

    expect(steps.length).toBe(4);
    expect(steps[0].state).toBe('done');    // ยื่นคำขอ
    expect(steps[1].state).toBe('current'); // ตรวจสอบเอกสาร (VC legacy -> DC)
    expect(steps[2].state).toBe('pending');
    expect(steps[3].state).toBe('pending');
  });
});

describe('getStepperSteps — สถานะ MA (รอหัวหน้าอนุมัติ)', () => {
  it('MA → step 1-2 = done, step 3 = current', () => {
    const steps = getStepperSteps('MA', 'N', []);

    expect(steps.length).toBe(4);
    expect(steps[0].state).toBe('done');    // ยื่นคำขอ
    expect(steps[1].state).toBe('done');    // ตรวจสอบเอกสาร
    expect(steps[2].state).toBe('current'); // หัวหน้าอนุมัติ
    expect(steps[3].state).toBe('pending'); // เสร็จสิ้น
  });
});

describe('getStepperSteps — สถานะ AP (อนุมัติแล้ว)', () => {
  it('AP → 4 ขั้น = done ทั้งหมด', () => {
    const history = [
      { status_code: 'SU', action_by_name: 'สมชาย', created_at: '2026-07-27' },
      { status_code: 'AP', action_by_name: 'สมชาย', created_at: '2026-07-28' },
    ];
    const steps = getStepperSteps('AP', 'N', history);

    expect(steps.length).toBe(4);
    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('done');
    expect(steps[2].state).toBe('done');
    expect(steps[3].state).toBe('done');
  });
});

describe('getStepperSteps — สถานะ CX (ยกเลิก) — polymorphic final', () => {
  it('CX (empty history) → only final = cancelled, first = done (fallback)', () => {
    const steps = getStepperSteps('CX', 'N', []);
    expect(steps.length).toBe(4);
    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('pending');
    expect(steps[2].state).toBe('pending');
    expect(steps[3].state).toBe('cancelled');
    expect(steps[3].name).toBe('ยกเลิก');
  });
  it('CX at SU (history SU) → [done, pending, pending, cancelled]', () => {
    const history = [{ status_code: 'SU' }];
    const steps = getStepperSteps('CX', 'N', history);
    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('pending');
    expect(steps[2].state).toBe('pending');
    expect(steps[3].state).toBe('cancelled');
  });
});

describe('getStepperSteps — สถานะ RJ (ไม่อนุมัติ) — polymorphic final', () => {
  it('RJ (empty history fallback) → only final = rejected', () => {
    const steps = getStepperSteps('RJ', 'N', []);
    expect(steps.length).toBe(4);
    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('pending');
    expect(steps[2].state).toBe('pending');
    expect(steps[3].state).toBe('rejected');
    expect(steps[3].name).toBe('ไม่อนุมัติ');
    expect(steps[3].icon).toBe('fa-solid fa-circle-xmark');
  });
  it('RJ at DC → history SU,DC → [done,done,pending,rejected]', () => {
    const history = [{ status_code: 'SU' }, { status_code: 'DC' }];
    const steps = getStepperSteps('RJ', 'N', history);
    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('done');
    expect(steps[2].state).toBe('pending');
    expect(steps[3].state).toBe('rejected');
  });
  it('RJ at MA → history SU,DC,MA → [done,done,done,rejected]', () => {
    const history = [{ status_code: 'SU' }, { status_code: 'DC' }, { status_code: 'MA' }];
    const steps = getStepperSteps('RJ', 'N', history);
    expect(steps[0].state).toBe('done');
    expect(steps[1].state).toBe('done');
    expect(steps[2].state).toBe('done');
    expect(steps[3].state).toBe('rejected');
  });
});

describe('buildHistoryTimeline — polymorphic terminal', () => {
  it('ไม่มี history → ได้ 1 รายการ state=current ชื่อ "รอดำเนินการ"', () => {
    const timeline = buildHistoryTimeline([]);

    expect(timeline.length).toBe(1);
    expect(timeline[0].state).toBe('current');
    expect(timeline[0].name).toBe('รอดำเนินการ');
  });

  it('มี 2 history → อันแรก done, อันหลัง current', () => {
    const history = [
      { status_code: 'SU', action_by_name: 'สมชาย', action_role: 'emp', remark: 'ยื่นคำขอ', created_at: '2026-07-27' },
      { status_code: 'DC', action_by_name: 'สมชาย', action_role: 'emp', remark: 'อัปโหลดเอกสาร', created_at: '2026-07-28' },
    ];

    const timeline = buildHistoryTimeline(history);

    expect(timeline.length).toBe(2);
    expect(timeline[0].state).toBe('done');
    expect(timeline[1].state).toBe('current');
    expect(timeline[1].actionBy).toBe('สมชาย');
  });

  it('remark ว่าง → ไม่มี ": " ต่อท้าย', () => {
    const history = [
      { status_code: 'SU', action_by_name: 'สมชาย', action_role: 'emp', remark: '', created_at: '2026-07-27' },
    ];

    const timeline = buildHistoryTimeline(history);

    expect(timeline[0].name).toBe('ยื่นคำขอ');
  });

  it('RJ → state rejected (timeline dot แดง)', () => {
    const history = [
      { status_code: 'SU', action_by_name: 'สมชาย', action_role: 'emp', remark: 'ยื่นคำขอ', created_at: '2026-07-27' },
      { status_code: 'RJ', action_by_name: 'มานะ', action_role: 'mgr', remark: 'เอกสารไม่ครบ', created_at: '2026-07-28' },
    ];
    const timeline = buildHistoryTimeline(history);
    expect(timeline[1].state).toBe('rejected');
    expect(timeline[1].name).toBe('ไม่อนุมัติ: เอกสารไม่ครบ');
  });

  it('CX → state cancelled', () => {
    const history = [{ status_code: 'CX', action_by_name: 'สมชาย', action_role: 'emp', remark: 'ยกเลิก', created_at: '2026-07-27' }];
    const timeline = buildHistoryTimeline(history);
    expect(timeline[0].state).toBe('cancelled');
  });
});

describe('getStatusThai', () => {
  it('SU → "ยื่นคำขอ"', () => {
    expect(getStatusThai('SU')).toBe('ยื่นคำขอ');
  });

  it('AP → "อนุมัติแล้ว"', () => {
    expect(getStatusThai('AP')).toBe('อนุมัติแล้ว');
  });

  it('CX → "ยกเลิก"', () => {
    expect(getStatusThai('CX')).toBe('ยกเลิก');
  });

  it('RJ → "ไม่อนุมัติ"', () => {
    expect(getStatusThai('RJ')).toBe('ไม่อนุมัติ');
  });

  it('SB → "ส่งกลับแก้ไข"', () => {
    expect(getStatusThai('SB')).toBe('ส่งกลับแก้ไข');
  });

  it('รหัสที่ไม่รู้จัก → คืนค่ารหัสเดิม', () => {
    expect(getStatusThai('X')).toBe('X');
  });
});
