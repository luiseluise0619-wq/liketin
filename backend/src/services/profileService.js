const prisma = require('../config/database');
const { storage } = require('../config/firebase');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class ProfileService {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        photos: { orderBy: { order: 'asc' } },
        interests: true,
        settings: true,
        verifications: true,
      },
    });
    if (!user) throw new Error('User not found');
    return this.sanitizeProfile(user);
  }

  async updateProfile(userId, data) {
    const { interests, ...profileData } = data;
    const updateData = { ...profileData };

    if (interests) {
      updateData.interests = {
        deleteMany: {},
        create: interests.map((name) => ({ name })),
      };
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { photos: true, interests: true, settings: true },
    });

    logger.info(`Profile updated: ${userId}`);
    return this.sanitizeProfile(user);
  }

  async uploadPhotos(userId, files) {
    if (!storage) throw new Error('Firebase storage not configured');
    const bucket = storage.bucket();
    const uploadedPhotos = [];

    const existingCount = await prisma.userPhoto.count({ where: { userId } });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.originalname.split('.').pop();
      const filename = `users/${userId}/photos/${Date.now()}_${i}.${ext}`;
      const blob = bucket.file(filename);

      await blob.save(file.buffer, { metadata: { contentType: file.mimetype } });
      await blob.makePublic();

      const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      const photo = await prisma.userPhoto.create({
        data: {
          userId,
          url,
          order: existingCount + i,
          isMain: existingCount + i === 0,
        },
      });
      uploadedPhotos.push(photo);
    }

    return uploadedPhotos;
  }

  async deletePhoto(userId, photoId) {
    const photo = await prisma.userPhoto.findFirst({ where: { id: photoId, userId } });
    if (!photo) throw new Error('Photo not found');

    if (storage) {
      try {
        const bucket = storage.bucket();
        // Derive the storage path from the public URL.
        const path = decodeURIComponent(photo.url.split(`${bucket.name}/`)[1] || '');
        if (path) await bucket.file(path).delete();
      } catch (err) {
        logger.warn(`Failed to delete photo from storage: ${err.message}`);
      }
    }

    await prisma.userPhoto.delete({ where: { id: photoId } });
    return { message: 'Photo deleted' };
  }

  async updateLocation(userId, lat, lng, address) {
    await prisma.user.update({
      where: { id: userId },
      data: { location: { lat, lng, address } },
    });
    // Redis geospatial index for fast nearby lookups.
    await redis.geoadd('user:locations', lng, lat, userId);
    return { message: 'Location updated' };
  }

  sanitizeProfile(user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = new ProfileService();
