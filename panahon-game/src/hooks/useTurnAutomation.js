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

  const isPhaseMoving = state?.phase === "moving";
  const movesRemaining = state?.movesRemaining || 0;
  const currentPlayerIndex = state?.currentPlayerIndex;
  const isPaused = Boolean(engine?.isPaused || state?.isPaused);
  const gameOver = Boolean(state?.gameOver);
  const endReason = state?.endReason;
  const momentumActive = Boolean(state?.momentumActive);
  const hasPendingModal = Boolean(state?.pendingModal);
  const hasPendingChoice = Boolean(state?.pendingChoice);
  const movementDirection = state?.movementDirection;
  const hasMovedThisTurn = Boolean(state?.hasMovedThisTurn);
  const stepsTakenThisTurn = state?.stepsTakenThisTurn || 0;

  useEffect(() => {
    if (!state || !engine || !network || !isGameActive) {
      clearAutoMove();
      aiController.stop();
      return;
    }

    // Handle Game Over sound & screen transition
    if (gameOver) {
      clearAutoMove();
      if (!gameOverHandledRef.current) {
        gameOverHandledRef.current = true;
        if (endReason === "collapse") {
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
    if (isPaused) {
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
        !isPhaseMoving ||
        movesRemaining <= 0 ||
        momentumActive ||
        hasPendingModal ||
        hasPendingChoice ||
        !network.isMyTurn(currentPlayerIndex)
      ) {
        clearAutoMove();
        return;
      }

      if (autoMoveTimerRef.current) return;

      const isStartOfTurn = !hasMovedThisTurn && stepsTakenThisTurn === 0;
      const currentPlayer = state.players?.[currentPlayerIndex];
      const canReverseTime = isStartOfTurn &&
        movementDirection !== "backward" &&
        currentPlayer &&
        currentPlayer.reverseTimeCooldown === 0 &&
        currentPlayer.energy >= 3;

      let effectiveDelay = delayMs;
      if (effectiveDelay === undefined) {
        effectiveDelay = isStartOfTurn ? (canReverseTime ? 2200 : 700) : 380;
      }

      autoMoveTimerRef.current = setTimeout(() => {
        autoMoveTimerRef.current = null;
        const cur = engine.getState();
        if (
          cur?.phase === "moving" &&
          cur.movesRemaining > 0 &&
          !cur.momentumActive &&
          !cur.pendingModal &&
          !cur.pendingChoice &&
          network.isMyTurn(cur.currentPlayerIndex)
        ) {
          sounds.moveStep();
          engine.movePlayerStep();
          network.sendAction({ type: "MOVE_STEP" });
          checkAndTriggerAutoMove(380);
        }
      }, effectiveDelay);
    };

    checkAndTriggerAutoMove();

    return () => {
      clearAutoMove();
    };
  }, [
    isPhaseMoving,
    movesRemaining,
    currentPlayerIndex,
    isPaused,
    gameOver,
    endReason,
    momentumActive,
    hasPendingModal,
    hasPendingChoice,
    movementDirection,
    hasMovedThisTurn,
    stepsTakenThisTurn,
    isGameActive,
    simulationSpeed,
    engine,
    network,
    onGameOver
  ]);

  return {
    clearAutoMove
  };
}
