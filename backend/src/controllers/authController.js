const authService = require('../services/authService');
const { registerSchema, loginSchema } = require('../utils/validators');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const result = await authService.register(value);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Register error:', error);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const result = await authService.login(value.email, value.password);
      res.json(result);
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      next(error);
    }
  }

  async socialLogin(req, res, next) {
    try {
      const { idToken, provider } = req.body;
      if (!idToken || !provider) {
        return res.status(400).json({ error: 'idToken and provider are required' });
      }
      const result = await authService.socialLogin(idToken, provider);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh token expired', code: 'REFRESH_EXPIRED' });
      }
      if (error.code === 'REFRESH_REVOKED' || error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Refresh token invalid', code: 'REFRESH_REVOKED' });
      }
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      const result = await authService.resetPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.body.refreshToken);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
