// ===== PANAHON: CHRONO SHIFT - Game Engine =====

import {
  ERAS, ERA_ORDER, ERA_NAMES, TILE_TYPES, ERA_TILE_LAYOUTS, ERA_TILE_COORDINATES, getActiveTileLayouts, getActiveLoopTargets, getActivePathModes, getActivePathConnections, getActiveJunctionRules,
  ROLES, ROLE_ORDER, ARTIFACTS, ALL_ARTIFACTS, EVENT_CARDS, DANGER_CARDS,
  generateClueCards, generateMissions, GAME_CONSTANTS, SCORING, PLAYER_COLORS
} from './gameData.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

export function getNextTileIndex(player, era, currentIdx, dir = 1, total = 25) {
  const connections = (typeof getActivePathConnections === 'function') ? getActivePathConnections() : {};
  const junctionRules = (typeof getActiveJunctionRules === 'function') ? getActiveJunctionRules() : {};
  const eraConnections = connections[era];
  const eraRules = junctionRules[era] || {};
  const prev = player?.previousTileIndex;
   if (dir < 0) {
    if (eraConnections) {
      const incoming = [];
      for (const [sourceStr, targetArr] of Object.entries(eraConnections)) {
        if (Array.isArray(targetArr) && targetArr.includes(currentIdx)) {
          incoming.push(parseInt(sourceStr, 10));
        }
      }
      if (incoming.length > 0) {
        if (prev !== undefined && incoming.includes(prev)) {
          return prev;
        }
        return incoming[0];
      }
    }
    return (currentIdx - 1 + total) % total;
  }
   if (eraConnections) {
    const targets = eraConnections[currentIdx];
     // Fallback if no outgoing targets defined
    if (!Array.isArray(targets) || targets.length === 0) {
      return dir > 0 ? (currentIdx + 1) % total : (currentIdx - 1 + total) % total;
    }
     // If single target, strictly follow that single connection (authoritative map graph)
    if (targets.length === 1) {
      return targets[0];
    }
     // Multi-target junction:
    // 1. Explicit junction rule based on arrival space (currentIdx:prev)
    if (prev !== undefined && prev !== null) {
      const ruleKey = `${currentIdx}:${prev}`;
      const ruleTarget = eraRules[ruleKey];
      // Only accept the junction rule if its target is actually one of the node's valid outgoing targets
      if (ruleTarget !== undefined && targets.includes(ruleTarget)) {
        return ruleTarget;
      }
    }
     // 2. Filter out the space we just arrived from to avoid immediate U-turn unless no other choice
    let candidates = targets.filter(t => t !== prev);
    if (candidates.length === 0) candidates = targets;
     return candidates[0] !== undefined ? candidates[0] : targets[0];
  }
   if (dir > 0) {
    return (currentIdx + 1) % total;
  } else {
    return (currentIdx - 1 + total) % total;
  }
}



export class GameEngine {
  constructor() {
    this.state = null;
    this.listeners = [];
    this.logEntries = [];
    this.timerInterval = null;
  }

  // --- State Management ---
  subscribe(fn) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter(l => l !== fn); };
  }

  notify(eventType = 'state') {
    this.version = (this.version || 0) + 1;
    this.listeners.forEach(fn => fn(this.state, eventType));
  }

  getState() {
    return this.state;
  }

  loadState(newState) {
    if (!newState) return;
    this.state = newState;
    this.notify('remote_state');
  }

  // --- Initialize Game ---
  initGame(playerConfigs) {
    // playerConfigs: [{ name, roleKey, isLocal, connectionId }]
    const allClueCards = generateClueCards();
    const allMissions = shuffle(generateMissions());

    // Build per-era decks
    const clueDecks = {};
    const eventDecks = {};
    const dangerDecks = {};
    
    ERA_ORDER.forEach(era => {
      clueDecks[era] = shuffle(allClueCards.filter(c => c.era === era));
      eventDecks[era] = shuffle([...EVENT_CARDS[era]]);
      dangerDecks[era] = shuffle([...DANGER_CARDS[era]]);
    });

    // Build board: tiles per era
    const board = {};
    ERA_ORDER.forEach(era => {
      const layout = (getActiveTileLayouts() && getActiveTileLayouts()[era]) || ERA_TILE_LAYOUTS[era];
      board[era] = layout.map((type, idx) => ({
        id: `${era}_${idx}`,
        era,
        type,
        index: idx,
        trap: null,  // for Strategist traps
        players: []
      }));
    });

    // Guarantee every player in the match has a unique role
    const usedRoles = new Set();
    const sanitizedConfigs = playerConfigs.map((config, idx) => {
      let roleKey = config.roleKey;
      if (!roleKey || usedRoles.has(roleKey)) {
        roleKey = ROLE_ORDER.find(r => !usedRoles.has(r)) || ROLE_ORDER[idx % ROLE_ORDER.length];
      }
      usedRoles.add(roleKey);
      return {
        ...config,
        roleKey
      };
    });

    // Scatter players across eras randomly
    const shuffledEras = [...ERA_ORDER].sort(() => Math.random() - 0.5);
    while (shuffledEras.length < sanitizedConfigs.length) {
      shuffledEras.push(...[...ERA_ORDER].sort(() => Math.random() - 0.5));
    }

    // Create players
    const players = sanitizedConfigs.map((config, idx) => {
      const role = ROLES[config.roleKey];
      const mission = allMissions[idx];
      const startEra = shuffledEras[idx];
      // Find start tile in that era
      const startTileIdx = board[startEra].findIndex(t => t.type === TILE_TYPES.START);
      const tileIdx = startTileIdx >= 0 ? startTileIdx : 0;

      const player = {
        id: idx,
        name: config.name || `Player ${idx + 1}`,
        roleKey: config.roleKey,
        role: role,
        color: PLAYER_COLORS[idx],
        isLocal: config.isLocal !== false,
        isAi: config.isAi === true,
        aiDifficulty: config.aiDifficulty || 'normal',
        connectionId: config.connectionId || null,

        // Position
        currentEra: startEra,
        tileIndex: tileIdx,

        // Resources
        energy: GAME_CONSTANTS.STARTING_ENERGY,
        paradox: 0,
        points: 0,

        // Mission
        mission: mission,
        missionComplete: false,

        // Cards in hand
        clueCards: [],
        artifactCards: [],

        // Status
        shielded: false,
        skipNextTurn: false,
        timeStoppedBy: null,
        bonusMoves: 0,
        stranded: false,

        // Skill cooldowns (turns remaining)
        passiveCooldown: 0,
        activeCooldown: 0,
        reverseTimeCooldown: 0,
        temporalForesightCooldown: 0,
        hasUsedForesightThisTurn: false,
        shadowPocketsTriggered: [],
        usedAbilityThisTurn: false,

        // Clue tracking: how many clues collected per artifact
        clueProgress: {} // artifactId -> count
      };

      // Place player on board
      board[startEra][tileIdx].players.push(idx);

      return player;
    });

    this.state = {
      phase: 'rolling', // rolling, moving, action, cardResolution, ended
      currentPlayerIndex: 0,
      turnNumber: 1,
      players,
      board,
      clueDecks,
      eventDecks,
      dangerDecks,
      timelineMeter: 0,
      temporalOccurrence: 0, // turns remaining
      temporalOccurrenceId: null,
      temporalOccurrenceAnnounced: false,
      diceResult: null,
      totalMoves: 0,
      movesRemaining: 0,
      movementDirection: 'forward', // 'forward' | 'backward'
      momentumActive: false,
      momentumUsedMidTile: false,
      gameTimeRemaining: GAME_CONSTANTS.GAME_TIME_MINUTES * 60, // in seconds
      gameStarted: true,
      gameOver: false,
      winner: null,
      pendingModal: null,
      pendingChoice: null,
      hasCompletedIntro: false
    };

    this.logEntries = [];
    this.addLog('system', 'Game started! The timeline needs your help.');
    
    // Turn order will be finalized via Initiative Roll-Off
    this.addLog('system', `${players[0].name} is ready for initiative roll!`);

    this.startTimer();
    this.notify();
    return this.state;
  }

  setPlayerTurnOrder(orderedPlayers) {
    if (!this.state || !Array.isArray(orderedPlayers) || orderedPlayers.length === 0) return false;

    // Create an ID mapping: old player.id -> new index
    // Preserve full original in-memory player object so cards, mission, energy, isLocal are untouched
    const idMap = {};
    const newPlayers = orderedPlayers.map((p, newIdx) => {
      const orig = (this.state.players && this.state.players.find(curr => curr.name === p.name || curr.id === p.id)) || p;
      idMap[orig.id] = newIdx;
      return {
        ...orig,
        id: newIdx
      };
    });

    // Update board tiles to reflect new player IDs
    if (this.state.board) {
      Object.keys(this.state.board).forEach(eraKey => {
        const eraTiles = this.state.board[eraKey];
        if (Array.isArray(eraTiles)) {
          eraTiles.forEach(tile => {
            if (Array.isArray(tile.players)) {
              tile.players = tile.players.map(oldId => (idMap[oldId] !== undefined ? idMap[oldId] : oldId));
            }
            if (tile.trap && idMap[tile.trap.ownerId] !== undefined) {
              tile.trap.ownerId = idMap[tile.trap.ownerId];
            }
          });
        }
      });
    }

    this.state.players = newPlayers;
    this.state.currentPlayerIndex = 0;
    this.state.phase = 'rolling';
    this.state.diceResult = null;
    this.state.movesRemaining = 0;
    this.state.hasCompletedIntro = true;

    const firstPlayer = newPlayers[0];
    this.addLog('system', `🎲 Initiative resolved! Turn order: ${newPlayers.map((p, i) => `#${i + 1} ${p.name}`).join(' → ')}.`);
    this.addLog('system', `🏆 ${firstPlayer.name} takes the first turn!`);

    this.notify();
    return true;
  }

  // --- Timer ---
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.state || this.state.gameOver) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        return;
      }
      if (this.isPaused || this.state.isPaused) return;

      this.state.gameTimeRemaining--;
      if (this.state.gameTimeRemaining <= 0) {
        this.endGame('timeout');
      }
      this.notify('timer');
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  resetGame() {
    this.stopTimer();
    this.state = null;
    this.logEntries = [];
    this.notify('game_reset');
  }

  // --- Logging ---
  addLog(type, message) {
    this.logEntries.push({
      id: Date.now() + Math.random(),
      type,
      message,
      turn: this.state?.turnNumber || 0
    });
    if (this.logEntries.length > 100) this.logEntries.shift();
  }

  getLogs() {
    return this.logEntries;
  }

  // --- Current Player ---
  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayerIndex];
  }

  // --- Dice ---
  rollDice() {
    if (this.state.phase !== 'rolling' || this.state.gameOver) return null;

    const player = this.getCurrentPlayer();

    // Check skip turn: cannot roll die when turn is skipped!
    if (player.skipNextTurn) {
      this.addLog('warning', `⛔ ${player.name} cannot roll the die: turn is skipped due to Hazard Penalty!`);
      return null;
    }

    // Check 0 Energy: Cannot roll die when exhausted! Must rest to recover energy.
    if (player.energy <= 0) {
      player.stranded = true;
      this.addLog('warning', `⛔ ${player.name} is exhausted (0 Energy) and cannot roll the die! Must Rest to recover.`);
      return null;
    }

    const result = rollDie();
    this.state.diceResult = result;
    this.state.initialRoll = result;
    this.state.stepsTakenThisTurn = 0;
    this.state.hasMovedThisTurn = false;

    // Apply Momentum bonus if active
    const bonus = (this.state.momentumActive || player.roleKey === 'EXPLORER')
      ? (player.bonusMoves || (this.state.momentumActive ? 2 : 0))
      : (player.bonusMoves || 0);

    this.state.totalMoves = result + bonus;
    this.state.movesRemaining = result + bonus;
    this.state.movementDirection = 'forward';
    player.bonusMoves = 0;
    this.state.phase = 'moving';

    if (bonus > 0) {
      this.addLog('dice', `🎲 ${player.name} rolled a ${result} (+${bonus} Momentum Surge = ${result + bonus} Total Spaces)!`);
    } else {
      this.addLog('dice', `🎲 ${player.name} rolled a ${result}!`);
    }
    this.notify();
    return result;
  }

  // --- Movement ---
  moveToTile(targetTileId) {
    if (this.state.phase !== 'moving' || this.state.movesRemaining <= 0) return false;

    const player = this.getCurrentPlayer();
    const eraTiles = this.state.board[player.currentEra];
    const currentIdx = player.tileIndex;
    
    // Parse target
    const [targetEra, targetIdxStr] = targetTileId.split('_');
    const targetIdx = parseInt(targetIdxStr);

    // Check if target is in the same era
    if (targetEra !== player.currentEra) return false;
    
    // Strict direction constraint: strictly forward (+1) unless Reverse Time Ability is active (-1)
    const direction = this.state.movementDirection || 'forward';
    const dir = direction === 'backward' ? -1 : 1;
    const expectedNext = this.getNextTileIndex(player, targetEra, currentIdx, dir);
    if (targetIdx !== expectedNext) return false;

    // Move
    eraTiles[currentIdx].players = eraTiles[currentIdx].players.filter(id => id !== player.id);
    player.previousTileIndex = currentIdx;
    player.tileIndex = targetIdx;
    eraTiles[targetIdx].players.push(player.id);
    this.checkShadowPockets(player, targetIdx);
    this.state.movesRemaining--;
    this.state.stepsTakenThisTurn = (this.state.stepsTakenThisTurn || 0) + 1;
    this.state.hasMovedThisTurn = true;

    // Check tile interaction
    const tile = eraTiles[targetIdx];
    
    // Check for trap: Ensnare enemy player (planter is immune)
    if (tile.trap && !this.isTrapImmune(player, tile.trap)) {
      this.triggerTrap(player, tile);
      this.state.movesRemaining = 0;
      this.state.movementDirection = 'forward';
      this.state.momentumActive = false;
      this.state.momentumUsedMidTile = false;
      this.notify();
      return true;
    }

    // If artifact tile, player can choose to stop
    if (tile.type === TILE_TYPES.ARTIFACT && this.state.movesRemaining > 0) {
      // Player may stop for artifact
      this.state.pendingChoice = {
        type: 'artifactStop',
        title: 'Artifact Tile',
        message: 'You passed an Artifact Tile. Do you want to stop and investigate?',
        options: [
          { label: 'Stop & Investigate', action: 'stopForArtifact' },
          { label: 'Continue Moving', action: 'continueMoving' }
        ]
      };
      this.notify();
      return true;
    }

    // If time gate tile, player can choose to travel or continue
    if (tile.type === TILE_TYPES.TIMEGATE && this.state.movesRemaining > 0) {
      const cost = player.roleKey === 'EXPLORER' ? GAME_CONSTANTS.TIME_GATE_COST_EXPLORER : GAME_CONSTANTS.TIME_GATE_COST;
      const otherEras = ERA_ORDER.filter(e => e !== player.currentEra);
      const options = [];
      if (player.energy >= cost) {
        otherEras.forEach(era => {
          options.push({ label: `🌀 Warp to ${ERA_NAMES[era]} (-${cost} Energy)`, action: `warp_${era}` });
        });
      }
      options.push({ label: `➡️ Continue Moving (${this.state.movesRemaining} spaces left)`, action: 'continueMoving' });
      this.state.pendingChoice = {
        type: 'timeGatePass',
        title: 'Time Gate Portal!',
        message: player.energy >= cost
          ? `You came across a Time Gate! Warp to another era (Cost: ${cost} Energy) or continue with your remaining moves?`
          : `You came across a Time Gate, but need ${cost} Energy to warp (you have ${player.energy} Energy).`,
        options
      };
      this.notify();
      return true;
    }

    // If no more moves, resolve tile and reset direction
    if (this.state.movesRemaining <= 0) {
      this.state.movementDirection = 'forward';
      this.state.momentumActive = false;
      this.state.momentumUsedMidTile = false;
      this.resolveTile(player, tile);
    }

    this.notify();
    return true;
  }

  // Rogue Passive: Shadow Pockets
  checkShadowPockets(player, targetIdx) {
    if (player.roleKey !== 'ROGUE') return;
    const eraTiles = this.state.board[player.currentEra];
    const tile = eraTiles?.[targetIdx];
    if (!tile || !tile.players || tile.players.length === 0) return;

    if (!player.shadowPocketsTriggered) player.shadowPocketsTriggered = [];

    const otherPlayerIds = tile.players.filter(id => id !== player.id);
    for (const victimId of otherPlayerIds) {
      if (player.shadowPocketsTriggered.includes(victimId)) continue;
      
      const victim = this.state.players.find(p => p.id === victimId);
      if (!victim) continue;

      player.shadowPocketsTriggered.push(victimId);

      // Steal 1 Clue Card or 1 Energy (if available)
      if (victim.clueCards && victim.clueCards.length > 0) {
        const stolenCard = victim.clueCards.pop();
        if (stolenCard.artifactId && victim.clueProgress?.[stolenCard.artifactId] > 0) {
          victim.clueProgress[stolenCard.artifactId]--;
        }

        if (player.clueCards.length >= (GAME_CONSTANTS.MAX_CLUE_CARDS || 5)) {
          this.returnClueToDeck(stolenCard);
          this.addLog('ability', `🥷 Shadow Pockets: ${player.name} pickpocketed a Clue Card (${stolenCard.hint || stolenCard.description}) from ${victim.name}, but inventory was full so it dissolved back to timeline!`);
        } else {
          player.clueCards.push(stolenCard);
          if (stolenCard.artifactId && !stolenCard.isDecoy) {
            player.clueProgress[stolenCard.artifactId] = (player.clueProgress[stolenCard.artifactId] || 0) + 1;
          }
          this.addLog('ability', `🥷 Shadow Pockets: ${player.name} silently pickpocketed a Clue Card (${stolenCard.hint || stolenCard.description}) from ${victim.name}!`);
        }
      } else if (victim.energy > 0) {
        this.modifyEnergy(victim, -1);
        this.modifyEnergy(player, 1);
        this.addLog('ability', `🥷 Shadow Pockets: ${player.name} slipped past ${victim.name} and swiped 1 Chrono Energy!`);
      } else {
        this.addLog('ability', `🥷 Shadow Pockets: ${player.name} brushed past ${victim.name}, but their pockets were empty!`);
      }
    }
  }

  // Chronomancer Passive: Temporal Foresight
  adjustTemporalForesight(playerIdx, delta) {
    const player = this.state.players[playerIdx];
    if (this.state.currentPlayerIndex !== playerIdx) return false;
    if (this.state.phase !== 'moving' || (this.state.stepsTakenThisTurn || 0) > 0) {
      this.addLog('warning', 'Temporal Foresight can only be used right after rolling before taking any steps!');
      return false;
    }
    if (player.roleKey !== 'CHRONOMANCER') return false;
    if (player.temporalForesightCooldown > 0) {
      this.addLog('warning', `Temporal Foresight is on cooldown (${player.temporalForesightCooldown} turns left)!`);
      return false;
    }
    if (player.hasUsedForesightThisTurn) {
      this.addLog('warning', 'Temporal Foresight already used this turn!');
      return false;
    }
    if (delta !== 1 && delta !== -1) return false;

    const currentMoves = this.state.movesRemaining;
    const newMoves = currentMoves + delta;
    if (newMoves < 1 || newMoves > 6) {
      this.addLog('warning', 'Adjusted moves must remain strictly between 1 and 6 spaces!');
      return false;
    }

    const oldVal = currentMoves;
    this.state.movesRemaining = newMoves;
    if (this.state.diceResult) {
      this.state.diceResult += delta;
    }
    player.temporalForesightCooldown = 3;
    player.hasUsedForesightThisTurn = true;
    this.state.pendingModal = {
      type: 'abilityActivate',
      abilityKey: 'TEMPORAL_FORESIGHT',
      playerId: player.id,
      playerName: player.name,
      playerRole: 'The Chronomancer',
      playerAvatar: player.role?.avatar || 'assets/Characters/chronomancer_128x128.png',
      playerColor: player.color || '#1ABC9C',
      oldRoll: oldVal,
      newRoll: newMoves,
      delta: delta,
      title: '🔮 TEMPORAL FORESIGHT! 🔮',
      subtitle: 'CHRONOMANCER PASSIVE: DESTINY ALTERED',
      description: `${player.name} peered through timeline branches and altered probability (${delta > 0 ? '+1 Space' : '-1 Space'}), shifting trajectory to ${newMoves} spaces!`
    };

    this.addLog('ability', `⏳ Temporal Foresight: ${player.name} altered timeline probability (${delta > 0 ? '+1' : '-1'}), adjusting moves to ${newMoves} spaces!`);
    this.notify();
    return true;
  }

  // Determine next tile index using custom node-graph connections and approach routing rules
  getNextTileIndex(player, era, currentIdx, dir = 1) {
    const total = this.state?.board?.[era]?.length || 25;
    return getNextTileIndex(player, era, currentIdx, dir, total);
  }

  // Move forward/backward in the era path
  movePlayerStep() {
    if (this.state.phase !== 'moving' || this.state.movesRemaining <= 0) return false;

    const dir = this.state.movementDirection === 'backward' ? -1 : 1;
    const player = this.getCurrentPlayer();
    const eraTiles = this.state.board[player.currentEra];
    const currentIdx = player.tileIndex;

    const newIdx = this.getNextTileIndex(player, player.currentEra, currentIdx, dir);

    // Move
    eraTiles[currentIdx].players = eraTiles[currentIdx].players.filter(id => id !== player.id);
    player.previousTileIndex = currentIdx;
    player.tileIndex = newIdx;
    eraTiles[newIdx].players.push(player.id);
    this.checkShadowPockets(player, newIdx);
    this.state.movesRemaining--;
    this.state.stepsTakenThisTurn = (this.state.stepsTakenThisTurn || 0) + 1;
    this.state.hasMovedThisTurn = true;

    const tile = eraTiles[newIdx];

    // Check trap: Ensnare enemy player (planter is immune)
    if (tile.trap && !this.isTrapImmune(player, tile.trap)) {
      this.triggerTrap(player, tile);
      this.state.movesRemaining = 0;
      this.state.movementDirection = 'forward';
      this.notify();
      return true;
    }

    // Artifact stop option
    if (tile.type === TILE_TYPES.ARTIFACT && this.state.movesRemaining > 0) {
      this.state.pendingChoice = {
        type: 'artifactStop',
        title: 'Artifact Tile!',
        message: 'You landed on an Artifact Tile. Do you want to stop and investigate?',
        options: [
          { label: 'Stop & Investigate', action: 'stopForArtifact' },
          { label: 'Continue Moving', action: 'continueMoving' }
        ]
      };
      this.notify();
      return true;
    }

    // Time Gate passing option
    if (tile.type === TILE_TYPES.TIMEGATE && this.state.movesRemaining > 0) {
      const cost = player.roleKey === 'EXPLORER' ? GAME_CONSTANTS.TIME_GATE_COST_EXPLORER : GAME_CONSTANTS.TIME_GATE_COST;
      const otherEras = ERA_ORDER.filter(e => e !== player.currentEra);
      const options = [];
      if (player.energy >= cost) {
        otherEras.forEach(era => {
          options.push({ label: `🌀 Warp to ${ERA_NAMES[era]} (-${cost} Energy)`, action: `warp_${era}` });
        });
      }
      options.push({ label: `➡️ Continue Moving (${this.state.movesRemaining} spaces left)`, action: 'continueMoving' });
      this.state.pendingChoice = {
        type: 'timeGatePass',
        title: 'Time Gate Portal!',
        message: player.energy >= cost
          ? `You came across a Time Gate! Warp to another era (Cost: ${cost} Energy) or continue with your remaining moves?`
          : `You came across a Time Gate, but need ${cost} Energy to warp (you have ${player.energy} Energy).`,
        options
      };
      this.notify();
      return true;
    }

    // If no more moves, resolve
    if (this.state.movesRemaining <= 0) {
      this.state.movementDirection = 'forward';
      this.state.momentumActive = false;
      this.state.momentumUsedMidTile = false;
      this.resolveTile(player, tile);
    }

    this.notify();
    return true;
  }

  // Handle choice resolution
  resolveChoice(action) {
    if (!this.state.pendingChoice) return;

    const player = this.getCurrentPlayer();
    const choice = this.state.pendingChoice;
    const choiceType = choice.type;
    const returnPhase = choice.returnPhase || 'action';
    this.state.pendingChoice = null;

    if (choiceType === 'artifactStop') {
      if (action === 'stopForArtifact') {
        this.state.movesRemaining = 0;
        this.state.movementDirection = 'forward';
        this.state.momentumActive = false;
        this.state.momentumUsedMidTile = false;
        const tile = this.state.board[player.currentEra][player.tileIndex];
        this.resolveTile(player, tile);
      }
      // else continue moving
    } else if (choiceType === 'timeGatePass') {
      if (action && action.startsWith('warp_')) {
        const targetEra = action.replace('warp_', '');
        this.state.movesRemaining = 0;
        this.state.movementDirection = 'forward';
        this.state.momentumActive = false;
        this.state.momentumUsedMidTile = false;
        this.travelToEra(player, targetEra);
      } else {
        // Continue moving with remaining moves
        this.state.phase = 'moving';
      }
    } else if (choiceType === 'eventChoice') {
      if (action === 'drawClue') {
        this.drawClueCard(player);
      } else if (action === 'tradeClue') {
        this.addLog('event', `${player.name} can trade a Clue Card with another player.`);
      } else if (action === 'moveToTimeGate') {
        this.moveToNearestTimeGate(player);
      } else if (action === 'viewArtifact') {
        this.showEraArtifacts(player);
      }
      this.state.phase = 'action';
    } else if (choiceType === 'guardianRepair') {
      if (action === 'reduceEnergy') {
        this.modifyParadox(player, -1);
        this.modifyEnergy(player, -2);
        this.addLog('ability', `${player.name} used Temporal Repair: -1 Paradox, -2 Energy`);
      } else if (action === 'restoreEnergy') {
        this.modifyEnergy(player, 1);
        this.addLog('ability', `${player.name} used Temporal Repair: +1 Energy restored`);
      }
      player.usedAbilityThisTurn = true;
      player.activeCooldown = ROLES.GUARDIAN.active.cooldown;
      this.state.pendingModal = {
        type: 'abilityActivate',
        abilityKey: 'TEMPORAL_REPAIR',
        playerId: player.id,
        playerName: player.name,
        playerRole: 'The Guardian',
        playerAvatar: player.role?.avatar || 'assets/Characters/Copy of guardian.png',
        playerColor: player.color || '#2ECC71',
        mode: action,
        title: '✨ TEMPORAL REPAIR! ✨',
        subtitle: 'GUARDIAN ACTIVE ABILITY',
        description: action === 'reduceEnergy'
          ? `${player.name} focused chronal shields to mend temporal anomalies! Reduced Paradox by -1 in exchange for 2 Energy.`
          : `${player.name} channeled celestial resonance into their chrono-suit! Restored +1 Energy.`
      };
      this.state.phase = returnPhase;
    } else if (choiceType === 'historianDecipher') {
      const drawnCards = choice.drawnCards || [];
      const chosenIdx = parseInt(action.replace('pick_', ''), 10);
      const chosenCard = drawnCards[chosenIdx] || drawnCards[0];
      const remainingCards = drawnCards.filter((_, idx) => idx !== chosenIdx);

      // Return remaining cards to deck and reshuffle
      const deck = this.state.clueDecks[player.currentEra] || [];
      deck.push(...remainingCards);
      this.state.clueDecks[player.currentEra] = shuffle(deck);

      // Award chosen card to player
      if (chosenCard && chosenCard.isDecoy && player.roleKey === 'HISTORIAN' && player.passiveCooldown <= 0) {
        this.addLog('ability', `🛡️ ${player.name} drew a Decoy Card via Clue Decipher, but safely neutralized it with Decoy Discard!`);
        player.passiveCooldown = ROLES.HISTORIAN.passive.cooldown;
        this.returnClueToDeck(chosenCard);
        this.state.pendingModal = {
          type: 'abilityActivate',
          abilityKey: 'DECOY_DISCARD',
          playerId: player.id,
          playerName: player.name,
          playerRole: 'The Historian',
          playerAvatar: player.role?.avatar || 'assets/Characters/Copy of librarian.png',
          playerColor: player.color || '#E74C3C',
          title: '📜 DECOY SAFELY NEUTRALIZED! 📜',
          subtitle: 'HISTORIAN PASSIVE: DECOY DISCARD',
          description: `${player.name} drew a deceptive Decoy Card via Clue Decipher, but scholarly mastery safely purged it back into the deck!`
        };
        this.state.phase = returnPhase;
      } else if (chosenCard) {
        if (player.clueCards.length >= (GAME_CONSTANTS.MAX_CLUE_CARDS || 5)) {
          this.promptClueHandLimit(player, chosenCard, returnPhase);
          return;
        } else {
          player.clueCards.push(chosenCard);
          if (!chosenCard.isDecoy && chosenCard.artifactId) {
            if (!player.clueProgress[chosenCard.artifactId]) {
              player.clueProgress[chosenCard.artifactId] = 0;
            }
            player.clueProgress[chosenCard.artifactId]++;
          }
          const cardDesc = chosenCard.isDecoy ? 'Decoy Card' : (chosenCard.artifactName ? `${chosenCard.artifactName} Clue` : (chosenCard.hint || 'Mystery Clue'));
          this.addLog('clue', `📜 ${player.name} deciphered and placed into hand: ${cardDesc}! (${player.clueCards.length}/5 Clues held)`);
          this.state.phase = returnPhase;
        }
      }
    } else if (choiceType === 'roguePickpocket') {
      if (action.startsWith('steal_clue_')) {
        const victimId = parseInt(action.replace('steal_clue_', ''), 10);
        const victim = this.state.players.find(p => p.id === victimId);
        if (victim && victim.clueCards && victim.clueCards.length > 0) {
          const stolenCard = victim.clueCards.pop();
          if (stolenCard.artifactId && victim.clueProgress?.[stolenCard.artifactId] > 0) {
            victim.clueProgress[stolenCard.artifactId]--;
          }
          if (player.clueCards.length >= (GAME_CONSTANTS.MAX_CLUE_CARDS || 5)) {
            this.promptClueHandLimit(player, stolenCard, returnPhase);
            return;
          } else {
            player.clueCards.push(stolenCard);
            if (stolenCard.artifactId && !stolenCard.isDecoy) {
              player.clueProgress[stolenCard.artifactId] = (player.clueProgress[stolenCard.artifactId] || 0) + 1;
            }
            this.state.pendingModal = {
              type: 'abilityActivate',
              abilityKey: 'PICKPOCKET',
              playerId: player.id,
              playerName: player.name,
              playerRole: 'The Rogue',
              playerAvatar: player.role?.avatar || 'assets/Characters/rogue_128x128.png',
              playerColor: player.color || '#9B59B6',
              victimId: victim.id,
              victimName: victim.name,
              victimAvatar: victim.role?.avatar,
              victimColor: victim.color,
              stolenType: 'clue',
              stolenCardName: stolenCard.hint || stolenCard.description || 'Clue Card',
              stolenAmount: 1,
              title: '🗡️ SHADOW PICKPOCKET! 🗡️',
              subtitle: 'ROGUE ACTIVE ABILITY',
              description: `${player.name} emerged from the shadows and swiped a secret Clue Card (${stolenCard.hint || stolenCard.description}) from ${victim.name}!`
            };
            this.addLog('ability', `🗡️ Pickpocket Success: ${player.name} swiped a Clue Card (${stolenCard.hint || stolenCard.description}) from ${victim.name}!`);
          }
        }
      } else if (action.startsWith('steal_energy_')) {
        const victimId = parseInt(action.replace('steal_energy_', ''), 10);
        const victim = this.state.players.find(p => p.id === victimId);
        if (victim && victim.energy > 0) {
          const amount = Math.min(2, victim.energy);
          this.modifyEnergy(victim, -amount);
          this.modifyEnergy(player, amount);
          this.state.pendingModal = {
            type: 'abilityActivate',
            abilityKey: 'PICKPOCKET',
            playerId: player.id,
            playerName: player.name,
            playerRole: 'The Rogue',
            playerAvatar: player.role?.avatar || 'assets/Characters/rogue_128x128.png',
            playerColor: player.color || '#9B59B6',
            victimId: victim.id,
            victimName: victim.name,
            victimAvatar: victim.role?.avatar,
            victimColor: victim.color,
            stolenType: 'energy',
            stolenAmount: amount,
            title: '🗡️ SHADOW PICKPOCKET! 🗡️',
            subtitle: 'ROGUE ACTIVE ABILITY',
            description: `${player.name} struck from the shadows, siphoning ${amount} Chrono Energy from ${victim.name}!`
          };
          this.addLog('ability', `🗡️ Pickpocket Success: ${player.name} siphoned ${amount} Chrono Energy from ${victim.name}!`);
        }
      }
      this.state.phase = returnPhase;
    } else if (choiceType === 'chronomancerTimeStop') {
      if (action.startsWith('freeze_')) {
        const victimId = parseInt(action.replace('freeze_', ''), 10);
        const victim = this.state.players.find(p => p.id === victimId);
        if (victim) {
          victim.skipNextTurn = true;
          victim.timeStoppedBy = {
            id: player.id,
            name: player.name,
            roleKey: player.roleKey,
            roleName: player.role?.name || 'Chronomancer',
            avatar: player.role?.avatar || 'assets/Characters/chronomancer_128x128.png',
            color: player.color || '#22D3EE'
          };
          this.state.pendingModal = {
            type: 'timeStop',
            playerId: victim.id,
            victimId: victim.id,
            victimName: victim.name,
            victimAvatar: victim.role?.avatar || 'assets/Characters/adventurer_128x128.png',
            victimRole: victim.role?.name || victim.roleKey || 'Operative',
            victimColor: victim.color || '#FDA4AF',
            casterId: player.id,
            casterName: player.name,
            casterRole: player.role?.name || 'Chronomancer',
            casterAvatar: player.role?.avatar || 'assets/Characters/chronomancer_128x128.png',
            casterColor: player.color || '#22D3EE',
            title: '⌛ TEMPORAL STASIS (TIME STOP)!',
            description: `${victim.name} was caught in Chronomancer ${player.name}'s Temporal Stasis field! Time has completely frozen around them—their upcoming turn will be skipped!`
          };
          this.addLog('ability', `⌛ TIME STOP! ${player.name} trapped ${victim.name} in temporal stasis! Their next turn will be skipped!`);
        }
      }
      this.state.phase = returnPhase;
    } else if (choiceType === 'clueHandLimit') {
      const drawnCard = choice.drawnCard;

      if (action === 'discard_drawn') {
        this.returnClueToDeck(drawnCard);
        this.addLog('card', `${player.name} discarded the drawn Clue Card (${drawnCard.hint || drawnCard.description}) back to the ${ERA_NAMES[drawnCard.era]} deck.`);
      } else if (action && action.startsWith('discard_hand_')) {
        const discardIdx = parseInt(action.replace('discard_hand_', ''), 10);
        if (discardIdx >= 0 && discardIdx < player.clueCards.length) {
          const [discardedCard] = player.clueCards.splice(discardIdx, 1);

          // Adjust clue progress if real clue was discarded
          if (!discardedCard.isDecoy && discardedCard.artifactId) {
            if (player.clueProgress[discardedCard.artifactId] > 0) {
              player.clueProgress[discardedCard.artifactId]--;
            }
          }
          this.returnClueToDeck(discardedCard);

          // Add newly drawn card to hand
          player.clueCards.push(drawnCard);
          if (!drawnCard.isDecoy && drawnCard.artifactId) {
            if (!player.clueProgress[drawnCard.artifactId]) {
              player.clueProgress[drawnCard.artifactId] = 0;
            }
            player.clueProgress[drawnCard.artifactId]++;
          }

          this.addLog('card', `${player.name} kept the new Clue Card (${drawnCard.hint || drawnCard.description}) and returned ${discardedCard.hint || discardedCard.description} to the ${ERA_NAMES[discardedCard.era]} deck.`);
        }
      }

      this.state.phase = returnPhase;
    } else if (choiceType === 'timeGateTravel') {
      if (action && action !== 'stay') {
        this.travelToEra(player, action);
      } else {
        this.state.phase = 'action';
      }
    } else if (choiceType === 'teleportTile') {
      const targetEra = choice.targetEra || ERAS.MYTH;
      const targetTiles = this.state.board[targetEra];
      const targetIdx = parseInt(action.replace('teleport_', ''), 10);
      const targetTile = targetTiles && targetTiles[targetIdx] ? targetTiles[targetIdx] : null;

      if (targetTile) {
        // Remove player from current tile
        const currentTiles = this.state.board[player.currentEra];
        if (currentTiles && currentTiles[player.tileIndex]) {
          currentTiles[player.tileIndex].players = currentTiles[player.tileIndex].players.filter(id => id !== player.id);
        }

        // Warp player to target era & tile
        player.currentEra = targetEra;
        player.tileIndex = targetTile.index;
        targetTile.players.push(player.id);
        this.state.currentEra = targetEra;

        this.addLog('travel', `✨ ${player.name} teleported to Space #${targetTile.index + 1} (${targetTile.type.toUpperCase()}) in ${ERA_NAMES[targetEra]} via Anito Guidance!`);

        // Check for enemy trap (planter is immune)
        if (targetTile.trap && !this.isTrapImmune(player, targetTile.trap)) {
          this.triggerTrap(player, targetTile);
          return;
        }

        // Resolve landing on destination tile
        this.resolveTile(player, targetTile);
        return;
      } else {
        this.state.phase = 'action';
      }
    }

    this.notify();
  }

  // Return a discarded/evicted clue card back to its era clue deck and shuffle
  returnClueToDeck(card) {
    if (!card) return;
    const era = card.era || this.getCurrentPlayer()?.currentEra || "spanish";
    if (!this.state.clueDecks[era]) {
      this.state.clueDecks[era] = [];
    }
    // Prevent duplicate object entry
    this.state.clueDecks[era].push(card);
    this.state.clueDecks[era] = shuffle(this.state.clueDecks[era]);
  }

  // Present Choice Modal when player reaches Clue Hand Limit (Max 5)
  promptClueHandLimit(player, card, returnPhase = "action") {
    const eraName = ERA_NAMES[card.era] || card.era;
    const cardName = card.isDecoy ? "Decoy Card" : (card.hint || card.description || "Clue Card");

    const options = [
      {
        label: `❌ Discard Drawn Card (${cardName}) ➔ Return to ${eraName} Pool`,
        action: "discard_drawn",
        type: "danger"
      },
      ...player.clueCards.map((handCard, idx) => ({
        label: `🔄 Keep Drawn Card & Discard #${idx + 1}: ${handCard.hint || handCard.description} (${ERA_NAMES[handCard.era] || handCard.era})`,
        action: `discard_hand_${idx}`,
        handIndex: idx,
        card: handCard
      }))
    ];

    this.state.pendingChoice = {
      type: "clueHandLimit",
      playerId: player.id,
      returnPhase: returnPhase,
      drawnCard: card,
      handCards: [...player.clueCards],
      title: "🎴 Clue Hand Limit Reached (Max 5)!",
      message: `You already hold 5 Clue Cards! You drew: "${cardName}". Choose whether to discard it or keep it and discard 1 card from your hand.`,
      options
    };

    this.addLog("card", `${player.name} drew a Clue Card (${cardName}), but hand is full (5/5). Choosing which card to keep...`);
    this.notify();
  }

  // --- Tile Resolution ---
  resolveTile(player, tile) {
    // If landing on an armed enemy trap, trigger it immediately (planter is immune)
    if (tile.trap && !this.isTrapImmune(player, tile.trap)) {
      this.triggerTrap(player, tile);
      return;
    }

    this.state.phase = 'cardResolution';

    switch (tile.type) {
      case TILE_TYPES.CLUE:
        this.drawClueCard(player);
        break;
      case TILE_TYPES.EVENT:
        this.drawEventCard(player);
        break;
      case TILE_TYPES.DANGER:
        this.drawDangerCard(player);
        break;
      case TILE_TYPES.ARTIFACT:
        this.handleArtifactTile(player);
        break;
      case TILE_TYPES.TIMEGATE:
        this.handleTimeGate(player);
        break;
      case TILE_TYPES.PARADOX:
        this.handleParadoxTile(player);
        break;
      default:
        this.state.phase = 'action';
        break;
    }

    this.notify();
  }

  // --- Card Drawing ---
  drawClueCard(player) {
    let era = player.currentEra;

    // Temporal Occurrence: draw from random era
    if (this.state.temporalOccurrence > 0) {
      era = ERA_ORDER[Math.floor(Math.random() * ERA_ORDER.length)];
      this.addLog('temporal', `Temporal Occurrence! Drawing from ${ERA_NAMES[era]} instead!`);
    }

    const deck = this.state.clueDecks[era];
    if (deck.length === 0) {
      this.addLog('system', 'No more clue cards in this era!');
      this.state.phase = 'action';
      return;
    }

    const card = deck.shift();

    // Historian passive: discard decoy
    if (card.isDecoy && player.roleKey === 'HISTORIAN' && player.passiveCooldown <= 0) {
      this.addLog('ability', `${player.name} used Decoy Discard! Discarded a decoy card.`);
      player.passiveCooldown = ROLES.HISTORIAN.passive.cooldown;
      this.returnClueToDeck(card);
      this.state.pendingModal = {
        type: 'abilityActivate',
        abilityKey: 'DECOY_DISCARD',
        playerId: player.id,
        playerName: player.name,
        playerRole: 'The Historian',
        playerAvatar: player.role?.avatar || 'assets/Characters/Copy of librarian.png',
        playerColor: player.color || '#E74C3C',
        title: '📜 DECOY SAFELY NEUTRALIZED! 📜',
        subtitle: 'HISTORIAN PASSIVE: DECOY DISCARD',
        description: `${player.name} excavated a deceptive Decoy Card (${card.hint || card.description}), but ancient scholarly mastery safely purged it back into the ${ERA_NAMES[card.era] || 'timeline'} deck!`
      };
      this.state.phase = 'action';
      this.notify();
      return;
    }

    // Check Hand Limit (Max 5 Clue Cards)
    if (player.clueCards.length >= (GAME_CONSTANTS.MAX_CLUE_CARDS || 5)) {
      this.promptClueHandLimit(player, card, 'action');
      return;
    }

    player.clueCards.push(card);

    if (!card.isDecoy && card.artifactId) {
      if (!player.clueProgress[card.artifactId]) {
        player.clueProgress[card.artifactId] = 0;
      }
      player.clueProgress[card.artifactId]++;
    }

    this.state.pendingModal = {
      type: 'card',
      playerId: player.id,
      playerName: player.name,
      isClue: true,
      cardType: card.isDecoy ? 'Decoy Anomaly' : 'Clue Card',
      title: card.isDecoy ? 'Decoy Anomaly!' : 'Historical Clue Found!',
      description: card.description,
      hint: card.hint,
      image: card.image,
      era: era,
      isDecoy: card.isDecoy,
      artifactId: card.artifactId,
      artifactName: card.artifactName,
      clueCount: player.clueCards.length,
      maxClues: GAME_CONSTANTS.MAX_CLUE_CARDS || 5,
      artifactProgress: card.artifactId ? (player.clueProgress?.[card.artifactId] || 1) : 0
    };

    this.addLog('card', `${player.name} drew a Clue Card from ${ERA_NAMES[era]}. (${player.clueCards.length}/5 Clues held)`);
    this.state.phase = 'action';
    this.notify();
  }

  drawEventCard(player) {
    let era = player.currentEra;

    if (this.state.temporalOccurrence > 0) {
      era = ERA_ORDER[Math.floor(Math.random() * ERA_ORDER.length)];
      this.addLog('temporal', `Temporal Occurrence! Drawing from ${ERA_NAMES[era]} instead!`);
    }

    const deck = this.state.eventDecks[era];
    if (deck.length === 0) {
      // Reshuffle
      this.state.eventDecks[era] = shuffle([...EVENT_CARDS[era]]);
      this.addLog('system', `Event deck reshuffled for ${ERA_NAMES[era]}.`);
    }

    const card = this.state.eventDecks[era].shift();
    if (!card) {
      this.state.phase = 'action';
      return;
    }

    const result = card.effect(player, this);

    this.state.pendingModal = {
      type: 'event',
      cardType: 'Chronal Timeline Event',
      cardId: card.id,
      title: card.name,
      description: card.description,
      resultText: result,
      image: card.image,
      era: era,
      playerId: player.id,
      playerName: player.name
    };
    this.addLog('event', `${player.name}: ${card.name} — ${result}`);
    if (!this.state.pendingChoice) {
      this.state.phase = 'action';
    }
    this.notify();
  }

  drawDangerCard(player) {
    // Check shield
    if (player.shielded) {
      player.shielded = false;
      this.addLog('shield', `${player.name}'s shield blocked the danger!`);
      this.state.phase = 'action';
      this.notify();
      return;
    }

    let era = player.currentEra;
    if (this.state.temporalOccurrence > 0) {
      era = ERA_ORDER[Math.floor(Math.random() * ERA_ORDER.length)];
      this.addLog('temporal', `Temporal Occurrence! Drawing from ${ERA_NAMES[era]} instead!`);
    }

    const deck = this.state.dangerDecks[era];
    if (deck.length === 0) {
      this.state.dangerDecks[era] = shuffle([...DANGER_CARDS[era]]);
    }

    const card = this.state.dangerDecks[era].shift();
    if (!card) {
      this.state.phase = 'action';
      return;
    }

    // Danger card requires interactive die roll by player for immersion
    this.state.pendingModal = {
      type: 'danger',
      cardType: 'Hazard Anomaly',
      cardId: card.id,
      title: `${card.name} (${card.nickname})`,
      cardName: card.name,
      cardNickname: card.nickname,
      description: card.description,
      image: card.image,
      era: era,
      playerId: player.id,
      playerName: player.name,
      needsRoll: true,
      diceRoll: null,
      success: null,
      successMsg: card.successMsg,
      failMsg: card.failMsg
    };

    this.addLog('danger', `${player.name} triggered ${card.name}! Survival check: ${card.description}`);
    this.state.phase = 'action';
    this.notify();
  }

  // --- Interactive Danger Die Roll ---
  rollDangerDie(playerIdx) {
    const modal = this.state.pendingModal;
    if (!modal || modal.type !== 'danger' || !modal.needsRoll) {
      return null;
    }

    const targetIdx = playerIdx !== undefined ? playerIdx : (modal.playerId !== undefined ? modal.playerId : this.state.currentPlayerIndex);
    const player = this.state.players[targetIdx];
    if (!player) return null;

    const card = DANGER_CARDS[modal.era]?.find(c => c.id === modal.cardId) ||
                 DANGER_CARDS[player.currentEra]?.find(c => c.id === modal.cardId);
    if (!card) return null;

    const diceRoll = rollDie();
    const success = typeof card.check === 'function' ? card.check(diceRoll) : true;

    // Guardian passive: reduce penalty by 1
    let guardianReduction = false;
    if (!success && player.roleKey === 'GUARDIAN') {
      guardianReduction = true;
    }

    const updatedModal = {
      ...modal,
      needsRoll: false,
      diceRoll: diceRoll,
      success: success,
      guardianReduction: guardianReduction,
      failMsg: card.failMsg + (guardianReduction ? ' (Guardian: penalty reduced by 1)' : '')
    };
    this.state.pendingModal = updatedModal;

    if (success) {
      this.addLog('danger', `${player.name}: ${card.name} — Rolled ${diceRoll}! ${card.successMsg}`);
    } else {
      if (typeof card.failEffect === 'function') {
        card.failEffect(player, this);
      }
      this.addLog('danger', `${player.name}: ${card.name} — Rolled ${diceRoll}! ${card.failMsg}`);
    }

    this.notify();
    return { diceRoll, success };
  }

  // --- Artifact Handling ---
  handleArtifactTile(player) {
    const eraArtifacts = ARTIFACTS[player.currentEra] || [];

    // Filter artifacts player has >= 3 clues for, excluding already held or already completed mission relics
    const eligibleArtifacts = eraArtifacts.filter(artifact => {
      // Don't re-acquire an artifact already held in player hand
      if (player.artifactCards.some(a => a.id === artifact.id)) return false;
      // Don't re-acquire an artifact if its mission is already finished
      if (player.missionComplete && player.mission?.artifactId === artifact.id) return false;
      const clueCount = player.clueProgress[artifact.id] || 0;
      return clueCount >= GAME_CONSTANTS.REQUIRED_CLUES_FOR_ARTIFACT;
    });

    if (eligibleArtifacts.length === 0) {
      // Check if player already holds an artifact from this era
      const alreadyHeld = player.artifactCards.find(a => a.era === player.currentEra);
      if (alreadyHeld) {
        this.state.pendingModal = {
          type: 'info',
          title: 'Artifact Tile',
          description: `You are already carrying the ${alreadyHeld.nickname}! Use the "Return Relic" action in your dashboard to return it to this timeline.`,
          image: alreadyHeld.cardImage || alreadyHeld.image
        };
        this.addLog('artifact', `${player.name} visited the Artifact Tile while already holding ${alreadyHeld.nickname}.`);
      } else {
        this.state.pendingModal = {
          type: 'info',
          title: 'Artifact Tile',
          description: `You need at least ${GAME_CONSTANTS.REQUIRED_CLUES_FOR_ARTIFACT} clues related to an artifact before you can acquire it. Keep exploring!`,
          image: null
        };
        this.addLog('artifact', `${player.name} investigated the Artifact Tile but lacks enough clues.`);
      }
    } else {
      // Prioritize player's mission artifact if eligible
      const missionArtifact = eligibleArtifacts.find(a => player.mission && player.mission.artifactId === a.id);
      const chosen = missionArtifact || eligibleArtifacts[0];
      player.artifactCards.push(chosen);

      this.state.pendingModal = {
        type: 'artifact',
        cardType: 'Artifact Acquired! 📦',
        title: chosen.name,
        description: `You acquired the ${chosen.nickname}! Return it to the ${ERA_NAMES[chosen.era]} using "Return Relic" to complete your mission.`,
        image: chosen.cardImage || chosen.image
      };

      if (player.mission && player.mission.artifactId === chosen.id) {
        this.addLog('mission', `${player.name} acquired their mission artifact: ${chosen.nickname}!`);
      } else {
        this.addLog('artifact', `${player.name} acquired: ${chosen.nickname}`);
      }
    }

    this.state.phase = 'action';
    this.notify();
  }

  // --- Time Gate ---
  handleTimeGate(player) {
    const cost = player.roleKey === 'EXPLORER' ? GAME_CONSTANTS.TIME_GATE_COST_EXPLORER : GAME_CONSTANTS.TIME_GATE_COST;
    
    if (player.energy < cost) {
      this.state.pendingModal = {
        type: 'info',
        title: 'Time Gate',
        description: `Not enough Energy to travel! Need ${cost} Energy (you have ${player.energy}).`,
        image: null
      };
      this.state.phase = 'action';
      this.notify();
      return;
    }

    // Show era selection
    const otherEras = ERA_ORDER.filter(e => e !== player.currentEra);
    this.state.pendingChoice = {
      type: 'timeGateTravel',
      title: 'Time Gate Travel',
      message: `Choose a timeline to travel to (Cost: ${cost} Energy)`,
      options: [
        ...otherEras.map(era => ({
          label: `🌀 Warp to ${ERA_NAMES[era]}`,
          action: era
        })),
        { label: 'Stay in Current Era', action: 'stay' }
      ]
    };

    this.notify();
  }

  travelToEra(player, targetEra) {
    const cost = player.roleKey === 'EXPLORER' ? GAME_CONSTANTS.TIME_GATE_COST_EXPLORER : GAME_CONSTANTS.TIME_GATE_COST;
    
    // Remove from current tile
    const currentTiles = this.state.board[player.currentEra];
    currentTiles[player.tileIndex].players = currentTiles[player.tileIndex].players.filter(id => id !== player.id);

    // Move to target era's time gate or start
    const targetTiles = this.state.board[targetEra];
    let targetIdx = targetTiles.findIndex(t => t.type === TILE_TYPES.TIMEGATE);
    if (targetIdx < 0) targetIdx = targetTiles.findIndex(t => t.type === TILE_TYPES.START);
    if (targetIdx < 0) targetIdx = 0;

    player.currentEra = targetEra;
    player.tileIndex = targetIdx;
    targetTiles[targetIdx].players.push(player.id);
    this.modifyEnergy(player, -cost);

    this.addLog('travel', `${player.name} traveled to ${ERA_NAMES[targetEra]}! (-${cost} Energy)`);
    this.state.phase = 'action';
    this.state.pendingChoice = null;
    this.notify();
  }

  // --- Paradox Tile ---
  handleParadoxTile(player) {
    const outcome = this.modifyParadox(player, 1, true);
    const { oldParadox, newParadox, triggeredDanger, criticalOverload } = outcome;

    let consequenceDesc = 'A localized temporal fracture distorts causality! The timeline strain increases (+1 Paradox).';
    if (criticalOverload) {
      consequenceDesc = 'CRITICAL TEMPORAL BREACH! Spacetime stability shattered (5/5): Global Timeline +2, -3 Points, Paradox reset to Level 2.';
    } else if (triggeredDanger) {
      consequenceDesc = 'TIMELINE DESTABILIZATION! Paradox reached Level 4—causality is unraveling! A Hazard Anomaly strikes!';
    } else if (newParadox >= 3 && oldParadox < 3) {
      consequenceDesc = 'TEMPORAL DRAIN! Paradox reached Level 3—chronal friction drained -1 Energy!';
    } else if (newParadox >= 2 && oldParadox < 2) {
      consequenceDesc = 'CAUSAL DISCORD! Paradox reached Level 2—timeline instability cost -1 Victory Point!';
    }

    this.state.pendingModal = {
      type: 'paradox',
      cardType: '🌀 TEMPORAL PARADOX NODE 🌀',
      title: 'Paradox Zone Breach!',
      description: consequenceDesc,
      playerId: player.id,
      playerName: player.name,
      oldParadox: oldParadox,
      newParadox: newParadox,
      maxParadox: GAME_CONSTANTS.MAX_PARADOX || 5,
      triggeredDanger: triggeredDanger,
      triggerDangerPlayerId: triggeredDanger ? player.id : undefined,
      criticalOverload: criticalOverload,
      era: player.currentEra,
      tileIndex: player.tileIndex,
      image: '/assets/Tiles/paradox_tile.png'
    };

    this.addLog('paradox', `🌀 ${player.name} entered a Paradox Zone in ${ERA_NAMES[player.currentEra]}! Paradox: ${oldParadox} ➔ ${newParadox}.`);
    this.state.phase = 'cardResolution';
    this.notify();
  }

  // --- Trap Immunity & Execution ---
  isTrapImmune(player, trap) {
    if (!trap || !player) return true;
    if (trap.ownerId !== undefined && (player.id === trap.ownerId || String(player.id) === String(trap.ownerId))) {
      return true;
    }
    if (trap.ownerName && player.name === trap.ownerName) {
      return true;
    }
    if (player.roleKey === 'STRATEGIST' && (!trap.ownerRole || trap.ownerRole === 'STRATEGIST')) {
      return true;
    }
    return false;
  }

  triggerTrap(player, tile) {
    if (!tile.trap) return;
    const trap = tile.trap;
    tile.trap = null;

    // Find the trap owner (the Strategist who planted it)
    const trapOwner = this.state.players.find(
      p => p.id === trap.ownerId ||
           String(p.id) === String(trap.ownerId) ||
           (trap.ownerName && p.name === trap.ownerName) ||
           p.roleKey === 'STRATEGIST'
    ) || this.state.players[trap.ownerId];

    const ownerName = trapOwner ? trapOwner.name : 'The Strategist';
    this.addLog('trap', `🕸️ ${player.name} landed on ${ownerName}'s Temporal Trap!`);

    // Strategist passive: +1 energy to trap owner
    if (trapOwner) {
      this.modifyEnergy(trapOwner, 1);
      this.addLog('ability', `⚡ ${trapOwner.name} gained +1 Energy from Trap Mastery! (Now: ${trapOwner.energy}/${GAME_CONSTANTS.MAX_ENERGY})`);
    }

    // Draw a danger card as penalty
    this.drawDangerCard(player);
    this.notify();
  }

  // --- Resource Modification ---
  modifyEnergy(player, amount) {
    const prevEnergy = player.energy;
    player.energy = Math.max(0, Math.min(GAME_CONSTANTS.MAX_ENERGY, player.energy + amount));
    if (player.energy <= 0) {
      player.stranded = true;
      if (prevEnergy > 0) {
        this.modifyParadox(player, 1);
        this.addLog('paradox', `⚠️ ${player.name} reached 0 Energy (Exhaustion)! Suffered +1 Paradox.`);
      } else {
        this.addLog('warning', `${player.name} has 0 Energy (Exhausted)! Must Rest to recover.`);
      }
    } else {
      player.stranded = false;
    }
  }

  modifyParadox(player, amount, skipDangerModal = false) {
    const oldParadox = player.paradox;
    player.paradox = Math.max(0, Math.min(GAME_CONSTANTS.MAX_PARADOX, player.paradox + amount));

    let triggeredDanger = false;
    let criticalOverload = false;

    // Check paradox level effects
    if (player.paradox >= 2 && oldParadox < 2) {
      player.points -= 1;
      this.addLog('paradox', `${player.name}: Paradox Level 2 — Lost 1 Point!`);
    }
    if (player.paradox >= 3 && oldParadox < 3) {
      this.modifyEnergy(player, -1);
      this.addLog('paradox', `${player.name}: Paradox Level 3 — Lost 1 Energy!`);
    }
    if (player.paradox >= 4 && oldParadox < 4) {
      triggeredDanger = true;
      this.addLog('paradox', `${player.name}: Paradox Level 4 — Must draw a Danger Card!`);
      if (!skipDangerModal) {
        this.drawDangerCard(player);
      }
    }
    if (player.paradox >= 5) {
      criticalOverload = true;
      this.modifyTimelineMeter(2);
      player.points -= 3;
      player.paradox = 2;
      this.addLog('paradox', `${player.name}: CRITICAL BREACH! Timeline +2, -3 Points, Paradox reset to 2!`);
    }

    return { oldParadox, newParadox: player.paradox, triggeredDanger, criticalOverload };
  }

  modifyTimelineMeter(amount) {
    this.state.timelineMeter = Math.max(0, this.state.timelineMeter + amount);
    
    // Global timeline meter limit is 5. Once it reaches 6 or goes above 5, game over!
    if (this.state.timelineMeter > (GAME_CONSTANTS.MAX_TIMELINE || 5)) {
      this.state.collapseMessage = 'The timelines are completely messed up! The temporal breach exceeded stability limits (above 5), causing catastrophic spacetime collapse.';
      this.addLog('paradox', `💥 CATASTROPHIC BREACH! The timeline reached ${this.state.timelineMeter} (exceeded 5)! The timelines are completely messed up!`);
      this.endGame('collapse');
    }
  }

  // --- Temporal Occurrence ---
  activateTemporalOccurrence(turns) {
    const occurrenceId = `occ_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    this.state.temporalOccurrence = turns * this.state.players.length; // rounds = turns * players
    this.state.temporalOccurrenceId = occurrenceId;
    this.state.temporalOccurrenceAnnounced = false;
    this.state.temporalOccurrenceRounds = turns;
    this.state.temporalOccurrenceInitialTurns = turns * this.state.players.length;
    this.addLog('temporal', `Temporal Occurrence activated for ${turns} rounds!`);
  }

  markTemporalOccurrenceAnnounced(id) {
    if (this.state) {
      if (!id || this.state.temporalOccurrenceId === id) {
        this.state.temporalOccurrenceAnnounced = true;
      }
    }
  }

  // --- Abilities ---
  useActiveAbility(playerIdx) {
    const player = this.state.players[playerIdx];
    if (!player) return false;
    if (this.state.currentPlayerIndex !== playerIdx) return false;
    if (player.usedAbilityThisTurn) {
      this.addLog('warning', `${player.name} has already used an ability this turn!`);
      return false;
    }
    if (player.activeCooldown > 0) return false;

    // Explorer ability (Momentum) is primed before rolling the movement die (in 'rolling' phase).
    // Other character abilities are activated in 'action' phase after movement.
    if (player.roleKey === 'EXPLORER') {
      if (this.state.phase !== 'rolling') {
        this.addLog('warning', 'Explorer Momentum must be activated before rolling the movement die!');
        return false;
      }
    } else {
      if (this.state.phase !== 'action') {
        this.addLog('warning', 'Character abilities can only be activated during the Action Phase after movement!');
        return false;
      }
    }

    switch (player.roleKey) {
      case 'HISTORIAN':
        // Clue Decipher
        if (player.energy < 2) {
          this.addLog('warning', 'Not enough Energy for Clue Decipher!');
          return false;
        }
        const clueDeck = this.state.clueDecks[player.currentEra];
        if (!clueDeck || clueDeck.length === 0) {
          this.addLog('warning', 'The Clue Deck for this era is empty!');
          return false;
        }
        this.modifyEnergy(player, -2);
        player.usedAbilityThisTurn = true;
        player.activeCooldown = ROLES.HISTORIAN.active.cooldown;

        const count = Math.min(3, clueDeck.length);
        const drawnCards = clueDeck.splice(0, count);

        this.state.pendingChoice = {
          type: 'historianDecipher',
          returnPhase: this.state.phase,
          drawnCards: drawnCards,
          title: '📜 Clue Decipher (Historian)',
          message: `Select 1 of the ${count} face-down mystery Clue Cards to keep. The other cards will be shuffled back into the deck!`,
          options: drawnCards.map((_, idx) => ({
            label: `🎴 Keep Mystery Card #${idx + 1}`,
            action: `pick_${idx}`
          }))
        };
        this.addLog('ability', `${player.name} activated Clue Decipher! Choosing 1 of ${count} face-down cards...`);
        break;

      case 'EXPLORER':
        // Momentum (Rolling Phase - Before Roll Die): Surge forward with +2 Bonus Movement steps!
        if (player.energy < 2) {
          this.addLog('warning', 'Not enough Energy for Momentum!');
          return false;
        }
        this.modifyEnergy(player, -2);
        player.usedAbilityThisTurn = true;
        player.activeCooldown = ROLES.EXPLORER.active.cooldown;
        player.bonusMoves = 2;
        this.state.momentumActive = true;
        this.state.momentumUsedMidTile = false;

        this.state.pendingModal = {
          type: 'abilityActivate',
          abilityKey: 'MOMENTUM',
          playerId: player.id,
          playerName: player.name,
          playerRole: 'The Explorer',
          playerAvatar: player.role?.avatar || 'assets/Characters/Copy of adventurer.png',
          playerColor: player.color || '#3498DB',
          title: '⚡ MOMENTUM SURGE! ⚡',
          subtitle: 'EXPLORER ACTIVE ABILITY PRIMED',
          description: `${player.name} ignited kinetic chronal thrusters! Your upcoming die roll will surge with +2 Bonus Movement steps along the timeline!`,
          bonusMoves: 2
        };
        this.addLog('ability', `⚡ ${player.name} activated Momentum! +2 Bonus Movement steps primed for the upcoming roll!`);
        this.notify();
        return true;

      case 'GUARDIAN':
        // Temporal Repair
        const guardianOptions = [];
        if (player.energy >= 2) {
          guardianOptions.push({ label: '⚡ Spend 2 Energy & Reduce Paradox -1', action: 'reduceEnergy' });
        }
        guardianOptions.push({ label: '🔋 Regen +1 Energy (No Paradox Reduction)', action: 'restoreEnergy' });
        this.state.pendingChoice = {
          type: 'guardianRepair',
          returnPhase: this.state.phase,
          title: 'Temporal Repair (Guardian)',
          message: 'Choose your Temporal Repair mode:',
          options: guardianOptions
        };
        break;

      case 'STRATEGIST':
        // Temporal Trap
        if (player.energy < 2) {
          this.addLog('warning', 'Not enough Energy for Temporal Trap!');
          return false;
        }
        this.modifyEnergy(player, -2);
        const currentTile = this.state.board[player.currentEra][player.tileIndex];
        currentTile.trap = {
          ownerId: player.id,
          ownerName: player.name,
          ownerRole: player.roleKey,
          era: player.currentEra,
          tileIndex: player.tileIndex
        };
        player.usedAbilityThisTurn = true;
        player.activeCooldown = ROLES.STRATEGIST.active.cooldown;
        this.state.pendingModal = {
          type: 'abilityActivate',
          abilityKey: 'TEMPORAL_TRAP',
          playerId: player.id,
          playerName: player.name,
          playerRole: 'The Strategist',
          playerAvatar: player.role?.avatar || 'assets/Characters/Copy of strategist.png',
          playerColor: player.color || '#F39C12',
          tileIndex: player.tileIndex,
          era: player.currentEra,
          title: '🕸️ TEMPORAL TRAP ARMED! 🕸️',
          subtitle: 'STRATEGIST ACTIVE ABILITY',
          description: `${player.name} armed a lethal Temporal Trap on Space #${player.tileIndex + 1}! Any rival operative landing here will trigger a Hazard penalty and grant +1 Energy to ${player.name}!`
        };
        this.addLog('ability', `🕸️ ${player.name} planted a Temporal Trap on Space #${player.tileIndex + 1}!`);
        break;

      case 'ROGUE': {
        // Pickpocket / Swipe: Target a player within 2 tiles to steal 1 Clue Card or 2 Energy (3 Turn CD, 2 Energy Cost)
        if (player.energy < 2) {
          this.addLog('warning', 'Not enough Energy for Pickpocket! Requires 2 Energy.');
          return false;
        }

        const targets = this.state.players.filter(p => 
          p.id !== player.id && 
          p.currentEra === player.currentEra && 
          Math.abs(p.tileIndex - player.tileIndex) <= 2
        );

        if (targets.length === 0) {
          this.addLog('warning', 'No operatives within 2 tiles to Pickpocket!');
          return false;
        }

        this.modifyEnergy(player, -2);
        player.usedAbilityThisTurn = true;
        player.activeCooldown = ROLES.ROGUE.active.cooldown;

        const options = [];
        targets.forEach(tgt => {
          if (tgt.clueCards && tgt.clueCards.length > 0) {
            options.push({
              label: `🔍 Steal 1 Clue Card from ${tgt.name} (${tgt.clueCards.length} held)`,
              action: `steal_clue_${tgt.id}`
            });
          }
          if (tgt.energy > 0) {
            const stealAmount = Math.min(2, tgt.energy);
            options.push({
              label: `⚡ Steal ${stealAmount} Energy from ${tgt.name} (${tgt.energy} En held)`,
              action: `steal_energy_${tgt.id}`
            });
          }
        });

        if (options.length === 0) {
          this.addLog('info', `${player.name} scanned nearby operatives, but their pockets are completely barren!`);
          break;
        }

        this.state.pendingChoice = {
          type: 'roguePickpocket',
          returnPhase: this.state.phase,
          title: '🗡️ Pickpocket / Swipe (Rogue)',
          message: 'Choose an operative within 2 tiles to pickpocket:',
          options
        };
        this.addLog('ability', `🗡️ ${player.name} targets nearby operatives with Pickpocket!`);
        break;
      }

      case 'CHRONOMANCER': {
        // Time Stop: Skips one turn for chosen player (3 energy and 3 turns CD)
        if (player.energy < 3) {
          this.addLog('warning', 'Not enough Energy for Time Stop! Requires 3 Energy.');
          return false;
        }

        const targets = this.state.players.filter(p => p.id !== player.id);
        if (targets.length === 0) {
          this.addLog('warning', 'No other operatives to target with Time Stop!');
          return false;
        }

        this.modifyEnergy(player, -3);
        player.usedAbilityThisTurn = true;
        player.activeCooldown = ROLES.CHRONOMANCER.active.cooldown;

        const options = targets.map(tgt => ({
          label: `⏳ Freeze ${tgt.name} in Time (Skip next turn)`,
          action: `freeze_${tgt.id}`
        }));

        this.state.pendingChoice = {
          type: 'chronomancerTimeStop',
          returnPhase: this.state.phase,
          title: '⌛ Time Stop (Chronomancer)',
          message: 'Choose an operative to trap in temporal stasis and skip their next turn:',
          options
        };
        this.addLog('ability', `⌛ ${player.name} channels chronal energy to cast Time Stop!`);
        break;
      }
    }

    this.notify();
    return true;
  }

  // --- Special Actions ---
  timeWarp(playerIdx) {
    const player = this.state.players[playerIdx];
    if (this.state.currentPlayerIndex !== playerIdx) return false;

    const currentTile = this.state.board[player.currentEra][player.tileIndex];
    if (currentTile.type !== TILE_TYPES.TIMEGATE) {
      this.addLog('warning', 'Time Warp can only be used on a Time Gate tile!');
      return false;
    }

    const cost = player.roleKey === 'EXPLORER' ? GAME_CONSTANTS.TIME_GATE_COST_EXPLORER : GAME_CONSTANTS.TIME_GATE_COST;
    if (player.energy < cost) {
      this.state.pendingModal = {
        type: 'info',
        title: 'Time Warp',
        description: `Not enough Energy to warp! Need ${cost} Energy (you have ${player.energy}).`,
        image: null
      };
      this.state.phase = 'action';
      this.notify();
      return false;
    }

    this.handleTimeGate(player);
    return true;
  }

  reverseTime(playerIdx) {
    const player = this.state.players[playerIdx];
    if (this.state.currentPlayerIndex !== playerIdx) return false;

    // Must be activated after a die roll, strictly at the start of the turn before any movement steps
    if (this.state.phase !== 'moving' || this.state.hasMovedThisTurn || (this.state.stepsTakenThisTurn && this.state.stepsTakenThisTurn > 0)) {
      this.addLog('warning', 'Reverse Time can only be activated after a die roll at the start of your turn!');
      return false;
    }

    if (this.state.movementDirection === 'backward') {
      this.addLog('warning', 'Reverse Time is already active for this turn!');
      return false;
    }

    if (player.reverseTimeCooldown > 0) {
      this.addLog('warning', `Reverse Time is on cooldown (${player.reverseTimeCooldown} turns remaining)!`);
      return false;
    }

    if (player.energy < GAME_CONSTANTS.REVERSE_TIME_COST) {
      this.addLog('warning', `Not enough Chrono Energy for Reverse Time! Requires ${GAME_CONSTANTS.REVERSE_TIME_COST} Energy.`);
      return false;
    }

    this.modifyEnergy(player, -GAME_CONSTANTS.REVERSE_TIME_COST);
    player.reverseTimeCooldown = GAME_CONSTANTS.REVERSE_TIME_COOLDOWN;
    this.state.movementDirection = 'backward';
    this.state.pendingModal = {
      type: 'abilityActivate',
      abilityKey: 'REVERSE_TIME',
      playerId: player.id,
      playerName: player.name,
      playerRole: player.role?.name || player.roleKey,
      playerAvatar: player.role?.avatar || 'assets/Characters/Copy of adventurer.png',
      playerColor: player.color || '#EC4899',
      movesRemaining: this.state.movesRemaining,
      title: '⏪ REVERSE TIME ACTIVATED! ⏪',
      subtitle: 'CHRONAL REVERSAL • BACKWARD TRAJECTORY',
      description: `${player.name} spent 3 Energy to invert their timeline trajectory! Moving backwards for ${this.state.movesRemaining} spaces towards historical origins!`
    };

    this.addLog('action', `${player.name} activated Reverse Time! (-${GAME_CONSTANTS.REVERSE_TIME_COST} Energy, reversing direction to move ${this.state.movesRemaining} spaces backwards)`);
    this.notify();
    return true;
  }

  skipPlayerTurn(playerIdx) {
    const idx = playerIdx !== undefined ? playerIdx : this.state.currentPlayerIndex;
    const player = this.state.players[idx];
    if (!player) return false;

    const stoppedBy = player.timeStoppedBy;
    player.skipNextTurn = false;
    player.timeStoppedBy = null;
    if (stoppedBy) {
      this.addLog('ability', `⌛ ${player.name} broke free from Temporal Stasis (cast by ${stoppedBy.name})! Turn thawed and passed.`);
    } else {
      this.addLog('danger', `⛔ ${player.name}'s turn was skipped (Hazard Penalty)!`);
    }
    this.endTurn();
    return true;
  }

  rest(playerIdx) {
    const player = this.state.players[playerIdx];
    if (this.state.currentPlayerIndex !== playerIdx) return false;
    if (player.skipNextTurn) {
      this.addLog('warning', `⛔ ${player.name} cannot rest: turn is skipped due to Hazard Penalty!`);
      return false;
    }

    this.modifyEnergy(player, 3);
    this.addLog('action', `${player.name} rested and recovered 3 Energy.`);
    this.endTurn();
    return true;
  }

  restPlayer(playerIdx) {
    return this.rest(playerIdx);
  }

  tradeEnergy(fromIdx, toIdx, amount) {
    const from = this.state.players[fromIdx];
    const to = this.state.players[toIdx];

    if (from.currentEra !== to.currentEra || from.tileIndex !== to.tileIndex) {
      this.addLog('warning', 'Players must be on the same tile to trade!');
      return false;
    }
    if (amount > 2 || amount < 1) return false;
    if (from.energy < amount) return false;

    this.modifyEnergy(from, -amount);
    this.modifyEnergy(to, amount);
    this.addLog('trade', `${from.name} traded ${amount} Energy to ${to.name}.`);
    this.notify();
    return true;
  }

  // Return artifact to correct timeline
  returnArtifact(playerIdx, artifactId) {
    const player = this.state.players[playerIdx];
    const artifact = ALL_ARTIFACTS.find(a => a.id === artifactId);
    if (!artifact) return false;

    const artIdx = player.artifactCards.findIndex(a => a.id === artifactId);
    if (artIdx < 0) return false;

    if (player.currentEra === artifact.era) {
      // Correct timeline
      player.artifactCards.splice(artIdx, 1);
      player.points += SCORING.RETURN_ARTIFACT_CORRECT;
      this.addLog('mission', `${player.name} returned ${artifact.nickname} to the correct timeline! (+${SCORING.RETURN_ARTIFACT_CORRECT} Points)`);

      // Check mission complete
      const isMission = player.mission && player.mission.artifactId === artifactId;
      if (isMission) {
        player.missionComplete = true;
        player.points += SCORING.COMPLETE_MISSION;
        this.addLog('mission', `🎉 ${player.name} completed their mission! (+${SCORING.COMPLETE_MISSION} Points)`);

        this.state.pendingModal = {
          type: 'artifact',
          cardType: 'Mission Complete! 🏆',
          title: `Recovered: ${artifact.nickname}`,
          description: `Outstanding achievement, ${player.name}! You safely returned ${artifact.name} to the ${ERA_NAMES[artifact.era]} and completed your historical directive! (+${SCORING.RETURN_ARTIFACT_CORRECT + SCORING.COMPLETE_MISSION} Total Points)`,
          image: artifact.cardImage || artifact.image,
          era: artifact.era
        };
      } else {
        this.state.pendingModal = {
          type: 'artifact',
          cardType: 'Relic Restored! 📦',
          title: `Restored: ${artifact.nickname}`,
          description: `You returned the ${artifact.name} to the ${ERA_NAMES[artifact.era]} timeline! (+${SCORING.RETURN_ARTIFACT_CORRECT} Points)`,
          image: artifact.cardImage || artifact.image,
          era: artifact.era
        };
      }

      // Check if all missions complete
      if (this.state.players.every(p => p.missionComplete)) {
        this.endGame('allComplete');
      }
    } else {
      // Wrong timeline
      this.modifyParadox(player, 1);
      this.modifyTimelineMeter(1);
      this.addLog('paradox', `${player.name} placed ${artifact.nickname} in the wrong timeline! Paradox +1, Timeline +1`);

      this.state.pendingModal = {
        type: 'danger',
        cardType: 'Temporal Anomaly! ⚠️',
        title: 'Wrong Era Paradox',
        description: `The ${artifact.nickname} does not belong to the ${ERA_NAMES[player.currentEra]}! It belongs to the ${ERA_NAMES[artifact.era]}. Temporal Paradox +1, Timeline Meter +1!`,
        image: artifact.cardImage || artifact.image,
        era: player.currentEra
      };
    }

    this.notify();
    return true;
  }

  // --- Helpers ---
  peekClueCards(player, count) {
    const deck = this.state.clueDecks[player.currentEra];
    const peeked = deck.slice(0, Math.min(count, deck.length));
    this.state.pendingModal = {
      type: 'peek',
      title: 'Peeking at Clue Cards',
      cards: peeked,
      description: `Top ${peeked.length} cards in the ${ERA_NAMES[player.currentEra]} Clue Deck.`
    };
  }

  showEraArtifacts(player) {
    const artifacts = ARTIFACTS[player.currentEra];
    this.state.pendingModal = {
      type: 'artifactList',
      title: `Artifacts of ${ERA_NAMES[player.currentEra]}`,
      artifacts,
      description: 'These artifacts belong to this era.'
    };
  }

  offerChoice(player, title, options) {
    this.state.pendingChoice = {
      type: 'eventChoice',
      title,
      message: `Choose an option:`,
      options: options.map(opt => ({ label: opt.label, action: opt.action }))
    };
  }

  offerTeleport(player, era = ERAS.MYTH) {
    const tiles = this.state.board[era];
    if (!tiles || tiles.length === 0) return;

    const tileOptions = tiles.map(t => {
      let icon = "•";
      let typeLabel = (t.type || "").toUpperCase();
      if (t.type === TILE_TYPES.CLUE) { icon = "🔍"; typeLabel = "Clue"; }
      else if (t.type === TILE_TYPES.ARTIFACT) { icon = "🏆"; typeLabel = "Artifact"; }
      else if (t.type === TILE_TYPES.EVENT) { icon = "⚡"; typeLabel = "Event"; }
      else if (t.type === TILE_TYPES.DANGER) { icon = "⚠️"; typeLabel = "Hazard"; }
      else if (t.type === TILE_TYPES.TIMEGATE) { icon = "🌀"; typeLabel = "Time Gate"; }
      else if (t.type === TILE_TYPES.PARADOX) { icon = "⏳"; typeLabel = "Paradox"; }
      else if (t.type === TILE_TYPES.START) { icon = "🚩"; typeLabel = "Start Station"; }
      else if (t.type === TILE_TYPES.EMPTY) { icon = "•"; typeLabel = "Quiet Path"; }

      return {
        index: t.index,
        type: t.type,
        icon,
        typeLabel,
        id: t.id,
        label: `${icon} Space #${t.index + 1} (${typeLabel})`,
        action: `teleport_${t.index}`
      };
    });

    this.state.pendingChoice = {
      type: 'teleportTile',
      targetEra: era,
      title: '✨ Anito Guidance: Choose Teleport Destination',
      message: `The ancient Anito spirits envelop you in ethereal light! Choose any tile in the ${ERA_NAMES[era]} to materialize upon:`,
      tiles: tileOptions,
      options: tileOptions
    };

    this.addLog('event', `${player.name} invoked Anito Guidance: choosing a destination tile in ${ERA_NAMES[era]}!`);
  }

  healAllInEra(era, amount) {
    this.state.players.forEach(p => {
      if (p.currentEra === era) {
        this.modifyEnergy(p, amount);
      }
    });
  }

  moveToNearestTimeGate(player) {
    const tiles = this.state.board[player.currentEra];
    const tgIdx = tiles.findIndex(t => t.type === TILE_TYPES.TIMEGATE);
    if (tgIdx >= 0) {
      tiles[player.tileIndex].players = tiles[player.tileIndex].players.filter(id => id !== player.id);
      player.tileIndex = tgIdx;
      tiles[tgIdx].players.push(player.id);
      this.addLog('move', `${player.name} moved to the Time Gate!`);
    }
  }

  movePlayer(player, spaces) {
    const tiles = this.state.board[player.currentEra];
    tiles[player.tileIndex].players = tiles[player.tileIndex].players.filter(id => id !== player.id);

    let cur = player.tileIndex;
    const step = spaces >= 0 ? 1 : -1;
    let count = Math.abs(spaces);
    while (count > 0) {
      const next = this.getNextTileIndex(player, player.currentEra, cur, step);
      player.previousTileIndex = cur;
      cur = next;
      count--;
    }
    player.tileIndex = cur;
    tiles[cur].players.push(player.id);
  }

  // --- Turn Management ---
  endTurn() {
    if (this.state.gameOver) return;
    const player = this.getCurrentPlayer();

    // Decrease temporal occurrence
    if (this.state.temporalOccurrence > 0) {
      this.state.temporalOccurrence--;
      if (this.state.temporalOccurrence <= 0) {
        this.addLog('temporal', 'Temporal Occurrence has ended.');
        this.state.temporalOccurrence = 0;
        this.state.temporalOccurrenceId = null;
        this.state.temporalOccurrenceAnnounced = true;
      }
    }

    // Clue points
    if (Array.isArray(player.clueCards)) {
      player.clueCards.forEach(c => {
        if (c && !c.isDecoy && !c.counted) {
          c.counted = true;
        }
      });
    }

    // Next player
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    if (this.state.currentPlayerIndex === 0) {
      this.state.turnNumber++;
    }

    const nextPlayer = this.getCurrentPlayer();
    nextPlayer.usedAbilityThisTurn = false;
    nextPlayer.hasUsedForesightThisTurn = false;
    nextPlayer.shadowPocketsTriggered = [];
    if (nextPlayer.passiveCooldown > 0) nextPlayer.passiveCooldown--;
    if (nextPlayer.activeCooldown > 0) nextPlayer.activeCooldown--;
    if (nextPlayer.reverseTimeCooldown > 0) nextPlayer.reverseTimeCooldown--;
    if (nextPlayer.temporalForesightCooldown > 0) nextPlayer.temporalForesightCooldown--;

    this.state.phase = 'rolling';
    this.state.diceResult = null;
    this.state.initialRoll = null;
    this.state.totalMoves = 0;
    this.state.movesRemaining = 0;
    this.state.stepsTakenThisTurn = 0;
    this.state.hasMovedThisTurn = false;
    this.state.movementDirection = 'forward';
    this.state.momentumActive = false;
    this.state.momentumUsedMidTile = false;
    for (const p of this.state.players) {
      p.bonusMoves = 0;
    }
    this.state.pendingModal = null;
    this.state.pendingChoice = null;

    this.addLog('turn', `--- ${nextPlayer.name}'s turn ---`);
    this.notify();
  }

  // Momentum mid-turn tile interaction
  interactMomentumTile(playerIdx) {
    const player = this.state.players[playerIdx];
    if (!this.state.momentumActive || this.state.momentumUsedMidTile) return false;
    const tile = this.state.board[player.currentEra][player.tileIndex];
    if (tile.type === TILE_TYPES.EMPTY || tile.type === TILE_TYPES.START) {
      this.addLog('info', 'Nothing to interact with on this starting space.');
      return false;
    }
    this.state.momentumUsedMidTile = true;
    this.addLog('ability', `${player.name} used Momentum to interact with ${tile.type.toUpperCase()} space!`);
    this.resolveTile(player, tile);
    if (this.state.movesRemaining > 0) {
      this.state.phase = 'moving';
    }
    this.notify();
    return true;
  }

  dismissModal() {
    if (this.state.pendingModal?.type === 'danger' && this.state.pendingModal?.needsRoll) {
      this.rollDangerDie(this.state.pendingModal.playerId);
    }
    const wasParadoxModal = this.state.pendingModal?.type === 'paradox';
    const queuedDangerPlayerId = this.state.pendingModal?.triggerDangerPlayerId;

    this.state.pendingModal = null;

    if (wasParadoxModal && queuedDangerPlayerId !== undefined) {
      const targetPlayer = this.state.players.find(p => p.id === queuedDangerPlayerId);
      if (targetPlayer) {
        this.drawDangerCard(targetPlayer);
        this.notify();
        return;
      }
    }

    if (this.state.movesRemaining > 0) {
      this.state.phase = 'moving';
    } else if (this.state.phase === 'cardResolution') {
      this.state.phase = 'action';
    }
    this.notify();
  }

  discardCard(card) {
    if (!card) return;
    if (card.era && (card.type === 'clue' || card.type === 'decoy' || card.isDecoy !== undefined)) {
      this.returnClueToDeck(card);
      return;
    }
    if (!this.state.discardPile) {
      this.state.discardPile = [];
    }
    this.state.discardPile.push(card);
  }

  // --- End Game ---
  endGame(reason) {
    this.stopTimer();
    this.state.gameOver = true;
    this.state.phase = 'ended';

    // Calculate final scores
    this.state.players.forEach(player => {
      // Unused energy bonus
      player.points += player.energy * SCORING.PER_UNUSED_ENERGY;
      
      // Paradox bonus/penalty
      if (player.paradox <= 1) {
        player.points += SCORING.PARADOX_LOW_BONUS;
      } else if (player.paradox >= 4) {
        player.points += SCORING.PARADOX_HIGH;
      }

      // Mission failure penalty
      if (!player.missionComplete) {
        player.points += SCORING.MISSION_FAILURE;
      }

      // Count clues
      const realClues = player.clueCards.filter(c => !c.isDecoy).length;
      player.cluePoints = realClues;
    });

    if (reason === 'collapse') {
      this.state.winner = null; // Everyone loses
      if (!this.state.collapseMessage) {
        this.state.collapseMessage = 'The timelines are completely messed up! The temporal breach exceeded stability limits (above 5), causing catastrophic spacetime collapse.';
      }
      this.addLog('system', '💀 THE TIMELINES ARE MESSED UP! Spacetime collapsed and all castaways were lost!');
    } else {
      // Find winner
      const sorted = [...this.state.players].sort((a, b) => b.points - a.points);
      this.state.winner = sorted[0];
      this.addLog('system', `🏆 ${sorted[0].name} wins with ${sorted[0].points} points!`);
    }

    this.state.endReason = reason;
    this.notify();
  }

  // --- Serialization for multiplayer ---
  serialize() {
    return JSON.stringify({
      ...this.state,
      // Remove function references from event/danger cards
      clueDecks: Object.fromEntries(
        Object.entries(this.state.clueDecks).map(([era, deck]) =>
          [era, deck.map(c => ({ ...c }))]
        )
      )
    });
  }

  loadState(stateData) {
    this.state = typeof stateData === 'string' ? JSON.parse(stateData) : stateData;
    this.notify();
  }
}

export default GameEngine;
