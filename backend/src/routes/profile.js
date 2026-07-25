const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload, validateImage } = require('../middleware/upload');
const profileController = require('../controllers/profileController');

router.get('/me', authenticate, profileController.getProfile);
router.put('/me', authenticate, profileController.updateProfile);
router.post(
  '/photos',
  authenticate,
  upload.array('photos', 9),
  validateImage,
  profileController.uploadPhotos
);
router.delete('/photos/:photoId', authenticate, profileController.deletePhoto);
router.put('/location', authenticate, profileController.updateLocation);
router.get('/settings', authenticate, profileController.getSettings);
router.put('/settings', authenticate, profileController.updateSettings);
router.get('/:userId', authenticate, profileController.getUserProfile);

module.exports = router;
