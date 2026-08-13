// =====================================================
//  Unit Test สำหรับ AuthService — Security Fix
//
//  วัตถุประสงค์: ตรวจว่า fix "register loophole" ทำงาน
//  - พนักงานสมัครเป็น emp ได้
//  - พยายามสมัครเป็น mgr/hr เอง → ต้อง error
// =====================================================

const AuthService = require('../src/services/auth.service');
const { createMockStore } = require('./helpers/mock-store');

// Jest ไม่โหลด .env ให้ → เซ็ต JWT_SECRET ไว้ใน test เอง
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

describe('AuthService — register (security fix)', () => {
  let db;
  let service;

  beforeEach(async () => {
    db = await createMockStore();
    service = new AuthService(db);
  });

  it('สมัครเป็น emp (role ถูกต้อง) → ควรผ่าน', async () => {
    const user = await service.register({
      username: 'emp99',
      password: '123456',
      fullName: 'พนักงานใหม่',
      role: 'emp',
      department: 'ฝ่ายผลิต',
    });

    expect(user.role).toBe('emp');
    expect(user.username).toBe('emp99');
    // ไม่ควร leak password_hash กลับมา
    expect(user.password_hash).toBeUndefined();
  });

  it('พยายามสมัครเป็น mgr → ควร error (ปิด loophole)', async () => {
    await expect(
      service.register({
        username: 'fake_mgr',
        password: '123456',
        fullName: 'มิจฉาชีพ',
        role: 'mgr',
      })
    ).rejects.toThrow('ไม่สามารถสมัครเป็น mgr ได้');
  });

  it('พยายามสมัครเป็น hr → ควร error (ปิด loophole)', async () => {
    await expect(
      service.register({
        username: 'fake_hr',
        password: '123456',
        fullName: 'มิจฉาชีพ',
        role: 'hr',
      })
    ).rejects.toThrow('ไม่สามารถสมัครเป็น hr ได้');
  });

  it('username ซ้ำ → ควร error', async () => {
    await service.register({
      username: 'emp99',
      password: '123456',
      fullName: 'คนเดิม',
      role: 'emp',
    });

    await expect(
      service.register({
        username: 'emp99',
        password: '123456',
        fullName: 'คนใหม่',
        role: 'emp',
      })
    ).rejects.toThrow('username นี้มีอยู่แล้ว');
  });

  it('login ถูกต้อง → ควรได้ token', async () => {
    const result = await service.login('emp01', '123456');

    expect(result.token).toBeTruthy();
    expect(result.user.username).toBe('emp01');
  });

  it('login password ผิด → ควร error', async () => {
    await expect(service.login('emp01', 'wrong-pass')).rejects.toThrow('username หรือ password ไม่ถูกต้อง');
  });
});