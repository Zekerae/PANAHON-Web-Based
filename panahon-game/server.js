// ===== PANAHON: CHRONO SHIFT - WebSocket Game Server =====

import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', server: 'PANAHON Game Server', rooms: rooms.size }));
});

const wss = new WebSocketServer({ server });

// Room storage
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function broadcast(room, message, excludeWs = null) {
  room.players.forEach(player => {
    if (player.ws !== excludeWs && player.ws.readyState === 1) {
      player.ws.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  let currentRoom = null;
  let currentPlayerId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case 'CREATE_ROOM': {
          let roomCode;
          do {
            roomCode = generateRoomCode();
          } while (rooms.has(roomCode));

          const playerId = 0;
          const room = {
            code: roomCode,
            host: playerId,
            players: [{
              id: playerId,
              name: msg.playerName,
              roleKey: msg.roleKey,
              ws,
              connected: true
            }],
            gameStarted: false,
            state: null
          };

          rooms.set(roomCode, room);
          currentRoom = room;
          currentPlayerId = playerId;

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomCode,
            playerId
          }));

          console.log(`Room ${roomCode} created by ${msg.playerName}`);
          break;
        }

        case 'JOIN_ROOM': {
          const room = rooms.get(msg.roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found!' }));
            return;
          }
          if (room.players.length >= 4) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full!' }));
            return;
          }
          if (room.gameStarted) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Game already started!' }));
            return;
          }

          // Check role not taken
          const roleTaken = room.players.some(p => p.roleKey === msg.roleKey);
          if (roleTaken) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Role already taken!' }));
            return;
          }

          const playerId = room.players.length;
          room.players.push({
            id: playerId,
            name: msg.playerName,
            roleKey: msg.roleKey,
            ws,
            connected: true
          });

          currentRoom = room;
          currentPlayerId = playerId;

          // Notify joiner
          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            roomCode: msg.roomCode,
            playerId,
            players: room.players.map(p => ({
              id: p.id,
              name: p.name,
              roleKey: p.roleKey,
              connected: p.connected
            }))
          }));

          // Notify existing players
          broadcast(room, {
            type: 'PLAYER_JOINED',
            player: {
              id: playerId,
              name: msg.playerName,
              roleKey: msg.roleKey
            }
          }, ws);

          console.log(`${msg.playerName} joined room ${msg.roomCode}`);
          break;
        }

        case 'START_GAME': {
          if (!currentRoom || currentPlayerId !== currentRoom.host) return;
          currentRoom.gameStarted = true;
          
          // Broadcast game start with player configs
          broadcast(currentRoom, {
            type: 'GAME_START',
            players: currentRoom.players.map(p => ({
              id: p.id,
              name: p.name,
              roleKey: p.roleKey
            }))
          });
          break;
        }

        case 'GAME_ACTION': {
          if (!currentRoom) return;
          // Broadcast action to all other players
          broadcast(currentRoom, {
            type: 'GAME_ACTION',
            playerId: currentPlayerId,
            action: msg.action
          }, ws);
          break;
        }

        case 'STATE_UPDATE': {
          if (!currentRoom || currentPlayerId !== currentRoom.host) return;
          currentRoom.state = msg.state;
          broadcast(currentRoom, {
            type: 'STATE_UPDATE',
            state: msg.state
          }, ws);
          break;
        }
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom && currentPlayerId !== null) {
      const player = currentRoom.players.find(p => p.id === currentPlayerId);
      if (player) {
        player.connected = false;
        broadcast(currentRoom, {
          type: 'PLAYER_LEFT',
          playerId: currentPlayerId
        });
      }

      // Clean up empty rooms
      const connected = currentRoom.players.filter(p => p.connected);
      if (connected.length === 0) {
        rooms.delete(currentRoom.code);
        console.log(`Room ${currentRoom.code} closed (empty)`);
      }
    }
    console.log('Client disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PANAHON Game Server running on port ${PORT} (0.0.0.0)`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
