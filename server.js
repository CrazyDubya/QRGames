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
const MAX_PLAYER_NAME_LENGTH = 30;
const LOBBY_ID_REGEX = /^[a-f0-9]{8}$/;

// Store lobbies in memory
const lobbies = new Map();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Create a new lobby
app.post('/api/lobby/create', async (req, res) => {
  const { gameType } = req.body;
  const lobbyId = uuidv4().substring(0, 8).toLowerCase();
  const lobby = {
    id: lobbyId,
    players: [],
    createdAt: new Date(),
    hostSocketId: null,
    gameType: gameType || null,
    gameState: null
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
  
  // Validate lobby ID format
  if (!lobbyId || typeof lobbyId !== 'string' || !LOBBY_ID_REGEX.test(lobbyId)) {
    return res.status(400).json({ error: 'Invalid lobby ID format' });
  }
  
  const lobby = lobbies.get(lobbyId);
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  
  res.json({
    id: lobby.id,
    players: lobby.players,
    playerCount: lobby.players.length,
    gameType: lobby.gameType,
    gameState: lobby.gameState
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Host joins to monitor lobby
  socket.on('host-lobby', (lobbyId) => {
    // Validate lobby ID format
    if (!lobbyId || typeof lobbyId !== 'string' || !LOBBY_ID_REGEX.test(lobbyId)) {
      socket.emit('error', { message: 'Invalid lobby ID' });
      return;
    }
    
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
    
    // Validate lobby ID format (should be 8 character lowercase hex)
    if (!lobbyId || typeof lobbyId !== 'string' || !LOBBY_ID_REGEX.test(lobbyId)) {
      socket.emit('error', { message: 'Invalid lobby ID' });
      return;
    }
    
    const lobby = lobbies.get(lobbyId);
    
    if (!lobby) {
      socket.emit('error', { message: 'Lobby not found' });
      return;
    }
    
    // Validate player data
    if (!player || typeof player.name !== 'string' || player.name.trim().length === 0) {
      socket.emit('error', { message: 'Invalid player name' });
      return;
    }
    
    // Sanitize player name (limit length and remove control characters)
    const sanitizedName = player.name.trim().substring(0, MAX_PLAYER_NAME_LENGTH).replace(/[\x00-\x1F\x7F]/g, '');
    
    // Validate avatar if provided (must be a data URL for image)
    let sanitizedAvatar = null;
    if (player.avatar && typeof player.avatar === 'string') {
      if (/^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(player.avatar)) {
        sanitizedAvatar = player.avatar;
      }
    }
    
    // Add player to lobby
    const playerData = {
      id: socket.id,
      name: sanitizedName,
      avatar: sanitizedAvatar,
      joinedAt: new Date()
    };
    
    lobby.players.push(playerData);
    socket.join(lobbyId);
    
    // Notify all clients in the lobby
    io.to(lobbyId).emit('player-joined', {
      player: playerData,
      players: lobby.players
    });
    
    console.log(`Player ${sanitizedName} joined lobby ${lobbyId}`);
  });
  
  // Start game
  socket.on('start-game', (data) => {
    const { lobbyId, gameType } = data;
    const lobby = lobbies.get(lobbyId);
    
    if (!lobby || lobby.hostSocketId !== socket.id) {
      return;
    }
    
    lobby.gameType = gameType;
    
    if (gameType === 'trivia') {
      initializeTriviaGame(lobby);
    } else if (gameType === 'bingo') {
      initializeBingoGame(lobby);
    }
    
    io.to(lobbyId).emit('game-started', {
      gameType: lobby.gameType,
      gameState: lobby.gameState
    });
  });
  
  // Trivia answer submission
  socket.on('submit-answer', (data) => {
    const { lobbyId, answer } = data;
    const lobby = lobbies.get(lobbyId);
    
    if (!lobby || lobby.gameType !== 'trivia') {
      return;
    }
    
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return;
    
    const currentQuestion = lobby.gameState.questions[lobby.gameState.currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      player.score = (player.score || 0) + 1;
    }
    
    io.to(lobbyId).emit('answer-result', {
      playerId: socket.id,
      playerName: player.name,
      isCorrect,
      correctAnswer: currentQuestion.correctAnswer
    });
  });
  
  // Next trivia question
  socket.on('next-question', (lobbyId) => {
    const lobby = lobbies.get(lobbyId);
    
    if (!lobby || lobby.hostSocketId !== socket.id || lobby.gameType !== 'trivia') {
      return;
    }
    
    lobby.gameState.currentQuestionIndex++;
    
    if (lobby.gameState.currentQuestionIndex >= lobby.gameState.questions.length) {
      io.to(lobbyId).emit('game-ended', {
        players: lobby.players.map(p => ({
          name: p.name,
          score: p.score || 0
        })).sort((a, b) => b.score - a.score)
      });
    } else {
      io.to(lobbyId).emit('next-question', {
        questionIndex: lobby.gameState.currentQuestionIndex,
        question: lobby.gameState.questions[lobby.gameState.currentQuestionIndex]
      });
    }
  });
  
  // Bingo mark number
  socket.on('mark-number', (data) => {
    const { lobbyId, number } = data;
    const lobby = lobbies.get(lobbyId);
    
    if (!lobby || lobby.gameType !== 'bingo') {
      return;
    }
    
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player || !player.bingoCard) return;
    
    // Mark the number on player's card
    for (let row of player.bingoCard) {
      for (let cell of row) {
        if (cell.value === number) {
          cell.marked = true;
        }
      }
    }
    
    socket.emit('number-marked', { number });
  });
  
  // Call next bingo number
  socket.on('call-number', (lobbyId) => {
    const lobby = lobbies.get(lobbyId);
    
    if (!lobby || lobby.hostSocketId !== socket.id || lobby.gameType !== 'bingo') {
      return;
    }
    
    const availableNumbers = [];
    for (let i = 1; i <= 75; i++) {
      if (!lobby.gameState.calledNumbers.includes(i)) {
        availableNumbers.push(i);
      }
    }
    
    if (availableNumbers.length === 0) {
      return;
    }
    
    const number = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    lobby.gameState.calledNumbers.push(number);
    
    io.to(lobbyId).emit('number-called', {
      number,
      calledNumbers: lobby.gameState.calledNumbers
    });
  });
  
  // Claim bingo
  socket.on('claim-bingo', (data) => {
    const { lobbyId, pattern } = data;
    const lobby = lobbies.get(lobbyId);
    
    if (!lobby || lobby.gameType !== 'bingo') {
      return;
    }
    
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player || !player.bingoCard) return;
    
    const isValid = checkBingoPattern(player.bingoCard, pattern);
    
    if (isValid) {
      io.to(lobbyId).emit('bingo-winner', {
        playerId: socket.id,
        playerName: player.name,
        pattern
      });
    } else {
      socket.emit('invalid-bingo');
    }
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

// Game initialization functions
function initializeTriviaGame(lobby) {
  const triviaQuestions = [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: "Paris"
    },
    {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: "4"
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: "Mars"
    },
    {
      question: "What is the largest ocean on Earth?",
      options: ["Atlantic", "Indian", "Arctic", "Pacific"],
      correctAnswer: "Pacific"
    },
    {
      question: "Who painted the Mona Lisa?",
      options: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"],
      correctAnswer: "Leonardo da Vinci"
    }
  ];
  
  lobby.gameState = {
    questions: triviaQuestions,
    currentQuestionIndex: 0
  };
  
  // Initialize player scores
  lobby.players.forEach(player => {
    player.score = 0;
  });
}

function initializeBingoGame(lobby) {
  lobby.gameState = {
    calledNumbers: [],
    patterns: ['single-line', '4-corners', 'full-card']
  };
  
  // Generate bingo cards for all players
  lobby.players.forEach(player => {
    player.bingoCard = generateBingoCard();
  });
}

function generateBingoCard() {
  const card = [];
  const ranges = [
    [1, 15],   // B
    [16, 30],  // I
    [31, 45],  // N
    [46, 60],  // G
    [61, 75]   // O
  ];
  
  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];
    const usedNumbers = new Set();
    const column = [];
    
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) {
        // Free space in the middle
        column.push({ value: 'FREE', marked: true });
      } else {
        let num;
        do {
          num = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (usedNumbers.has(num));
        usedNumbers.add(num);
        column.push({ value: num, marked: false });
      }
    }
    card.push(column);
  }
  
  // Transpose to get rows
  const transposed = [];
  for (let row = 0; row < 5; row++) {
    transposed.push(card.map(col => col[row]));
  }
  
  return transposed;
}

function checkBingoPattern(card, pattern) {
  if (pattern === 'single-line') {
    // Check rows
    for (let row of card) {
      if (row.every(cell => cell.marked)) {
        return true;
      }
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
      if (card.every(row => row[col].marked)) {
        return true;
      }
    }
    
    // Check diagonals
    if (card.every((row, i) => row[i].marked)) {
      return true;
    }
    if (card.every((row, i) => row[4 - i].marked)) {
      return true;
    }
  } else if (pattern === '4-corners') {
    return card[0][0].marked && card[0][4].marked && 
           card[4][0].marked && card[4][4].marked;
  } else if (pattern === 'full-card') {
    return card.every(row => row.every(cell => cell.marked));
  }
  
  return false;
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to create a lobby`);
});
