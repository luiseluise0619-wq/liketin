const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const matchController = require('../controllers/matchController');

router.get('/', authenticate, matchController.getMatches);
router.delete('/:matchId', authenticate, matchController.unmatch);

module.exports = router;
