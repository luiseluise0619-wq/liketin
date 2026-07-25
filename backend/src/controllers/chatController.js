const prisma = require('../config/database');
const chatService = require('../services/chatService');
const aiService = require('../services/aiService');
const { messageSchema } = require('../utils/validators');

class ChatController {
  async sendMessage(req, res, next) {
    try {
      const { error, value } = messageSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const moderation = await aiService.moderateContent(value.content);
      if (!moderation.appropriate) {
        return res
          .status(400)
          .json({ error: 'Message contains inappropriate content', reason: moderation.reason });
      }

      const message = await chatService.sendMessage(
        value.matchId,
        req.user.id,
        value.content,
        value.type,
        value.mediaUrl
      );
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { matchId } = req.params;
      const cursor = req.query.cursor;
      const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
      const messages = await chatService.getMessages(matchId, req.user.id, cursor, limit);
      res.json({ messages });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      await chatService.markAsRead(req.params.matchId, req.user.id);
      res.json({ message: 'Marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async getIcebreaker(req, res, next) {
    try {
      const { matchId } = req.params;
      const match = await prisma.match.findFirst({
        where: { id: matchId, OR: [{ user1Id: req.user.id }, { user2Id: req.user.id }] },
        include: {
          user1: { select: { id: true, interests: true } },
          user2: { select: { id: true, interests: true } },
        },
      });
      if (!match) return res.status(404).json({ error: 'Match not found' });

      const otherUser = match.user1Id === req.user.id ? match.user2 : match.user1;
      const suggestion = await aiService.suggestIcebreaker({ interests: otherUser.interests });
      res.json({ suggestion });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
