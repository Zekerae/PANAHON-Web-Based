import React, { useRef, useReducer, useCallback } from 'react';
import './style.css';
import { GameEngine } from './gameEngine.js';
import { NetworkManager } from './network.js';
import { appReducer, initialAppState } from './state/appReducer.js';
import { useGameEngine } from './hooks/useGameEngine.js';
import { useAudio } from './hooks/useAudio.js';
import { useToast } from './hooks/useToast.js';
import { useChat } from './hooks/useChat.js';
import { useNetworkRoom } from './hooks/useNetworkRoom.js';
import { useTurnAutomation } from './hooks/useTurnAutomation.js';

import AppRouter from './components/AppRouter.jsx';
import GuideModal from './components/GuideModal.jsx';
import SupabaseConfigModal from './components/SupabaseConfigModal.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import { CardModal, ChoiceModal, MaximizedCardPreview } from './components/Modals.jsx';

export default function App() {
  const engineRef = useRef(null);
  const networkRef = useRef(null);

  if (!engineRef.current) {
    engineRef.current = new GameEngine();
    networkRef.current = new NetworkManager(engineRef.current);
  }
  const engine = engineRef.current;
  const network = networkRef.current;

  // App Routing & High-level State
  const [appState, dispatch] = useReducer(appReducer, initialAppState);

  // Subsystems & Hooks
  const { toasts, showToast } = useToast();
  const { sounds, soundMuted, toggleSound } = useAudio();
  const { state: gameState, initGame, dismissModal } = useGameEngine(engine);
  const { chatMessages, unreadChatCount, resetUnread } = useChat(network);

  const networkRoom = useNetworkRoom({
    network,
    engine,
    showToast,
    onGameStartSuccess: () => dispatch({ type: 'START_GAME' })
  });

  // Turn Automation (AI Turns and Auto-Movement)
  useTurnAutomation({
    engine,
    network,
    state: gameState,
    onGameOver: () => dispatch({ type: 'GAME_OVER' })
  });

  // Action Handlers
  const handleSelectMode = useCallback((mode) => {
    if (mode === 'solo') {
      dispatch({
        type: 'SET_LOCAL_PLAYERS',
        payload: [
          { name: 'Player 1', roleKey: 'HISTORIAN', type: 'human', difficulty: 'normal' },
          { name: 'Bot Explorer', roleKey: 'EXPLORER', type: 'ai', difficulty: 'normal' },
          { name: 'Bot Guardian', roleKey: 'GUARDIAN', type: 'ai', difficulty: 'normal' },
          { name: 'Bot Strategist', roleKey: 'STRATEGIST', type: 'ai', difficulty: 'normal' }
        ]
      });
      dispatch({ type: 'OPEN_LOBBY', mode: 'local' });
    } else {
      dispatch({ type: 'OPEN_LOBBY', mode });
    }
  }, []);

  const handleStartLocalGame = useCallback(() => {
    const activeSlots = appState.localPlayers.filter((p) => p.type !== 'closed');
    if (activeSlots.length === 0) return;

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
    dispatch({ type: 'START_GAME' });
    showToast('Mission Launched', `${configs.length} castaways ready. Protect the timeline!`, 'success');
  }, [appState.localPlayers, sounds, network, initGame, showToast]);

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

  const titleProps = {
    onSelectMode: handleSelectMode,
    onOpenGuide: () => dispatch({ type: 'OPEN_GUIDE' }),
    onOpenMapEditor: () => dispatch({ type: 'NAVIGATE', screen: 'map-editor' }),
    soundMuted,
    onToggleSound: toggleSound
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
    isConnectingOnline: networkRoom.isConnectingOnline,
    onStartLocal: handleStartLocalGame,
    onConnectOnline: networkRoom.connectOnline,
    onLeaveRoom: networkRoom.leaveRoom,
    onStartOnline: networkRoom.startOnlineGame,
    onBack: () => {
      sounds.btnClick();
      dispatch({ type: 'RETURN_TO_TITLE' });
    },
    onOpenSupabaseConfig: () => dispatch({ type: 'OPEN_SUPABASE_CONFIG' })
  };

  const gameProps = {
    state: gameState,
    engine,
    network,
    soundMuted,
    onToggleSound: toggleSound,
    onOpenGuide: () => dispatch({ type: 'OPEN_GUIDE' }),
    onInspectCard: (cardData) => dispatch({ type: 'SET_MAXIMIZED_CARD', cardData }),
    chatMessages,
    unreadChatCount,
    onResetUnreadChat: resetUnread
  };

  const endgameProps = {
    state: gameState,
    onPlayAgain: handlePlayAgain,
    onBackMenu: () => {
      sounds.btnClick();
      dispatch({ type: 'RETURN_TO_TITLE' });
    }
  };

  return (
    <div className="app-root">
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

      {/* MODAL HOST */}
      {gameState?.pendingModal && (
        <CardModal
          modal={gameState.pendingModal}
          engine={engine}
          network={network}
          onDismiss={dismissModal}
          onMaximize={(cardData) => dispatch({ type: 'SET_MAXIMIZED_CARD', cardData })}
        />
      )}

      {gameState?.pendingChoice && (
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

      {appState.showSupabaseConfig && (
        <SupabaseConfigModal
          onClose={() => dispatch({ type: 'CLOSE_SUPABASE_CONFIG' })}
          onConfigSaved={(ok) => {
            showToast(
              'Supabase Settings',
              ok ? 'Supabase Realtime enabled and ready!' : 'Supabase credentials saved.',
              ok ? 'success' : 'info'
            );
          }}
        />
      )}

      {/* TOAST HOST */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
