const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_PATH } = require('../middleware/upload.middleware');
const supabase = require('../db/supabase');

class FileService {
  constructor(db) {
    // ⚠️ เดิม: constructor(store) — ใช้ array ในเครื่อง
    // ตอนนี้ใช้ "db" (InMemoryStore / SupabaseStore) เพื่อให้สลับได้ง่าย
    this.db = db;
  }

  async saveFile(leaveId, userId, file, uploadStage = 'emp') {
    const isVercel = !!process.env.VERCEL;

    // ถ้าเป็น Vercel + มี buffer (memoryStorage) ให้อัปโหลดเข้า Supabase Storage
    // defensive: ถ้า supabase client เป็น null (local in-memory fallback) ให้ fallback ไป disk logic
    if (isVercel && file.buffer && supabase) {
      const ext = path.extname(file.originalname);
      // multer.memoryStorage ไม่มี filename — ต้อง gen เอง
      const filename = file.filename || `${uuidv4()}${ext}`;
      const supabasePath = path.posix.join(String(leaveId), filename);

      const { error } = await supabase.storage
        .from('leave-documents')
        .upload(supabasePath, file.buffer, {
          contentType: file.mimetype || 'application/octet-stream',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      return this.db.createDocument({
        leave_request_id: leaveId,
        file_name: filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size || file.buffer.length,
        file_path: supabasePath, // เก็บเป็น supabase storage path (ไม่ใช่ local path)
        uploaded_by: userId,
        upload_stage: uploadStage,
      });
    }

    // Fallback / Local: ใช้ logic เดิม (diskStorage มี filename และ path บน disk)
    // กรณี Vercel แต่ไม่มี supabase หรือไม่มี buffer ก็ fallback มาด้านนี้เพื่อไม่ให้ flow พัง
    if (isVercel && file.buffer && !supabase) {
      const ext = path.extname(file.originalname);
      const filename = file.filename || `${uuidv4()}${ext}`;
      return this.db.createDocument({
        leave_request_id: leaveId,
        file_name: filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size || file.buffer.length,
        file_path: path.join(String(leaveId), filename),
        uploaded_by: userId,
        upload_stage: uploadStage,
      });
    }

    // Non-Vercel (local) — file มาจาก diskStorage มี file.filename แน่นอน
    return this.db.createDocument({
      leave_request_id: leaveId,
      file_name: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
      file_path: path.join(String(leaveId), file.filename),
      uploaded_by: userId,
      upload_stage: uploadStage,
    });
  }

  async getFiles(leaveId) {
    return this.db.listDocumentsByLeave(leaveId);
  }

  async getFile(leaveId, fileId) {
    return this.db.findDocument(leaveId, fileId);
  }

  async deleteFile(leaveId, fileId, userId) {
    const doc = await this.db.findDocument(leaveId, fileId);
    if (!doc) return null;
    if (doc.uploaded_by !== userId) return null;

    const isVercel = !!process.env.VERCEL;

    if (isVercel && supabase) {
      // บน Vercel ไฟล์อยู่ใน Supabase Storage — ลบจาก bucket
      try {
        const { error } = await supabase.storage.from('leave-documents').remove([doc.file_path]);
        if (error) {
          console.error('[FileService] Supabase remove error:', error.message);
        }
      } catch (e) {
        console.error('[FileService] Supabase remove exception:', e.message);
      }
    } else {
      // Local — ลบไฟล์บน disk
      const fullPath = path.resolve(UPLOAD_PATH, doc.file_path);
      try {
        fs.unlinkSync(fullPath);
      } catch (e) {
        /* file may not exist — ignore for idempotency */
      }
    }

    return this.db.softDeleteDocument(fileId);
  }
}

module.exports = FileService;
