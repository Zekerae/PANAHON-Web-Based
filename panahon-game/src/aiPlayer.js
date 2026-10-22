// ===== PANAHON: CHRONO SHIFT - AI Player Controller (Warcraft III Style Bot Brain) =====

import { ROLES, TILE_TYPES, ERA_ORDER, ERA_NAMES } from './gameData.js';
import { sounds } from './sound.js';

class AiController {
  constructor() {
    this.timer = null;
    this.isActing = false;
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // Determine if AI should be acting right now
  isAiTurn(engine, network) {
    const state = engine?.state;
    if (!state || state.gameOver) return false;

    const currentPlayer = engine.getCurrentPlayer();
    if (!currentPlayer || !currentPlayer.isAi) return false;

    // In online mode, only the host drives the AI bots to keep synchronization intact
    if (network?.mode === 'online' && !network.isHost) {
      return false;
    }

    return true;
  }

  // Trigger next AI step with a natural human-perceivable pacing
  scheduleAiStep(engine, network, delay = 800) {
    if (!this.isAiTurn(engine, network)) {
      this.clearTimer();
      return;
    }

    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.executeAiStep(engine, network);
    }, delay);
  }

  executeAiStep(engine, network) {
    if (!this.isAiTurn(engine, network)) return;

    const state = engine.state;
    const player = engine.getCurrentPlayer();
    if (!state || !player) return;

    // 1. Pending Modal (e.g. Card drawn)
    if (state.pendingModal) {
      // Allow players to view what the bot drew, then auto-dismiss
      engine.dismissModal();
      network?.sendAction({ type: 'DISMISS_MODAL' });
      this.scheduleAiStep(engine, network, 600);
      return;
    }

    // 2. Pending Choice (e.g. Artifact stop, Time Gate pass, Decipher)
    if (state.pendingChoice) {
      this.handleAiChoice(engine, network, state.pendingChoice, player);
      return;
    }

    // 3. Rolling Phase
    if (state.phase === 'rolling') {
      // Explorer AI: consider activating Momentum pre-roll if energy is good
      if (
        player.roleKey === 'EXPLORER' &&
        player.activeCooldown === 0 &&
        !player.usedAbilityThisTurn &&
        player.energy >= 3 &&
        Math.random() < 0.45
      ) {
        sounds.btnClick?.();
        engine.useActiveAbility(player.id);
        network?.sendAction({ type: 'USE_ABILITY', playerIdx: player.id });
        this.scheduleAiStep(engine, network, 600);
        return;
      }

      // Roll the die
      sounds.diceRoll?.();
      const result = engine.rollDice();
      if (result) {
        network?.sendAction({ type: 'ROLL_DICE', result });
      }
      this.scheduleAiStep(engine, network, 800);
      return;
    }

    // 4. Moving Phase
    if (state.phase === 'moving' && state.movesRemaining > 0) {
      sounds.moveStep?.();
      const ok = engine.movePlayerStep();
      if (ok) {
        network?.sendAction({ type: 'MOVE_STEP' });
      }
      this.scheduleAiStep(engine, network, 500);
      return;
    }

    // 5. Action Phase
    if (state.phase === 'action') {
      // A. Check if bot has an artifact matching the current era to return for 5 points!
      const matchingArtifact = player.artifactCards.find(a => a.era === player.currentEra);
      if (matchingArtifact) {
        sounds.victory?.();
        engine.returnArtifact(player.id, matchingArtifact.id);
        network?.sendAction({ type: 'RETURN_ARTIFACT', playerIdx: player.id, artifactId: matchingArtifact.id });
        this.scheduleAiStep(engine, network, 800);
        return;
      }

      // B. Use Role Active Ability if available and strategically useful
      if (!player.usedAbilityThisTurn && player.activeCooldown === 0 && player.energy >= (player.role?.active?.energyCost || 0)) {
        let shouldCast = false;

        if (player.roleKey === 'GUARDIAN') {
          // Cast shield if paradox is getting high, or on teammate with high paradox
          const highParadoxTeammate = state.players.find(p => p.paradox >= 3 && !p.shielded);
          if (player.paradox >= 2 || highParadoxTeammate) {
            shouldCast = true;
          }
        } else if (player.roleKey === 'HISTORIAN') {
          // Decipher clues if we have enough energy
          if (player.energy >= 3) {
            shouldCast = true;
          }
        } else if (player.roleKey === 'STRATEGIST') {
          // Place trap if on a valuable clue or artifact space
          const currentTile = state.board[player.currentEra][player.tileIndex];
          if (currentTile.type === TILE_TYPES.CLUE || currentTile.type === TILE_TYPES.ARTIFACT) {
            shouldCast = true;
          }
        }

        if (shouldCast) {
          sounds.portal?.();
          const used = engine.useActiveAbility(player.id);
          if (used) {
            network?.sendAction({ type: 'USE_ABILITY', playerIdx: player.id });
            this.scheduleAiStep(engine, network, 700);
            return;
          }
        }
      }

      // C. If low on energy or stranded, rest
      if (player.energy <= 0 || player.stranded) {
        sounds.btnClick?.();
        engine.rest(player.id);
        network?.sendAction({ type: 'REST', playerIdx: player.id });
        this.scheduleAiStep(engine, network, 700);
        return;
      }

      // D. Finish Turn
      sounds.btnClick?.();
      engine.endTurn();
      network?.sendAction({ type: 'END_TURN' });
      this.scheduleAiStep(engine, network, 800);
    }
  }

  // Handle decisions when presented with choices
  handleAiChoice(engine, network, choice, player) {
    const choiceType = choice.type;

    if (choiceType === 'artifactStop') {
      // Stop if player has clues or mission matches
      const tile = engine.state.board[player.currentEra][player.tileIndex];
      const hasClues = (player.clueProgress && Object.keys(player.clueProgress).length > 0);
      const action = hasClues ? 'stopForArtifact' : 'continueMoving';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 700);
      return;
    }

    if (choiceType === 'timeGatePass') {
      const targetEra = player.mission?.targetEra;
      const cost = player.roleKey === 'EXPLORER' ? 1 : 2;

      // If mission points to another era and we have energy to warp, do it!
      if (targetEra && targetEra !== player.currentEra && player.energy >= cost) {
        const action = `warp_${targetEra}`;
        sounds.portal?.();
        engine.resolveChoice(action);
        network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      } else {
        engine.resolveChoice('continueMoving');
        network?.sendAction({ type: 'RESOLVE_CHOICE', action: 'continueMoving' });
      }
      this.scheduleAiStep(engine, network, 800);
      return;
    }

    if (choiceType === 'historianDecipher') {
      // Pick mystery card
      const action = 'pick_0';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 700);
      return;
    }

    if (choiceType === 'guardianRepair') {
      // Repair paradox if high, otherwise recover energy
      const action = player.paradox >= 2 ? 'reduceEnergy' : 'restoreEnergy';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 700);
      return;
    }

    if (choiceType === 'eventChoice') {
      const options = choice.options || [];
      const best = options[0]?.action || 'drawClue';
      engine.resolveChoice(best);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action: best });
      this.scheduleAiStep(engine, network, 700);
      return;
    }

    // Default fallback: choose first available option
    const firstAction = choice.options?.[0]?.action || 'continueMoving';
    engine.resolveChoice(firstAction);
    network?.sendAction({ type: 'RESOLVE_CHOICE', action: firstAction });
    this.scheduleAiStep(engine, network, 700);
  }
}

export const aiController = new AiController();
