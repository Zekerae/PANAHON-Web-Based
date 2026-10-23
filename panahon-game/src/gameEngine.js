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

    // Scatter players across eras randomly
    const shuffledEras = [...ERA_ORDER].sort(() => Math.random() - 0.5);
    while (shuffledEras.length < playerConfigs.length) {
      shuffledEras.push(...[...ERA_ORDER].sort(() => Math.random() - 0.5));
    }

    // Create players
    const players = playerConfigs.map((config, idx) => {
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
        bonusMoves: 0,
        stranded: false,

        // Skill cooldowns (turns remaining)
        passiveCooldown: 0,
        activeCooldown: 0,
        reverseTimeCooldown: 0,
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
      diceResult: null,
      movesRemaining: 0,
      movementDirection: 'forward', // 'forward' | 'backward'
      momentumActive: false,
      momentumUsedMidTile: false,
      gameTimeRemaining: GAME_CONSTANTS.GAME_TIME_MINUTES * 60, // in seconds
      gameStarted: true,
      gameOver: false,
      winner: null,
      pendingModal: null,
      pendingChoice: null
    };

    this.logEntries = [];
    this.addLog('system', 'Game started! The timeline needs your help.');
    
    // Determine first player by rolling
    this.addLog('system', `${players[0].name} goes first!`);

    this.startTimer();
    this.notify();
    return this.state;
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

    // Check skip turn
    if (player.skipNextTurn) {
      player.skipNextTurn = false;
      this.addLog('player', `${player.name} skips this turn!`);
      this.endTurn();
      return null;
    }

    // Check stranded
    if (player.energy <= 0) {
      player.stranded = true;
    }

    const result = rollDie();
    this.state.diceResult = result;
    this.state.initialRoll = result;
    this.state.stepsTakenThisTurn = 0;
    this.state.hasMovedThisTurn = false;
    this.state.movesRemaining = result + (player.bonusMoves || 0);
    this.state.movementDirection = 'forward';
    if (player.roleKey !== 'EXPLORER' || !this.state.momentumActive) {
      this.state.momentumActive = false;
      this.state.momentumUsedMidTile = false;
    }
    player.bonusMoves = 0;
    this.state.phase = 'moving';

    this.addLog('dice', `${player.name} rolled a ${result}!`);
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
    player.tileIndex = targetIdx;
    eraTiles[targetIdx].players.push(player.id);
    this.state.movesRemaining--;
    this.state.stepsTakenThisTurn = (this.state.stepsTakenThisTurn || 0) + 1;
    this.state.hasMovedThisTurn = true;

    // Check tile interaction
    const tile = eraTiles[targetIdx];
    
    // Check for trap
    if (tile.trap && tile.trap.ownerId !== player.id) {
      this.triggerTrap(player, tile);
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

  // Determine next tile index using custom node-graph connections and approach routing rules
  getNextTileIndex(player, era, currentIdx, dir = 1) {
    const eraTiles = this.state.board[era];
    const total = eraTiles.length;
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
    this.state.movesRemaining--;
    this.state.stepsTakenThisTurn = (this.state.stepsTakenThisTurn || 0) + 1;
    this.state.hasMovedThisTurn = true;

    const tile = eraTiles[newIdx];

    // Check trap
    if (tile.trap && tile.trap.ownerId !== player.id) {
      this.triggerTrap(player, tile);
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
        this.addLog('ability', `${player.name} drew a Decoy Card via Clue Decipher, but discarded it with Decoy Discard!`);
        player.passiveCooldown = ROLES.HISTORIAN.passive.cooldown;
        this.returnClueToDeck(chosenCard);
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
          this.addLog('clue', `${player.name} deciphered and kept a Clue Card: ${chosenCard.hint || 'Mystery Clue'}! (${player.clueCards.length}/5 Clues held)`);
          this.state.phase = returnPhase;
        }
      }
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

        // Check for enemy trap
        if (targetTile.trap && targetTile.trap.ownerId !== player.id) {
          this.triggerTrap(player, targetTile);
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
      cardType: card.isDecoy ? 'Decoy Card' : 'Clue Card',
      title: card.isDecoy ? 'Decoy!' : 'Clue Found!',
      description: card.description,
      image: card.image,
      era: era
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

    this.state.pendingModal = {
      type: 'event',
      cardType: 'Event Card',
      title: card.name,
      description: card.description,
      image: card.image,
      era: era
    };

    const result = card.effect(player, this);
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

    const diceRoll = rollDie();
    const success = card.check(diceRoll);

    // Guardian passive: reduce penalty by 1
    let guardianReduction = false;
    if (!success && player.roleKey === 'GUARDIAN') {
      guardianReduction = true;
    }

    this.state.pendingModal = {
      type: 'danger',
      cardType: 'Danger Card',
      title: `${card.name} (${card.nickname})`,
      description: card.description,
      image: card.image,
      era: era,
      diceRoll,
      success,
      successMsg: card.successMsg,
      failMsg: card.failMsg + (guardianReduction ? ' (Guardian: penalty reduced by 1)' : ''),
      guardianReduction
    };

    if (success) {
      this.addLog('danger', `${player.name}: ${card.name} — Rolled ${diceRoll}. ${card.successMsg}`);
    } else {
      card.failEffect(player, this);
      this.addLog('danger', `${player.name}: ${card.name} — Rolled ${diceRoll}. ${card.failMsg}`);
    }

    this.state.phase = 'action';
    this.notify();
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
    this.modifyParadox(player, 1);
    this.state.pendingModal = {
      type: 'danger',
      title: 'Paradox Zone!',
      description: 'A temporal anomaly distorts the area! Your Paradox Meter increases by 1.',
      image: null
    };
    this.addLog('paradox', `${player.name} entered a Paradox Zone! Paradox +1.`);
    this.state.phase = 'action';
    this.notify();
  }

  // --- Trap ---
  triggerTrap(player, tile) {
    const trapOwner = this.state.players[tile.trap.ownerId];
    this.addLog('trap', `${player.name} triggered ${trapOwner.name}'s trap!`);
    
    // Draw a danger card as penalty
    this.drawDangerCard(player);
    
    // Strategist passive: +1 energy to trap owner
    this.modifyEnergy(trapOwner, 1);
    this.addLog('ability', `${trapOwner.name} gained +1 Energy from Trap Mastery!`);
    
    tile.trap = null;
  }

  // --- Resource Modification ---
  modifyEnergy(player, amount) {
    player.energy = Math.max(0, Math.min(GAME_CONSTANTS.MAX_ENERGY, player.energy + amount));
    if (player.energy <= 0) {
      player.stranded = true;
      this.addLog('warning', `${player.name} is stranded! (0 Energy)`);
    } else {
      player.stranded = false;
    }
  }

  modifyParadox(player, amount) {
    const oldParadox = player.paradox;
    player.paradox = Math.max(0, Math.min(GAME_CONSTANTS.MAX_PARADOX, player.paradox + amount));

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
      this.addLog('paradox', `${player.name}: Paradox Level 4 — Must draw a Danger Card!`);
      this.drawDangerCard(player);
    }
    if (player.paradox >= 5) {
      this.modifyTimelineMeter(2);
      player.points -= 3;
      player.paradox = 2;
      this.addLog('paradox', `${player.name}: CRITICAL BREACH! Timeline +2, -3 Points, Paradox reset to 2!`);
    }
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
    this.state.temporalOccurrence = turns * this.state.players.length; // rounds = turns * players
    this.addLog('temporal', `Temporal Occurrence activated for ${turns} rounds!`);
  }

  // --- Abilities ---
  useActiveAbility(playerIdx) {
    const player = this.state.players[playerIdx];
    if (this.state.currentPlayerIndex !== playerIdx) return false;
    if (player.usedAbilityThisTurn) {
      this.addLog('warning', `${player.name} has already used an ability this turn!`);
      return false;
    }
    if (player.activeCooldown > 0) return false;

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
        // Momentum
        if (player.energy < 2) {
          this.addLog('warning', 'Not enough Energy for Momentum!');
          return false;
        }
        this.modifyEnergy(player, -2);
        player.usedAbilityThisTurn = true;
        player.activeCooldown = ROLES.EXPLORER.active.cooldown;
        this.state.momentumActive = true;
        this.state.momentumUsedMidTile = false;
        this.addLog('ability', `${player.name} activated Momentum! (Manual movement enabled: pause & interact with any space along your path).`);
        break;

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
        currentTile.trap = { ownerId: player.id };
        player.usedAbilityThisTurn = true;
        player.activeCooldown = ROLES.STRATEGIST.active.cooldown;
        this.addLog('ability', `${player.name} planted a Temporal Trap!`);
        break;
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

    this.addLog('action', `${player.name} activated Reverse Time! (-${GAME_CONSTANTS.REVERSE_TIME_COST} Energy, reversing direction to move ${this.state.movesRemaining} spaces backwards)`);
    this.notify();
    return true;
  }

  rest(playerIdx) {
    const player = this.state.players[playerIdx];
    if (this.state.currentPlayerIndex !== playerIdx) return false;

    this.modifyEnergy(player, 3);
    this.addLog('action', `${player.name} rested and recovered 3 Energy.`);
    this.endTurn();
    return true;
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
    if (nextPlayer.passiveCooldown > 0) nextPlayer.passiveCooldown--;
    if (nextPlayer.activeCooldown > 0) nextPlayer.activeCooldown--;
    if (nextPlayer.reverseTimeCooldown > 0) nextPlayer.reverseTimeCooldown--;

    this.state.phase = 'rolling';
    this.state.diceResult = null;
    this.state.initialRoll = null;
    this.state.movesRemaining = 0;
    this.state.stepsTakenThisTurn = 0;
    this.state.hasMovedThisTurn = false;
    this.state.movementDirection = 'forward';
    this.state.momentumActive = false;
    this.state.momentumUsedMidTile = false;
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
    this.state.pendingModal = null;
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
