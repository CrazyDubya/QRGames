/**
 * Lobby API routes
 */
const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { validateLobbyId } = require('../utils/validation');

const router = express.Router();

/**
 * Create lobby routes with lobbies storage
 * @param {Storage} lobbies - The lobbies storage
 * @returns {Router} Express router
 */
function createLobbyRoutes(lobbies) {
  // Create a new lobby
  router.post('/create', async (req, res) => {
    try {
      const { gameType } = req.body;
      const lobbyId = uuidv4().substring(0, 8).toLowerCase();
      const lobby = {
        id: lobbyId,
        players: [],
        createdAt: new Date(),
        hostSocketId: null,
        gameType: gameType || null,
        gameState: null,
      };

      await lobbies.set(lobbyId, lobby);

      // Generate QR code
      const joinUrl = `${req.protocol}://${req.get('host')}/join.html?lobby=${lobbyId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(joinUrl);

      res.json({
        lobbyId,
        joinUrl,
        qrCode: qrCodeDataUrl,
      });
    } catch (error) {
      console.error('Error creating lobby:', error);
      res.status(500).json({ error: 'Failed to create lobby' });
    }
  });

  // Get lobby info
  router.get('/:lobbyId', async (req, res) => {
    try {
      const { lobbyId } = req.params;

      // Validate lobby ID format
      if (!validateLobbyId(lobbyId)) {
        return res.status(400).json({ error: 'Invalid lobby ID format' });
      }

      const lobby = await lobbies.get(lobbyId);

      if (!lobby) {
        return res.status(404).json({ error: 'Lobby not found' });
      }

      res.json({
        id: lobby.id,
        players: lobby.players,
        playerCount: lobby.players.length,
        gameType: lobby.gameType,
        gameState: lobby.gameState,
      });
    } catch (error) {
      console.error('Error getting lobby:', error);
      res.status(500).json({ error: 'Failed to get lobby information' });
    }
  });

  return router;
}

module.exports = createLobbyRoutes;
