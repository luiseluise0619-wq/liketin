const prisma = require('../config/database');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

async function grantPremium(userId, plan) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + plan.duration);
  return prisma.user.update({
    where: { id: userId },
    data: { premiumType: plan.type, premiumExpiresAt: expiresAt },
  });
}

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

  // Step 1: create a payment intent. Premium is NOT granted yet — the client
  // confirms payment with the returned clientSecret, then calls /confirm.
  async subscribe(req, res, next) {
    try {
      const { planId } = req.body;
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      const intent = await paymentService.createIntent({ userId: req.user.id, plan });
      res.json({
        planId: plan.id,
        clientSecret: intent.clientSecret,
        intentId: intent.intentId,
        sandbox: intent.sandbox,
      });
    } catch (error) {
      next(error);
    }
  }

  // Step 2: capture/verify the payment and grant premium on success.
  async confirm(req, res, next) {
    try {
      const { planId, intentId } = req.body;
      if (!planId || !intentId) {
        return res.status(400).json({ error: 'planId and intentId are required' });
      }
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      const result = await paymentService.capture(intentId, req.user.id);
      if (!result.succeeded) {
        return res.status(402).json({ error: 'Payment not completed', status: result.status });
      }

      const user = await grantPremium(req.user.id, plan);
      logger.info(`User ${req.user.id} subscribed to ${plan.type}`);
      res.json({
        message: 'Subscription activated',
        premiumType: user.premiumType,
        expiresAt: user.premiumExpiresAt,
      });
    } catch (error) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      next(error);
    }
  }

  // Stripe webhook: grants premium when payment_intent.succeeded arrives
  // (defense-in-depth so entitlement is granted even if the client drops off).
  async webhook(req, res) {
    try {
      const event = paymentService.constructWebhookEvent(req.body, req.headers['stripe-signature']);
      if (event && event.type === 'payment_intent.succeeded') {
        const md = event.data.object.metadata || {};
        if (md.userId && md.planId) {
          const plan = await prisma.subscriptionPlan.findUnique({ where: { id: md.planId } });
          if (plan) await grantPremium(md.userId, plan);
        }
      }
      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook verification failed' });
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
