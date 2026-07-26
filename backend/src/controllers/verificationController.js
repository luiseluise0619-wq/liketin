const prisma = require('../config/database');
const { uploadBuffer } = require('../services/storageService');

const VALID_TYPES = ['EMAIL', 'PHONE', 'IDENTITY', 'PHOTO'];

class VerificationController {
  async request(req, res, next) {
    try {
      const { type } = req.body;
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'Invalid verification type' });
      }
      const verification = await prisma.verification.create({
        data: { userId: req.user.id, type, status: 'pending' },
      });
      res.status(201).json({ message: 'Verification requested', verificationId: verification.id });
    } catch (error) {
      next(error);
    }
  }

  async uploadDocument(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Document required' });
      const verification = await prisma.verification.findFirst({
        where: { id: req.params.verificationId, userId: req.user.id },
      });
      if (!verification) return res.status(404).json({ error: 'Verification not found' });

      const url = await uploadBuffer(`verifications/${req.user.id}`, req.file);
      await prisma.verification.update({
        where: { id: verification.id },
        data: { documentUrl: url },
      });
      res.json({ message: 'Document uploaded' });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const verifications = await prisma.verification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ verifications });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VerificationController();
