const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// =====================================================
//  ⚠️ BEFORE — โค้ดเดิมของระบบ (ตอนยังไม่มี database)
//
//  ตอนแรกโปรเจกต์นี้เก็บข้อมูลใน "หน่วยความจำเครื่อง" (in-memory)
//  ง่ายๆ แบบนี้ก่อน คือข้อมูลจะหายทุกครั้งที่ restart server
//  ต่อมาถึงเพิ่ม Supabase (Postgres บนคลาวด์) เข้ามา
//
//  ตัวนี้คือ InMemoryStore — เก็บข้อมูลใน memory
//  ทำไมยังมีอยู่? เพราะใช้เป็น "สำรอง" (fallback) เมื่อไม่มี Supabase
//  - ตอน develop / test ยังไม่อยากพึ่ง database จริง
//  - method ทั้งหมดมีชื่อเดียวกันกับ SupabaseStore
//    → เปลี่ยนได้แค่บรรทัดเดียวตอนสร้าง db ใน app.js
//  - ทุก method เป็น async เหมือนของจริง (simulate network)
// =====================================================

class InMemoryStore {
  constructor() {
    // arrays ข้างล่างนี้ = เหมือน "ตาราง" ใน database แต่เป็นในเครื่อง
    // ตอนมี Supabase ข้อมูลพวกนี้จะไปอยู่ตารางจริงในคลาวด์แทน
    this.users = [];
    this.leaves = [];
    this.history = [];
    this.documents = [];
    this.verifications = [];
    this.auditLogs = []; // audit log ยังเก็บใน memory (ไว้ต่อเฟสหลัง)
  }

  _uuid() {
    return crypto.randomUUID();
  }

  // ---- Seed users (password: 123456) ----
  async seed() {
    const hash = await bcrypt.hash('123456', 10);
    this.users.push(
      { id: this._uuid(), username: 'emp01', password_hash: hash, full_name: 'สมชาย ใจดี', role: 'emp', department: 'ฝ่ายผลิต', status: 'Y' },
      { id: this._uuid(), username: 'emp02', password_hash: hash, full_name: 'สมหญิง รักดี', role: 'emp', department: 'ฝ่ายผลิต', status: 'Y' },
      { id: this._uuid(), username: 'mgr01', password_hash: hash, full_name: 'มานะ ขยัน', role: 'mgr', department: 'ฝ่ายผลิต', status: 'Y' },
      { id: this._uuid(), username: 'hr01', password_hash: hash, full_name: 'กรรณิการ์ งานดี', role: 'hr', department: 'ฝ่ายทรัพยากรบุคคล', status: 'Y' }
    );
    console.log('[DB] Seed in-memory users: emp01, emp02, mgr01, hr01');
  }

  async getCounts() {
    return { users: this.users.length, leaves: this.leaves.length };
  }

  // ---- users ----
  async findUserByUsername(username) {
    return this.users.find(u => u.username === username) || null;
  }

  async findUserById(id) {
    return this.users.find(u => u.id === id) || null;
  }

  async listUsers() {
    return this.users;
  }

  async createUser(data) {
    const user = { id: this._uuid(), created_at: new Date().toISOString(), ...data };
    this.users.push(user);
    return user;
  }

  // ---- leaves ----
  async createLeave(data) {
    const leave = {
      id: this._uuid(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_status: 'F',
      flag_send_back: 'N',
      send_back_count: 0,
      ...data,
    };
    this.leaves.push(leave);
    return leave;
  }

  async getLeaveById(id) {
    return this.leaves.find(l => l.id === id) || null;
  }

  async listLeaves() {
    return this.leaves;
  }

  async updateLeave(id, fields) {
    const leave = this.leaves.find(l => l.id === id);
    if (!leave) return null;
    Object.assign(leave, fields);
    return leave;
  }

  // ---- history ----
  async addHistory(data) {
    const item = { id: this._uuid(), created_at: new Date().toISOString(), ...data };
    this.history.push(item);
    return item;
  }

  async listHistoryByLeave(leaveId) {
    return this.history.filter(h => h.leave_request_id === leaveId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  // ---- documents ----
  async createDocument(data) {
    const doc = { id: this._uuid(), created_at: new Date().toISOString(), is_deleted: false, ...data };
    this.documents.push(doc);
    return doc;
  }

  async listDocumentsByLeave(leaveId) {
    return this.documents.filter(d => d.leave_request_id === leaveId && !d.is_deleted);
  }

  async findDocument(leaveId, fileId) {
    const doc = this.documents.find(d => d.id === fileId && d.leave_request_id === leaveId);
    if (!doc || doc.is_deleted) return null;
    return doc;
  }

  async softDeleteDocument(fileId) {
    const doc = this.documents.find(d => d.id === fileId);
    if (!doc) return null;
    doc.is_deleted = true;
    return doc;
  }

  // ---- verifications ----
  async addVerification(data) {
    const item = { id: this._uuid(), created_at: new Date().toISOString(), ...data };
    this.verifications.push(item);
    return item;
  }

  async listVerificationsByLeave(leaveId) {
    return this.verifications
      .filter(v => v.leave_request_id === leaveId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
}

module.exports = { InMemoryStore };