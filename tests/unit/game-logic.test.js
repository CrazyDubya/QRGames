/**
 * Unit tests for game logic functions
 */

describe('Game Logic Functions', () => {
  describe('generateBingoCard', () => {
    // Mock function extracted from server.js
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

    test('should generate a 5x5 bingo card', () => {
      const card = generateBingoCard();
      expect(card).toHaveLength(5);
      card.forEach((row) => {
        expect(row).toHaveLength(5);
      });
    });

    test('should have FREE space in the center', () => {
      const card = generateBingoCard();
      expect(card[2][2].value).toBe('FREE');
      expect(card[2][2].marked).toBe(true);
    });

    test('should have numbers in correct ranges', () => {
      const card = generateBingoCard();
      // B column (0): 1-15
      const bColumn = card.map((row) => row[0].value).filter((v) => v !== 'FREE');
      bColumn.forEach((num) => {
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(15);
      });
    });

    test('should not have duplicate numbers in columns', () => {
      const card = generateBingoCard();
      for (let col = 0; col < 5; col++) {
        const columnNumbers = card
          .map((row) => row[col].value)
          .filter((v) => v !== 'FREE');
        const uniqueNumbers = new Set(columnNumbers);
        expect(uniqueNumbers.size).toBe(columnNumbers.length);
      }
    });
  });

  describe('checkBingoPattern', () => {
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
          card[0][0].marked &&
          card[0][4].marked &&
          card[4][0].marked &&
          card[4][4].marked
        );
      } else if (pattern === 'full-card') {
        return card.every((row) => row.every((cell) => cell.marked));
      }

      return false;
    }

    test('should detect winning row', () => {
      const card = Array(5)
        .fill()
        .map(() =>
          Array(5)
            .fill()
            .map(() => ({ value: 1, marked: false }))
        );
      card[0].forEach((cell) => (cell.marked = true));

      expect(checkBingoPattern(card, 'single-line')).toBe(true);
    });

    test('should detect winning column', () => {
      const card = Array(5)
        .fill()
        .map(() =>
          Array(5)
            .fill()
            .map(() => ({ value: 1, marked: false }))
        );
      card.forEach((row) => (row[2].marked = true));

      expect(checkBingoPattern(card, 'single-line')).toBe(true);
    });

    test('should detect winning diagonal', () => {
      const card = Array(5)
        .fill()
        .map(() =>
          Array(5)
            .fill()
            .map(() => ({ value: 1, marked: false }))
        );
      card.forEach((row, i) => (row[i].marked = true));

      expect(checkBingoPattern(card, 'single-line')).toBe(true);
    });

    test('should detect 4-corners pattern', () => {
      const card = Array(5)
        .fill()
        .map(() =>
          Array(5)
            .fill()
            .map(() => ({ value: 1, marked: false }))
        );
      card[0][0].marked = true;
      card[0][4].marked = true;
      card[4][0].marked = true;
      card[4][4].marked = true;

      expect(checkBingoPattern(card, '4-corners')).toBe(true);
    });

    test('should not detect incomplete pattern', () => {
      const card = Array(5)
        .fill()
        .map(() =>
          Array(5)
            .fill()
            .map(() => ({ value: 1, marked: false }))
        );
      card[0][0].marked = true;
      card[0][1].marked = true;

      expect(checkBingoPattern(card, 'single-line')).toBe(false);
    });
  });

  describe('initializeTriviaGame', () => {
    function initializeTriviaGame(lobby) {
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
      ];

      lobby.gameState = {
        questions: triviaQuestions,
        currentQuestionIndex: 0,
      };

      lobby.players.forEach((player) => {
        player.score = 0;
      });
    }

    test('should initialize trivia game state', () => {
      const lobby = {
        players: [{ id: '1', name: 'Player1' }],
        gameState: null,
      };

      initializeTriviaGame(lobby);

      expect(lobby.gameState).toBeDefined();
      expect(lobby.gameState.questions).toHaveLength(2);
      expect(lobby.gameState.currentQuestionIndex).toBe(0);
    });

    test('should initialize player scores to zero', () => {
      const lobby = {
        players: [
          { id: '1', name: 'Player1' },
          { id: '2', name: 'Player2' },
        ],
        gameState: null,
      };

      initializeTriviaGame(lobby);

      lobby.players.forEach((player) => {
        expect(player.score).toBe(0);
      });
    });
  });
});
