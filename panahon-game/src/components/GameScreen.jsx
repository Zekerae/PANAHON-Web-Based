import React, { useState, useCallback, memo } from 'react';
import sounds from '../sound.js';
import ChatBox from './ChatBox.jsx';
import GameHeader from './game/GameHeader.jsx';
import PlayerSidebar from './game/PlayerSidebar.jsx';
import GameBoard from './game/GameBoard.jsx';
import GameActions from './game/GameActions.jsx';
import PlayerHand from './game/PlayerHand.jsx';

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
  onResetUnreadChat
}) {
  const [activeHandTab, setActiveHandTab] = useState('mission');
  const [inspectedPlayerId, setInspectedPlayerId] = useState(null);
  const [isGameChatOpen, setIsGameChatOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [mobileGameTab, setMobileGameTab] = useState("board");

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
  if (timelineLevel >= 8) timelineClass = 'danger';
  else if (timelineLevel >= 5) timelineClass = 'warning';

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

  const handleStepMove = useCallback(() => {
    if (state.phase !== 'moving' || state.movesRemaining <= 0 || !isMyTurn) return;
    sounds.moveStep();
    const ok = engine.movePlayerStep();
    if (ok) {
      network.sendAction({ type: 'MOVE_STEP' });
    }
  }, [state.phase, state.movesRemaining, isMyTurn, engine, network]);

  const handleMoveToTile = useCallback((tileId) => {
    if (state.phase !== 'moving' || state.movesRemaining <= 0 || !isMyTurn) return;
    const ok = engine.moveToTile(tileId);
    if (ok) {
      sounds.moveStep();
      network.sendAction({ type: 'MOVE_TO_TILE', targetTileId: tileId });
    }
  }, [state.phase, state.movesRemaining, isMyTurn, engine, network]);

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
        unreadChatCount={unreadChatCount}
        soundMuted={soundMuted}
        onToggleChat={toggleChat}
        onOpenGuide={onOpenGuide}
        onToggleSound={onToggleSound}
      />

      {/* 2. LEFT PANEL: PLAYER DOSSIERS */}
      <PlayerSidebar
        players={state.players}
        currentPlayerIndex={state.currentPlayerIndex}
        viewedPlayerId={viewedPlayer.id}
        isOnline={isOnline}
        myPlayerId={network.playerId}
        onSelectPlayer={(playerId) => setInspectedPlayerId(playerId)}
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
    </div>
  );
}

export default memo(GameScreen);
