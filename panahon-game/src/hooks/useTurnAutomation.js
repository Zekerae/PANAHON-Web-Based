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

  const currentPlayer = state?.players?.[currentPlayerIndex];
  const roleKey = currentPlayer?.roleKey;
  const energy = currentPlayer?.energy || 0;
  const reverseTimeCooldown = currentPlayer?.reverseTimeCooldown || 0;
  const temporalForesightCooldown = currentPlayer?.temporalForesightCooldown || 0;
  const hasUsedForesightThisTurn = Boolean(currentPlayer?.hasUsedForesightThisTurn);

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

      const canReverseTime = isStartOfTurn &&
        movementDirection !== "backward" &&
        currentPlayer &&
        reverseTimeCooldown === 0 &&
        energy >= 3;

      const canUseForesight = isStartOfTurn &&
        roleKey === "CHRONOMANCER" &&
        temporalForesightCooldown <= 0 &&
        !hasUsedForesightThisTurn;

      // CRITICAL: At the start of movement, if the human player has pre-movement decisions available
      // (e.g. Chronomancer's Temporal Foresight to adjust dice roll +/- 1, or Reverse Time to move backward),
      // DO NOT auto-move! Wait for player to decide and click an ability or confirm movement.
      if (isStartOfTurn && (canReverseTime || canUseForesight)) {
        clearAutoMove();
        return;
      }

      let effectiveDelay = delayMs;
      if (effectiveDelay === undefined) {
        effectiveDelay = isStartOfTurn
          ? 700
          : Math.max(180, Math.round(380 / (simulationSpeed || 1)));
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
          const stepSpeed = Math.max(180, Math.round(380 / (simulationSpeed || 1)));
          checkAndTriggerAutoMove(stepSpeed);
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
    roleKey,
    energy,
    reverseTimeCooldown,
    temporalForesightCooldown,
    hasUsedForesightThisTurn,
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
