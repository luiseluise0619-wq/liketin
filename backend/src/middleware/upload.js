const multer = require('multer');
const sharp = require('sharp');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 9,
  },
});

// Validates real image content (dimensions) and rejects non-images that slipped
// past the mimetype check. NSFW/AI moderation should be plugged in here.
const validateImage = async (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (files.length === 0) return next();

  try {
    for (const file of files) {
      const metadata = await sharp(file.buffer).metadata();
      if (!metadata.width || !metadata.height) {
        return res.status(400).json({ error: 'Uploaded file is not a valid image.' });
      }
      if (metadata.width < 200 || metadata.height < 200) {
        return res.status(400).json({ error: 'Image too small. Minimum 200x200 pixels required.' });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, validateImage };
