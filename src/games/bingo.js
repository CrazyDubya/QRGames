/**
 * Bingo game logic
 */

/**
 * Generate a bingo card
 * @returns {Array} 5x5 bingo card
 */
function generateBingoCard() {
  const card = [];
  const ranges = [
    [1, 15], // B
    [16, 30], // I
    [31, 45], // N
    [46, 60], // G
    [61, 75], // O
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
    transposed.push(card.map((col) => col[row]));
  }

  return transposed;
}

/**
 * Initialize bingo game state for a lobby
 * @param {object} lobby - The lobby to initialize
 */
function initializeBingoGame(lobby) {
  lobby.gameState = {
    calledNumbers: [],
    patterns: ['single-line', '4-corners', 'full-card'],
  };

  // Generate bingo cards for all players
  lobby.players.forEach((player) => {
    player.bingoCard = generateBingoCard();
  });
}

/**
 * Check if a bingo pattern is valid
 * @param {Array} card - The bingo card
 * @param {string} pattern - The pattern to check
 * @returns {boolean} True if pattern is complete
 */
function checkBingoPattern(card, pattern) {
  if (pattern === 'single-line') {
    // Check rows
    for (const row of card) {
      if (row.every((cell) => cell.marked)) {
        return true;
      }
    }

    // Check columns
    for (let col = 0; col < 5; col++) {
      if (card.every((row) => row[col].marked)) {
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
    return (
      card[0][0].marked && card[0][4].marked && card[4][0].marked && card[4][4].marked
    );
  } else if (pattern === 'full-card') {
    return card.every((row) => row.every((cell) => cell.marked));
  }

  return false;
}

/**
 * Call a random available bingo number
 * @param {object} lobby - The lobby
 * @returns {{number: number|null, calledNumbers: Array}} Called number result
 */
function callNumber(lobby) {
  if (!lobby.gameState || lobby.gameType !== 'bingo') {
    return { number: null, calledNumbers: [] };
  }

  const availableNumbers = [];
  for (let i = 1; i <= 75; i++) {
    if (!lobby.gameState.calledNumbers.includes(i)) {
      availableNumbers.push(i);
    }
  }

  if (availableNumbers.length === 0) {
    return { number: null, calledNumbers: lobby.gameState.calledNumbers };
  }

  const number = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
  lobby.gameState.calledNumbers.push(number);

  return {
    number,
    calledNumbers: lobby.gameState.calledNumbers,
  };
}

module.exports = {
  generateBingoCard,
  initializeBingoGame,
  checkBingoPattern,
  callNumber,
};
