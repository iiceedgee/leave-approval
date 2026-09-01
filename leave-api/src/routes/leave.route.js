const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { isValidId, upload, handleMulterError } = require('../middleware/upload.middleware');

function validateId(req, res, next) {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'รหัสคำขอไม่ถูกต้อง' });
  next();
}

/**
 * canAccessLeave — กัน IDOR สำหรับ GET /:id, /:id/stepper, /:id/history
 * emp: เจ้าของเท่านั้น, hr: ทั้งหมด, mgr: เฉพาะ department เดียวกัน
 * ใช้ logic เดียวกับ file.route.js:15 เพื่อไม่ให้ drift
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
    console.error('[leave.route] canAccessLeave error', e.message);
    return null;
  }
}

module.exports = function (leaveService, fileService) {
  const router = Router();

  router.use(authMiddleware);

  // ★ GET /api/leave/my-history — ดึงประวัติการลาของตัวเอง (ต้องอยู่ก่อน /:id)
  router.get('/my-history', async (req, res, next) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : undefined;
      const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : undefined;
      if (page !== undefined && (isNaN(page) || page < 1)) return res.status(400).json({ message: 'page ต้องเป็นตัวเลข >= 1' });
      if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 50)) return res.status(400).json({ message: 'limit ต้องเป็นตัวเลข 1-50' });
      let q;
      if (req.query.q !== undefined) {
        const rawQ = typeof req.query.q === 'string' ? req.query.q : String(req.query.q);
        const trimmed = rawQ.trim();
        if (trimmed.length > 100) return res.status(400).json({ message: 'q ต้องไม่เกิน 100 ตัวอักษร' });
        if (trimmed.length > 0) q = trimmed.toLowerCase();
      }
      const result = await leaveService.getMyHistory(req.user.id, year, { page, limit, q });
      return res.json(result);
    } catch (err) { next(err); }
  });

  // ★ GET /api/leave/my-balance — ดึงยอดคงเหลือการลาของตัวเอง (ต้องอยู่ก่อน /:id)
  router.get('/my-balance', async (req, res, next) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const balance = await leaveService.getMyBalance(req.user.id, year);
      res.json(balance);
    } catch (err) { next(err); }
  });

  // GET /api/leave — ดึงรายการคำขอลาตาม role
  router.get('/', async (req, res, next) => {
    try {
      const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : undefined;
      const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : undefined;
      if (page !== undefined && (isNaN(page) || page < 1)) return res.status(400).json({ message: 'page ต้องเป็นตัวเลข >= 1' });
      if (limit !== undefined && (isNaN(limit) || limit < 1 || limit > 50)) return res.status(400).json({ message: 'limit ต้องเป็นตัวเลข 1-50' });
      let q;
      if (req.query.q !== undefined) {
        const rawQ = typeof req.query.q === 'string' ? req.query.q : String(req.query.q);
        const trimmed = rawQ.trim();
        if (trimmed.length > 100) return res.status(400).json({ message: 'q ต้องไม่เกิน 100 ตัวอักษร' });
        if (trimmed.length > 0) q = trimmed.toLowerCase();
      }
      const r = await leaveService.getLeaves(req.user.id, req.user.role, { page, limit, q });
      return res.json(r);
    } catch(err){ next(err); }
  });

  // POST /api/leave — พนักงานยื่นคำขอลา
  router.post('/', roleMiddleware('emp'), async (req, res, next) => {
    try { const leave = await leaveService.create(req.user.id, req.body); res.status(201).json(leave); } catch(err){ next(err); }
  });

  // GET /api/leave/:id — ดูรายละเอียดคำขอ (กัน IDOR: เช็คสิทธิ์ก่อนส่งข้อมูล)
  router.get('/:id', validateId, async (req, res, next) => {
    try {
      const id = req.params.id;
      const leave = await canAccessLeave(leaveService.db, id, req.user);
      if (!leave) {
        // แยก 404 vs 403 — ถ้าแถวมีจริงแต่ไม่มีสิทธิ์ให้ 403 เพื่อกัน enumerate
        const exists = await leaveService.getById(id);
        if (exists) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงคำขอนี้' });
        return res.status(404).json({ message: 'ไม่พบคำขอ' });
      }
      res.json(leave);
    } catch(err){ next(err); }
  });

  // POST /api/leave/:id/resubmit — พนักงานส่งใหม่หลังจากถูกส่งกลับ (รองรับ multipart ส่งไฟล์พร้อมกันแบบ atomic)
  router.post('/:id/resubmit', validateId, roleMiddleware('emp'), (req, res, next) => {
    upload.array('files', 5)(req, res, async (err) => {
      if (err) return handleMulterError(err, req, res, next);
      try {
        const id = req.params.id;
        // รวม data จาก body (รองรับทั้ง JSON และ multipart)
        const data = {
          leave_type: req.body.leave_type,
          start_date: req.body.start_date,
          end_date: req.body.end_date,
          reason: req.body.reason,
        };
        // ลบ undefined ออกเพื่อให้ service ใช้ค่าเดิม
        Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);
        // ถ้ามีไฟล์แนบมาด้วย — ตรวจโควตา 5 ไฟล์ + กันชื่อซ้ำก่อน resubmit (atomic: save ก่อนเปลี่ยนสถานะ)
        if (req.files && req.files.length > 0) {
          if (!fileService) {
            return res.status(500).json({ message: 'fileService ไม่พร้อม' });
          }
          // ตรวจโควตาและชื่อซ้ำรวมไฟล์เดิม
          try {
            const existingFiles = await fileService.getFiles(id);
            const totalAfter = (existingFiles?.length || 0) + req.files.length;
            if (totalAfter > 5) {
              if (!process.env.VERCEL) {
                for (const f of req.files) { try { if (f.path) require('fs').unlinkSync(f.path); } catch {} }
              }
              return res.status(400).json({ message: `อัปโหลดได้สูงสุด 5 ไฟล์ (มีอยู่แล้ว ${existingFiles.length} ไฟล์ จะเพิ่มอีก ${req.files.length} ไฟล์ รวมเป็น ${totalAfter} ไฟล์)` });
            }
            const existingNames = new Set((existingFiles || []).map(x => (x.original_name || '').toLowerCase()));
            const seen = new Set();
            for (const f of req.files) {
              let dec = f.originalname || '';
              try { dec = Buffer.from(dec, 'latin1').toString('utf8'); } catch {}
              dec = dec.toLowerCase();
              if (existingNames.has(dec) || seen.has(dec)) {
                if (!process.env.VERCEL) {
                  for (const x of req.files) { try { if (x.path) require('fs').unlinkSync(x.path); } catch {} }
                }
                return res.status(400).json({ message: `ไฟล์ชื่อซ้ำ: ${f.originalname} มีอยู่แล้ว` });
              }
              seen.add(dec);
            }
          } catch (countErr) {
            console.error('[leave.route] resubmit count check error', countErr.message);
          }
          // save ไฟล์ก่อน resubmit — ถ้า save พังจะไม่เปลี่ยนสถานะ ให้ retry ได้
          const saved = [];
          for (const f of req.files) {
            try {
              saved.push(await fileService.saveFile(id, req.user.id, f, 'emp'));
            } catch (saveErr) {
              console.error('[leave.route] resubmit saveFile failed', saveErr.message);
              // cleanup ที่ save ไปแล้วบางส่วน
              for (const s of saved) { try { await fileService.deleteFile(id, s.id, req.user.id); } catch {} }
              if (!process.env.VERCEL) {
                for (const x of req.files) { try { if (x.path) require('fs').unlinkSync(x.path); } catch {} }
              }
              if (saveErr.message && saveErr.message.includes('Upload failed')) {
                return res.status(502).json({ message: 'อัปโหลดไฟล์ล้มเหลว (storage)', error: saveErr.message });
              }
              throw saveErr;
            }
          }
        }
        const leave = await leaveService.resubmit(id, req.user.id, Object.keys(data).length ? data : req.body);
        if (!leave) return res.status(400).json({ message: 'ไม่สามารถส่งใหม่ได้' });
        if (leave.error) {
          // ถ้า resubmit fail แต่ไฟล์เพิ่ง save ไปแล้ว — ลบไฟล์ที่เพิ่ง save กลับ (rollback)
          if (req.files && req.files.length > 0) {
            try {
              const allFiles = await fileService.getFiles(id);
              // ลบเฉพาะไฟล์ที่ชื่อตรงกับที่เพิ่งอัปโหลด
              for (const f of req.files) {
                let dec = f.originalname || '';
                try { dec = Buffer.from(dec, 'latin1').toString('utf8'); } catch {}
                const match = (allFiles || []).find(x => (x.original_name || '').toLowerCase() === dec.toLowerCase());
                if (match) try { await fileService.deleteFile(id, match.id, req.user.id); } catch {}
              }
            } catch {}
          }
          const statusCode = leave.statusCode === 409 ? 409 : 400;
          return res.status(statusCode).json({ message: leave.error });
        }
        res.json(leave);
      } catch (err) { next(err); }
    });
  });

  // POST /api/leave/:id/cancel — พนักงานยกเลิกคำขอตัวเอง
  router.post('/:id/cancel', validateId, roleMiddleware('emp'), async (req, res, next) => {
    try {
      const id = req.params.id;
      const result = await leaveService.cancel(id, req.user.id, 'emp', req.body.remark);
      if (!result) return res.status(404).json({ message: 'ไม่พบคำขอ' });
      if (result.error) return res.status(400).json({ message: result.error });
      res.json(result);
    } catch(err){ next(err); }
  });

  // GET /api/leave/:id/stepper — ★ ดึง stepper steps (กัน IDOR)
  router.get('/:id/stepper', validateId, async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!(await canAccessLeave(leaveService.db, id, req.user))) {
        const exists = await leaveService.getById(id);
        if (exists) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงคำขอนี้' });
        return res.status(404).json({ message: 'ไม่พบคำขอ' });
      }
      const steps = await leaveService.getStepper(id);
      res.json(steps);
    } catch(err){ next(err); }
  });

  // GET /api/leave/:id/history — ★ ดึงประวัติการเปลี่ยนแปลง (กัน IDOR)
  router.get('/:id/history', validateId, async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!(await canAccessLeave(leaveService.db, id, req.user))) {
        const exists = await leaveService.getById(id);
        if (exists) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงคำขอนี้' });
        return res.status(404).json({ message: 'ไม่พบคำขอ' });
      }
      const history = await leaveService.getHistory(id);
      res.json(history);
    } catch(err){ next(err); }
  });

  return router;
};
