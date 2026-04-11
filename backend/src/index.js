require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const initSocket = require('./socket/chat');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // React dev server port
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Debug - check what's being imported
// console.log('authRoutes:', typeof authRoutes, authRoutes);
// console.log('chatRoutes:', typeof chatRoutes, chatRoutes);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);


// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.IO
initSocket(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


