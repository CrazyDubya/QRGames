/**
 * @fileoverview QRGames Server - Main entry point
 * Refactored for modularity and maintainability.
 * Supports both in-memory and Redis storage for session persistence.
 *
 * @module server
 * @requires express
 * @requires http
 * @requires socket.io
 * @requires ./src/routes/lobby
 * @requires ./src/sockets/lobby
 * @requires ./src/sockets/game
 * @requires ./src/utils/storage
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

/** @constant {number} Server port from environment or default */
const PORT = process.env.PORT || 3000;

/** @constant {string} Storage type: 'memory' or 'redis' */
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'memory';

/** @constant {string} Redis connection URL */
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/** @type {Storage} Global lobbies storage instance */
let lobbies;

/**
 * Initialize and start the server
 * Sets up storage, middleware, routes, and socket handlers
 * @async
 * @function initializeServer
 * @throws {Error} If server initialization fails
 */
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
