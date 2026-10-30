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

function getPublicSpectators(room) {
  if (!room || !Array.isArray(room.spectators)) return [];
  return room.spectators.filter(s => s && s.connected).map(s => ({
    id: s.id,
    name: s.name,
    connected: s.connected
  }));
}

function broadcast(room, message, excludeWs = null) {
  if (!room) return;
  const data = typeof message === 'string' ? message : JSON.stringify(message);
  if (Array.isArray(room.players)) {
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
  if (Array.isArray(room.spectators)) {
    room.spectators.forEach(spec => {
      if (spec && spec.ws !== excludeWs && spec.ws && spec.ws.readyState === 1) {
        try {
          spec.ws.send(data);
        } catch (err) {
          console.error(`Broadcast error to spectator ${spec.id}:`, err?.message || err);
        }
      }
    });
  }
}

function handlePlayerExit(room, playerId, ws, spectatorId = null) {
  try {
    if (!room) return;

    if (spectatorId && Array.isArray(room.spectators)) {
      const spec = room.spectators.find(s => s.id === spectatorId || s.ws === ws);
      room.spectators = room.spectators.filter(s => s.id !== spectatorId && s.ws !== ws);
      if (spec) {
        broadcast(room, {
          type: 'SPECTATOR_COUNT_UPDATE',
          spectators: getPublicSpectators(room),
          spectatorLeft: { id: spec.id, name: spec.name }
        }, ws);
        console.log(`[Spectator] ${spec.name} left room ${room.code}. Remaining: ${room.spectators.length}`);
      }
    }

    if (playerId === null || !Array.isArray(room.players)) {
      const activeCount = (room.players || []).filter(p => p && p.connected && p.ws && p.ws.readyState === 1).length;
      const specCount = (room.spectators || []).filter(s => s && s.connected && s.ws && s.ws.readyState === 1).length;
      if (activeCount === 0 && specCount === 0) {
        rooms.delete(room.code);
        console.log(`Room ${room.code} deleted (empty)`);
      }
      return;
    }

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
    const specCount = (room.spectators || []).filter(s => s && s.connected && s.ws && s.ws.readyState === 1).length;
    if (activeCount === 0 && specCount === 0) {
      rooms.delete(room.code);
      console.log(`Room ${room.code} deleted (all players & spectators departed)`);
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
  let currentSpectatorId = null;
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
            spectators: [],
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

          // Ensure socket is not lingering in spectators list
          if (Array.isArray(room.spectators)) {
            room.spectators = room.spectators.filter(s => s.ws !== ws && s.id !== currentSpectatorId);
          }

          if (room.players.length >= 4) {
            ws.send(JSON.stringify({
              type: 'CAN_SPECTATE',
              roomCode,
              reason: 'full',
              message: 'Room is full! (Max 4 players). Would you like to watch as a spectator?'
            }));
            return;
          }
          if (room.gameStarted) {
            ws.send(JSON.stringify({
              type: 'CAN_SPECTATE',
              roomCode,
              reason: 'in_progress',
              message: 'Game is already in progress! Would you like to watch live as a spectator?'
            }));
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

        case 'SPECTATE_ROOM': {
          if (currentRoom) {
            handlePlayerExit(currentRoom, currentPlayerId, ws, currentSpectatorId);
            currentRoom = null;
            currentPlayerId = null;
            currentSpectatorId = null;
          }

          const roomCode = (msg.roomCode || '').trim().toUpperCase();
          const room = rooms.get(roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: `Room "${roomCode}" not found!` }));
            return;
          }

          // Ensure this spectator socket does NOT consume an operative player slot!
          if (Array.isArray(room.players)) {
            const existingIdx = room.players.findIndex(p => p.ws === ws || (currentPlayerId !== null && p.id === currentPlayerId));
            if (existingIdx !== -1) {
              const leaving = room.players[existingIdx];
              room.players.splice(existingIdx, 1);
              room.players.forEach((p, idx) => { p.id = idx; });
              broadcast(room, {
                type: 'ROSTER_UPDATE',
                players: getPublicPlayers(room),
                playerLeft: { id: leaving.id, name: leaving.name }
              }, ws);
            }
          }

          if (!room.spectators) room.spectators = [];
          const spectatorId = `spec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const specName = (msg.spectatorName || 'Chronos Observer').trim();
          const spectator = {
            id: spectatorId,
            name: specName,
            ws,
            connected: true
          };

          room.spectators.push(spectator);
          currentRoom = room;
          currentSpectatorId = spectatorId;

          const roster = getPublicPlayers(room);
          const spectatorsList = getPublicSpectators(room);

          ws.send(JSON.stringify({
            type: 'SPECTATOR_JOINED',
            roomCode,
            spectatorId,
            spectatorName: spectator.name,
            players: roster,
            spectators: spectatorsList,
            gameStarted: room.gameStarted,
            state: room.state,
            messages: room.messages || []
          }));

          broadcast(room, {
            type: 'SPECTATOR_COUNT_UPDATE',
            spectators: spectatorsList,
            spectatorJoined: { id: spectatorId, name: spectator.name }
          }, ws);

          console.log(`[Spectator] ${spectator.name} (${spectatorId}) is spectating room ${roomCode}`);
          break;
        }

        case 'LEAVE_ROOM': {
          handlePlayerExit(currentRoom, currentPlayerId, ws, currentSpectatorId);
          currentRoom = null;
          currentPlayerId = null;
          currentSpectatorId = null;
          break;
        }

        case 'CHAT_MESSAGE': {
          if (!currentRoom) return;
          const text = (msg.text || '').trim();
          if (!text) return;

          const isSpectator = Boolean(currentSpectatorId || msg.isSpectator);
          const player = isSpectator ? null : currentRoom.players.find(p => p.id === currentPlayerId);
          const spec = isSpectator ? currentRoom.spectators?.find(s => s.id === currentSpectatorId) : null;

          const chatMsg = {
            type: 'CHAT_MESSAGE',
            senderId: isSpectator ? currentSpectatorId : currentPlayerId,
            senderName: isSpectator ? (spec?.name || msg.senderName || 'Observer') : (player?.name || msg.senderName || 'Castaway'),
            roleKey: isSpectator ? 'SPECTATOR' : (player?.roleKey || msg.roleKey || 'HISTORIAN'),
            isSpectator,
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

          // Only include connected active players (strictly exclude spectators)
          const activePlayers = currentRoom.players.filter(p => p && p.connected && p.ws && p.ws.readyState === 1 && !p.isSpectator && p.roleKey !== 'SPECTATOR');
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
            })),
            initialState: msg.initialState || null,
            customMap: msg.customMap || null
          });

          console.log(`Game started in room ${currentRoom.code} with ${activePlayers.length} players`);
          break;
        }

        case 'REQUEST_SYNC': {
          if (!currentRoom) return;
          if (currentRoom.state) {
            ws.send(JSON.stringify({ type: 'STATE_UPDATE', state: currentRoom.state }));
          } else {
            const hostPlayer = currentRoom.players.find(p => p.id === currentRoom.host);
            if (hostPlayer && hostPlayer.ws && hostPlayer.ws.readyState === 1) {
              hostPlayer.ws.send(JSON.stringify({ type: 'REQUEST_SYNC', requesterId: currentPlayerId }));
            }
          }
          break;
        }

        case 'GAME_ACTION': {
          if (!currentRoom || currentSpectatorId) return;
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
      handlePlayerExit(currentRoom, currentPlayerId, ws, currentSpectatorId);
    } catch (err) {
      console.error('Error in close handler:', err);
    }
    currentRoom = null;
    currentPlayerId = null;
    currentSpectatorId = null;
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PANAHON Game Server running on port ${PORT} (0.0.0.0)`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
