const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

module.exports = function (leaveService) {
  const router = Router();

  router.use(authMiddleware);

  // ★ GET /api/leave/my-history — ดึงประวัติการลาของตัวเอง (ต้องอยู่ก่อน /:id)
  router.get('/my-history', async (req, res) => {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const history = await leaveService.getMyHistory(req.user.id, year);
    res.json(history);
  });

  // ★ GET /api/leave/my-balance — ดึงยอดคงเหลือการลาของตัวเอง (ต้องอยู่ก่อน /:id)
  router.get('/my-balance', async (req, res) => {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const balance = await leaveService.getMyBalance(req.user.id, year);
    res.json(balance);
  });

  // GET /api/leave — ดึงรายการคำขอลาตาม role
  router.get('/', async (req, res) => {
    const leaves = await leaveService.getLeaves(req.user.id, req.user.role);
    res.json(leaves);
  });

  // POST /api/leave — พนักงานยื่นคำขอลา
  router.post('/', roleMiddleware('emp'), async (req, res) => {
    const leave = await leaveService.create(req.user.id, req.body);
    res.status(201).json(leave);
  });

  // GET /api/leave/:id — ดูรายละเอียดคำขอ (ต้องอยู่ท้ายสุดของ GET routes)
  router.get('/:id', async (req, res) => {
    // ⚠️ เดิม: const id = parseInt(req.params.id) — ตอนนั้น id เป็นตัวเลข 1,2,3
    // พอเชื่อม Supabase → id เปลี่ยนเป็น UUID (เช่น 550e8400-...) ต้องใช้ string ตรงๆ
    const id = req.params.id;
    const leave = await leaveService.getById(id);
    if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });
    res.json(leave);
  });

  // POST /api/leave/:id/resubmit — พนักงานส่งใหม่หลังจากถูกส่งกลับ
  router.post('/:id/resubmit', roleMiddleware('emp'), async (req, res) => {
    const id = req.params.id;
    const leave = await leaveService.resubmit(id, req.user.id, req.body);
    if (!leave) return res.status(400).json({ message: 'ไม่สามารถส่งใหม่ได้' });
    res.json(leave);
  });

  // POST /api/leave/:id/cancel — พนักงานยกเลิกคำขอตัวเอง
  router.post('/:id/cancel', roleMiddleware('emp'), async (req, res) => {
    const id = req.params.id;
    const result = await leaveService.cancel(id, req.user.id, 'emp', req.body.remark);
    if (!result) return res.status(404).json({ message: 'ไม่พบคำขอ' });
    if (result.error) return res.status(400).json({ message: result.error });
    res.json(result);
  });

  // GET /api/leave/:id/stepper — ★ ดึง stepper steps
  router.get('/:id/stepper', async (req, res) => {
    const id = req.params.id;
    const steps = await leaveService.getStepper(id);
    res.json(steps);
  });

  // GET /api/leave/:id/history — ★ ดึงประวัติการเปลี่ยนแปลง
  router.get('/:id/history', async (req, res) => {
    const id = req.params.id;
    const history = await leaveService.getHistory(id);
    res.json(history);
  });

  return router;
};