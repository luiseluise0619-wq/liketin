require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { setupWebSocket } = require('./websocket');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const swipeRoutes = require('./routes/swipe');
const matchRoutes = require('./routes/match');
const chatRoutes = require('./routes/chat');
const reportRoutes = require('./routes/report');
const adminRoutes = require('./routes/admin');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] },
});

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/', apiLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/admin', adminRoutes);

// Swagger docs (optional — only if the spec file exists).
const swaggerPath = path.join(__dirname, '../swagger/swagger.json');
if (fs.existsSync(swaggerPath)) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const swaggerUi = require('swagger-ui-express');
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const swaggerDocument = require(swaggerPath);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

setupWebSocket(io);

// Only start listening when run directly, so tests can import the app.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

module.exports = { app, httpServer, io };
