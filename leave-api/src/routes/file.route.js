'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');
const path = require('path');
const { UPLOAD_PATH } = require('../middleware/upload.middleware');
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
  const db = fileService.db;

  router.post('/:id/files', roleMiddleware('emp', 'mgr', 'hr'), (req, res, next) => {
    upload.array('files', 5)(req, res, async (err) => {
      if (err) return handleMulterError(err, req, res, next);
      try {
        const leaveId = req.params.id;
        const leave = await db.getLeaveById(leaveId);
        if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });

        if (req.user.role === 'emp') {
          if (leave.user_id !== req.user.id) return res.status(403).json({ message: 'ไม่ใช่คำขอของคุณ' });
        } else {
          if (!(await canAccessLeave(db, leaveId, req.user))) {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
          }
        }

        // หลัง AP/RJ/CX (เสร็จสิ้น) ไม่ให้แนบไฟล์แล้ว — ตาม flow ไม่จำเป็น
        if ([STATUS.AP.code, STATUS.RJ.code, STATUS.CX.code].includes(leave.current_status)) {
          return res.status(400).json({ message: 'คำขอเสร็จสิ้นแล้วไม่สามารถแนบไฟล์ได้' });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' });
        }

        let stage = 'emp';
        if (req.user.role !== 'emp') {
          if (![STATUS.DC.code, STATUS.VC.code].includes(leave.current_status)) {
            return res.status(400).json({ message: 'ไม่สามารถอัปโหลดได้ สถานะปัจจุบันไม่อยู่ในการตรวจสอบเอกสาร' });
          }
          stage = leave.current_status === STATUS.DC.code ? 'pretemp' : 'temp';
        }
        const files = [];
        for (const f of req.files) {
          // รองรับทั้ง diskStorage (มี path/filename) และ memoryStorage (มี buffer) — FileService จะจัดการต่อ
          files.push(await fileService.saveFile(leaveId, req.user.id, f, stage));
        }

        if (leave.current_status === STATUS.SU.code && req.user.role === 'emp') {
          await db.updateLeave(leaveId, { current_status: STATUS.DC.code });
          await db.addHistory({
            leave_request_id: leaveId,
            status_code: STATUS.DC.code,
            action_by: req.user.id,
            action_role: 'emp',
            remark: 'อัปโหลดเอกสารแล้ว',
          });
        }

        res.status(201).json(files);
      } catch (err) { next(err); }
    });
  });

  async function authFileAccess(req, res, next) {
    const leaveId = req.params.id;
    if (!(await canAccessLeave(db, leaveId, req.user))) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
    }
    next();
  }

  router.get('/:id/files', authFileAccess, async (req, res) => {
    const leaveId = req.params.id;
    const files = await fileService.getFiles(leaveId);
    res.json(files);
  });

  router.get('/:id/files/:fileId', authFileAccess, async (req, res) => {
    const leaveId = req.params.id;
    const fileId = req.params.fileId;
    const file = await fileService.getFile(leaveId, fileId);
    if (!file) return res.status(404).json({ message: 'ไม่พบไฟล์' });

    const isVercel = !!process.env.VERCEL;

    // บน Vercel ไฟล์อยู่บน Supabase Storage — สร้าง signed URL แล้ว redirect
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
          console.error('[file.route] createSignedUrl failed:', error ? error.message : 'no url');
        } catch (e) {
          console.error('[file.route] createSignedUrl exception:', e.message);
        }
      }
      // fallback 404 ถ้าไม่มี supabase หรือสร้าง URL ไม่ได้
      return res.status(404).json({ message: 'ไม่พบไฟล์บนเซิร์ฟเวอร์' });
    }

    // Local — ส่งไฟล์จาก disk
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

  router.delete('/:id/files/:fileId', roleMiddleware('emp', 'mgr', 'hr'), async (req, res) => {
    const leaveId = req.params.id;
    const fileId = req.params.fileId;
    const leave = await db.getLeaveById(leaveId);
    if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });
    if (req.user.role === 'emp' && leave.user_id !== req.user.id) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
    }
    if (req.user.role !== 'emp' && !(await canAccessLeave(db, leaveId, req.user))) {
      return res.status(403).json({ message: 'ไม่มีสิทธิ์' });
    }
    const file = await fileService.getFile(leaveId, fileId);
    if (!file) return res.status(404).json({ message: 'ไม่พบไฟล์' });
    if (file.uploaded_by !== req.user.id) return res.status(403).json({ message: 'ไม่ใช่ไฟล์ของคุณ' });
    const result = await fileService.deleteFile(leaveId, fileId, req.user.id);
    if (!result) return res.status(400).json({ message: 'ไม่สามารถลบไฟล์ได้' });
    res.json({ message: 'ลบไฟล์แล้ว' });
  });

  return router;
};
