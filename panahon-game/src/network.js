// ===== PANAHON: CHRONO SHIFT - Multiplayer Network =====

/**
 * Handles both local (hot-seat) and online (WebSocket) multiplayer.
 * Online mode connects to a lightweight Node.js WebSocket server.
 */

export class NetworkManager {
  constructor(gameEngine) {
    this.engine = gameEngine;
    this.mode = 'local'; // 'local' or 'online'
    this.ws = null;
    this.roomCode = null;
    this.playerId = null;
    this.isHost = false;
    this.onStateUpdate = null;
    this.onPlayerJoin = null;
    this.onPlayerLeave = null;
    this.onError = null;
    this.onRoomCreated = null;
    this.onRoomJoined = null;
    this.onGameStart = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  setMode(mode) {
    this.mode = mode;
  }

  // --- Online Mode ---
  connect(serverUrl) {
    if (!serverUrl) {
      const host = window.location.hostname || 'localhost';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      serverUrl = `${protocol}//${host}:3001`;
    }

    return new Promise((resolve, reject) => {
      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          resolve();
          return;
        }

        this.ws = new WebSocket(serverUrl);

        this.ws.onopen = () => {
          console.log('Connected to game server:', serverUrl);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            this.handleMessage(JSON.parse(event.data));
          } catch (e) {
            console.error('Failed to parse incoming WS message:', e);
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from server');
          if (this.mode === 'online' && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(serverUrl).catch(() => {}), 2000 * this.reconnectAttempts);
          }
        };

        this.ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          if (this.onError) this.onError('Server connection failed. Is the server running?');
          reject(err);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  createRoom(playerName, roleKey) {
    this.isHost = true;
    this.send({
      type: 'CREATE_ROOM',
      playerName,
      roleKey
    });
  }

  joinRoom(roomCode, playerName, roleKey) {
    this.send({
      type: 'JOIN_ROOM',
      roomCode: roomCode.trim().toUpperCase(),
      playerName,
      roleKey
    });
  }

  startGame() {
    if (!this.isHost || !this.roomCode) return;
    this.send({
      type: 'START_GAME',
      roomCode: this.roomCode
    });
  }

  // Send game action to server
  sendAction(action) {
    if (this.mode === 'local') {
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

  // Broadcast state update (host only)
  broadcastState(state) {
    if (this.mode === 'local' || !this.isHost) return;

    this.send({
      type: 'STATE_UPDATE',
      roomCode: this.roomCode,
      state: state
    });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'ROOM_CREATED':
        this.roomCode = msg.roomCode;
        this.playerId = msg.playerId;
        this.isHost = true;
        if (this.onRoomCreated) this.onRoomCreated(msg.roomCode);
        break;

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

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default NetworkManager;
