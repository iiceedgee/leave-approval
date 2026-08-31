const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { isValidId } = require('../middleware/upload.middleware');

/**
 * canAccessLeave — กัน IDOR สำหรับ approval
 * hr: ทั้งหมด, mgr: เฉพาะ department เดียวกัน, emp: ไม่เกี่ยว (route นี้ไม่ให้ emp เข้า)
 * ใช้ logic เดียวกับ leave.route.js:16 และ file.route.js:15
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
    console.error('[approval.route] canAccessLeave error', e.message);
    return null;
  }
}

module.exports = function (leaveService) {
  const router = Router();

  router.use(authMiddleware);
  // manager หรือ HR เท่านั้น
  router.use(roleMiddleware('mgr', 'hr'));

  function handleResult(leave, res) {
    if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });
    if (leave.error) {
      const code = leave.statusCode === 409 ? 409 : 400;
      return res.status(code).json({ message: leave.error });
    }
    res.json(leave);
  }

  function validateId(req, res, next) {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'รหัสคำขอไม่ถูกต้อง' });
    next();
  }

  // POST /api/approval/:id/approve — อนุมัติ (หัวหน้าคนเดียว) + กันข้ามแผนก
  router.post('/:id/approve', validateId, roleMiddleware('mgr'), async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!(await canAccessLeave(leaveService.db, id, req.user))) {
        const exists = await leaveService.getById(id);
        if (exists) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงคำขอนี้' });
        return res.status(404).json({ message: 'ไม่พบคำขอ' });
      }
      const leave = await leaveService.approve(id, req.user.id, req.user.role, req.body.remark);
      handleResult(leave, res);
    } catch (err) { next(err); }
  });

  // POST /api/approval/:id/sendback — ส่งกลับแก้ไข (stamp B) + กันข้ามแผนก
  router.post('/:id/sendback', validateId, async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!(await canAccessLeave(leaveService.db, id, req.user))) {
        const exists = await leaveService.getById(id);
        if (exists) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงคำขอนี้' });
        return res.status(404).json({ message: 'ไม่พบคำขอ' });
      }
      const leave = await leaveService.sendBack(id, req.user.id, req.user.role, req.body.remark);
      handleResult(leave, res);
    } catch (err) { next(err); }
  });

  // POST /api/approval/:id/reject — ไม่อนุมัติ (stamp U) + กันข้ามแผนก
  router.post('/:id/reject', validateId, async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!(await canAccessLeave(leaveService.db, id, req.user))) {
        const exists = await leaveService.getById(id);
        if (exists) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงคำขอนี้' });
        return res.status(404).json({ message: 'ไม่พบคำขอ' });
      }
      const leave = await leaveService.reject(id, req.user.id, req.user.role, req.body.remark);
      handleResult(leave, res);
    } catch (err) { next(err); }
  });

  // POST /api/approval/:id/cancel — ยกเลิก (stamp C) + กันข้ามแผนก
  router.post('/:id/cancel', validateId, async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!(await canAccessLeave(leaveService.db, id, req.user))) {
        const exists = await leaveService.getById(id);
        if (exists) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงคำขอนี้' });
        return res.status(404).json({ message: 'ไม่พบคำขอ' });
      }
      const leave = await leaveService.cancel(id, req.user.id, req.user.role, req.body.remark);
      handleResult(leave, res);
    } catch (err) { next(err); }
  });

  return router;
};