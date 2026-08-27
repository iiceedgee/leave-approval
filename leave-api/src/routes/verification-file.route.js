'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');
const { STATUS } = require('../constants/status');

async function canAccessLeave(db, leaveId, user) {
  const leave = await db.getLeaveById(leaveId);
  if (!leave) return null;
  if (leave.user_id === user.id) return leave;
  if (user.role === 'hr') return leave;
  if (user.role === 'mgr') {
    const mgr = await db.findUserById(user.id);
    const owner = await db.findUserById(leave.user_id);
    if (owner && mgr && owner.department === mgr.department) return leave;
  }
  return null;
}

module.exports = function (fileService) {
  const router = Router();
  router.use(authMiddleware);
  router.use(roleMiddleware('mgr', 'hr'));
  const db = fileService.db;

  router.post('/:id/files', (req, res, next) => {
    upload.array('files', 5)(req, res, async (err) => {
      if (err) return handleMulterError(err, req, res, next);
      try {
        const leaveId = req.params.id;
        const leave = await db.getLeaveById(leaveId);
        if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });

        if (!(await canAccessLeave(db, leaveId, req.user))) {
          return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
        }

        if (![STATUS.DC.code, STATUS.VC.code].includes(leave.current_status)) {
          return res.status(400).json({ message: 'สถานะไม่สามารถอัปโหลดไฟล์ได้' });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' });
        }

        const stage = leave.current_status === STATUS.DC.code ? 'pretemp' : 'temp';
        const files = [];
        for (const f of req.files) {
          // รองรับทั้ง diskStorage และ memoryStorage (Vercel) — FileService จะจัดการ upload ต่อ
          files.push(await fileService.saveFile(leaveId, req.user.id, f, stage));
        }

        res.status(201).json(files);
      } catch (err) { next(err); }
    });
  });

  // Download — สำหรับอนาคต/ถ้ามีการเรียกผ่าน verification route โดยตรง
  // บน Vercel ใช้ Supabase Signed URL, local ใช้ res.download
  router.get('/:id/files/:fileId', async (req, res) => {
    const leaveId = req.params.id;
    const fileId = req.params.fileId;

    if (!(await canAccessLeave(db, leaveId, req.user))) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
    }

    const file = await fileService.getFile(leaveId, fileId);
    if (!file) return res.status(404).json({ message: 'ไม่พบไฟล์' });

    const isVercel = !!process.env.VERCEL;

    if (isVercel) {
      const supabase = require('../db/supabase');
      if (supabase) {
        try {
          const { data, error } = await supabase.storage
            .from('leave-documents')
            .createSignedUrl(file.file_path, 60);
          if (!error && data && data.signedUrl) {
            return res.redirect(data.signedUrl);
          }
          console.error('[verification-file.route] createSignedUrl failed:', error ? error.message : 'no url');
        } catch (e) {
          console.error('[verification-file.route] createSignedUrl exception:', e.message);
        }
      }
      return res.status(404).json({ message: 'ไม่พบไฟล์บนเซิร์ฟเวอร์' });
    }

    // Local fallback
    const path = require('path');
    const { UPLOAD_PATH } = require('../middleware/upload.middleware');
    const fullPath = path.resolve(UPLOAD_PATH, file.file_path);
    if (!fullPath.startsWith(path.resolve(UPLOAD_PATH))) {
      return res.status(400).json({ message: 'เส้นทางไม่ถูกต้อง' });
    }
    res.download(fullPath, file.original_name, (err) => {
      if (err && !err.headersSent) {
        res.status(404).json({ message: 'ไม่พบไฟล์บนเซิร์ฟเวอร์' });
      }
    });
  });

  return router;
};
