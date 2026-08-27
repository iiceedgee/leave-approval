const bcrypt = require('bcryptjs');

// =====================================================
//  SupabaseStore — ที่เก็บข้อมูลจริงใน Supabase (Postgres)
//  ⭐ ไฟล์นี้คือ "ตัวใหม่" ที่เพิ่งเขียนตอนเชื่อม Supabase
//
//  Method ชื่อเดียวกับ InMemoryStore ทุกตัว
//  → service จะเลือก db ตัวไหนก็ได้ โดย logic ไม่เปลี่ยน
//
//  ใช้ `supabase.from('users')...` โดยตรง ไม่มี repository layer
//  (Minimal scope — ตัด repository ออกเพื่อให้เข้าใจง่าย)
// =====================================================

class SupabaseStore {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.auditLogs = []; // audit log ยังเป็น in-memory (ไว้ต่อเฟส 6)
  }

  // ---- Seed users (password: 123456) ใช้ตอนเริ่ม server ----
  // เหมือน seed ใน store.js แต่ครั้งนี้ลงตารางในคลาวด์จริง
  // เช็คก่อนว่าในตารางมี user แล้วหรือยัง (กัน insert ซ้ำทุกครั้งที่ boot)
  async seed() {
    const { data: existing } = await this.supabase.from('users').select('id').limit(1);
    if (existing && existing.length > 0) {
      console.log('[DB] Supabase: users already exist, skip seed');
      return;
    }

    const hash = await bcrypt.hash('123456', 10);
    const users = [
      { username: 'emp01', password_hash: hash, full_name: 'สมชาย ใจดี', role: 'emp', department: 'ฝ่ายผลิต', status: 'Y' },
      { username: 'emp02', password_hash: hash, full_name: 'สมหญิง รักดี', role: 'emp', department: 'ฝ่ายผลิต', status: 'Y' },
      { username: 'mgr01', password_hash: hash, full_name: 'มานะ ขยัน', role: 'mgr', department: 'ฝ่ายผลิต', status: 'Y' },
      { username: 'hr01', password_hash: hash, full_name: 'กรรณิการ์ งานดี', role: 'hr', department: 'ฝ่ายทรัพยากรบุคคล', status: 'Y' },
    ];

    const { error } = await this.supabase.from('users').insert(users);
    if (error) console.error('[DB] Seed error:', error.message);
    else console.log('[DB] Supabase seed users: emp01, emp02, mgr01, hr01');
  }

  async getCounts() {
    const { count: users, error: uErr } = await this.supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: leaves, error: lErr } = await this.supabase.from('leave_requests').select('*', { count: 'exact', head: true });
    if (uErr) { console.error('[DB] getCounts error:', JSON.stringify(uErr, null, 2)); const e=new Error(uErr.message); e.code=uErr.code; e.details=uErr.details; e.hint=uErr.hint; throw e; }
    if (lErr) { console.error('[DB] getCounts error:', JSON.stringify(lErr, null, 2)); const e=new Error(lErr.message); e.code=lErr.code; e.details=lErr.details; e.hint=lErr.hint; throw e; }
    return { users, leaves };
  }

  // ---- users ----
  // เหมือน this.users.find(...) ใน InMemoryStore
  // แต่ query ไปที่ตาราง users ใน Supabase จริง
  // maybeSingle = ขอแค่ 1 แถว (ถ้าไม่เจอได้ null)
  async findUserByUsername(username) {
    const { data, error } = await this.supabase.from('users').select('*').eq('username', username).maybeSingle();
    if (error) { console.error('[DB] findUserByUsername error:', JSON.stringify(error, null, 2)); const e=new Error(error.message); e.code=error.code; e.details=error.details; e.hint=error.hint; throw e; }
    return data || null;
  }

  async findUserById(id) {
    const { data, error } = await this.supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('[DB] findUserById', error); throw error; }
    return data || null;
  }

  async listUsers() {
    const { data } = await this.supabase.from('users').select('*');
    return data || [];
  }

  async createUser(data) {
    const { data: user, error } = await this.supabase
      .from('users')
      .insert({ ...data })
      .select()
      .single();
    if (error) throw error;
    return user;
  }

  async _nextRequestNo() {
    const year = new Date().getFullYear();
    const prefix = `LV-${year}-`;
    try {
      const { data, error } = await this.supabase.from('leave_requests').select('request_no').like('request_no', `${prefix}%`).order('request_no', { ascending: false }).limit(1);
      if (!error && data && data.length > 0 && data[0].request_no) {
        const m = data[0].request_no.match(/-(\d+)$/);
        if (m) return `${prefix}${String(parseInt(m[1], 10) + 1).padStart(4, '0')}`;
      }
    } catch {}
    // Fallback: นับจำนวนแถวปีนี้ +1
    try {
      const { count } = await this.supabase.from('leave_requests').select('*', { count: 'exact', head: true }).like('request_no', `${prefix}%`);
      return `${prefix}${String((count || 0) + 1).padStart(4, '0')}`;
    } catch {
      return `${prefix}0001`;
    }
  }

  // ---- leaves ----
  // insert + .select().single() = ส่งเข้าแล้วขอข้อมูลที่ insert กลับมา
  // (id, created_at ฯลฯ ที่ database สร้างให้)
  async createLeave(data) {
    // Enforce defaults + whitelist — กัน client ส่ง current_status ผิดๆ มาทับ และกัน DB default ผิด (F) ของ prod เก่า
    // ถ้ายังไม่มี request_no ให้ gen แบบรันไม่ซ้ำ LV-YYYY-XXXX
    if (!data.request_no) {
      try { data.request_no = await this._nextRequestNo(); } catch {}
    }
    const payload = {
      current_status: 'SU',
      flag_send_back: 'N',
      send_back_count: 0,
      ...data,
    };
    // ถ้า client ส่ง SU/DC ฯลฯ มาให้ใช้ตามนั้น แต่ถ้าส่ง F หรือค่าผิดให้ fallback SU
    const allowed = ['SU','DC','MA','AP','SB','CX','RJ'];
    if (!allowed.includes(payload.current_status)) payload.current_status = 'SU';
    // รองรับ prod เก่าที่ default เป็น F — ถ้า payload มี F ให้แก้เป็น SU ก่อน insert
    if (payload.current_status === 'F') payload.current_status = 'SU';
    // Retry 3 ครั้งกรณีเลขซ้ำ (unique violation) จาก concurrent
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: leave, error } = await this.supabase
        .from('leave_requests')
        .insert(payload)
        .select()
        .single();
      if (!error) {
        if (leave && leave.current_status === 'F') {
          console.warn('[DB] createLeave returned F — auto patch to SU', leave.id);
          const patched = await this.updateLeave(leave.id, { current_status: 'SU' });
          return patched || { ...leave, current_status: 'SU' };
        }
        return leave;
      }
      // ถ้า error เพราะ request_no ซ้ำ (code 23505) ให้ gen ใหม่แล้วลองใหม่
      if (error.code === '23505' && String(error.message).includes('request_no')) {
        console.warn('[DB] request_no duplicate, retry', payload.request_no);
        payload.request_no = await this._nextRequestNo();
        continue;
      }
      // ถ้า error เพราะคอลัมน์ request_no ยังไม่มี (DB ยังไม่ migration) ให้ลองแบบไม่มี request_no
      if (error.code === '42703' || String(error.message).includes('request_no')) {
        console.warn('[DB] request_no column missing, fallback insert without it');
        delete payload.request_no;
        const { data: leave2, error: err2 } = await this.supabase.from('leave_requests').insert(payload).select().single();
        if (!err2) return leave2;
        console.error('[DB] createLeave error:', JSON.stringify(error, null, 2)); const e=new Error(err2.message); e.code=err2.code; e.details=err2.details; e.hint=err2.hint; throw e;
      }
      console.error('[DB] createLeave error:', JSON.stringify(error, null, 2)); const e=new Error(error.message); e.code=error.code; e.details=error.details; e.hint=error.hint; throw e;
    }
    throw new Error('ไม่สามารถสร้างเลขที่คำขอได้ กรุณาลองใหม่');
  }

  _normalizeLeave(leave) {
    if (!leave) return leave;
    if (leave.current_status === 'F') return { ...leave, current_status: 'SU' };
    return leave;
  }

  async getLeaveById(id) {
    const { data, error } = await this.supabase.from('leave_requests').select('*').eq('id', id).maybeSingle();
    if (error) { console.error('[DB] getLeaveById', error); throw error; }
    return this._normalizeLeave(data) || null;
  }

  async listLeaves() {
    const { data } = await this.supabase.from('leave_requests').select('*');
    return (data || []).map(l => this._normalizeLeave(l));
  }

  async updateLeave(id, fields) {
    const { data: leave, error } = await this.supabase
      .from('leave_requests')
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return leave;
  }

  // ---- history ----
  async addHistory(data) {
    const { data: item, error } = await this.supabase
      .from('leave_status_history')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return item;
  }

  async listHistoryByLeave(leaveId) {
    const { data } = await this.supabase
      .from('leave_status_history')
      .select('*')
      .eq('leave_request_id', leaveId)
      .order('created_at', { ascending: true });
    return data || [];
  }

  // ---- documents ----
  // ตาราง documents ใช้ is_deleted = 'Y'/'N' (อักขระ)
  // แต่ใน memory ใช้ true/false → ต้องแปลงให้ตรงกันตอนส่งออก
  async createDocument(data) {
    const { data: doc, error } = await this.supabase
      .from('documents')
      .insert({ ...data, is_deleted: 'N' })
      .select()
      .single();
    if (error) throw error;
    return { ...doc, is_deleted: doc.is_deleted === 'Y' };
  }

  async listDocumentsByLeave(leaveId) {
    const { data } = await this.supabase
      .from('documents')
      .select('*')
      .eq('leave_request_id', leaveId)
      .eq('is_deleted', 'N')
      .order('created_at', { ascending: true });
    return (data || []).map(d => ({ ...d, is_deleted: d.is_deleted === 'Y' }));
  }

  async findDocument(leaveId, fileId) {
    const { data } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', fileId)
      .eq('leave_request_id', leaveId)
      .maybeSingle();
    if (!data || data.is_deleted === 'Y') return null;
    return { ...data, is_deleted: false };
  }

  async softDeleteDocument(fileId) {
    const { data: doc, error } = await this.supabase
      .from('documents')
      .update({ is_deleted: 'Y' })
      .eq('id', fileId)
      .select()
      .single();
    if (error) throw error;
    return { ...doc, is_deleted: true };
  }

  // ---- verifications ----
  async addVerification(data) {
    const { data: item, error } = await this.supabase
      .from('document_verifications')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return item;
  }

  async listVerificationsByLeave(leaveId) {
    const { data } = await this.supabase
      .from('document_verifications')
      .select('*')
      .eq('leave_request_id', leaveId)
      .order('created_at', { ascending: true });
    return data || [];
  }
}

module.exports = { SupabaseStore };