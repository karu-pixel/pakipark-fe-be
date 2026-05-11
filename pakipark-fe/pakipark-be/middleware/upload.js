/**
 * upload.js — Multer middleware for PakiPark file uploads
 *
 * Stores files on disk under  src/backend/uploads/<sub-folder>/
 * Sub-folders:
 *   avatars/   — customer profile pictures
 *   vehicles/  — OR / CR documents attached to vehicles
 *
 * Allowed mime types:
 *   • Images : image/jpeg, image/png, image/webp, image/gif
 *   • Docs   : application/pdf
 *
 * Max file size : 5 MB
 */

const path   = require('path');
const fs     = require('fs');
const multer = require('multer');

// ── Ensure upload directories exist ─────────────────────────────────────────
const ROOT = path.join(__dirname, '..', 'uploads');
['avatars', 'vehicles'].forEach(d => {
  const dir = path.join(ROOT, d);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Storage engine (Memory storage for Supabase) ───────────────────────────
const storage = multer.memoryStorage();

// ── File filter ──────────────────────────────────────────────────────────────
const ALLOWED = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
];

function fileFilter(req, file, cb) {
  if (ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
}

// ── Multer instance ──────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Convenience middleware factories ─────────────────────────────────────────

/** Single-file upload for profile avatars (field name: "avatar") */
function avatarUpload(req, res, next) {
  req.uploadFolder = 'avatars';
  upload.single('avatar')(req, res, next);
}

/** Single-file upload for vehicle OR doc (field name: "orDoc") */
function orDocUpload(req, res, next) {
  req.uploadFolder = 'vehicles';
  upload.single('orDoc')(req, res, next);
}

/** Single-file upload for vehicle CR doc (field name: "crDoc") */
function crDocUpload(req, res, next) {
  req.uploadFolder = 'vehicles';
  upload.single('crDoc')(req, res, next);
}

/** Accept any one file in either orDoc or crDoc field */
function vehicleDocUpload(req, res, next) {
  req.uploadFolder = 'vehicles';
  upload.fields([
    { name: 'orDoc', maxCount: 1 },
    { name: 'crDoc', maxCount: 1 },
  ])(req, res, next);
}

module.exports = { avatarUpload, orDocUpload, crDocUpload, vehicleDocUpload };
