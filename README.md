# QRGames
Party Games with QR Code Lobby System

## Features

- **QR Code Lobby System**: Create game lobbies that players can join by scanning a QR code
- **Player Profiles**: Players can create profiles with:
  - Custom name (required)
  - Optional selfie using device camera
  - Upload photo from device
  - Auto-generated initials as default avatar
- **Real-time Updates**: See players join the lobby in real-time using WebSocket
- **Mobile-Friendly**: Responsive design works on phones, tablets, and desktops

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CrazyDubya/QRGames.git
cd QRGames
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## How to Use

### Creating a Lobby (Host)

1. Open `http://localhost:3000` in your browser
2. Click "Create Lobby"
3. A unique QR code will be generated
4. Share the QR code or join URL with players

### Joining a Game (Players)

1. Scan the QR code with your mobile device camera
2. Enter your name
3. Choose an avatar option:
   - **Take Selfie**: Use your device camera to take a photo
   - **Upload Photo**: Select an existing photo from your device
   - **Use Initials**: Default option that shows your initials
4. Click "Join Game"
5. Wait in the lobby for the game to start

### Viewing the Lobby

The host can see:
- The lobby code
- The QR code for sharing
- The join URL
- All players who have joined in real-time
- Player count

## Technology Stack

- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **QR Code Generation**: qrcode library
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Unique IDs**: UUID

## Project Structure

```
QRGames/
├── server.js           # Express server with Socket.IO
├── package.json        # Project dependencies
├── public/
│   ├── index.html      # Lobby creation page
│   └── join.html       # Player join page
└── README.md          # This file
```

## API Endpoints

### POST /api/lobby/create
Creates a new lobby and returns lobby information with QR code.

**Response:**
```json
{
  "lobbyId": "abc12345",
  "joinUrl": "http://localhost:3000/join.html?lobby=abc12345",
  "qrCode": "data:image/png;base64,..."
}
```

### GET /api/lobby/:lobbyId
Gets information about a specific lobby.

**Response:**
```json
{
  "id": "abc12345",
  "players": [...],
  "playerCount": 2
}
```

## WebSocket Events

### Client → Server
- `host-lobby`: Host connects to monitor a lobby
- `join-lobby`: Player joins a lobby with their profile

### Server → Client
- `player-joined`: Notifies when a player joins
- `player-left`: Notifies when a player disconnects
- `error`: Sends error messages

## Future Enhancements

- Game selection and gameplay mechanics
- Persistent storage (database)
- Player authentication
- Multiple game rooms
- Game state management
- Scoring system
- Chat functionality

## License

ISC 
