/**
 * uploadController.js
 *
 * Handles:
 *   POST /api/uploads/avatar     — customer profile picture
 *   POST /api/uploads/vehicle/:vehicleId/or  — Official Receipt doc
 *   POST /api/uploads/vehicle/:vehicleId/cr  — Certificate of Registration doc
 *   DELETE /api/uploads/:id      — delete an upload record + disk file
 */

const { createClient } = require('@supabase/supabase-js');
const { User, Vehicle, Upload } = require('../models/index');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to upload to Supabase Storage
async function uploadToSupabase(file, bucket, folder = '') {
  const ext = file.originalname.split('.').pop();
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { publicUrl, fileName };
}

// ── POST /api/uploads/avatar ─────────────────────────────────────────────────
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { publicUrl, fileName } = await uploadToSupabase(req.file, 'avatars');

    // Persist upload record
    const upload = await Upload.create({
      userId:       req.user.id,
      entityType:   'user_avatar',
      entityId:     req.user.id,
      filename:     fileName,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      url:          publicUrl,
    });

    // Update user profile picture URL
    const user = await User.findByPk(req.user.id);
    if (user) await user.update({ profilePicture: publicUrl });

    res.json({ success: true, data: { url: publicUrl, upload: upload.toJSON() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/uploads/vehicle/:vehicleId/or ──────────────────────────────────
const uploadOrDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const vehicleId = parseInt(req.params.vehicleId, 10);
    const vehicle = await Vehicle.findOne({ where: { id: vehicleId, userId: req.user.id } });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const { publicUrl, fileName } = await uploadToSupabase(req.file, 'vehicles', 'or');

    const upload = await Upload.create({
      userId:       req.user.id,
      entityType:   'vehicle_or',
      entityId:     vehicleId,
      filename:     fileName,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      url:          publicUrl,
    });

    // Save the URL on the vehicle row
    await vehicle.update({ orDoc: publicUrl });

    res.json({ success: true, data: { url: publicUrl, upload: upload.toJSON() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/uploads/vehicle/:vehicleId/cr ──────────────────────────────────
const uploadCrDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const vehicleId = parseInt(req.params.vehicleId, 10);
    const vehicle = await Vehicle.findOne({ where: { id: vehicleId, userId: req.user.id } });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const { publicUrl, fileName } = await uploadToSupabase(req.file, 'vehicles', 'cr');

    const upload = await Upload.create({
      userId:       req.user.id,
      entityType:   'vehicle_cr',
      entityId:     vehicleId,
      filename:     fileName,
      originalName: req.file.originalname,
      mimeType:     req.file.mimetype,
      size:         req.file.size,
      url:          publicUrl,
    });

    await vehicle.update({ crDoc: publicUrl });

    res.json({ success: true, data: { url: publicUrl, upload: upload.toJSON() } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/uploads/:id ──────────────────────────────────────────────────
const deleteUpload = async (req, res) => {
  try {
    const record = await Upload.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Upload not found' });
    }

    // Delete from Supabase Storage
    const bucket = record.entityType === 'user_avatar' ? 'avatars' : 'vehicles';
    const folder = record.entityType === 'vehicle_or' ? 'or' : record.entityType === 'vehicle_cr' ? 'cr' : '';
    const filePath = folder ? `${folder}/${record.filename}` : record.filename;

    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) throw error;

    await record.destroy();
    res.json({ success: true, message: 'File deleted from Supabase' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/uploads/my ─────────────────────────────────────────────────────
const getMyUploads = async (req, res) => {
  try {
    const uploads = await Upload.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: uploads.map(u => u.toJSON()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { uploadAvatar, uploadOrDoc, uploadCrDoc, deleteUpload, getMyUploads };
