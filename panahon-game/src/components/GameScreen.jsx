import React, { useState, useCallback, memo } from 'react';
import sounds from '../sound.js';
import GameHeader from './game/GameHeader.jsx';
import PlayerSidebar from './game/PlayerSidebar.jsx';
import GameBoard from './game/GameBoard.jsx';
import GameActions from './game/GameActions.jsx';
import PlayerHand from './game/PlayerHand.jsx';
import PauseModal from './PauseModal.jsx';
import Dice from './game/Dice.jsx';

function GameScreen({
  state,
  engine,
  network,
  isSpectator = false,
  spectators = [],
  simulationSpeed = 1,
  onChangeSimulationSpeed,
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
  const [showMobileDice, setShowMobileDice] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [mobileGameTab, setMobileGameTab] = useState("board");
  const [isPaused, setIsPaused] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [omniscientIntel, setOmniscientIntel] = useState(true);

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

  // Auto reset unread chat since chat is always visible
  React.useEffect(() => {
    if (chatMessages && chatMessages.length > 0 && onResetUnreadChat) {
      onResetUnreadChat();
    }
  }, [chatMessages, onResetUnreadChat]);

  // Global ESC key handler
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isPaused) {
          handleResume();
        } else {
          handleOpenPause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, handleResume, handleOpenPause]);

  if (!state || !engine) return null;

  const effectiveIsSpectator = Boolean(
    isSpectator ||
    network.isSpectator ||
    (state.players?.length > 0 && state.players.every(p => p.isAi))
  );

  // Auto-follow current turn operative in spectator mode
  React.useEffect(() => {
    if (effectiveIsSpectator && autoFollow && state.currentPlayerIndex !== undefined && state.players?.[state.currentPlayerIndex]) {
      setInspectedPlayerId(state.players[state.currentPlayerIndex].id);
    }
  }, [effectiveIsSpectator, autoFollow, state.currentPlayerIndex, state.players]);

  const currentPlayer = engine.getCurrentPlayer();
  const timelineLevel = state.timelineMeter;
  const isOnline = network.mode === 'online';
  const isAiCurrent = currentPlayer?.isAi === true;
  const isMyTurn = !effectiveIsSpectator && !isAiCurrent && (!isOnline || currentPlayer.id === network.playerId);

  const myPlayer = isOnline
    ? (state.players.find(p => p.id === network.playerId) || currentPlayer)
    : currentPlayer;

  const viewedPlayer = (inspectedPlayerId !== null
    ? state.players.find(p => p.id === inspectedPlayerId)
    : null) || myPlayer;

  const isViewingSelf = !effectiveIsSpectator && (viewedPlayer.id === myPlayer.id || !isOnline);

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
    setShowMobileDice(true);
    sounds.diceRoll();

    setTimeout(() => {
      if (engine.state.phase === 'rolling') {
        const result = engine.rollDice();
        if (result) {
          network.sendAction({ type: 'ROLL_DICE', result });
        }
      }
      setIsRolling(false);
      // Auto-hide mobile dice after displaying result so player sees the roll
      setTimeout(() => {
        setShowMobileDice(false);
      }, 950);
    }, 650);
  }, [isRolling, state.phase, isMyTurn, engine, network]);

  const handleStepMove = useCallback(() => {
    if (state.phase !== 'moving' || state.movesRemaining <= 0 || !isMyTurn) return;
    sounds.moveStep();
    const ok = engine.movePlayerStep();
    if (ok) {
      network.sendAction({ type: 'MOVE_STEP' });
    }
  }, [state.phase, state.movesRemaining, isMyTurn, engine, network]);

  // Spacebar, Enter, or Arrow key shortcuts to roll dice or step move
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
          return;
        }
        if (state?.phase === 'moving' && isMyTurn && !isPaused && (state?.movesRemaining || 0) > 0) {
          e.preventDefault();
          handleStepMove();
          return;
        }
      }
      if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (state?.phase === 'moving' && isMyTurn && !isPaused && (state?.movesRemaining || 0) > 0) {
          e.preventDefault();
          handleStepMove();
          return;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state?.phase, state?.movesRemaining, isMyTurn, isRolling, isPaused, handleRollDice, handleStepMove]);

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

  const handleInteractMomentum = useCallback(() => {
    sounds.btnClick();
    const ok = engine.interactMomentumTile(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'INTERACT_MOMENTUM', playerIdx: state.currentPlayerIndex });
    }
  }, [state.currentPlayerIndex, engine, network]);

  const handleReverseTime = useCallback(() => {
    if (!isMyTurn) return;
    if (state.phase !== 'moving' || state.hasMovedThisTurn || (state.stepsTakenThisTurn && state.stepsTakenThisTurn > 0)) {
      return;
    }
    sounds.portal();
    const ok = engine.reverseTime(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'REVERSE_TIME', playerIdx: state.currentPlayerIndex });
    }
  }, [state.phase, state.hasMovedThisTurn, state.stepsTakenThisTurn, state.currentPlayerIndex, isMyTurn, engine, network]);

  const handleRest = useCallback(() => {
    if (state.phase === 'moving' || !isMyTurn) return;
    sounds.btnClick();
    engine.rest(state.currentPlayerIndex);
    network.sendAction({ type: 'REST', playerIdx: state.currentPlayerIndex });
  }, [state.phase, state.currentPlayerIndex, isMyTurn, engine, network]);

  const handleUseSkill = useCallback(() => {
    if (state.phase !== 'action' || !isMyTurn) return;
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

  const handleTimeWarp = useCallback(() => {
    if (state.phase !== 'action' || !isMyTurn) return;
    sounds.portal();
    const ok = engine.timeWarp(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'TIME_WARP', playerIdx: state.currentPlayerIndex });
    }
  }, [state.phase, state.currentPlayerIndex, isMyTurn, engine, network]);



  const canReverseTime = isMyTurn &&
    state.phase === 'moving' &&
    !state.hasMovedThisTurn &&
    (!state.stepsTakenThisTurn || state.stepsTakenThisTurn === 0) &&
    state.movementDirection !== 'backward' &&
    currentPlayer?.reverseTimeCooldown === 0 &&
    (currentPlayer?.energy || 0) >= 3;

  const role = currentPlayer?.role || {};
  const activeSkill = role.active || {};
  const activeCost = activeSkill.energyCost || 0;
  const hasEnoughEnergy = (currentPlayer?.energy || 0) >= activeCost;
  const isAbilityOnCooldown = (currentPlayer?.activeCooldown || 0) > 0;
  const hasUsedAbilityThisTurn = Boolean(currentPlayer?.usedAbilityThisTurn);
  const canUseAbilityNow = isMyTurn && state.phase === 'action' && !hasUsedAbilityThisTurn && !isAbilityOnCooldown && hasEnoughEnergy;

  const currentTile = state.board?.[currentPlayer?.currentEra]?.[currentPlayer?.tileIndex];
  const isOnTimeGate = currentTile?.type === 'timeGate';
  const timeGateCost = currentPlayer?.roleKey === 'EXPLORER' ? 1 : 2;
  const canTimeWarp = isMyTurn && isOnTimeGate && (currentPlayer?.energy || 0) >= timeGateCost;
  const matchingArtifact = currentPlayer?.artifactCards?.find(a => a.era === currentPlayer?.currentEra);

  return (
    <div className={`game-screen mobile-tab-${mobileGameTab}`}>
      {/* 1. HEADER */}
      <GameHeader
        timelineLevel={timelineLevel}
        timelineClass={timelineClass}
        timerStr={timerStr}
        turnNumber={state.turnNumber}
        onOpenGuide={onOpenGuide}
        onOpenPause={handleOpenPause}
        isSpectator={effectiveIsSpectator}
        spectatorCount={spectators?.length || 0}
      />

      {/* MOBILE SCREEN TABS BAR */}
      <nav className="mobile-game-tabs" aria-label="Game Screen Sections">
        <button
          type="button"
          className={`mobile-game-tab ${mobileGameTab === "board" ? "active" : ""}`}
          onClick={() => { sounds.btnClick(); setMobileGameTab("board"); }}
        >
          🗺️ Board Map
        </button>
        <button
          type="button"
          className={`mobile-game-tab ${mobileGameTab === "actions" ? "active" : ""}`}
          onClick={() => { sounds.btnClick(); setMobileGameTab("actions"); }}
        >
          {effectiveIsSpectator ? '👁️ Observatory' : '⚡ Actions & Die'}
          {isMyTurn && state.phase === 'rolling' && <span className="mobile-turn-pulse">!</span>}
        </button>
        <button
          type="button"
          className={`mobile-game-tab ${mobileGameTab === "players" ? "active" : ""}`}
          onClick={() => { sounds.btnClick(); setMobileGameTab("players"); }}
        >
          👥 Castaways ({state.players?.length || 0})
        </button>
        <button
          type="button"
          className={`mobile-game-tab ${mobileGameTab === "hand" ? "active" : ""}`}
          onClick={() => { sounds.btnClick(); setMobileGameTab("hand"); }}
        >
          📜 Hand
        </button>
      </nav>

      {/* 2. LEFT PANEL: PLAYER DOSSIERS & COMMS */}
      <PlayerSidebar
        players={state.players}
        currentPlayerIndex={state.currentPlayerIndex}
        viewedPlayerId={viewedPlayer.id}
        isOnline={isOnline}
        myPlayerId={network.playerId}
        myPlayerName={myPlayer?.name}
        onSelectPlayer={(playerId) => setInspectedPlayerId(playerId)}
        chatMessages={chatMessages}
        onSendMessage={(text) => network.sendChatMessage(text)}
        isSpectator={effectiveIsSpectator}
        spectators={spectators}
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

      {/* MOBILE DICE ROLL OVERLAY */}
      {showMobileDice && (
        <div
          className="mobile-dice-overlay"
          onClick={() => setShowMobileDice(false)}
          role="dialog"
          aria-label="Dice Roll Animation"
        >
          <div className="mobile-dice-card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-dice-header">
              {isRolling ? 'ROLLING CHRONO DIE...' : `ROLLED ${state.diceResult || 1}!`}
            </div>
            <div className="mobile-dice-stage">
              <Dice
                value={state.diceResult}
                isRolling={isRolling}
                size="lg"
                theme="chrono"
                isInteractive={false}
              />
            </div>
            <div className="mobile-dice-footer">
              {isRolling ? (
                <span className="mobile-dice-status-rolling">⚡ Quantum flux spinning...</span>
              ) : (
                <span className="mobile-dice-status-landed">
                  {state.movementDirection === 'backward' ? '⏪' : '🚶'} <strong>{state.movesRemaining || state.diceResult || 1}</strong> Moves Granted
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOARD QUICK ACTION DOCK (Floating on map in mobile view) */}
      <div className="mobile-board-quick-dock">
        {isMyTurn ? (
          <div className="mobile-dock-inner">
            {state.phase === 'rolling' && (
              <div className="mobile-dock-roll-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-roll-dice mobile-dock-roll-btn"
                  disabled={isRolling}
                  onClick={handleRollDice}
                >
                  <span>🎲 ROLL DIE</span>
                </button>
              </div>
            )}

            {state.phase === 'moving' && (
              <div className="mobile-dock-moving-group">
                <span className="mobile-dock-moves-badge">
                  🎲 <strong>{state.diceResult || state.movesRemaining}</strong> &bull; {state.movementDirection === 'backward' ? '⏪' : '🚶'} Moves: <strong>{state.movesRemaining}</strong>
                </span>

                {canReverseTime && (
                  <button
                    type="button"
                    className="btn btn-warning mobile-dock-btn"
                    onClick={handleReverseTime}
                  >
                    ⏪ Reverse (-3 En)
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-primary mobile-dock-btn mobile-dock-move-btn"
                  onClick={handleStepMove}
                >
                  {state.movementDirection === 'backward' ? '⬅️ Step Back' : '➡️ Step Forward'}
                </button>
              </div>
            )}

            {state.phase === 'action' && (
              <div className="mobile-dock-action-group">
                {canUseAbilityNow && (
                  <button
                    type="button"
                    className="btn btn-accent mobile-dock-btn"
                    style={{
                      background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                      border: '1.5px solid #A78BFA',
                      color: '#FFF'
                    }}
                    onClick={handleUseSkill}
                  >
                    <span>✨ {activeSkill?.name}</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>-{activeCost}En</span>
                  </button>
                )}

                {matchingArtifact && (
                  <button
                    type="button"
                    className="btn mobile-dock-btn"
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      border: '1.5px solid #34D399',
                      color: '#FFF'
                    }}
                    onClick={handleReturnArtifact}
                  >
                    <span>📦 Relic (+5)</span>
                  </button>
                )}

                {canTimeWarp && (
                  <button
                    type="button"
                    className="btn mobile-dock-btn"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                      border: '1.5px solid #A78BFA',
                      color: '#FFF'
                    }}
                    onClick={handleTimeWarp}
                  >
                    <span>🌀 Warp</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-primary mobile-dock-btn"
                  style={{
                    boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)'
                  }}
                  onClick={handleEndTurn}
                >
                  🏁 Finish Turn
                </button>
                <button
                  type="button"
                  className="btn btn-secondary mobile-dock-btn"
                  onClick={() => setMobileGameTab("actions")}
                >
                  ⚡ Actions
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mobile-dock-turn-banner" style={{ borderLeft: `3px solid ${currentPlayer?.color || '#38BDF8'}` }}>
            <span>Turn: <strong style={{ color: currentPlayer?.color }}>{currentPlayer?.name}</strong> {isAiCurrent ? '🤖' : '👤'}</span>
            <button
              type="button"
              className="btn btn-secondary mobile-dock-btn"
              onClick={() => setMobileGameTab("actions")}
            >
              Chronicle →
            </button>
          </div>
        )}
      </div>

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
        onInteractMomentum={handleInteractMomentum}
        onReverseTime={handleReverseTime}
        onRest={handleRest}
        onUseSkill={handleUseSkill}
        onReturnArtifact={handleReturnArtifact}
        onEndTurn={handleEndTurn}
        onTimeWarp={handleTimeWarp}
        isSpectator={effectiveIsSpectator}
        viewedPlayerId={viewedPlayer.id}
        onSelectPlayer={(id) => setInspectedPlayerId(id)}
        autoFollow={autoFollow}
        onToggleAutoFollow={(val) => setAutoFollow(val)}
        omniscientIntel={omniscientIntel}
        onToggleOmniscientIntel={(val) => setOmniscientIntel(val)}
        simulationSpeed={simulationSpeed}
        onChangeSimulationSpeed={onChangeSimulationSpeed}
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
        isSpectator={effectiveIsSpectator}
        omniscientIntel={omniscientIntel}
      />


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
