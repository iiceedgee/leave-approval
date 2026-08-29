-- ============================================================
-- Migration: เพิ่ม index ให้ ORDER BY updated_at DESC เร็วขึ้น
-- ใช้แก้ "ยื่นใหม่ควรขึ้นหน้า" ให้ Bell กับ Dashboard ตรงกัน
-- รันใน Supabase SQL Editor ครั้งเดียวจบ (IF NOT EXISTS ปลอดภัยรันซ้ำได้)
-- วันที่: 2026-08-29
-- เกี่ยวกับ: leave-api/src/db/supabase-store.js:184 ORDER BY updated_at DESC
--           + leave-api/src/store.js:110 sort updated_at DESC
--           + CHEAT_SHEET Q64
-- ============================================================

-- 1) เรียงตามเวลาขยับล่าสุด (ยื่นใหม่ / ส่งกลับแล้วแก้ จะเด้งขึ้นบน)
CREATE INDEX IF NOT EXISTS idx_leave_updated_at ON leave_requests(updated_at DESC);

-- 2) ใช้กับคิวงานตามสถานะ (DC/MA งานค้างขึ้นก่อน แล้วค่อยเรียงเวลา)
CREATE INDEX IF NOT EXISTS idx_leave_status_updated ON leave_requests(current_status, updated_at DESC);

-- ตรวจสอบว่า index สร้างแล้ว
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename='leave_requests';
