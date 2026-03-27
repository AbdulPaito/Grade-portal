const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { gradeValidation } = require('../middleware/validators');
const { validate } = require('../middleware/validate');
const gradeController = require('../controllers/gradeController');

router.get('/all', authMiddleware, adminMiddleware, gradeController.getAllGrades);
router.get('/stats/:student_id', authMiddleware, gradeController.getGradeStats);
router.get('/:student_id', authMiddleware, gradeController.getStudentGrades);
router.post('/', authMiddleware, adminMiddleware, gradeValidation, validate, gradeController.addGrade);
router.put('/:id', authMiddleware, adminMiddleware, gradeController.updateGrade);
router.delete('/:id', authMiddleware, adminMiddleware, gradeController.deleteGrade);

module.exports = router;
