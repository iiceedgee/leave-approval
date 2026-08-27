-- Migration: เพิ่มเลขที่คำขอลา request_no แบบรันไม่ซ้ำ LV-YYYY-XXXX
-- รันใน Supabase SQL Editor (ครั้งเดียว) สำหรับ DB ที่มีข้อมูลแล้ว

-- 1. เพิ่มคอลัมน์ (ถ้ายังไม่มี)
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS request_no VARCHAR(20) UNIQUE;

-- 2. สร้าง Sequence (ถ้ายังไม่มี)
CREATE SEQUENCE IF NOT EXISTS leave_request_no_seq START 1;

-- 3. สร้าง Index
CREATE INDEX IF NOT EXISTS idx_leave_request_no ON leave_requests(request_no);

-- 4. Backfill ข้อมูลเก่าที่ยังไม่มีเลขที่ (รันแบบไม่ซ้ำ)
DO $$
DECLARE r RECORD;
DECLARE yr TEXT;
DECLARE seq INT;
BEGIN
  FOR r IN SELECT id, created_at FROM leave_requests WHERE request_no IS NULL ORDER BY created_at LOOP
    yr := EXTRACT(YEAR FROM r.created_at)::TEXT;
    seq := nextval('leave_request_no_seq');
    UPDATE leave_requests SET request_no = 'LV-' || yr || '-' || LPAD(seq::TEXT, 4, '0') WHERE id = r.id;
  END LOOP;
END $$;

-- 5. ตั้ง NOT NULL หลัง backfill (optional - ถ้าอยากบังคับ)
-- ALTER TABLE leave_requests ALTER COLUMN request_no SET NOT NULL;

-- 6. สิทธิ์
GRANT ALL ON SEQUENCE leave_request_no_seq TO anon, authenticated, service_role;
