const { storage } = require('../config/firebase');

// Shared Firebase Storage upload helper used by photo/story/verification flows.
async function uploadBuffer(pathPrefix, file) {
  if (!storage) throw new Error('Firebase storage not configured');
  const bucket = storage.bucket();
  const ext = (file.originalname || 'bin').split('.').pop();
  const filename = `${pathPrefix}/${Date.now()}.${ext}`;
  const blob = bucket.file(filename);
  await blob.save(file.buffer, { metadata: { contentType: file.mimetype } });
  await blob.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

module.exports = { uploadBuffer };
