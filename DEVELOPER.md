# Developer Guide

## Project Structure

```
QRGames/
├── server.js                 # Main server entry point
├── src/
│   ├── games/               # Game logic modules
│   │   ├── bingo.js        # Bingo game implementation
│   │   └── trivia.js       # Trivia game implementation
│   ├── routes/              # Express route handlers
│   │   └── lobby.js        # Lobby API endpoints
│   ├── sockets/             # Socket.IO event handlers
│   │   ├── game.js         # Game-related socket events
│   │   └── lobby.js        # Lobby-related socket events
│   └── utils/               # Utility modules
│       ├── storage.js      # Storage abstraction (Memory/Redis)
│       └── validation.js   # Input validation utilities
├── tests/
│   └── unit/               # Unit tests
│       ├── game-logic.test.js
│       └── validation.test.js
├── public/                  # Static frontend files
└── package.json
```

## Development Setup

### Prerequisites
- Node.js >= 14
- npm

### Installation
```bash
npm install
```

### Running the Server

**Development mode (with in-memory storage):**
```bash
npm run dev
```

**With Redis (requires Redis server running):**
```bash
export STORAGE_TYPE=redis
export REDIS_URL=redis://localhost:6379
npm start
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Check code style with ESLint
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Architecture

### Modular Design

The codebase has been refactored into a modular architecture:

1. **Routes** (`src/routes/`): Express.js route handlers for HTTP API endpoints
2. **Sockets** (`src/sockets/`): Socket.IO event handlers for real-time communication
3. **Games** (`src/games/`): Pure game logic separate from networking concerns
4. **Utils** (`src/utils/`): Reusable utility functions and abstractions

### Storage Abstraction

The storage layer supports two backends:
- **Memory**: Fast, in-memory storage (default) - data lost on restart
- **Redis**: Persistent, distributed storage - survives restarts and supports scaling

Switch between storage types using the `STORAGE_TYPE` environment variable.

### Error Handling

All async operations are wrapped in try-catch blocks with:
- Error logging to console
- User-friendly error messages sent to clients
- Proper HTTP status codes for API endpoints

### Input Validation

All user input is validated and sanitized:
- Lobby IDs: 8-character lowercase hex format
- Player names: Max 30 characters, sanitized for control characters
- Avatars: Validated data URL format for images only

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- `tests/unit/` - Unit tests for pure functions and logic
- `tests/integration/` - Integration tests (planned)
- `tests/e2e/` - End-to-end tests (planned)

Current coverage: 16 passing unit tests

## Code Quality

### Linting

The project uses ESLint with Prettier integration:
```bash
npm run lint
npm run lint:fix
```

### Formatting

Prettier is configured for consistent code style:
```bash
npm run format
```

### JSDoc Comments

All modules are documented with JSDoc comments including:
- Function descriptions
- Parameter types
- Return types
- Type definitions (typedefs)

## API Documentation

### REST API Endpoints

**POST /api/lobby/create**
- Creates a new game lobby
- Returns: `{ lobbyId, joinUrl, qrCode }`

**GET /api/lobby/:lobbyId**
- Gets lobby information
- Returns: `{ id, players, playerCount, gameType, gameState }`

### Socket.IO Events

**Client → Server**
- `host-lobby` - Host connects to monitor lobby
- `join-lobby` - Player joins lobby
- `start-game` - Host starts game
- `submit-answer` - Submit trivia answer
- `next-question` - Move to next question
- `mark-number` - Mark bingo number
- `call-number` - Call next bingo number
- `claim-bingo` - Claim bingo win

**Server → Client**
- `player-joined` - New player joined
- `player-left` - Player disconnected
- `game-started` - Game has started
- `answer-result` - Trivia answer result
- `next-question` - Next trivia question
- `game-ended` - Game over with scores
- `number-called` - Bingo number called
- `number-marked` - Number marked on card
- `bingo-winner` - Player won bingo
- `error` - Error message

## Configuration

Environment variables can be set in a `.env` file (see `.env.example`):

```bash
PORT=3000
STORAGE_TYPE=memory  # or 'redis'
REDIS_URL=redis://localhost:6379
```

## Contributing

1. Follow the existing code style (enforced by ESLint/Prettier)
2. Add JSDoc comments for new functions
3. Write tests for new features
4. Run `npm test` and `npm run lint` before committing
5. Keep functions small and focused
6. Use meaningful variable names

## Troubleshooting

### Port Already in Use
If port 3000 is in use, either:
- Change the PORT environment variable
- Kill the process using port 3000

### Redis Connection Failed
If Redis storage is selected but connection fails:
- Ensure Redis server is running
- Check REDIS_URL is correct
- Server will automatically fallback to memory storage

### Tests Failing
- Ensure all dependencies are installed: `npm install`
- Check Node.js version is >= 14
- Clear node_modules and reinstall if needed

## Performance Considerations

- In-memory storage is faster but not persistent
- Redis storage enables horizontal scaling across multiple server instances
- Socket.IO rooms efficiently broadcast to specific lobbies
- Game logic is synchronous and fast (no blocking operations)

## Security

- Input validation on all user-provided data
- Avatar data URLs validated for image formats only
- Lobby IDs use cryptographically secure UUIDs
- Control characters stripped from player names
- Error messages don't expose internal implementation details
