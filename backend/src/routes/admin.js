const express = require('express');

const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboardStats);
router.get('/reports', authenticate, requireAdmin, adminController.getReports);
router.put('/reports/:reportId', authenticate, requireAdmin, adminController.updateReport);
router.get('/users', authenticate, requireAdmin, adminController.getUsers);
router.put('/users/:userId/status', authenticate, requireAdmin, adminController.updateUserStatus);
router.get('/logs', authenticate, requireAdmin, adminController.getAdminLogs);

module.exports = router;
