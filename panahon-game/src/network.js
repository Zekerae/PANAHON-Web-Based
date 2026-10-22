// ===== PANAHON: CHRONO SHIFT - Serverless WebRTC Multiplayer Network =====
// Powered by PeerJS (Serverless WebRTC with Google STUN)

import PeerModule, { Peer as NamedPeer } from 'peerjs';
const Peer = NamedPeer || PeerModule?.Peer || PeerModule;

const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  }
};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class NetworkManager {
  constructor(gameEngine) {
    this.engine = gameEngine;
    this.mode = 'local'; // 'local' or 'online'
    this.peer = null;
    this.hostConn = null; // Client's connection to the host
    this.clientConns = new Map(); // Host's connections: peerId -> { conn, playerId, name, roleKey }
    this.roomCode = null;
    this.playerId = null;
    this.isHost = false;
    this.players = [];

    // Callbacks
    this.onStateUpdate = null;
    this.onPlayerJoin = null;
    this.onPlayerLeave = null;
    this.onError = null;
    this.onRoomCreated = null;
    this.onRoomJoined = null;
    this.onGameStart = null;
  }

  setMode(mode) {
    this.mode = mode;
  }

  isMyTurn(playerIdx) {
    if (this.mode === 'local') return true;
    return playerIdx === this.playerId;
  }

  // Backward compatibility: connect returns immediate success for serverless WebRTC
  connect() {
    return Promise.resolve();
  }

  // --- Host Room Creation ---
  createRoom(playerName, roleKey) {
    this.cleanup();
    this.mode = 'online';
    this.isHost = true;
    this.playerId = 0;

    const code = generateRoomCode();
    this.roomCode = code;
    this.players = [{
      id: 0,
      name: playerName,
      roleKey,
      isHost: true,
      connected: true
    }];

    const peerId = `panahon-${code.toLowerCase()}`;
    console.log('[WebRTC] Creating Host Peer with ID:', peerId);

    try {
      this.peer = new Peer(peerId, PEER_CONFIG);

      this.peer.on('open', (id) => {
        console.log('[WebRTC] Host peer opened:', id);
        if (this.onRoomCreated) this.onRoomCreated(code);
      });

      this.peer.on('connection', (conn) => {
        console.log('[WebRTC] Incoming client connection from:', conn.peer);

        conn.on('open', () => {
          console.log('[WebRTC] Connection opened with:', conn.peer);
        });

        conn.on('data', (data) => {
          this.handleHostReceivedData(conn, data);
        });

        conn.on('close', () => {
          this.handleClientDisconnect(conn.peer);
        });

        conn.on('error', (err) => {
          console.error('[WebRTC] Connection error with client:', conn.peer, err);
          this.handleClientDisconnect(conn.peer);
        });
      });

      this.peer.on('error', (err) => {
        console.error('[WebRTC] Host Peer Error:', err);
        if (err.type === 'unavailable-id') {
          // ID already in use, regenerate code
          console.log('[WebRTC] Room ID clash, retrying with new code...');
          this.createRoom(playerName, roleKey);
        } else {
          if (this.onError) this.onError(err.message || 'WebRTC Signaling error. Check your connection.');
        }
      });
    } catch (err) {
      console.error('[WebRTC] Failed to initialize peer:', err);
      if (this.onError) this.onError('Failed to initialize WebRTC. Ensure browser supports WebRTC.');
    }
  }

  // --- Client Room Joining ---
  joinRoom(roomCode, playerName, roleKey) {
    this.cleanup();
    this.mode = 'online';
    this.isHost = false;

    const cleanCode = roomCode.trim().toLowerCase();
    this.roomCode = roomCode.trim().toUpperCase();
    const targetPeerId = `panahon-${cleanCode}`;

    console.log('[WebRTC] Joining room:', this.roomCode, 'Target Peer:', targetPeerId);

    try {
      this.peer = new Peer(PEER_CONFIG);

      let connectTimeout = setTimeout(() => {
        if (!this.playerId && this.playerId !== 0) {
          console.warn('[WebRTC] Connection timeout to host:', targetPeerId);
          this.cleanup();
          if (this.onError) {
            this.onError(`Room "${this.roomCode}" not found. Verify the code and ensure the Host is online.`);
          }
        }
      }, 10000);

      this.peer.on('open', (myId) => {
        console.log('[WebRTC] Client peer opened:', myId, 'Connecting to host...');
        const conn = this.peer.connect(targetPeerId, { reliable: true });
        this.hostConn = conn;

        conn.on('open', () => {
          console.log('[WebRTC] Connected to host! Sending JOIN_ROOM...');
          clearTimeout(connectTimeout);
          conn.send({
            type: 'JOIN_ROOM',
            playerName,
            roleKey
          });
        });

        conn.on('data', (data) => {
          this.handleClientReceivedData(data);
        });

        conn.on('close', () => {
          console.warn('[WebRTC] Host connection closed');
          if (this.onError) this.onError('Disconnected from host.');
        });

        conn.on('error', (err) => {
          console.error('[WebRTC] Host connection error:', err);
          clearTimeout(connectTimeout);
          if (this.onError) this.onError(`Could not reach host room "${this.roomCode}".`);
        });
      });

      this.peer.on('error', (err) => {
        console.error('[WebRTC] Client Peer Error:', err);
        clearTimeout(connectTimeout);
        if (this.onError) this.onError(`Connection error: ${err.type || err.message}`);
      });
    } catch (err) {
      console.error('[WebRTC] Client peer init failed:', err);
      if (this.onError) this.onError('WebRTC initialization failed.');
    }
  }

  // --- Host message processor ---
  handleHostReceivedData(conn, msg) {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'JOIN_ROOM': {
        // Room full check
        if (this.players.length >= 4) {
          conn.send({ type: 'ERROR', message: 'Room is full! (Max 4 players)' });
          return;
        }

        // Role taken check
        const roleTaken = this.players.some(p => p.roleKey === msg.roleKey);
        if (roleTaken) {
          conn.send({ type: 'ERROR', message: `Role "${msg.roleKey}" is already taken! Please select another role.` });
          return;
        }

        const newPlayerId = this.players.length;
        const newPlayer = {
          id: newPlayerId,
          name: msg.playerName,
          roleKey: msg.roleKey,
          isHost: false,
          connected: true
        };

        this.clientConns.set(conn.peer, {
          conn,
          playerId: newPlayerId,
          name: msg.playerName,
          roleKey: msg.roleKey
        });

        this.players.push(newPlayer);

        // Send confirmation back to joining peer
        conn.send({
          type: 'ROOM_JOINED',
          roomCode: this.roomCode,
          playerId: newPlayerId,
          players: this.players.map(p => ({
            id: p.id,
            name: p.name,
            roleKey: p.roleKey,
            connected: p.connected
          }))
        });

        // Broadcast to other peers
        this.broadcastToClients({
          type: 'PLAYER_JOINED',
          player: {
            id: newPlayerId,
            name: msg.playerName,
            roleKey: msg.roleKey
          }
        }, conn.peer);

        // Notify Host UI
        if (this.onPlayerJoin) {
          this.onPlayerJoin({
            id: newPlayerId,
            name: msg.playerName,
            roleKey: msg.roleKey
          });
        }
        break;
      }

      case 'GAME_ACTION': {
        // Execute on host engine
        this.executeRemoteAction(msg.action);
        // Relay to all other client peers
        this.broadcastToClients({
          type: 'GAME_ACTION',
          playerId: msg.playerId,
          action: msg.action
        }, conn.peer);
        break;
      }
    }
  }

  // --- Client message processor ---
  handleClientReceivedData(msg) {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'ROOM_JOINED':
        this.roomCode = msg.roomCode;
        this.playerId = msg.playerId;
        this.isHost = false;
        if (this.onRoomJoined) this.onRoomJoined(msg.roomCode, msg.players);
        break;

      case 'PLAYER_JOINED':
        if (this.onPlayerJoin) this.onPlayerJoin(msg.player);
        break;

      case 'PLAYER_LEFT':
        if (this.onPlayerLeave) this.onPlayerLeave(msg.playerId);
        break;

      case 'GAME_START':
        if (this.onGameStart) this.onGameStart(msg.players);
        break;

      case 'GAME_ACTION':
        this.executeRemoteAction(msg.action);
        break;

      case 'STATE_UPDATE':
        if (this.onStateUpdate) this.onStateUpdate(msg.state);
        break;

      case 'ERROR':
        if (this.onError) this.onError(msg.message);
        break;
    }
  }

  handleClientDisconnect(peerId) {
    const client = this.clientConns.get(peerId);
    if (!client) return;

    this.clientConns.delete(peerId);
    this.players = this.players.filter(p => p.id !== client.playerId);

    this.broadcastToClients({
      type: 'PLAYER_LEFT',
      playerId: client.playerId
    });

    if (this.onPlayerLeave) this.onPlayerLeave(client.playerId);
  }

  broadcastToClients(message, excludePeerId = null) {
    this.clientConns.forEach((client, peerId) => {
      if (peerId !== excludePeerId && client.conn.open) {
        try {
          client.conn.send(message);
        } catch (e) {
          console.error('[WebRTC] Failed to broadcast to client:', peerId, e);
        }
      }
    });
  }

  // --- Game Lifecycle ---
  startGame() {
    if (!this.isHost || !this.roomCode) return;

    const playerList = this.players.map(p => ({
      id: p.id,
      name: p.name,
      roleKey: p.roleKey
    }));

    // Broadcast to all clients
    this.broadcastToClients({
      type: 'GAME_START',
      players: playerList
    });

    // Start on Host
    if (this.onGameStart) {
      this.onGameStart(playerList);
    }
  }

  sendAction(action) {
    if (this.mode === 'local') return true;

    if (this.isHost) {
      // Host broadcasts action to all connected clients
      this.broadcastToClients({
        type: 'GAME_ACTION',
        playerId: 0,
        action
      });
    } else if (this.hostConn && this.hostConn.open) {
      // Client sends action to host to relay
      this.hostConn.send({
        type: 'GAME_ACTION',
        playerId: this.playerId,
        action
      });
    }
    return true;
  }

  broadcastState(state) {
    if (this.mode === 'local' || !this.isHost) return;
    this.broadcastToClients({
      type: 'STATE_UPDATE',
      state
    });
  }

  // --- Remote Action Dispatcher ---
  executeRemoteAction(action) {
    if (!action) return;
    switch (action.type) {
      case 'ROLL_DICE':
        if (action.result) {
          this.engine.state.diceResult = action.result;
          this.engine.state.movesRemaining = action.result;
          this.engine.state.movementDirection = 'forward';
          this.engine.state.phase = 'moving';
          this.engine.addLog('dice', `${this.engine.getCurrentPlayer().name} rolled a ${action.result}!`);
          this.engine.notify();
        } else {
          this.engine.rollDice();
        }
        break;
      case 'MOVE_STEP':
        this.engine.movePlayerStep();
        break;
      case 'MOVE_TO_TILE':
        this.engine.moveToTile(action.targetTileId);
        break;
      case 'END_TURN':
        this.engine.endTurn();
        break;
      case 'USE_ABILITY':
        this.engine.useActiveAbility(action.playerIdx);
        break;
      case 'INTERACT_MOMENTUM':
        this.engine.interactMomentumTile(action.playerIdx);
        break;
      case 'RESOLVE_CHOICE':
        this.engine.resolveChoice(action.action);
        break;
      case 'DISMISS_MODAL':
        this.engine.dismissModal();
        break;
      case 'TIME_WARP':
        this.engine.timeWarp(action.playerIdx);
        break;
      case 'REVERSE_TIME':
        this.engine.reverseTime(action.playerIdx);
        break;
      case 'REST':
        this.engine.rest(action.playerIdx);
        break;
      case 'TRADE_ENERGY':
        this.engine.tradeEnergy(action.fromIdx, action.toIdx, action.amount);
        break;
      case 'RETURN_ARTIFACT':
        this.engine.returnArtifact(action.playerIdx, action.artifactId);
        break;
    }
  }

  cleanup() {
    if (this.hostConn) {
      try { this.hostConn.close(); } catch (_) {}
      this.hostConn = null;
    }
    this.clientConns.forEach(client => {
      try { client.conn.close(); } catch (_) {}
    });
    this.clientConns.clear();
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }
    this.roomCode = null;
    this.playerId = null;
    this.players = [];
  }

  disconnect() {
    this.cleanup();
  }

  isConnected() {
    if (this.isHost) {
      return this.peer && !this.peer.destroyed;
    }
    return this.hostConn && this.hostConn.open;
  }
}

export default NetworkManager;
