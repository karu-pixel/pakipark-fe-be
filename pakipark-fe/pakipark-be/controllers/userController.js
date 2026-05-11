'use strict';
/**
 * userController.js
 * =================
 * Handles profile management, verification, discount requests, 2FA.
 */

const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const { User } = require('../models/index');
const notificationService = require('../services/notificationService');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** PH mobile: 09XXXXXXXXX or +639XXXXXXXXX */
const PH_PHONE_RE = /^(\+639|09)\d{9}$/;

/** Return true if a value is a non-empty string */
const filled = (v) => typeof v === 'string' && v.trim().length > 0;

/** Return true if address object has at least a street & city */
const addressFilled = (addr) => {
  if (!addr) return false;
  if (typeof addr === 'string') return addr.trim().length > 0;
  return filled(addr.street) || filled(addr.city);
};

/**
 * Re-compute isVerified after any profile update.
 * Rules: valid phone number AND dateOfBirth set AND address non-empty
 */
function shouldBeVerified(user) {
  const phoneOk   = PH_PHONE_RE.test((user.phone || '').trim());
  const dobOk     = filled(user.dateOfBirth);
  const addrOk    = addressFilled(user.address);
  return phoneOk && dobOk && addrOk;
}

// ── GET /api/users/profile ────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const allowed = ['name', 'phone', 'address', 'dateOfBirth', 'profilePicture', 'preferences'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Merge all updates first so verification uses the final state
    const merged = { ...user.toJSON(), ...updates };
    updates.isVerified = shouldBeVerified(merged);

    await user.update(updates);
    res.json({ success: true, data: user.toJSON(), isVerified: user.isVerified });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── PUT /api/users/password ───────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both currentPassword and newPassword are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    // Re-fetch with password — toJSON strips it, so use getDataValue
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.getDataValue('password'));
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    await user.update({ password: await bcrypt.hash(newPassword, 10) });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/users/discount-request ─────────────────────────────────────────
// Customer uploads a PWD or Senior Citizen ID for admin review.
const submitDiscountRequest = async (req, res) => {
  try {
    const { discountIdUrl, discountType } = req.body;
    if (!discountIdUrl) {
      return res.status(400).json({ success: false, message: 'discountIdUrl is required' });
    }
    const validTypes = ['PWD', 'senior_citizen'];
    if (discountType && !validTypes.includes(discountType)) {
      return res.status(400).json({ success: false, message: 'discountType must be PWD or senior_citizen' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.discountStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'Your discount is already approved' });
    }

    await user.update({
      discountStatus: 'pending',
      discountIdUrl,
      discountType: discountType || 'PWD',
    });

    res.json({ success: true, message: 'Discount ID submitted for admin review', data: user.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/users/:id/discount — Admin approves or rejects discount ────────
const reviewDiscountRequest = async (req, res) => {
  try {
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const { action } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "action must be 'approve' or 'reject'" });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.discountStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending discount request for this user' });
    }

    const updates =
      action === 'approve'
        ? { discountStatus: 'approved', discountPct: 20 }
        : { discountStatus: 'rejected', discountPct: 0 };

    await user.update(updates);

    // Notify the customer of the admin decision (fire-and-forget)
    if (action === 'approve') {
      notificationService.notifyDiscountApproved(user.id);
    } else {
      notificationService.notifyDiscountRejected(user.id, 'Please upload a clearer, valid PWD or Senior Citizen ID.');
    }

    res.json({
      success: true,
      message: action === 'approve' ? 'Discount approved — user now receives 20% off' : 'Discount request rejected',
      data: user.toJSON(),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── GET /api/users/pending-discounts — Admin list of pending requests ─────────
const getPendingDiscounts = async (req, res) => {
  try {
    if (!['admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const users = await User.findAll({ where: { discountStatus: 'pending' } });
    res.json({ success: true, data: users.map((u) => u.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/users/2fa/setup — Generate TOTP secret ─────────────────────────
const setup2FA = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: '2FA is already enabled' });
    }

    // Generate a random 20-byte base32 secret
    const secret = crypto.randomBytes(20).toString('base32');

    // Store the secret (not yet enabled — user must verify with a code first)
    await user.update({ twoFactorSecret: secret, twoFactorEnabled: false });

    // Build the otpauth:// URI for QR code scanning
    const issuer  = 'PakiPark';
    const account = encodeURIComponent(user.email);
    const otpUri  = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

    res.json({
      success: true,
      data: {
        secret,
        otpUri,
        message: 'Scan the QR code with your authenticator app, then verify with POST /api/users/2fa/verify',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/users/2fa/verify — Confirm TOTP code and activate 2FA ──────────
const verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'TOTP code is required' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const secret = user.getDataValue('twoFactorSecret');
    if (!secret) {
      return res.status(400).json({ success: false, message: 'Run 2FA setup first' });
    }

    const isValid = verifyTOTP(secret, code.trim());
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired code. Try again.' });
    }

    await user.update({ twoFactorEnabled: true });
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/users/2fa/disable ───────────────────────────────────────────────
const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(password || '', user.getDataValue('password'));
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect password' });

    await user.update({ twoFactorEnabled: false, twoFactorSecret: null });
    res.json({ success: true, message: '2FA disabled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── TOTP verification (RFC 6238) — no extra library needed ───────────────────
function verifyTOTP(secret, token) {
  const window = 1; // allow ±1 time step (30s each) for clock drift
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    if (generateTOTP(secret, counter + i) === token) return true;
  }
  return false;
}

function generateTOTP(secret, counter) {
  const key   = base32Decode(secret);
  const msg   = Buffer.alloc(8);
  let c       = counter;
  for (let i = 7; i >= 0; i--) { msg[i] = c & 0xff; c >>= 8; }
  const hmac  = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code  = ((hmac[offset] & 0x7f) << 24 |
                  hmac[offset + 1] << 16 |
                  hmac[offset + 2] << 8  |
                  hmac[offset + 3]) % 1_000_000;
  return String(code).padStart(6, '0');
}

function base32Decode(s) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  s = s.toUpperCase().replace(/=+$/, '');
  let bits = 0, val = 0;
  const out = [];
  for (const ch of s) {
    val = (val << 5) | alphabet.indexOf(ch);
    bits += 5;
    if (bits >= 8) { out.push((val >> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Buffer.from(out);
}

// ── GET /api/users — Admin: list all users ────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    if (!['admin', 'teller', 'business_partner'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Staff access required' });
    }
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: users.map((u) => u.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/users/account — Customer soft-deletes own account ─────────────
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: 'Password is required to delete account' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.getDataValue('password'));
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect password' });

    await user.update({ deletedAt: new Date() });
    res.json({ success: true, message: 'Account scheduled for deletion. You have been logged out.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  submitDiscountRequest,
  reviewDiscountRequest,
  getPendingDiscounts,
  setup2FA,
  verify2FA,
  disable2FA,
  getAllUsers,
};
