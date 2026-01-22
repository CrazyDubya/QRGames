/**
 * @fileoverview Trivia game logic and state management
 * Contains functions for initializing trivia games, checking answers,
 * managing question progression, and calculating final scores.
 *
 * @module games/trivia
 */

/**
 * @typedef {Object} TriviaQuestion
 * @property {string} question - The question text
 * @property {string[]} options - Array of answer options
 * @property {string} correctAnswer - The correct answer
 */

/**
 * @typedef {Object} TriviaGameState
 * @property {TriviaQuestion[]} questions - Array of trivia questions
 * @property {number} currentQuestionIndex - Index of current question
 */

/**
 * @typedef {Object} Lobby
 * @property {string} id - Unique lobby identifier
 * @property {Player[]} players - Array of players in the lobby
 * @property {string} gameType - Type of game ('trivia' or 'bingo')
 * @property {TriviaGameState|BingoGameState} gameState - Current game state
 */

/**
 * @typedef {Object} Player
 * @property {string} id - Socket ID of the player
 * @property {string} name - Player's display name
 * @property {number} [score] - Player's score (for trivia)
 */

/** @type {TriviaQuestion[]} Default trivia questions */
const triviaQuestions = [
  {
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
  },
  {
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
  },
  {
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 'Mars',
  },
  {
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correctAnswer: 'Pacific',
  },
  {
    question: 'Who painted the Mona Lisa?',
    options: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Michelangelo'],
    correctAnswer: 'Leonardo da Vinci',
  },
];

/**
 * Initialize trivia game state for a lobby
 * Sets up questions and initializes all player scores to zero
 *
 * @param {Lobby} lobby - The lobby to initialize
 * @returns {void}
 */
function initializeTriviaGame(lobby) {
  lobby.gameState = {
    questions: triviaQuestions,
    currentQuestionIndex: 0,
  };

  // Initialize player scores
  lobby.players.forEach((player) => {
    player.score = 0;
  });
}

/**
 * Check if an answer is correct
 *
 * @param {Lobby} lobby - The lobby with game state
 * @param {string} answer - The submitted answer
 * @returns {boolean} True if answer is correct
 */
function checkAnswer(lobby, answer) {
  if (!lobby.gameState || lobby.gameType !== 'trivia') {
    return false;
  }

  const currentQuestion = lobby.gameState.questions[lobby.gameState.currentQuestionIndex];
  return answer === currentQuestion.correctAnswer;
}

/**
 * Move to next question in the trivia game
 * Increments the question index and checks if game is over
 *
 * @param {Lobby} lobby - The lobby
 * @returns {{hasNext: boolean, isGameOver: boolean}} Next question status
 */
function nextQuestion(lobby) {
  if (!lobby.gameState || lobby.gameType !== 'trivia') {
    return { hasNext: false, isGameOver: true };
  }

  lobby.gameState.currentQuestionIndex++;

  const isGameOver = lobby.gameState.currentQuestionIndex >= lobby.gameState.questions.length;

  return {
    hasNext: !isGameOver,
    isGameOver,
  };
}

/**
 * Get final scores sorted by score (highest first)
 *
 * @param {Lobby} lobby - The lobby
 * @returns {Array<{name: string, score: number}>} Sorted player scores
 */
function getFinalScores(lobby) {
  return lobby.players
    .map((p) => ({
      name: p.name,
      score: p.score || 0,
    }))
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  initializeTriviaGame,
  checkAnswer,
  nextQuestion,
  getFinalScores,
};
