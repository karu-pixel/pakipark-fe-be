const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const { logUserLogin, logUserRegistered } = require('./logService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Register a new customer
 */
const registerCustomer = async ({ name, email, phone, password }) => {
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role: 'customer',
    isVerified: true,
  });

  logUserRegistered({ userId: user.id, role: 'customer' });

  return {
    _id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user.id),
  };
};

/**
 * Register a new admin (Business Partner)
 */
const registerAdmin = async ({ name, email, phone, password, accessCode, address, dateOfBirth, role: requestedRole }) => {
  if (accessCode !== process.env.ADMIN_ACCESS_CODE) {
    throw new Error('Invalid admin access code');
  }

  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(password, 10);
  // Allow admin to specify teller or business_partner role; default to 'admin'
  const finalRole = ['admin', 'teller', 'business_partner'].includes(requestedRole) ? requestedRole : 'admin';
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role: finalRole,
    address: address || {},
    dateOfBirth: dateOfBirth || null,
    isVerified: true,
  });

  logUserRegistered({ userId: user.id, role: finalRole });

  return {
    _id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user.id),
  };
};

/**
 * Login user
 */
const loginUser = async ({ email, password }) => {
  // Need password for comparison — bypass toJSON deletion by getting raw instance
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) throw new Error('Invalid credentials');

  // Access raw data value to get the hashed password (not stripped by toJSON)
  const hashedPw = user.getDataValue('password');
  const isMatch = await bcrypt.compare(password, hashedPw);
  if (!isMatch) throw new Error('Invalid credentials');

  logUserLogin({ userId: user.id, role: user.role });

  return {
    _id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture,
    token: generateToken(user.id),
  };
};

module.exports = { registerCustomer, registerAdmin, loginUser };