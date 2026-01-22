/**
 * Trivia game logic
 */

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
 * @param {object} lobby - The lobby to initialize
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
 * @param {object} lobby - The lobby
 * @param {string} answer - The submitted answer
 * @returns {boolean} True if correct
 */
function checkAnswer(lobby, answer) {
  if (!lobby.gameState || lobby.gameType !== 'trivia') {
    return false;
  }

  const currentQuestion = lobby.gameState.questions[lobby.gameState.currentQuestionIndex];
  return answer === currentQuestion.correctAnswer;
}

/**
 * Move to next question
 * @param {object} lobby - The lobby
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
 * Get final scores sorted by score
 * @param {object} lobby - The lobby
 * @returns {Array} Sorted player scores
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
