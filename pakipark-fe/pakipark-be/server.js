const path    = require('path');
const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const { connectDB }              = require('./config/db');
const corsOptions                = require('./config/cors');
const { startForfeitureScheduler } = require('./services/forfeitureScheduler');

// Load environment variables
dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static file serving — uploaded avatars & vehicle docs ─────────────────────
// Files stored in:  src/Backend/uploads/{avatars|vehicles}/
// Accessible at :  http://localhost:5000/uploads/{avatars|vehicles}/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Connect to PostgreSQL then start background jobs ──────────────────────────
connectDB().then(() => {
  startForfeitureScheduler();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/bookings',      require('./routes/bookingRoutes'));
app.use('/api/vehicles',      require('./routes/vehicleRoutes'));
app.use('/api/locations',     require('./routes/locationRoutes'));
app.use('/api/analytics',     require('./routes/analyticsRoutes'));
app.use('/api/reviews',       require('./routes/reviewRoutes'));
app.use('/api/settings',      require('./routes/settingsRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/parking-slots', require('./routes/parkingSlotRoutes'));
app.use('/api/logs',          require('./routes/logsRoutes'));
app.use('/api/uploads',       require('./routes/uploadRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'postgresql', timestamp: new Date().toISOString() });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  // Handle multer file-size / type errors gracefully
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large (max 5 MB)' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`PakiPark API server running on port ${PORT} (PostgreSQL)`);
});

module.exports = app;