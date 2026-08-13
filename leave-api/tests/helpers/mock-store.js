// =====================================================
//  Mock DB — ใช้สำหรับ Unit Test โดยเฉพาะ
//
//  ทำไมต้องมี?
//  ใช้ InMemoryStore (ที่ไม่มี network จริง) เป็น db ใน test
//  ถ้าเทียบกับของจริง (Supabase) ก็เรียกว่า "mock"
//  เพราะไม่ต้องเชื่อม database จริง ๆ
//
//  วิธีใช้:
//  const { createMockStore } = require('./helpers/mock-store');
//  const db = await createMockStore();
//  const service = new LeaveService(db);
// =====================================================

const bcrypt = require('bcryptjs');
const { InMemoryStore } = require('../../src/store');

async function createMockStore() {
  const db = new InMemoryStore();

  // Seed users ให้ครบตามที่ service ใช้ (id, role, department)
  // password จริง: 123456 (สำหรับ login test)
  const hash = await bcrypt.hash('123456', 10);
  db.users.push(
    {
      id: db._uuid(), username: 'emp01', password_hash: hash, full_name: 'สมชาย ใจดี',
      role: 'emp', department: 'ฝ่ายผลิต', status: 'Y',
    },
    {
      id: db._uuid(), username: 'emp02', password_hash: hash, full_name: 'สมหญิง รักดี',
      role: 'emp', department: 'ฝ่ายผลิต', status: 'Y',
    },
    {
      id: db._uuid(), username: 'mgr01', password_hash: hash, full_name: 'มานะ ขยัน',
      role: 'mgr', department: 'ฝ่ายผลิต', status: 'Y',
    },
    {
      id: db._uuid(), username: 'hr01', password_hash: hash, full_name: 'กรรณิการ์ งานดี',
      role: 'hr', department: 'ฝ่ายทรัพยากรบุคคล', status: 'Y',
    },
  );

  return db;
}

module.exports = { createMockStore };