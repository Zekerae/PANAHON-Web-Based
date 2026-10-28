import gameLogger from './utils/debugLogger.js';
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

  stop() {
    this.clearTimer();
    this.isActing = false;
  }

  // Determine if AI should be acting right now
  isAiTurn(engine, network) {
    const state = engine?.state;
    if (!state || state.gameOver || state.isPaused || engine?.isPaused || engine?._isModalHovered || engine?._hasActivePreview) return false;

    const currentPlayer = engine.getCurrentPlayer();
    if (!currentPlayer || !currentPlayer.isAi) return false;

    // In online mode, only the host drives the AI bots to keep synchronization intact
    if (network?.mode === 'online' && !network.isHost) {
      return false;
    }

    return true;
  }

  // Trigger next AI step with natural pacing
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
    if (!this.isAiTurn(engine, network)) {
      this.clearTimer();
      return;
    }

    const state = engine.state;
    const player = engine.getCurrentPlayer();
    if (!state || !player) return;

    try {
      // 1. Pending Modal (e.g. Event, Danger, Clue or Relic card drawn)
      if (state.pendingModal) {
        if (!state.pendingModal._shownAt) {
          state.pendingModal._shownAt = Date.now();
        }

        // If observer is actively hovering to read or inspecting preview, wait politely
        if (engine?._isModalHovered || engine?._hasActivePreview) {
          this.scheduleAiStep(engine, network, 600);
          return;
        }

        // If danger card requires survival die roll, let bot roll interactively
        if (state.pendingModal.type === 'danger' && state.pendingModal.needsRoll) {
          const elapsed = Date.now() - state.pendingModal._shownAt;
          if (elapsed < 850) {
            this.scheduleAiStep(engine, network, 850 - elapsed);
            return;
          }
          sounds.diceRoll?.();
          const res = engine.rollDangerDie(player.id);
          network?.sendAction({ type: 'ROLL_DANGER_DIE', playerIdx: player.id });
          if (res?.success) {
            sounds.artifact?.();
          } else {
            sounds.danger?.();
          }
          state.pendingModal._shownAt = Date.now();
          this.scheduleAiStep(engine, network, 1200);
          return;
        }

        // If event card requires die roll (e.g. Bato-bato sa langit), let bot roll interactively
        if (state.pendingModal.type === 'event' && state.pendingModal.needsRoll) {
          const elapsed = Date.now() - state.pendingModal._shownAt;
          if (elapsed < 850) {
            this.scheduleAiStep(engine, network, 850 - elapsed);
            return;
          }
          sounds.diceRoll?.();
          const res = engine.rollEventDie(player.id);
          network?.sendAction({ type: 'ROLL_EVENT_DIE', playerIdx: player.id });
          if (res?.success) {
            sounds.runeBeam?.() || sounds.artifact?.();
          }
          state.pendingModal._shownAt = Date.now();
          this.scheduleAiStep(engine, network, 1200);
          return;
        }

        const isEventOrDanger = state.pendingModal.type === 'event' || state.pendingModal.type === 'danger' || state.pendingModal.type === 'paradox';
        const speed = engine.simulationSpeed || 1;
        // Give 6.0 seconds for Event / Danger cards and 4.2s for Clues so human players and observers can comfortably read
        const requiredDuration = isEventOrDanger
          ? Math.max(2800, Math.round(6000 / speed))
          : Math.max(2000, Math.round(4200 / speed));
        const elapsed = Date.now() - state.pendingModal._shownAt;

        if (elapsed < requiredDuration) {
          // Keep modal displayed for the full duration
          this.scheduleAiStep(engine, network, requiredDuration - elapsed);
          return;
        }

        gameLogger.ai(`${player.name} dismissed pending modal`);
        engine.dismissModal();
        network?.sendAction({ type: 'DISMISS_MODAL' });
        this.scheduleAiStep(engine, network, 450);
        return;
      }

      // 2. Pending Choice (e.g. Artifact stop, Time Gate pass, Decipher)
      if (state.pendingChoice) {
        if (!state.pendingChoice._shownAt) {
          state.pendingChoice._shownAt = Date.now();
        }
        const speed = engine.simulationSpeed || 1;
        const choiceDuration = Math.max(2000, Math.round(4200 / speed));
        const elapsed = Date.now() - state.pendingChoice._shownAt;

        if (elapsed < choiceDuration) {
          this.scheduleAiStep(engine, network, choiceDuration - elapsed);
          return;
        }

        this.handleAiChoice(engine, network, state.pendingChoice, player);
        return;
      }

      // 3. Card Resolution Phase (safeguard)
      if (state.phase === 'cardResolution') {
        if (state.pendingModal) {
          if (!state.pendingModal._shownAt) {
            state.pendingModal._shownAt = Date.now();
          }
          const speed = engine.simulationSpeed || 1;
          const requiredDuration = Math.max(2800, Math.round(6000 / speed));
          const elapsed = Date.now() - state.pendingModal._shownAt;
          if (elapsed < requiredDuration) {
            this.scheduleAiStep(engine, network, requiredDuration - elapsed);
            return;
          }
          engine.dismissModal();
          network?.sendAction({ type: 'DISMISS_MODAL' });
        } else {
          engine.state.phase = 'action';
        }
        this.scheduleAiStep(engine, network, 450);
        return;
      }

      // Cooperative Action handling for completed players
      if (player.completed) {
        if (state.phase === 'rolling' || state.phase === 'action') {
          if (state.timelineMeter >= 3 && player.energy >= 2) {
            sounds.portal?.();
            engine.coopStabilizeTimeline(player.id);
            network?.sendAction({ type: 'COOP_STABILIZE_TIMELINE', playerIdx: player.id });
            this.scheduleAiStep(engine, network, 800);
            return;
          }
          const activeTeammate = state.players.find(p => !p.completed && p.energy < 3);
          if (activeTeammate && player.energy >= 3) {
            sounds.btnClick?.();
            engine.coopTransferEnergy(player.id, activeTeammate.id, 2);
            network?.sendAction({ type: 'COOP_TRANSFER_ENERGY', fromIdx: player.id, toIdx: activeTeammate.id, amount: 2 });
            this.scheduleAiStep(engine, network, 800);
            return;
          }
          if (player.energy < 3) {
            sounds.btnClick?.();
            engine.rest(player.id);
            network?.sendAction({ type: 'REST', playerIdx: player.id });
            this.scheduleAiStep(engine, network, 800);
            return;
          }
          sounds.turnChange?.();
          engine.endTurn();
          network?.sendAction({ type: 'END_TURN' });
          this.scheduleAiStep(engine, network, 600);
          return;
        }
      }

      // 4. Rolling Phase (Abilities are strictly used post-movement in Action Phase)
      if (state.phase === 'rolling') {
        // If turn is skipped due to hazard penalty, bot skips turn without rolling!
        if (player.skipNextTurn) {
          sounds.danger?.();
          engine.skipPlayerTurn(player.id);
          network?.sendAction({ type: 'SKIP_TURN', playerIdx: player.id });
          this.scheduleAiStep(engine, network, 900);
          return;
        }

        // If exhausted (0 Energy), bot cannot roll the die; bot must Rest to recover energy!
        if (player.energy <= 0 || player.stranded) {
          sounds.btnClick?.();
          engine.rest(player.id);
          network?.sendAction({ type: 'REST', playerIdx: player.id });
          this.scheduleAiStep(engine, network, 800);
          return;
        }

        // Explorer Active Ability: Momentum (Pause movement to interact with a tile, then continue moving remaining spaces)
        if (
          player.roleKey === 'EXPLORER' &&
          !player.usedAbilityThisTurn &&
          (!player.activeCooldown || player.activeCooldown <= 0) &&
          player.energy >= 3 &&
          !state.momentumActive &&
          Math.random() < 0.75
        ) {
          sounds.portal?.();
          const used = engine.useActiveAbility(player.id);
          if (used) {
            network?.sendAction({ type: 'USE_ABILITY', playerIdx: player.id });
            this.scheduleAiStep(engine, network, 800);
            return;
          }
        }

        // Roll the die
        sounds.diceRoll?.();
        gameLogger.ai(`${player.name} is executing dice roll`);
        const result = engine.rollDice();
        if (result) {
          network?.sendAction({ type: 'ROLL_DICE', result });
        }
        this.scheduleAiStep(engine, network, 750);
        return;
      }

      // 5. Moving Phase
      if (state.phase === 'moving') {
        // Chronomancer Temporal Foresight: Smart +1 / -1 adjustment
        if (
          player.roleKey === 'CHRONOMANCER' &&
          player.temporalForesightCooldown === 0 &&
          !player.hasUsedForesightThisTurn &&
          (state.stepsTakenThisTurn || 0) === 0
        ) {
          const eraTiles = state.board[player.currentEra] || [];
          const dir = state.movementDirection === 'backward' ? -1 : 1;
          const moves = state.movesRemaining;
          let bestDelta = 0;
          if (moves < 6) {
            const nextIdx = (player.tileIndex + dir * (moves + 1) + eraTiles.length) % eraTiles.length;
            const targetTile = eraTiles[nextIdx];
            if (targetTile?.type === 'clue' || targetTile?.type === 'artifact') bestDelta = 1;
          }
          if (bestDelta === 0 && moves > 1) {
            const prevIdx = (player.tileIndex + dir * (moves - 1) + eraTiles.length) % eraTiles.length;
            const targetTile = eraTiles[prevIdx];
            if (targetTile?.type === 'clue' || targetTile?.type === 'artifact') bestDelta = -1;
          }
          if (bestDelta !== 0) {
            engine.adjustTemporalForesight(state.currentPlayerIndex, bestDelta);
            network?.sendAction({ type: 'ADJUST_FORESIGHT', playerIdx: state.currentPlayerIndex, delta: bestDelta });
            this.scheduleAiStep(engine, network, 600);
            return;
          }
        }
        // Explorer Momentum: Pause and interact with mid-movement tile if valuable
        if (state.momentumActive && !state.momentumUsedMidTile && state.movesRemaining > 0) {
          const currentTile = state.board[player.currentEra]?.[player.tileIndex];
          if (currentTile && (currentTile.type === 'clue' || currentTile.type === 'event' || currentTile.type === 'artifact')) {
            sounds.portal?.();
            const interacted = engine.interactMomentumTile(player.id);
            if (interacted) {
              network?.sendAction({ type: 'INTERACT_MOMENTUM', playerIdx: player.id });
              this.scheduleAiStep(engine, network, 650);
              return;
            }
          }
        }

        if (state.movesRemaining > 0) {
          sounds.moveStep?.();
          const ok = engine.movePlayerStep();
          if (ok) {
            network?.sendAction({ type: 'MOVE_STEP' });
          }
          this.scheduleAiStep(engine, network, 450);
          return;
        } else {
          // Moves completed, advance phase to action
          engine.state.phase = 'action';
          this.scheduleAiStep(engine, network, 400);
          return;
        }
      }

      // 6. Action Phase
      if (state.phase === 'action') {
        // A. Check if bot has an artifact matching the current era to return!
        const matchingArtifact = player.artifactCards.find(a => (a.originEra || a.era) === player.currentEra);
        if (matchingArtifact) {
          sounds.victory?.();
          engine.returnArtifact(player.id, matchingArtifact.id);
          network?.sendAction({ type: 'RETURN_ARTIFACT', playerIdx: player.id, artifactId: matchingArtifact.id });
          this.scheduleAiStep(engine, network, 750);
          return;
        }

        // B. Use Role Active Ability if available and strategically useful
        if (!player.usedAbilityThisTurn && player.activeCooldown === 0 && player.energy >= (player.role?.active?.energyCost || 0)) {
          let shouldCast = false;

          if (player.roleKey === 'GUARDIAN') {
            const highParadoxTeammate = state.players.find(p => p.paradox >= 3 && !p.shielded);
            if (player.paradox >= 2 || highParadoxTeammate) {
              shouldCast = true;
            }
          } else if (player.roleKey === 'HISTORIAN') {
            if (player.energy >= 3) {
              shouldCast = true;
            }
          } else if (player.roleKey === 'STRATEGIST') {
            const currentTile = state.board[player.currentEra][player.tileIndex];
            if (currentTile.type === TILE_TYPES.CLUE || currentTile.type === TILE_TYPES.ARTIFACT) {
              shouldCast = true;
            }
          } else if (player.roleKey === 'ROGUE') {
            const targets = state.players.filter(p => p.id !== player.id && p.currentEra === player.currentEra && Math.abs(p.tileIndex - player.tileIndex) <= 2);
            if (targets.length > 0 && player.energy >= 2) {
              shouldCast = true;
            }
          } else if (player.roleKey === 'CHRONOMANCER') {
            const enemies = state.players.filter(p => p.id !== player.id && !p.skipNextTurn);
            if (enemies.length > 0 && player.energy >= 3) {
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
        gameLogger.ai(`${player.name} finished turn, calling endTurn()`);
        engine.endTurn();
        network?.sendAction({ type: 'END_TURN' });
        this.scheduleAiStep(engine, network, 750);
        return;
      }

      // 7. Safety Watchdog: If in any unrecognized or intermediate phase during bot turn, recover safely
      engine.state.phase = 'action';
      this.scheduleAiStep(engine, network, 500);
    } catch (err) {
      console.warn('AI Controller encountered an error, attempting recovery:', err);
      try {
        if (engine.state.pendingChoice) {
          engine.resolveChoice('continueMoving');
        } else if (engine.state.pendingModal) {
          engine.dismissModal();
        } else {
          engine.endTurn();
        }
      } catch (recoverErr) {
        console.error('AI recovery fallback failed:', recoverErr);
      }
      this.scheduleAiStep(engine, network, 1000);
    }
  }

  // Handle decisions when presented with choices
  handleAiChoice(engine, network, choice, player) {
    const choiceType = choice.type;

    if (choiceType === 'artifactStop') {
      // Stop if player has clues or mission matches
      const hasClues = (player.clueProgress && Object.keys(player.clueProgress).length > 0);
      const action = hasClues ? 'stopForArtifact' : 'continueMoving';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'timeGatePass') {
      const targetEra = player.missionPhase === 2
        ? player.mission?.displacedEra
        : (player.mission?.originEra || player.mission?.targetEra);
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
      this.scheduleAiStep(engine, network, 700);
      return;
    }

    if (choiceType === 'timeGateTravel') {
      const targetEra = player.missionPhase === 2
        ? player.mission?.displacedEra
        : (player.mission?.originEra || player.mission?.targetEra);
      const dest = (targetEra && targetEra !== player.currentEra) ? targetEra : 'stay';
      engine.resolveChoice(dest);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action: dest });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'historianDecipher') {
      // Pick first mystery clue card
      const action = 'pick_0';
      sounds.btnClick?.();
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'clueHandLimit') {
      const drawnCard = choice.drawnCard;
      const missionArtifactId = player.mission?.artifactId;
      let chosenAction = 'discard_drawn';

      if (drawnCard && !drawnCard.isDecoy) {
        // Discard a decoy in hand first if any
        const decoyIdx = player.clueCards.findIndex(c => c.isDecoy);
        if (decoyIdx !== -1) {
          chosenAction = `discard_hand_${decoyIdx}`;
        } else if (drawnCard.artifactId === missionArtifactId) {
          // If drawn matches mission, discard a non-mission card
          const nonMissionIdx = player.clueCards.findIndex(c => c.artifactId !== missionArtifactId);
          if (nonMissionIdx !== -1) {
            chosenAction = `discard_hand_${nonMissionIdx}`;
          }
        }
      }

      sounds.btnClick?.();
      engine.resolveChoice(chosenAction);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action: chosenAction });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'roguePickpocket') {
      const options = choice.options || [];
      const clueOption = options.find(o => o.action.startsWith('steal_clue_'));
      const action = clueOption ? clueOption.action : (options[0]?.action || 'continue');
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'chronomancerTimeStop') {
      const options = choice.options || [];
      const action = options[0]?.action || 'continue';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'guardianRepair') {
      // Repair paradox if high, otherwise recover energy
      const action = player.paradox >= 2 ? 'reduceEnergy' : 'restoreEnergy';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'maritesTrade') {
      const options = choice.options || [];
      const action = options[0]?.action || 'continue';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'secretChismis') {
      const options = choice.options || [];
      const action = options[0]?.action || 'secret_clue_0';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'hideousPlan') {
      const action = player.paradox >= 3 ? 'hideous_reset_paradox' : 'hideous_restore_energy';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'anitoGrab') {
      const action = (player.energy >= 4 && (player.clueCards?.length || 0) < 3) ? 'anito_accept' : 'anito_decline';
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'batoBatoEra') {
      const targetEra = player.mission?.displacedEra || player.currentEra || 'spanish';
      const action = 'bato_era_' + targetEra;
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'eventChoice') {
      const options = choice.options || [];
      const best = options[0]?.action || 'drawClue';
      engine.resolveChoice(best);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action: best });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    if (choiceType === 'teleportTile') {
      const tiles = choice.tiles || choice.options || [];
      const artifactTile = tiles.find(t => t.type === 'artifact');
      const clueTiles = tiles.filter(t => t.type === 'clue');
      const safeTiles = tiles.filter(t => t.type !== 'danger' && t.type !== 'paradox');

      let picked = null;
      if (artifactTile && player.clueCards?.length >= 3) {
        picked = artifactTile;
      } else if (clueTiles.length > 0) {
        picked = clueTiles[Math.floor(Math.random() * clueTiles.length)];
      } else if (safeTiles.length > 0) {
        picked = safeTiles[Math.floor(Math.random() * safeTiles.length)];
      } else {
        picked = tiles[0];
      }

      const action = picked?.action || `teleport_${picked?.index || 0}`;
      sounds.btnClick?.();
      sounds.portal?.();
      engine.resolveChoice(action);
      network?.sendAction({ type: 'RESOLVE_CHOICE', action });
      this.scheduleAiStep(engine, network, 650);
      return;
    }

    // Default fallback: choose first available option
    const firstAction = choice.options?.[0]?.action || 'continueMoving';
    engine.resolveChoice(firstAction);
    network?.sendAction({ type: 'RESOLVE_CHOICE', action: firstAction });
    this.scheduleAiStep(engine, network, 650);
  }
}

export const aiController = new AiController();
