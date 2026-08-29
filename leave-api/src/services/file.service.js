const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_PATH } = require('../middleware/upload.middleware');
const supabase = require('../db/supabase');

function decodeFilename(name) {
  if (!name) return name;
  try {
    // multer ส่ง originalname แบบ latin1 ทำให้ไทยเพี้ยนเป็น à¹.. ต้อง decode -> utf8
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    // ถ้า decode แล้วได้ไทยจริง ใช้ decoded, ไม่งั้น fallback ชื่อเดิม
    if (decoded && !decoded.includes('�')) return decoded;
    return name;
  } catch { return name; }
}

class FileService {
  constructor(db) {
    // ⚠️ เดิม: constructor(store) — ใช้ array ในเครื่อง
    // ตอนนี้ใช้ "db" (InMemoryStore / SupabaseStore) เพื่อให้สลับได้ง่าย
    this.db = db;
  }

  /**
   * saveFile — บันทึกไฟล์ลง storage (Supabase หรือ disk) แล้วสร้าง document record
   * @param {string} leaveId 
   * @param {string} userId 
   * @param {object} file — multer file (diskStorage: {filename,path} หรือ memoryStorage: {buffer})
   * @param {string} uploadStage — 'emp' | 'pretemp' | 'temp' (temp deprecated, legacy VC)
   */
  async saveFile(leaveId, userId, file, uploadStage = 'emp') {
    if (!leaveId || !userId || !file) throw new Error('พารามิเตอร์ไม่ครบสำหรับ saveFile');
    // Normalize deprecated stage: temp (VC) -> pretemp for logging, but keep original for audit
    const normalizedStage = uploadStage === 'temp' ? 'pretemp' : uploadStage;
    if (uploadStage === 'temp') {
      console.warn('[FileService] deprecated stage temp (VC) — mapping to pretemp for storage');
    }
    // Validate stage
    const allowedStages = ['emp', 'pretemp', 'temp'];
    const stageToStore = allowedStages.includes(uploadStage) ? uploadStage : 'emp';

    const isVercel = !!process.env.VERCEL;

    const originalName = decodeFilename(file.originalname);
    // ถ้าเป็น Vercel + มี buffer (memoryStorage) ให้อัปโหลดเข้า Supabase Storage
    // defensive: ถ้า supabase client เป็น null (local in-memory fallback) ให้ fallback ไป disk logic
    if (isVercel && file.buffer && supabase) {
      const ext = path.extname(originalName || '');
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
        // Handle storage errors with clear message for route layer
        throw new Error(`Upload failed: ${error.message}`);
      }

      return this.db.createDocument({
        leave_request_id: leaveId,
        file_name: filename,
        original_name: originalName,
        mime_type: file.mimetype,
        file_size: file.size || file.buffer.length,
        file_path: supabasePath, // เก็บเป็น supabase storage path (ไม่ใช่ local path)
        uploaded_by: userId,
        upload_stage: stageToStore,
      });
    }

    // Fallback / Local: ใช้ logic เดิม (diskStorage มี filename และ path บน disk)
    // กรณี Vercel แต่ไม่มี supabase หรือไม่มี buffer ก็ fallback มาด้านนี้เพื่อไม่ให้ flow พัง
    if (isVercel && file.buffer && !supabase) {
      const ext = path.extname(originalName || '');
      const filename = file.filename || `${uuidv4()}${ext}`;
      return this.db.createDocument({
        leave_request_id: leaveId,
        file_name: filename,
        original_name: originalName,
        mime_type: file.mimetype,
        file_size: file.size || file.buffer.length,
        file_path: path.join(String(leaveId), filename),
        uploaded_by: userId,
        upload_stage: stageToStore,
      });
    }

    // Non-Vercel (local) — file มาจาก diskStorage มี file.filename แน่นอน
    if (!file.filename) {
      // Defensive: if somehow we got buffer without supabase on local, generate filename
      const ext = path.extname(originalName || '');
      const filename = `${uuidv4()}${ext}`;
      return this.db.createDocument({
        leave_request_id: leaveId,
        file_name: filename,
        original_name: originalName,
        mime_type: file.mimetype,
        file_size: file.size || file.buffer?.length || 0,
        file_path: path.join(String(leaveId), filename),
        uploaded_by: userId,
        upload_stage: stageToStore,
      });
    }
    return this.db.createDocument({
      leave_request_id: leaveId,
      file_name: file.filename,
      original_name: originalName,
      mime_type: file.mimetype,
      file_size: file.size,
      file_path: path.join(String(leaveId), file.filename),
      uploaded_by: userId,
      upload_stage: stageToStore,
    });
  }

  async getFiles(leaveId) {
    if (!leaveId) return [];
    try {
      return await this.db.listDocumentsByLeave(leaveId);
    } catch (e) {
      console.error('[FileService] getFiles error', e.message);
      throw e;
    }
  }

  async getFile(leaveId, fileId) {
    if (!leaveId || !fileId) return null;
    try {
      return await this.db.findDocument(leaveId, fileId);
    } catch (e) {
      console.error('[FileService] getFile error', e.message);
      return null;
    }
  }

  async deleteFile(leaveId, fileId, userId) {
    if (!leaveId || !fileId || !userId) return null;
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
          // Don't fail delete if storage remove fails — still soft delete DB record for UX
        }
      } catch (e) {
        console.error('[FileService] Supabase remove exception:', e.message);
      }
    } else {
      // Local — ลบไฟล์บน disk
      const fullPath = path.resolve(UPLOAD_PATH, doc.file_path);
      // Path traversal guard
      if (!fullPath.startsWith(path.resolve(UPLOAD_PATH))) {
        console.error('[FileService] delete path traversal blocked', doc.file_path);
        return null;
      }
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (e) {
        console.warn('[FileService] unlink failed (idempotent)', e.message);
        /* file may not exist — ignore for idempotency */
      }
    }

    try {
      return await this.db.softDeleteDocument(fileId);
    } catch (e) {
      console.error('[FileService] softDeleteDocument error', e.message);
      throw e;
    }
  }
}

module.exports = FileService;
