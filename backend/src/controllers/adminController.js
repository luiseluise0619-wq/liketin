const prisma = require('../config/database');

class AdminController {
  async getDashboardStats(req, res, next) {
    try {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [
        totalUsers,
        activeUsers,
        newUsersToday,
        totalMatches,
        matchesToday,
        totalReports,
        pendingReports,
        premiumUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isOnline: true } }),
        prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.match.count(),
        prisma.match.count({ where: { matchedAt: { gte: dayAgo } } }),
        prisma.report.count(),
        prisma.report.count({ where: { status: 'pending' } }),
        prisma.user.count({ where: { premiumType: { not: 'NONE' } } }),
      ]);

      res.json({
        totalUsers,
        activeUsers,
        newUsersToday,
        totalMatches,
        matchesToday,
        totalReports,
        pendingReports,
        premiumUsers,
        premiumRate: totalUsers ? ((premiumUsers / totalUsers) * 100).toFixed(2) : '0.00',
      });
    } catch (error) {
      next(error);
    }
  }

  async getReports(req, res, next) {
    try {
      const { status = 'pending', page = 1, limit = 20 } = req.query;
      const where = status !== 'all' ? { status } : undefined;

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          include: {
            reporter: { select: { id: true, name: true, email: true } },
            reported: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: parseInt(limit, 10),
        }),
        prisma.report.count({ where }),
      ]);

      res.json({
        reports,
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req, res, next) {
    try {
      const { reportId } = req.params;
      const { status, action } = req.body;

      const report = await prisma.report.update({
        where: { id: reportId },
        data: { status, action, reviewedBy: req.user.id, reviewedAt: new Date() },
      });

      if (action === 'suspend') {
        await prisma.user.update({
          where: { id: report.reportedId },
          data: { status: 'SUSPENDED' },
        });
      } else if (action === 'ban') {
        await prisma.user.update({
          where: { id: report.reportedId },
          data: { status: 'BANNED' },
        });
      }

      await prisma.adminLog.create({
        data: {
          adminId: req.user.id,
          action: `Report ${status}: ${action}`,
          targetId: report.reportedId,
          details: { reportId, reason: report.reason },
        },
      });

      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const { search, status, page = 1, limit = 20 } = req.query;
      const where = {};
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            premiumType: true,
            createdAt: true,
            _count: {
              select: {
                matchesAsUser1: true,
                matchesAsUser2: true,
                reportsReceived: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: parseInt(limit, 10),
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        users,
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      const user = await prisma.user.update({ where: { id: userId }, data: { status } });
      await prisma.adminLog.create({
        data: {
          adminId: req.user.id,
          action: `User status changed to ${status}`,
          targetId: userId,
        },
      });
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getAdminLogs(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const logs = await prisma.adminLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit, 10),
      });
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
