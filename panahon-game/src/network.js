// ===== PANAHON: CHRONO SHIFT - WebSocket Cloud Relay Network =====
// Supports Render.com Cloud Relay, local dev proxy (/ws), and cross-network 5G/Wi-Fi/VPN

export class NetworkManager {
  constructor(gameEngine) {
    this.engine = gameEngine;
    this.mode = 'local'; // 'local' or 'online'
    this.ws = null;
    this.roomCode = null;
    this.playerId = null;
    this.isHost = false;
    this.players = [];
    this.serverUrl = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;

    // Callbacks
    this.onStateUpdate = null;
    this.onPlayerJoin = null;
    this.onPlayerLeave = null;
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

  getRelayServerUrls(customUrl) {
    if (customUrl) return [customUrl];

    const savedUrl = localStorage.getItem('panahon_relay_url');
    if (savedUrl && savedUrl.trim()) {
      return [savedUrl.trim()];
    }

    const envUrl = import.meta.env?.VITE_RELAY_SERVER_URL;
    if (envUrl && envUrl.trim()) {
      return [envUrl.trim()];
    }

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

  connect(customUrl) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectPromise) {
      return this.connectPromise;
    }

    this.isConnecting = true;
    const candidates = this.getRelayServerUrls(customUrl);

    // Warm-up ping if connecting to Render cloud
    const hasRender = candidates.some(u => u.includes('onrender.com'));
    if (hasRender) {
      try {
        fetch('https://panahon-relay-server.onrender.com', { method: 'GET', mode: 'cors' }).catch(() => {});
      } catch (_) {}
    }

    const trySingle = (url, timeoutMs = 8000) => {
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
          console.log('[Network] Connecting to relay server:', url);
          socket = new WebSocket(url);

          socket.onopen = () => {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              this.ws = socket;
              this.serverUrl = url;
              this.reconnectAttempts = 0;
              this.isConnecting = false;
              console.log('[Network] Connected to relay server:', url);

              socket.onmessage = (event) => {
                try {
                  this.handleMessage(JSON.parse(event.data));
                } catch (e) {
                  console.error('[Network] Message parse error:', e);
                }
              };

              socket.onclose = () => {
                console.warn('[Network] Disconnected from relay server:', url);
                if (this.mode === 'online' && this.reconnectAttempts < this.maxReconnectAttempts) {
                  this.reconnectAttempts++;
                  setTimeout(() => this.connect(this.serverUrl).catch(() => {}), 2000 * this.reconnectAttempts);
                }
              };

              socket.onerror = (err) => {
                console.error('[Network] WebSocket error on', url, err);
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

    // Try candidates in order
    this.connectPromise = candidates.reduce((promiseChain, url) => {
      return promiseChain.catch(() => trySingle(url));
    }, Promise.reject(new Error('Initial attempt')))
      .then(() => {
        this.isConnecting = false;
      })
      .catch((finalErr) => {
        this.isConnecting = false;
        console.error('[Network] All connection attempts failed:', finalErr);
        if (this.onError) {
          this.onError('Unable to reach the Relay Server. If using Render free tier, please wait 30 seconds for it to wake up and try again.');
        }
        throw finalErr;
      });

    return this.connectPromise;
  }

  async createRoom(playerName, roleKey) {
    this.mode = 'online';
    this.isHost = true;
    this.myPlayerName = playerName;
    this.myRoleKey = roleKey;

    try {
      await this.connect();
      this.send({
        type: 'CREATE_ROOM',
        playerName,
        roleKey
      });
    } catch (err) {
      console.error('[Network] Failed to create room:', err);
    }
  }

  async joinRoom(roomCode, playerName, roleKey) {
    this.mode = 'online';
    this.isHost = false;
    this.myPlayerName = playerName;
    this.myRoleKey = roleKey;

    try {
      await this.connect();
      this.send({
        type: 'JOIN_ROOM',
        roomCode: roomCode.trim().toUpperCase(),
        playerName,
        roleKey
      });
    } catch (err) {
      console.error('[Network] Failed to join room:', err);
    }
  }

  startGame() {
    if (!this.isHost || !this.roomCode) return;
    this.send({
      type: 'START_GAME',
      roomCode: this.roomCode
    });
  }

  sendAction(action) {
    if (this.mode === 'local') return true;

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
        this.players = [{
          id: 0,
          name: this.myPlayerName || 'Host',
          roleKey: this.myRoleKey,
          isHost: true,
          connected: true
        }];
        if (this.onRoomCreated) this.onRoomCreated(msg.roomCode);
        break;

      case 'ROOM_JOINED':
        this.roomCode = msg.roomCode;
        this.playerId = msg.playerId;
        this.isHost = false;
        this.players = msg.players || [];
        if (this.onRoomJoined) this.onRoomJoined(msg.roomCode, msg.players);
        break;

      case 'PLAYER_JOINED':
        if (!this.players.some(p => p.id === msg.player.id)) {
          this.players.push(msg.player);
        }
        if (this.onPlayerJoin) this.onPlayerJoin(msg.player);
        break;

      case 'PLAYER_LEFT':
        this.players = this.players.filter(p => p.id !== msg.playerId);
        if (this.onPlayerLeave) this.onPlayerLeave(msg.playerId);
        break;

      case 'STATE_UPDATE':
        if (this.onStateUpdate) this.onStateUpdate(msg.state);
        break;

      case 'GAME_ACTION':
        this.executeRemoteAction(msg.action);
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
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
      this.ws = null;
    }
    this.roomCode = null;
    this.playerId = null;
    this.players = [];
    this.isConnecting = false;
  }

  disconnect() {
    this.cleanup();
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default NetworkManager;
