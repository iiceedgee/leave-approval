-- Migration 002 — Fix legacy F status to SU
-- รันใน Supabase SQL Editor ครั้งเดียว (idempotent)
-- สาเหตุ: prod เคย DEFAULT 'F' ทำให้ใบใหม่ทุกใบเป็น F แทน SU

-- 1. แก้ใบที่พังอยู่
UPDATE leave_requests SET current_status='SU', updated_at=now() WHERE current_status='F';
UPDATE leave_status_history SET status_code='SU' WHERE status_code='F';

-- 2. แก้ default + CHECK ให้ตรง schema.sql
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_current_status_check;
ALTER TABLE leave_requests ALTER COLUMN current_status TYPE VARCHAR(2) USING current_status::VARCHAR(2);
ALTER TABLE leave_requests ALTER COLUMN current_status SET DEFAULT 'SU';
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_current_status_check CHECK (current_status IN ('SU','DC','VC','MA','AP','SB','CX','RJ'));

-- 3. ลบ trigger ผิดถ้ามี (กันย้อนกลับเป็น F)
DROP TRIGGER IF EXISTS trg_set_default_F ON leave_requests;

-- Verify
-- SELECT current_status, count(*) FROM leave_requests GROUP BY 1;
-- SELECT column_default, data_type FROM information_schema.columns WHERE table_name='leave_requests' AND column_name='current_status';
