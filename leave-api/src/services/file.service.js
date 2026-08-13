const fs = require('fs');
const path = require('path');
const { UPLOAD_PATH } = require('../middleware/upload.middleware');

class FileService {
  constructor(db) {
    // ⚠️ เดิม: constructor(store) — ใช้ array ในเครื่อง
    // ตอนนี้ใช้ "db" (InMemoryStore / SupabaseStore) เพื่อให้สลับได้ง่าย
    this.db = db;
  }

  async saveFile(leaveId, userId, file, uploadStage = 'emp') {
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

    const fullPath = path.resolve(UPLOAD_PATH, doc.file_path);
    try { fs.unlinkSync(fullPath); } catch (e) { /* file may not exist */ }

    return this.db.softDeleteDocument(fileId);
  }
}

module.exports = FileService;