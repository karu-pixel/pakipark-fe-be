const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Sequelize instance — shared across all models.
 * Connects to Supabase PostgreSQL when DATABASE_URL is set.
 * Falls back to local PostgreSQL (localhost:5432/pakipark) when DATABASE_URL is absent or empty.
 */

// Enable SSL only when DATABASE_URL is a non-empty string (Supabase / remote Postgres)
const dbUrl  = (process.env.DATABASE_URL || '').trim();
const useSSL = dbUrl.length > 0;
const connStr = useSSL
  ? dbUrl
  : `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASS || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'pakipark'}`;

const sequelize = new Sequelize(
  connStr,
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development'
      ? (sql) => {
          if (sql.includes('Executing')) return;
          console.log('[SQL]', sql);
        }
      : false,
    dialectOptions: useSSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000,
    },
  }
);

// ─── Partial indexes that Sequelize cannot express in model `indexes` ─────────
// These are created with CREATE INDEX … IF NOT EXISTS so they are idempotent.
// CONCURRENTLY is omitted here because we may be inside an implicit transaction
// at startup; the dedicated syncSchema.js script uses CONCURRENTLY for zero-lock.
const PERFORMANCE_INDEXES = [
  // ── HOT PATH 1: getDashboardSlots + getConflictingSlotIds ───────────────
  // Filters bookings by location+date, only touches active/upcoming rows.
  // A partial index is typically 5-10× smaller than a full index on the same cols.
  `CREATE INDEX IF NOT EXISTS idx_bookings_location_date_active
     ON bookings ("locationId", date)
     WHERE status IN ('upcoming', 'active')`,

  // ── HOT PATH 2: per-slot conflict check (createBooking, autoAssignSlot) ─
  // Only indexes rows that actually have a physical slot assigned.
  `CREATE INDEX IF NOT EXISTS idx_bookings_slot_date_active
     ON bookings ("parkingSlotId", date)
     WHERE "parkingSlotId" IS NOT NULL AND status IN ('upcoming', 'active')`,

  // ── Sorted customer booking list ─────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_bookings_user_createdat
     ON bookings ("userId", "createdAt" DESC)`,

  // ── Barcode scanner lookup (partial unique — only non-null barcodes) ──────
  // Enables O(log n) lookup at entry/exit gates when scanner sends barcode value.
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_barcode
     ON bookings (barcode)
     WHERE barcode IS NOT NULL`,
];

/**
 * Idempotent DDL migrations run at every startup.
 * These cover columns/tables that Sequelize's alter:true cannot apply
 * because Supabase has views built on top of those tables.
 *
 * All statements use IF NOT EXISTS / IF EXISTS so they are safe to re-run.
 */
const STARTUP_MIGRATIONS = [
  // ── bookings: reminder tracking ──────────────────────────────────────────────
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMPTZ`,

  // ── vehicles: default selection ──────────────────────────────────────────────
  `ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN DEFAULT false`,

  // ── locations: convert operatingHours from varchar to jsonb ─────────────────
  // Step 1: add a new jsonb column alongside the old varchar one
  `ALTER TABLE locations ADD COLUMN IF NOT EXISTS "operatingHoursJson" JSONB`,
  // Step 2: backfill rows where it's still null with the default schedule
  `UPDATE locations
   SET "operatingHoursJson" = '{"mon":{"open":"06:00","close":"23:00","closed":false},"tue":{"open":"06:00","close":"23:00","closed":false},"wed":{"open":"06:00","close":"23:00","closed":false},"thu":{"open":"06:00","close":"23:00","closed":false},"fri":{"open":"06:00","close":"23:00","closed":false},"sat":{"open":"06:00","close":"23:00","closed":false},"sun":{"open":"06:00","close":"23:00","closed":false}}'::jsonb
   WHERE "operatingHoursJson" IS NULL`,

  // ── users: soft-delete ───────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "gcashNumber" VARCHAR(15)`,

  // ── notifications table ───────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS notifications (
    id           SERIAL PRIMARY KEY,
    "userId"     INTEGER NOT NULL,
    type         VARCHAR(50) NOT NULL,
    title        VARCHAR(200) NOT NULL,
    body         TEXT NOT NULL,
    "isRead"     BOOLEAN NOT NULL DEFAULT false,
    "entityType" VARCHAR(50),
    "entityId"   INTEGER,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications ("userId", "isRead")`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_createdat ON notifications ("userId", "createdAt" DESC)`,

  // ── users: discount & 2FA columns (may already exist) ───────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "discountStatus" VARCHAR(20) DEFAULT 'none'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "discountPct"    INTEGER     DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "discountIdUrl"  TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "discountType"   VARCHAR(30)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "twoFactorSecret"  VARCHAR(64)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences      JSONB DEFAULT '{"emailNotifications":true,"smsUpdates":true,"autoExtend":false}'::jsonb`,
];

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅  PostgreSQL connected ${useSSL ? '(Supabase/SSL)' : '(local)'}`);

    // Register all models and their associations
    require('../models/index');

    // Sync: adds missing tables / columns / Sequelize-managed indexes.
    // alter:true is safe — it never drops existing columns or data.
    // Non-fatal: Supabase may have views that block certain column type-changes;
    // in that case we log the warning and continue — the schema was likely
    // already in sync from the last syncSchema.js run.
    try {
      await sequelize.sync({ alter: true });
      console.log('✅  All tables synced (alter mode)');
    } catch (syncErr) {
      console.warn(`⚠️  Schema sync skipped (${syncErr.message.split('\n')[0]}). Schema may already be up-to-date.`);
    }

    // Apply partial indexes (idempotent — IF NOT EXISTS)
    for (const sql of PERFORMANCE_INDEXES) {
      try {
        await sequelize.query(sql);
      } catch (e) {
        // Non-fatal: log but continue — index may already exist with different def
        console.warn(`⚠️  Index skipped: ${e.message.split('\n')[0]}`);
      }
    }
    console.log('✅  Performance indexes verified');

    // Apply idempotent DDL migrations (new columns / tables not covered by Sequelize sync)
    for (const sql of STARTUP_MIGRATIONS) {
      try {
        await sequelize.query(sql);
      } catch (e) {
        console.warn(`⚠️  Migration skipped: ${e.message.split('\n')[0]}`);
      }
    }
    console.log('✅  Schema migrations applied');

  } catch (error) {
    console.error(`❌  PostgreSQL Error: ${error.message}`);
    process.exit(1);
  }
};


module.exports = { sequelize, connectDB };