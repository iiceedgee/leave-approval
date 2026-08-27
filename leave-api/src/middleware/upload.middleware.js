const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads';

// Vercel filesystem is read-only (except /tmp) — ต้องใช้ memoryStorage บน Vercel
// แล้วให้ FileService อัปโหลด buffer ต่อไปยัง Supabase Storage
// Local (dev/test) ยังใช้ diskStorage เหมือนเดิมเพื่อให้ flow เดิมไม่เปลี่ยน
const isVercel = !!process.env.VERCEL;

const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const id = req.params.id;
        if (!id) return cb(new Error('Invalid leave ID'));
        const dir = path.resolve(UPLOAD_PATH, String(id));
        if (!dir.startsWith(path.resolve(UPLOAD_PATH))) return cb(new Error('Invalid path'));
        require('fs').mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
      },
    });

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('อนุญาตเฉพาะไฟล์ PDF, JPG, PNG, DOCX เท่านั้น'), false);
  }
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

module.exports = { upload, handleMulterError, UPLOAD_PATH };
