const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const incController = require('../controllers/incController');

router.get('/', authMiddleware, adminMiddleware, incController.getAllINC);
router.get('/student/:student_id', authMiddleware, incController.getStudentINC);
router.put('/:id', authMiddleware, adminMiddleware, incController.updateINC);
router.put('/:id/due-date', authMiddleware, adminMiddleware, incController.setDueDate);
router.put('/:id/override', authMiddleware, adminMiddleware, incController.overrideFailedINC);
router.delete('/:id', authMiddleware, adminMiddleware, incController.deleteINC);
router.post('/bulk-delete', authMiddleware, adminMiddleware, incController.bulkDeleteINC);
router.put('/:id/mark-failed', authMiddleware, adminMiddleware, incController.markAsFailed);
router.post('/bulk-mark-failed', authMiddleware, adminMiddleware, incController.bulkMarkAsFailed);

module.exports = router;
