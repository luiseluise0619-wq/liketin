const prisma = require('../config/database');
const swipeService = require('../services/swipeService');
const { swipeSchema } = require('../utils/validators');

class SwipeController {
  async getRecommendations(req, res, next) {
    try {
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
      const recommendations = await swipeService.getRecommendations(req.user.id, limit);
      res.json({ recommendations });
    } catch (error) {
      next(error);
    }
  }

  async getDailyPick(req, res, next) {
    try {
      const result = await swipeService.getDailyPick(req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async swipe(req, res, next) {
    try {
      const { error, value } = swipeSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const result = await swipeService.swipe(req.user.id, value.targetUserId, value.type);
      res.json(result);
    } catch (error) {
      if (error.message.includes('limit')) {
        return res.status(429).json({ error: error.message });
      }
      next(error);
    }
  }

  async undoSwipe(req, res, next) {
    try {
      const { targetUserId } = req.body;
      const result = await swipeService.undoSwipe(req.user.id, targetUserId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getWhoLikedMe(req, res, next) {
    try {
      if (req.user.premiumType === 'NONE') {
        return res.status(403).json({ error: 'Premium subscription required' });
      }
      const likers = await prisma.swipe.findMany({
        where: { swipedId: req.user.id, type: { in: ['LIKE', 'SUPER_LIKE'] } },
        include: {
          swiper: {
            select: {
              id: true,
              name: true,
              photos: { where: { isMain: true }, take: 1 },
              birthDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        likers: likers.map((l) => ({
          ...l.swiper,
          age: swipeService.calculateAge(l.swiper.birthDate),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SwipeController();
