function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message || err);
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ' });
}

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, AppError };
