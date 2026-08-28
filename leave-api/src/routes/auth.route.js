const { Router } = require('express');

module.exports = function (authService) {
  const router = Router();

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      if (!req.body || typeof req.body.username !== 'string' || typeof req.body.password !== 'string') {
        return res.status(400).json({ message: 'กรุณากรอก username และ password' });
      }
      const result = await authService.login(req.body.username, req.body.password);
      res.json(result);
    } catch (err) {
      const msg = err.message || 'เข้าสู่ระบบไม่สำเร็จ';
      // 400 สำหรับ validation, 401 สำหรับ credential ผิด
      const isValidation = msg.includes('กรุณากรอก') || msg.includes('ข้อมูลไม่ถูกต้อง');
      res.status(isValidation ? 400 : 401).json({ message: msg });
    }
  });

  return router;
};
