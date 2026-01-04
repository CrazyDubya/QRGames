const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store lobbies in memory
const lobbies = new Map();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Create a new lobby
app.post('/api/lobby/create', async (req, res) => {
  const lobbyId = uuidv4().substring(0, 8);
  const lobby = {
    id: lobbyId,
    players: [],
    createdAt: new Date(),
    hostSocketId: null
  };
  
  lobbies.set(lobbyId, lobby);
  
  // Generate QR code
  const joinUrl = `${req.protocol}://${req.get('host')}/join.html?lobby=${lobbyId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(joinUrl);
  
  res.json({
    lobbyId,
    joinUrl,
    qrCode: qrCodeDataUrl
  });
});

// Get lobby info
app.get('/api/lobby/:lobbyId', (req, res) => {
  const { lobbyId } = req.params;
  const lobby = lobbies.get(lobbyId);
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  
  res.json({
    id: lobby.id,
    players: lobby.players,
    playerCount: lobby.players.length
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Host joins to monitor lobby
  socket.on('host-lobby', (lobbyId) => {
    const lobby = lobbies.get(lobbyId);
    if (lobby) {
      lobby.hostSocketId = socket.id;
      socket.join(lobbyId);
      console.log(`Host joined lobby: ${lobbyId}`);
    }
  });
  
  // Player joins lobby
  socket.on('join-lobby', (data) => {
    const { lobbyId, player } = data;
    const lobby = lobbies.get(lobbyId);
    
    if (!lobby) {
      socket.emit('error', { message: 'Lobby not found' });
      return;
    }
    
    // Add player to lobby
    const playerData = {
      id: socket.id,
      name: player.name,
      avatar: player.avatar || null,
      joinedAt: new Date()
    };
    
    lobby.players.push(playerData);
    socket.join(lobbyId);
    
    // Notify all clients in the lobby
    io.to(lobbyId).emit('player-joined', {
      player: playerData,
      players: lobby.players
    });
    
    console.log(`Player ${player.name} joined lobby ${lobbyId}`);
  });
  
  // Player leaves
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove player from all lobbies
    lobbies.forEach((lobby, lobbyId) => {
      const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = lobby.players[playerIndex];
        lobby.players.splice(playerIndex, 1);
        
        io.to(lobbyId).emit('player-left', {
          playerId: socket.id,
          playerName: player.name,
          players: lobby.players
        });
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to create a lobby`);
});
