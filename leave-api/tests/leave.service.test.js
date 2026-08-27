// =====================================================
//  Unit Test สำหรับ LeaveService — State Gate
//
//  สิ่งที่ test:
//  1. approve() — ต้อง status MA → AP, อย่างอื่น → error
//  2. sendBack() — ต้อง status DC/VC/MA → SU, อย่างอื่น → error
//  3. reject() — ต้อง status VC/MA → RJ, อย่างอื่น → error
//  4. cancel() — ต้อง status SU → CX, อย่างอื่น → error
//  5. calcLeaveDays() — คำนวณวันลา
//  6. Full workflow SU→DC→VC→MA→AP
//
//  หมายเหตุ: method ใน service เป็น async (เพราะ db อาจเป็น Supabase)
//  → ทุก test ต้อง await
// =====================================================

const LeaveService = require('../src/services/leave.service');
const { createMockStore } = require('./helpers/mock-store');

// ---- Helper: สร้าง leave ง่ายๆ สำหรับ test ----
async function createLeave(service) {
  return service.create(1, {
    leave_type: 'ลาป่วย',
    start_date: '2026-07-27',
    end_date: '2026-07-29',
    reason: 'ไม่สบาย',
  });
}

// ---- เริ่ม test ----
describe('LeaveService — approve', () => {
  let service;
  let db;

  // beforeEach = รันก่อนทุก test
  // สร้าง db mock + service ใหม่ทุกครั้ง
  // ป้องกันข้อมูลจาก test ก่อนหน้ามาปน
  beforeEach(async () => {
    db = await createMockStore();
    service = new LeaveService(db);
  });

  it('approve: status MA → ควรผ่าน → ได้ AP', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'MA'; // จำลองว่าผ่าน pretemp+temp แล้ว

    const result = await service.approve(leave.id, 1, 'mgr', 'เอกสารครบ');

    expect(result.current_status).toBe('AP');
  });

  it('approve: status SU → ควร fail → ได้ error', async () => {
    const leave = await createLeave(service);
    // leave.current_status === 'SU' (default ตอนสร้าง)

    const result = await service.approve(leave.id, 1, 'mgr', '');

    expect(result.error).toBeTruthy();
    expect(result.error).toContain('ไม่สามารถอนุมัติ');
  });

  it('approve: status DC → ควร fail → ได้ error', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'DC';

    const result = await service.approve(leave.id, 1, 'mgr', '');

    expect(result.error).toBeTruthy();
  });

  it('approve: status VC → ควร fail → ได้ error', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'VC';

    const result = await service.approve(leave.id, 1, 'mgr', '');

    expect(result.error).toBeTruthy();
  });

  it('approve: ไม่พบคำขอ → ได้ error', async () => {
    const result = await service.approve('no-such-id', 1, 'mgr', '');

    expect(result.error).toContain('ไม่พบคำขอ');
  });
});

describe('LeaveService — sendBack', () => {
  let service;
  let db;

  beforeEach(async () => {
    db = await createMockStore();
    service = new LeaveService(db);
  });

  it('sendBack: status DC → ควรผ่าน → ได้ SU + flag_send_back=Y', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'DC';

    const result = await service.sendBack(leave.id, 1, 'mgr', 'เอกสารไม่ครบ');

    expect(result.current_status).toBe('SU');
    expect(result.flag_send_back).toBe('Y');
  });

  it('sendBack: status VC → ควรผ่าน', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'VC';

    const result = await service.sendBack(leave.id, 1, 'mgr', 'ข้อมูลไม่ถูกต้อง');

    expect(result.current_status).toBe('SU');
  });

  it('sendBack: status MA → ควรผ่าน', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'MA';

    const result = await service.sendBack(leave.id, 1, 'mgr', 'ต้องแก้ไข');

    expect(result.current_status).toBe('SU');
  });

  it('sendBack: status SU → ควร fail → ได้ error', async () => {
    const leave = await createLeave(service);
    // leave.current_status === 'SU'

    const result = await service.sendBack(leave.id, 1, 'mgr', '');

    expect(result.error).toBeTruthy();
  });

  it('sendBack: status AP → ควร fail', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'AP';

    const result = await service.sendBack(leave.id, 1, 'mgr', '');

    expect(result.error).toBeTruthy();
  });
});

describe('LeaveService — reject', () => {
  let service;
  let db;

  beforeEach(async () => {
    db = await createMockStore();
    service = new LeaveService(db);
  });

  it('reject: status VC → ควรผ่าน → ได้ RJ', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'VC';

    const result = await service.reject(leave.id, 1, 'mgr', 'ข้อมูลไม่ถูกต้อง');

    expect(result.current_status).toBe('RJ');
  });

  it('reject: status MA → ควรผ่าน → ได้ RJ', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'MA';

    const result = await service.reject(leave.id, 1, 'mgr', 'ไม่อนุมัติ');

    expect(result.current_status).toBe('RJ');
  });

  it('reject: status SU → ควร fail', async () => {
    const leave = await createLeave(service);

    const result = await service.reject(leave.id, 1, 'mgr', '');

    expect(result.error).toBeTruthy();
  });

  it('reject: status DC → ควร fail', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'DC';

    const result = await service.reject(leave.id, 1, 'mgr', '');

    expect(result.error).toBeTruthy();
  });
});

describe('LeaveService — cancel', () => {
  let service;
  let db;

  beforeEach(async () => {
    db = await createMockStore();
    service = new LeaveService(db);
  });

  it('cancel: status SU → ควรผ่าน → ได้ CX', async () => {
    const leave = await createLeave(service);
    // leave.current_status === 'SU'

    const result = await service.cancel(leave.id, 1, 'emp', 'เปลี่ยนแผน');

    expect(result.current_status).toBe('CX');
  });

  it('cancel: status MA → ควร fail', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'MA';

    const result = await service.cancel(leave.id, 1, 'emp', '');

    expect(result.error).toBeTruthy();
  });

  it('cancel: status DC → ควร fail', async () => {
    const leave = await createLeave(service);
    leave.current_status = 'DC';

    const result = await service.cancel(leave.id, 1, 'emp', '');

    expect(result.error).toBeTruthy();
  });
});

describe('calcLeaveDays', () => {
  it('วันเดียวกัน (29-29) → ควรได้ 1', () => {
    expect(LeaveService.calcLeaveDays('2026-07-29', '2026-07-29')).toBe(1);
  });

  it('27-29 ก.ค. → ควรได้ 3 (รวมหัวท้าย)', () => {
    expect(LeaveService.calcLeaveDays('2026-07-27', '2026-07-29')).toBe(3);
  });

  it('ข้ามเดือน 30 ก.ค. - 1 ส.ค. → ควรได้ 3', () => {
    expect(LeaveService.calcLeaveDays('2026-07-30', '2026-08-01')).toBe(3);
  });

  it('ข้ามปี 30 ธ.ค. - 2 ม.ค. → ควรได้ 4', () => {
    expect(LeaveService.calcLeaveDays('2026-12-30', '2027-01-02')).toBe(4);
  });
});

describe('Full Workflow — SU → DC → VC → MA → AP', () => {
  let service;
  let db;

  beforeEach(async () => {
    db = await createMockStore();
    service = new LeaveService(db);
  });

  it('สร้าง → SU → DC → VC → MA → AP: approve ต้อง fail จนกว่าถึง MA', async () => {
    const leave = await createLeave(service);

    // สร้าง → status SU
    expect(leave.current_status).toBe('SU');

    // SU → approve ไม่ได้
    expect((await service.approve(leave.id, 1, 'mgr', '')).error).toBeTruthy();

    // อัปโหลดเอกสาร → status DC
    leave.current_status = 'DC';
    expect((await service.approve(leave.id, 1, 'mgr', '')).error).toBeTruthy();

    // Pretemp Pass → status VC
    leave.current_status = 'VC';
    expect((await service.approve(leave.id, 1, 'mgr', '')).error).toBeTruthy();

    // Temp Pass → status MA
    leave.current_status = 'MA';
    // MA → approve ได้!
    const result = await service.approve(leave.id, 1, 'mgr', 'อนุมัติ');
    expect(result.current_status).toBe('AP');
  });
});