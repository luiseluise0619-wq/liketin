const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const boostController = require('../controllers/boostController');

router.post('/activate', authenticate, boostController.activate);
router.get('/status', authenticate, boostController.status);

module.exports = router;
