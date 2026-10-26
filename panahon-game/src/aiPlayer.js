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

        const isEventOrDanger = state.pendingModal.type === 'event' || state.pendingModal.type === 'danger';
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

      // 4. Rolling Phase (Abilities are strictly used post-movement in Action Phase)
      if (state.phase === 'rolling') {
        // Roll the die
        sounds.diceRoll?.();
        const result = engine.rollDice();
        if (result) {
          network?.sendAction({ type: 'ROLL_DICE', result });
        }
        this.scheduleAiStep(engine, network, 750);
        return;
      }

      // 5. Moving Phase
      if (state.phase === 'moving') {
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
        // A. Check if bot has an artifact matching the current era to return for 5 points!
        const matchingArtifact = player.artifactCards.find(a => a.era === player.currentEra);
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
          } else if (player.roleKey === 'EXPLORER') {
            // Explorer uses Momentum (+2 Bonus Movement steps) post-movement
            if (player.energy >= 2 && Math.random() < 0.6) {
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
      this.scheduleAiStep(engine, network, 700);
      return;
    }

    if (choiceType === 'timeGateTravel') {
      const targetEra = player.mission?.targetEra;
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

    if (choiceType === 'guardianRepair') {
      // Repair paradox if high, otherwise recover energy
      const action = player.paradox >= 2 ? 'reduceEnergy' : 'restoreEnergy';
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
