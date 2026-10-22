// ===== PANAHON: CHRONO SHIFT - WebSocket Game Server =====

import { WebSocketServer } from 'ws';
import http from 'http';

// Process-level crash protection
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught exception in relay server:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled promise rejection at:', promise, 'reason:', reason);
});

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

wss.on('error', (err) => {
  console.error('[CRITICAL] WebSocketServer error:', err);
});

// Room storage: roomCode -> room object
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getPublicPlayers(room) {
  if (!room || !Array.isArray(room.players)) return [];
  return room.players.map(p => ({
    id: p.id,
    name: p.name,
    roleKey: p.roleKey,
    isHost: p.id === room.host,
    connected: p.connected
  }));
}

function broadcast(room, message, excludeWs = null) {
  if (!room || !Array.isArray(room.players)) return;
  const data = typeof message === 'string' ? message : JSON.stringify(message);
  room.players.forEach(player => {
    if (player && player.ws !== excludeWs && player.ws && player.ws.readyState === 1) {
      try {
        player.ws.send(data);
      } catch (err) {
        console.error(`Broadcast error to player ${player.id}:`, err?.message || err);
      }
    }
  });
}

function handlePlayerExit(room, playerId, ws) {
  try {
    if (!room || playerId === null || !Array.isArray(room.players)) return;

    if (!room.gameStarted) {
      // Before game starts:
      if (playerId === room.host) {
        // Host left: close the room and notify remaining players
        console.log(`Host left lobby. Closing room ${room.code}`);
        broadcast(room, {
          type: 'ROOM_CLOSED',
          message: 'The Host left the anomaly lobby. Room closed.'
        }, ws);
        rooms.delete(room.code);
        return;
      }

      // Non-host left before game start: completely remove player from room
      const leavingPlayer = room.players.find(p => p.id === playerId);
      room.players = room.players.filter(p => p.id !== playerId);

      // Re-index remaining players cleanly so IDs are contiguous 0..N-1
      room.players.forEach((p, idx) => {
        p.id = idx;
        if (p.ws && p.ws.readyState === 1) {
          try {
            p.ws.send(JSON.stringify({
              type: 'YOUR_ID',
              playerId: idx,
              roomCode: room.code
            }));
          } catch (_) {}
        }
      });

      const roster = getPublicPlayers(room);
      broadcast(room, {
        type: 'ROSTER_UPDATE',
        players: roster,
        playerLeft: {
          id: playerId,
          name: leavingPlayer?.name || 'Player'
        }
      }, ws);

      console.log(`Player ${leavingPlayer?.name || playerId} left room ${room.code}. Active players: ${room.players.length}`);
    } else {
      // In-game disconnect: mark as disconnected so game flow isn't corrupt
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.connected = false;
        broadcast(room, {
          type: 'PLAYER_LEFT',
          playerId
        }, ws);
        console.log(`In-game player disconnected: ${player.name} (Player ${playerId})`);
      }
    }

    // Clean up if room is completely empty
    const activeCount = room.players.filter(p => p && p.connected && p.ws && p.ws.readyState === 1).length;
    if (activeCount === 0) {
      rooms.delete(room.code);
      console.log(`Room ${room.code} deleted (all players departed)`);
    }
  } catch (err) {
    console.error('Error in handlePlayerExit:', err);
  }
}

// 25-second server-side keepalive heartbeat
const heartbeatInterval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      console.log('[Server] Terminating unresponsive socket connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch (_) {}
  });
}, 25000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  let currentRoom = null;
  let currentPlayerId = null;
  let msgCount = 0;
  let lastRateReset = Date.now();

  ws.on('error', (err) => {
    console.error(`[WebSocket Client Error] Player ${currentPlayerId} in room ${currentRoom?.code}:`, err?.message || err);
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      if (!msg || typeof msg !== 'object') return;

      // Handle keep-alive pings immediately without rate-limit penalty
      if (msg.type === 'PING') {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'PONG' }));
        }
        return;
      }

      const now = Date.now();
      if (now - lastRateReset > 1000) {
        msgCount = 0;
        lastRateReset = now;
      }
      msgCount++;
      if (msgCount > 60) {
        console.warn(`[Server] Rate limit reached (${msgCount} msg/s) for socket in room ${currentRoom?.code}`);
        return;
      }

      switch (msg.type) {
        case 'CREATE_ROOM': {
          if (currentRoom) {
            handlePlayerExit(currentRoom, currentPlayerId, ws);
            currentRoom = null;
            currentPlayerId = null;
          }

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
              name: (msg.playerName || 'Castaway').trim(),
              roleKey: msg.roleKey || 'HISTORIAN',
              ws,
              connected: true
            }],
            gameStarted: false,
            state: null,
            messages: []
          };

          rooms.set(roomCode, room);
          currentRoom = room;
          currentPlayerId = playerId;

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomCode,
            playerId,
            players: getPublicPlayers(room)
          }));

          console.log(`Room ${roomCode} created by ${msg.playerName}`);
          break;
        }

        case 'JOIN_ROOM': {
          if (currentRoom) {
            handlePlayerExit(currentRoom, currentPlayerId, ws);
            currentRoom = null;
            currentPlayerId = null;
          }

          const roomCode = (msg.roomCode || '').trim().toUpperCase();
          const room = rooms.get(roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: `Room "${roomCode}" not found!` }));
            return;
          }

          // Clean up disconnected ghosts before game start
          if (!room.gameStarted) {
            room.players = room.players.filter(p => p.connected && p.ws && p.ws.readyState === 1);
          }

          if (room.players.length >= 4) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full! (Max 4 players)' }));
            return;
          }
          if (room.gameStarted) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Game already in progress!' }));
            return;
          }

          // Check if chosen role is already taken
          const roleTaken = room.players.some(p => p.roleKey === msg.roleKey);
          if (roleTaken) {
            ws.send(JSON.stringify({ type: 'ERROR', message: `Role "${msg.roleKey}" is already taken! Choose another role.` }));
            return;
          }

          // Assign next contiguous ID
          const playerId = room.players.length;
          const newPlayer = {
            id: playerId,
            name: (msg.playerName || `Castaway ${playerId + 1}`).trim(),
            roleKey: msg.roleKey,
            ws,
            connected: true
          };

          room.players.push(newPlayer);
          currentRoom = room;
          currentPlayerId = playerId;

          const roster = getPublicPlayers(room);

          // Confirm join with complete player roster and message history
          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            roomCode,
            playerId,
            players: roster,
            messages: room.messages || []
          }));

          // Broadcast roster update to existing lobby occupants
          broadcast(room, {
            type: 'ROSTER_UPDATE',
            players: roster,
            playerJoined: {
              id: playerId,
              name: newPlayer.name,
              roleKey: newPlayer.roleKey
            }
          }, ws);

          console.log(`${newPlayer.name} joined room ${roomCode} as Player ${playerId}`);
          break;
        }

        case 'REJOIN_ROOM': {
          const roomCode = (msg.roomCode || '').trim().toUpperCase();
          const room = rooms.get(roomCode);
          if (room && room.gameStarted) {
            const player = room.players.find(p => p.id === msg.playerId);
            if (player) {
              player.ws = ws;
              player.connected = true;
              currentRoom = room;
              currentPlayerId = player.id;
              ws.send(JSON.stringify({
                type: 'ROOM_REJOINED',
                roomCode,
                playerId: player.id,
                state: room.state
              }));
              broadcast(room, {
                type: 'PLAYER_RECONNECTED',
                playerId: player.id,
                name: player.name
              }, ws);
              console.log(`Player ${player.name} reconnected to in-progress room ${roomCode}`);
              return;
            }
          }
          break;
        }

        case 'LEAVE_ROOM': {
          handlePlayerExit(currentRoom, currentPlayerId, ws);
          currentRoom = null;
          currentPlayerId = null;
          break;
        }

        case 'CHAT_MESSAGE': {
          if (!currentRoom) return;
          const text = (msg.text || '').trim();
          if (!text) return;

          const player = currentRoom.players.find(p => p.id === currentPlayerId);
          const chatMsg = {
            type: 'CHAT_MESSAGE',
            senderId: currentPlayerId,
            senderName: player?.name || msg.senderName || 'Castaway',
            roleKey: player?.roleKey || msg.roleKey || 'HISTORIAN',
            text: text.slice(0, 300),
            timestamp: Date.now()
          };

          if (!currentRoom.messages) currentRoom.messages = [];
          currentRoom.messages.push(chatMsg);
          if (currentRoom.messages.length > 60) currentRoom.messages.shift();

          // Broadcast to everyone in the room
          broadcast(currentRoom, chatMsg);
          break;
        }

        case 'START_GAME': {
          if (!currentRoom || currentPlayerId !== currentRoom.host) return;
          if (currentRoom.gameStarted) {
            console.log(`Ignoring duplicate START_GAME in room ${currentRoom.code}`);
            return;
          }

          // Only include connected active players
          const activePlayers = currentRoom.players.filter(p => p && p.connected && p.ws && p.ws.readyState === 1);
          if (activePlayers.length < 1) return;

          currentRoom.gameStarted = true;
          activePlayers.forEach((p, idx) => {
            p.id = idx;
          });
          currentRoom.players = activePlayers;

          // Broadcast game start with authoritative player configs
          broadcast(currentRoom, {
            type: 'GAME_START',
            players: activePlayers.map(p => ({
              id: p.id,
              name: p.name,
              roleKey: p.roleKey
            }))
          });

          console.log(`Game started in room ${currentRoom.code} with ${activePlayers.length} players`);
          break;
        }

        case 'GAME_ACTION': {
          if (!currentRoom) return;
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
      console.error('Server message handling error:', err);
    }
  });

  ws.on('close', () => {
    try {
      handlePlayerExit(currentRoom, currentPlayerId, ws);
    } catch (err) {
      console.error('Error in close handler:', err);
    }
    currentRoom = null;
    currentPlayerId = null;
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PANAHON Game Server running on port ${PORT} (0.0.0.0)`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
