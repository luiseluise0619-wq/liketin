const prisma = require('../config/database');
const { messaging } = require('../config/firebase');
const logger = require('../utils/logger');

class NotificationService {
  async createNotification(userId, type, title, body, data = {}) {
    const notification = await prisma.notification.create({
      data: { userId, type, title, body, data },
    });
    await this.sendPushNotification(userId, title, body, { type, ...data });
    return notification;
  }

  async sendMatchNotification(userId, matchedUserId) {
    const matchedUser = await prisma.user.findUnique({
      where: { id: matchedUserId },
      select: { name: true, photos: { where: { isMain: true }, take: 1 } },
    });
    await this.createNotification(
      userId,
      'MATCH',
      'New Match! 🎉',
      `You matched with ${matchedUser.name}!`,
      { matchedUserId, photoUrl: matchedUser.photos[0]?.url || '' }
    );
  }

  async sendLikeNotification(userId, likerId, isSuperLike = false) {
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings?.likeNotifications) return;

    const liker = await prisma.user.findUnique({
      where: { id: likerId },
      select: { name: true },
    });

    const title = isSuperLike ? 'Super Like! ⭐' : 'Someone liked you! ❤️';
    const body = isSuperLike ? `${liker.name} super liked you!` : 'Someone liked your profile';
    await this.createNotification(userId, isSuperLike ? 'SUPER_LIKE' : 'LIKE', title, body, {
      likerId,
    });
  }

  async sendPushNotification(userId, title, body, data = {}) {
    if (!messaging) return;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });
      if (!user?.fcmToken) return;

      await messaging.send({
        token: user.fcmToken,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries({ type: data.type || 'SYSTEM', ...data }).map(([k, v]) => [k, String(v)])
        ),
        android: { priority: 'high' },
        apns: { payload: { aps: { badge: 1, sound: 'default' } } },
      });
    } catch (error) {
      logger.error('Push notification error:', error);
      if (error.code === 'messaging/registration-token-not-registered') {
        await prisma.user.update({ where: { id: userId }, data: { fcmToken: null } });
      }
    }
  }

  async getNotifications(userId, page = 1, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async markAsRead(notificationId, userId) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }
}

module.exports = new NotificationService();
