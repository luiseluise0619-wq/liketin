// Integration tests require a live PostgreSQL + Redis. They are skipped unless
// RUN_INTEGRATION=1 is set, so `npm test` stays green in environments without
// infrastructure. To run: RUN_INTEGRATION=1 DATABASE_URL=... npm test
const runIntegration = process.env.RUN_INTEGRATION === '1';
const describeIf = runIntegration ? describe : describe.skip;

describeIf('matching flow (integration)', () => {
  let request;
  let app;
  let prisma;
  let generateTokens;
  let user1Id;
  let user2Id;
  let user1Token;
  let user2Token;

  beforeAll(async () => {
    process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'test-access';
    process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test-refresh';
    request = require('supertest');
    ({ app } = require('../src/app'));
    prisma = require('../src/config/database');
    ({ generateTokens } = require('../src/utils/jwt'));

    const u1 = await prisma.user.create({
      data: {
        email: `u1_${Date.now()}@example.com`,
        passwordHash: 'x',
        name: 'User One',
        birthDate: new Date('1995-01-01'),
        gender: 'MALE',
        interestedIn: 'FEMALE',
        status: 'ACTIVE',
        location: { lat: 37.5665, lng: 126.978 },
        settings: { create: { maxDistance: 50 } },
      },
    });
    const u2 = await prisma.user.create({
      data: {
        email: `u2_${Date.now()}@example.com`,
        passwordHash: 'x',
        name: 'User Two',
        birthDate: new Date('1996-01-01'),
        gender: 'FEMALE',
        interestedIn: 'MALE',
        status: 'ACTIVE',
        location: { lat: 37.5665, lng: 126.978 },
        settings: { create: { maxDistance: 50 } },
      },
    });
    user1Id = u1.id;
    user2Id = u2.id;
    user1Token = generateTokens({ userId: u1.id, email: u1.email }).accessToken;
    user2Token = generateTokens({ userId: u2.id, email: u2.email }).accessToken;
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
  });

  it('creates a match when both users like each other', async () => {
    const s1 = await request(app)
      .post('/api/swipe')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ targetUserId: user2Id, type: 'LIKE' });
    expect(s1.statusCode).toBe(200);
    expect(s1.body.match).toBe(false);

    const s2 = await request(app)
      .post('/api/swipe')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ targetUserId: user1Id, type: 'LIKE' });
    expect(s2.statusCode).toBe(200);
    expect(s2.body.match).toBe(true);
    expect(s2.body).toHaveProperty('matchId');
  });
});
