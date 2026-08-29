-- ============================================================
-- Migration: กัน request_no ชนกันตอนกดพร้อมกัน — ใช้ sequence แทน MAX+1
-- ปัญหาเดิม: _nextRequestNo() ใน supabase-store.js ใช้ MAX(request_no)+1
--           ถ้า 2 คนกดส่งใบลาพร้อมกัน (09:00:00.001) จะอ่าน max ค่าเดียวกัน
--           ได้เลขซ้ำ LV-2026-0001 แล้วชน unique constraint (23505)
-- วิธีแก้: ใช้ Postgres SEQUENCE + nextval() ซึ่งเป็น atomic ในตัว
--         ทุกครั้งที่เรียกจะได้ค่าที่ไม่ซ้ำแน่นอน ไม่ต้องพึ่ง retry
-- รันใน Supabase SQL Editor ครั้งเดียว (idempotent — รันซ้ำไม่พัง)
-- วันที่: 2026-08-29
-- เกี่ยวกับ: leave-api/src/db/supabase-store.js:82 _nextRequestNo()
--           leave-api/sql/schema.sql:38 CREATE SEQUENCE leave_request_no_seq
-- ============================================================

-- 1. สร้าง Sequence ถ้ายังไม่มี (schema.sql มีแล้ว แต่ migration นี้รันซ้ำได้)
CREATE SEQUENCE IF NOT EXISTS leave_request_no_seq START 1;

-- 2. สร้าง function แบบ atomic — คืน string LV-YYYY-XXXX
--    nextval() เป็น atomic แม้ concurrent หลาย connection พร้อมกัน
CREATE OR REPLACE FUNCTION next_request_no()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq_val INT;
  yr TEXT;
BEGIN
  yr := EXTRACT(YEAR FROM NOW())::TEXT;
  seq_val := nextval('leave_request_no_seq');
  RETURN 'LV-' || yr || '-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$;

-- 3. สิทธิ์ — ให้ Supabase roles เรียกได้
GRANT USAGE, SELECT ON SEQUENCE leave_request_no_seq TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION next_request_no() TO anon, authenticated, service_role;

-- 4. (Optional) ซิงค์ sequence ให้ไม่ชนเลขเดิม — ตั้งให้มากกว่าค่าสูงสุดที่มีอยู่
--    รันครั้งเดียวหลังสร้าง function เพื่อกันเลขซ้ำกับข้อมูลเก่า
DO $$
DECLARE
  max_seq INT;
BEGIN
  SELECT COALESCE(MAX((regexp_match(request_no, '-(\d+)$'))[1]::INT), 0) INTO max_seq
  FROM leave_requests
  WHERE request_no ~ '^LV-\d{4}-\d+$';

  IF max_seq > 0 THEN
    PERFORM setval('leave_request_no_seq', GREATEST(max_seq, (SELECT last_value FROM leave_request_no_seq)), true);
  END IF;
END $$;

-- ตรวจสอบ:
-- SELECT next_request_no(); -- ควรได้ LV-2026-000X ที่ไม่ซ้ำ
-- SELECT * FROM leave_request_no_seq;
