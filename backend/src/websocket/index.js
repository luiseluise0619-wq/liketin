const { setupChatHandlers } = require('./chatHandler');
const { setupCallHandlers } = require('./callHandler');

const setupWebSocket = (io) => {
  setupChatHandlers(io);
  setupCallHandlers(io);
};

module.exports = { setupWebSocket };
