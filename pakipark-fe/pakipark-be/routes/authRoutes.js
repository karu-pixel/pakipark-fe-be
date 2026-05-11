const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { registerCustomer, registerAdmin, login, getMe } = require('../controllers/authController');

// POST /api/auth/register/customer
router.post('/register/customer', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
], registerCustomer);

// POST /api/auth/register/admin
router.post('/register/admin', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('accessCode').notEmpty().withMessage('Admin access code is required'),
  validate,
], registerAdmin);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], login);

// GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
