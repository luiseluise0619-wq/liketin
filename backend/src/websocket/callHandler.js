const { getConnectedUsers } = require('./chatHandler');

// WebRTC signaling relay for voice/video calls. The actual media stream is P2P;
// the server only forwards SDP offers/answers and ICE candidates.
const setupCallHandlers = (io) => {
  io.on('connection', (socket) => {
    const relay = (event) => (data) => {
      const targetSocketId = getConnectedUsers().get(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit(event, { ...data, from: socket.userId });
      } else {
        socket.emit('call_error', { message: 'User is offline' });
      }
    };

    socket.on('call_offer', relay('call_offer'));
    socket.on('call_answer', relay('call_answer'));
    socket.on('ice_candidate', relay('ice_candidate'));
    socket.on('end_call', relay('call_ended'));
    socket.on('reject_call', relay('call_rejected'));
  });
};

module.exports = { setupCallHandlers };
