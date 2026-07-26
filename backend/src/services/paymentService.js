const crypto = require('crypto');
const logger = require('../utils/logger');

// Payment provider abstraction.
//
// If STRIPE_SECRET_KEY is set, the real Stripe SDK is used (PaymentIntents).
// Otherwise a self-contained "sandbox" provider runs so the premium flow is
// fully testable without credentials — it issues fake client secrets and
// auto-succeeds on capture. The two-step create → capture shape mirrors a real
// gateway: the client confirms the intent with the clientSecret, then the
// server captures/verifies before granting the entitlement.
//
// NOTE: sandbox intents are held in-memory. For multi-instance deployments use
// the Stripe provider (source of truth is the gateway) or persist intents.
class PaymentService {
  constructor() {
    this.sandbox = !process.env.STRIPE_SECRET_KEY;
    this._intents = new Map();

    if (!this.sandbox) {
      // eslint-disable-next-line global-require, import/no-unresolved
      const Stripe = require('stripe');
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    } else {
      logger.warn('STRIPE_SECRET_KEY not set — payments run in SANDBOX mode');
    }
  }

  // Creates a payment intent for a plan. Returns a client secret the app uses
  // to confirm payment, plus the intent id the server later captures.
  async createIntent({ userId, plan }) {
    const amount = Math.round(plan.price * 100); // minor units

    if (!this.sandbox) {
      const intent = await this.stripe.paymentIntents.create({
        amount,
        currency: (plan.currency || 'usd').toLowerCase(),
        metadata: { userId, planId: plan.id, planType: plan.type },
        automatic_payment_methods: { enabled: true },
      });
      return { intentId: intent.id, clientSecret: intent.client_secret, sandbox: false };
    }

    const intentId = `pi_sandbox_${crypto.randomUUID()}`;
    this._intents.set(intentId, {
      status: 'requires_confirmation',
      amount,
      metadata: { userId, planId: plan.id, planType: plan.type },
    });
    return {
      intentId,
      clientSecret: `${intentId}_secret`,
      sandbox: true,
    };
  }

  // Verifies the payment succeeded and returns its metadata. In sandbox mode
  // this auto-succeeds; with Stripe it reads the real intent status.
  async capture(intentId, expectedUserId) {
    if (!this.sandbox) {
      const intent = await this.stripe.paymentIntents.retrieve(intentId);
      const ok = intent.status === 'succeeded';
      this._assertOwner(intent.metadata, expectedUserId);
      return { status: intent.status, succeeded: ok, metadata: intent.metadata };
    }

    const intent = this._intents.get(intentId);
    if (!intent) {
      const err = new Error('Payment intent not found');
      err.status = 404;
      throw err;
    }
    this._assertOwner(intent.metadata, expectedUserId);
    intent.status = 'succeeded';
    return { status: 'succeeded', succeeded: true, metadata: intent.metadata };
  }

  _assertOwner(metadata, expectedUserId) {
    if (expectedUserId && metadata?.userId && metadata.userId !== expectedUserId) {
      const err = new Error('Payment does not belong to this user');
      err.status = 403;
      throw err;
    }
  }

  // Verifies a Stripe webhook signature (no-op in sandbox).
  constructWebhookEvent(rawBody, signature) {
    if (this.sandbox) return null;
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }
}

module.exports = new PaymentService();
module.exports.PaymentService = PaymentService;
