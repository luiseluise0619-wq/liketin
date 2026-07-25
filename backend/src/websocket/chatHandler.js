const chatService = require('../services/chatService');
const prisma = require('../config/database');
const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const connectedUsers = new Map(); // userId -> socketId

const setupChatHandlers = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    connectedUsers.set(userId, socket.id);

    prisma.user
      .update({ where: { id: userId }, data: { isOnline: true, lastActiveAt: new Date() } })
      .catch((e) => logger.error('online update failed', e));

    logger.info(`User connected: ${userId}`);

    socket.on('join_match', async (matchId) => {
      const match = await prisma.match.findFirst({
        where: {
          id: matchId,
          OR: [{ user1Id: userId }, { user2Id: userId }],
          status: 'MATCHED',
        },
      });
      if (match) {
        socket.join(`match:${matchId}`);
        socket.to(`match:${matchId}`).emit('user_online', { userId });
      }
    });

    socket.on('leave_match', (matchId) => {
      socket.leave(`match:${matchId}`);
      socket.to(`match:${matchId}`).emit('user_offline', { userId });
    });

    socket.on('send_message', async (data) => {
      try {
        const { matchId, content, type = 'TEXT', mediaUrl } = data;
        const message = await chatService.sendMessage(matchId, userId, content, type, mediaUrl);
        io.to(`match:${matchId}`).emit('new_message', message);

        const receiverSocketId = connectedUsers.get(message.receiverId);
        const room = io.sockets.adapter.rooms.get(`match:${matchId}`);
        if (receiverSocketId && !room?.has(receiverSocketId)) {
          io.to(receiverSocketId).emit('new_message_notification', {
            matchId,
            message: {
              id: message.id,
              senderId: message.senderId,
              content: message.content,
              type: message.type,
              createdAt: message.createdAt,
            },
          });
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('typing', (data) => {
      socket.to(`match:${data.matchId}`).emit('typing', { userId, isTyping: data.isTyping });
    });

    socket.on('mark_read', async (data) => {
      try {
        await chatService.markAsRead(data.matchId, userId);
        socket.to(`match:${data.matchId}`).emit('messages_read', { by: userId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', async () => {
      connectedUsers.delete(userId);
      await prisma.user
        .update({ where: { id: userId }, data: { isOnline: false, lastActiveAt: new Date() } })
        .catch(() => {});
      logger.info(`User disconnected: ${userId}`);
    });
  });
};

const getConnectedUsers = () => connectedUsers;

module.exports = { setupChatHandlers, getConnectedUsers };
