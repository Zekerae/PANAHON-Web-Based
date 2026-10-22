# PANAHON: Chrono Shift

> A web-based cooperative and competitive time-travel game set across Philippine history.

PANAHON: Chrono Shift is an online multiplayer game where players navigate historical eras, collect artifacts, solve clues, and protect the timeline. The project includes a Vite-powered browser client and a Node.js WebSocket server for room-based multiplayer sessions.

## Features

- Create and join multiplayer rooms using a short room code
- Support for up to four players per room
- Select unique player roles
- Synchronize game actions and state over WebSockets
- Historical artifacts, clues, dangers, decoys, events, characters, and map assets
- Responsive browser-based interface

## Technology Stack

- **Frontend:** Vanilla JavaScript, Vite, HTML, CSS
- **Backend:** Node.js, HTTP, `ws` WebSocket server
- **Package manager:** npm
- **Development server:** Vite

## Project Structure

```text
.
├── PANAHON-Web-Based/
│   ├── Panahon_ Game Assets/   # Game artwork and card assets
│   └── panahon-game/
│       ├── public/             # Publicly served assets
│       ├── src/                # Frontend source code and game logic
│       ├── index.html          # Application entry point
│       ├── server.js           # Multiplayer HTTP/WebSocket server
│       ├── package.json        # Scripts and dependencies
│       └── vite.config.js      # Vite configuration
└── README.md
```

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A modern web browser

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install dependencies

```bash
cd "PANAHON-Web-Based/panahon-game"
npm install
```

### 3. Start the frontend

In the `panahon-game` directory, run:

```bash
npm run dev
```

Vite will print the local development URL in the terminal, usually `http://localhost:5173`.

### 4. Start the multiplayer server

Open a second terminal in the same directory and run:

```bash
npm run server
```

The WebSocket server listens on port `3001` by default. To use another port:

```bash
# macOS/Linux
PORT=4000 npm run server

# Windows PowerShell
$env:PORT=4000; npm run server
```

The server exposes a health endpoint at `http://localhost:3001/` and a WebSocket endpoint at `ws://localhost:3001`.

## Available Scripts

Run these commands from `PANAHON-Web-Based/panahon-game`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run server` | Start the multiplayer WebSocket server |
| `npm run build` | Create a production frontend build in `dist/` |
| `npm run preview` | Preview the production frontend build locally |

## Multiplayer Development

1. Start both the Vite frontend and the WebSocket server.
2. Open the frontend in two or more browser windows.
3. Create a room in one window and join it from the others.
4. Use the room code and different player roles for each participant.

When deploying the frontend and server separately, configure the client to use the deployed WebSocket URL instead of the local `ws://localhost:3001` endpoint.

## Production Build

Build the frontend with:

```bash
npm run build
```

The generated static files are placed in `dist/`. Start the multiplayer server separately with:

```bash
npm run server
```

Set the `PORT` environment variable in the hosting environment when the default port `3001` is unavailable.

## Game Data and Assets

Frontend game data and gameplay systems are located in `PANAHON-Web-Based/panahon-game/src/`. Original game artwork is stored in `PANAHON-Web-Based/Panahon_ Game Assets/`.

Before redistributing the project or its assets, confirm that all artwork, fonts, sounds, and other third-party resources are licensed for that use.

## Contributing

1. Create a feature branch.
2. Keep frontend and server changes focused and documented.
3. Run `npm run build` before opening a pull request.
4. Describe gameplay, networking, or asset changes clearly in the pull request.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | Port used by the Node.js multiplayer server |

## License

Add the project license here.

## Credits

Add contributors, designers, artists, educators, and other project credits here.