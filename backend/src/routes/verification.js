const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const verificationController = require('../controllers/verificationController');

router.post('/', authenticate, verificationController.request);
router.post(
  '/:verificationId/document',
  authenticate,
  upload.single('document'),
  verificationController.uploadDocument
);
router.get('/', authenticate, verificationController.list);

module.exports = router;
