'use strict';

const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');
const path = require('path');
const { UPLOAD_PATH } = require('../middleware/upload.middleware');
const { STATUS } = require('../constants/status');

/**
 * canAccessLeave — ตรวจสอบสิทธิ์เข้าถึงใบลา
 * emp: เจ้าของเท่านั้น, hr: ทั้งหมด, mgr: เฉพาะ department เดียวกัน
 */
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
    console.error('[file.route] canAccessLeave error', e.message);
    return null;
  }
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
        if (!leaveId || typeof leaveId !== 'string') {
          return res.status(400).json({ message: 'รหัสคำขอไม่ถูกต้อง' });
        }

        const leave = await db.getLeaveById(leaveId);
        if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });

        // สิทธิ์เข้าถึง
        if (req.user.role === 'emp') {
          if (leave.user_id !== req.user.id) return res.status(403).json({ message: 'ไม่ใช่คำขอของคุณ' });
        } else {
          if (!(await canAccessLeave(db, leaveId, req.user))) {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
          }
        }

        // หลัง AP/RJ/CX (เสร็จสิ้น) ไม่ให้แนบไฟล์แล้ว
        if ([STATUS.AP.code, STATUS.RJ.code, STATUS.CX.code].includes(leave.current_status)) {
          return res.status(400).json({ message: 'คำขอเสร็จสิ้นแล้วไม่สามารถแนบไฟล์ได้' });
        }

        // Emp ห้ามอัปโหลดที่ MA (รอหัวหน้าอนุมัติ) — ต้องรอผลก่อน
        if (req.user.role === 'emp' && leave.current_status === STATUS.MA.code) {
          return res.status(400).json({ message: 'คำขออยู่ระหว่างรอหัวหน้าอนุมัติ ไม่สามารถแนบไฟล์ได้' });
        }

        // Legacy VC block for emp after simplification (emp only SU/DC)
        if (req.user.role === 'emp' && leave.current_status === 'VC') {
          return res.status(400).json({ message: 'สถานะปัจจุบันไม่อนุญาตให้อัปโหลดเอกสาร (VC เลิกใช้งาน — ใช้ DC แทน)' });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' });
        }

        // ตรวจสอบ stage & สิทธิ์ตาม role
        let stage = 'emp';
        if (req.user.role !== 'emp') {
          // HR/MGR อัปโหลดได้เฉพาะตอน DC (ตรวจสอบความครบถ้วน) — VC removed
          if (leave.current_status !== STATUS.DC.code) {
            return res.status(400).json({ message: 'ไม่สามารถอัปโหลดได้ สถานะปัจจุบันไม่อยู่ในการตรวจสอบเอกสาร (ต้องเป็น DC)' });
          }
          stage = 'pretemp';
        } else {
          // Emp อัปโหลดได้ที่ SU และ DC (และกรณีส่งกลับ SU+Y)
          // DC อนุญาตจนกว่า pretempPass จะเปลี่ยนเป็น MA
          const allowedEmpStatuses = [STATUS.SU.code, STATUS.DC.code];
          const isAllowed = allowedEmpStatuses.includes(leave.current_status) || leave.flag_send_back === 'Y';
          if (!isAllowed) {
            return res.status(400).json({ message: 'สถานะปัจจุบันไม่อนุญาตให้อัปโหลดเอกสาร' });
          }
        }

        const files = [];
        for (const f of req.files) {
          try {
            // รองรับทั้ง diskStorage (มี path/filename) และ memoryStorage (มี buffer) — FileService จะจัดการต่อ
            files.push(await fileService.saveFile(leaveId, req.user.id, f, stage));
          } catch (saveErr) {
            console.error('[file.route] saveFile failed:', saveErr.message);
            // Handle storage errors gracefully (Supabase/Vercel)
            if (saveErr.message && saveErr.message.includes('Upload failed')) {
              return res.status(502).json({ message: 'อัปโหลดไฟล์ล้มเหลว (storage)', error: saveErr.message });
            }
            throw saveErr;
          }
        }

        // Auto transition: SU -> DC เมื่อ emp อัปโหลดเอกสารครั้งแรก
        let autoTransitionOk = true;
        let autoTransitionErr = null;
        if (leave.current_status === STATUS.SU.code && req.user.role === 'emp') {
          try {
            const updatePayload = { current_status: STATUS.DC.code };
            if (leave.flag_send_back === 'Y') updatePayload.flag_send_back = 'N';
            await db.updateLeave(leaveId, updatePayload);
            await db.addHistory({
              leave_request_id: leaveId,
              status_code: STATUS.DC.code,
              action_by: req.user.id,
              action_role: 'emp',
              remark: leave.flag_send_back === 'Y' ? 'อัปโหลดเอกสารใหม่หลังส่งกลับ' : 'อัปโหลดเอกสารแล้ว',
            });
            console.log('[file.route] auto SU->DC OK', leaveId);
          } catch (transErr) {
            autoTransitionOk = false;
            autoTransitionErr = transErr.message;
            console.error('[file.route] auto SU->DC FAILED:', transErr.message, transErr.code);
          }
        }

        // Plan A: ถ้า auto fail ให้ frontend รู้ — ส่ง warning header + body
        if (!autoTransitionOk) {
          return res.status(201).json({ files, warning: 'อัปโหลดสำเร็จแต่เปลี่ยนสถานะไม่สำเร็จ: ' + autoTransitionErr, autoTransitionOk: false });
        }
        res.status(201).json(files);
      } catch (err) {
        console.error('[file.route] POST /:id/files error', err);
        next(err);
      }
    });
  });

  async function authFileAccess(req, res, next) {
    try {
      const leaveId = req.params.id;
      if (!leaveId) return res.status(400).json({ message: 'รหัสคำขอไม่ถูกต้อง' });
      if (!(await canAccessLeave(db, leaveId, req.user))) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
      }
      next();
    } catch (e) {
      console.error('[file.route] authFileAccess error', e.message);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดตรวจสอบสิทธิ์' });
    }
  }

  router.get('/:id/files', authFileAccess, async (req, res, next) => {
    try {
      const leaveId = req.params.id;
      const files = await fileService.getFiles(leaveId);
      res.json(Array.isArray(files) ? files : []);
    } catch (err) {
      console.error('[file.route] GET /:id/files error', err);
      next(err);
    }
  });

  router.get('/:id/files/:fileId', authFileAccess, async (req, res, next) => {
    try {
      const leaveId = req.params.id;
      const fileId = req.params.fileId;
      if (!fileId) return res.status(400).json({ message: 'รหัสไฟล์ไม่ถูกต้อง' });
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
        if (err) {
          console.error('[file.route] download error', err.message);
          if (!res.headersSent) {
            res.status(404).json({ message: 'ไม่พบไฟล์บนเซิร์ฟเวอร์' });
          }
        }
      });
    } catch (err) {
      console.error('[file.route] GET /:id/files/:fileId error', err);
      next(err);
    }
  });

  router.delete('/:id/files/:fileId', roleMiddleware('emp', 'mgr', 'hr'), async (req, res, next) => {
    try {
      const leaveId = req.params.id;
      const fileId = req.params.fileId;
      if (!leaveId || !fileId) return res.status(400).json({ message: 'รหัสคำขอหรือรหัสไฟล์ไม่ถูกต้อง' });
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
      // ห้ามลบหลังคำขอเสร็จสิ้น
      if ([STATUS.AP.code, STATUS.RJ.code, STATUS.CX.code].includes(leave.current_status)) {
        return res.status(400).json({ message: 'คำขอเสร็จสิ้นแล้วไม่สามารถลบไฟล์ได้' });
      }
      const result = await fileService.deleteFile(leaveId, fileId, req.user.id);
      if (!result) return res.status(400).json({ message: 'ไม่สามารถลบไฟล์ได้' });
      res.json({ message: 'ลบไฟล์แล้ว' });
    } catch (err) {
      console.error('[file.route] DELETE error', err);
      next(err);
    }
  });

  return router;
};
