const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  constructor(db) {
    // ⚠️ เดิม: constructor(store) + this.store = store (array ในเครื่อง)
    // เพื่อเชื่อม Supabase จึงเปลี่ยนชื่อเป็น "db" ที่รองรับ 2 แบบ:
    //  - InMemoryStore  (ข้อมูลในเครื่อง — fallback/test)
    //  - SupabaseStore  (ข้อมูลใน Supabase — จริง)
    this.db = db;
  }

  async register({ username, password, fullName, role, department }) {
    if (role && role !== 'emp') {
      throw new Error('ไม่สามารถสมัครเป็น ' + role + ' ได้ กรุณาติดต่อ HR');
    }
    if (!username || typeof username !== 'string' || username.trim().length < 3) throw new Error('username ต้องมีอย่างน้อย 3 ตัวอักษร');
    if (!password || typeof password !== 'string' || password.length < 6) throw new Error('password ต้องมีอย่างน้อย 6 ตัวอักษร');
    if (!department || typeof department !== 'string' || !department.trim()) throw new Error('กรุณาระบุแผนก');
    username = username.trim();
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) throw new Error('username ใช้ได้เฉพาะ a-z, 0-9, _ . -');
    const existing = await this.db.findUserByUsername(username);
    if (existing) throw new Error('username นี้มีอยู่แล้ว');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.db.createUser({
      username,
      password_hash: passwordHash,
      full_name: fullName || username,
      role: 'emp',
      department,
      status: 'Y',
    });

    return this.sanitize(user);
  }

  async login(username, password) {
    if (!username || !password) throw new Error('กรุณากรอก username และ password');
    if (typeof username !== 'string' || typeof password !== 'string') throw new Error('ข้อมูลไม่ถูกต้อง');
    const user = await this.db.findUserByUsername(username.trim());
    if (!user) throw new Error('username หรือ password ไม่ถูกต้อง');
    if (user.status !== 'Y') throw new Error('บัญชีนี้ถูกระงับ');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('username หรือ password ไม่ถูกต้อง');

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return { token, user: this.sanitize(user) };
  }

  sanitize(user) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      department: user.department,
    };
  }
}

module.exports = AuthService;