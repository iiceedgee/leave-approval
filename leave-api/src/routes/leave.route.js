const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { isValidId } = require('../middleware/upload.middleware');

function validateId(req, res, next) {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'รหัสคำขอไม่ถูกต้อง' });
  next();
}

module.exports = function (leaveService) {
  const router = Router();

  router.use(authMiddleware);

  // ★ GET /api/leave/my-history — ดึงประวัติการลาของตัวเอง (ต้องอยู่ก่อน /:id)
  router.get('/my-history', async (req, res, next) => {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();
      const history = await leaveService.getMyHistory(req.user.id, year);
      res.json(history);
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
    try { const leaves = await leaveService.getLeaves(req.user.id, req.user.role); res.json(leaves); } catch(err){ next(err); }
  });

  // POST /api/leave — พนักงานยื่นคำขอลา
  router.post('/', roleMiddleware('emp'), async (req, res, next) => {
    try { const leave = await leaveService.create(req.user.id, req.body); res.status(201).json(leave); } catch(err){ next(err); }
  });

  // GET /api/leave/:id — ดูรายละเอียดคำขอ (ต้องอยู่ท้ายสุดของ GET routes)
  router.get('/:id', validateId, async (req, res, next) => {
    try {
      const id = req.params.id;
      const leave = await leaveService.getById(id);
      if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });
      res.json(leave);
    } catch(err){ next(err); }
  });

  // POST /api/leave/:id/resubmit — พนักงานส่งใหม่หลังจากถูกส่งกลับ
  router.post('/:id/resubmit', validateId, roleMiddleware('emp'), async (req, res, next) => {
    try {
      const id = req.params.id;
      const leave = await leaveService.resubmit(id, req.user.id, req.body);
      if (!leave) return res.status(400).json({ message: 'ไม่สามารถส่งใหม่ได้' });
      res.json(leave);
    } catch(err){ next(err); }
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

  // GET /api/leave/:id/stepper — ★ ดึง stepper steps
  router.get('/:id/stepper', validateId, async (req, res, next) => {
    try {
      const id = req.params.id;
      const steps = await leaveService.getStepper(id);
      res.json(steps);
    } catch(err){ next(err); }
  });

  // GET /api/leave/:id/history — ★ ดึงประวัติการเปลี่ยนแปลง
  router.get('/:id/history', validateId, async (req, res, next) => {
    try {
      const id = req.params.id;
      const history = await leaveService.getHistory(id);
      res.json(history);
    } catch(err){ next(err); }
  });

  return router;
};
