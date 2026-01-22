/**
 * QRGames Server - Main entry point
 * Refactored for modularity and maintainability
 */
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import modules
const createLobbyRoutes = require('./src/routes/lobby');
const setupLobbyHandlers = require('./src/sockets/lobby');
const setupGameHandlers = require('./src/sockets/game');
const { createStorage } = require('./src/utils/storage');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'memory'; // 'memory' or 'redis'
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize storage
let lobbies;

async function initializeServer() {
  try {
    // Create storage instance
    if (STORAGE_TYPE === 'redis') {
      lobbies = await createStorage('redis', { url: REDIS_URL });
    } else {
      lobbies = await createStorage('memory');
    }
    console.log(`Using ${STORAGE_TYPE} storage`);

    // Middleware
    app.use(express.json());
    app.use(express.static('public'));

    // API Routes
    app.use('/api/lobby', createLobbyRoutes(lobbies));

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Setup socket event handlers
      setupLobbyHandlers(socket, io, lobbies);
      setupGameHandlers(socket, io, lobbies);
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT} to create a lobby`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Initialize and start server
initializeServer();

// Export for testing
module.exports = { app, server, io, lobbies };

