const jwt = require('jsonwebtoken');
const { Student } = require('../models');
const { logStudentLogin, logAdminLogin } = require('../utils/auditLogger');

const MIN_STUDENT_ID_LENGTH = 6; // Minimum 6 digits, no maximum

const generateToken = (student_id, role) => {
  return jwt.sign({ student_id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// Helper function to add delay (for security)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Validate student_id format (4 digits + optional dash + digits, minimum 6 total)
const isValidStudentId = (student_id) => {
  if (!student_id) return false;
  const trimmed = student_id.toString().trim();
  // Check format: 4 digits, optional dash, then digits only
  if (!/^\d{4}-?\d+$/.test(trimmed)) return false;
  // Check minimum length (excluding dash)
  const digitsOnly = trimmed.replace('-', '');
  if (digitsOnly.length < 6) return false;
  return true;
};

// @desc    Student login (ID only, no password)
// @route   POST /api/auth/student-login
// @access  Public
const studentLogin = async (req, res) => {
  try {
    const { student_id } = req.body;

    // Validate input format
    if (!isValidStudentId(student_id)) {
      // Add small delay on failure
      await delay(1000);
      return res.status(401).json({ message: 'Invalid Student ID' });
    }

    const trimmedId = student_id.toString().trim();

    // Find student by student_id
    const user = await Student.findOne({ student_id: trimmedId, role: 'student' });

    if (!user) {
      // Add small delay on failure
      await delay(1000);
      return res.status(401).json({ message: 'Invalid Student ID' });
    }

    // Check if account is active
    if (user.status === 'inactive') {
      await delay(1000);
      return res.status(401).json({ message: 'Invalid Student ID' });
    }

    // Generate token
    const token = generateToken(user.student_id, user.role);

    // Log the student login
    await logStudentLogin(user);

    res.json({
      success: true,
      token,
      user: {
        student_id: user.student_id,
        full_name: user.full_name,
        course: user.course,
        section: user.section,
        year_level: user.year_level,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Student login error:', error);
    await delay(1000);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Admin login (email/password)
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { student_id, password } = req.body;

    if (!student_id || !password) {
      await delay(1000);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Find admin by student_id
    const user = await Student.findOne({ student_id: student_id.toString().trim(), role: 'admin' });

    if (!user) {
      await delay(1000);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (user.status === 'inactive') {
      await delay(1000);
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await delay(1000);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.student_id, user.role);

    // Log the admin login
    await logAdminLogin(user);

    res.json({
      success: true,
      token,
      user: {
        student_id: user.student_id,
        full_name: user.full_name,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    await delay(1000);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Legacy login function (kept for compatibility)
const login = async (req, res) => {
  try {
    const { student_id, password } = req.body;
    const user = await Student.findOne({ student_id: student_id.toString().trim() });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.status === 'inactive') return res.status(401).json({ message: 'Account is inactive' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user.student_id, user.role);

    res.json({
      success: true,
      token,
      user: {
        student_id: user.student_id,
        full_name: user.full_name,
        course: user.course,
        section: user.section,
        year_level: user.year_level,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await Student.findOne({ student_id: req.user.student_id }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    // Only admins can change passwords
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can change passwords' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Please provide current and new password' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await Student.findOne({ student_id: req.user.student_id });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const setupAdmin = async (req, res) => {
  try {
    const { student_id, full_name, password } = req.body;
    const existingAdmin = await Student.findOne({ role: 'admin' });
    if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

    const admin = new Student({
      student_id,
      full_name,
      course: 'Administration',
      section: 'ADMIN',
      year_level: 0,
      password,
      role: 'admin',
      status: 'active'
    });

    await admin.save();
    res.json({ success: true, message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  studentLogin, 
  adminLogin, 
  login, 
  getMe, 
  changePassword, 
  setupAdmin,
  isValidStudentId,
  MIN_STUDENT_ID_LENGTH 
};
