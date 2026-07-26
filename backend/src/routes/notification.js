const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', authenticate, notificationController.list);
router.put('/:id/read', authenticate, notificationController.markRead);
router.post('/token', authenticate, notificationController.registerToken);

module.exports = router;
