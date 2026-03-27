const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { studentValidation } = require('../middleware/validators');
const { validate } = require('../middleware/validate');
const studentController = require('../controllers/studentController');

router.get('/', authMiddleware, adminMiddleware, studentController.getAllStudents);
router.get('/filters/metadata', authMiddleware, adminMiddleware, studentController.getFilterMetadata);
router.get('/:student_id', authMiddleware, studentController.getStudentById);
router.get('/:student_id/summary', authMiddleware, studentController.getStudentSummary);
router.post('/', authMiddleware, adminMiddleware, studentValidation, validate, studentController.createStudent);
router.put('/:student_id', authMiddleware, adminMiddleware, studentController.updateStudent);
router.delete('/:student_id', authMiddleware, adminMiddleware, studentController.deleteStudent);

module.exports = router;
