function errorHandler(err, req, res, next) {
  const log = { message: err.message, stack: err.stack, code: err.code, details: err.details, hint: err.hint, statusCode: err.statusCode, path: req.originalUrl };
  console.error('[Error]', JSON.stringify(log, null, 2));
  if (err.statusCode) return res.status(err.statusCode).json({ message: err.message });
  if (err.code === '42501' || (err.message && err.message.includes('permission denied'))) {
    return res.status(500).json({ message: 'permission denied — กรุณารัน sql/grants.sql และเช็ค SUPABASE_SECRET_KEY', detail: err.message });
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
