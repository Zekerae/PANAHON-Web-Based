import { useEffect, useRef } from 'react';
import { aiController } from '../aiPlayer.js';
import sounds from '../sound.js';

export function useTurnAutomation({ engine, network, state, onGameOver, isGameActive = true, simulationSpeed = 1 }) {
  const autoMoveTimerRef = useRef(null);
  const gameOverHandledRef = useRef(false);

  const clearAutoMove = () => {
    if (autoMoveTimerRef.current) {
      clearTimeout(autoMoveTimerRef.current);
      autoMoveTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!state || !engine || !network || !isGameActive) {
      clearAutoMove();
      aiController.stop();
      return;
    }

    // Handle Game Over sound & screen transition
    if (state.gameOver) {
      clearAutoMove();
      if (!gameOverHandledRef.current) {
        gameOverHandledRef.current = true;
        if (state.endReason === 'collapse') {
          sounds.collapse();
        } else {
          sounds.victory();
        }
        if (onGameOver) {
          onGameOver(state);
        }
      }
      return;
    }

    // Reset game over tracker when playing active game
    gameOverHandledRef.current = false;

    // Do not automate turns or move if game is paused
    if (engine.isPaused || state.isPaused) {
      clearAutoMove();
      return;
    }

    // Handle AI turn
    if (aiController.isAiTurn(engine, network)) {
      clearAutoMove();
      const stepDelay = Math.max(260, Math.round(750 / (simulationSpeed || 1)));
      aiController.scheduleAiStep(engine, network, stepDelay);
      return;
    }

    // Handle Auto Movement for Human Turn
    const checkAndTriggerAutoMove = (delayMs) => {
      if (
        state.phase !== 'moving' ||
        state.movesRemaining <= 0 ||
        state.momentumActive ||
        state.pendingModal ||
        state.pendingChoice ||
        !network.isMyTurn(state.currentPlayerIndex)
      ) {
        clearAutoMove();
        return;
      }

      if (autoMoveTimerRef.current) return;

      const isStartOfTurn = !state.hasMovedThisTurn && (!state.stepsTakenThisTurn || state.stepsTakenThisTurn === 0);
      const currentPlayer = state.players?.[state.currentPlayerIndex];
      const canReverseTime = isStartOfTurn &&
        state.movementDirection !== 'backward' &&
        currentPlayer &&
        currentPlayer.reverseTimeCooldown === 0 &&
        currentPlayer.energy >= 3;

      let effectiveDelay = delayMs;
      if (effectiveDelay === undefined) {
        // At start of turn, if player can activate Reverse Time, give a 2.2s decision window so they aren't rushed.
        // Otherwise, standard 650ms initial roll delay, and 380ms for subsequent steps.
        effectiveDelay = isStartOfTurn ? (canReverseTime ? 2200 : 700) : 380;
      }

      autoMoveTimerRef.current = setTimeout(() => {
        autoMoveTimerRef.current = null;
        const cur = engine.getState();
        if (
          cur?.phase === 'moving' &&
          cur.movesRemaining > 0 &&
          !cur.momentumActive &&
          !cur.pendingModal &&
          !cur.pendingChoice &&
          network.isMyTurn(cur.currentPlayerIndex)
        ) {
          sounds.moveStep();
          engine.movePlayerStep();
          network.sendAction({ type: 'MOVE_STEP' });
          checkAndTriggerAutoMove(380);
        }
      }, effectiveDelay);
    };

    checkAndTriggerAutoMove();

    return () => {
      clearAutoMove();
    };
  }, [state, engine, network, onGameOver]);

  return {
    clearAutoMove
  };
}
