// ===== PANAHON: CHRONO SHIFT - GAME DIAGNOSTICS & RECOVERY SUITE =====
// Inspects active game state, detects blockers (e.g. why End Turn is disabled or missing),
// provides system telemetry snapshots, and performs safe turn/phase unstick recoveries.

import gameLogger from './debugLogger.js';

export function analyzeEndTurnStatus(engine, network) {
  const state = engine?.state;
  if (!state) {
    return {
      canEndTurn: false,
      isMyTurn: false,
      phase: 'unknown',
      blockers: ['No active game state detected.']
    };
  }

  const isMyTurn = Boolean(network ? network.isMyTurn(state.currentPlayerIndex) : true);
  const currentPlayer = engine.getCurrentPlayer ? engine.getCurrentPlayer() : state.players?.[state.currentPlayerIndex];
  const phase = state.phase || 'unknown';
  const movesRemaining = state.movesRemaining || 0;
  const pendingModal = state.pendingModal || null;
  const pendingChoice = state.pendingChoice || null;
  const isPaused = Boolean(state.isPaused || engine?.isPaused);
  const gameOver = Boolean(state.gameOver);

  const blockers = [];

  if (gameOver) {
    blockers.push('Game is already over.');
  }

  if (isPaused) {
    blockers.push('Game is currently paused.');
  }

  if (!isMyTurn) {
    const ownerName = currentPlayer?.name || `Player #${state.currentPlayerIndex + 1}`;
    const myId = network?.playerId !== undefined ? network.playerId : 'Local';
    blockers.push(`Not your turn. Turn belongs to: ${ownerName} (P#${state.currentPlayerIndex}, your ID is ${myId}).`);
  }

  if (phase !== 'action') {
    if (phase === 'rolling') {
      blockers.push("Movement dice has not been rolled yet (Phase is 'rolling').");
    } else if (phase === 'moving') {
      blockers.push(`Movement phase is still active (${movesRemaining} step(s) remaining).`);
    } else if (phase === 'cardResolution') {
      blockers.push("Resolving drawn card/tile event (Phase is 'cardResolution').");
    } else {
      blockers.push(`Game is in '${phase}' phase instead of 'action' phase.`);
    }
  }

  if (pendingModal) {
    blockers.push(`A modal is open: [${pendingModal.type || 'Card'}] "${pendingModal.title || pendingModal.cardName || 'Pending Event'}". Dismiss it to continue.`);
  }

  if (pendingChoice) {
    blockers.push(`A decision is pending: "${pendingChoice.title || pendingChoice.type}". Select an option to proceed.`);
  }

  return {
    canEndTurn: blockers.length === 0,
    isMyTurn,
    phase,
    movesRemaining,
    stepsTaken: state.stepsTakenThisTurn || 0,
    currentPlayer,
    pendingModal,
    pendingChoice,
    blockers
  };
}

export function getSystemSnapshot(engine, network) {
  const state = engine?.state;
  const currentP = engine?.getCurrentPlayer ? engine.getCurrentPlayer() : null;

  return {
    timestamp: new Date().toISOString(),
    network: network ? {
      mode: network.mode,
      roomCode: network.roomCode,
      playerId: network.playerId,
      isHost: network.isHost,
      isSpectator: network.isSpectator,
      relayType: network.relayType,
      playersCount: network.players?.length || 0
    } : { mode: 'local' },
    engine: state ? {
      turnNumber: state.turnNumber,
      currentPlayerIndex: state.currentPlayerIndex,
      activePlayer: currentP ? {
        id: currentP.id,
        name: currentP.name,
        roleKey: currentP.roleKey,
        isAi: currentP.isAi,
        isLocal: currentP.isLocal,
        energy: currentP.energy,
        paradox: currentP.paradox,
        points: currentP.points,
        skipNextTurn: currentP.skipNextTurn,
        timeStoppedBy: currentP.timeStoppedBy
      } : null,
      phase: state.phase,
      movesRemaining: state.movesRemaining,
      diceResult: state.diceResult,
      isPaused: Boolean(state.isPaused || engine.isPaused),
      gameOver: Boolean(state.gameOver),
      hasPendingModal: Boolean(state.pendingModal),
      modalType: state.pendingModal?.type || null,
      hasPendingChoice: Boolean(state.pendingChoice),
      choiceType: state.pendingChoice?.type || null,
      timelineMeter: state.timelineMeter
    } : null
  };
}

export function unstickGame(engine, network, actionType) {
  if (!engine) return { success: false, message: 'Game Engine not available.' };
  const state = engine.state;
  if (!state) return { success: false, message: 'Game State not available.' };

  gameLogger.warn(`Emergency Unstick triggered: [${actionType}]`, getSystemSnapshot(engine, network));

  switch (actionType) {
    case 'forceEndTurn': {
      // Safely end current turn and advance to next player
      state.movesRemaining = 0;
      state.pendingModal = null;
      state.pendingChoice = null;
      engine?.endTurn?.();

      if (network && network.mode === 'online') {
        network.sendAction({ type: 'END_TURN' });
        if (network.isHost) {
          network.broadcastState(engine?.getState?.());
        }
      }
      gameLogger.turn('⚡ Force End Turn executed by user diagnostics tool.');
      return { success: true, message: 'Turn was forcefully passed to the next player.' };
    }

    case 'forceActionPhase': {
      // Re-enable action phase if player is stuck after movement or tile interaction
      state.movesRemaining = 0;
      state.phase = 'action';
      state.momentumActive = false;
      state.momentumUsedMidTile = false;
      engine?.notify?.();

      if (network && network.mode === 'online' && network.isHost) {
        network.broadcastState(engine?.getState?.());
      }
      gameLogger.phase(state.phase, 'action', { reason: 'Force Action Phase Diagnostic Override' });
      return { success: true, message: "Game phase reset to 'action'. The End Turn button is now visible!" };
    }

    case 'dismissStuckModals': {
      // Clear lingering modals or choices
      state.pendingModal = null;
      state.pendingChoice = null;
      if (state.movesRemaining <= 0) {
        state.phase = 'action';
      }
      engine?.notify?.();

      if (network && network.mode === 'online') {
        network.sendAction({ type: 'DISMISS_MODAL' });
      }
      gameLogger.action('Dismiss Stuck Modals Override', engine.getCurrentPlayer(), {});
      return { success: true, message: 'All pending modal cards and choice prompts were cleared.' };
    }

    case 'wakeAi': {
      // Wake up AI bot if stalled
      if (engine._isModalHovered) engine._isModalHovered = false;
      if (engine._hasActivePreview) engine._hasActivePreview = false;
      state.isPaused = false;
      engine.isPaused = false;
      engine?.notify?.();
      gameLogger.ai('Waking AI Bot brain and clearing pause/hover locks.', {});
      return { success: true, message: 'AI controller awakened and modal/hover locks released.' };
    }

    case 'requestSync': {
      // Resync state across network
      if (network && network.mode === 'online') {
        if (network.isHost) {
          network.broadcastState(engine?.getState?.());
          gameLogger.netSend('STATE_UPDATE (Host Diagnostic Force Broadcast)', {});
          return { success: true, message: 'Host state re-broadcast to all connected peers.' };
        } else {
          network.sendAction({ type: 'REQUEST_SYNC' });
          gameLogger.netSend('REQUEST_SYNC (Guest Diagnostic Sync Request)', {});
          return { success: true, message: 'Requested full state synchronization from Host.' };
        }
      }
      return { success: true, message: 'Game is running locally (no network sync required).' };
    }

    default:
      return { success: false, message: `Unknown diagnostic action: ${actionType}` };
  }
}
