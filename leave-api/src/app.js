const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
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

const { errorHandler } = require('./middleware/error.middleware');
const authMiddleware = require('./middleware/auth.middleware');
const roleMiddleware = require('./middleware/role.middleware');
const auditLogMiddleware = require('./middleware/audit-log.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: ถ้ามี FRONTEND_URL ให้ล็อค origin ตาม env (production), ถ้าไม่มีให้เปิดทั้งหมด (dev)
const corsOptions = {
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ★ เลือก data layer: มี Supabase จริง → ใช้ SupabaseStore, ไม่งั้นใช้ InMemory
// เดิมบรรทัดนี้มีแค่: const db = new InMemoryStore();
const db = supabaseClient ? new SupabaseStore(supabaseClient) : new InMemoryStore();
app.set('db', db);

app.use(auditLogMiddleware(db));

// Serve uploads as static files
// NOTE: /uploads static ใช้ได้แค่ local (diskStorage). บน Vercel ไฟล์อยู่ใน Supabase Storage (memoryStorage) — ไม่ได้เก็บใน filesystem
const { UPLOAD_PATH } = require('./middleware/upload.middleware');
app.use('/uploads', express.static(path.resolve(UPLOAD_PATH)));

// Init services
const authService = new AuthService(db);
const leaveService = new LeaveService(db);
const fileService = new FileService(db);
const documentService = new DocumentService(db);

// Routes — API มาก่อน SPA catch-all
app.use('/api/auth', authRoute(authService));
app.use('/api/leave', leaveRoute(leaveService));
app.use('/api/approval', approvalRoute(leaveService));
app.use('/api/leave', fileRoute(fileService));
app.use('/api/approval', documentRoute(documentService));
app.use('/api/approval', verificationFileRoute(fileService));

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
  await db.seed();
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
