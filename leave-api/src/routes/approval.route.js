const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

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

  // POST /api/approval/:id/approve — อนุมัติ (stamp S)
  router.post('/:id/approve', async (req, res) => {
    // ⚠️ เดิม: const id = parseInt(req.params.id) — id ตัวเลข
    // พอเป็น Supabase → id เป็น UUID string ใช้ req.params.id ตรงๆ
    const id = req.params.id;
    const leave = await leaveService.approve(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  // POST /api/approval/:id/sendback — ส่งกลับแก้ไข (stamp B)
  router.post('/:id/sendback', async (req, res) => {
    const id = req.params.id;
    const leave = await leaveService.sendBack(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  // POST /api/approval/:id/reject — ไม่อนุมัติ (stamp U)
  router.post('/:id/reject', async (req, res) => {
    const id = req.params.id;
    const leave = await leaveService.reject(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  // POST /api/approval/:id/cancel — ยกเลิก (stamp C)
  router.post('/:id/cancel', async (req, res) => {
    const id = req.params.id;
    const leave = await leaveService.cancel(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  return router;
};