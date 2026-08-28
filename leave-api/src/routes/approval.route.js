const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { isValidId } = require('../middleware/upload.middleware');

module.exports = function (leaveService) {
  const router = Router();

  router.use(authMiddleware);
  // manager หรือ HR เท่านั้น
  router.use(roleMiddleware('mgr', 'hr'));

  function handleResult(leave, res) {
    if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });
    if (leave.error) return res.status(400).json({ message: leave.error });
    res.json(leave);
  }

  function validateId(req, res, next) {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'รหัสคำขอไม่ถูกต้อง' });
    next();
  }

  // POST /api/approval/:id/approve — อนุมัติ (หัวหน้าคนเดียว)
  router.post('/:id/approve', validateId, roleMiddleware('mgr'), async (req, res) => {
    const id = req.params.id;
    const leave = await leaveService.approve(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  // POST /api/approval/:id/sendback — ส่งกลับแก้ไข (stamp B)
  router.post('/:id/sendback', validateId, async (req, res) => {
    const id = req.params.id;
    const leave = await leaveService.sendBack(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  // POST /api/approval/:id/reject — ไม่อนุมัติ (stamp U)
  router.post('/:id/reject', validateId, async (req, res) => {
    const id = req.params.id;
    const leave = await leaveService.reject(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  // POST /api/approval/:id/cancel — ยกเลิก (stamp C)
  router.post('/:id/cancel', validateId, async (req, res) => {
    const id = req.params.id;
    const leave = await leaveService.cancel(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  return router;
};