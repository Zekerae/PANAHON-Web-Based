import { useEffect, useRef } from 'react';
import { aiController } from '../aiPlayer.js';
import sounds from '../sound.js';

export function useTurnAutomation({ engine, network, state, onGameOver, isGameActive = true }) {
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
      aiController.scheduleAiStep(engine, network, 750);
      return;
    }

    // Handle Auto Movement for Human Turn
    const checkAndTriggerAutoMove = (delayMs = 380) => {
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
      }, delayMs);
    };

    checkAndTriggerAutoMove(380);

    return () => {
      clearAutoMove();
    };
  }, [state, engine, network, onGameOver]);

  return {
    clearAutoMove
  };
}
