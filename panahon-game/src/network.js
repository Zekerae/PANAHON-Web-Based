// ===== PANAHON: CHRONO SHIFT - Hybrid Network Manager (Supabase Realtime + WebSocket Relay) =====

import sounds from './sound.js';
import { getSupabaseClient, isSupabaseAvailable } from './supabaseClient.js';

export class NetworkManager {
  constructor(gameEngine) {
    this.engine = gameEngine;
    this.mode = 'local'; // 'local' or 'online'
    this.relayType = 'supabase'; // 'supabase' | 'websocket'
    this.ws = null;
    this.channel = null;
    this.supabase = null;
    this.roomCode = null;
    this.playerId = null;
    this.isHost = false;
    this.players = [];
    this.chatMessages = [];
    this.serverUrl = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
    this.heartbeatTimer = null;
    this.presenceCheckTimer = null;

    // Callbacks
    this.onStateUpdate = null;
    this.onPlayerJoin = null;
    this.onPlayerLeave = null;
    this.onRosterUpdate = null;
    this.onRoomClosed = null;
    this.onChatMessage = null;
    this.onError = null;
    this.onRoomCreated = null;
    this.onRoomJoined = null;
    this.onGameStart = null;
    this.onConnectionStatus = null;
  }

  setMode(mode) {
    this.mode = mode;
  }

  isMyTurn(playerIdx) {
    if (this.mode === 'local') return true;
    return playerIdx === this.playerId;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ==========================================
  // SUPABASE REALTIME IMPLEMENTATION
  // ==========================================
  async createRoomSupabase(playerName, roleKey) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase is not configured. Please enter your Supabase URL & Anon Key.');
    }

    this.cleanup();
    this.supabase = supabase;
    this.relayType = 'supabase';
    this.mode = 'online';
    this.isHost = true;
    this.playerId = 0;
    this.myPlayerName = playerName;
    this.myRoleKey = roleKey;
    this.roomCode = this.generateRoomCode();

    const hostPlayer = {
      id: 0,
      name: playerName,
      roleKey,
      isHost: true,
      connected: true
    };
    this.players = [hostPlayer];
    this.chatMessages = [];

    const channelName = `panahon-room-${this.roomCode}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: `host-${Date.now()}` }
      }
    });

    this.setupSupabaseChannelListeners(channel);
    this.channel = channel;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Supabase channel subscription timed out (10s)'));
      }, 10000);

      channel.subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          try {
            await channel.track({
              id: 0,
              name: playerName,
              roleKey,
              isHost: true,
              onlineAt: Date.now()
            });
            console.log('[Supabase Realtime] Room created on channel:', channelName);
            if (this.onRoomCreated) this.onRoomCreated(this.roomCode);
            resolve(this.roomCode);
          } catch (trackErr) {
            reject(trackErr);
          }
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          reject(err || new Error('Failed to subscribe to Supabase channel'));
        }
      });
    });
  }

  async joinRoomSupabase(roomCode, playerName, roleKey) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase is not configured. Please enter your Supabase URL & Anon Key.');
    }

    this.cleanup();
    this.supabase = supabase;
    this.relayType = 'supabase';
    this.mode = 'online';
    this.isHost = false;
    this.myPlayerName = playerName;
    this.myRoleKey = roleKey;
    this.roomCode = roomCode.trim().toUpperCase();

    const channelName = `panahon-room-${this.roomCode}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: `guest-${Date.now()}-${Math.floor(Math.random() * 1000)}` }
      }
    });

    this.setupSupabaseChannelListeners(channel);
    this.channel = channel;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanup();
        reject(new Error(`Room ${this.roomCode} not found or host is offline.`));
      }, 7000);

      channel.subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          // Wait briefly for presence state sync to detect existing occupants
          setTimeout(async () => {
            clearTimeout(timeout);
            const presenceState = channel.presenceState();
            const activeEntries = [];
            Object.values(presenceState).forEach(list => {
              if (Array.isArray(list)) list.forEach(entry => activeEntries.push(entry));
            });

            const hasHost = activeEntries.some(e => e.isHost);
            if (!hasHost) {
              this.cleanup();
              const errorMsg = `Room ${this.roomCode} not found or host is inactive.`;
              if (this.onError) this.onError(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            if (activeEntries.length >= 4) {
              this.cleanup();
              const errorMsg = 'Room is full! (Max 4 players)';
              if (this.onError) this.onError(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            const roleTaken = activeEntries.some(e => e.roleKey === roleKey);
            if (roleTaken) {
              this.cleanup();
              const errorMsg = `Role ${roleKey} is already taken! Choose another role.`;
              if (this.onError) this.onError(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            // Assign next available ID
            const usedIds = new Set(activeEntries.map(e => e.id));
            let assignedId = 1;
            while (usedIds.has(assignedId) && assignedId < 4) {
              assignedId++;
            }
            this.playerId = assignedId;

            const myPlayerObj = {
              id: assignedId,
              name: playerName,
              roleKey,
              isHost: false,
              connected: true
            };

            await channel.track({
              ...myPlayerObj,
              onlineAt: Date.now()
            });

            // Reconstruct full roster
            this.players = this.buildRosterFromPresence(channel.presenceState(), myPlayerObj);

            console.log('[Supabase Realtime] Joined room:', this.roomCode, 'as Player', assignedId);
            if (this.onRoomJoined) this.onRoomJoined(this.roomCode, this.players);
            resolve(this.players);
          }, 600);
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          reject(err || new Error('Failed to subscribe to room channel'));
        }
      });
    });
  }

  buildRosterFromPresence(presenceState, ensureSelf) {
    const list = [];
    const seen = new Set();

    Object.values(presenceState).forEach(entries => {
      if (Array.isArray(entries)) {
        entries.forEach(e => {
          if (typeof e.id === 'number' && !seen.has(e.id)) {
            seen.add(e.id);
            list.push({
              id: e.id,
              name: e.name,
              roleKey: e.roleKey,
              isHost: Boolean(e.isHost),
              connected: true
            });
          }
        });
      }
    });

    if (ensureSelf && !seen.has(ensureSelf.id)) {
      list.push(ensureSelf);
    }

    list.sort((a, b) => a.id - b.id);
    return list;
  }

  setupSupabaseChannelListeners(channel) {
    // Broadcast Listeners
    channel.on('broadcast', { event: 'GAME_ACTION' }, ({ payload }) => {
      this.handleMessage({ type: 'GAME_ACTION', ...payload });
    });

    channel.on('broadcast', { event: 'STATE_UPDATE' }, ({ payload }) => {
      this.handleMessage({ type: 'STATE_UPDATE', ...payload });
    });

    channel.on('broadcast', { event: 'GAME_START' }, ({ payload }) => {
      this.handleMessage({ type: 'GAME_START', ...payload });
    });

    channel.on('broadcast', { event: 'CHAT_MESSAGE' }, ({ payload }) => {
      this.handleMessage({ type: 'CHAT_MESSAGE', ...payload });
    });

    channel.on('broadcast', { event: 'ROOM_CLOSED' }, ({ payload }) => {
      this.cleanup();
      if (this.onRoomClosed) this.onRoomClosed(payload?.message || 'Room closed by host.');
    });

    // Presence Listeners
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const updatedRoster = this.buildRosterFromPresence(state);
      if (updatedRoster.length > 0) {
        this.players = updatedRoster;
        if (this.onRosterUpdate) this.onRosterUpdate(this.players);
      }
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      if (Array.isArray(newPresences)) {
        newPresences.forEach(p => {
          if (p.id !== this.playerId) {
            if (this.onPlayerJoin) this.onPlayerJoin(p);
          }
        });
      }
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (Array.isArray(leftPresences)) {
        leftPresences.forEach(p => {
          if (p.isHost && !this.isHost) {
            this.cleanup();
            if (this.onRoomClosed) this.onRoomClosed('Host has disconnected. Room disbanded.');
          } else if (p.id !== this.playerId) {
            if (this.onPlayerLeave) this.onPlayerLeave(p);
          }
        });
      }
    });
  }

  // ==========================================
  // WEBSOCKET FALLBACK RELAY
  // ==========================================
  getRelayServerUrls(customUrl) {
    if (customUrl) return [customUrl];

    const savedUrl = localStorage.getItem('panahon_relay_url');
    if (savedUrl && savedUrl.trim()) return [savedUrl.trim()];

    const envUrl = import.meta.env?.VITE_RELAY_SERVER_URL;
    if (envUrl && envUrl.trim()) return [envUrl.trim()];

    const primaryCloud = 'wss://panahon-relay-server.onrender.com';
    const isLocal = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.');

    if (isLocal) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return [
        `${protocol}//${window.location.host}/ws`,
        `ws://${window.location.hostname}:3001`,
        `ws://localhost:3001`,
        primaryCloud
      ];
    }

    return [primaryCloud];
  }

  connectWebSocket(customUrl) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectPromise) {
      return this.connectPromise;
    }

    this.isConnecting = true;
    const candidates = this.getRelayServerUrls(customUrl);

    const trySingle = (url, timeoutMs = 7000) => {
      return new Promise((resolve, reject) => {
        let settled = false;
        let socket = null;

        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            try { socket?.close(); } catch (_) {}
            reject(new Error(`Connection to ${url} timed out`));
          }
        }, timeoutMs);

        try {
          socket = new WebSocket(url);

          socket.onopen = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              this.ws = socket;
              this.serverUrl = url;
              this.reconnectAttempts = 0;
              this.isConnecting = false;
              this.relayType = 'websocket';
              this.startHeartbeat();

              socket.onmessage = (event) => {
                try {
                  this.handleMessage(JSON.parse(event.data));
                } catch (e) {
                  console.error('[Network] Message parse error:', e);
                }
              };

              socket.onclose = () => {
                this.stopHeartbeat();
              };

              resolve();
            }
          };

          socket.onerror = (err) => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              try { socket?.close(); } catch (_) {}
              reject(err);
            }
          };
        } catch (err) {
          clearTimeout(timer);
          settled = true;
          reject(err);
        }
      });
    };

    this.connectPromise = candidates.reduce((promiseChain, url) => {
      return promiseChain.catch(() => trySingle(url));
    }, Promise.reject(new Error('Initial attempt')))
      .then(() => {
        this.isConnecting = false;
      })
      .catch((finalErr) => {
        this.isConnecting = false;
        throw finalErr;
      });

    return this.connectPromise;
  }

  // ==========================================
  // UNIFIED PUBLIC INTERFACE
  // ==========================================
  async createRoom(playerName, roleKey) {
    if (isSupabaseAvailable()) {
      try {
        console.log('[Network] Creating room via Supabase Realtime...');
        return await this.createRoomSupabase(playerName, roleKey);
      } catch (err) {
        console.warn('[Network] Supabase room creation failed, trying WebSocket fallback:', err.message);
        if (this.onError) {
          this.onError(`Supabase Realtime notice: ${err.message}. Trying WebSocket fallback...`);
        }
      }
    }

    // Fallback to WebSocket relay
    this.mode = 'online';
    this.relayType = 'websocket';
    this.isHost = true;
    this.myPlayerName = playerName;
    this.myRoleKey = roleKey;

    try {
      await this.connectWebSocket();
      this.send({
        type: 'CREATE_ROOM',
        playerName,
        roleKey
      });
    } catch (err) {
      console.error('[Network] Failed to create room via WebSocket:', err);
      if (this.onError) {
        this.onError('Unable to create room. Please check your network or enter Supabase credentials.');
      }
    }
  }

  async joinRoom(roomCode, playerName, roleKey) {
    if (isSupabaseAvailable()) {
      try {
        console.log('[Network] Joining room via Supabase Realtime...');
        return await this.joinRoomSupabase(roomCode, playerName, roleKey);
      } catch (err) {
        console.warn('[Network] Supabase join failed, trying WebSocket fallback:', err.message);
        // Only fallback if error was connection related, not role taken or full
        if (err.message.includes('taken') || err.message.includes('full')) {
          return;
        }
      }
    }

    // Fallback to WebSocket relay
    this.mode = 'online';
    this.relayType = 'websocket';
    this.isHost = false;
    this.myPlayerName = playerName;
    this.myRoleKey = roleKey;

    try {
      await this.connectWebSocket();
      this.send({
        type: 'JOIN_ROOM',
        roomCode: roomCode.trim().toUpperCase(),
        playerName,
        roleKey
      });
    } catch (err) {
      console.error('[Network] Failed to join room via WebSocket:', err);
      if (this.onError) {
        this.onError('Unable to reach relay server. Please check your room code or credentials.');
      }
    }
  }

  leaveRoom() {
    if (this.relayType === 'supabase' && this.channel) {
      if (this.isHost) {
        try {
          this.channel.send({
            type: 'broadcast',
            event: 'ROOM_CLOSED',
            payload: { message: 'Host has closed the mission lobby.' }
          });
        } catch (_) {}
      }
      try {
        this.channel.untrack();
        this.supabase?.removeChannel(this.channel);
      } catch (_) {}
    } else if (this.roomCode && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'LEAVE_ROOM',
        roomCode: this.roomCode,
        playerId: this.playerId
      });
    }
    this.cleanup();
  }

  startGame() {
    if (!this.isHost || !this.roomCode) return;

    if (this.relayType === 'supabase' && this.channel) {
      const activePlayers = this.players.filter(p => p && p.connected);
      if (activePlayers.length < 1) return;

      const payload = {
        players: activePlayers.map((p, idx) => ({
          id: idx,
          name: p.name,
          roleKey: p.roleKey
        }))
      };

      this.channel.send({
        type: 'broadcast',
        event: 'GAME_START',
        payload
      });

      if (this.onGameStart) {
        this.onGameStart(payload.players);
      }
    } else {
      this.send({
        type: 'START_GAME',
        roomCode: this.roomCode
      });
    }
  }

  sendChatMessage(text) {
    if (!text || !text.trim()) return;
    const msg = {
      type: 'CHAT_MESSAGE',
      roomCode: this.roomCode,
      senderId: this.playerId,
      senderName: this.myPlayerName || 'Castaway',
      roleKey: this.myRoleKey || 'HISTORIAN',
      text: text.trim().slice(0, 300),
      timestamp: Date.now()
    };

    if (this.mode === 'online') {
      if (this.relayType === 'supabase' && this.channel) {
        this.channel.send({
          type: 'broadcast',
          event: 'CHAT_MESSAGE',
          payload: msg
        });
        // Push locally for the sender
        this.chatMessages.push(msg);
        if (this.chatMessages.length > 60) this.chatMessages.shift();
        if (this.onChatMessage) this.onChatMessage(msg);
      } else {
        this.send(msg);
      }
    } else {
      this.chatMessages.push(msg);
      if (this.onChatMessage) this.onChatMessage(msg);
    }
  }

  sendAction(action) {
    if (this.mode === 'local') return true;

    if (this.relayType === 'supabase' && this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'GAME_ACTION',
        payload: {
          playerId: this.playerId,
          action
        }
      });
      return true;
    }

    this.send({
      type: 'GAME_ACTION',
      roomCode: this.roomCode,
      playerId: this.playerId,
      action
    });
    return true;
  }

  broadcastState(state) {
    if (this.mode === 'local' || !this.isHost) return;

    if (this.relayType === 'supabase' && this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'STATE_UPDATE',
        payload: { state }
      });
      return;
    }

    this.send({
      type: 'STATE_UPDATE',
      roomCode: this.roomCode,
      state
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[Network] Cannot send message, WebSocket not open:', data);
    }
  }

  handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'ROOM_CREATED':
        this.roomCode = msg.roomCode;
        this.playerId = msg.playerId;
        this.isHost = true;
        this.players = msg.players || [{
          id: 0,
          name: this.myPlayerName || 'Host',
          roleKey: this.myRoleKey,
          isHost: true,
          connected: true
        }];
        this.chatMessages = [];
        if (this.onRoomCreated) this.onRoomCreated(msg.roomCode);
        break;

      case 'ROOM_JOINED':
        this.roomCode = msg.roomCode;
        this.playerId = msg.playerId;
        this.isHost = false;
        this.players = msg.players || [];
        if (Array.isArray(msg.messages)) {
          this.chatMessages = msg.messages;
        }
        if (this.onRoomJoined) this.onRoomJoined(msg.roomCode, msg.players);
        break;

      case 'ROSTER_UPDATE':
        this.players = msg.players || [];
        if (this.onRosterUpdate) this.onRosterUpdate(this.players);
        if (msg.playerJoined && this.onPlayerJoin) this.onPlayerJoin(msg.playerJoined);
        if (msg.playerLeft && this.onPlayerLeave) this.onPlayerLeave(msg.playerLeft);
        break;

      case 'PLAYER_JOINED':
        if (!this.players.some(p => p.id === msg.player.id)) {
          this.players.push(msg.player);
        }
        if (this.onPlayerJoin) this.onPlayerJoin(msg.player);
        break;

      case 'PLAYER_LEFT': {
        const pId = typeof msg.playerId === 'number' ? msg.playerId : msg.playerId?.id;
        this.players = this.players.filter(p => p.id !== pId);
        if (this.onPlayerLeave) this.onPlayerLeave(pId);
        break;
      }

      case 'ROOM_CLOSED':
        this.cleanup();
        if (this.onRoomClosed) this.onRoomClosed(msg.message || 'Room closed by host.');
        break;

      case 'CHAT_MESSAGE':
        this.chatMessages.push(msg);
        if (this.chatMessages.length > 60) this.chatMessages.shift();
        if (this.onChatMessage) this.onChatMessage(msg);
        break;

      case 'STATE_UPDATE':
        if (this.onStateUpdate) this.onStateUpdate(msg.state);
        break;

      case 'GAME_ACTION':
        this.executeRemoteAction(msg.action);
        if (this.isHost && msg.action?.type === 'END_TURN') {
          this.broadcastState(this.engine.getState());
        }
        break;

      case 'GAME_START':
        if (this.onGameStart) {
          this.onGameStart(msg.players);
        } else if (this.onStateUpdate && msg.state) {
          this.onStateUpdate(msg.state);
        }
        break;

      case 'ERROR':
        if (this.onError) this.onError(msg.message);
        break;
    }
  }

  executeRemoteAction(action) {
    if (!action) return;
    switch (action.type) {
      case 'ROLL_DICE':
        sounds.diceRoll();
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
        sounds.moveStep();
        this.engine.movePlayerStep();
        break;
      case 'MOVE_TO_TILE':
        sounds.moveStep();
        this.engine.moveToTile(action.targetTileId);
        break;
      case 'END_TURN':
        sounds.btnClick();
        this.engine.endTurn();
        break;
      case 'USE_ABILITY':
        sounds.btnClick();
        this.engine.useActiveAbility(action.playerIdx);
        break;
      case 'INTERACT_MOMENTUM':
        sounds.btnClick();
        this.engine.interactMomentumTile(action.playerIdx);
        break;
      case 'RESOLVE_CHOICE':
        sounds.btnClick();
        this.engine.resolveChoice(action.action);
        break;
      case 'DISMISS_MODAL':
        sounds.btnClick();
        this.engine.dismissModal();
        break;
      case 'TIME_WARP':
        sounds.portal();
        this.engine.timeWarp(action.playerIdx);
        break;
      case 'REVERSE_TIME':
        sounds.portal();
        this.engine.reverseTime(action.playerIdx);
        break;
      case 'REST':
        sounds.btnClick();
        this.engine.rest(action.playerIdx);
        break;
      case 'TRADE_ENERGY':
        this.engine.tradeEnergy(action.fromIdx, action.toIdx, action.amount);
        break;
      case 'RETURN_ARTIFACT':
        sounds.artifact();
        this.engine.returnArtifact(action.playerIdx, action.artifactId);
        break;
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 20000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  cleanup() {
    this.stopHeartbeat();
    if (this.channel) {
      try {
        this.channel.untrack();
        this.supabase?.removeChannel(this.channel);
      } catch (_) {}
      this.channel = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    this.roomCode = null;
    this.playerId = null;
    this.players = [];
    this.chatMessages = [];
    this.isConnecting = false;
  }

  disconnect() {
    this.leaveRoom();
  }

  isConnected() {
    if (this.relayType === 'supabase') {
      return Boolean(this.channel);
    }
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default NetworkManager;
