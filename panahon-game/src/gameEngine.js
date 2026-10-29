import gameLogger, { LOG_CATEGORIES } from './utils/debugLogger.js';
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

  rehydrateState(state) {
    if (!state) return;
    if (state.eventDecks) {
      for (const era of Object.keys(state.eventDecks)) {
        if (Array.isArray(state.eventDecks[era])) {
          state.eventDecks[era] = state.eventDecks[era].map(card => {
            if (card && typeof card.effect === 'function') return card;
            const canonical = (EVENT_CARDS[era] || []).find(c => c.id === card?.id || c.name === card?.name) ||
              Object.values(EVENT_CARDS).flat().find(c => c.id === card?.id || c.name === card?.name);
            return canonical ? { ...canonical, ...card, effect: canonical.effect } : card;
          });
        }
      }
    }
  }

  loadState(stateData, source = 'remote_state') {
    if (!stateData) return;
    const parsed = typeof stateData === 'string' ? JSON.parse(stateData) : stateData;
    this.rehydrateState(parsed);
    this.state = parsed;
    this.notify(source);
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
    // Face-Up Display: 3 visible cards per era (players can see & choose which to take)
    const faceUpCards = {};

    ERA_ORDER.forEach(era => {
      clueDecks[era] = shuffle(allClueCards.filter(c => c.era === era));
      eventDecks[era] = shuffle([...EVENT_CARDS[era]]);
      dangerDecks[era] = shuffle([...DANGER_CARDS[era]]);
      // Deal 3 face-up cards from each era's shuffled deck
      faceUpCards[era] = clueDecks[era].splice(0, 3);
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

      // Phase 2 Displaced Era: Mission Artifact spawns onto an Artifact Tile in a DIFFERENT quadrant than its Origin Era
      const originEra = (mission && (mission.originEra || mission.targetEra)) || ERAS.SPANISH;
      const otherEras = ERA_ORDER.filter(e => e !== originEra);
      const displacedEra = otherEras[idx % otherEras.length];
      if (mission) {
        mission.originEra = originEra;
        mission.displacedEra = displacedEra;
      }

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

        // FIFO Placement & Mission Progression
        mission: mission,
        missionComplete: false,
        completed: false,
        placementRank: null,
        missionPhase: 1, // 1: Research in Home Era, 2: Retrieval in Displaced Era, 3: Return to Origin Era, 4: Restored
        finishedAt: null,

        // Temporal Triangulation Progression
        triangulation: {
          originAnchor: false,
          riftVector: false,
          impactSighting: false
        },

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
      faceUpCards, // 3 visible clue cards per era for the Face-Up Display mechanic
      placementQueue: [],
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
      queuedTileResolution: null,
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
    const firstPlayer = newPlayers[0];
    gameLogger.turn(`🎲 Initiative resolved! First turn awarded to ${firstPlayer?.name || 'Player 1'}. Turn sequence: ${newPlayers.map((p, i) => `#${i + 1} ${p.name}`).join(' → ')}`);
    gameLogger.phase('Phase reset to rolling for first player');
    this.state.phase = 'rolling';
    this.state.diceResult = null;
    this.state.movesRemaining = 0;
    this.state.hasCompletedIntro = true;

    this.addLog('system', `🎲 Initiative resolved! Turn order: ${newPlayers.map((p, i) => `#${i + 1} ${p.name}`).join(' → ')}.`);
    this.addLog('system', `🏆 ${firstPlayer?.name || 'Player 1'} takes the first turn!`);

    this.notify();
    return true;
  }

  // --- Timer ---
  startTimer() {
    this.isPaused = false;
    if (this.state) this.state.isPaused = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.state || this.state.gameOver) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        return;
      }
      if (this.isPaused || this.state.isPaused) return;

      if (typeof this.state.gameTimeRemaining !== 'number' || isNaN(this.state.gameTimeRemaining)) {
        this.state.gameTimeRemaining = (GAME_CONSTANTS.GAME_TIME_MINUTES || 40) * 60;
      }

      this.state.gameTimeRemaining = Math.max(0, this.state.gameTimeRemaining - 1);
      if (this.state.gameTimeRemaining <= 0) {
        this.endGame('timeout');
      }
      this.notify('timer');
    }, 1000);
    this.timerInterval?.unref?.();
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Clear all engine timers (game clock, AI-turn timeouts, etc.)
  stop() {
    this.stopTimer();
    if (this._aiTimer) {
      clearTimeout(this._aiTimer);
      this._aiTimer = null;
    }
    if (this._turnTimer) {
      clearTimeout(this._turnTimer);
      this._turnTimer = null;
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

    const bonus = player.bonusMoves || 0;

    this.state.totalMoves = result + bonus;
    this.state.movesRemaining = result + bonus;
    this.state.movementDirection = 'forward';
    player.bonusMoves = 0;
    this.state.phase = 'moving';

    if (bonus > 0) {
      this.addLog('dice', `🎲 ${player.name} rolled a ${result} (+${bonus} Bonus Spaces = ${result + bonus} Total)!`);
    } else {
      this.addLog('dice', `🎲 ${player.name} rolled a ${result}!`);
    }
    gameLogger.dice(`${player.name} rolled a ${result}${bonus > 0 ? ` (+${bonus} bonus = ${result + bonus})` : ''}. Moves remaining: ${this.state.movesRemaining}`);
    gameLogger.phase('Phase transitioned from rolling -> moving');
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

    // Temporal Triangulation: Check Time Gate Chrono-Scan (Step 2)
    if (tile.type === TILE_TYPES.TIMEGATE) {
      this.checkTemporalScan(player);
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
          const minMilestones = this.getTriangulationCount(victim);
          victim.clueProgress[stolenCard.artifactId] = Math.max(
            victim.mission?.artifactId === stolenCard.artifactId ? minMilestones : 0,
            victim.clueProgress[stolenCard.artifactId] - 1
          );
        }

        if (player.clueCards.length >= (GAME_CONSTANTS.MAX_CLUE_CARDS || 3)) {
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
    if (this.state.phase !== 'moving' || this.state.hasMovedThisTurn || (this.state.stepsTakenThisTurn || 0) > 0) {
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
      title: 'TEMPORAL FORESIGHT!',
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

    // Temporal Triangulation: Check Time Gate Chrono-Scan (Step 2)
    if (tile.type === TILE_TYPES.TIMEGATE) {
      this.checkTemporalScan(player);
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

    const choice = this.state.pendingChoice;
    const player = (choice?.playerId !== undefined ? this.state.players.find(p => p.id === choice.playerId) : null) || this.getCurrentPlayer();
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
    } else if (choiceType === 'maritesTrade') {
      if (action && action.startsWith('marites_target_')) {
        const targetId = parseInt(action.replace('marites_target_', ''), 10);
        const target = this.state.players[targetId];
        const accept = target?.isAi ? (Math.random() < 0.75) : true;
        this.executeMaritesTrade(player.id, targetId, accept);
      }
      this.state.phase = 'action';
    } else if (choiceType === 'secretChismis') {
      if (action && action.startsWith('secret_clue_')) {
        const cardIdx = parseInt(action.replace('secret_clue_', ''), 10);
        this.executeSecretChismis(player.id, cardIdx);
      }
      this.state.phase = 'action';
    } else if (choiceType === 'hideousPlan') {
      if (action === 'hideous_restore_energy') {
        player.skipNextTurn = 2;
        player.energy = 10;
        this.addLog('event', `${player.name} hid in the shadows: Next 2 turns skipped, Energy restored to 10/10!`);
      } else if (action === 'hideous_reset_paradox') {
        player.skipNextTurn = 2;
        player.paradox = 0;
        this.addLog('event', `${player.name} hid in the shadows: Next 2 turns skipped, Paradox reset to 0!`);
      }
      this.state.phase = 'action';
    } else if (choiceType === 'anitoGrab') {
      if (action === 'anito_accept') {
        if (player.energy >= 2) {
          this.modifyEnergy(player, -2);
          this.drawClueCard(player);
          this.addLog('event', `${player.name} exchanged 2 Energy for 1 Clue Card via Anito Grab!`);
        }
      } else {
        this.addLog('event', `${player.name} declined the Anito Grab offer.`);
      }
      this.state.phase = 'action';
    } else if (choiceType === 'batoBatoEra') {
      if (action && action.startsWith('bato_era_')) {
        const chosenEra = action.replace('bato_era_', '');
        this.drawClueCardFromEra(player, chosenEra);
      }
      this.state.phase = 'action';
    } else if (choiceType === 'clueDisplay') {
      // Face-Up Display: player picked a specific face-up card (faceup_<cardId>)
      // or chose to draw blind (draw_blind)
      const era = choice.era;
      if (action === 'draw_blind') {
        this._drawBlindClueCard(player, era);
      } else if (action && action.startsWith('faceup_')) {
        const chosenCardId = action.replace('faceup_', '');
        const faceUp = this.state.faceUpCards?.[era] || [];
        const idx = faceUp.findIndex(c => c.id === chosenCardId);
        if (idx >= 0) {
          const [pickedCard] = faceUp.splice(idx, 1);
          this._replenishFaceUp(era); // Flip up a new card to fill the slot
          this._receiveClueCard(player, pickedCard, era);
        } else {
          // Card no longer available (edge case) — draw blind as fallback
          this._drawBlindClueCard(player, era);
        }
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
        title: 'TEMPORAL REPAIR!',
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
          title: 'DECOY SAFELY NEUTRALIZED!',
          subtitle: 'HISTORIAN PASSIVE: DECOY DISCARD',
          description: `${player.name} drew a deceptive Decoy Card via Clue Decipher, but scholarly mastery safely purged it back into the deck!`
        };
        this.state.phase = returnPhase;
      } else if (chosenCard) {
        const isTriangulationStep = this.processClueTriangulation(player, chosenCard, player.currentEra);
        if (player.clueCards.length >= (GAME_CONSTANTS.MAX_CLUE_CARDS || 3)) {
          this.promptClueHandLimit(player, chosenCard, returnPhase);
          return;
        } else {
          player.clueCards.push(chosenCard);
          if (!isTriangulationStep && !chosenCard.isDecoy && chosenCard.artifactId) {
            if (!player.clueProgress[chosenCard.artifactId]) {
              player.clueProgress[chosenCard.artifactId] = 0;
            }
            player.clueProgress[chosenCard.artifactId]++;
          }
          const cardDesc = chosenCard.isDecoy ? 'Decoy Card' : (chosenCard.artifactName ? `${chosenCard.artifactName} Clue` : (chosenCard.hint || 'Mystery Clue'));
          this.addLog('clue', `📜 ${player.name} deciphered and placed into hand: ${cardDesc}! (${player.clueCards.length}/${GAME_CONSTANTS.MAX_CLUE_CARDS || 3} Clues held)`);
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
            const minMilestones = this.getTriangulationCount(victim);
            victim.clueProgress[stolenCard.artifactId] = Math.max(
              victim.mission?.artifactId === stolenCard.artifactId ? minMilestones : 0,
              victim.clueProgress[stolenCard.artifactId] - 1
            );
          }
          if (player.clueCards.length >= (GAME_CONSTANTS.MAX_CLUE_CARDS || 3)) {
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
              title: 'SHADOW PICKPOCKET!',
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
            title: 'SHADOW PICKPOCKET!',
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

          // Adjust clue progress if real clue was discarded (protecting completed triangulation milestones)
          if (!discardedCard.isDecoy && discardedCard.artifactId) {
            const minMilestones = this.getTriangulationCount(player);
            if (player.clueProgress[discardedCard.artifactId] > 0) {
              player.clueProgress[discardedCard.artifactId] = Math.max(
                player.mission?.artifactId === discardedCard.artifactId ? minMilestones : 0,
                player.clueProgress[discardedCard.artifactId] - 1
              );
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

        this.checkCarriedArtifactContamination(player, targetEra);

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

  // Face-Up Display: replenish one slot in the face-up row after a card is taken.
  // Draws the next card from the era deck. If the deck is empty, the slot stays empty.
  _replenishFaceUp(era) {
    if (!this.state.faceUpCards) return;
    if (!this.state.faceUpCards[era]) this.state.faceUpCards[era] = [];
    const deck = this.state.clueDecks[era];
    if (deck && deck.length > 0) {
      this.state.faceUpCards[era].push(deck.shift());
    }
  }

  // Present Choice Modal when player reaches Clue Hand Limit (Max 3)
  promptClueHandLimit(player, card, returnPhase = "action") {
    const eraName = ERA_NAMES[card.era] || card.era;
    const cardName = card.isDecoy ? "Decoy Card" : (card.hint || card.description || "Clue Card");
    const maxClues = GAME_CONSTANTS.MAX_CLUE_CARDS || 3;

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
      title: `🎴 Clue Hand Limit Reached (Max ${maxClues})!`,
      message: `You already hold ${maxClues} Clue Cards! You drew: "${cardName}". Choose whether to discard it or keep it and discard 1 card from your hand.`,
      options
    };

    this.addLog("card", `${player.name} drew a Clue Card (${cardName}), but hand is full (${player.clueCards.length}/${maxClues}). Choosing which card to keep...`);
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

    try {
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
    } catch (err) {
      console.error('[Engine] Unexpected error in resolveTile:', err);
      gameLogger.error(LOG_CATEGORIES.ENGINE, `Error resolving tile ${tile.type}: ${err?.message}`);
      if (!this.state.pendingModal && !this.state.pendingChoice) {
        this.state.phase = 'action';
      }
    }

    this.notify();
  }

  // --- Card Drawing ---
  drawClueCard(player) {
    let era = player.currentEra;

    // Temporal Occurrence: draw from random era
    if (this.state.temporalGlitchTurns > 0 || this.state.temporalOccurrence > 0) {
      era = ERA_ORDER[Math.floor(Math.random() * ERA_ORDER.length)];
      this.addLog('temporal', `Temporal Disturbance! Drawing Event from ${ERA_NAMES[era]} instead!`);
    }

    const deck = this.state.clueDecks[era];
    const faceUp = (this.state.faceUpCards?.[era] || []);

    if (deck.length === 0 && faceUp.length === 0) {
      this.addLog('system', 'No more clue cards in this era!');
      this.state.phase = 'action';
      return;
    }

    // --- Face-Up Display mechanic ---
    // Show the 3 visible cards from this era's display so the player can pick one deliberately.
    // A "Draw Blind" option still exists for when the player doesn't need a specific card.
    if (faceUp.length > 0) {
      this.state.pendingChoice = {
        type: 'clueDisplay',
        era,
        playerId: player.id,
        options: faceUp.map((c, i) => ({
          cardId: c.id,
          action: `faceup_${c.id}`,
          index: i,
          label: c.isDecoy ? '🎭 Decoy Card' : (c.hint || c.artifactName || 'Clue Card'),
          isDecoy: c.isDecoy,
          artifactId: c.artifactId,
          artifactName: c.artifactName,
          image: c.image,
          isMissionCard: !c.isDecoy && c.artifactId === player.mission?.artifactId,
          card: c
        })),
        canDrawBlind: deck.length > 0,
        returnPhase: 'action'
      };
      this.state.phase = 'action';
      this.notify();
      return;
    }

    // No face-up cards left — draw blind from deck (fallback)
    this._drawBlindClueCard(player, era);
  }

  // Internal: draw top card from deck (blind draw, no display choice)
  _drawBlindClueCard(player, era) {
    const deck = this.state.clueDecks[era];
    if (!deck || deck.length === 0) {
      this.state.phase = 'action';
      return;
    }
    const card = deck.shift();
    this._receiveClueCard(player, card, era);
  }

  // Core card-receive logic: Historian passive check, triangulation, hand limit, modal.
  // Called from both blind draw and face-up pick paths.
  _receiveClueCard(player, card, era) {
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
        title: 'DECOY SAFELY NEUTRALIZED!',
        subtitle: 'HISTORIAN PASSIVE: DECOY DISCARD',
        description: `${player.name} excavated a deceptive Decoy Card (${card.hint || card.description}), but ancient scholarly mastery safely purged it back into the ${ERA_NAMES[card.era] || 'timeline'} deck!`
      };
      this.state.phase = 'action';
      this.notify();
      return;
    }

    // Process Temporal Triangulation (Steps 1 & 3)
    const isTriangulationStep = this.processClueTriangulation(player, card, era);

    // Check Hand Limit (Max 3 Clue Cards)
    if (player.clueCards.length >= (GAME_CONSTANTS.MAX_CLUE_CARDS || 3)) {
      this.promptClueHandLimit(player, card, 'action');
      return;
    }

    player.clueCards.push(card);

    // Non-triangulation step: still track clue progress for any non-decoy card
    if (!isTriangulationStep && !card.isDecoy && card.artifactId) {
      if (!player.clueProgress[card.artifactId]) {
        player.clueProgress[card.artifactId] = 0;
      }
      player.clueProgress[card.artifactId]++;
    }

    // Build modal messaging
    let modalTitle, modalSubtitle, modalDesc, modalCardType;

    if (card.isDecoy) {
      modalTitle = 'Decoy Anomaly!';
      modalSubtitle = 'FALSE INTELLIGENCE';
      modalDesc = card.description;
      modalCardType = 'Decoy Anomaly';
    } else if (card.triangulationStep === 1) {
      modalTitle = '📜 ORIGIN ANCHOR LOCKED!';
      modalSubtitle = 'STEP 1 OF 3: HISTORICAL TRACE';
      modalDesc = `Historical records confirmed! You unearthed authentic documentation for the ${player.mission?.artifactNickname} in its native ${ERA_NAMES[player.mission?.originEra]}. Head to a Time Gate to scan the residual rift vector!`;
      modalCardType = 'Triangulation Clue — Step 1 (Origin Anchor)';
    } else if (card.triangulationStep === 3) {
      modalTitle = '🎯 GROUND SIGHTINGS VERIFIED!';
      modalSubtitle = 'STEP 3 OF 3: TRIANGULATION COMPLETE';
      modalDesc = `Local eyewitnesses confirm the presence of the ${player.mission?.artifactNickname} here in ${ERA_NAMES[player.mission?.displacedEra]}! Triangulation is complete — proceed to the Artifact Tile to retrieve it!`;
      modalCardType = 'Triangulation Clue — Step 3 (Ground Sighting)';
    } else if (!card.isDecoy && card.artifactId && card.artifactId !== player.mission?.artifactId) {
      // Drew a REAL clue but it belongs to ANOTHER operative's artifact — useful for trading!
      const otherArtName = card.artifactName || 'another relic';
      modalTitle = 'Foreign Intel Recovered!';
      modalSubtitle = 'NOT YOUR TARGET — TRADE VALUE HIGH';
      modalDesc = `This clue belongs to the ${otherArtName} — not your current mission target. Hold it for a Clue Trade with the operative hunting that relic, or discard it to make room!`;
      modalCardType = 'Field Intel (Foreign Relic)';
    } else {
      // Non-decoy, correct artifact, but triangulation conditions not met (wrong era, or step already done)
      modalTitle = 'Historical Clue Found!';
      modalSubtitle = null;
      modalDesc = card.description;
      modalCardType = 'Clue Card';
    }

    this.state.pendingModal = {
      type: 'card',
      playerId: player.id,
      playerName: player.name,
      isClue: true,
      cardType: modalCardType,
      title: modalTitle,
      subtitle: modalSubtitle,
      description: modalDesc,
      hint: card.hint,
      image: card.image,
      era: era,
      isDecoy: card.isDecoy,
      artifactId: card.artifactId,
      artifactName: card.artifactName,
      triangulationStep: card.triangulationStep,
      clueCount: player.clueCards.length,
      maxClues: GAME_CONSTANTS.MAX_CLUE_CARDS || 3,
      artifactProgress: card.artifactId ? (player.clueProgress?.[card.artifactId] || 1) : 0,
      triangulation: { ...player.triangulation }
    };

    const stepLabel = card.triangulationStep ? ` [TRIANGULATION STEP ${card.triangulationStep}]` : '';
    this.addLog('card', `${player.name} drew a Clue Card from ${ERA_NAMES[era]}${stepLabel}. (${player.clueCards.length}/${GAME_CONSTANTS.MAX_CLUE_CARDS || 3} Clues held)`);
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

    const canonical = (EVENT_CARDS[era] || []).find(c => c.id === card.id || c.name === card.name) ||
      Object.values(EVENT_CARDS).flat().find(c => c.id === card.id || c.name === card.name);

    const needsRoll = !!(card.needsRoll || canonical?.needsRoll || card.id === 'evt_my_4');

    if (needsRoll) {
      this.state.pendingModal = {
        type: 'event',
        cardType: 'Chronal Timeline Event',
        cardId: card.id,
        title: card.name || canonical?.name,
        cardName: card.name || canonical?.name,
        description: card.description || canonical?.description,
        resultText: null,
        image: card.image || canonical?.image,
        era: era,
        playerId: player.id,
        playerName: player.name,
        needsRoll: true,
        diceRoll: null,
        success: null,
        successMsg: card.successMsg || canonical?.successMsg || 'Rune resonance achieved! Select an Era deck.',
        failMsg: card.failMsg || canonical?.failMsg || 'The rune stones remained silent. Nothing happened.',
        vfxTag: card.vfxTag || canonical?.vfxTag,
        sfxTag: card.sfxTag || canonical?.sfxTag,
        _shownAt: Date.now()
      };
      this.addLog('event', `${player.name} drew ${card.name}! Celestial Rune check: ${card.description}`);
      this.state.phase = 'action';
      this.notify();
      return;
    }

    // Resolve effect function (either on card or looked up from canonical EVENT_CARDS)
    let effectFn = typeof card.effect === 'function' ? card.effect : null;
    if (!effectFn) {
      const canonical = (EVENT_CARDS[era] || []).find(c => c.id === card.id || c.name === card.name) ||
        Object.values(EVENT_CARDS).flat().find(c => c.id === card.id || c.name === card.name);
      if (canonical && typeof canonical.effect === 'function') {
        effectFn = canonical.effect;
        if (!card.description) card.description = canonical.description;
        if (!card.image) card.image = canonical.image;
        if (!card.name) card.name = canonical.name;
      }
    }

    let result = '';
    if (typeof effectFn === 'function') {
      try {
        result = effectFn(player, this);
      } catch (err) {
        console.error('[Engine] Error running event card effect:', err);
        gameLogger.error(LOG_CATEGORIES.CARDS, `Error executing effect for event card ${card.name || card.id}: ${err?.message}`);
        result = card.description || 'Event resolved.';
      }
    } else {
      console.warn(`[Engine] Event card ${card.id || card.name} has no executable effect function.`);
      gameLogger.warn(LOG_CATEGORIES.CARDS, `Event card ${card.id || card.name} has no effect function.`);
      result = card.description || 'Event resolved.';
    }

    gameLogger.card(`Player ${player.name} drew Event Card: "${card.name || card.id}" (${era}) - Result: ${result}`);

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
      playerName: player.name,
      vfxTag: card.vfxTag,
      sfxTag: card.sfxTag
    };
    this.addLog('event', `${player.name}: ${card.name} — ${result}`);
    if (!this.state.pendingChoice) {
      this.state.phase = 'action';
    }
    this.notify();
  }

  drawDangerCard(player) {
    let era = player.currentEra;

    // Check Sanctuary Shield or standard shield buff
    if (player.sanctuaryShield || player.shielded) {
      const wasSanctuary = !!player.sanctuaryShield;
      player.sanctuaryShield = false;
      player.shielded = false;
      this.addLog('shield', `🛡️ ${player.name}'s ${wasSanctuary ? 'Sanctuary Shield' : 'Shield'} safely negated and discarded the Hazard!`);
      this.state.pendingModal = {
        type: 'danger_negated',
        cardType: 'Sanctuary Protection',
        title: 'Danger Card Negated!',
        description: `${player.name}'s Sanctuary Shield absorbed and completely negated the Hazard from ${ERA_NAMES[era]}!`,
        era: era,
        playerId: player.id,
        playerName: player.name,
        vfxTag: 'sanctuary_shield',
        sfxTag: 'cathedralChime'
      };
      this.state.phase = 'action';
      this.notify();
      return;
    }

    if (this.state.temporalGlitchTurns > 0 || this.state.temporalOccurrence > 0) {
      era = ERA_ORDER[Math.floor(Math.random() * ERA_ORDER.length)];
      this.addLog('temporal', `Temporal Glitch! Hazard emerges from ${ERA_NAMES[era]}!`);
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
      failMsg: card.failMsg,
      vfxTag: card.vfxTag,
      sfxTag: card.sfxTag,
      isGroupHazard: !!card.isGroupHazard
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
                 DANGER_CARDS[player.currentEra]?.find(c => c.id === modal.cardId) ||
                 Object.values(DANGER_CARDS).flat().find(c => c.id === modal.cardId || c.name === modal.cardName);
    if (!card) return null;

    const diceRoll = rollDie();

    // Group Hazard check (Spanish Danger 1: Bulkang galit)
    if (modal.isGroupHazard || card.isGroupHazard) {
      const groupResults = [];
      this.state.players.forEach(p => {
        const pRoll = (p.id === player.id) ? diceRoll : rollDie();
        let pSafe = (pRoll === 6);
        if (p.sanctuaryShield) {
          pSafe = true;
          p.sanctuaryShield = false;
        } else if (p.shielded) {
          pSafe = true;
          p.shielded = false;
        }

        const isGuardian = (p.roleKey === 'GUARDIAN');
        const loss = pSafe ? 0 : (isGuardian ? 2 : 3);
        if (!pSafe && loss > 0) {
          this.modifyEnergy(p, -loss);
        }
        groupResults.push({
          playerId: p.id,
          playerName: p.name,
          roll: pRoll,
          safe: pSafe,
          energyLoss: loss,
          roleKey: p.roleKey
        });
      });

      const pResult = groupResults.find(r => r.playerId === player.id);
      const success = pResult ? pResult.safe : (diceRoll === 6);

      const updatedModal = {
        ...modal,
        needsRoll: false,
        diceRoll: diceRoll,
        success: success,
        groupResults: groupResults,
        failMsg: success
          ? 'You rolled a 6 and escaped the eruption safely!'
          : `You rolled a ${diceRoll}! Lost ${player.roleKey === 'GUARDIAN' ? '2' : '3'} Energy.`
      };
      this.state.pendingModal = updatedModal;
      this.addLog('danger', `Volcano Eruption resolved! Group rolls: ${groupResults.map(r => `${r.playerName}: [${r.roll}] ${r.safe ? 'Safe' : `-${r.energyLoss}⚡`}`).join(', ')}`);
      this.notify();
      return { diceRoll, success, groupResults };
    }

    const success = typeof card.check === 'function' ? card.check(diceRoll) : true;

    // Guardian passive: reduce numeric Energy/movement/Paradox penalties by 1
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
      failMsg: card.failMsg + (guardianReduction ? ' (Aegis Shield: penalty reduced by 1)' : '')
    };
    this.state.pendingModal = updatedModal;

    if (success) {
      this.addLog('danger', `${player.name}: ${card.name} — Rolled ${diceRoll}! ${card.successMsg}`);
    } else {
      if (typeof card.failEffect === 'function') {
        card.failEffect(player, this, guardianReduction);
      }
      this.addLog('danger', `${player.name}: ${card.name} — Rolled ${diceRoll}! ${card.failMsg}`);
    }

    this.notify();
    return { diceRoll, success };
  }

  // --- Interactive Event Die Roll ---
  rollEventDie(playerIdx) {
    const modal = this.state.pendingModal;
    if (!modal || modal.type !== 'event' || !modal.needsRoll) {
      return null;
    }

    const targetIdx = playerIdx !== undefined ? playerIdx : (modal.playerId !== undefined ? modal.playerId : this.state.currentPlayerIndex);
    const player = this.state.players[targetIdx];
    if (!player) return null;

    const card = (EVENT_CARDS[modal.era] || []).find(c => c.id === modal.cardId || c.name === modal.title || c.name === modal.cardName) ||
                 (EVENT_CARDS[player.currentEra] || []).find(c => c.id === modal.cardId || c.name === modal.title || c.name === modal.cardName) ||
                 Object.values(EVENT_CARDS).flat().find(c => c.id === modal.cardId || c.name === modal.title || c.name === modal.cardName);

    const diceRoll = rollDie();
    const success = (card && typeof card.check === 'function')
      ? card.check(diceRoll)
      : (diceRoll >= 4);

    const updatedModal = {
      ...modal,
      needsRoll: false,
      diceRoll: diceRoll,
      success: success,
      resultText: success
        ? (card?.successMsg || `Rune stones resonated with a roll of ${diceRoll}! Select an Era deck upon continuing.`)
        : (card?.failMsg || `Rune stones remained silent with a roll of ${diceRoll}. Nothing happened.`)
    };

    this.state.pendingModal = updatedModal;
    this.addLog('event', `${player.name}: ${modal.title} — Rolled ${diceRoll}! ${success ? (card?.successMsg || 'Rune resonance achieved!') : (card?.failMsg || 'The runes remained silent.')}`);
    this.notify();
    return { diceRoll, success };
  }

  // --- Artifact Handling (3-Step Displaced Artifact Loop) ---
  handleArtifactTile(player) {
    if (player.completed) {
      this.state.pendingModal = {
        type: 'info',
        title: 'Directive Restored',
        description: `You have already secured #${player.placementRank} Place! Assist remaining castaways via Cooperative Actions (Timeline Stabilization & Energy Trading).`,
        image: null
      };
      this.state.phase = 'action';
      this.notify();
      return;
    }

    const mission = player.mission;
    const missionArtifact = mission ? ALL_ARTIFACTS.find(a => a.id === mission.artifactId) : null;
    const clueCount = (mission && mission.artifactId && player.clueProgress?.[mission.artifactId]) || 0;
    const hasMissionArtifact = player.artifactCards.some(a => a.id === mission?.artifactId);
    const requiredClues = GAME_CONSTANTS.REQUIRED_CLUES_FOR_ARTIFACT || 3;

    // Case 1: Player is already carrying their mission artifact and reached Origin Era -> Restore history!
    if (hasMissionArtifact) {
      if (player.currentEra === mission.originEra) {
        this.returnArtifact(player.id, mission.artifactId);
        return;
      } else {
        this.state.pendingModal = {
          type: 'info',
          title: 'Transporting Relic',
          description: `You are carrying ${mission.artifactNickname}! Return it to its native Origin Era (${ERA_NAMES[mission.originEra]}) to restore history.`,
          image: missionArtifact?.cardImage || missionArtifact?.image
        };
        this.state.phase = 'action';
        this.notify();
        return;
      }
    }

    // Case 2: Attempting to pick up an Artifact before completing Triangulation -> +1 Paradox penalty!
    const isTriangulated = !!(player.triangulation?.impactSighting || clueCount >= requiredClues);
    if (!isTriangulated) {
      this.modifyParadox(player, 1);
      const stepMsg = !player.triangulation?.originAnchor
        ? `You must first discover the Origin Anchor in ${ERA_NAMES[mission?.originEra || player.currentEra]} (Step 1).`
        : !player.triangulation?.riftVector
        ? `You must scan the Rift Vector at a Time Gate (Step 2).`
        : `You must verify local ground sightings in ${ERA_NAMES[mission?.displacedEra || player.currentEra]} (Step 3).`;

      this.addLog('paradox', `⚠️ ${player.name} attempted to access an Artifact without completing Triangulation! Paradox +1! (${clueCount}/${requiredClues} Milestones reached)`);
      this.state.pendingModal = {
        type: 'danger',
        cardType: 'Paradox Strain! ⚠️',
        title: 'TEMPORAL TRIANGULATION INCOMPLETE',
        subtitle: 'INSUFFICIENT HISTORICAL INTEL',
        description: `You attempted to access the Artifact Tile before completing Temporal Triangulation! ${stepMsg} Spacetime destabilized: Individual Paradox +1!`,
        image: 'assets/Tiles/artifact_tile.png',
        era: player.currentEra
      };
      this.state.phase = 'action';
      this.notify();
      return;
    }

    // Case 3: Player has completed Triangulation and is in the Displaced Era -> Phase 2 Retrieval!
    if (mission && player.currentEra === mission.displacedEra) {
      if (missionArtifact) {
        player.artifactCards.push(missionArtifact);
        player.missionPhase = 3;

        this.state.pendingModal = {
          type: 'artifact',
          cardType: 'Displaced Relic Retrieved! 📦',
          title: missionArtifact.name,
          subtitle: 'PHASE 2 COMPLETE: RETRIEVAL',
          description: `You successfully retrieved the ${missionArtifact.nickname} from its displaced location in the ${ERA_NAMES[player.currentEra]}! Now travel via Time Gates to its native Origin Era (${ERA_NAMES[mission.originEra]}) and land on the Artifact/Return Tile to restore history and lock in your FIFO victory rank!`,
          image: missionArtifact.cardImage || missionArtifact.image,
          era: player.currentEra
        };
        this.addLog('mission', `📦 ${player.name} retrieved displaced relic ${missionArtifact.nickname} in ${ERA_NAMES[player.currentEra]}! Returning to ${ERA_NAMES[mission.originEra]}.`);
        this.state.phase = 'action';
        this.notify();
        return;
      }
    }

    // Case 4: Player completed Triangulation but is in the wrong era (not displaced era)
    this.state.pendingModal = {
      type: 'info',
      title: 'Displaced Relic Location',
      description: `Your target relic (${mission?.artifactNickname || 'Relic'}) is displaced in the ${ERA_NAMES[mission?.displacedEra]}! Travel there via Time Gate to retrieve it.`,
      image: missionArtifact?.cardImage || missionArtifact?.image
    };
    this.addLog('artifact', `${player.name} checked the Artifact Tile in ${ERA_NAMES[player.currentEra]}, but their target relic is displaced in ${ERA_NAMES[mission?.displacedEra]}.`);
    this.state.phase = 'action';
    this.notify();
  }

  // --- Temporal Triangulation Helpers ---
  getTriangulationCount(player) {
    if (!player || !player.triangulation) return 0;
    return (player.triangulation.originAnchor ? 1 : 0) +
           (player.triangulation.riftVector ? 1 : 0) +
           (player.triangulation.impactSighting ? 1 : 0);
  }

  processClueTriangulation(player, card, era) {
    if (!player || !player.mission || !player.triangulation) return false;
    if (card.isDecoy) return false;

    const mission = player.mission;
    const currentEra = era || player.currentEra;

    // Step 1: Historical Trace in Origin Era -> Origin Anchor locked!
    // REQUIRES the drawn card to match the player's mission artifact specifically.
    // Only your relic's own historical documentation counts — foreign clue cards fill
    // your hand (trade value) but cannot prove your artifact was here in its native era.
    const isMissionCard = card.artifactId === mission.artifactId;
    if (currentEra === mission.originEra && !player.triangulation.originAnchor) {
      if (!isMissionCard) return false; // Wrong artifact's card — cannot anchor Step 1
      player.triangulation.originAnchor = true;
      card.triangulationStep = 1;

      if (!player.clueProgress[mission.artifactId]) {
        player.clueProgress[mission.artifactId] = 0;
      }
      player.clueProgress[mission.artifactId] = Math.max(player.clueProgress[mission.artifactId], 1);

      this.addLog('mission', `📜 STEP 1 COMPLETE: Origin Anchor Locked! ${player.name} discovered the ${mission.artifactNickname}'s historical archive in ${ERA_NAMES[mission.originEra]}! Next: Head to a Time Gate to scan the Rift Vector!`);
      return true;
    }

    // Step 3: Local Ground Intel in Displaced Era -> Impact Sighting locked!
    // Requires: Origin Anchor + Rift Vector already done, AND you drew ANY non-decoy clue
    // in the displaced era. Thematically: these are "local eyewitness reports" from displaced-era
    // inhabitants who wouldn't know the relic by its historical catalogue name — any field
    // intelligence gathered here confirms the relic's presence in this foreign time period.
    if (currentEra === mission.displacedEra && player.triangulation.originAnchor && player.triangulation.riftVector && !player.triangulation.impactSighting) {
      player.triangulation.impactSighting = true;
      card.triangulationStep = 3;

      if (!player.clueProgress[mission.artifactId]) {
        player.clueProgress[mission.artifactId] = 0;
      }
      player.clueProgress[mission.artifactId] = Math.max(player.clueProgress[mission.artifactId], 3);
      player.missionPhase = 2; // Triangulation complete -> Phase 2: Ready to retrieve relic!

      this.addLog('mission', `🎯 STEP 3 COMPLETE: Triangulation Finished! ${player.name} confirmed a ${mission.artifactNickname} sighting in ${ERA_NAMES[mission.displacedEra]}! Proceed to the Artifact Tile to retrieve it!`);
      return true;
    }

    return false;
  }

  // --- Temporal Triangulation: Chrono-Scan at Time Gate (Step 2) ---
  checkTemporalScan(player) {
    if (!player || !player.mission || !player.triangulation) return false;
    // Step 2: If Origin Anchor is locked and Rift Vector is not yet scanned:
    if (player.triangulation.originAnchor && !player.triangulation.riftVector) {
      player.triangulation.riftVector = true;
      const artId = player.mission.artifactId;
      if (!player.clueProgress[artId]) {
        player.clueProgress[artId] = 0;
      }
      player.clueProgress[artId] = Math.max(player.clueProgress[artId], 2);

      this.addLog('mission', `🌀 STEP 2 COMPLETE: Chrono-Scan Verified! Rift Vector locked: ${player.mission.artifactNickname} was displaced into ${ERA_NAMES[player.mission.displacedEra]}!`);
      
      this.state.pendingModal = {
        type: 'info',
        cardType: 'Chrono-Vortex Triangulation 🌀',
        title: 'RIFT VECTOR SCANNED!',
        subtitle: 'STEP 2 OF 3: TRAJECTORY LOCKED',
        description: `Your Chrono-Device analyzed the portal's residual vortex discharge! The ${player.mission.artifactNickname} was hurled through spacetime into the ${ERA_NAMES[player.mission.displacedEra]}! Warp through this Time Gate to follow ground sightings!`,
        image: 'assets/Tiles/portal_tile.png',
        era: player.currentEra,
        triangulation: { ...player.triangulation }
      };
      this.notify();
      return true;
    }
    return false;
  }

  // --- Time Gate ---
  handleTimeGate(player) {
    this.checkTemporalScan(player);
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


  // Discard a random Clue Card or lose Energy if holding 0 clues (used by Hazard Cards)
  discardRandomClueOrLoseEnergy(player, energyLoss = 2) {
    if (player.clueCards && player.clueCards.length > 0) {
      const randIdx = Math.floor(Math.random() * player.clueCards.length);
      const [discarded] = player.clueCards.splice(randIdx, 1);
      if (discarded && discarded.artifactId && player.clueProgress?.[discarded.artifactId] > 0) {
        player.clueProgress[discarded.artifactId]--;
      }
      this.returnClueToDeck(discarded);
      this.addLog('danger', `⚠️ ${player.name} discarded a Clue Card (${discarded.hint || discarded.description})!`);
    } else {
      this.modifyEnergy(player, -energyLoss);
      this.addLog('danger', `⚠️ ${player.name} held 0 Clue Cards and lost ${energyLoss} Chrono Energy instead!`);
    }
  }

  // Check if carrying an artifact into an era that is neither Displaced Era nor Origin Era
  checkCarriedArtifactContamination(player, targetEra) {
    if (!player.artifactCards || player.artifactCards.length === 0) return;
    for (const art of player.artifactCards) {
      const origin = art.originEra || art.era;
      const displaced = art.displacedEra || player.mission?.displacedEra;
      if (targetEra !== origin && targetEra !== displaced) {
        this.modifyParadox(player, 1);
        this.addLog('paradox', `⚡ ${player.name} brought ${art.nickname || art.name} into ${ERA_NAMES[targetEra]} (neither Displaced Era nor Origin Era)! Individual Paradox +1!`);
        this.state.pendingModal = {
          type: 'danger',
          cardType: 'Era Contamination! ⚠️',
          title: 'TEMPORAL CONTAMINATION',
          description: `You brought ${art.nickname || art.name} into the ${ERA_NAMES[targetEra]}! Since this timeline is neither its Displaced Era (${ERA_NAMES[displaced]}) nor its native Origin Era (${ERA_NAMES[origin]}), spacetime reacted to the contamination: Individual Paradox +1!`,
          image: art.cardImage || art.image,
          era: targetEra
        };
      }
    }
  }

  travelToEra(player, targetEra) {
    const cost = player.roleKey === 'EXPLORER' ? GAME_CONSTANTS.TIME_GATE_COST_EXPLORER : GAME_CONSTANTS.TIME_GATE_COST;
    
    // Check carried artifact contamination before warping
    this.checkCarriedArtifactContamination(player, targetEra);

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
      consequenceDesc = 'CRITICAL TEMPORAL BREACH! Spacetime stability shattered (5/5): Shared Timeline +2, Player Stunned (skips next movement phase), and Paradox reset to Level 2.';
    } else if (triggeredDanger) {
      consequenceDesc = 'ANOMALY TRIGGER! Paradox reached Level 4—an unexpected Danger Card is immediately drawn and resolved!';
    } else if (newParadox >= 3 && oldParadox < 3) {
      consequenceDesc = 'TEMPORAL STRAIN! Paradox reached Level 3—chronal friction drained 2 Chrono Energy!';
    } else if (newParadox >= 2 && oldParadox < 2) {
      consequenceDesc = 'MINOR FRICTION! Paradox reached Level 2—temporal frictions detected on HUD.';
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

    // Clear any passing choices since player is ensnared on this tile
    this.state.pendingChoice = null;

    // Set phase to cardResolution and log trap trigger
    this.state.phase = 'cardResolution';
    gameLogger.action(`Temporal Trap triggered by ${player.name} on ${tile.id}! Trap owner: ${ownerName}`);

    // Queue the tile's main function (Event, Danger, Clue, Time Gate, Paradox, Artifact)
    // so it resolves right after the trap's Danger Card penalty is acknowledged and dismissed
    this.state.queuedTileResolution = {
      playerId: player.id,
      era: player.currentEra,
      tileIndex: player.tileIndex,
      tileId: tile.id
    };

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

    // Level 0-1: Stable (Visual calm aura on HUD)
    // Level 2: Minor Friction (Visual friction on HUD - no point penalty)
    if (player.paradox >= 2 && oldParadox < 2) {
      this.addLog('paradox', `⚡ ${player.name}: Paradox Level 2 (Minor Friction) — Temporal micro-frictions detected!`);
    }

    // Level 3 (Temporal Strain): Lose 2 Energy
    if (player.paradox >= 3 && oldParadox < 3) {
      this.modifyEnergy(player, -2);
      this.addLog('paradox', `⚡ ${player.name}: Paradox Level 3 (Temporal Strain) — Lost 2 Energy!`);
    }

    // Level 4 (Anomaly Trigger): Immediately draw and resolve a Danger Card from the current era
    if (player.paradox >= 4 && oldParadox < 4) {
      triggeredDanger = true;
      this.addLog('paradox', `⚠️ ${player.name}: Paradox Level 4 (Anomaly Trigger) — Chronal rift triggered a Danger Card!`);
      if (!skipDangerModal) {
        this.drawDangerCard(player);
      }
    }

    // Level 5 (Critical Breach): Shared Timeline Meter +2, player is stunned (skips next movement phase), Paradox resets to Level 2
    if (player.paradox >= 5) {
      criticalOverload = true;
      this.modifyTimelineMeter(2);
      player.skipNextTurn = true; // Stunned (skips next movement phase)
      player.paradox = 2; // Resets to Level 2
      this.addLog('paradox', `💥 ${player.name}: CRITICAL BREACH! Timeline Meter +2, Stunned (skips next movement phase), Paradox reset to Level 2!`);
      this.state.pendingModal = {
        type: 'danger',
        cardType: 'Critical Breach 💥',
        title: 'TIMELINE CRITICAL BREACH!',
        description: `${player.name} caused a Critical Breach (Level 5)! Spacetime fractured: Shared Timeline Meter increased by +2, you are Stunned (skip next movement phase), and Individual Paradox reset to Level 2.`,
        image: 'assets/Tiles/paradox_tile.png',
        era: player.currentEra
      };
    }

    return { oldParadox, newParadox: player.paradox, triggeredDanger, criticalOverload };
  }

  modifyTimelineMeter(amount) {
    this.state.timelineMeter = Math.max(0, this.state.timelineMeter + amount);
    
    // Shared Timeline Meter limit is 5. GLOBAL LOSE OVERRIDE: When it surpasses 5 or reaches 6, trigger immediate TIMELINE COLLAPSE!
    const breachLimit = GAME_CONSTANTS.MAX_TIMELINE || 5;
    if (this.state.timelineMeter > breachLimit) {
      this.state.collapseMessage = `TIMELINE COLLAPSE: The shared Timeline Meter surpassed stability limits (reached ${this.state.timelineMeter} > 5)! Spacetime stability shattered completely into total entropy. ALL operatives have lost!`;
      this.addLog('paradox', `💥 TIMELINE COLLAPSE! The timeline breach reached ${this.state.timelineMeter} (surpassed 5)! Catastrophic spacetime collapse!`);
      this.endGame('collapse');
    }
  }

  // --- Temporal Occurrence ---
  // --- Global Temporal Disturbance ("Ay nag-glitch") ---
  activateTemporalGlitch(turns = 2) {
    this.state.temporalGlitchTurns = turns;
    this.state.temporalOccurrence = turns;
    this.state.temporalOccurrenceAnnounced = false;
    this.state.temporalOccurrenceId = 'glitch_' + Date.now();
    this.addLog('temporal', `🌀 Global Temporal Disturbance activated! All card draws randomized across eras for ${turns} rounds.`);
  }

  // --- Spanish Event 3: Marites Network ---
  offerMaritesTrade(player) {
    const eligibleTargets = (this.state.players || []).filter(p => p.id !== player.id && Array.isArray(p.clueCards) && p.clueCards.length > 0);
    if (eligibleTargets.length === 0 || !Array.isArray(player.clueCards) || player.clueCards.length === 0) {
      this.modifyEnergy(player, 2);
      return 'No operatives available for a clue trade. Gained +2 Energy instead!';
    }

    if (player.isAi) {
      const target = eligibleTargets[0];
      const accept = Math.random() < 0.75;
      if (accept) {
        const myCard = player.clueCards.pop();
        const theirCard = target.clueCards.pop();
        if (myCard.artifactId && !myCard.isDecoy) {
          player.clueProgress[myCard.artifactId] = Math.max(0, (player.clueProgress[myCard.artifactId] || 1) - 1);
          target.clueProgress[myCard.artifactId] = (target.clueProgress[myCard.artifactId] || 0) + 1;
        }
        if (theirCard.artifactId && !theirCard.isDecoy) {
          target.clueProgress[theirCard.artifactId] = Math.max(0, (target.clueProgress[theirCard.artifactId] || 1) - 1);
          player.clueProgress[theirCard.artifactId] = (player.clueProgress[theirCard.artifactId] || 0) + 1;
        }
        player.clueCards.push(theirCard);
        target.clueCards.push(myCard);
        return `${player.name} traded clue cards with ${target.name}!`;
      } else {
        this.modifyEnergy(player, 2);
        return `${target.name} declined trade. Gained +2 Energy!`;
      }
    }

    this.state.pendingChoice = {
      type: 'maritesTrade',
      title: 'Marites Network: Clue Card Trade Request',
      playerId: player.id,
      vfxTag: 'whispering_shadow',
      sfxTag: 'fanSnap',
      options: eligibleTargets.map(t => ({
        label: `Request 1-for-1 Clue Trade with ${t.name} (${t.clueCards.length} Clues)`,
        action: `marites_target_${t.id}`
      }))
    };
    return 'Marites Network opened: Select an operative to request a Clue trade!';
  }

  executeMaritesTrade(fromPlayerId, toPlayerId, accept = true) {
    const fromPlayer = this.state.players[fromPlayerId];
    const toPlayer = this.state.players[toPlayerId];
    if (!fromPlayer || !toPlayer) return;

    if (!accept) {
      this.modifyEnergy(fromPlayer, 2);
      this.addLog('event', `${toPlayer.name} denied the trade request. ${fromPlayer.name} gained +2 Energy!`);
      return;
    }

    if (fromPlayer.clueCards?.length > 0 && toPlayer.clueCards?.length > 0) {
      const fromCard = fromPlayer.clueCards.pop();
      const toCard = toPlayer.clueCards.pop();
      if (fromCard.artifactId && !fromCard.isDecoy) {
        fromPlayer.clueProgress[fromCard.artifactId] = Math.max(0, (fromPlayer.clueProgress[fromCard.artifactId] || 1) - 1);
        toPlayer.clueProgress[fromCard.artifactId] = (toPlayer.clueProgress[fromCard.artifactId] || 0) + 1;
      }
      if (toCard.artifactId && !toCard.isDecoy) {
        toPlayer.clueProgress[toCard.artifactId] = Math.max(0, (toPlayer.clueProgress[toCard.artifactId] || 1) - 1);
        fromPlayer.clueProgress[toCard.artifactId] = (fromPlayer.clueProgress[toCard.artifactId] || 0) + 1;
      }
      fromPlayer.clueCards.push(toCard);
      toPlayer.clueCards.push(fromCard);
      this.addLog('event', `🤝 Clue Trade Accepted! ${fromPlayer.name} and ${toPlayer.name} swapped Clue Cards.`);
    } else {
      this.modifyEnergy(fromPlayer, 2);
    }
  }

  // --- American Event 1: Peek Top 3 Clues ("Updated ka dapat dito ah!") ---
  peekTopClues(player, count = 3) {
    const era = player.currentEra;
    const deck = this.state.clueDecks[era] || [];
    const topCards = deck.slice(0, count);
    this.state.pendingModal = {
      type: 'peek_clues',
      cardType: 'Intelligence Peek',
      title: 'Updated ka dapat dito ah!',
      description: `Inspecting top ${topCards.length} Clue Cards of ${ERA_NAMES[era]} without drawing them.`,
      cards: topCards,
      era: era,
      playerId: player.id,
      playerName: player.name,
      vfxTag: 'sepia_ticker_tape',
      sfxTag: 'morseCode'
    };
    this.addLog('event', `${player.name} inspected top ${topCards.length} Clue Cards of ${ERA_NAMES[era]}.`);
    this.state.phase = 'action';
    this.notify();
    return `Inspected top ${topCards.length} Clue Cards of ${ERA_NAMES[era]}!`;
  }

  // --- Japanese Event 1: Secret Chismis ---
  offerSecretChismis(player) {
    const era = player.currentEra;
    const deck = this.state.clueDecks[era] || [];
    if (deck.length === 0) {
      this.drawClueCard(player);
      return 'Acquired classified intelligence!';
    }
    if (player.isAi) {
      const targetCard = deck.find(c => c.artifactId === player.mission?.missionArtifactId) || deck[0];
      const idx = deck.indexOf(targetCard);
      deck.splice(idx, 1);
      player.clueCards.push(targetCard);
      if (targetCard.artifactId && !targetCard.isDecoy) {
        player.clueProgress[targetCard.artifactId] = (player.clueProgress[targetCard.artifactId] || 0) + 1;
      }
      this.state.clueDecks[era] = shuffle(deck);
      return `${player.name} retrieved "${targetCard.title || targetCard.hint}" and shuffled the deck!`;
    }
    this.state.pendingChoice = {
      type: 'secretChismis',
      title: 'Secret Chismis: Select 1 Clue Card',
      era: era,
      playerId: player.id,
      cards: [...deck],
      vfxTag: 'classified_folder',
      sfxTag: 'radioDialStatic',
      options: deck.map((c, i) => ({
        label: `${c.title || c.hint || ('Clue #' + (i + 1))} (${c.isDecoy ? 'Decoy' : 'Valid'})`,
        action: `secret_clue_${i}`
      }))
    };
    return 'Choose 1 classified Clue Card from the remaining deck!';
  }

  executeSecretChismis(playerId, cardIdx) {
    const player = this.state.players[playerId];
    if (!player) return;
    const era = player.currentEra;
    const deck = this.state.clueDecks[era];
    if (!deck || cardIdx < 0 || cardIdx >= deck.length) return;
    const card = deck.splice(cardIdx, 1)[0];
    if (card) {
      player.clueCards.push(card);
      if (card.artifactId && !card.isDecoy) {
        player.clueProgress[card.artifactId] = (player.clueProgress[card.artifactId] || 0) + 1;
      }
      this.state.clueDecks[era] = shuffle(deck);
      this.addLog('event', `${player.name} chose "${card.title || card.hint}" from the deck and shuffled.`);
    }
    this.state.phase = 'action';
    this.notify();
  }

  // --- Japanese Event 4: HIDEous plan ---
  offerHideousPlan(player) {
    this.state.pendingChoice = {
      type: 'hideousPlan',
      title: 'HIDEous plan: Stealth Sanctuary',
      playerId: player.id,
      vfxTag: 'dimmed_spotlight',
      sfxTag: 'trapdoorLatch',
      options: [
        { label: 'Option A: Skip Next 2 Turns -> Restore 10/10 Energy', action: 'hideous_restore_energy' },
        { label: 'Option B: Skip Next 2 Turns -> Reset Paradox to 0', action: 'hideous_reset_paradox' }
      ]
    };
    return 'Offered stealth sanctuary choices: Skip 2 turns to restore Energy or reset Paradox.';
  }

  // --- Myth Event 2: Anito Grab ---
  offerAnitoGrab(player) {
    const canAfford = player.energy >= 2;
    this.state.pendingChoice = {
      type: 'anitoGrab',
      title: 'Anito Grab: Mystical Bargain',
      playerId: player.id,
      vfxTag: 'cyan_spirit_wisps',
      sfxTag: 'spiritWisp',
      options: [
        { label: canAfford ? 'Spend 2 Energy -> Draw 1 Clue Card' : 'Spend 2 Energy (Need at least 2 Energy)', action: canAfford ? 'anito_accept' : 'anito_decline', disabled: !canAfford },
        { label: 'Decline Offer', action: 'anito_decline' }
      ]
    };
    return 'Anito spirits offer an ancient exchange!';
  }

  // --- Myth Event 4: Bato-bato sa langit ---
  offerBatoBato(player, providedRoll) {
    const roll = providedRoll !== undefined ? providedRoll : (this.state.pendingModal?.diceRoll || rollDie());
    if (roll >= 4) {
      if (player.isAi) {
        const targetEra = player.mission?.displacedEra || player.currentEra;
        this.drawClueCardFromEra(player, targetEra);
        return `Rune roll was ${roll}! Drew 1 Clue Card from ${ERA_NAMES[targetEra]}.`;
      }
      this.state.pendingChoice = {
        type: 'batoBatoEra',
        title: `Bato-bato sa langit: Rolled ${roll}! Choose Era Deck`,
        playerId: player.id,
        vfxTag: 'floating_rune_stones',
        sfxTag: 'runeBeam',
        options: ERA_ORDER.map(era => ({
          label: `${ERA_NAMES[era]} Timeline`,
          action: `bato_era_${era}`
        }))
      };
      return `Rune stones resonated with a roll of ${roll}! Select an Era deck.`;
    } else {
      return `Rune stones remained silent with a roll of ${roll}. Nothing happened.`;
    }
  }

  // Draw 1 clue card from a designated era deck
  drawClueCardFromEra(player, era) {
    const deck = this.state.clueDecks[era];
    const faceUp = this.state.faceUpCards?.[era] || [];
    if ((!deck || deck.length === 0) && faceUp.length === 0) {
      this.addLog('system', `No clue cards available in ${ERA_NAMES[era] || era}!`);
      this.state.phase = 'action';
      return;
    }
    // Use face-up display if available (same mechanic as drawClueCard)
    if (faceUp.length > 0) {
      this.state.pendingChoice = {
        type: 'clueDisplay',
        era,
        playerId: player.id,
        options: faceUp.map((c, i) => ({
          cardId: c.id,
          action: `faceup_${c.id}`,
          index: i,
          label: c.isDecoy ? '🎭 Decoy Card' : (c.hint || c.artifactName || 'Clue Card'),
          isDecoy: c.isDecoy,
          artifactId: c.artifactId,
          artifactName: c.artifactName,
          image: c.image,
          isMissionCard: !c.isDecoy && c.artifactId === player.mission?.artifactId,
          card: c
        })),
        canDrawBlind: deck && deck.length > 0,
        returnPhase: 'action'
      };
      this.state.phase = 'action';
      this.notify();
      return;
    }
    // No face-up display — draw blind from deck
    this._drawBlindClueCard(player, era);
  }

  // --- Japanese Danger 3: Inspection Reveal: Kabado ---
  revealAndDiscardMissionClue(player) {
    player.handRevealedUntil = Date.now() + 5000;
    if (Array.isArray(player.clueCards) && player.clueCards.length > 0) {
      const missionArtId = player.mission?.missionArtifactId;
      let targetIdx = player.clueCards.findIndex(c => !c.isDecoy && c.artifactId === missionArtId);
      if (targetIdx === -1) {
        targetIdx = player.clueCards.findIndex(c => !c.isDecoy);
      }
      if (targetIdx === -1) {
        targetIdx = 0;
      }
      const discarded = player.clueCards.splice(targetIdx, 1)[0];
      if (discarded && discarded.artifactId && !discarded.isDecoy) {
        player.clueProgress[discarded.artifactId] = Math.max(0, (player.clueProgress[discarded.artifactId] || 1) - 1);
      }
      this.addLog('danger', `${player.name}'s clue "${discarded.title || discarded.hint}" was confiscated! Hand revealed for 5s.`);
    }
  }

  // --- Myth Danger 3: Scammer na Engkanto ---
  convertClueToDecoy(player) {
    if (Array.isArray(player.clueCards)) {
      const validClue = player.clueCards.find(c => !c.isDecoy);
      if (validClue) {
        validClue.isDecoy = true;
        validClue.title = 'Decoy Clue (Scammed)';
        validClue.hint = "The Engkanto illusion turned this clue into fool's gold!";
        validClue.cardType = 'Decoy Card';
        if (validClue.artifactId) {
          player.clueProgress[validClue.artifactId] = Math.max(0, (player.clueProgress[validClue.artifactId] || 1) - 1);
        }
        this.addLog('danger', `${player.name}'s valid Clue was turned into a Decoy Card by the Engkanto!`);
      }
    }
  }

  activateTemporalOccurrence(turns) {
    const occurrenceId = `occ_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const playerCount = this.state.players?.length || 4;
    this.state.temporalOccurrence = turns * playerCount; // rounds = turns * players
    this.state.temporalOccurrenceId = occurrenceId;
    this.state.temporalOccurrenceAnnounced = false;
    this.state.temporalOccurrenceRounds = turns;
    this.state.temporalOccurrenceInitialTurns = turns * playerCount;
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
      if (this.state.phase !== 'rolling' && this.state.phase !== 'moving') {
        this.addLog('warning', 'Explorer Momentum can be activated before rolling or during your movement!');
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
        // Momentum (Active Ability): Pause movement to interact with a tile, then continue moving remaining rolled spaces (2 Turn CD, 3 Energy Cost)
        if (player.energy < 3) {
          this.addLog('warning', 'Not enough Energy for Momentum! (Requires 3 Energy)');
          return false;
        }
        this.modifyEnergy(player, -3);
        player.usedAbilityThisTurn = true;
        player.activeCooldown = ROLES.EXPLORER.active.cooldown || 2;
        player.bonusMoves = 0;
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
          title: 'MOMENTUM ACTIVATED!',
          subtitle: 'EXPLORER ACTIVE ABILITY (2 Turn CD, 3 Energy Cost)',
          description: `${player.name} activated Momentum! During movement this turn, pause to interact with the tile you are standing on, and then continue moving your remaining rolled spaces!`
        };
        this.addLog('ability', `🏃 ${player.name} activated Momentum (3 Energy Cost)! Can pause and interact with a tile mid-movement, then continue moving.`);
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
          title: 'TEMPORAL TRAP ARMED!',
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
      title: 'REVERSE TIME ACTIVATED!',
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
    if (typeof player.skipNextTurn === 'number' && player.skipNextTurn > 1) {
      player.skipNextTurn--;
      this.addLog('danger', `⛔ ${player.name}'s turn was skipped (${player.skipNextTurn} remaining turn(s) skipped)!`);
    } else {
      player.skipNextTurn = false;
      player.timeStoppedBy = null;
      if (stoppedBy) {
        this.addLog('ability', `⌛ ${player.name} broke free from Temporal Stasis (cast by ${stoppedBy.name})! Turn thawed and passed.`);
      } else {
        this.addLog('danger', `⛔ ${player.name}'s turn was skipped!`);
      }
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

  // Return artifact to correct timeline (FIFO Placement Queue)
  returnArtifact(playerIdx, artifactId) {
    const player = this.state.players[playerIdx];
    if (!player || player.completed) return false;

    const artifact = ALL_ARTIFACTS.find(a => a.id === artifactId);
    if (!artifact) return false;

    const artIdx = player.artifactCards.findIndex(a => a.id === artifactId);
    if (artIdx < 0) return false;

    const originEra = artifact.originEra || artifact.era;

    if (player.currentEra === originEra) {
      // Correct Origin Timeline!
      player.artifactCards.splice(artIdx, 1);
      player.missionComplete = true;
      player.completed = true;
      player.missionPhase = 4;
      player.finishedAt = Date.now();

      // FIFO Placement Queue
      if (!this.state.placementQueue) this.state.placementQueue = [];
      if (!this.state.placementQueue.includes(player.id)) {
        this.state.placementQueue.push(player.id);
      }
      const rank = this.state.placementQueue.length;
      player.placementRank = rank;

      const ordinalStr = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
      this.addLog('mission', `🏆 ${player.name} returned ${artifact.nickname} to ${ERA_NAMES[originEra]} and secured ${ordinalStr} Place!`);

      this.state.pendingModal = {
        type: 'artifact',
        cardType: `FIFO Rank #${rank} Locked In! 🏆`,
        title: `${ordinalStr.toUpperCase()} PLACE SECURED!`,
        description: `Magnificent achievement, ${player.name}! You safely recovered and returned ${artifact.name} (${artifact.nickname}) to the ${ERA_NAMES[originEra]} timeline, locking in ${ordinalStr} Place! You can now spectate or use cooperative actions (Timeline Stabilization & Energy Trading) to help remaining castaways finish before the Timeline Meter surpasses 5 (reaches 6).`,
        image: artifact.cardImage || artifact.image,
        era: originEra
      };

      // Check if all players completed
      if (this.state.players.every(p => p.completed)) {
        this.endGame('allComplete');
      }
    } else {
      // Wrong timeline
      this.modifyParadox(player, 1);
      this.modifyTimelineMeter(1);
      this.addLog('paradox', `${player.name} attempted to return ${artifact.nickname} in the wrong timeline (${ERA_NAMES[player.currentEra]})! Paradox +1, Timeline +1`);

      this.state.pendingModal = {
        type: 'danger',
        cardType: 'Temporal Anomaly! ⚠️',
        title: 'Wrong Era Paradox',
        description: `The ${artifact.nickname} belongs to the ${ERA_NAMES[originEra]}, not the ${ERA_NAMES[player.currentEra]}! Temporal Paradox +1, Shared Timeline Meter +1!`,
        image: artifact.cardImage || artifact.image,
        era: player.currentEra
      };
    }

    this.notify();
    return true;
  }

  // --- Cooperative Actions for Completed Players ---
  coopStabilizeTimeline(playerIdx) {
    const player = this.state.players[playerIdx];
    if (!player || !player.completed) return false;
    if (player.energy < 2) {
      this.addLog('warning', `${player.name} needs at least 2 Energy to stabilize the timeline (has ${player.energy}).`);
      return false;
    }

    this.modifyEnergy(player, -2);
    this.modifyTimelineMeter(-1);
    this.addLog('ability', `🌀 ${player.name} (Rank #${player.placementRank}) stabilized the timeline (-1 Timeline Breach)! Shared Timeline: ${this.state.timelineMeter}/5.`);
    this.notify();
    return true;
  }

  coopTransferEnergy(fromIdx, toIdx, amount = 2) {
    const from = this.state.players[fromIdx];
    const to = this.state.players[toIdx];
    if (!from || !to) return false;
    if (!from.completed) {
      return this.tradeEnergy(fromIdx, toIdx, amount);
    }
    if (to.completed) {
      this.addLog('warning', `${to.name} has already finished their directive.`);
      return false;
    }
    if (from.energy < amount) {
      this.addLog('warning', `${from.name} does not have ${amount} Energy to transfer.`);
      return false;
    }

    this.modifyEnergy(from, -amount);
    this.modifyEnergy(to, amount);
    this.addLog('trade', `⚡ ${from.name} (Rank #${from.placementRank}) transferred ${amount} Chrono Energy to ${to.name}!`);
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

    // Decrease temporal glitch countdown on full round completion
    if (this.state.temporalGlitchTurns > 0 && this.state.currentPlayerIndex === 0) {
      this.state.temporalGlitchTurns--;
      if (this.state.temporalGlitchTurns <= 0) {
        this.addLog('temporal', 'Temporal Disturbance has stabilized. Quadrant era decks restored.');
      }
    }

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
    const playerCount = this.state.players?.length || 1;
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % playerCount;
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
    const activeModal = this.state.pendingModal;
    if (activeModal?.type === 'danger' && activeModal?.needsRoll) {
      this.rollDangerDie(activeModal.playerId);
    }
    if (activeModal?.type === 'event' && activeModal?.needsRoll) {
      this.rollEventDie(activeModal.playerId);
    }

    const wasBatoBato = (activeModal?.type === 'event' && activeModal?.cardId === 'evt_my_4');
    const batoBatoSuccess = wasBatoBato && (activeModal.success || (activeModal.diceRoll >= 4));
    const modalPlayerId = activeModal?.playerId;
    const wasParadoxModal = activeModal?.type === 'paradox';
    const queuedDangerPlayerId = activeModal?.triggerDangerPlayerId;

    this.state.pendingModal = null;

    if (wasParadoxModal && queuedDangerPlayerId !== undefined) {
      const targetPlayer = this.state.players.find(p => p.id === queuedDangerPlayerId);
      if (targetPlayer) {
        this.drawDangerCard(targetPlayer);
        this.notify();
        return;
      }
    }

    if (batoBatoSuccess) {
      const targetPlayer = this.state.players.find(p => p.id === modalPlayerId) || this.state.players[this.state.currentPlayerIndex];
      if (targetPlayer) {
        if (targetPlayer.isAi) {
          const targetEra = targetPlayer.mission?.displacedEra || targetPlayer.currentEra;
          this.drawClueCardFromEra(targetPlayer, targetEra);
        } else {
          this.state.pendingChoice = {
            type: 'batoBatoEra',
            title: `Bato-bato sa langit: Rolled ${activeModal.diceRoll}! Choose Era Deck`,
            playerId: targetPlayer.id,
            vfxTag: 'floating_rune_stones',
            sfxTag: 'runeBeam',
            options: ERA_ORDER.map(era => ({
              label: `${ERA_NAMES[era]} Timeline`,
              action: `bato_era_${era}`
            }))
          };
        }
        this.notify();
        return;
      }
    }

    // If an armed trap ensnared the player on a functional tile (Clue, Event, Danger, Artifact, Time Gate, Paradox),
    // trigger the tile's main function now that the trap hazard has been acknowledged and dismissed.
    if (this.state.queuedTileResolution) {
      const { playerId, era, tileIndex } = this.state.queuedTileResolution;
      this.state.queuedTileResolution = null;
      if (!this.state.gameOver) {
        const targetPlayer = this.state.players.find(p => p.id === playerId);
        if (targetPlayer) {
          const eraTiles = this.state.board[targetPlayer.currentEra || era];
          const tile = eraTiles?.[tileIndex !== undefined ? tileIndex : targetPlayer.tileIndex];
          if (tile) {
            this.resolveTile(targetPlayer, tile);
            this.notify();
            return;
          }
        }
      }
    }

    if (this.state.movesRemaining > 0) {
      this.state.phase = 'moving';
      gameLogger.phase(`Modal dismissed: moves remain (${this.state.movesRemaining}), returning to moving phase`);
    } else {
      this.state.phase = 'action';
      gameLogger.phase('Modal dismissed: 0 moves remaining, phase set to action');
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

  // --- End Game (FIFO Placement Queue & Global Lose Override) ---
  endGame(reason) {
    this.stopTimer();
    this.state.gameOver = true;
    this.state.phase = 'ended';

    if (!this.state.placementQueue) {
      this.state.placementQueue = [];
    }

    // GLOBAL LOSE OVERRIDE: If the shared Timeline Meter surpasses 5 or reaches 6, ALL players lose regardless of rank!
    const isCollapse = reason === 'collapse' || (this.state.timelineMeter > (GAME_CONSTANTS.MAX_TIMELINE || 5));

    if (isCollapse) {
      this.state.winner = null; // Everyone loses!
      this.state.collapseMessage = `TIMELINE COLLAPSE: The shared Timeline Meter surpassed stability limits (reached ${this.state.timelineMeter} > 5)! Spacetime stability shattered completely into total entropy. ALL operatives have lost!`;
      this.addLog('system', '💀 TIMELINE COLLAPSE! Spacetime collapsed and all operatives were lost in the void!');
    } else {
      // Calculate final FIFO rankings
      // 1. Players in placementQueue are already placed in FIFO order
      const placedIds = new Set(this.state.placementQueue);

      // 2. Unfinished players sorted by mission progress:
      //    a. Artifact Acquired (has retrieved artifact > doesn't have)
      //    b. Clues Collected for target artifact (descending)
      //    c. Lowest Paradox (ascending)
      //    d. Energy remaining (descending)
      const unfinishedPlayers = this.state.players.filter(p => !placedIds.has(p.id));
      unfinishedPlayers.sort((a, b) => {
        // Artifact Acquired
        const aHasArt = (a.artifactCards && a.artifactCards.length > 0) ? 1 : 0;
        const bHasArt = (b.artifactCards && b.artifactCards.length > 0) ? 1 : 0;
        if (bHasArt !== aHasArt) return bHasArt - aHasArt;

        // Clues Collected for target artifact
        const aClues = (a.mission && a.clueProgress?.[a.mission.artifactId]) || 0;
        const bClues = (b.mission && b.clueProgress?.[b.mission.artifactId]) || 0;
        if (bClues !== aClues) return bClues - aClues;

        // Lowest Paradox
        if (a.paradox !== b.paradox) return a.paradox - b.paradox;

        // Highest Energy
        return b.energy - a.energy;
      });

      // Append remaining players to placement queue
      unfinishedPlayers.forEach(p => {
        this.state.placementQueue.push(p.id);
        p.placementRank = this.state.placementQueue.length;
      });

      // Synchronize placementRank on all players
      this.state.players.forEach(p => {
        const queueIdx = this.state.placementQueue.indexOf(p.id);
        if (queueIdx >= 0) {
          p.placementRank = queueIdx + 1;
        }
      });

      const winnerPlayer = this.state.players.find(p => p.placementRank === 1);
      this.state.winner = winnerPlayer || this.state.players[0];
      this.addLog('system', `🏆 Operative ${this.state.winner.name} achieved 1st Place!`);
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

// loadState is defined above with automatic rehydration
}

export default GameEngine;
