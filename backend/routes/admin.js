const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const { manualFailCheck } = require('../utils/autoFailService');

const upload = multer({ dest: 'uploads/' });

router.post('/upload-csv', authMiddleware, adminMiddleware, upload.single('file'), adminController.uploadCSV);
router.post('/upload-excel', authMiddleware, adminMiddleware, upload.single('file'), adminController.uploadExcel);
router.post('/upload-students', authMiddleware, adminMiddleware, upload.single('file'), adminController.uploadStudents);
router.post('/process-overdue', authMiddleware, adminMiddleware, manualFailCheck);

module.exports = router;
