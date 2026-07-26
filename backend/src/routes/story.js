const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload, validateImage } = require('../middleware/upload');
const storyController = require('../controllers/storyController');

router.post('/', authenticate, upload.single('media'), validateImage, storyController.create);
router.get('/', authenticate, storyController.list);
router.post('/:storyId/view', authenticate, storyController.view);

module.exports = router;
