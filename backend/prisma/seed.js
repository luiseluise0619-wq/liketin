const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PLANS = [
  {
    name: 'Plus',
    type: 'PLUS',
    price: 9.99,
    duration: 30,
    features: [
      { feature: 'Unlimited likes', included: true },
      { feature: 'Rewind last swipe', included: true },
      { feature: 'See who likes you', included: false },
    ],
  },
  {
    name: 'Gold',
    type: 'GOLD',
    price: 19.99,
    duration: 30,
    features: [
      { feature: 'Unlimited likes', included: true },
      { feature: 'See who likes you', included: true },
      { feature: '5 Super Likes / day', included: true },
      { feature: '1 Boost / month', included: true },
    ],
  },
  {
    name: 'Platinum',
    type: 'PLATINUM',
    price: 29.99,
    duration: 30,
    features: [
      { feature: 'Everything in Gold', included: true },
      { feature: 'Priority likes', included: true },
      { feature: 'Message before matching', included: true },
      { feature: 'Unlimited Super Likes', included: true },
    ],
  },
];

async function main() {
  for (const plan of PLANS) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { type: plan.type } });
    if (existing) {
      await prisma.subscriptionPlan.update({ where: { id: existing.id }, data: plan });
    } else {
      await prisma.subscriptionPlan.create({ data: plan });
    }
  }
  // eslint-disable-next-line no-console
  console.log(`Seeded ${PLANS.length} subscription plans`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
