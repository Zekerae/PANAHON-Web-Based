import React, { useState, useCallback, memo } from 'react';
import sounds from '../sound.js';
import ChatBox from './ChatBox.jsx';
import GameHeader from './game/GameHeader.jsx';
import PlayerSidebar from './game/PlayerSidebar.jsx';
import GameBoard from './game/GameBoard.jsx';
import GameActions from './game/GameActions.jsx';
import PlayerHand from './game/PlayerHand.jsx';
import PauseModal from './PauseModal.jsx';

function GameScreen({
  state,
  engine,
  network,
  soundMuted,
  onToggleSound,
  onOpenGuide,
  onInspectCard,
  chatMessages,
  unreadChatCount,
  onResetUnreadChat,
  onSaveAndExit,
  onAbandonGame
}) {
  const [activeHandTab, setActiveHandTab] = useState('mission');
  const [inspectedPlayerId, setInspectedPlayerId] = useState(null);
  const [isGameChatOpen, setIsGameChatOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [mobileGameTab, setMobileGameTab] = useState("board");
  const [isPaused, setIsPaused] = useState(false);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    if (engine) {
      engine.isPaused = false;
      engine.startTimer();
    }
  }, [engine]);

  const handleOpenPause = useCallback(() => {
    setIsPaused(true);
    if (engine) {
      engine.isPaused = true;
      engine.stopTimer();
    }
  }, [engine]);

  // Global ESC key handler
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isGameChatOpen) {
          setIsGameChatOpen(false);
          return;
        }
        if (isPaused) {
          handleResume();
        } else {
          handleOpenPause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, isGameChatOpen, handleResume, handleOpenPause]);

  if (!state || !engine) return null;

  const currentPlayer = engine.getCurrentPlayer();
  const timelineLevel = state.timelineMeter;
  const isOnline = network.mode === 'online';
  const isAiCurrent = currentPlayer?.isAi === true;
  const isMyTurn = !isAiCurrent && (!isOnline || currentPlayer.id === network.playerId);

  const myPlayer = isOnline
    ? (state.players.find(p => p.id === network.playerId) || currentPlayer)
    : currentPlayer;

  const viewedPlayer = (inspectedPlayerId !== null
    ? state.players.find(p => p.id === inspectedPlayerId)
    : null) || myPlayer;

  const isViewingSelf = viewedPlayer.id === myPlayer.id || !isOnline;

  let timelineClass = 'safe';
  if (timelineLevel >= 4) timelineClass = 'danger';
  else if (timelineLevel >= 2) timelineClass = 'warning';

  const minutes = typeof state.gameTimeRemaining === 'number' ? Math.floor(state.gameTimeRemaining / 60) : 15;
  const seconds = typeof state.gameTimeRemaining === 'number' ? state.gameTimeRemaining % 60 : 0;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Actions
  const handleRollDice = useCallback(() => {
    if (isRolling || state.phase !== 'rolling' || !isMyTurn) return;
    setIsRolling(true);
    sounds.diceRoll();

    setTimeout(() => {
      if (engine.state.phase === 'rolling') {
        const result = engine.rollDice();
        if (result) {
          network.sendAction({ type: 'ROLL_DICE', result });
        }
      }
      setIsRolling(false);
    }, 600);
  }, [isRolling, state.phase, isMyTurn, engine, network]);

  // Spacebar shortcut to roll dice
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }
      if (e.code === 'Space' || e.key === ' ') {
        if (state?.phase === 'rolling' && isMyTurn && !isRolling && !isPaused) {
          e.preventDefault();
          handleRollDice();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state?.phase, isMyTurn, isRolling, isPaused, handleRollDice]);

  const handleStepMove = useCallback(() => {
    if (state.phase !== 'moving' || state.movesRemaining <= 0 || !isMyTurn) return;
    sounds.moveStep();
    const ok = engine.movePlayerStep();
    if (ok) {
      network.sendAction({ type: 'MOVE_STEP' });
    }
  }, [state.phase, state.movesRemaining, isMyTurn, engine, network]);

  const handleMoveToTile = useCallback((tileId) => {
    if (state.pendingChoice?.type === 'teleportTile' && isMyTurn) {
      const [targetEra, targetIdxStr] = tileId.split('_');
      const targetIdx = parseInt(targetIdxStr, 10);
      if (targetEra === (state.pendingChoice.targetEra || 'myth')) {
        sounds.btnClick();
        sounds.portal();
        engine.resolveChoice(`teleport_${targetIdx}`);
        network.sendAction({ type: 'RESOLVE_CHOICE', action: `teleport_${targetIdx}` });
        return;
      }
    }
    if (state.phase !== 'moving' || state.movesRemaining <= 0 || !isMyTurn) return;
    const ok = engine.moveToTile(tileId);
    if (ok) {
      sounds.moveStep();
      network.sendAction({ type: 'MOVE_TO_TILE', targetTileId: tileId });
    }
  }, [state.phase, state.movesRemaining, state.pendingChoice, isMyTurn, engine, network]);

  const handleTriggerMomentum = useCallback(() => {
    if (state.phase !== 'rolling' && state.phase !== 'moving') return;
    sounds.btnClick();
    const ok = engine.useActiveAbility(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'USE_ABILITY', playerIdx: state.currentPlayerIndex });
    }
  }, [state.phase, state.currentPlayerIndex, engine, network]);

  const handleInteractMomentum = useCallback(() => {
    sounds.btnClick();
    const ok = engine.interactMomentumTile(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'INTERACT_MOMENTUM', playerIdx: state.currentPlayerIndex });
    }
  }, [state.currentPlayerIndex, engine, network]);

  const handleReverseTime = useCallback(() => {
    if (state.phase === 'moving' || !isMyTurn) return;
    sounds.portal();
    const ok = engine.reverseTime(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'REVERSE_TIME', playerIdx: state.currentPlayerIndex });
    }
  }, [state.phase, state.currentPlayerIndex, isMyTurn, engine, network]);

  const handleRest = useCallback(() => {
    if (state.phase === 'moving' || !isMyTurn) return;
    sounds.btnClick();
    engine.rest(state.currentPlayerIndex);
    network.sendAction({ type: 'REST', playerIdx: state.currentPlayerIndex });
  }, [state.phase, state.currentPlayerIndex, isMyTurn, engine, network]);

  const handleUseSkill = useCallback(() => {
    if (state.phase === 'moving' || !isMyTurn) return;
    sounds.btnClick();
    engine.useActiveAbility(state.currentPlayerIndex);
    network.sendAction({ type: 'USE_ABILITY', playerIdx: state.currentPlayerIndex });
  }, [state.phase, state.currentPlayerIndex, isMyTurn, engine, network]);

  const handleReturnArtifact = useCallback(() => {
    if (state.phase !== 'action' || !isMyTurn) return;
    const matchingArt = currentPlayer.artifactCards.find(a => a.era === currentPlayer.currentEra);
    if (matchingArt) {
      sounds.artifact();
      engine.returnArtifact(state.currentPlayerIndex, matchingArt.id);
      network.sendAction({ type: 'RETURN_ARTIFACT', playerIdx: state.currentPlayerIndex, artifactId: matchingArt.id });
    }
  }, [state.phase, isMyTurn, currentPlayer, state.currentPlayerIndex, engine, network]);

  const handleEndTurn = useCallback(() => {
    if (state.phase !== 'action' || !isMyTurn) return;
    sounds.btnClick();
    engine.endTurn();
    network.sendAction({ type: 'END_TURN' });
    if (network.isHost) {
      network.broadcastState(engine.getState());
    }
  }, [state.phase, isMyTurn, engine, network]);

  const toggleChat = useCallback(() => {
    sounds.btnClick();
    setIsGameChatOpen(prev => {
      const next = !prev;
      if (next) onResetUnreadChat();
      return next;
    });
  }, [onResetUnreadChat]);

  return (
    <div className="game-screen">
      {/* 1. HEADER */}
      <GameHeader
        timelineLevel={timelineLevel}
        timelineClass={timelineClass}
        timerStr={timerStr}
        turnNumber={state.turnNumber}
        onOpenGuide={onOpenGuide}
        onOpenPause={handleOpenPause}
      />

      {/* 2. LEFT PANEL: PLAYER DOSSIERS & COMMS */}
      <PlayerSidebar
        players={state.players}
        currentPlayerIndex={state.currentPlayerIndex}
        viewedPlayerId={viewedPlayer.id}
        isOnline={isOnline}
        myPlayerId={network.playerId}
        onSelectPlayer={(playerId) => setInspectedPlayerId(playerId)}
        unreadChatCount={unreadChatCount}
        onToggleChat={toggleChat}
        isChatOpen={isGameChatOpen}
      />

      {/* 3. CENTER: FOUR QUADRANTS GAME BOARD */}
      <GameBoard
        board={state.board}
        players={state.players}
        currentPlayer={currentPlayer}
        phase={state.phase}
        movesRemaining={state.movesRemaining}
        movementDirection={state.movementDirection}
        temporalOccurrence={state.temporalOccurrence}
        pendingChoice={state.pendingChoice}
        onMoveToTile={handleMoveToTile}
      />

      {/* 4. RIGHT PANEL: ACTIONS & CHRONICLE */}
      <GameActions
        state={state}
        currentPlayer={currentPlayer}
        isMyTurn={isMyTurn}
        isRolling={isRolling}
        isAiCurrent={isAiCurrent}
        logEntries={engine.logEntries}
        onRollDice={handleRollDice}
        onStepMove={handleStepMove}
        onTriggerMomentum={handleTriggerMomentum}
        onInteractMomentum={handleInteractMomentum}
        onReverseTime={handleReverseTime}
        onRest={handleRest}
        onUseSkill={handleUseSkill}
        onReturnArtifact={handleReturnArtifact}
        onEndTurn={handleEndTurn}
      />

      {/* 5. BOTTOM PANEL: HAND & MISSIONS */}
      <PlayerHand
        viewedPlayer={viewedPlayer}
        isViewingSelf={isViewingSelf}
        isOnline={isOnline}
        activeHandTab={activeHandTab}
        onChangeTab={(tab) => setActiveHandTab(tab)}
        onViewMyHand={() => setInspectedPlayerId(null)}
        onInspectCard={onInspectCard}
      />

      {/* 6. IN-GAME COMMS DRAWER */}
      {isGameChatOpen && (
        <ChatBox
          boxId="game-chat"
          isFloating={true}
          messages={chatMessages}
          onSendMessage={(text) => network.sendChatMessage(text)}
          onClose={toggleChat}
          myPlayerId={network.playerId}
          myPlayerName={myPlayer.name}
          isOnline={isOnline}
        />
      )}
      {/* 7. PAUSE MENU MODAL */}
      <PauseModal
        isOpen={isPaused}
        onResume={handleResume}
        onOpenGuide={onOpenGuide}
        soundMuted={soundMuted}
        onToggleSound={onToggleSound}
        onSaveAndExit={() => {
          handleResume();
          if (onSaveAndExit) onSaveAndExit();
        }}
        onAbandonGame={() => {
          handleResume();
          if (onAbandonGame) onAbandonGame();
        }}
        state={state}
        network={network}
      />
    </div>
  );
}

export default memo(GameScreen);
