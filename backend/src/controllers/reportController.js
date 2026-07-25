const prisma = require('../config/database');
const { reportSchema } = require('../utils/validators');
const logger = require('../utils/logger');

class ReportController {
  async createReport(req, res, next) {
    try {
      const { error, value } = reportSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      if (value.reportedId === req.user.id) {
        return res.status(400).json({ error: 'Cannot report yourself' });
      }

      const report = await prisma.report.create({
        data: {
          reporterId: req.user.id,
          reportedId: value.reportedId,
          reason: value.reason,
          description: value.description,
        },
      });

      // Auto-block on report (idempotent).
      await prisma.block.upsert({
        where: {
          blockerId_blockedId: { blockerId: req.user.id, blockedId: value.reportedId },
        },
        update: {},
        create: { blockerId: req.user.id, blockedId: value.reportedId },
      });

      logger.info(`Report created: ${report.id} by ${req.user.id}`);
      res.status(201).json({ message: 'Report submitted', report });
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req, res, next) {
    try {
      const { userId } = req.body;
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot block yourself' });
      }

      await prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: req.user.id, blockedId: userId } },
        update: {},
        create: { blockerId: req.user.id, blockedId: userId },
      });

      await prisma.match.updateMany({
        where: {
          OR: [
            { user1Id: req.user.id, user2Id: userId },
            { user1Id: userId, user2Id: req.user.id },
          ],
        },
        data: { status: 'BLOCKED' },
      });

      res.json({ message: 'User blocked' });
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req, res, next) {
    try {
      await prisma.block.deleteMany({
        where: { blockerId: req.user.id, blockedId: req.params.userId },
      });
      res.json({ message: 'User unblocked' });
    } catch (error) {
      next(error);
    }
  }

  async getBlockedUsers(req, res, next) {
    try {
      const blocks = await prisma.block.findMany({
        where: { blockerId: req.user.id },
        include: {
          blocked: {
            select: { id: true, name: true, photos: { where: { isMain: true }, take: 1 } },
          },
        },
      });
      res.json({ blockedUsers: blocks.map((b) => b.blocked) });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
