// Ensure sandbox mode (no Stripe key).
delete process.env.STRIPE_SECRET_KEY;

const { PaymentService } = require('../src/services/paymentService');

describe('PaymentService (sandbox)', () => {
  let service;
  const plan = { id: 'plan_1', type: 'GOLD', price: 19.99, currency: 'USD', duration: 30 };

  beforeEach(() => {
    service = new PaymentService();
  });

  it('runs in sandbox when no Stripe key is set', () => {
    expect(service.sandbox).toBe(true);
  });

  it('creates an intent with a client secret and correct amount', async () => {
    const intent = await service.createIntent({ userId: 'u1', plan });
    expect(intent.sandbox).toBe(true);
    expect(intent.intentId).toMatch(/^pi_sandbox_/);
    expect(intent.clientSecret).toBe(`${intent.intentId}_secret`);
    expect(service._intents.get(intent.intentId).amount).toBe(1999);
  });

  it('captures an intent as succeeded', async () => {
    const intent = await service.createIntent({ userId: 'u1', plan });
    const result = await service.capture(intent.intentId, 'u1');
    expect(result.succeeded).toBe(true);
    expect(result.metadata.planId).toBe('plan_1');
  });

  it('rejects capture for an unknown intent', async () => {
    await expect(service.capture('pi_sandbox_missing', 'u1')).rejects.toThrow('not found');
  });

  it('rejects capture by a different user', async () => {
    const intent = await service.createIntent({ userId: 'u1', plan });
    await expect(service.capture(intent.intentId, 'attacker')).rejects.toThrow(
      'does not belong'
    );
  });
});
