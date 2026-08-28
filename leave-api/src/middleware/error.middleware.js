function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const log = { message: err.message, code: err.code, statusCode: err.statusCode, path: req.originalUrl };
  // ไม่ log stack ออก console แบบ verbose เกิน — พอให้ debug ได้
  console.error('[Error]', JSON.stringify(log));
  if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
  if (err.code === '42501' || (err.message && err.message.includes('permission denied'))) {
    return res.status(500).json({ message: 'permission denied — กรุณารัน sql/grants.sql และเช็ค SUPABASE_SECRET_KEY' });
  }
  // ถ้าเป็น JSON parse error จาก express.json
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ message: 'รูปแบบ JSON ไม่ถูกต้อง' });
  }
  res.status(500).json({ message: err.message || 'เกิดข้อผิดพลาดภายในระบบ' });
}

process.on('unhandledRejection', r=>console.error('[UnhandledRejection]', JSON.stringify(r,null,2)));

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, AppError };
