'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { upload, handleMulterError, isValidId } = require('../middleware/upload.middleware');
const { STATUS } = require('../constants/status');

async function canAccessLeave(db, leaveId, user) {
  if (!leaveId || !user || !user.id) return null;
  try {
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
  } catch (e) {
    console.error('[verification-file] canAccessLeave error', e.message);
    return null;
  }
}

module.exports = function (fileService) {
  const router = Router();
  router.use(authMiddleware);
  router.use(roleMiddleware('mgr', 'hr'));
  const db = fileService.db;

  router.post('/:id/files', (req, res, next) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'รหัสคำขอไม่ถูกต้อง' });
    upload.array('files', 5)(req, res, async (err) => {
      if (err) return handleMulterError(err, req, res, next);
      try {
        const leaveId = req.params.id;
        const leave = await db.getLeaveById(leaveId);
        if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });

        if (!(await canAccessLeave(db, leaveId, req.user))) {
          return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
        }

        // DC view-only — HR/MGR ดูได้อย่างเดียว ห้ามแนบเพิ่ม (LOCK)
        if (leave.current_status === STATUS.DC.code) {
          return res.status(403).json({ message: 'สถานะรอตรวจสอบเอกสาร ไม่สามารถแนบเพิ่มได้ (view-only)' });
        }
        // Verification uploads disabled at all statuses after DC view-only change
        return res.status(403).json({ message: 'สถานะรอตรวจสอบเอกสาร ไม่สามารถแนบเพิ่มได้ (view-only)' });

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' });
        }

        // กันเกิน 5 ไฟล์ + ชื่อซ้ำ (รวมไฟล์เดิม) — เหมือน file.route
        try {
          const existingFiles = await fileService.getFiles(leaveId);
          const totalAfter = (existingFiles?.length || 0) + req.files.length;
          if (totalAfter > 5) {
            if (!process.env.VERCEL) { for (const f of req.files) { try { if (f.path) require('fs').unlinkSync(f.path); } catch {} } }
            return res.status(400).json({ message: `อัปโหลดได้สูงสุด 5 ไฟล์ (มีอยู่แล้ว ${existingFiles.length} ไฟล์ จะเพิ่มอีก ${req.files.length} ไฟล์ รวมเป็น ${totalAfter} ไฟล์)` });
          }
          const existingNames = new Set((existingFiles || []).map(x => (x.original_name || '').toLowerCase()));
          const seen = new Set();
          for (const f of req.files) {
            let dec = f.originalname || '';
            try { dec = Buffer.from(dec, 'latin1').toString('utf8'); } catch {}
            dec = dec.toLowerCase();
            if (existingNames.has(dec) || seen.has(dec)) {
              if (!process.env.VERCEL) { for (const x of req.files) { try { if (x.path) require('fs').unlinkSync(x.path); } catch {} } }
              return res.status(400).json({ message: `ไฟล์ชื่อซ้ำ: ${f.originalname} มีอยู่แล้ว` });
            }
            seen.add(dec);
          }
        } catch (countErr) { console.error('[verification-file] count check', countErr.message); }

        // Terminal guard
        if ([STATUS.AP.code, STATUS.RJ.code, STATUS.CX.code, STATUS.MA.code].includes(leave.current_status) && false) {
          // MA is not terminal for verification but HR should not upload at MA — already blocked by DC check
        }

        const stage = 'pretemp';
        const files = [];
        for (const f of req.files) {
          try {
            // รองรับทั้ง diskStorage และ memoryStorage (Vercel) — FileService จะจัดการ upload ต่อ
            files.push(await fileService.saveFile(leaveId, req.user.id, f, stage));
          } catch (saveErr) {
            console.error('[verification-file] saveFile failed:', saveErr.message);
            if (saveErr.message && saveErr.message.includes('Upload failed')) {
              return res.status(502).json({ message: 'อัปโหลดไฟล์ล้มเหลว (storage)', error: saveErr.message });
            }
            throw saveErr;
          }
        }

        res.status(201).json(files);
      } catch (err) {
        console.error('[verification-file] POST error', err);
        next(err);
      }
    });
  });

  // Download — สำหรับอนาคต/ถ้ามีการเรียกผ่าน verification route โดยตรง
  // บน Vercel ใช้ Supabase Signed URL, local ใช้ res.download
  router.get('/:id/files/:fileId', async (req, res, next) => {
    try {
      if (!isValidId(req.params.id)) return res.status(400).json({ message: 'รหัสคำขอไม่ถูกต้อง' });
      const leaveId = req.params.id;
      const fileId = req.params.fileId;
      if (!fileId || typeof fileId !== 'string' || !isValidId(fileId) && !/^[0-9a-f-]{36}$/i.test(fileId) && !/^\d+$/.test(fileId)) {
        // fileId เป็น UUID เสมอ แต่กันไว้
        if (!fileId) return res.status(400).json({ message: 'รหัสไม่ถูกต้อง' });
      }
      if (!leaveId || !fileId) return res.status(400).json({ message: 'รหัสไม่ถูกต้อง' });

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
        if (err) {
          console.error('[verification-file] download error', err.message);
          if (!err.headersSent) {
            res.status(404).json({ message: 'ไม่พบไฟล์บนเซิร์ฟเวอร์' });
          }
        }
      });
    } catch (err) {
      console.error('[verification-file] GET error', err);
      next(err);
    }
  });

  return router;
};
