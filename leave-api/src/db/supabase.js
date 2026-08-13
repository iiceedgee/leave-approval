// =====================================================
//  supabaseClient — ตัว "เชื่อมต่อ" กับ Supabase จริง
//  ⭐ ไฟล์นี้เพิ่งถูก "เพิ่มเข้ามาใหม่" ตอนเชื่อม Supabase
//     (เดิมระบบมีแค่ store.js ตัวเดียว ไม่มีโฟลเดอร์ db/)
//
//  ╔═══════════════════════════════════════════════════╗
//  ║  BEFORE (โค้ดเดิม ตอนยังเป็น in-memory เท่านั้น)    ║
//  ╠═══════════════════════════════════════════════════╣
//  ║  const { createClient } = require('@supabase/supabase-js'); ║
//  ║  const supabaseUrl = process.env.SUPABASE_URL;              ║
//  ║  const supabaseKey = process.env.SUPABASE_ANON_KEY;         ║
//  ║  let supabase = null;                                       ║
//  ║  if (supabaseUrl && supabaseKey &&                          ║
//  ║      supabaseUrl !== 'http://localhost:54321') {            ║
//  ║    supabase = createClient(supabaseUrl, supabaseKey);       ║
//  ║    console.log('[DB] Connected to Supabase');               ║
//  ║  } else {                                                   ║
//  ║    console.log('[DB] Supabase not configured — using in-memory fallback'); ║
//  ║  }                                                          ║
//  ║  module.exports = supabase;                                 ║
//  ╚═══════════════════════════════════════════════════╝
//
//  AFTER (หลังเชื่อมจริง):
//   - ตั้งค่ายังเหมือนเดิม แต่เพิ่มเช็ค .env ให้ชัดว่า "ค่ามาจริงหรือปลอม"
//   - ผลลัพธ์: ถ้า .env มีค่า → client จริง → app.js เลือก SupabaseStore
//             ถ้าไม่มีค่า → null      → app.js เลือก InMemoryStore (fallback)
// =====================================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

// ★ ตรวจว่า .env มีค่าจริงครบ (URL) + (key) และไม่ใช่ค่า placeholder
const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseKey) &&
  supabaseUrl !== 'http://localhost:54321' &&
  !supabaseUrl.includes('YOUR_SUPABASE_URL');

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[DB] ✅ Connected to Supabase (Postgres)');
} else {
  console.log('[DB] ❌ Supabase not configured — using in-memory fallback');
}

module.exports = supabase;