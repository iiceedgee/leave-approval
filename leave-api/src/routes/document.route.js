const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

function handleResult(leave, res) {
  if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });
  if (leave.error) {
    const code = leave.statusCode === 409 ? 409 : 400;
    return res.status(code).json({ message: leave.error });
  }
  res.json(leave);
}

module.exports = function (documentService) {
  const router = Router();
  router.use(authMiddleware);
  router.use(roleMiddleware('mgr', 'hr'));

  router.post('/:id/pretemp/pass', async (req, res) => {
    const id = req.params.id;
    const leave = await documentService.pretempPass(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  router.post('/:id/pretemp/sendback', async (req, res) => {
    const id = req.params.id;
    if (!req.body.remark) return res.status(400).json({ message: 'กรุณาระบุเหตุผลที่ส่งกลับ' });
    const leave = await documentService.pretempSendBack(id, req.user.id, req.user.role, req.body.remark);
    handleResult(leave, res);
  });

  // VC merged into DC — temp routes deprecated, kept for backward compat with migration message
  router.post('/:id/temp/pass', async (req, res) => {
    return res.status(410).json({
      message: 'Workflow migrated: VC step removed (DC+VC → DC). Use POST /:id/pretemp/pass (DC → MA) instead.',
      migrated: true,
      use: 'pretemp/pass',
    });
  });

  router.post('/:id/temp/sendback', async (req, res) => {
    return res.status(410).json({
      message: 'Workflow migrated: VC step removed (DC+VC → DC). Use POST /:id/pretemp/sendback instead.',
      migrated: true,
      use: 'pretemp/sendback',
    });
  });

  router.get('/:id/verifications', async (req, res) => {
    const id = req.params.id;
    const verifications = await documentService.getVerifications(id);
    res.json(verifications);
  });

  return router;
};