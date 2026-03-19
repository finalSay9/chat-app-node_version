const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

module.exports = function initSocket(io) {

  // Authenticate every socket connection with JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${socket.user.username}`);

    // Mark user as online
    await pool.query('UPDATE users SET is_online = TRUE WHERE id = $1', [userId]);
    io.emit('user:online', { userId });

    // Join a conversation room to receive messages
    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId);
    });

    // Handle sending a message
    socket.on('message:send', async ({ conversationId, content }) => {
      if (!content || !content.trim()) return;

      try {
        // Verify sender is a participant
        const check = await pool.query(
          'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
          [conversationId, userId]
        );

        if (check.rows.length === 0) return;

        // Save message to database
        const result = await pool.query(
          `INSERT INTO messages (conversation_id, sender_id, content)
           VALUES ($1, $2, $3)
           RETURNING id, content, created_at`,
          [conversationId, userId, content.trim()]
        );

        const message = {
          ...result.rows[0],
          sender_id: userId,
          sender_username: socket.user.username,
          conversation_id: conversationId,
        };

        // Broadcast to everyone in the conversation room
        io.to(conversationId).emit('message:received', message);
      } catch (err) {
        console.error('Message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      await pool.query('UPDATE users SET is_online = FALSE WHERE id = $1', [userId]);
      io.emit('user:offline', { userId });
    });
  });
};