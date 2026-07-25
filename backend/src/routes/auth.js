const express = require('express');

const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/social', authController.socialLogin);
router.post('/refresh', authController.refreshToken);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);

module.exports = router;
