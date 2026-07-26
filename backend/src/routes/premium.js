const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const premiumController = require('../controllers/premiumController');

router.get('/plans', authenticate, premiumController.getPlans);
router.post('/subscribe', authenticate, premiumController.subscribe);
router.post('/confirm', authenticate, premiumController.confirm);
router.get('/status', authenticate, premiumController.getStatus);
router.post('/cancel', authenticate, premiumController.cancel);

// Stripe webhook needs the raw body for signature verification, so it is
// mounted separately in app.js before the JSON body parser. See app.js.

module.exports = router;
