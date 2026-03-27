const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { loginValidation } = require('../middleware/validators');
const { validate } = require('../middleware/validate');
const authController = require('../controllers/authController');

// Rate limiter for login endpoints (5 attempts per minute per IP)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Student login (ID only, no password)
router.post('/student-login', loginLimiter, authController.studentLogin);

// Admin login (ID + password)
// Note: No loginValidation middleware - admin IDs can be any format
router.post('/admin-login', loginLimiter, authController.adminLogin);

// Legacy login (kept for compatibility)
router.post('/login', loginLimiter, loginValidation, validate, authController.login);

router.get('/me', authMiddleware, authController.getMe);
router.put('/change-password', authMiddleware, authController.changePassword);
router.post('/setup-admin', authController.setupAdmin);

module.exports = router;
