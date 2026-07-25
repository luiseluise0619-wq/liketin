const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { swipeLimiter } = require('../middleware/rateLimiter');
const swipeController = require('../controllers/swipeController');

router.get('/recommendations', authenticate, swipeController.getRecommendations);
router.post('/', authenticate, swipeLimiter, swipeController.swipe);
router.post('/undo', authenticate, swipeController.undoSwipe);
router.get('/who-liked-me', authenticate, swipeController.getWhoLikedMe);

module.exports = router;
