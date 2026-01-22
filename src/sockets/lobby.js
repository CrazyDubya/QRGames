/**
 * Lobby socket event handlers
 */
const { validateLobbyId, validatePlayerData } = require('../utils/validation');

/**
 * Setup lobby-related socket handlers
 * @param {Socket} socket - Socket.IO socket
 * @param {SocketIO} io - Socket.IO server instance
 * @param {Storage} lobbies - The lobbies storage
 */
function setupLobbyHandlers(socket, io, lobbies) {
  // Host joins to monitor lobby
  socket.on('host-lobby', async (lobbyId) => {
    try {
      // Validate lobby ID format
      if (!validateLobbyId(lobbyId)) {
        socket.emit('error', { message: 'Invalid lobby ID' });
        return;
      }

      const lobby = await lobbies.get(lobbyId);
      if (lobby) {
        lobby.hostSocketId = socket.id;
        await lobbies.set(lobbyId, lobby);
        socket.join(lobbyId);
        console.log(`Host joined lobby: ${lobbyId}`);
      }
    } catch (error) {
      console.error('Error in host-lobby:', error);
      socket.emit('error', { message: 'Failed to join lobby as host' });
    }
  });

  // Player joins lobby
  socket.on('join-lobby', async (data) => {
    try {
      const { lobbyId, player } = data;

      // Validate lobby ID format
      if (!validateLobbyId(lobbyId)) {
        socket.emit('error', { message: 'Invalid lobby ID' });
        return;
      }

      const lobby = await lobbies.get(lobbyId);

      if (!lobby) {
        socket.emit('error', { message: 'Lobby not found' });
        return;
      }

      // Validate player data
      const validation = validatePlayerData(player);
      if (!validation.valid) {
        socket.emit('error', { message: validation.error });
        return;
      }

      // Add player to lobby
      const playerData = {
        id: socket.id,
        name: validation.sanitized.name,
        avatar: validation.sanitized.avatar,
        joinedAt: new Date(),
      };

      lobby.players.push(playerData);
      await lobbies.set(lobbyId, lobby);
      socket.join(lobbyId);

      // Notify all clients in the lobby
      io.to(lobbyId).emit('player-joined', {
        player: playerData,
        players: lobby.players,
      });

      console.log(`Player ${validation.sanitized.name} joined lobby ${lobbyId}`);
    } catch (error) {
      console.error('Error in join-lobby:', error);
      socket.emit('error', { message: 'Failed to join lobby' });
    }
  });

  // Player leaves
  socket.on('disconnect', async () => {
    try {
      console.log('Client disconnected:', socket.id);

      // Remove player from all lobbies
      await lobbies.forEach(async (lobby, lobbyId) => {
        const playerIndex = lobby.players.findIndex((p) => p.id === socket.id);
        if (playerIndex !== -1) {
          const player = lobby.players[playerIndex];
          lobby.players.splice(playerIndex, 1);
          await lobbies.set(lobbyId, lobby);

          io.to(lobbyId).emit('player-left', {
            playerId: socket.id,
            playerName: player.name,
            players: lobby.players,
          });
        }
      });
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });
}

module.exports = setupLobbyHandlers;
