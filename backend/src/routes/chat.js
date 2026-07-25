const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.post('/messages', authenticate, chatController.sendMessage);
router.get('/messages/:matchId', authenticate, chatController.getMessages);
router.put('/messages/:matchId/read', authenticate, chatController.markAsRead);
router.get('/icebreaker/:matchId', authenticate, chatController.getIcebreaker);

module.exports = router;
