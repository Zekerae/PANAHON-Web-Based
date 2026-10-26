import { useEffect, useRef } from 'react';
import { aiController } from '../aiPlayer.js';
import sounds from '../sound.js';

export function useTurnAutomation({ engine, network, state, onGameOver }) {
  const autoMoveTimerRef = useRef(null);
  const gameOverHandledRef = useRef(false);

  const clearAutoMove = () => {
    if (autoMoveTimerRef.current) {
      clearTimeout(autoMoveTimerRef.current);
      autoMoveTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!state || !engine || !network) {
      clearAutoMove();
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

    // Human turns are moved manually by the player (Move Forward button or
    // Spacebar), so no auto-move timer is scheduled here.
    clearAutoMove();

    return () => {
      clearAutoMove();
    };
  }, [state, engine, network, onGameOver]);

  return {
    clearAutoMove
  };
}
