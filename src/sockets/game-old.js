/**
 * Game socket event handlers
 */
const { initializeTriviaGame, checkAnswer, nextQuestion, getFinalScores } = require('../games/trivia');
const { initializeBingoGame, checkBingoPattern, callNumber } = require('../games/bingo');

/**
 * Setup game-related socket handlers
 * @param {Socket} socket - Socket.IO socket
 * @param {SocketIO} io - Socket.IO server instance
 * @param {Map} lobbies - The lobbies storage
 */
function setupGameHandlers(socket, io, lobbies) {
  // Start game
  socket.on('start-game', (data) => {
    try {
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
        gameState: lobby.gameState,
      });
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Trivia answer submission
  socket.on('submit-answer', (data) => {
    try {
      const { lobbyId, answer } = data;
      const lobby = lobbies.get(lobbyId);

      if (!lobby || lobby.gameType !== 'trivia') {
        return;
      }

      const player = lobby.players.find((p) => p.id === socket.id);
      if (!player) return;

      const isCorrect = checkAnswer(lobby, answer);

      if (isCorrect) {
        player.score = (player.score || 0) + 1;
      }

      const currentQuestion = lobby.gameState.questions[lobby.gameState.currentQuestionIndex];
      io.to(lobbyId).emit('answer-result', {
        playerId: socket.id,
        playerName: player.name,
        isCorrect,
        correctAnswer: currentQuestion.correctAnswer,
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  // Next trivia question
  socket.on('next-question', (lobbyId) => {
    try {
      const lobby = lobbies.get(lobbyId);

      if (!lobby || lobby.hostSocketId !== socket.id || lobby.gameType !== 'trivia') {
        return;
      }

      const result = nextQuestion(lobby);

      if (result.isGameOver) {
        io.to(lobbyId).emit('game-ended', {
          players: getFinalScores(lobby),
        });
      } else {
        io.to(lobbyId).emit('next-question', {
          questionIndex: lobby.gameState.currentQuestionIndex,
          question: lobby.gameState.questions[lobby.gameState.currentQuestionIndex],
        });
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
      socket.emit('error', { message: 'Failed to load next question' });
    }
  });

  // Bingo mark number
  socket.on('mark-number', (data) => {
    try {
      const { lobbyId, number } = data;
      const lobby = lobbies.get(lobbyId);

      if (!lobby || lobby.gameType !== 'bingo') {
        return;
      }

      const player = lobby.players.find((p) => p.id === socket.id);
      if (!player || !player.bingoCard) return;

      // Mark the number on player's card
      for (const row of player.bingoCard) {
        for (const cell of row) {
          if (cell.value === number) {
            cell.marked = true;
          }
        }
      }

      socket.emit('number-marked', { number });
    } catch (error) {
      console.error('Error marking number:', error);
      socket.emit('error', { message: 'Failed to mark number' });
    }
  });

  // Call next bingo number
  socket.on('call-number', (lobbyId) => {
    try {
      const lobby = lobbies.get(lobbyId);

      if (!lobby || lobby.hostSocketId !== socket.id || lobby.gameType !== 'bingo') {
        return;
      }

      const result = callNumber(lobby);

      if (result.number) {
        io.to(lobbyId).emit('number-called', {
          number: result.number,
          calledNumbers: result.calledNumbers,
        });
      }
    } catch (error) {
      console.error('Error calling number:', error);
      socket.emit('error', { message: 'Failed to call number' });
    }
  });

  // Claim bingo
  socket.on('claim-bingo', (data) => {
    try {
      const { lobbyId, pattern } = data;
      const lobby = lobbies.get(lobbyId);

      if (!lobby || lobby.gameType !== 'bingo') {
        return;
      }

      const player = lobby.players.find((p) => p.id === socket.id);
      if (!player || !player.bingoCard) return;

      const isValid = checkBingoPattern(player.bingoCard, pattern);

      if (isValid) {
        io.to(lobbyId).emit('bingo-winner', {
          playerId: socket.id,
          playerName: player.name,
          pattern,
        });
      } else {
        socket.emit('invalid-bingo');
      }
    } catch (error) {
      console.error('Error claiming bingo:', error);
      socket.emit('error', { message: 'Failed to verify bingo claim' });
    }
  });
}

module.exports = setupGameHandlers;
