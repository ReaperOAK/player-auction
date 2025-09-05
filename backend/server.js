const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./src/routes/auth');
const playerRoutes = require('./src/routes/players');
const teamRoutes = require('./src/routes/teams');
const auctionRoutes = require('./src/routes/auction');

// Import socket handlers
const { default: socketHandlers } = require('./src/services/socketHandlers');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      const raw = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "http://localhost:3000";
      const allowed = raw.split(',').map(s => s.trim()).filter(Boolean);
      // Allow non-browser requests (e.g., socket clients without origin)
      if (!origin) return callback(null, true);
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error('CORS origin not allowed'));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
// Support multiple origins via CORS_ORIGINS env var (comma-separated)
const corsOriginsRaw = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "http://localhost:3000";
const corsWhitelist = corsOriginsRaw.split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., server-to-server, curl)
    if (!origin) return callback(null, true);
    if (corsWhitelist.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Player Auction API is running' });
});

// Middleware to pass io instance to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/auction', auctionRoutes);

// Socket.IO connection handling
socketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
// Use app.use without a path to avoid path-to-regexp parsing issues for wildcards
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled for real-time communication`);
  console.log(`🌍 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:3000"}`);
});

module.exports = { app, server, io };
