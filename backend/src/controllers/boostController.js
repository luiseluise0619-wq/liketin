const prisma = require('../config/database');
const logger = require('../utils/logger');

const BOOST_MINUTES = 30;

class BoostController {
  async activate(req, res, next) {
    try {
      const active = await prisma.boost.findFirst({
        where: { userId: req.user.id, expiresAt: { gt: new Date() } },
      });
      if (active) {
        return res.status(400).json({ error: 'Boost already active', expiresAt: active.expiresAt });
      }

      const expiresAt = new Date(Date.now() + BOOST_MINUTES * 60 * 1000);
      const boost = await prisma.boost.create({
        data: { userId: req.user.id, startedAt: new Date(), expiresAt },
      });

      logger.info(`Boost activated for ${req.user.id}`);
      res.json({ message: 'Boost activated', expiresAt: boost.expiresAt, durationMinutes: BOOST_MINUTES });
    } catch (error) {
      next(error);
    }
  }

  async status(req, res, next) {
    try {
      const active = await prisma.boost.findFirst({
        where: { userId: req.user.id, expiresAt: { gt: new Date() } },
      });
      res.json({ isActive: !!active, expiresAt: active?.expiresAt || null });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BoostController();
