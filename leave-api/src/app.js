const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
require('express-async-errors');
const cors = require('cors');

const { InMemoryStore } = require('./store');
const { SupabaseStore } = require('./db/supabase-store');
const supabaseClient = require('./db/supabase');

// ╔══════════════════════════════════════════════════════════╗
// ║  ⚠️ BEFORE — โค้ดเดิม (ก่อนมี Supabase):                  ║
// ║    const db = new InMemoryStore();                        ║
// ║    // ใช้เพียงตัวเดียว ข้อมูลอยู่ในเครื่อง เสียบไม่ได้เลย    ║
// ╚══════════════════════════════════════════════════════════╝
// AFTER — มี Supabase ช่วย:
//   - supabaseClient = ตัว client จาก db/supabase.js
//     (ถ้า .env ใส่ของจริงครบ → ไม่ใช่ null)
//   - มี Supabase จริง → ใช้ SupabaseStore (ข้อมูลไม่หาย)
//   - ไม่มี / เป็นค่า placeholder → ใช้ InMemoryStore (fallback)

const AuthService = require('./services/auth.service');
const LeaveService = require('./services/leave.service');
const FileService = require('./services/file.service');
const DocumentService = require('./services/document.service');

const authRoute = require('./routes/auth.route');
const leaveRoute = require('./routes/leave.route');
const approvalRoute = require('./routes/approval.route');
const fileRoute = require('./routes/file.route');
const documentRoute = require('./routes/document.route');
const verificationFileRoute = require('./routes/verification-file.route');
const debugRoute = require('./routes/debug.route');

const { errorHandler } = require('./middleware/error.middleware');
const authMiddleware = require('./middleware/auth.middleware');
const roleMiddleware = require('./middleware/role.middleware');
const auditLogMiddleware = require('./middleware/audit-log.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: ถ้ามี FRONTEND_URL ให้ล็อคตาม env (รองรับหลาย origin คั่นด้วย ,), ถ้าไม่มีให้ล็อค allow-list dev
const corsOptions = {
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean)
    : ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// P0: simple rate limiter for auth (10 req/min per IP) — กัน brute-force
const rateLimitMap = new Map();
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/auth')) return next();
  const ip = req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'local';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const max = 10;
  const entry = rateLimitMap.get(ip) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  if (entry.count > max) return res.status(429).json({ message: 'Too many requests — ลองใหม่ใน 1 นาที' });
  next();
});

// ★ เลือก data layer: มี Supabase จริง → ใช้ SupabaseStore, ไม่งั้นใช้ InMemory
// เดิมบรรทัดนี้มีแค่: const db = new InMemoryStore();
const db = supabaseClient ? new SupabaseStore(supabaseClient) : new InMemoryStore();
app.set('db', db);

app.use(auditLogMiddleware(db));

// Serve uploads as static files — กันไฟล์หลุด: ต้อง auth + canAccess ก่อน (P0: ปิด public static)
// บน Vercel (VERCEL=1) ไฟล์อยู่ Supabase Storage (memoryStorage) — ไม่ต้อง serve static เลย
// บน local ต้องเช็คว่าไฟล์นั้นเป็นของ user จริงก่อนส่ง
const { UPLOAD_PATH } = require('./middleware/upload.middleware');
if (!process.env.VERCEL) {
  // local/dev: /uploads/:id/:filename ต้องผ่าน auth + check สิทธิ์ (กัน IDOR + public leak)
  app.use('/uploads', authMiddleware, async (req, res, next) => {
    try {
      // req.path = /<leaveId>/<filename> — ดึง leaveId จาก path
      const parts = req.path.split('/').filter(Boolean);
      const leaveId = parts[0];
      if (!leaveId) return res.status(400).json({ message: 'รหัสคำขอไม่ถูกต้อง' });
      // reuse canAccess logic แบบ file.route.js:15 (owner/hr/mgr same department)
      const dbRef = app.get('db');
      const leave = await dbRef.getLeaveById(leaveId);
      if (!leave) return res.status(404).json({ message: 'ไม่พบคำขอ' });
      if (leave.user_id === req.user.id) return next();
      if (req.user.role === 'hr') return next();
      if (req.user.role === 'mgr') {
        const mgr = await dbRef.findUserById(req.user.id);
        const owner = await dbRef.findUserById(leave.user_id);
        if (owner && mgr && owner.department === mgr.department) return next();
      }
      return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงไฟล์นี้' });
    } catch (e) {
      console.error('[uploads static] auth check error', e.message);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดตรวจสอบสิทธิ์' });
    }
  }, express.static(path.resolve(UPLOAD_PATH)));
} else {
  // Vercel: บล็อค /uploads static ทั้งหมด — ให้ใช้ GET /api/leave/:id/files/:fileId (createSignedUrl) เท่านั้น
  app.use('/uploads', (req, res) => res.status(404).json({ message: 'ใช้ /api/leave/:id/files/:fileId แทน' }));
}

// Init services
const authService = new AuthService(db);
const leaveService = new LeaveService(db);
const fileService = new FileService(db);
const documentService = new DocumentService(db);

// Routes — API มาก่อน SPA catch-all
app.use('/api/auth', authRoute(authService));
app.use('/api/leave', leaveRoute(leaveService, fileService));
app.use('/api/approval', approvalRoute(leaveService));
app.use('/api/leave', fileRoute(fileService));
app.use('/api/approval', documentRoute(documentService));
app.use('/api/approval', verificationFileRoute(fileService));
// P0: debug ปิดใน prod ถ้าไม่เปิด ENABLE_DEBUG
if (process.env.ENABLE_DEBUG === '1' || process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoute(supabaseClient));
}

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const counts = await db.getCounts();
    res.json({ status: 'ok', users: counts.users, leaves: counts.leaves });
  } catch (e) {
    console.error('[health]', e);
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// Audit logs (HR only)
app.get('/api/audit-logs', authMiddleware, roleMiddleware('hr'), (req, res) => {
  res.json(db.auditLogs);
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// Serve Angular SPA — เฉพาะ local เท่านั้น
// บน Vercel (process.env.VERCEL=1) ให้ API อย่างเดียว, SPA อยู่ project angular-ui แยก → กัน ENOENT /var/task/angular-ui/dist
if (!process.env.VERCEL) {
  const angularDistPath = path.join(__dirname, '..', '..', 'angular-ui', 'dist');
  const fs = require('fs');
  if (fs.existsSync(angularDistPath)) {
    app.use(express.static(angularDistPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(angularDistPath, 'index.html'));
    });
  }
} else {
  app.get('/', (req, res) => res.json({ status: 'ok', message: 'Leave API — use /api/health' }));
}

// Start — แยกสำหรับ local vs Vercel serverless
// Vercel จะ import app ผ่าน api/index.js โดยไม่ต้อง listen, local ใช้ node src/app.js ถึงจะ listen
async function start() {
  try {
    await db.seed();
  } catch (e) {
    console.error('[DB] seed failed:', e.message);
  }
  app.listen(PORT, () => {
    console.log(`\n🚀 Leave API running at http://localhost:${PORT}`);
    console.log(`💾 Data layer: ${supabaseClient ? 'Supabase (Postgres)' : 'In-Memory (fallback)'}`);
    console.log(`📋 API Endpoints:`);
    console.log(`   POST /api/auth/login`);
    console.log(`   POST /api/auth/register`);
    console.log(`   GET  /api/leave`);
    console.log(`   POST /api/leave`);
    console.log(`   GET  /api/leave/:id`);
    console.log(`   POST /api/leave/:id/resubmit`);
    console.log(`   POST /api/leave/:id/cancel`);
    console.log(`   POST /api/leave/:id/files   ★ upload files`);
    console.log(`   GET  /api/leave/:id/files   ★ list files`);
    console.log(`   DELETE /api/leave/:id/files/:fileId`);
    console.log(`   GET  /api/leave/:id/stepper  ★ stepper`);
    console.log(`   GET  /api/leave/:id/history  ★ history`);
    console.log(`   POST /api/approval/:id/approve`);
    console.log(`   POST /api/approval/:id/sendback`);
    console.log(`   POST /api/approval/:id/reject`);
    console.log(`   POST /api/approval/:id/pretemp/pass   ★ doc verif`);
    console.log(`   POST /api/approval/:id/pretemp/sendback`);
    console.log(`   POST /api/approval/:id/temp/pass`);
    console.log(`   POST /api/approval/:id/temp/sendback`);
    console.log(`   GET  /api/approval/:id/verifications`);
    console.log(`\n🌐 Serving:`);
    console.log(`   Angular SPA → http://localhost:${PORT}`);
    console.log(`   Angular Dev → http://localhost:4200 (ng serve)`);
    console.log(`\n👤 Test accounts (password: 123456):`);
    console.log(`   emp01 (พนักงาน), emp02 (พนักงาน)`);
    console.log(`   mgr01 (หัวหน้า)`);
    console.log(`   hr01 (HR)\n`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
