const prisma = require('../config/database');
const { calculateDistance } = require('../utils/location');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

class SwipeService {
  async getRecommendations(userId, limit = 10) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true, interests: true },
    });

    if (!user.settings || !user.settings.showMe) return [];

    const loc = user.location || {};
    const { lat, lng } = loc;
    if (lat === undefined || lng === undefined) {
      throw new Error('Location required');
    }

    // Exclusions: already swiped + blocked (both directions) + self.
    const [swiped, blocksMade, blocksReceived] = await Promise.all([
      prisma.swipe.findMany({ where: { swiperId: userId }, select: { swipedId: true } }),
      prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
      prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
    ]);

    const excludedIds = new Set([userId]);
    swiped.forEach((s) => excludedIds.add(s.swipedId));
    blocksMade.forEach((b) => excludedIds.add(b.blockedId));
    blocksReceived.forEach((b) => excludedIds.add(b.blockerId));

    const birthDateMin = new Date();
    birthDateMin.setFullYear(birthDateMin.getFullYear() - user.settings.maxAge);
    const birthDateMax = new Date();
    birthDateMax.setFullYear(birthDateMax.getFullYear() - user.settings.minAge);

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludedIds) },
        status: 'ACTIVE',
        gender: user.interestedIn === 'BOTH' ? undefined : user.interestedIn,
        interestedIn: { in: [user.gender, 'BOTH'] },
        birthDate: { gte: birthDateMin, lte: birthDateMax },
        settings: { showMe: true },
      },
      include: { photos: { orderBy: { order: 'asc' } }, interests: true },
      take: limit * 5, // over-fetch; distance/score filtering happens in JS
    });

    const scored = candidates
      .filter((c) => c.location && c.location.lat !== undefined && c.location.lng !== undefined)
      .map((c) => {
        const distance = calculateDistance(lat, lng, c.location.lat, c.location.lng);
        const commonInterests = c.interests.filter((ci) =>
          user.interests.some((ui) => ui.name === ci.name)
        ).length;
        const photoScore =
          c.photos.reduce((s, p) => s + (p.aiScore || 0.5), 0) / (c.photos.length || 1);
        const completeness = this.calculateCompleteness(c);
        return {
          candidate: c,
          distance,
          score: commonInterests * 10 + photoScore * 20 + completeness * 15 - distance * 0.5,
        };
      })
      .filter((x) => x.distance <= user.settings.maxDistance)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ candidate: c, distance }) => ({
      id: c.id,
      name: c.name,
      age: this.calculateAge(c.birthDate),
      bio: c.bio,
      job: c.job,
      height: c.height,
      mbti: c.mbti,
      distance: Math.round(distance),
      photos: c.photos,
      interests: c.interests,
      isOnline: c.isOnline,
      lastActive: c.lastActiveAt,
    }));
  }

  async swipe(userId, targetUserId, type) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const now = new Date();

    // Reset daily like counter if the window has passed.
    if (now > new Date(user.dailyLikesResetAt)) {
      const reset = new Date();
      reset.setHours(24, 0, 0, 0);
      await prisma.user.update({
        where: { id: userId },
        data: { dailyLikesCount: 0, dailyLikesResetAt: reset },
      });
      user.dailyLikesCount = 0;
    }

    if (user.premiumType === 'NONE' && type !== 'NOPE') {
      if (user.dailyLikesCount >= 50) {
        throw new Error('Daily like limit reached. Upgrade to premium.');
      }
    }

    if (type === 'SUPER_LIKE') {
      if (now > new Date(user.superLikesResetAt)) {
        const reset = new Date();
        reset.setHours(24, 0, 0, 0);
        await prisma.user.update({
          where: { id: userId },
          data: { superLikesCount: 0, superLikesResetAt: reset },
        });
        user.superLikesCount = 0;
      }
      const limit =
        user.premiumType === 'NONE'
          ? 1
          : user.premiumType === 'PLATINUM'
            ? Infinity
            : 5;
      if (user.superLikesCount >= limit) {
        throw new Error('Super like limit reached');
      }
    }

    // Upsert prevents crashes on duplicate swipes (unique constraint).
    const swipe = await prisma.swipe.upsert({
      where: { swiperId_swipedId: { swiperId: userId, swipedId: targetUserId } },
      update: { type },
      create: { swiperId: userId, swipedId: targetUserId, type },
    });

    if (type === 'LIKE') {
      await prisma.user.update({
        where: { id: userId },
        data: { dailyLikesCount: { increment: 1 } },
      });
    } else if (type === 'SUPER_LIKE') {
      await prisma.user.update({
        where: { id: userId },
        data: { superLikesCount: { increment: 1 } },
      });
    }

    if (type === 'LIKE' || type === 'SUPER_LIKE') {
      const reciprocal = await prisma.swipe.findFirst({
        where: {
          swiperId: targetUserId,
          swipedId: userId,
          type: { in: ['LIKE', 'SUPER_LIKE'] },
        },
      });

      if (reciprocal) {
        const [a, b] = userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId];
        const match = await prisma.match.upsert({
          where: { user1Id_user2Id: { user1Id: a, user2Id: b } },
          update: { status: 'MATCHED' },
          create: { user1Id: a, user2Id: b, status: 'MATCHED' },
        });

        await Promise.all([
          notificationService.sendMatchNotification(userId, targetUserId),
          notificationService.sendMatchNotification(targetUserId, userId),
        ]);

        return { swipe, match: true, matchId: match.id };
      }

      await notificationService.sendLikeNotification(targetUserId, userId, type === 'SUPER_LIKE');
    }

    return { swipe, match: false };
  }

  async undoSwipe(userId, targetUserId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.premiumType === 'NONE') {
      throw new Error('Premium subscription required to undo swipes');
    }

    const swipe = await prisma.swipe.findUnique({
      where: { swiperId_swipedId: { swiperId: userId, swipedId: targetUserId } },
    });
    if (!swipe) throw new Error('Swipe not found');

    if (Date.now() - swipe.createdAt.getTime() > 24 * 60 * 60 * 1000) {
      throw new Error('Cannot undo swipe after 24 hours');
    }

    await prisma.swipe.delete({ where: { id: swipe.id } });

    if (swipe.type === 'LIKE' || swipe.type === 'SUPER_LIKE') {
      const [a, b] = userId < targetUserId ? [userId, targetUserId] : [targetUserId, userId];
      await prisma.match.deleteMany({ where: { user1Id: a, user2Id: b } });
    }

    logger.info(`Swipe undone: ${userId} -> ${targetUserId}`);
    return { message: 'Swipe undone' };
  }

  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  calculateCompleteness(user) {
    let score = 0;
    if (user.bio) score += 1;
    if (user.job) score += 1;
    if (user.height) score += 1;
    if (user.mbti) score += 1;
    if (user.photos && user.photos.length > 0) score += 1;
    if (user.interests && user.interests.length > 0) score += 1;
    return score / 6;
  }
}

module.exports = new SwipeService();
