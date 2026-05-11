const authService = require('../services/authService');

// POST /api/auth/register/customer
const registerCustomer = async (req, res) => {
  try {
    const user = await authService.registerCustomer(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/auth/register/admin
const registerAdmin = async (req, res) => {
  try {
    const user = await authService.registerAdmin(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const user = await authService.loginUser(req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { registerCustomer, registerAdmin, login, getMe };
