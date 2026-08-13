const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');

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

        if (!['P', 'T'].includes(leave.current_status)) {
          return res.status(400).json({ message: 'สถานะไม่สามารถอัปโหลดไฟล์ได้' });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์' });
        }

        const stage = leave.current_status === 'P' ? 'pretemp' : 'temp';
        const files = [];
        for (const f of req.files) {
          files.push(await fileService.saveFile(leaveId, req.user.id, f, stage));
        }

        res.status(201).json(files);
      } catch (err) { next(err); }
    });
  });

  return router;
};