const prisma = require('../config/database');
const profileService = require('../services/profileService');
const { profileUpdateSchema } = require('../utils/validators');

class ProfileController {
  async getProfile(req, res, next) {
    try {
      const profile = await profileService.getProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async getUserProfile(req, res, next) {
    try {
      const { userId } = req.params;
      const profile = await profileService.getProfile(userId);
      delete profile.email;
      delete profile.phoneNumber;
      delete profile.settings;
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { error, value } = profileUpdateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const profile = await profileService.updateProfile(req.user.id, value);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async uploadPhotos(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      const photos = await profileService.uploadPhotos(req.user.id, req.files);
      res.json({ photos });
    } catch (error) {
      next(error);
    }
  }

  async deletePhoto(req, res, next) {
    try {
      const result = await profileService.deletePhoto(req.user.id, req.params.photoId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const { lat, lng, address } = req.body;
      if (lat === undefined || lng === undefined) {
        return res.status(400).json({ error: 'Latitude and longitude required' });
      }
      const result = await profileService.updateLocation(req.user.id, lat, lng, address);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req, res, next) {
    try {
      const settings = await prisma.userSettings.findUnique({
        where: { userId: req.user.id },
      });
      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await prisma.userSettings.update({
        where: { userId: req.user.id },
        data: req.body,
      });
      res.json(settings);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
