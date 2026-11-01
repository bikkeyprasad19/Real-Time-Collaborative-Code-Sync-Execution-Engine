const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const executionService = require('./services/executionService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../client')));

// Store room data: { roomId: { users: Map, code: string, language: string } }
const rooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Map(),
        code: '# Write your code here\nprint("Hello, World!")',
        language: 'python'
      });
    }

    const room = rooms.get(roomId);

    // Add user to room
    room.users.set(socket.id, {
      username: username || `User${socket.id.substring(0, 4)}`,
      socketId: socket.id
    });

    // Send current code state to the new user
    socket.emit('sync-code', {
      code: room.code,
      language: room.language
    });

    // Notify all users in the room about the new user
    io.to(roomId).emit('user-joined', {
      users: Array.from(room.users.values()),
      message: `${room.users.get(socket.id).username} joined the room`
    });

    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle code changes
  socket.on('code-change', ({ roomId, code }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.code = code;
      // Broadcast to all other users in the room
      socket.to(roomId).emit('code-update', { code });
    }
  });

  // Handle language changes
  socket.on('language-change', ({ roomId, language }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.language = language;
      // Broadcast to all users in the room
      io.to(roomId).emit('language-update', { language });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Find and remove user from all rooms
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        const username = room.users.get(socket.id).username;
        room.users.delete(socket.id);

        // Notify remaining users
        io.to(roomId).emit('user-left', {
          users: Array.from(room.users.values()),
          message: `${username} left the room`
        });

        // Clean up empty rooms after 5 minutes
        if (room.users.size === 0) {
          setTimeout(() => {
            if (rooms.has(roomId) && rooms.get(roomId).users.size === 0) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} deleted due to inactivity`);
            }
          }, 5 * 60 * 1000);
        }
      }
    });
  });
});

// REST API endpoint for code execution
app.post('/api/execute', async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      success: false,
      error: 'Code and language are required'
    });
  }

  try {
    const result = await executionService.executeCode(code, language);
    res.json(result);
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during code execution'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size
  });
});

// Serve the main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🐳 Docker execution service initialized\n`);
});
