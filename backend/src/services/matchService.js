const prisma = require('../config/database');

class MatchService {
  async getMatches(userId) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: 'MATCHED',
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            photos: { where: { isMain: true }, take: 1 },
            isOnline: true,
            lastActiveAt: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            photos: { where: { isMain: true }, take: 1 },
            isOnline: true,
            lastActiveAt: true,
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { matchedAt: 'desc' },
    });

    return matches.map((match) => {
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      return {
        matchId: match.id,
        user: otherUser,
        lastMessage: match.messages[0] || null,
        matchedAt: match.matchedAt,
      };
    });
  }

  async unmatch(userId, matchId) {
    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ user1Id: userId }, { user2Id: userId }] },
    });
    if (!match) throw new Error('Match not found');

    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'UNMATCHED', unmatchedAt: new Date(), unmatchedBy: userId },
    });

    return { message: 'Unmatched successfully' };
  }
}

module.exports = new MatchService();
