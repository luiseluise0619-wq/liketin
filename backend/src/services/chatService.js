const prisma = require('../config/database');
const { messaging } = require('../config/firebase');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class ChatService {
  async sendMessage(matchId, senderId, content, type = 'TEXT', mediaUrl = null) {
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: senderId }, { user2Id: senderId }],
        status: 'MATCHED',
      },
    });
    if (!match) throw new Error('Match not found or not active');

    const receiverId = match.user1Id === senderId ? match.user2Id : match.user1Id;

    const message = await prisma.message.create({
      data: { matchId, senderId, receiverId, content, type, mediaUrl, status: 'SENT' },
      include: {
        sender: {
          select: { id: true, name: true, photos: { where: { isMain: true }, take: 1 } },
        },
      },
    });

    await redis.hincrby(`unread:${receiverId}`, matchId, 1);
    await this.sendPushNotification(receiverId, message);
    return message;
  }

  async getMessages(matchId, userId, cursor = null, limit = 50) {
    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ user1Id: userId }, { user2Id: userId }] },
    });
    if (!match) throw new Error('Match not found');

    const where = { matchId };
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, photos: { where: { isMain: true }, take: 1 } },
        },
      },
    });

    await prisma.message.updateMany({
      where: { matchId, receiverId: userId, status: { not: 'READ' } },
      data: { status: 'READ', readAt: new Date() },
    });
    await redis.hdel(`unread:${userId}`, matchId);

    return messages.reverse();
  }

  async markAsRead(matchId, userId) {
    await prisma.message.updateMany({
      where: { matchId, receiverId: userId, status: { not: 'READ' } },
      data: { status: 'READ', readAt: new Date() },
    });
    await redis.hdel(`unread:${userId}`, matchId);
  }

  async sendPushNotification(userId, message) {
    if (!messaging) return;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });
      if (!user?.fcmToken) return;

      await messaging.send({
        token: user.fcmToken,
        notification: {
          title: message.sender.name,
          body: message.type === 'TEXT' ? message.content : 'New message',
        },
        data: {
          type: 'MESSAGE',
          matchId: String(message.matchId),
          senderId: String(message.senderId),
        },
        android: { priority: 'high', notification: { channelId: 'messages' } },
        apns: { payload: { aps: { badge: 1, sound: 'default' } } },
      });
    } catch (error) {
      logger.error('Push notification error:', error);
    }
  }
}

module.exports = new ChatService();
