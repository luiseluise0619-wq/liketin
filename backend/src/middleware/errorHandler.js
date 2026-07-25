const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', details: err.details });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Duplicate entry', field: err.meta?.target });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

module.exports = errorHandler;
