import React, { useRef, useReducer, useCallback, useEffect, useState } from 'react';
import './style.css';
import { GameEngine } from './gameEngine.js';
import { NetworkManager } from './network.js';
import { saveCustomMap } from './gameData.js';
import { loadMapFromSupabase } from './supabaseClient.js';
import { getActiveSession, saveActiveSession, clearActiveSession, getSavedProfile } from './sessionManager.js';
import { recordMatchCompletion } from './temporalRecords.js';
import { appReducer, initialAppState } from './state/appReducer.js';
import { useGameEngine } from './hooks/useGameEngine.js';
import { useAudio } from './hooks/useAudio.js';
import { useToast } from './hooks/useToast.js';
import { useChat } from './hooks/useChat.js';
import { useNetworkRoom } from './hooks/useNetworkRoom.js';
import { useTurnAutomation } from './hooks/useTurnAutomation.js';
import { aiController } from './aiPlayer.js';

import BootSequence from './components/boot/BootSequence.jsx';
import OrientationPrompt from './components/OrientationPrompt.jsx';
import AppRouter from './components/AppRouter.jsx';
import GuideModal from './components/GuideModal.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import { CardModal, ChoiceModal, MaximizedCardPreview } from './components/Modals.jsx';

export default function App() {
  const engineRef = useRef(null);
  const networkRef = useRef(null);

  if (!engineRef.current) {
    engineRef.current = new GameEngine();
    networkRef.current = new NetworkManager(engineRef.current);
    if (typeof window !== 'undefined') {
      window.engine = engineRef.current;
    }
  }
  const engine = engineRef.current;
  const network = networkRef.current;

  useEffect(() => {
    loadMapFromSupabase().then((cloudMap) => {
      if (cloudMap?.coords) {
        saveCustomMap(
          cloudMap.coords,
          cloudMap.layouts,
          null,
          null,
          cloudMap.connections,
          cloudMap.junctionRules
        );
      }
    });
  }, []);

  // App Routing & High-level State
  const [appState, dispatch] = useReducer(appReducer, initialAppState);
  const [savedSession, setSavedSession] = useState(() => getActiveSession());
  const [isBooted, setIsBooted] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('skipBoot') === 'true' || p.has('modal') || p.has('drawer') || p.has('room') || p.has('join');
    } catch {
      return false;
    }
  });

  // Subsystems & Hooks
  const { toasts, showToast } = useToast();
  const { sounds, soundMuted, toggleSound } = useAudio();
  const { state: gameState, initGame, dismissModal } = useGameEngine(engine);
  const { chatMessages, unreadChatCount, resetUnread } = useChat(network);

  const networkRoom = useNetworkRoom({
    network,
    engine,
    showToast,
    onGameStartSuccess: (opts) => dispatch({ type: 'START_GAME', isSpectator: Boolean(opts?.isSpectator) })
  });

  // Listen for emergency GUI Scale reset shortcut (Alt+0 / Ctrl+0)
  useEffect(() => {
    const handleReset = (e) => {
      showToast('🖥️ GUI Scale Reset', e.detail?.message || 'GUI Scaling reverted to 100% (Default).', 'info');
    };
    window.addEventListener('panahon_gui_scale_reset', handleReset);
    return () => window.removeEventListener('panahon_gui_scale_reset', handleReset);
  }, [showToast]);

  // Auto-save active session during gameplay
  useEffect(() => {
    if (appState.currentScreen === 'game' && gameState && !gameState.gameOver) {
      saveActiveSession({
        mode: network.mode,
        screen: 'game',
        playerConfigs: appState.localPlayers,
        onlineInfo: network.mode === 'online' ? {
          roomCode: network.roomCode,
          playerId: network.playerId,
          playerName: network.myPlayerName,
          roleKey: network.myRoleKey,
          isHost: network.isHost,
          relayType: network.relayType
        } : null,
        gameState
      });
      setSavedSession(getActiveSession());
    }
  }, [gameState, appState.currentScreen, network, appState.localPlayers]);

  // Turn Automation (AI Turns and Auto-Movement - only active when on game screen)
  // Local observed modal state for spectator / other players' card draws
  const [observedModal, setObservedModal] = useState(null);

  useEffect(() => {
    if (gameState?.pendingModal) {
      const activeP = engine?.getCurrentPlayer?.() || gameState.players?.[gameState.currentPlayerIndex];
      const drawingP = (gameState.pendingModal.playerId !== undefined && gameState.players?.[gameState.pendingModal.playerId])
        ? gameState.players[gameState.pendingModal.playerId]
        : activeP;
      const isAi = drawingP?.isAi === true;
      const isSpectator = network.isSpectator;
      const isOnline = network.mode === 'online';
      const isMyCard = !isSpectator && (
        isOnline
          ? (drawingP?.id !== undefined ? drawingP.id === network.playerId : false)
          : (!isAi && activeP?.id === drawingP?.id)
      );

      if (!isMyCard) {
        setObservedModal(prev => ({
          ...gameState.pendingModal,
          drawingPlayer: drawingP,
          _timestamp: (prev?.id === gameState.pendingModal.id && prev?.needsRoll === gameState.pendingModal.needsRoll)
            ? (prev?._timestamp || Date.now())
            : Date.now()
        }));
      } else {
        setObservedModal(null);
      }
    } else {
      setObservedModal(null);
    }
  }, [
    gameState?.pendingModal,
    gameState?.pendingModal?.needsRoll,
    gameState?.pendingModal?.diceRoll,
    gameState?.currentPlayerIndex,
    network?.playerId,
    network?.isSpectator,
    network?.mode
  ]);

  useEffect(() => {
    if (!appState.currentScreen || appState.currentScreen !== 'game' || gameState?.gameOver) {
      setObservedModal(null);
    }
  }, [appState.currentScreen, gameState?.gameOver]);

  useEffect(() => {
    if (engine) {
      engine._hasActivePreview = Boolean(appState.maximizedCardData);
    }
  }, [appState.maximizedCardData, engine]);

  const handleDismissObservedModal = useCallback(() => {
    setObservedModal(null);
    if (engine?.state?.pendingModal) {
      dismissModal();
    }
  }, [engine, dismissModal]);

  const isGameActive = appState.currentScreen === 'game';

  useTurnAutomation({
    engine,
    network,
    state: isGameActive ? gameState : null,
    isGameActive,
    simulationSpeed: appState.simulationSpeed,
    onGameOver: (finalState) => {
      clearActiveSession();
      setSavedSession(null);
      try {
        const prof = getSavedProfile();
        recordMatchCompletion(finalState || engine?.state, prof?.name);
      } catch (err) {
        console.warn('Failed to record match on game over:', err);
      }
      dispatch({ type: 'GAME_OVER' });
    }
  });

  // Action Handlers
  const handleSelectMode = useCallback((mode) => {
    const prof = getSavedProfile();
    networkRoom.setOnlinePlayerName(prof.name);
    networkRoom.setOnlineSelectedRole(prof.roleKey);
    if (mode === 'solo') {
      dispatch({
        type: 'SET_LOCAL_PLAYERS',
        payload: [
          { name: prof.name, roleKey: prof.roleKey, type: 'human', difficulty: 'normal' },
          { name: 'Bot Explorer', roleKey: 'EXPLORER', type: 'ai', difficulty: 'normal' },
          { name: 'Bot Guardian', roleKey: 'GUARDIAN', type: 'ai', difficulty: 'normal' },
          { name: 'Bot Strategist', roleKey: 'STRATEGIST', type: 'ai', difficulty: 'normal' }
        ]
      });
      dispatch({ type: 'OPEN_LOBBY', mode: 'local' });
    } else {
      dispatch({ type: 'SYNC_PROFILE_NAME', payload: prof });
      dispatch({ type: 'OPEN_LOBBY', mode });
    }
  }, [networkRoom]);

  useEffect(() => {
    const onProfileUpdate = (e) => {
      const { name, roleKey } = e.detail || {};
      if (name) {
        networkRoom.setOnlinePlayerName(name);
        dispatch({ type: 'SYNC_PROFILE_NAME', payload: { name, roleKey } });
      }
      if (roleKey) {
        networkRoom.setOnlineSelectedRole(roleKey);
      }
    };
    window.addEventListener('panahon_profile_updated', onProfileUpdate);
    return () => window.removeEventListener('panahon_profile_updated', onProfileUpdate);
  }, [networkRoom]);

  const handleStartLocalGame = useCallback((overrideConfigs, forceSpectator = false) => {
    const configsToUse = overrideConfigs || appState.localPlayers;
    const activeSlots = configsToUse.filter((p) => p.type !== 'closed');
    if (activeSlots.length === 0) return;

    const allAi = activeSlots.every(p => p.type === 'ai');
    const isSpec = Boolean(forceSpectator || allAi);

    sounds.portal();
    network.setMode('local');
    const configs = activeSlots.map((p) => ({
      name: p.name.trim() || 'Castaway',
      roleKey: p.roleKey,
      isLocal: true,
      isAi: p.type === 'ai',
      difficulty: p.difficulty || 'normal'
    }));

    initGame(configs);
    sounds.startBgMusic();
    dispatch({ type: 'START_GAME', isSpectator: isSpec });
    showToast(
      isSpec ? 'Observer Station Active' : 'Mission Launched',
      isSpec ? `Watching AI expedition battle (${configs.length} bots).` : `${configs.length} castaways ready. Protect the timeline!`,
      'success'
    );
  }, [appState.localPlayers, sounds, network, initGame, showToast]);

  const handleStartSpectatorSimulation = useCallback((customConfigs) => {
    const botConfigs = (customConfigs && customConfigs.length >= 2) ? customConfigs : [
      { name: 'Bot Historian', roleKey: 'HISTORIAN', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Explorer', roleKey: 'EXPLORER', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Guardian', roleKey: 'GUARDIAN', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Strategist', roleKey: 'STRATEGIST', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Rogue', roleKey: 'ROGUE', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Chronomancer', roleKey: 'CHRONOMANCER', type: 'ai', difficulty: 'normal' }
    ];
    dispatch({ type: 'SET_LOCAL_PLAYERS', payload: botConfigs });
    handleStartLocalGame(botConfigs, true);
  }, [handleStartLocalGame]);

  const handlePlayAgain = useCallback(() => {
    if (!gameState?.players) return;
    sounds.portal();
    const configs = gameState.players.map((p) => ({
      name: p.name,
      roleKey: p.roleKey,
      isLocal: p.isLocal,
      isAi: p.isAi,
      difficulty: p.difficulty
    }));
    initGame(configs);
    sounds.startBgMusic();
    dispatch({ type: 'START_GAME' });
  }, [gameState, sounds, initGame]);

  const handleReconnect = useCallback(async () => {
    const session = getActiveSession();
    if (!session || !session.gameState) {
      showToast('Session Expired', 'No active game session found.', 'warning');
      setSavedSession(null);
      return;
    }

    sounds.portal();
    if (session.mode === 'online' && session.onlineInfo) {
      showToast('Reconnecting Online', `Reconnecting to Room ${session.onlineInfo.roomCode}...`, 'info');
      engine.loadState(session.gameState);
      try {
        await network.reconnectOnline(session.onlineInfo);
        showToast('Mission Reconnected', `Back in Room ${session.onlineInfo.roomCode}`, 'success');
      } catch (err) {
        showToast('Online Notice', `Connected with cached session: ${err.message}`, 'warning');
      }
    } else {
      network.setMode('local');
      engine.loadState(session.gameState);
      engine.startTimer();
      showToast('Mission Resumed', 'Welcome back to the timeline!', 'success');
    }

    sounds.startBgMusic();
    dispatch({ type: 'START_GAME' });
  }, [engine, network, showToast, sounds]);

  const handleDiscardSession = useCallback(() => {
    clearActiveSession();
    setSavedSession(null);
    showToast('Session Cleared', 'Saved mission discarded.', 'info');
  }, [showToast]);

  const handleSaveAndExit = useCallback(() => {
    sounds.btnClick();
    engine.stopTimer();
    aiController.stop();
    if (engine.state) {
      engine.state.isPaused = true;
      saveActiveSession(engine.state);
    }
    showToast('Mission Saved', 'Progress safely recorded. You can resume anytime!', 'success');
    dispatch({ type: 'RETURN_TO_TITLE' });
    setSavedSession(getActiveSession());
  }, [engine, sounds, showToast]);

  const handleAbandonGame = useCallback(() => {
    sounds.btnClick();
    engine.stopTimer();
    aiController.stop();
    engine.resetGame();
    clearActiveSession();
    setSavedSession(null);
    if (network.mode === 'online') {
      network.leaveRoom();
    }
    showToast('Mission Abandoned', 'Returned to main menu.', 'info');
    dispatch({ type: 'RETURN_TO_TITLE' });
  }, [engine, sounds, network, showToast]);

  const isCurrentSpectator = Boolean(
    appState.isSpectator ||
    networkRoom.isSpectator ||
    network.isSpectator ||
    (gameState?.players?.length > 0 && gameState.players.every(p => p.isAi))
  );

  const titleProps = {
    onSelectMode: handleSelectMode,
    onOpenGuide: () => dispatch({ type: 'OPEN_GUIDE' }),
    onOpenMapEditor: () => dispatch({ type: 'NAVIGATE', screen: 'map-editor' }),
    soundMuted,
    onToggleSound: toggleSound,
    activeSession: savedSession,
    onReconnect: handleReconnect,
    onDiscardSession: handleDiscardSession,
    onReplayIntro: () => setIsBooted(false),
    onStartSpectatorSimulation: handleStartSpectatorSimulation,
    onSpectateOnline: networkRoom.spectateOnline
  };

  const lobbyProps = {
    lobbyMode: appState.lobbyMode,
    setLobbyMode: (mode) => dispatch({ type: 'SET_LOBBY_MODE', mode }),
    localPlayers: appState.localPlayers,
    setLocalPlayers: (players) => dispatch({ type: 'SET_LOCAL_PLAYERS', payload: players }),
    onlinePlayerName: networkRoom.onlinePlayerName,
    setOnlinePlayerName: networkRoom.setOnlinePlayerName,
    onlineSelectedRole: networkRoom.onlineSelectedRole,
    setOnlineSelectedRole: networkRoom.setOnlineSelectedRole,
    onlineRoomCodeInput: networkRoom.onlineRoomCodeInput,
    setOnlineRoomCodeInput: networkRoom.setOnlineRoomCodeInput,
    network,
    currentRoomPlayers: networkRoom.currentRoomPlayers,
    spectators: networkRoom.spectators,
    isSpectator: isCurrentSpectator,
    canSpectatePrompt: networkRoom.canSpectatePrompt,
    isConnectingOnline: networkRoom.isConnectingOnline,
    onStartLocal: handleStartLocalGame,
    onStartSpectatorSimulation: handleStartSpectatorSimulation,
    onConnectOnline: networkRoom.connectOnline,
    onSpectateOnline: networkRoom.spectateOnline,
    onAcceptCanSpectate: networkRoom.acceptCanSpectate,
    onDismissCanSpectatePrompt: networkRoom.dismissCanSpectatePrompt,
    onLeaveRoom: networkRoom.leaveRoom,
    onStartOnline: networkRoom.startOnlineGame,
    onBack: () => {
      sounds.btnClick();
      dispatch({ type: 'RETURN_TO_TITLE' });
    },
  };

  const gameProps = {
    state: gameState,
    engine,
    network,
    isSpectator: isCurrentSpectator,
    spectators: networkRoom.spectators,
    simulationSpeed: appState.simulationSpeed,
    onChangeSimulationSpeed: (speed) => dispatch({ type: 'SET_SIMULATION_SPEED', payload: speed }),
    soundMuted,
    onToggleSound: toggleSound,
    onOpenGuide: () => dispatch({ type: 'OPEN_GUIDE' }),
    onInspectCard: (cardData) => dispatch({ type: 'SET_MAXIMIZED_CARD', cardData }),
    chatMessages,
    unreadChatCount,
    onResetUnreadChat: resetUnread,
    onSaveAndExit: handleSaveAndExit,
    onAbandonGame: handleAbandonGame
  };

  const endgameProps = {
    state: gameState,
    isSpectator: isCurrentSpectator,
    onPlayAgain: handlePlayAgain,
    onBackMenu: () => {
      sounds.btnClick();
      engine.stopTimer();
      aiController.stop();
      engine.resetGame();
      dispatch({ type: 'RETURN_TO_TITLE' });
    }
  };

  if (!isBooted) {
    return <BootSequence onComplete={() => setIsBooted(true)} />;
  }

  return (
    <div className="app-root">
      {/* Mobile Portrait Orientation Lock Prompt */}
      <OrientationPrompt />
      <AppRouter
        currentScreen={appState.currentScreen}
        titleProps={titleProps}
        lobbyProps={lobbyProps}
        gameProps={gameProps}
        endgameProps={endgameProps}
        mapEditorProps={{
          onClose: () => dispatch({ type: 'RETURN_TO_TITLE' })
        }}
      />

      {/* MODAL HOST - ONLY RENDERED DURING ACTIVE GAMEPLAY */}
      {isGameActive && gameState?.pendingModal && !observedModal && (
        <CardModal
          modal={gameState.pendingModal}
          engine={engine}
          network={network}
          onDismiss={dismissModal}
          onMaximize={(cardData) => dispatch({ type: 'SET_MAXIMIZED_CARD', cardData })}
        />
      )}

      {isGameActive && observedModal && (
        <CardModal
          modal={observedModal}
          engine={engine}
          network={network}
          onDismiss={handleDismissObservedModal}
          onMaximize={(cardData) => dispatch({ type: 'SET_MAXIMIZED_CARD', cardData })}
        />
      )}

      {isGameActive && !gameState?.pendingModal && !observedModal && gameState?.pendingChoice && (
        <ChoiceModal
          choice={gameState.pendingChoice}
          engine={engine}
          network={network}
          onDismiss={() => {
            if (engine.state) {
              engine.state.pendingChoice = null;
              engine.notify('choice_dismiss');
            }
          }}
          onMaximize={(cardData) => dispatch({ type: 'SET_MAXIMIZED_CARD', cardData })}
        />
      )}

      {appState.maximizedCardData && (
        <MaximizedCardPreview
          data={appState.maximizedCardData}
          onClose={() => dispatch({ type: 'SET_MAXIMIZED_CARD', cardData: null })}
        />
      )}

      {appState.showGuide && (
        <GuideModal onClose={() => dispatch({ type: 'CLOSE_GUIDE' })} />
      )}

      {/* TOAST HOST */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
