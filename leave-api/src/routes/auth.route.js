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
      const result = await authService.login(req.body.username, req.body.password);
      res.json(result);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  });

  return router;
};
