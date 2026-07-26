const prisma = require('../config/database');
const notificationService = require('../services/notificationService');

class NotificationController {
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
      const notifications = await notificationService.getNotifications(req.user.id, page, limit);
      res.json({ notifications });
    } catch (error) {
      next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      await notificationService.markAsRead(req.params.id, req.user.id);
      res.json({ message: 'Marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async registerToken(req, res, next) {
    try {
      const { fcmToken } = req.body;
      if (!fcmToken) return res.status(400).json({ error: 'fcmToken required' });
      await prisma.user.update({ where: { id: req.user.id }, data: { fcmToken } });
      res.json({ message: 'Token registered' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
