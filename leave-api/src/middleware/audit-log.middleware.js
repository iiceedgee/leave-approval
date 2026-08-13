const MAX_AUDIT_LOGS = 1000;

module.exports = function (store) {
  return function auditLogMiddleware(req, res, next) {
    if (!req.path.startsWith('/api/')) return next();

    const start = process.hrtime.bigint();

    const log = () => {
      if (!res.writableFinished) return;
      const entry = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Number(process.hrtime.bigint() - start) / 1e6,
        userId: req.user?.id ?? null,
        ip: (req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown').trim(),
        timestamp: new Date().toISOString(),
      };
      store.auditLogs.push(entry);
      if (store.auditLogs.length > MAX_AUDIT_LOGS) {
        store.auditLogs.splice(0, store.auditLogs.length - MAX_AUDIT_LOGS);
      }
    };

    res.on('finish', log);
    res.on('close', log);

    next();
  };
};
