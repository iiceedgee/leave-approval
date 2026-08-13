-- ============================================================
-- GRANT สิทธิ์ให้ role ของ Supabase key
--
-- วิธีใช้:
--  1. เปิด Supabase dashboard → SQL Editor → New query
--  2. คัดลอกโค้ดด้านล่างทั้งหมดไปวาง
--  3. กด Run
--
-- จำเป็นต้องรัน เพราะถ้าไม่รัน จะเจอ error:
--    "permission denied for table users"
--  ตอน app.js เรียก seed()
--
--  อธิบาย:
--   - anon         = publishable key (sb_publishable_...) ใช้ RLS ปกติ
--   - service_role = secret key (sb_secret_...) ข้าม RLS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
