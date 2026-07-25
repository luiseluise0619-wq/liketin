const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../config/database');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        isAdmin: true,
        premiumType: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requirePremium = (types = []) => (req, res, next) => {
  if (req.user.premiumType === 'NONE' || (types.length && !types.includes(req.user.premiumType))) {
    return res.status(403).json({ error: 'Premium subscription required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requirePremium };
