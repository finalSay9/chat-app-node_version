const jwt = require('jsonwebtoken')
const pool = require('../db/pool')

module.exports = function initSocket(io) {

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication error'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.user = decoded
      next()
    } catch {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', async (socket) => {
    const userId = socket.user.id
    console.log(`✅ Connected: ${socket.user.username} (socket: ${socket.id})`)

    await pool.query('UPDATE users SET is_online = TRUE WHERE id = $1', [userId])
    io.emit('user:online', { userId })

    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId)
      console.log(`${socket.user.username} joined room: ${conversationId}`)
    })

    socket.on('message:send', async ({ conversationId, content }) => {
      if (!content || !content.trim()) return

      console.log(`Message from ${socket.user.username} in room ${conversationId}`)

      try {
        const check = await pool.query(
          'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
          [conversationId, userId]
        )
        if (check.rows.length === 0) {
          console.log('User not a participant!')
          return
        }

        const result = await pool.query(
          `INSERT INTO messages (conversation_id, sender_id, content)
           VALUES ($1, $2, $3)
           RETURNING id, content, created_at`,
          [conversationId, userId, content.trim()]
        )

        const message = {
          ...result.rows[0],
          sender_id: userId,
          sender_username: socket.user.username,
          conversation_id: conversationId,
        }

        // Check who is in the room
        const room = io.sockets.adapter.rooms.get(conversationId)
        console.log(`Room ${conversationId} has ${room ? room.size : 0} socket(s)`)

        // Emit to everyone in the room INCLUDING the sender
        io.to(conversationId).emit('message:received', message)
        console.log(`Emitted message to room ${conversationId}`)
      } catch (err) {
        console.error('Message error:', err)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    socket.on('disconnect', async () => {
      console.log(`❌ Disconnected: ${socket.user.username}`)
      await pool.query('UPDATE users SET is_online = FALSE WHERE id = $1', [userId])
      io.emit('user:offline', { userId })
    })
  })
}