const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const premiumController = require('../controllers/premiumController');

router.get('/plans', authenticate, premiumController.getPlans);
router.post('/subscribe', authenticate, premiumController.subscribe);
router.get('/status', authenticate, premiumController.getStatus);
router.post('/cancel', authenticate, premiumController.cancel);

module.exports = router;
