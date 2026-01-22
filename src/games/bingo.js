/**
 * @fileoverview Bingo game logic and card generation
 * Implements 75-ball bingo with multiple win patterns including
 * single line, 4-corners, and full card patterns.
 *
 * @module games/bingo
 */

/**
 * @typedef {Object} BingoCell
 * @property {number|string} value - The cell value (number 1-75 or 'FREE')
 * @property {boolean} marked - Whether the cell has been marked
 */

/**
 * @typedef {Object} BingoGameState
 * @property {number[]} calledNumbers - Array of numbers that have been called
 * @property {string[]} patterns - Available win patterns
 */

/**
 * Generate a standard 75-ball bingo card
 * Card follows traditional bingo rules:
 * - B column (0): 1-15
 * - I column (1): 16-30
 * - N column (2): 31-45 (with FREE space at center)
 * - G column (3): 46-60
 * - O column (4): 61-75
 *
 * @returns {BingoCell[][]} 5x5 bingo card (array of rows)
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
 * Generates unique bingo cards for all players
 *
 * @param {Lobby} lobby - The lobby to initialize
 * @returns {void}
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
 * Check if a bingo pattern is complete on a card
 * Supports three pattern types:
 * - single-line: Any row, column, or diagonal
 * - 4-corners: All four corner cells
 * - full-card: All cells marked (blackout)
 *
 * @param {BingoCell[][]} card - The bingo card to check
 * @param {string} pattern - The pattern type to check
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
    return card[0][0].marked && card[0][4].marked && card[4][0].marked && card[4][4].marked;
  } else if (pattern === 'full-card') {
    return card.every((row) => row.every((cell) => cell.marked));
  }

  return false;
}

/**
 * Call a random available bingo number
 * Numbers range from 1-75 and are only called once
 *
 * @param {Lobby} lobby - The lobby with game state
 * @returns {{number: number|null, calledNumbers: number[]}} Called number result
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
