const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads';

// Vercel filesystem is read-only (except /tmp) — ต้องใช้ memoryStorage บน Vercel
// แล้วให้ FileService อัปโหลด buffer ต่อไปยัง Supabase Storage
// Local (dev/test) ยังใช้ diskStorage เหมือนเดิมเพื่อให้ flow เดิมไม่เปลี่ยน
const isVercel = !!process.env.VERCEL;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidId(id) {
  if (!id || typeof id !== 'string') return false;
  // รับทั้ง UUID (supabase) และตัวเลข (legacy/in-memory) แต่ต้องไม่มี / \ . หรือ ..
  if (UUID_RE.test(id)) return true;
  if (/^\d+$/.test(id)) return true;
  return false;
}

const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const id = req.params.id;
        if (!isValidId(id)) return cb(new Error('รหัสคำขอไม่ถูกต้อง'));
        const dir = path.resolve(UPLOAD_PATH, String(id));
        if (!dir.startsWith(path.resolve(UPLOAD_PATH))) return cb(new Error('Invalid path'));
        try {
          require('fs').mkdirSync(dir, { recursive: true });
        } catch (e) {
          return cb(new Error('สร้างโฟลเดอร์ไม่ได้'));
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uuidv4()}${ext}`);
      },
    });

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  // Fallback: some browsers/OS report .docx as octet-stream or zip; allow by extension
  const ext = path.extname(file.originalname).toLowerCase();
  const genericMimes = ['application/octet-stream', 'application/zip'];
  if (ext === '.docx' && genericMimes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error('อนุญาตเฉพาะไฟล์ PDF, JPG, PNG, DOCX เท่านั้น'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'ไฟล์มีขนาดเกิน 10MB' });
    if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'อัปโหลดได้สูงสุด 5 ไฟล์' });
    return res.status(400).json({ message: err.message });
  }
  if (err) return res.status(400).json({ message: err.message });
  next();
}

module.exports = { upload, handleMulterError, UPLOAD_PATH, isValidId };
