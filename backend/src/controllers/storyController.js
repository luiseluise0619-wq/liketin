const prisma = require('../config/database');
const { uploadBuffer } = require('../services/storageService');

class StoryController {
  async create(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Media file required' });
      const { type = 'image' } = req.body;

      const url = await uploadBuffer(`stories/${req.user.id}`, req.file);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const story = await prisma.story.create({
        data: { userId: req.user.id, mediaUrl: url, type, expiresAt },
      });
      res.status(201).json(story);
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const stories = await prisma.story.findMany({
        where: { expiresAt: { gt: new Date() }, userId: { not: req.user.id } },
        include: {
          user: {
            select: { id: true, name: true, photos: { where: { isMain: true }, take: 1 } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({ stories });
    } catch (error) {
      next(error);
    }
  }

  async view(req, res, next) {
    try {
      await prisma.story.update({
        where: { id: req.params.storyId },
        data: { views: { increment: 1 } },
      });
      res.json({ message: 'Story viewed' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoryController();
