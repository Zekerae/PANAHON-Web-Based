// ===== PANAHON: CHRONO SHIFT - Main Controller & UI =====

import './style.css';
import { GameEngine } from './gameEngine.js';
import { NetworkManager } from './network.js';
import {
  ERAS, ERA_NAMES, ERA_ORDER, TILE_TYPES, ROLES, ROLE_ORDER,
  ARTIFACTS, ALL_ARTIFACTS, GAME_CONSTANTS, SCORING, PLAYER_COLORS,
  ERA_TILE_COORDINATES
} from './gameData.js';
import { sounds } from './sound.js';
import { aiController } from './aiPlayer.js';

// --- State Variables ---
let engine = new GameEngine();
let network = new NetworkManager(engine);
let currentScreen = 'title'; // 'title' | 'lobby' | 'game' | 'endgame'
let lobbyMode = 'local'; // 'local' | 'online'
let onlineSubMode = 'create'; // 'create' | 'join'
let soundMuted = false;
let activeHandTab = 'mission'; // 'mission' | 'clues' | 'artifacts'
let showGuide = false;
let guideTab = 'overview';
let cameraMode = 'full'; // 'full' | 'focus-spanish' | 'focus-american' | 'focus-japanese' | 'focus-myth' | 'auto'
let autoMoveTimer = null;

// Local player setup defaults (Human / Bot / Closed)
let localPlayers = [
  { name: 'Player 1', roleKey: 'HISTORIAN', type: 'human', difficulty: 'normal' },
  { name: 'Bot Explorer', roleKey: 'EXPLORER', type: 'ai', difficulty: 'normal' },
  { name: 'Bot Guardian', roleKey: 'GUARDIAN', type: 'ai', difficulty: 'normal' },
  { name: 'Bot Strategist', roleKey: 'STRATEGIST', type: 'ai', difficulty: 'normal' }
];

// Online player setup state
let onlinePlayerName = 'Temporal Castaway';
let onlineSelectedRole = 'HISTORIAN';
let onlineRoomCodeInput = '';
let currentRoomPlayers = [];
let isConnectingOnline = false;
let showServerSettings = false;
let unreadChatCount = 0;
let isGameChatOpen = false;
let inspectedPlayerId = null; // null = viewing self / current turn player

// Spam prevention flags
let isRollingDice = false;
let isMovingStep = false;
let isEndingTurn = false;
let isResolvingChoice = false;
let lastChatSent = 0;

// Toasts queue
const toasts = [];

function showToast(title, message, type = 'info') {
  const toast = { id: Date.now() + Math.random(), title, message, type };
  toasts.push(toast);
  renderToasts();
  setTimeout(() => {
    const idx = toasts.findIndex(t => t.id === toast.id);
    if (idx >= 0) {
      toasts.splice(idx, 1);
      renderToasts();
    }
  }, 4000);
}

// --- Initialize App ---
const app = document.querySelector('#app');

function setupNetworkListeners() {
  network.onRoomCreated = (code) => {
    isConnectingOnline = false;
    currentRoomPlayers = network.players.slice();
    unreadChatCount = 0;
    showToast('Room Created', `Room Code: ${code}. Share with allies!`, 'success');
    render();
  };

  network.onRoomJoined = (code, players) => {
    isConnectingOnline = false;
    currentRoomPlayers = players || network.players.slice();
    unreadChatCount = 0;
    showToast('Joined Room', `Connected to Room ${code}`, 'success');
    render();
  };

  network.onRosterUpdate = (players) => {
    currentRoomPlayers = players || [];
    render();
  };

  network.onPlayerJoin = (player) => {
    if (!currentRoomPlayers.some(p => p.id === player.id || (p.name === player.name && p.roleKey === player.roleKey))) {
      currentRoomPlayers.push(player);
    }
    showToast('Allied Castaway Arrived', `${player.name} joined as ${ROLES[player.roleKey]?.name || player.roleKey}!`, 'info');
    render();
  };

  network.onPlayerLeave = (playerData) => {
    const leavingId = typeof playerData === 'number' ? playerData : playerData?.id;
    currentRoomPlayers = currentRoomPlayers.filter(p => p.id !== leavingId);
    showToast('Castaway Departed', 'A player departed the timeline.', 'warning');
    render();
  };

  network.onRoomClosed = (msg) => {
    isConnectingOnline = false;
    currentRoomPlayers = [];
    showToast('Anomaly Closed', msg || 'Room closed by host.', 'danger');
    render();
  };

  network.onChatMessage = (chatMsg) => {
    sounds.chatChirp();
    appendChatMessageToDom(chatMsg);
    if (currentScreen === 'game' && !isGameChatOpen) {
      unreadChatCount++;
      updateChatBadgeDom();
    }
  };

  network.onGameStart = (players) => {
    sounds.portal();
    const configs = players.map((p, idx) => ({
      name: p.name,
      roleKey: p.roleKey,
      isLocal: network.isHost ? (p.id === 0) : (p.id === network.playerId),
      connectionId: p.id
    }));
    engine.initGame(configs);
    sounds.startBgMusic();
    currentScreen = 'game';
    showToast('Chrono Shift Engaged', 'All timelines active. Protect the flow of history!', 'success');
    render();
  };

  network.onStateUpdate = (state) => {
    engine.loadState(state);
    render();
  };

  network.onError = (msg) => {
    isConnectingOnline = false;
    showToast('Multiplayer Alert', msg, 'danger');
    render();
  };
}

setupNetworkListeners();

// --- CHAT HELPERS ---
function formatChatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderChatMessagesHtml(messages) {
  if (!messages || messages.length === 0) {
    return `
      <div class="chat-empty">
        <span style="font-size: 1.2rem;">📡</span>
        <span style="font-weight: 700;">Chrono-Comms Online</span>
        <span>Coordinate roles and plan your strategy here.</span>
      </div>
    `;
  }

  return messages.map(m => {
    const isSelf = (network.mode === 'online' && m.senderId === network.playerId) ||
      (network.mode === 'local' && m.senderName === onlinePlayerName);
    const role = ROLES[m.roleKey] || ROLES.HISTORIAN;
    const playerColor = PLAYER_COLORS[m.senderId % PLAYER_COLORS.length] || 'var(--text-accent)';
    const timeStr = formatChatTime(m.timestamp);

    return `
      <div class="chat-msg-row ${isSelf ? 'self' : ''}">
        <img src="${role.avatar}" class="chat-msg-avatar" alt="${m.roleKey}">
        <div class="chat-msg-bubble">
          <div class="chat-msg-meta">
            <span class="chat-msg-sender" style="color: ${playerColor};">${escapeHtml(m.senderName)}</span>
            <span class="chat-msg-time">${timeStr}</span>
          </div>
          <div class="chat-msg-text">${escapeHtml(m.text)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function appendChatMessageToDom(chatMsg) {
  const containers = document.querySelectorAll('.chat-messages');
  if (!containers || containers.length === 0) return;

  const isSelf = (network.mode === 'online' && chatMsg.senderId === network.playerId) ||
    (network.mode === 'local' && chatMsg.senderName === onlinePlayerName);
  const role = ROLES[chatMsg.roleKey] || ROLES.HISTORIAN;
  const playerColor = PLAYER_COLORS[chatMsg.senderId % PLAYER_COLORS.length] || 'var(--text-accent)';
  const timeStr = formatChatTime(chatMsg.timestamp);

  const rowHtml = `
    <div class="chat-msg-row ${isSelf ? 'self' : ''}">
      <img src="${role.avatar}" class="chat-msg-avatar" alt="${chatMsg.roleKey}">
      <div class="chat-msg-bubble">
        <div class="chat-msg-meta">
          <span class="chat-msg-sender" style="color: ${playerColor};">${escapeHtml(chatMsg.senderName)}</span>
          <span class="chat-msg-time">${timeStr}</span>
        </div>
        <div class="chat-msg-text">${escapeHtml(chatMsg.text)}</div>
      </div>
    </div>
  `;

  containers.forEach(c => {
    const emptyPlaceholder = c.querySelector('.chat-empty');
    if (emptyPlaceholder) emptyPlaceholder.remove();

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = rowHtml.trim();
    const newElement = tempDiv.firstChild;
    c.appendChild(newElement);
    c.scrollTop = c.scrollHeight;
  });
}

function updateChatBadgeDom() {
  const btn = document.querySelector('#btn-toggle-chat');
  if (!btn) return;
  if (unreadChatCount > 0) {
    btn.classList.add('btn-chat-unread');
    btn.innerHTML = `💬 Comms <span class="chat-badge">${unreadChatCount}</span>`;
  } else {
    btn.classList.remove('btn-chat-unread');
    btn.innerHTML = `💬 Comms`;
  }
}

function renderChatBoxHtml(boxId, isFloating = false) {
  const quickChips = [
    '⚡ Ready!',
    '⏳ Need 1 more',
    '🎯 Target Artifact',
    '🔋 Take Energy',
    '⚠️ Paradox Warning',
    '🚀 Chrono Shift!'
  ];

  return `
    <div class="${isFloating ? 'game-chat-panel' : 'lobby-chat-panel'}" id="${boxId}">
      <div class="chat-header">
        <div class="chat-title">
          <span>📡</span>
          <span>CREW COMMS</span>
          <span style="font-size: 0.65rem; color: #10B981; margin-left: 4px;">● LIVE</span>
        </div>
        ${isFloating ? `
          <button class="btn btn-secondary" id="btn-close-game-chat" style="padding: 2px 8px; font-size: 0.7rem; border-radius: 4px;">✖</button>
        ` : ''}
      </div>

      <div class="chat-messages" id="${boxId}-messages">
        ${renderChatMessagesHtml(network.chatMessages)}
      </div>

      <div class="chat-quick-chips">
        ${quickChips.map(chip => `
          <button class="quick-chip" data-quick="${chip}">${chip}</button>
        `).join('')}
      </div>

      <div class="chat-input-bar">
        <input type="text" class="chat-text-input" id="${boxId}-input" placeholder="Transmit to crew..." maxlength="250" autocomplete="off">
        <button class="btn btn-primary btn-chat-send" id="${boxId}-send">Send</button>
      </div>
    </div>
  `;
}

function setupChatListeners(boxId) {
  const input = document.querySelector(`#${boxId}-input`);
  const sendBtn = document.querySelector(`#${boxId}-send`);
  const messagesContainer = document.querySelector(`#${boxId}-messages`);

  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  const handleSend = () => {
    if (!input) return;
    const now = Date.now();
    if (now - lastChatSent < 350) return;
    const val = input.value.trim();
    if (!val) return;
    lastChatSent = now;
    network.sendChatMessage(val);
    input.value = '';
    input.focus();
  };

  sendBtn?.addEventListener('click', () => {
    sounds.btnClick();
    handleSend();
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  });

  document.querySelectorAll(`#${boxId} .quick-chip`).forEach(chip => {
    chip.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastChatSent < 350) return;
      lastChatSent = now;
      sounds.btnClick();
      const txt = chip.dataset.quick;
      if (txt) {
        network.sendChatMessage(txt);
      }
    });
  });

  document.querySelector('#btn-close-game-chat')?.addEventListener('click', () => {
    sounds.btnClick();
    isGameChatOpen = false;
    render();
  });
}

function clearAutoMoveTimer() {
  if (autoMoveTimer) {
    clearTimeout(autoMoveTimer);
    autoMoveTimer = null;
  }
}

function checkAndTriggerAutoMove(delayMs = 380) {
  const state = engine.state;
  if (!state || state.gameOver) {
    clearAutoMoveTimer();
    return;
  }

  // Only auto-move during 'moving' phase when moves remain
  if (state.phase !== 'moving' || state.movesRemaining <= 0) {
    clearAutoMoveTimer();
    return;
  }

  // Do not auto-move if paused for a modal or choice
  if (state.pendingModal || state.pendingChoice) {
    clearAutoMoveTimer();
    return;
  }

  // Do not auto-move if Explorer activated Momentum (manual mode)
  if (state.momentumActive) {
    clearAutoMoveTimer();
    return;
  }

  // In multiplayer, only the active player's client drives the step pacing
  const isMyTurn = network.isMyTurn(state.currentPlayerIndex);
  if (!isMyTurn) {
    clearAutoMoveTimer();
    return;
  }

  // If already scheduled, let it run
  if (autoMoveTimer) return;

  // Schedule next step
  autoMoveTimer = setTimeout(() => {
    autoMoveTimer = null;
    const currentState = engine.state;
    if (
      currentState?.phase === 'moving' &&
      currentState.movesRemaining > 0 &&
      !currentState.momentumActive &&
      !currentState.pendingModal &&
      !currentState.pendingChoice &&
      network.isMyTurn(currentState.currentPlayerIndex)
    ) {
      sounds.moveStep();
      engine.movePlayerStep();
      network.sendAction({ type: 'MOVE_STEP' });

      // Trigger next step
      checkAndTriggerAutoMove(380);
    }
  }, delayMs);
}

// Subscribe to game engine state changes
engine.subscribe((state, eventType) => {
  if (state?.gameOver && currentScreen === 'game') {
    if (state.endReason === 'collapse') {
      sounds.collapse();
    } else {
      sounds.victory();
    }
    currentScreen = 'endgame';
    render();
    return;
  }

  // Only update header countdown span without re-rendering entire screen
  if (eventType === 'timer') {
    const timerSpan = document.querySelector('.game-timer span:last-child');
    if (timerSpan && typeof state.gameTimeRemaining === 'number') {
      const minutes = Math.floor(state.gameTimeRemaining / 60);
      const seconds = state.gameTimeRemaining % 60;
      timerSpan.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return;
  }

  // Preserve chat input text and focus if user was typing during a turn or action update
  const activeInput = document.querySelector('.chat-text-input:focus');
  const activeInputId = activeInput?.id;
  const activeInputValue = activeInput?.value;

  // Reset spam debounce flags on phase change
  if (state?.phase !== 'rolling') isRollingDice = false;
  if (state?.phase !== 'moving') isMovingStep = false;
  if (state?.phase !== 'action') isEndingTurn = false;

  render();
  if (aiController.isAiTurn(engine, network)) {
    aiController.scheduleAiStep(engine, network, 750);
  } else {
    checkAndTriggerAutoMove(380);
  }

  if (activeInputId) {
    const restoredInput = document.querySelector(`#${activeInputId}`);
    if (restoredInput) {
      if (typeof activeInputValue === 'string') restoredInput.value = activeInputValue;
      restoredInput.focus();
    }
  }
});

// --- RENDER DISPATCHER ---
function render() {
  if (!app) return;

  switch (currentScreen) {
    case 'title':
      renderTitleScreen();
      break;
    case 'lobby':
      renderLobbyScreen();
      break;
    case 'game':
      renderGameScreen();
      break;
    case 'endgame':
      renderEndGameScreen();
      break;
  }

  renderToasts();
  if (showGuide) {
    renderGuideModal();
  }
}

// ==========================================
// 1. TITLE SCREEN
// ==========================================
function renderTitleScreen() {
  app.innerHTML = `
    <div class="title-screen">
      <div class="title-content">
        <h1 class="title-logo">PANAHON</h1>
        <div class="title-subtitle">Chrono Shift</div>
        <div class="title-acronym">Portal Anomaly Navigation and Historical Origin Network</div>
        <div class="title-buttons">
          <button id="btn-play-ai-solo" class="btn btn-primary" style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); box-shadow: 0 0 20px rgba(124, 58, 237, 0.45); font-size: 0.95rem;">
            ⚔️ Player vs. AI (Solo vs. Bots)
          </button>
          <button id="btn-play-local" class="btn btn-secondary">
            🛡️ Custom Game
          </button>
          <button id="btn-play-online" class="btn btn-secondary">
            🌐 Online Multiplayer
          </button>
          <button id="btn-rules" class="btn btn-secondary">
            📖 Rules & Field Manual
          </button>
          <button id="btn-sound-toggle" class="btn" style="padding: 8px 16px; font-size: 0.8rem; background: var(--bg-glass);">
            ${soundMuted ? '🔇 Audio Off' : '🔊 Audio On'}
          </button>
        </div>
        <div style="margin-top: 30px; font-size: 0.75rem; color: var(--text-secondary); letter-spacing: 1px;">
          Pixel Crew • BSIT 3-8 • Version 0.3
        </div>
      </div>
    </div>
  `;

  document.querySelector('#btn-play-ai-solo')?.addEventListener('click', () => {
    sounds.btnClick();
    localPlayers = [
      { name: 'Player 1', roleKey: 'HISTORIAN', type: 'human', difficulty: 'normal' },
      { name: 'Bot Explorer', roleKey: 'EXPLORER', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Guardian', roleKey: 'GUARDIAN', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Strategist', roleKey: 'STRATEGIST', type: 'ai', difficulty: 'normal' }
    ];
    lobbyMode = 'local';
    currentScreen = 'lobby';
    render();
  });

  document.querySelector('#btn-play-local')?.addEventListener('click', () => {
    sounds.btnClick();
    lobbyMode = 'local';
    currentScreen = 'lobby';
    render();
  });

  document.querySelector('#btn-play-online')?.addEventListener('click', () => {
    sounds.btnClick();
    lobbyMode = 'online';
    currentScreen = 'lobby';
    render();
  });

  document.querySelector('#btn-rules')?.addEventListener('click', () => {
    sounds.btnClick();
    showGuide = true;
    render();
  });

  document.querySelector('#btn-sound-toggle')?.addEventListener('click', () => {
    soundMuted = sounds.toggleMute();
    render();
  });
}

// ==========================================
// 2. LOBBY SCREEN
// ==========================================
function renderLobbyScreen() {
  const roleKeys = ROLE_ORDER;

  let contentHtml = '';

  if (lobbyMode === 'local') {
    const activeSlots = localPlayers.filter(p => p.type !== 'closed');
    contentHtml = `
      <div class="lobby-panel">
        <div class="lobby-section-title">WARCRAFT III CUSTOM LOBBY: CONFIGURE SLOTS</div>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: var(--space-sm);">
          Configure each slot as <strong>👤 Human</strong>, <strong>🤖 Computer (AI)</strong>, or <strong>🚫 Closed</strong>. Pick a preset or customize roles and AI difficulties.
        </p>

        <!-- Warcraft III Quick Preset Bar -->
        <div class="wc3-preset-bar">
          <button class="wc3-preset-btn" id="preset-1v3">⚔️ 1 Player vs 3 Bots</button>
          <button class="wc3-preset-btn" id="preset-2v2">🤝 2 Players vs 2 Bots</button>
          <button class="wc3-preset-btn" id="preset-4human">👥 4 Humans (Pass & Play)</button>
          <button class="wc3-preset-btn" id="preset-random">🎲 Shuffle Roles</button>
        </div>

        <div class="player-slots">
          ${localPlayers.map((player, idx) => {
      const isClosed = player.type === 'closed';
      const isAi = player.type === 'ai';
      const role = ROLES[player.roleKey] || ROLES.HISTORIAN;
      const color = PLAYER_COLORS[idx];

      if (isClosed) {
        return `
                <div class="player-slot closed-slot wc3-slot-card" style="border-left: 4px solid #4b5563; min-height: 105px; display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">🚫</div>
                    <div>
                      <div style="font-size: 0.75rem; color: #9ca3af; font-weight: 700;">SLOT ${idx + 1} &bull; CLOSED</div>
                      <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">Slot deactivated (will not participate in game)</div>
                    </div>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <select class="slot-type-select" data-idx="${idx}" style="background: rgba(0,0,0,0.6); color: #9ca3af; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 5px 8px; font-size: 0.75rem; font-weight: 600;">
                      <option value="human">👤 Human</option>
                      <option value="ai">🤖 Computer (AI)</option>
                      <option value="closed" selected>🚫 Closed</option>
                    </select>
                  </div>
                </div>
              `;
      }

      return `
              <div class="player-slot selected wc3-slot-card" style="border-left: 4px solid ${color};">
                <img src="${role.avatar}" class="player-slot-avatar" alt="${role.name}">
                <div class="player-slot-info" style="flex: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 0.72rem; color: ${color}; font-weight: 800; letter-spacing: 0.5px;">SLOT ${idx + 1}</span>
                      ${isAi ? `<span class="bot-badge">🤖 BOT</span>` : `<span class="human-badge">👤 HUMAN</span>`}
                    </div>
                    <select class="slot-type-select" data-idx="${idx}" style="background: rgba(0,0,0,0.6); color: ${isAi ? '#60A5FA' : '#34D399'}; border: 1px solid ${isAi ? 'rgba(96,165,250,0.4)' : 'rgba(52,211,153,0.4)'}; border-radius: 4px; padding: 4px 8px; font-size: 0.75rem; font-weight: 600;">
                      <option value="human" ${!isAi ? 'selected' : ''}>👤 Human</option>
                      <option value="ai" ${isAi ? 'selected' : ''}>🤖 Computer (AI)</option>
                      <option value="closed">🚫 Closed</option>
                    </select>
                  </div>

                  <div style="display: flex; gap: 6px; margin: 4px 0;">
                    <input type="text" class="player-name-input" data-idx="${idx}" value="${player.name}" placeholder="${isAi ? 'Bot Name' : 'Player Name'}" style="flex: 1; margin: 0; padding: 5px 8px; font-size: 0.8rem;">
                    ${isAi ? `
                      <select class="ai-difficulty-select" data-idx="${idx}" style="background: rgba(0,0,0,0.6); color: #60A5FA; border: 1px solid rgba(96,165,250,0.4); border-radius: 4px; padding: 4px 8px; font-size: 0.72rem;">
                        <option value="easy" ${player.difficulty === 'easy' ? 'selected' : ''}>🟢 Easy</option>
                        <option value="normal" ${player.difficulty === 'normal' || !player.difficulty ? 'selected' : ''}>🔵 Normal</option>
                        <option value="hard" ${player.difficulty === 'hard' ? 'selected' : ''}>🔴 Hard</option>
                      </select>
                    ` : ''}
                  </div>

                  <select class="role-select" data-idx="${idx}" style="background: rgba(0,0,0,0.5); color: var(--text-accent); border: 1px solid var(--border-glass); border-radius: 4px; padding: 4px; font-size: 0.75rem; width: 100%;">
                    ${roleKeys.map(rk => `
                      <option value="${rk}" ${rk === player.roleKey ? 'selected' : ''}>
                        ${ROLES[rk].name} (${ROLES[rk].passive.name})
                      </option>
                    `).join('')}
                  </select>

                  <div class="player-slot-desc" style="margin-top: 4px;">
                    <strong>Active:</strong> ${role.active.name} | <strong>Passive:</strong> ${role.passive.name}
                  </div>
                </div>
              </div>
            `;
    }).join('')}
        </div>

        <div style="margin-top: var(--space-xl); display: flex; gap: var(--space-md); justify-content: space-between; align-items: center; flex-wrap: wrap;">
          <button id="btn-lobby-back" class="btn btn-secondary">Back</button>
          <div style="display: flex; align-items: center; gap: var(--space-md);">
            <span style="font-size: 0.82rem; color: var(--text-secondary);">
              Active Castaways: <strong style="color: var(--text-accent); font-size: 0.95rem;">${activeSlots.length} / 4</strong>
            </span>
            <button id="btn-start-local" class="btn btn-primary" ${activeSlots.length === 0 ? 'disabled' : ''}>
              Launch Mission (${activeSlots.length} Castaway${activeSlots.length === 1 ? '' : 's'})
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Online Multiplayer
    const isRoomActive = network.roomCode !== null;
    contentHtml = `
      <div class="lobby-panel ${isRoomActive ? 'waiting-room-panel' : ''}">
        <div class="lobby-mode-tabs">
          <div class="mode-tab ${onlineSubMode === 'create' ? 'active' : ''}" id="tab-sub-create">Host Mission</div>
          <div class="mode-tab ${onlineSubMode === 'join' ? 'active' : ''}" id="tab-sub-join">Join Anomaly</div>
        </div>

        ${!isRoomActive ? `
          <div style="display: flex; flex-direction: column; gap: var(--space-md);">
            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Your Name:</label>
              <input type="text" id="online-name-input" class="player-name-input" value="${onlinePlayerName}" style="margin-top: 4px;">
            </div>

            <div>
              <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Choose Your Castaway Role:</label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); margin-top: 6px;">
                ${roleKeys.map(rk => {
      const role = ROLES[rk];
      const isSel = onlineSelectedRole === rk;
      return `
                    <div class="player-slot ${isSel ? 'selected' : ''}" data-role="${rk}" style="cursor: pointer; padding: 8px;">
                      <img src="${role.avatar}" class="player-slot-avatar" style="width: 38px; height: 38px;">
                      <div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: ${isSel ? 'var(--text-accent)' : 'var(--text-primary)'};">${role.name}</div>
                        <div style="font-size: 0.65rem; color: var(--text-secondary);">${role.passive.name}</div>
                      </div>
                    </div>
                  `;
    }).join('')}
              </div>
            </div>

            ${onlineSubMode === 'join' ? `
              <div>
                <label style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Room Code:</label>
                <input type="text" id="online-code-input" class="player-name-input" placeholder="e.g. KY72P" value="${onlineRoomCodeInput}" style="letter-spacing: 4px; font-family: var(--font-display); font-weight: 700; text-transform: uppercase; font-size: 1.1rem; margin-top: 4px;">
              </div>
            ` : ''}

            <!-- Cloud Relay Network Status Badge -->
            <div style="margin-top: var(--space-xs); padding: 8px 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1rem;">☁️</span>
              <div style="font-size: 0.72rem; color: #60A5FA; line-height: 1.3;">
                <strong>Global Cloud Relay Active:</strong> Ultra-fast synchronization across 5G mobile data, Wi-Fi, and VPNs via Render relay.
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: var(--space-md); margin-top: var(--space-md);">
              <button id="btn-lobby-back" class="btn btn-secondary">Back</button>
              <button id="btn-online-connect" class="btn btn-primary" ${isConnectingOnline ? 'disabled' : ''}>
                ${isConnectingOnline ? '🔄 Connecting...' : (onlineSubMode === 'create' ? 'Create Room' : 'Join Room')}
              </button>
            </div>
          </div>
        ` : `
          <!-- Waiting Room -->
          <div class="waiting-room-grid">
            <!-- Left: Room Code & Crew Slots -->
            <div style="display: flex; flex-direction: column; gap: var(--space-md);">
              <div class="room-code-display" style="padding: 16px;">
                <div class="room-code-label">Anomaly Sync Code</div>
                <div class="room-code" style="font-size: 2.2rem; letter-spacing: 6px;">${network.roomCode}</div>
                <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px;">Share this code with up to 3 allies to form your crew.</p>
              </div>

              <div>
                <div class="lobby-section-title" style="margin-bottom: 8px;">Connected Crew (${currentRoomPlayers.length}/4)</div>
                <div style="display: flex; flex-direction: column; gap: var(--space-xs);">
                  ${currentRoomPlayers.map((p, idx) => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-glass); border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="online-status connected"></span>
                        <span style="font-weight: 700; font-size: 0.88rem; color: ${PLAYER_COLORS[idx] || '#fff'};">${escapeHtml(p.name)}</span>
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-accent); font-family: var(--font-display);">
                        ${ROLES[p.roleKey]?.name || p.roleKey} ${p.isHost || p.id === 0 ? '★ Host' : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Right: Crew Comms (Lobby Chat) -->
            <div>
              ${renderChatBoxHtml('lobby-chat', false)}
            </div>
          </div>

          <!-- Bottom Full-Width Action Bar -->
          <div class="waiting-room-actions">
            <button id="btn-leave-room" class="btn btn-secondary">Leave Room</button>
            ${network.isHost ? `
              <button id="btn-host-start" class="btn btn-primary" ${currentRoomPlayers.length < 1 ? 'disabled' : ''}>
                Launch Mission (${currentRoomPlayers.length} Players)
              </button>
            ` : `
              <div style="font-size: 0.82rem; color: var(--text-secondary); font-style: italic;">
                Waiting for host to initiate Chrono Shift...
              </div>
            `}
          </div>
        `}
      </div>
    `;
  }

  app.innerHTML = `
    <div class="lobby-screen">
      <div class="lobby-title">MISSION BRIEFING</div>
      <div class="lobby-mode-tabs" style="max-width: ${network.roomCode ? '880px' : '700px'}; width: 100%;">
        <div class="mode-tab ${lobbyMode === 'local' ? 'active' : ''}" id="tab-local">Pass & Play (Local)</div>
        <div class="mode-tab ${lobbyMode === 'online' ? 'active' : ''}" id="tab-online">Online Multiplayer</div>
      </div>
      ${contentHtml}
    </div>
  `;

  // --- Attach Lobby Event Listeners ---
  document.querySelector('#tab-local')?.addEventListener('click', () => {
    sounds.btnClick();
    lobbyMode = 'local';
    render();
  });

  document.querySelector('#tab-online')?.addEventListener('click', () => {
    sounds.btnClick();
    lobbyMode = 'online';
    render();
  });

  document.querySelector('#btn-lobby-back')?.addEventListener('click', () => {
    sounds.btnClick();
    currentScreen = 'title';
    render();
  });

  // Warcraft III Lobby Presets
  document.querySelector('#preset-1v3')?.addEventListener('click', () => {
    sounds.btnClick();
    localPlayers[0] = { type: 'human', name: 'Player 1', roleKey: 'EXPLORER', difficulty: 'normal' };
    localPlayers[1] = { type: 'ai', name: 'Bot Magellan', roleKey: 'HISTORIAN', difficulty: 'normal' };
    localPlayers[2] = { type: 'ai', name: 'Bot Rizal', roleKey: 'GUARDIAN', difficulty: 'normal' };
    localPlayers[3] = { type: 'ai', name: 'Bot Luna', roleKey: 'STRATEGIST', difficulty: 'normal' };
    render();
  });

  document.querySelector('#preset-2v2')?.addEventListener('click', () => {
    sounds.btnClick();
    localPlayers[0] = { type: 'human', name: 'Player 1', roleKey: 'EXPLORER', difficulty: 'normal' };
    localPlayers[1] = { type: 'human', name: 'Player 2', roleKey: 'HISTORIAN', difficulty: 'normal' };
    localPlayers[2] = { type: 'ai', name: 'Bot Rizal', roleKey: 'GUARDIAN', difficulty: 'normal' };
    localPlayers[3] = { type: 'ai', name: 'Bot Luna', roleKey: 'STRATEGIST', difficulty: 'normal' };
    render();
  });

  document.querySelector('#preset-4human')?.addEventListener('click', () => {
    sounds.btnClick();
    localPlayers[0] = { type: 'human', name: 'Player 1', roleKey: 'EXPLORER', difficulty: 'normal' };
    localPlayers[1] = { type: 'human', name: 'Player 2', roleKey: 'HISTORIAN', difficulty: 'normal' };
    localPlayers[2] = { type: 'human', name: 'Player 3', roleKey: 'GUARDIAN', difficulty: 'normal' };
    localPlayers[3] = { type: 'human', name: 'Player 4', roleKey: 'STRATEGIST', difficulty: 'normal' };
    render();
  });

  document.querySelector('#preset-random')?.addEventListener('click', () => {
    sounds.btnClick();
    const shuffledRoles = [...ROLE_ORDER].sort(() => Math.random() - 0.5);
    const botNames = ['Bot Magellan', 'Bot Rizal', 'Bot Luna', 'Bot Tandang Sora'];
    localPlayers.forEach((p, i) => {
      p.roleKey = shuffledRoles[i % shuffledRoles.length];
      if (p.type === 'ai') {
        p.name = botNames[i % botNames.length];
      }
    });
    render();
  });

  // Slot Type selector (Human, AI, Closed)
  document.querySelectorAll('.slot-type-select[data-idx]').forEach(select => {
    select.addEventListener('change', (e) => {
      sounds.btnClick();
      const idx = parseInt(e.target.dataset.idx, 10);
      const newType = e.target.value;
      localPlayers[idx].type = newType;
      const botNames = ['Bot Magellan', 'Bot Rizal', 'Bot Luna', 'Bot Tandang Sora'];
      if (newType === 'ai') {
        if (!localPlayers[idx].name || localPlayers[idx].name.startsWith('Player')) {
          localPlayers[idx].name = botNames[idx % botNames.length];
        }
        if (!localPlayers[idx].difficulty) localPlayers[idx].difficulty = 'normal';
      } else if (newType === 'human') {
        if (!localPlayers[idx].name || localPlayers[idx].name.startsWith('Bot')) {
          localPlayers[idx].name = `Player ${idx + 1}`;
        }
      }
      render();
    });
  });

  // AI Difficulty selector
  document.querySelectorAll('.ai-difficulty-select[data-idx]').forEach(select => {
    select.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx, 10);
      localPlayers[idx].difficulty = e.target.value;
    });
  });

  // Local inputs
  document.querySelectorAll('.player-name-input[data-idx]').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      localPlayers[idx].name = e.target.value;
    });
  });

  document.querySelectorAll('.role-select[data-idx]').forEach(select => {
    select.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      localPlayers[idx].roleKey = e.target.value;
      render();
    });
  });

  document.querySelector('#btn-start-local')?.addEventListener('click', () => {
    const activeSlots = localPlayers.filter(p => p.type !== 'closed');
    if (activeSlots.length === 0) {
      showToast('Empty Lobby', 'Open at least 1 Human or Bot slot to launch!', 'danger');
      return;
    }

    sounds.portal();
    const configs = activeSlots.map((p, idx) => ({
      name: p.name.trim() || (p.type === 'ai' ? `Bot ${idx + 1}` : `Player ${idx + 1}`),
      roleKey: p.roleKey,
      isLocal: true,
      isAi: p.type === 'ai',
      aiDifficulty: p.difficulty || 'normal'
    }));
    network.setMode('local');
    engine.initGame(configs);
    sounds.startBgMusic();
    currentScreen = 'game';
    showToast('Mission Commenced', `Timeline localized with ${configs.length} Castaway(s)!`, 'success');
    render();

    if (aiController.isAiTurn(engine, network)) {
      aiController.scheduleAiStep(engine, network, 1000);
    }
  });

  // Online sub-mode tabs
  document.querySelector('#tab-sub-create')?.addEventListener('click', () => {
    sounds.btnClick();
    onlineSubMode = 'create';
    render();
  });

  document.querySelector('#tab-sub-join')?.addEventListener('click', () => {
    sounds.btnClick();
    onlineSubMode = 'join';
    render();
  });

  document.querySelector('#online-name-input')?.addEventListener('input', (e) => {
    onlinePlayerName = e.target.value;
  });

  document.querySelector('#online-code-input')?.addEventListener('input', (e) => {
    onlineRoomCodeInput = e.target.value.toUpperCase();
  });

  document.querySelectorAll('.player-slot[data-role]').forEach(slot => {
    slot.addEventListener('click', () => {
      sounds.btnClick();
      onlineSelectedRole = slot.dataset.role;
      render();
    });
  });

  document.querySelector('#btn-online-connect')?.addEventListener('click', () => {
    if (isConnectingOnline) return;
    sounds.btnClick();
    isConnectingOnline = true;
    network.setMode('online');
    render();
    if (onlineSubMode === 'create') {
      showToast('Creating Mission', 'Connecting to Cloud Relay...', 'info');
      network.createRoom(onlinePlayerName.trim() || 'Castaway', onlineSelectedRole);
    } else {
      if (!onlineRoomCodeInput) {
        isConnectingOnline = false;
        showToast('Invalid Code', 'Please enter a 5-letter Room Code.', 'warning');
        render();
        return;
      }
      showToast('Connecting', `Connecting to Room ${onlineRoomCodeInput}...`, 'info');
      network.joinRoom(onlineRoomCodeInput, onlinePlayerName.trim() || 'Castaway', onlineSelectedRole);
    }
  });

  document.querySelector('#btn-leave-room')?.addEventListener('click', () => {
    sounds.btnClick();
    network.leaveRoom();
    currentRoomPlayers = [];
    unreadChatCount = 0;
    render();
  });

  document.querySelector('#btn-host-start')?.addEventListener('click', (e) => {
    const btn = e.currentTarget;
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '🚀 Launching Mission...';
    sounds.btnClick();
    network.startGame();
  });

  if (network.roomCode) {
    setupChatListeners('lobby-chat');
  }
}

// ==========================================
// 3. GAME SCREEN
// ==========================================
function renderGameScreen() {
  const state = engine.getState();
  if (!state) return;

  const currentPlayer = engine.getCurrentPlayer();
  const timelineLevel = state.timelineMeter;
  const isOnline = network.mode === 'online';
  const isAiCurrent = currentPlayer?.isAi === true;
  const isMyTurn = !isAiCurrent && (!isOnline || currentPlayer.id === network.playerId);

  // Local user in multiplayer, or active turn player in Pass & Play
  const myPlayer = isOnline
    ? (state.players.find(p => p.id === network.playerId) || currentPlayer)
    : currentPlayer;

  // Inspected player (defaults to myPlayer in online mode, currentPlayer in Pass & Play)
  const viewedPlayer = (inspectedPlayerId !== null
    ? state.players.find(p => p.id === inspectedPlayerId)
    : null) || myPlayer;

  const isViewingSelf = viewedPlayer.id === myPlayer.id || !isOnline;

  // Header timeline color
  let timelineClass = 'safe';
  if (timelineLevel >= 8) timelineClass = 'danger';
  else if (timelineLevel >= 5) timelineClass = 'warn';

  // Format timer
  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  app.innerHTML = `
    <div class="game-screen">
      <!-- HEADER -->
      <header class="game-header">
        <div style="display: flex; align-items: center; gap: var(--space-md);">
          <div class="game-header-title">PANAHON</div>
          <span style="font-size: 0.75rem; color: var(--text-secondary); letter-spacing: 1px;">CHRONO SHIFT</span>
        </div>

        <div class="header-meters">
          <!-- Cooperative Timeline Meter -->
          <div class="timeline-meter" title="Cooperative Timeline Meter: If it reaches 10, the timeline collapses and all players lose!">
            <div class="timeline-meter-label">Timeline Stability:</div>
            <div class="timeline-meter-bar">
              <div class="timeline-meter-fill ${timelineClass}" style="width: ${(timelineLevel / 10) * 100}%;"></div>
            </div>
            <div class="timeline-meter-value ${timelineLevel >= 8 ? 'text-danger' : ''}">${timelineLevel}/10</div>
          </div>

          <!-- Game Timer -->
          <div class="game-timer" title="40-minute mission countdown">
            <span class="timer-icon">⏳</span>
            <span>${timerStr}</span>
          </div>

          <!-- Round counter -->
          <div style="font-family: var(--font-display); font-size: 0.8rem; color: var(--text-secondary);">
            Round <strong style="color: var(--text-accent);">${state.turnNumber}</strong>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-sm);">
          <button id="btn-toggle-chat" class="btn ${unreadChatCount > 0 ? 'btn-chat-unread' : ''}" style="padding: 6px 12px; font-size: 0.75rem; background: var(--bg-glass); position: relative;">
            💬 Comms ${unreadChatCount > 0 ? `<span class="chat-badge">${unreadChatCount}</span>` : ''}
          </button>
          <button id="btn-header-guide" class="btn" style="padding: 6px 12px; font-size: 0.75rem; background: var(--bg-glass);">
            📖 Manual
          </button>
          <button id="btn-header-sound" class="btn" style="padding: 6px 12px; font-size: 0.75rem; background: var(--bg-glass);">
            ${soundMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      <!-- LEFT PANEL: CASTAWAY DOSSIERS -->
      <aside class="left-panel">
        <div style="font-family: var(--font-display); font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">
          Temporal Castaways
        </div>

        ${state.players.map((p, idx) => {
    const isActive = idx === state.currentPlayerIndex;
    const isMe = isOnline && p.id === network.playerId;
    const isInspected = viewedPlayer.id === p.id;
    const paradoxPercent = Math.min(100, (p.paradox / 5) * 100);
    let paradoxClass = 'paradox-fill-low';
    if (p.paradox >= 4) paradoxClass = 'paradox-fill-high';
    else if (p.paradox >= 2) paradoxClass = 'paradox-fill-mid';

    return `
            <div class="player-card ${isActive ? 'active-turn' : ''} ${isInspected ? 'inspected-player' : ''}" data-player-id="${p.id}" style="border-left: 4px solid ${p.color}; cursor: pointer;" title="Click to view ${p.name}'s hand/clues">
              ${isActive ? `<div class="turn-indicator">▶</div>` : ''}
              <div class="player-card-header">
                <img src="${p.role.avatar}" class="player-avatar-small" alt="${p.name}">
                <div style="flex: 1;">
                  <div class="player-card-name" style="color: ${p.color};">
                    ${p.name}
                    ${p.isAi ? `<span class="bot-badge">🤖 BOT</span>` : `<span class="human-badge">👤</span>`}
                    ${isMe ? ' <span style="font-size: 0.65rem; color: var(--accent-gold); font-weight: normal;">(You)</span>' : ''}
                  </div>
                  <div class="player-card-role">${p.role.name}</div>
                </div>
                <div class="player-points">${p.points} PTS</div>
              </div>

              <div class="player-stats">
                <!-- Energy Bar -->
                <div class="stat-row">
                  <span class="stat-label">Energy</span>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <div class="stat-bar">
                      <div class="stat-bar-fill energy-fill" style="width: ${(p.energy / 10) * 100}%;"></div>
                    </div>
                    <span class="stat-value" style="color: var(--energy-color);">${p.energy}/10</span>
                  </div>
                </div>

                <!-- Individual Paradox Meter -->
                <div class="stat-row">
                  <span class="stat-label">Paradox</span>
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <div class="stat-bar">
                      <div class="stat-bar-fill ${paradoxClass}" style="width: ${paradoxPercent}%;"></div>
                    </div>
                    <span class="stat-value" style="color: ${p.paradox >= 4 ? 'var(--text-danger)' : 'var(--text-primary)'};">${p.paradox}/5</span>
                  </div>
                </div>

                <div class="stat-row" style="margin-top: 4px; font-size: 0.7rem; color: var(--text-secondary);">
                  <span>Era: <strong>${ERA_NAMES[p.currentEra].replace(' Era', '')}</strong></span>
                  <span>Clues: <strong>${(!isOnline || isMe) ? p.clueCards.filter(c => !c.isDecoy).length : p.clueCards.length}</strong></span>
                </div>
              </div>
            </div>
          `;
  }).join('')}
      </aside>

      <!-- CENTER: THE FOUR QUADRANTS BOARD (MARIO PARTY / PUMMEL PARTY STYLE) -->
      <main class="board-container">
        <!-- Board Camera Controls -->
        <div class="board-camera-bar">
          <button class="board-cam-btn ${cameraMode === 'full' ? 'active' : ''}" data-cam="full">🗺️ Full Map</button>
          <button class="board-cam-btn ${cameraMode === 'focus-spanish' ? 'active' : ''}" data-cam="focus-spanish">Spanish</button>
          <button class="board-cam-btn ${cameraMode === 'focus-american' ? 'active' : ''}" data-cam="focus-american">American</button>
          <button class="board-cam-btn ${cameraMode === 'focus-japanese' ? 'active' : ''}" data-cam="focus-japanese">Japanese</button>
          <button class="board-cam-btn ${cameraMode === 'focus-myth' ? 'active' : ''}" data-cam="focus-myth">Myth</button>
          <button class="board-cam-btn ${cameraMode === 'auto' ? 'active' : ''}" data-cam="auto">🎯 Auto Focus</button>
        </div>

        ${state.temporalOccurrence > 0 ? `
          <div class="temporal-badge">
            ⚡ Temporal Occurrence Active (${state.temporalOccurrence} turns left)!
          </div>
        ` : ''}

        <div class="board-viewport">
          <div class="board-map-wrapper ${cameraMode === 'auto' ? `focus-${currentPlayer.currentEra}` : (cameraMode === 'full' ? '' : cameraMode)}">
            <!-- SVG Path lines connecting circle spaces like Mario Party trail -->
            <svg class="board-paths-svg" viewBox="0 0 1024 765" preserveAspectRatio="none">
              ${ERA_ORDER.map(era => {
    const coords = ERA_TILE_COORDINATES[era];
    if (!coords) return '';
    // Convert percentage to pixel coordinates in 1024x765
    const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${(c.x * 1024) / 100} ${(c.y * 765) / 100}`).join(' ') + ' Z';
    const isActiveEra = currentPlayer.currentEra === era;
    return `<path d="${d}" class="board-path-line ${isActiveEra ? 'active-era-path' : ''}" />`;
  }).join('')}
              <!-- Connections from Timegate Spaces to Central Nexus Portal Dial -->
              ${ERA_ORDER.map(era => {
    const tgIdx = state.board[era].findIndex(t => t.type === 'timegate');
    if (tgIdx === -1) return '';
    const c = ERA_TILE_COORDINATES[era][tgIdx];
    return `<path d="M ${(c.x * 1024) / 100} ${(c.y * 765) / 100} L ${1024 * 0.50} ${765 * 0.49}" class="board-path-line" style="stroke: #00E5FF; stroke-width: 3; stroke-dasharray: 4 4;" />`;
  }).join('')}
            </svg>

            <!-- Circular Spaces along the paths -->
            <div class="board-map">
              ${ERA_ORDER.map(era => {
    const tiles = state.board[era];
    const coords = ERA_TILE_COORDINATES[era];

    return tiles.map((t, idx) => {
      const coord = coords[idx];
      const tileType = t.type;
      const playersOnTile = state.players.filter(p => p.currentEra === era && p.tileIndex === idx);

      // Calculate if space is reachable during moving phase (strictly following movementDirection)
      let isReachable = false;
      if (state.phase === 'moving' && state.movesRemaining > 0 && currentPlayer.currentEra === era) {
        const cIdx = currentPlayer.tileIndex;
        const dir = state.movementDirection === 'backward' ? -1 : 1;
        if (dir === 1 && idx === (cIdx + 1) % tiles.length) {
          isReachable = true;
        } else if (dir === -1 && idx === (cIdx - 1 + tiles.length) % tiles.length) {
          isReachable = true;
        }
      }

      let icon = '•';
      if (tileType === 'clue') icon = '🔍';
      else if (tileType === 'event') icon = '⚡';
      else if (tileType === 'danger') icon = '⚠️';
      else if (tileType === 'artifact') icon = '🏆';
      else if (tileType === 'timegate') icon = '🌀';
      else if (tileType === 'paradox') icon = '⏳';
      else if (tileType === 'start') icon = '🚩';

      return `
                    <div class="mario-party-space space-${tileType} ${isReachable ? 'reachable-space' : ''}" 
                         data-tile-id="${t.id}" 
                         style="left: ${coord.x}%; top: ${coord.y}%;"
                         title="${tileType.toUpperCase()} (Space #${idx + 1} - ${ERA_NAMES[era]})">
                      ${isReachable ? `<div class="reachable-arrow-indicator">▼</div>` : ''}
                      <div class="space-disc">
                        <span class="space-icon">${icon}</span>
                      </div>
                      ${t.trap ? `<span class="tile-trap-indicator" title="Temporal Trap!">💣</span>` : ''}
                      ${playersOnTile.length > 0 ? `
                        <div class="tile-players">
                          ${playersOnTile.map(p => {
        const isPawnTurn = p.id === currentPlayer.id;
        return `
                              <div class="mario-pawn ${isPawnTurn ? 'active-turn' : ''}" title="${p.name} (${p.role.name})">
                                ${isPawnTurn ? `<div class="pawn-turn-arrow">▼ YOU</div>` : ''}
                                <div class="pawn-badge" style="background: ${p.color};">P${p.id + 1}</div>
                                <img src="${p.role.avatar}" class="pawn-sprite" alt="${p.name}">
                                <div class="pawn-pedestal" style="background: ${p.color}; box-shadow: 0 0 8px ${p.color};"></div>
                              </div>
                            `;
      }).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `;
    }).join('');
  }).join('')}
            </div>
          </div>
        </div>
      </main>

      <!-- RIGHT PANEL: COMMAND CENTER & ACTION CONTROLS -->
      <aside class="right-panel">
        <!-- Active Turn Castaway -->
        <div class="panel-section" style="border-left: 3px solid ${currentPlayer.color};">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; display: flex; align-items: center; gap: 5px;">
                Current Turn ${isAiCurrent ? '<span class="bot-badge">🤖 BOT</span>' : '<span class="human-badge">👤 HUMAN</span>'}
              </div>
              <div style="font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: ${currentPlayer.color};">
                ${currentPlayer.name}
              </div>
            </div>
            <img src="${currentPlayer.role.avatar}" style="width: 36px; height: 36px; border-radius: var(--radius-sm); object-fit: contain;">
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
            Location: <strong style="color: var(--text-primary);">${ERA_NAMES[currentPlayer.currentEra]}</strong> (Tile #${currentPlayer.tileIndex})
          </div>
          ${isAiCurrent ? `
            <div class="ai-turn-banner" style="margin-top: 8px;">
              <span class="ai-pulse-dot"></span>
              <span><strong>${currentPlayer.name}</strong> is calculating actions...</span>
            </div>
          ` : ''}
        </div>

        <!-- DICE & MOVEMENT SECTION -->
        <div class="panel-section">
          <div class="panel-section-title">Movement & Dice</div>
          <div class="dice-area">
            <div id="dice-element" class="dice" title="Click to Roll Die">
              ${state.diceResult !== null ? state.diceResult : '?'}
            </div>
            <div>
              <div class="dice-result">
                Phase: <strong style="color: var(--text-accent); text-transform: uppercase;">${state.phase}</strong>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-primary); margin-top: 2px;">
                ${state.phase === 'rolling' ? 'Roll D6 to begin move' : `Moves left: <strong>${state.movesRemaining}</strong>`}
              </div>
            </div>
          </div>

          ${state.phase === 'rolling' ? `
            <button id="btn-roll-dice" class="btn btn-primary" style="width: 100%; margin-top: var(--space-sm); padding: 8px;" ${!isMyTurn ? 'disabled' : ''}>
              🎲 Roll Movement Die
            </button>
            ${currentPlayer.roleKey === 'EXPLORER' && isMyTurn ? `
              ${state.momentumActive ? `
                <div style="margin-top: 6px; padding: 6px; background: rgba(234, 179, 8, 0.2); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 6px; font-size: 0.75rem; color: #FACC15; text-align: center; font-weight: 600;">
                  🏃 Momentum Activated! Roll to move manually.
                </div>
              ` : (currentPlayer.activeCooldown === 0 && !currentPlayer.usedAbilityThisTurn && currentPlayer.energy >= 2 ? `
                <button id="btn-pre-momentum" class="btn btn-accent" style="width: 100%; margin-top: 6px; padding: 6px; font-size: 0.75rem;">
                  🏃 Activate Momentum First (-2 Energy, Manual Move)
                </button>
              ` : '')}
            ` : ''}
          ` : ''}

          ${state.phase === 'moving' ? `
            ${state.momentumActive ? `
              <div class="momentum-panel" style="margin-top: var(--space-sm); padding: 10px; background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; font-weight: 700; color: #FACC15; font-size: 0.85rem;">
                  <span>🏃 Momentum Active!</span>
                  <span class="badge" style="background: #FACC15; color: #000; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Manual Move</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin: 6px 0;">
                  Moves left: <strong>${state.movesRemaining}</strong> spaces. Pause & interact with any tile!
                </div>
                
                ${!state.momentumUsedMidTile && state.board[currentPlayer.currentEra][currentPlayer.tileIndex].type !== 'start' ? `
                  <button id="btn-momentum-interact" class="btn btn-accent" style="width: 100%; margin-bottom: 6px; padding: 8px; font-size: 0.8rem;" ${!isMyTurn ? 'disabled' : ''}>
                    ✨ Interact with Current Space (${state.board[currentPlayer.currentEra][currentPlayer.tileIndex].type.toUpperCase()})
                  </button>
                ` : (state.momentumUsedMidTile ? `
                  <div style="font-size: 0.7rem; color: #10B981; margin-bottom: 6px;">
                    ✓ Tile interaction used! Continue moving to finish.
                  </div>
                ` : '')}

                <button id="btn-move-step" class="btn btn-primary" style="width: 100%; padding: 8px; font-size: 0.8rem;" ${!isMyTurn ? 'disabled' : ''}>
                  Step Forward ➡️ (${state.movesRemaining} left)
                </button>
              </div>
            ` : `
              <div style="margin-top: var(--space-sm); padding: 10px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 8px; text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700; color: #60A5FA; font-size: 0.85rem;">
                  <span style="display: inline-block; animation: pawnHop 0.6s infinite alternate;">🚶</span>
                  <span>Auto-Moving... (${state.movesRemaining} left)</span>
                </div>
                
                ${currentPlayer.roleKey === 'EXPLORER' && currentPlayer.activeCooldown === 0 && !currentPlayer.usedAbilityThisTurn && currentPlayer.energy >= 2 && isMyTurn ? `
                  <button id="btn-pause-momentum" class="btn btn-accent" style="width: 100%; margin-top: 8px; padding: 6px 8px; font-size: 0.75rem;">
                    ⚡ Pause & Activate Momentum (-2 En)
                  </button>
                ` : ''}

                <button id="btn-move-step" class="btn btn-secondary" style="width: 100%; margin-top: 6px; padding: 5px; font-size: 0.72rem; opacity: 0.85;" ${!isMyTurn ? 'disabled' : ''}>
                  ⏩ Step Immediately
                </button>
              </div>
            `}
          ` : ''}
        </div>

        <!-- SPECIAL ACTIONS -->
        <div class="panel-section">
          <div class="panel-section-title">Temporal Actions</div>
          <div class="action-buttons">
            <!-- Reverse Time -->
            <button id="btn-act-reverse" class="action-btn" ${!isMyTurn || state.phase === 'moving' || currentPlayer.reverseTimeCooldown > 0 || currentPlayer.energy < GAME_CONSTANTS.REVERSE_TIME_COST ? 'disabled' : ''} title="Spend 3 Energy to roll and move backwards (${GAME_CONSTANTS.REVERSE_TIME_COOLDOWN} Turn CD)">
              <span class="action-btn-icon">⏪</span>
              <span>Reverse Time</span>
              <span class="action-btn-cost">
                ${currentPlayer.reverseTimeCooldown > 0 ? `CD: ${currentPlayer.reverseTimeCooldown}T` : `-3 Energy`}
              </span>
            </button>

            <!-- Rest -->
            <button id="btn-act-rest" class="action-btn" ${!isMyTurn || state.phase === 'moving' ? 'disabled' : ''} title="Rest your entire turn to recover +3 Energy">
              <span class="action-btn-icon">💤</span>
              <span>Rest (Skip)</span>
              <span class="action-btn-cost">+3 Energy</span>
            </button>

            <!-- Role Skill -->
            <button id="btn-act-skill" class="action-btn" ${!isMyTurn || state.phase === 'moving' || currentPlayer.usedAbilityThisTurn || currentPlayer.activeCooldown > 0 || currentPlayer.energy < (currentPlayer.role.active.energyCost || 0) ? 'disabled' : ''} title="${currentPlayer.role.active.description}">
              <span class="action-btn-icon">✨</span>
              <span>${currentPlayer.role.active.name}</span>
              <span class="action-btn-cost">
                ${currentPlayer.usedAbilityThisTurn ? 'Used this turn' : (currentPlayer.activeCooldown > 0 ? `CD: ${currentPlayer.activeCooldown}T` : `-${currentPlayer.role.active.energyCost || 0} En`)}
              </span>
            </button>

            <!-- Return Artifact -->
            ${(() => {
      const matchingArt = currentPlayer.artifactCards.find(a => a.era === currentPlayer.currentEra);
      return `
                <button id="btn-act-return" class="action-btn" ${!isMyTurn || !matchingArt ? 'disabled' : ''} title="Return matching artifact to this timeline for points!">
                  <span class="action-btn-icon">📦</span>
                  <span>Return Relic</span>
                  <span class="action-btn-cost">+5 Points</span>
                </button>
              `;
    })()}
          </div>

          <button id="btn-end-turn" class="btn btn-primary" style="width: 100%; margin-top: var(--space-md); padding: 8px;" ${!isMyTurn || state.phase === 'moving' ? 'disabled' : ''}>
            Finish Turn ⏭️
          </button>
        </div>

        <!-- GAME LOG FEED -->
        <div class="panel-section" style="flex: 1; min-height: 120px; display: flex; flex-direction: column;">
          <div class="panel-section-title">Timeline Chronicle</div>
          <div id="game-log-feed" class="game-log">
            ${engine.logEntries.slice().reverse().map(l => `
              <div class="log-entry">
                <span class="log-player">[${l.type.toUpperCase()}]</span> ${l.message}
              </div>
            `).join('')}
          </div>
        </div>
      </aside>

      <!-- BOTTOM PANEL: HAND & DOSSIER -->
      <section class="bottom-panel">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
          <div class="tab-nav" style="margin: 0;">
            <button class="tab-btn ${activeHandTab === 'mission' ? 'active' : ''}" id="tab-hand-mission">
              📜 Mission Dossier
            </button>
            <button class="tab-btn ${activeHandTab === 'clues' ? 'active' : ''}" id="tab-hand-clues">
              🔍 Clues (${viewedPlayer.clueCards.length})
            </button>
            <button class="tab-btn ${activeHandTab === 'artifacts' ? 'active' : ''}" id="tab-hand-artifacts">
              🏆 Relics (${viewedPlayer.artifactCards.length})
            </button>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
            <span>Viewing: <strong style="color: ${viewedPlayer.color};">${viewedPlayer.name}${isViewingSelf && isOnline ? ' (You)' : ''}</strong>'s Hand</span>
            ${!isViewingSelf ? `
              <button id="btn-view-own-hand" class="btn" style="padding: 2px 8px; font-size: 0.65rem; background: var(--accent-gold); color: #000; border-radius: 4px; font-weight: 700; cursor: pointer;">
                👁️ View My Hand
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Tab Contents -->
        <div style="flex: 1; overflow-y: auto;">
          ${activeHandTab === 'mission' && viewedPlayer.mission ? `
            <div class="mission-display">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div class="mission-title">
                    ${isViewingSelf
        ? `Mission: Retrieve ${viewedPlayer.mission.artifactNickname || viewedPlayer.mission.artifactName || 'Classified Relic'}`
        : `Mission: Classified Objective (${viewedPlayer.name})`}
                  </div>
                  <div class="mission-objective">
                    ${isViewingSelf
        ? viewedPlayer.mission.description
        : `Historical mission details and clues are classified to ${viewedPlayer.name}.`}
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 0.7rem; background: var(--bg-glass); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-glass);">
                    Target Era: <strong>${ERA_NAMES[viewedPlayer.mission.targetEra]}</strong>
                  </span>
                </div>
              </div>

              <!-- Clue requirement progress -->
              <div class="mission-progress">
                <span class="mission-progress-text">Clue Progress:</span>
                <div class="mission-progress-bar">
                  <div class="mission-progress-fill" style="width: ${(Math.min(3, isViewingSelf ? (viewedPlayer.clueProgress[viewedPlayer.mission.artifactId] || 0) : viewedPlayer.clueCards.length) / 3) * 100}%;"></div>
                </div>
                <span class="mission-progress-text">
                  ${isViewingSelf
        ? `${viewedPlayer.clueProgress[viewedPlayer.mission.artifactId] || 0}/3 Required Clues`
        : `${viewedPlayer.clueCards.length} Clues Collected`}
                </span>
              </div>
            </div>
          ` : ''}

          ${activeHandTab === 'clues' ? `
            <div class="hand-cards">
              ${viewedPlayer.clueCards.length === 0 ? `
                <div style="font-size: 0.8rem; color: var(--text-secondary); padding: 10px;">
                  No clues collected yet. Land on Clue Tiles (🔍) in different eras to discover hints.
                </div>
              ` : viewedPlayer.clueCards.map(c => {
          if (isViewingSelf) {
            const cardImg = c.cardImage || c.image || '';
            const cardDesc = c.description || c.hint || (c.isDecoy ? 'Decoy Hint' : 'Clue Card');
            return `
                    <div class="hand-card clue-card" data-card-type="clue" data-card-id="${c.id}" title="${escapeHtml(cardDesc)}">
                      <img src="${cardImg}" alt="${escapeHtml(cardDesc)}">
                      <div class="hand-card-type" style="color: ${c.isDecoy ? 'var(--text-danger)' : 'var(--tile-clue)'};">
                        ${c.isDecoy ? 'Decoy Hint' : `${ERA_NAMES[c.era].replace(' Era', '')}`}
                      </div>
                    </div>
                  `;
          } else {
            return `
                    <div class="hand-card clue-card clue-card-secret" title="Secret Clue Card (${ERA_NAMES[c.era].replace(' Era', '')})">
                      <div class="card-secret-back">
                        <div class="card-secret-icon">🔒</div>
                        <div class="card-secret-label">${ERA_NAMES[c.era].replace(' Era', '')}</div>
                      </div>
                      <div class="hand-card-type" style="color: var(--text-secondary);">
                        Classified Clue
                      </div>
                    </div>
                  `;
          }
        }).join('')}
            </div>
          ` : ''}

          ${activeHandTab === 'artifacts' ? `
            <div class="hand-cards">
              ${viewedPlayer.artifactCards.length === 0 ? `
                <div style="font-size: 0.8rem; color: var(--text-secondary); padding: 10px;">
                  No historical artifacts acquired yet. Reach an Artifact Tile with 3 clues to retrieve one!
                </div>
              ` : viewedPlayer.artifactCards.map(a => `
                <div class="hand-card artifact-card" data-card-type="artifact" data-card-id="${a.id}" title="${a.name} (${a.nickname})">
                  <img src="${a.cardImage || a.image}" alt="${a.name}">
                  <div class="hand-card-type" style="color: var(--tile-artifact);">
                    ${a.nickname}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </section>

      <!-- Floating In-Game Chat Drawer -->
      ${isGameChatOpen ? renderChatBoxHtml('game-chat', true) : ''}
    </div>
  `;

  // Attach Game Event Handlers
  attachGameListeners(state, currentPlayer, isMyTurn);

  // Render modal if pending
  if (state.pendingModal) {
    renderCardModal(state.pendingModal);
  } else if (state.pendingChoice) {
    renderChoiceModal(state.pendingChoice);
  } else {
    dismissAnyActiveOverlay();
  }
}

function attachGameListeners(state, currentPlayer, isMyTurn) {
  // Chat Toggle
  document.querySelector('#btn-toggle-chat')?.addEventListener('click', () => {
    sounds.btnClick();
    isGameChatOpen = !isGameChatOpen;
    if (isGameChatOpen) {
      unreadChatCount = 0;
    }
    render();
  });

  if (isGameChatOpen) {
    setupChatListeners('game-chat');
  }

  // Guide and audio buttons
  document.querySelector('#btn-header-guide')?.addEventListener('click', () => {
    sounds.btnClick();
    showGuide = true;
    render();
  });

  document.querySelector('#btn-header-sound')?.addEventListener('click', () => {
    soundMuted = sounds.toggleMute();
    render();
  });

  // Camera control buttons
  document.querySelectorAll('.board-cam-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.btnClick();
      cameraMode = btn.dataset.cam;
      render();
    });
  });

  // Hand tabs
  document.querySelector('#tab-hand-mission')?.addEventListener('click', () => {
    sounds.btnClick();
    activeHandTab = 'mission';
    render();
  });
  document.querySelector('#tab-hand-clues')?.addEventListener('click', () => {
    sounds.btnClick();
    activeHandTab = 'clues';
    render();
  });
  document.querySelector('#tab-hand-artifacts')?.addEventListener('click', () => {
    sounds.btnClick();
    activeHandTab = 'artifacts';
    render();
  });

  // Switch back to own hand
  document.querySelector('#btn-view-own-hand')?.addEventListener('click', () => {
    sounds.btnClick();
    inspectedPlayerId = null;
    render();
  });

  // Hand card preview on click
  document.querySelectorAll('.hand-card[data-card-id]').forEach(cardEl => {
    cardEl.addEventListener('click', () => {
      const cardId = cardEl.dataset.cardId;
      const cardType = cardEl.dataset.cardType;
      sounds.btnClick();
      const viewedPlayer = (inspectedPlayerId !== null && state.players[inspectedPlayerId]) ? state.players[inspectedPlayerId] : currentPlayer;
      if (cardType === 'clue') {
        const found = viewedPlayer.clueCards.find(c => c.id === cardId);
        if (found) {
          renderCardModal({
            title: found.isDecoy ? 'Decoy Card' : 'Clue Card',
            cardType: found.isDecoy ? 'Decoy Card' : 'Clue Card',
            description: found.description || found.hint,
            image: found.cardImage || found.image,
            era: found.era
          });
        }
      } else if (cardType === 'artifact') {
        const found = viewedPlayer.artifactCards.find(a => a.id === cardId);
        if (found) {
          renderCardModal({
            title: `${found.name} (${found.nickname})`,
            cardType: 'Historical Relic',
            description: found.description,
            image: found.cardImage || found.image,
            era: found.era
          });
        }
      }
    });
  });

  // Inspect player from sidebar
  document.querySelectorAll('.player-card[data-player-id]').forEach(card => {
    card.addEventListener('click', () => {
      const pId = parseInt(card.dataset.playerId, 10);
      if (!isNaN(pId)) {
        sounds.btnClick();
        inspectedPlayerId = pId;
        render();
      }
    });
  });

  if (!isMyTurn) return;

  // Dice roll
  const rollAction = () => {
    if (isRollingDice || state.phase !== 'rolling' || !isMyTurn) return;
    isRollingDice = true;
    clearAutoMoveTimer();

    const rollBtn = document.querySelector('#btn-roll-dice');
    if (rollBtn) {
      rollBtn.disabled = true;
      rollBtn.style.opacity = '0.5';
      rollBtn.style.pointerEvents = 'none';
    }

    sounds.diceRoll();
    const diceEl = document.querySelector('#dice-element');
    diceEl?.classList.add('rolling');

    setTimeout(() => {
      if (engine.state.phase === 'rolling') {
        const result = engine.rollDice();
        if (result) {
          network.sendAction({ type: 'ROLL_DICE', result });
        }
      }
      isRollingDice = false;
    }, 600);
  };

  document.querySelector('#btn-roll-dice')?.addEventListener('click', rollAction);
  document.querySelector('#dice-element')?.addEventListener('click', () => {
    if (state.phase === 'rolling') rollAction();
  });

  // Momentum triggers (pre-roll and mid-movement)
  const triggerMomentum = () => {
    if (state.phase !== 'rolling' && state.phase !== 'moving') return;
    sounds.btnClick();
    clearAutoMoveTimer();
    const ok = engine.useActiveAbility(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'USE_ABILITY', playerIdx: state.currentPlayerIndex });
    }
  };
  document.querySelector('#btn-pre-momentum')?.addEventListener('click', triggerMomentum);
  document.querySelector('#btn-pause-momentum')?.addEventListener('click', triggerMomentum);

  // Momentum mid-tile interaction
  document.querySelector('#btn-momentum-interact')?.addEventListener('click', () => {
    sounds.btnClick();
    const ok = engine.interactMomentumTile(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'INTERACT_MOMENTUM', playerIdx: state.currentPlayerIndex });
    }
  });

  // Step movement button
  const triggerStepMove = () => {
    if (isMovingStep || state.phase !== 'moving' || state.movesRemaining <= 0 || !isMyTurn) return;
    isMovingStep = true;
    clearAutoMoveTimer();

    document.querySelectorAll('#btn-move-step, #btn-move-fwd, #btn-move-bwd').forEach(b => {
      b.disabled = true;
      b.style.opacity = '0.6';
    });

    sounds.moveStep();
    const ok = engine.movePlayerStep();
    if (ok) {
      network.sendAction({ type: 'MOVE_STEP' });
    }
    setTimeout(() => {
      isMovingStep = false;
    }, 280);
  };
  document.querySelector('#btn-move-step')?.addEventListener('click', triggerStepMove);
  document.querySelector('#btn-move-fwd')?.addEventListener('click', triggerStepMove);
  document.querySelector('#btn-move-bwd')?.addEventListener('click', triggerStepMove);

  // Space / tile clicking for movement
  document.querySelectorAll('.mario-party-space[data-tile-id]').forEach(spaceEl => {
    spaceEl.addEventListener('click', () => {
      if (isMovingStep || state.phase !== 'moving' || state.movesRemaining <= 0 || !isMyTurn) return;
      isMovingStep = true;
      clearAutoMoveTimer();
      const tileId = spaceEl.dataset.tileId;
      const ok = engine.moveToTile(tileId);
      if (ok) {
        sounds.moveStep();
        network.sendAction({ type: 'MOVE_TO_TILE', targetTileId: tileId });
      }
      setTimeout(() => {
        isMovingStep = false;
      }, 280);
    });
  });

  // Actions
  document.querySelector('#btn-act-reverse')?.addEventListener('click', (e) => {
    if (state.phase === 'moving' || !isMyTurn) return;
    const btn = e.currentTarget;
    if (btn.disabled) return;
    btn.disabled = true;
    sounds.portal();
    const ok = engine.reverseTime(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'REVERSE_TIME', playerIdx: state.currentPlayerIndex });
    }
  });

  document.querySelector('#btn-act-rest')?.addEventListener('click', (e) => {
    if (state.phase === 'moving' || !isMyTurn) return;
    const btn = e.currentTarget;
    if (btn.disabled) return;
    btn.disabled = true;
    sounds.btnClick();
    engine.rest(state.currentPlayerIndex);
    network.sendAction({ type: 'REST', playerIdx: state.currentPlayerIndex });
  });

  document.querySelector('#btn-act-skill')?.addEventListener('click', (e) => {
    if (state.phase === 'moving' || !isMyTurn) return;
    const btn = e.currentTarget;
    if (btn.disabled) return;
    btn.disabled = true;
    sounds.btnClick();
    engine.useActiveAbility(state.currentPlayerIndex);
    network.sendAction({ type: 'USE_ABILITY', playerIdx: state.currentPlayerIndex });
  });

  document.querySelector('#btn-act-return')?.addEventListener('click', (e) => {
    if (state.phase !== 'action' || !isMyTurn) return;
    const btn = e.currentTarget;
    if (btn.disabled) return;
    const matchingArt = currentPlayer.artifactCards.find(a => a.era === currentPlayer.currentEra);
    if (matchingArt) {
      btn.disabled = true;
      sounds.artifact();
      engine.returnArtifact(state.currentPlayerIndex, matchingArt.id);
      network.sendAction({ type: 'RETURN_ARTIFACT', playerIdx: state.currentPlayerIndex, artifactId: matchingArt.id });
    }
  });

  document.querySelector('#btn-end-turn')?.addEventListener('click', (e) => {
    if (isEndingTurn || state.phase !== 'action' || !isMyTurn) return;
    isEndingTurn = true;
    const btn = e.currentTarget;
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Ending Turn...';
      btn.style.pointerEvents = 'none';
    }
    clearAutoMoveTimer();
    sounds.btnClick();
    engine.endTurn();
    network.sendAction({ type: 'END_TURN' });
    if (network.isHost) {
      network.broadcastState(engine.getState());
    }
    setTimeout(() => {
      isEndingTurn = false;
    }, 600);
  });
}

let activeOverlayTimeout = null;

function dismissAnyActiveOverlay(immediate = false) {
  if (activeOverlayTimeout) {
    clearTimeout(activeOverlayTimeout);
    activeOverlayTimeout = null;
  }
  const overlays = document.querySelectorAll('#active-modal, .side-card-overlay');
  if (overlays.length === 0) return;

  if (immediate) {
    overlays.forEach(el => el.remove());
  } else {
    overlays.forEach(el => {
      el.classList.add('overlay-closing');
      setTimeout(() => el.remove(), 250);
    });
  }
}

function renderMaximizedCardPreview(data) {
  dismissAnyActiveOverlay(true);

  const previewHtml = `
    <div class="modal-overlay" id="active-modal" style="z-index: 10000;">
      <div class="modal card-preview-modal" style="max-width: 460px; width: 92%; animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
        <button class="modal-close" id="max-preview-close">&times;</button>
        <div class="modal-title" style="color: ${data.isDanger ? 'var(--text-danger)' : (data.isEvent ? 'var(--tile-event)' : 'var(--text-accent)')};">
          ${data.cardType || data.title}
        </div>

        <div class="modal-body" style="text-align: center;">
          <div class="card-display" style="max-width: 330px; margin: 0 auto;">
            ${data.image ? `<img src="${data.image}" alt="${data.title}" style="max-height: 230px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.2); margin-bottom: 8px;">` : ''}
            <div class="card-display-title" style="font-size: 1.15rem; font-weight: 700; color: var(--text-accent);">${data.title}</div>
            ${data.era ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin: 4px 0 8px;">Era: <strong style="color: #fff;">${ERA_NAMES[data.era] || data.era}</strong></div>` : ''}
            <div class="card-display-desc" style="font-size: 0.88rem; line-height: 1.45; color: var(--text-primary); text-align: left; background: rgba(0,0,0,0.4); padding: 10px 12px; border-radius: 6px;">
              ${data.description || data.hint || 'Classified historical intel.'}
            </div>
          </div>

          ${data.diceRoll !== undefined ? `
            <div class="modal-dice" style="margin-top: 14px;">
              <div class="dice" style="border-color: ${data.success ? 'var(--text-success)' : 'var(--text-danger)'};">
                ${data.diceRoll}
              </div>
              <div class="modal-dice-result">
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Dice Check Roll</div>
                <div class="modal-dice-outcome ${data.success ? 'success' : 'failure'}">
                  ${data.success ? '✓ HAZARD EVADED' : '✗ HAZARD TRIGGERED'}
                </div>
                <div style="font-size: 0.8rem; margin-top: 4px; color: ${data.success ? 'var(--text-success)' : 'var(--text-danger)'};">
                  ${data.success ? data.successMsg : data.failMsg}
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="modal-actions" style="margin-top: 16px;">
          <button id="max-preview-close-btn" class="btn btn-primary" style="width: 100%;">Close Preview</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', previewHtml);

  const close = () => {
    sounds.btnClick?.();
    dismissAnyActiveOverlay(true);
  };
  document.querySelector('#max-preview-close')?.addEventListener('click', close);
  document.querySelector('#max-preview-close-btn')?.addEventListener('click', close);
}

// ==========================================
// 4. MODALS & CHOICES
// ==========================================
function renderCardModal(modal) {
  // Clear any existing overlay so only one overlay is active at a time
  dismissAnyActiveOverlay(true);

  const activePlayer = engine.getCurrentPlayer();
  const drawingPlayer = (modal.playerId !== undefined && engine.state?.players[modal.playerId])
    ? engine.state.players[modal.playerId]
    : activePlayer;
  const isAi = drawingPlayer?.isAi === true;

  const isDanger = modal.type === 'danger';
  const isEvent = modal.type === 'event';
  const isArtifact = modal.type === 'artifact';
  const isClue = modal.isClue || modal.cardType === 'Clue Card' || modal.cardType === 'Decoy Card';

  // If drawn by an AI bot, show non-blocking side overlay with auto-dismiss timer and click-to-maximize
  if (isAi) {
    const overlayHtml = `
      <div class="side-card-overlay" id="active-modal">
        <div class="side-card-header">
          <div class="side-card-title">
            <span class="bot-badge">🤖 BOT</span>
            <span style="color: ${isDanger ? 'var(--text-danger)' : (isEvent ? 'var(--tile-event)' : 'var(--text-accent)')};">
              ${modal.cardType || modal.title}
            </span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <button class="side-card-maximize" id="side-overlay-maximize-btn" title="Click to view card in full screen">🔍</button>
            <button class="side-card-close" id="side-overlay-close-btn" title="Dismiss">&times;</button>
          </div>
        </div>

        <div class="side-card-body">
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
            <strong style="color: ${drawingPlayer?.color || '#fff'};">${escapeHtml(drawingPlayer?.name || modal.playerName || 'Bot')}</strong> drew a card:
          </div>

          <div class="side-card-content-preview side-card-clickable" id="side-card-preview-box" title="Click to view card in full screen">
            ${modal.image ? `<img src="${modal.image}" class="side-card-thumb" alt="${modal.title}">` : ''}
            <div>
              <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${modal.title}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); line-height: 1.3; margin-top: 2px;">
                ${modal.description || ''}
              </div>
            </div>
          </div>

          <div style="font-size: 0.68rem; color: #60A5FA; display: flex; align-items: center; gap: 4px; cursor: pointer;" id="side-card-click-hint">
            <span>🔍</span> Click card to view in full size
          </div>

          ${isDanger && modal.diceRoll !== undefined ? `
            <div style="margin-top: 6px; font-size: 0.75rem; color: ${modal.success ? 'var(--text-success)' : 'var(--text-danger)'}; font-weight: 700;">
              🎲 Rolled ${modal.diceRoll}: ${modal.success ? '✓ Hazard Evaded' : '✗ Hazard Triggered'}
            </div>
          ` : ''}
        </div>

        <div class="overlay-timer-bar">
          <div class="overlay-timer-fill"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHtml);

    const openMaximized = () => {
      sounds.btnClick?.();
      renderMaximizedCardPreview({
        title: modal.title,
        cardType: modal.cardType,
        description: modal.description,
        image: modal.image,
        era: modal.era,
        diceRoll: modal.diceRoll,
        success: modal.success,
        successMsg: modal.successMsg,
        failMsg: modal.failMsg,
        isDanger: isDanger,
        isEvent: isEvent
      });
    };

    document.querySelector('#side-card-preview-box')?.addEventListener('click', openMaximized);
    document.querySelector('#side-card-click-hint')?.addEventListener('click', openMaximized);
    document.querySelector('#side-overlay-maximize-btn')?.addEventListener('click', openMaximized);

    document.querySelector('#side-overlay-close-btn')?.addEventListener('click', () => {
      dismissAnyActiveOverlay(true);
    });

    if (activeOverlayTimeout) clearTimeout(activeOverlayTimeout);
    activeOverlayTimeout = setTimeout(() => {
      dismissAnyActiveOverlay();
    }, 2800);

    return;
  }

  // In online multiplayer, hide other players' clue cards (only the player who drew it sees the card content)
  const isSecretToMe = (network.mode === 'online') && isClue && (modal.playerId !== undefined) && (modal.playerId !== network.playerId);

  const modalHtml = isSecretToMe ? `
    <div class="modal-overlay" id="active-modal">
      <div class="modal">
        <button class="modal-close" id="modal-close-btn">&times;</button>
        <div class="modal-title" style="color: var(--tile-clue);">
          🔍 Clue Discovered
        </div>

        <div class="modal-body">
          <div class="card-display card-back-display">
            <div class="card-back-icon">⏳🔍</div>
            <div class="card-display-title">Secret Clue Card</div>
            <div class="card-display-desc">
              <strong style="color: var(--text-accent);">${escapeHtml(modal.playerName || 'A Castaway')}</strong> excavated a secret Clue Card in <strong>${ERA_NAMES[modal.era] || 'the timeline'}</strong>.
              <br><br>
              <span style="color: var(--text-secondary); font-size: 0.8rem;">
                Card details, hints, and authenticity are secret to ${escapeHtml(modal.playerName || 'the drawer')}.
              </span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button id="modal-confirm-btn" class="btn btn-secondary">Understood</button>
        </div>
      </div>
    </div>
  ` : `
    <div class="modal-overlay" id="active-modal">
      <div class="modal">
        <button class="modal-close" id="modal-close-btn">&times;</button>
        <div class="modal-title" style="color: ${isDanger ? 'var(--text-danger)' : (isEvent ? 'var(--tile-event)' : 'var(--text-accent)')};">
          ${modal.cardType || modal.title}
        </div>

        <div class="modal-body">
          <div class="card-display">
            ${modal.image ? `<img src="${modal.image}" alt="${modal.title}">` : ''}
            <div class="card-display-title">${modal.title}</div>
            <div class="card-display-desc">${modal.description}</div>
          </div>

          ${isDanger && modal.diceRoll !== undefined ? `
            <div class="modal-dice">
              <div class="dice" style="border-color: ${modal.success ? 'var(--text-success)' : 'var(--text-danger)'};">
                ${modal.diceRoll}
              </div>
              <div class="modal-dice-result">
                <div style="font-size: 0.8rem; color: var(--text-secondary);">Dice Check Roll</div>
                <div class="modal-dice-outcome ${modal.success ? 'success' : 'failure'}">
                  ${modal.success ? '✓ HAZARD EVADED' : '✗ HAZARD TRIGGERED'}
                </div>
                <div style="font-size: 0.8rem; margin-top: 4px; color: ${modal.success ? 'var(--text-success)' : 'var(--text-danger)'};">
                  ${modal.success ? modal.successMsg : modal.failMsg}
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="modal-actions">
          <button id="modal-confirm-btn" class="btn btn-primary">Acknowledge</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  let isDismissing = false;
  const dismiss = () => {
    if (isDismissing) return;
    isDismissing = true;
    document.querySelector('#modal-confirm-btn')?.setAttribute('disabled', 'true');
    document.querySelector('#modal-close-btn')?.setAttribute('disabled', 'true');
    sounds.btnClick();
    if (network.mode !== 'online' || modal.playerId === undefined || modal.playerId === network.playerId) {
      engine.dismissModal();
      network.sendAction({ type: 'DISMISS_MODAL' });
    }
    dismissAnyActiveOverlay(true);
  };

  document.querySelector('#modal-close-btn')?.addEventListener('click', dismiss);
  document.querySelector('#modal-confirm-btn')?.addEventListener('click', dismiss);
}

function renderChoiceModal(choice) {
  // Clear any existing overlay so only one overlay is active at a time
  dismissAnyActiveOverlay(true);

  const activePlayer = engine.getCurrentPlayer();
  const isAi = activePlayer?.isAi === true;
  const isMyTurn = !isAi && network.isMyTurn(engine.state.currentPlayerIndex);
  const isDecipher = choice.type === 'historianDecipher';

  // If it's an AI choice, show as sleek non-blocking Side Overlay with auto-dismiss timer and click-to-maximize
  if (isAi) {
    const targetCard = (isDecipher && choice.drawnCards) ? choice.drawnCards[0] : null;
    const overlayHtml = `
      <div class="side-card-overlay" id="active-modal">
        <div class="side-card-header">
          <div class="side-card-title">
            <span class="bot-badge">🤖 BOT</span>
            <span>${choice.title}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            ${targetCard ? `<button class="side-card-maximize" id="side-choice-maximize-btn" title="Click to view card in full screen">🔍</button>` : ''}
            <button class="side-card-close" id="side-overlay-close-btn" title="Dismiss">&times;</button>
          </div>
        </div>

        <div class="side-card-body">
          <div style="font-size: 0.8rem; color: var(--text-secondary);">
            <strong style="color: ${activePlayer.color || '#fff'};">${activePlayer.name}</strong> evaluated tactical options:
          </div>

          ${isDecipher && choice.drawnCards ? `
            <div class="mystery-cards-mini-row side-card-clickable" id="side-choice-preview-box" title="Click to view card in full screen">
              ${choice.drawnCards.map((c, idx) => `
                <div class="mystery-card-mini ${idx === 0 ? 'selected-by-bot' : ''}">
                  <div style="font-size: 1.4rem;">📜</div>
                  <div style="font-size: 0.72rem; font-weight: 700; color: #60A5FA;">Card #${idx + 1}</div>
                  ${idx === 0 ? '<div class="mini-choice-badge">DECIPHERED</div>' : '<div style="font-size: 0.6rem; color: #94A3B8;">Deck Return</div>'}
                </div>
              `).join('')}
            </div>
            <div style="font-size: 0.68rem; color: #60A5FA; display: flex; align-items: center; gap: 4px; cursor: pointer;" id="side-choice-click-hint">
              <span>🔍</span> Click card to view in full size
            </div>
          ` : ''}

          <div class="side-card-status">
            <span class="ai-pulse-dot"></span>
            <span style="font-size: 0.78rem; color: #93C5FD; font-weight: 600;">
              ${choice.options[0]?.label || 'Resolving automatically...'}
            </span>
          </div>
        </div>

        <div class="overlay-timer-bar">
          <div class="overlay-timer-fill"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHtml);

    const openChoiceMaximized = () => {
      if (targetCard) {
        sounds.btnClick?.();
        renderMaximizedCardPreview({
          title: targetCard.title || (targetCard.isDecoy ? 'Decoy Card' : 'Clue Card'),
          cardType: targetCard.isDecoy ? 'Decoy Card' : 'Clue Card',
          description: targetCard.description || targetCard.hint,
          image: targetCard.image || targetCard.cardImage,
          era: targetCard.era
        });
      }
    };

    document.querySelector('#side-choice-preview-box')?.addEventListener('click', openChoiceMaximized);
    document.querySelector('#side-choice-click-hint')?.addEventListener('click', openChoiceMaximized);
    document.querySelector('#side-choice-maximize-btn')?.addEventListener('click', openChoiceMaximized);

    document.querySelector('#side-overlay-close-btn')?.addEventListener('click', () => {
      dismissAnyActiveOverlay(true);
    });

    if (activeOverlayTimeout) clearTimeout(activeOverlayTimeout);
    activeOverlayTimeout = setTimeout(() => {
      dismissAnyActiveOverlay();
    }, 2800);

    return;
  }

  // HUMAN CHOICE MODAL
  const modalHtml = `
    <div class="modal-overlay" id="active-modal">
      <div class="modal" ${isDecipher ? 'style="max-width: 500px; width: 95%;"' : ''}>
        <div class="modal-title">${choice.title}</div>
        <div class="modal-body" style="text-align: center; margin-bottom: var(--space-lg);">
          <p>${choice.message}</p>
          ${isDecipher && choice.drawnCards ? `
            <div class="mystery-cards-grid">
              ${choice.drawnCards.map((c, idx) => `
                <div class="mystery-card choice-btn" data-action="pick_${idx}" title="Click to choose Mystery Card #${idx + 1}" ${!isMyTurn && network.mode === 'online' ? 'style="pointer-events: none; opacity: 0.6;"' : ''}>
                  <div style="font-size: 2.2rem; filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.7));">📜</div>
                  <div style="font-size: 0.8rem; font-weight: 800; color: #60A5FA; letter-spacing: 0.5px;">CARD #${idx + 1}</div>
                  <div style="font-size: 0.62rem; color: #93C5FD; background: rgba(59, 130, 246, 0.2); padding: 2px 8px; border-radius: 10px; border: 1px solid rgba(59, 130, 246, 0.4);">
                    FACE DOWN
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 12px;">
              🔍 Click any face-down mystery card above to keep it!
            </div>
          ` : ''}
          ${!isMyTurn && network.mode === 'online' ? `
            <div style="font-size: 0.85rem; color: #60A5FA; margin-top: 10px; font-weight: 600;">
              ⏳ Waiting for ${activePlayer.name} to choose...
            </div>
          ` : ''}
        </div>
        <div class="modal-actions" style="display: flex; flex-direction: column; gap: var(--space-sm);">
          ${choice.options.map(opt => `
            <button class="btn btn-secondary choice-btn" data-action="${opt.action}" style="width: 100%;" ${!isMyTurn && network.mode === 'online' ? 'disabled' : ''}>
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  if (!isMyTurn && network.mode === 'online') {
    return;
  }

  let choiceHandled = false;
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (choiceHandled) return;
      choiceHandled = true;
      document.querySelectorAll('.choice-btn').forEach(b => {
        b.disabled = true;
        b.style.pointerEvents = 'none';
      });
      sounds.btnClick();
      const action = btn.dataset.action;
      if (action && (action.startsWith('warp_') || ['spanish', 'american', 'japanese', 'myth'].includes(action))) {
        sounds.portal();
      }
      engine.resolveChoice(action);
      network.sendAction({ type: 'RESOLVE_CHOICE', action });
      dismissAnyActiveOverlay(true);
    });
  });
}

// ==========================================
// 5. TOAST NOTIFICATIONS
// ==========================================
function renderToasts() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  container.innerHTML = toasts.map(t => `
    <div class="toast toast-${t.type}">
      <div class="toast-title">${t.title}</div>
      <div>${t.message}</div>
    </div>
  `).join('');
}

// ==========================================
// 6. RULES / GUIDE MODAL
// ==========================================
function renderGuideModal() {
  const existing = document.querySelector('#guide-modal');
  if (existing) existing.remove();

  const guideHtml = `
    <div class="modal-overlay" id="guide-modal" style="z-index: 1500;">
      <div class="modal" style="max-width: 680px; width: 95%;">
        <button class="modal-close" id="guide-close-btn">&times;</button>
        <div class="modal-title">PANAHON FIELD MANUAL (V0.3)</div>

        <div class="tab-nav" style="margin-bottom: var(--space-md);">
          <button class="tab-btn ${guideTab === 'overview' ? 'active' : ''}" id="gtab-overview">Overview</button>
          <button class="tab-btn ${guideTab === 'roles' ? 'active' : ''}" id="gtab-roles">Castaway Roles</button>
          <button class="tab-btn ${guideTab === 'mechanics' ? 'active' : ''}" id="gtab-mechanics">Meters & Rules</button>
          <button class="tab-btn ${guideTab === 'scoring' ? 'active' : ''}" id="gtab-scoring">Scoring</button>
        </div>

        <div class="modal-body" style="font-size: 0.85rem; line-height: 1.6; max-height: 55vh; overflow-y: auto;">
          ${guideTab === 'overview' ? `
            <h4 style="color: var(--text-accent);">About The Game</h4>
            <p>PANAHON: Chrono Shift is a cooperative and competitive tabletop time-travel game for 4 players. Players take the role of <strong>Temporal Castaways</strong> responsible for correcting disturbances across different timelines. Mysterious artifacts have been displaced from their original eras.</p>
            <h4 style="color: var(--text-accent); margin-top: 12px;">The 4 Historical Timelines</h4>
            <ul>
              <li><strong>Spanish Era (1521-1898):</strong> Silver Dos Mundos, Murillo Velarde Map, Concepcion Porcelain, Relicario.</li>
              <li><strong>American Era (1898-1946):</strong> Quezon Typewriter, El Renacimiento Issue, Kellogg Magneto, Port Telephone.</li>
              <li><strong>Japanese Era (1942-1945):</strong> Death March Marker, Senninbari Belt, Guerrilla Transceiver, Capas Field Litter.</li>
              <li><strong>Myth/Legend Era:</strong> Cordillera Bulul, Batu-Balani Agimat, Kamagong Comb, Kris ng Datu.</li>
            </ul>
          ` : ''}

          ${guideTab === 'roles' ? `
            <div style="display: flex; flex-direction: column; gap: var(--space-md);">
              <div style="border-left: 3px solid #E74C3C; padding-left: 8px;">
                <strong>The Historian:</strong>
                <div><em>Passive (Decoy Discard):</em> Discard a drawn Decoy Card (2 Turn CD).</div>
                <div><em>Active (Clue Decipher):</em> Look at the top 3 cards on the Clue Deck, keep 1, shuffle rest (Cost: 2 Energy, 3 Turn CD).</div>
              </div>
              <div style="border-left: 3px solid #3498DB; padding-left: 8px;">
                <strong>The Explorer:</strong>
                <div><em>Passive (Chrono-Stride):</em> Reduced Time Gate travel cost to 1 Energy.</div>
                <div><em>Active (Momentum):</em> Pause movement to interact with a tile, then continue moving (Cost: 1 Energy, 2 Turn CD).</div>
              </div>
              <div style="border-left: 3px solid #2ECC71; padding-left: 8px;">
                <strong>The Guardian:</strong>
                <div><em>Passive (Aegis Shield):</em> Reduce any Hazard/Danger Card penalty by 1.</div>
                <div><em>Active (Temporal Repair):</em> Reduce Paradox Meter by 1 and either spend 2 Energy or restore 1 Energy (3 Turn CD).</div>
              </div>
              <div style="border-left: 3px solid #F39C12; padding-left: 8px;">
                <strong>The Strategist:</strong>
                <div><em>Passive (Trap Mastery):</em> +1 Energy when someone triggers your Trap.</div>
                <div><em>Active (Temporal Trap):</em> Plant a Danger Trap on your current tile (Cost: 2 Energy, 2 Turn CD).</div>
              </div>
            </div>
          ` : ''}

          ${guideTab === 'mechanics' ? `
            <h4 style="color: var(--text-accent);">Energy System (0 - 10)</h4>
            <p>Every player starts with 10 Energy. Moving through Time Gates costs 2 Energy (1 for Explorer). Reaching 0 Energy makes a player <strong>Stranded</strong>. A stranded player can spend their turn <strong>Resting</strong> to recover +3 Energy.</p>

            <h4 style="color: var(--text-accent); margin-top: 10px;">Individual Paradox Meter (0 - 5)</h4>
            <ul>
              <li><strong>Level 0-1:</strong> Stable (+2 bonus points at game end).</li>
              <li><strong>Level 2:</strong> Minor Friction (-1 Point penalty).</li>
              <li><strong>Level 3:</strong> Temporal Strain (Immediate loss of 1 Energy).</li>
              <li><strong>Level 4:</strong> Anomaly Trigger (Immediately draw a Danger Card).</li>
              <li><strong>Level 5 (Critical Breach):</strong> +2 to Shared Timeline Meter, -3 Points, and meter resets to Level 2.</li>
            </ul>

            <h4 style="color: var(--text-danger); margin-top: 10px;">Shared Timeline Meter (0 - 10)</h4>
            <p><strong>Losing Condition:</strong> If the Timeline Meter reaches 10, the timeline collapses and <strong>all players immediately lose!</strong></p>

            <h4 style="color: var(--text-accent); margin-top: 10px;">Artifact Acquisition Rule</h4>
            <p>Players must gather at least <strong>3 Clues</strong> related to a specific artifact before attempting to acquire it from an Artifact Tile.</p>
          ` : ''}

          ${guideTab === 'scoring' ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.8rem;">
              <tr style="border-bottom: 1px solid var(--border-glass); text-align: left;">
                <th style="padding: 6px;">Achievement</th>
                <th style="padding: 6px; text-align: right;">Points</th>
              </tr>
              <tr><td style="padding: 4px;">Complete Assigned Mission</td><td style="text-align: right; color: var(--text-accent); font-weight: 700;">+10</td></tr>
              <tr><td style="padding: 4px;">Return Artifact to Correct Timeline</td><td style="text-align: right; color: var(--text-accent); font-weight: 700;">+5</td></tr>
              <tr><td style="padding: 4px;">Complete Optional Objective</td><td style="text-align: right; color: var(--text-accent);">+2</td></tr>
              <tr><td style="padding: 4px;">Collect Required Clues</td><td style="text-align: right; color: var(--text-accent);">+1 each</td></tr>
              <tr><td style="padding: 4px;">Unused Energy Remaining</td><td style="text-align: right; color: var(--text-accent);">+1 each</td></tr>
              <tr><td style="padding: 4px;">Paradox Level 0-1 (Stewardship)</td><td style="text-align: right; color: var(--text-success);">+2</td></tr>
              <tr><td style="padding: 4px;">Paradox Level 4-5</td><td style="text-align: right; color: var(--text-danger);">-3</td></tr>
              <tr><td style="padding: 4px;">Mission Failure</td><td style="text-align: right; color: var(--text-danger);">-5</td></tr>
            </table>
          ` : ''}
        </div>

        <div class="modal-actions">
          <button id="guide-close-btn2" class="btn btn-primary">Understood</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', guideHtml);

  const closeGuide = () => {
    sounds.btnClick();
    showGuide = false;
    document.querySelector('#guide-modal')?.remove();
  };

  document.querySelector('#guide-close-btn')?.addEventListener('click', closeGuide);
  document.querySelector('#guide-close-btn2')?.addEventListener('click', closeGuide);

  ['overview', 'roles', 'mechanics', 'scoring'].forEach(tab => {
    document.querySelector(`#gtab-${tab}`)?.addEventListener('click', () => {
      sounds.btnClick();
      guideTab = tab;
      renderGuideModal();
    });
  });
}

// ==========================================
// 7. END GAME SCREEN
// ==========================================
function renderEndGameScreen() {
  const state = engine.getState();
  if (!state) return;

  const isCollapse = state.endReason === 'collapse' || state.timelineMeter >= 10;
  const sortedPlayers = [...state.players].sort((a, b) => b.points - a.points);
  const winner = isCollapse ? null : sortedPlayers[0];

  app.innerHTML = `
    <div class="endgame-screen">
      <div class="endgame-title" style="color: ${isCollapse ? 'var(--text-danger)' : 'var(--text-accent)'};">
        ${isCollapse ? '💀 TIMELINE COLLAPSE!' : '🏆 MISSION COMPLETE!'}
      </div>
      <div class="endgame-subtitle">
        ${isCollapse
      ? 'The temporal breach reached catastrophic levels. History collapsed and all castaways were lost.'
      : `Temporal stability restored! Winner: ${winner.name} (${winner.role.name})`}
      </div>

      <div class="scoreboard">
        ${sortedPlayers.map((p, rank) => {
        const isWinner = !isCollapse && rank === 0;
        return `
            <div class="score-card ${isWinner ? 'winner' : ''}">
              <div class="score-rank">#${rank + 1}</div>
              <img src="${p.role.avatar}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: contain;">
              <div class="score-player-info">
                <div class="score-player-name" style="color: ${p.color};">
                  ${p.name} ${isWinner ? '👑' : ''}
                </div>
                <div class="score-player-role">${p.role.name}</div>
                <div class="score-breakdown">
                  <span class="score-item">Mission: <span class="score-item-value">${p.missionComplete ? '+10' : '-5'}</span></span>
                  <span class="score-item">Artifacts: <span class="score-item-value">+${p.artifactCards.length * 5}</span></span>
                  <span class="score-item">Clues: <span class="score-item-value">+${p.cluePoints || 0}</span></span>
                  <span class="score-item">Energy: <span class="score-item-value">+${p.energy}</span></span>
                  <span class="score-item">Paradox: <span class="score-item-value">${p.paradox <= 1 ? '+2' : (p.paradox >= 4 ? '-3' : '0')}</span></span>
                </div>
              </div>
              <div class="score-total">${p.points} PTS</div>
            </div>
          `;
      }).join('')}
      </div>

      <div style="display: flex; gap: var(--space-md); margin-top: var(--space-md);">
        <button id="btn-play-again" class="btn btn-primary">Play Another Shift</button>
        <button id="btn-back-menu" class="btn btn-secondary">Main Menu</button>
      </div>
    </div>
  `;

  document.querySelector('#btn-play-again')?.addEventListener('click', () => {
    sounds.portal();
    const configs = state.players.map(p => ({
      name: p.name,
      roleKey: p.roleKey,
      isLocal: p.isLocal
    }));
    engine = new GameEngine();
    network = new NetworkManager(engine);
    setupNetworkListeners();
    engine.subscribe((s) => {
      if (s?.gameOver && currentScreen === 'game') {
        currentScreen = 'endgame';
      }
      render();
    });
    engine.initGame(configs);
    sounds.startBgMusic();
    currentScreen = 'game';
    render();
  });

  document.querySelector('#btn-back-menu')?.addEventListener('click', () => {
    sounds.btnClick();
    currentScreen = 'title';
    render();
  });
}

// Background Music Auto-start on first user interaction (browser policy compliant)
const initAudioOnGesture = () => {
  sounds.init();
  sounds.startBgMusic();
  window.removeEventListener('click', initAudioOnGesture);
  window.removeEventListener('keydown', initAudioOnGesture);
  window.removeEventListener('touchstart', initAudioOnGesture);
};
window.addEventListener('click', initAudioOnGesture, { once: true });
window.addEventListener('keydown', initAudioOnGesture, { once: true });
window.addEventListener('touchstart', initAudioOnGesture, { once: true });

// Initial Render
render();
