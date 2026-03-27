const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const incController = require('../controllers/incController');

router.get('/', authMiddleware, adminMiddleware, incController.getAllINC);
router.get('/student/:student_id', authMiddleware, incController.getStudentINC);
router.put('/:id', authMiddleware, adminMiddleware, incController.updateINC);
router.put('/:id/due-date', authMiddleware, adminMiddleware, incController.setDueDate);
router.put('/:id/override', authMiddleware, adminMiddleware, incController.overrideFailedINC);

module.exports = router;
