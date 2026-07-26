const prisma = require('../config/database');
const { auth } = require('../config/firebase');
const { hashPassword, comparePassword } = require('../utils/encryption');
const tokenService = require('./tokenService');
const logger = require('../utils/logger');

class AuthService {
  async register(data) {
    const {
      email,
      password,
      name,
      birthDate,
      gender,
      interestedIn,
      authProvider,
      authProviderId,
    } = data;

    let passwordHash = null;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        birthDate: new Date(birthDate),
        gender,
        interestedIn,
        authProvider: authProvider || 'email',
        authProviderId,
        status: 'ACTIVE',
        settings: { create: {} },
      },
      select: { id: true, email: true, name: true, status: true },
    });

    const tokens = await tokenService.issue({ userId: user.id, email: user.email });
    logger.info(`User registered: ${user.id}`);
    return { user, ...tokens };
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    if (user.status !== 'ACTIVE') {
      throw new Error('Account not active');
    }

    const tokens = await tokenService.issue({ userId: user.id, email: user.email });
    logger.info(`User logged in: ${user.id}`);
    return { user: this.sanitize(user), ...tokens };
  }

  async socialLogin(idToken, provider) {
    if (!auth) throw new Error('Firebase auth not configured');

    let firebaseUser;
    try {
      firebaseUser = await auth.verifyIdToken(idToken);
    } catch (error) {
      throw new Error('Invalid Firebase token');
    }

    let user = await prisma.user.findFirst({
      where: { authProvider: provider, authProviderId: firebaseUser.uid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: firebaseUser.email,
          name: firebaseUser.name || firebaseUser.email.split('@')[0],
          authProvider: provider,
          authProviderId: firebaseUser.uid,
          emailVerified: firebaseUser.email_verified || false,
          status: 'ACTIVE',
          settings: { create: {} },
        },
      });
    }

    const tokens = await tokenService.issue({ userId: user.id, email: user.email });
    return { user: this.sanitize(user), ...tokens };
  }

  async refreshToken(refreshToken) {
    // Rotates the refresh token and rejects revoked/reused ones.
    return tokenService.rotate(refreshToken);
  }

  async logout(refreshToken) {
    if (refreshToken) await tokenService.revoke(refreshToken);
    return { message: 'Logged out successfully' };
  }

  async resetPassword(email) {
    if (!auth) throw new Error('Firebase auth not configured');
    await auth.generatePasswordResetLink(email);
    logger.info(`Password reset requested for: ${email}`);
    return { message: 'Password reset email sent' };
  }

  sanitize(user) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}

module.exports = new AuthService();
