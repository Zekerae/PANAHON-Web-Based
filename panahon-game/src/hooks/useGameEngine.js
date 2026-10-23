import { useSyncExternalStore, useCallback, useRef } from 'react';

export function useGameEngine(engine) {
  const snapshotRef = useRef(null);
  const lastVersionRef = useRef(-1);

  const subscribe = useCallback((onStoreChange) => {
    if (!engine) return () => {};
    return engine.subscribe(() => {
      onStoreChange();
    });
  }, [engine]);

  const getSnapshot = useCallback(() => {
    if (!engine) return null;
    const currentState = engine.getState();
    if (!currentState) {
      snapshotRef.current = null;
      lastVersionRef.current = -1;
      return null;
    }
    const currentVersion = engine.version || 0;
    if (currentVersion !== lastVersionRef.current || !snapshotRef.current) {
      lastVersionRef.current = currentVersion;
      snapshotRef.current = { ...currentState };
    }
    return snapshotRef.current;
  }, [engine]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Bound Engine Commands
  const initGame = useCallback((playerConfigs) => {
    return engine?.initGame(playerConfigs);
  }, [engine]);

  const rollDice = useCallback(() => {
    return engine?.rollDice();
  }, [engine]);

  const movePlayerStep = useCallback(() => {
    return engine?.movePlayerStep();
  }, [engine]);

  const moveToTile = useCallback((tileId) => {
    return engine?.moveToTile(tileId);
  }, [engine]);

  const useActiveAbility = useCallback((playerIdx) => {
    return engine?.useActiveAbility(playerIdx);
  }, [engine]);

  const interactMomentumTile = useCallback((playerIdx) => {
    return engine?.interactMomentumTile(playerIdx);
  }, [engine]);

  const reverseTime = useCallback((playerIdx) => {
    return engine?.reverseTime(playerIdx);
  }, [engine]);

  const rest = useCallback((playerIdx) => {
    return engine?.rest(playerIdx);
  }, [engine]);

  const returnArtifact = useCallback((playerIdx, artifactId) => {
    return engine?.returnArtifact(playerIdx, artifactId);
  }, [engine]);

  const endTurn = useCallback(() => {
    return engine?.endTurn();
  }, [engine]);

  const resolveChoice = useCallback((choiceIdx) => {
    return engine?.resolveChoice(choiceIdx);
  }, [engine]);

  const dismissModal = useCallback(() => {
    if (!engine?.state) return;
    engine.state.pendingModal = null;
    engine.notify('modal_dismiss');
  }, [engine]);

  const loadState = useCallback((remoteState) => {
    engine?.loadState(remoteState);
  }, [engine]);

  return {
    state,
    engine,
    initGame,
    rollDice,
    movePlayerStep,
    moveToTile,
    useActiveAbility,
    interactMomentumTile,
    reverseTime,
    rest,
    returnArtifact,
    endTurn,
    resolveChoice,
    dismissModal,
    loadState
  };
}
