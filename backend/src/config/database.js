const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// NOTE: To receive query events via prisma.$on('query') the log entries must
// be configured with `emit: 'event'`. Using plain strings (e.g. ['query'])
// logs straight to stdout and $on('query') would never fire (and throws in
// strict setups). This is the corrected configuration.
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'info' },
          { emit: 'stdout', level: 'warn' },
          { emit: 'stdout', level: 'error' },
        ]
      : [{ emit: 'stdout', level: 'error' }],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query} (${e.duration}ms)`);
  });
}

module.exports = prisma;
