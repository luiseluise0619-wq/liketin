const prisma = require('../config/database');
const logger = require('../utils/logger');

class PremiumController {
  async getPlans(req, res, next) {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' },
      });
      res.json({ plans });
    } catch (error) {
      next(error);
    }
  }

  async subscribe(req, res, next) {
    try {
      const { planId } = req.body;
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      // NOTE: payment processing (Stripe/IAP) must happen here before granting.
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration);

      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { premiumType: plan.type, premiumExpiresAt: expiresAt },
      });

      logger.info(`User ${req.user.id} subscribed to ${plan.type}`);
      res.json({
        message: 'Subscription activated',
        premiumType: user.premiumType,
        expiresAt: user.premiumExpiresAt,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { premiumType: true, premiumExpiresAt: true },
      });
      const isActive =
        !!user.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date();
      res.json({
        premiumType: isActive ? user.premiumType : 'NONE',
        expiresAt: user.premiumExpiresAt,
        isActive,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { premiumType: 'NONE', premiumExpiresAt: null },
      });
      res.json({ message: 'Subscription cancelled' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PremiumController();
