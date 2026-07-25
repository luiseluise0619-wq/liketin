const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

router.post('/', authenticate, reportController.createReport);
router.post('/block', authenticate, reportController.blockUser);
router.delete('/block/:userId', authenticate, reportController.unblockUser);
router.get('/blocked', authenticate, reportController.getBlockedUsers);

module.exports = router;
