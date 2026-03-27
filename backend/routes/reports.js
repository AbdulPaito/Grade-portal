const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.get('/all-grades', authMiddleware, adminMiddleware, reportController.getAllGradesReport);
router.get('/inc-list', authMiddleware, adminMiddleware, reportController.getINCList);
router.get('/overdue-inc', authMiddleware, adminMiddleware, reportController.getOverdueINC);
router.get('/completed-inc', authMiddleware, adminMiddleware, reportController.getCompletedINC);
router.get('/student-grades/:student_id', authMiddleware, reportController.getStudentReport);
router.get('/section-summary', authMiddleware, adminMiddleware, reportController.getSectionSummary);

module.exports = router;
