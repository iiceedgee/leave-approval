-- ============================================================
-- Leave Approval System — Database Schema
-- รันใน Supabase SQL Editor ก่อนเริ่มใช้งาน
-- ============================================================

-- 1. ตาราง users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('emp', 'mgr', 'hr')),
  department VARCHAR(200),
  status CHAR(1) DEFAULT 'Y' CHECK (status IN ('Y', 'N')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ตาราง leave_requests (คำขอลา)
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  leave_type VARCHAR(50) NOT NULL,         -- ลาป่วย, ลากิจ, ลาพักร้อน
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  current_status CHAR(1) DEFAULT 'F' CHECK (current_status IN ('F','P','T','M','S','B','C','U')),
  flag_send_back CHAR(1) DEFAULT 'N' CHECK (flag_send_back IN ('Y','N')),
  send_back_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ตาราง leave_status_history (ประวัติการเปลี่ยนแปลงสถานะ)
CREATE TABLE leave_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id),
  status_code CHAR(1) NOT NULL,            -- F/P/T/M/S/B/C/U
  action_by UUID NOT NULL REFERENCES users(id),
  action_role VARCHAR(10),                 -- emp / mgr / hr
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ตาราง documents (ไฟล์เอกสารแนบ)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id),
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  upload_stage VARCHAR(10) DEFAULT 'emp' CHECK (upload_stage IN ('emp', 'pretemp', 'temp')),
  is_deleted CHAR(1) DEFAULT 'N' CHECK (is_deleted IN ('Y', 'N')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ตาราง document_verifications (ประวัติการตรวจสอบเอกสาร)
CREATE TABLE document_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id),
  stage VARCHAR(20) NOT NULL CHECK (stage IN ('pretemp', 'temp')),
  result VARCHAR(10) NOT NULL CHECK (result IN ('pass', 'sendback')),
  verified_by UUID NOT NULL REFERENCES users(id),
  verified_role VARCHAR(10),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index สำหรับค้นหาเร็วขึ้น
CREATE INDEX idx_leave_user ON leave_requests(user_id);
CREATE INDEX idx_leave_status ON leave_requests(current_status);
CREATE INDEX idx_history_request ON leave_status_history(leave_request_id);
CREATE INDEX idx_doc_request ON documents(leave_request_id);
CREATE INDEX idx_verification_request ON document_verifications(leave_request_id);

-- ============================================================
-- GRANT สิทธิ์ให้ role ของ Supabase key
-- จำเป็น! ถ้าไม่รัน จะเกิด error "permission denied for table users"
--  (anon = publishable key, service_role = secret key)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
