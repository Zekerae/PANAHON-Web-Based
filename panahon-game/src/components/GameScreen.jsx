import DebugLogModal from './debug/DebugLogModal.jsx';
import gameLogger, { LOG_CATEGORIES } from '../utils/debugLogger.js';
import React, { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import sounds from '../sound.js';
import GameHeader from './game/GameHeader.jsx';
import PlayerSidebar from './game/PlayerSidebar.jsx';
import GameBoard from './game/GameBoard.jsx';
import GameActions from './game/GameActions.jsx';
import PlayerHand from './game/PlayerHand.jsx';
import PauseModal from './PauseModal.jsx';
import GameIntroModal from './game/GameIntroModal.jsx';
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
  onAbandonGame,
  onToast
}) {
  const [activeHandTab, setActiveHandTab] = useState('mission');
  const [inspectedPlayerId, setInspectedPlayerId] = useState(null);
  const [showMobileDice, setShowMobileDice] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [mobileGameTab, setMobileGameTab] = useState("board");
  const [isPaused, setIsPaused] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [omniscientIntel, setOmniscientIntel] = useState(false);
  const [showIntro, setShowIntro] = useState(() => !state?.hasCompletedIntro);
  const [showDebugModal, setShowDebugModal] = useState(false);

  const effectiveIsSpectator = Boolean(
    isSpectator ||
    network?.isSpectator ||
    (state?.players?.length > 0 && state.players.every(p => p.isAi))
  );

  const handleIntroComplete = useCallback((orderedPlayers) => {
    setShowIntro(false);
    if (engine) {
      engine.setPlayerTurnOrder(orderedPlayers);
      if (network && network.mode === 'online') {
        const myNewPlayer = engine.state.players?.find(p => 
          (network.myPlayerName && p.name === network.myPlayerName) ||
          (network.initialPlayerId !== null && p.connectionId === network.initialPlayerId)
        );
        if (myNewPlayer) {
          network.playerId = myNewPlayer.id;
        }
        if (engine.state.players) {
          engine.state.players.forEach(p => {
            p.isLocal = !effectiveIsSpectator && (p.id === network.playerId);
          });
        }
        network.sendAction({ type: 'SET_TURN_ORDER', orderedPlayers });
      }
      engine.isPaused = false;
      engine.startTimer();
    }
  }, [engine, network, effectiveIsSpectator]);

  useEffect(() => {
    if (network) {
      network.onTurnOrderSet = () => {
        setShowIntro(false);
        if (engine) {
          engine.isPaused = false;
          engine.startTimer();
        }
      };
    }
    return () => {
      if (network) network.onTurnOrderSet = null;
    };
  }, [network, engine]);

  // Lifecycle Timer Manager: Keep timer running while in-game and not paused
  useEffect(() => {
    if (!engine) return;
    if (!showIntro && !isPaused && !state?.gameOver) {
      engine.isPaused = false;
      if (engine.state) engine.state.isPaused = false;
      engine.startTimer();
    } else {
      engine.isPaused = true;
      if (engine.state) engine.state.isPaused = true;
      engine.stopTimer();
    }
    return () => {
      if (engine) engine.stopTimer();
    };
  }, [showIntro, isPaused, engine, state?.gameOver]);

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

  // Global ESC and ` (Backquote/F2) key handler for Pause & Telemetry Console
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '`' || e.code === 'Backquote' || e.key === 'F2') {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
        e.preventDefault();
        sounds.btnClick();
        setShowDebugModal(prev => !prev);
        return;
      }
      if (showIntro) return;
      if (e.key === 'Escape') {
        if (showDebugModal) {
          setShowDebugModal(false);
        } else if (isPaused) {
          handleResume();
        } else {
          handleOpenPause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIntro, isPaused, showDebugModal, handleResume, handleOpenPause]);

  // Auto-follow current turn operative in spectator mode
  React.useEffect(() => {
    if (effectiveIsSpectator && autoFollow && state?.currentPlayerIndex !== undefined && state?.players?.[state.currentPlayerIndex]) {
      setInspectedPlayerId(state.players[state.currentPlayerIndex].id);
    }
  }, [effectiveIsSpectator, autoFollow, state?.currentPlayerIndex, state?.players]);

  const currentPlayer = engine?.getCurrentPlayer ? engine.getCurrentPlayer() : null;
  const timelineLevel = state?.timelineMeter || 0;
  const isOnline = network?.mode === 'online';
  const isAiCurrent = currentPlayer?.isAi === true;
  const isMyTurn = !effectiveIsSpectator && !isAiCurrent && (!isOnline || currentPlayer?.id === network?.playerId);

  const myPlayer = useMemo(() => {
    if (isOnline) {
      return state.players?.find(p => p.id === network.playerId) || currentPlayer;
    }
    // In local mode: if current player is a human, it is their turn
    if (currentPlayer && !currentPlayer.isAi) {
      return currentPlayer;
    }
    // If current player is AI (bot turn), maintain the human player's hand on screen
    const humanPlayer = state.players?.find(p => !p.isAi);
    if (humanPlayer) {
      return humanPlayer;
    }
    return currentPlayer;
  }, [isOnline, state.players, network.playerId, currentPlayer]);

  const viewedPlayer = (inspectedPlayerId !== null
    ? state.players?.find(p => p.id === inspectedPlayerId)
    : null) || myPlayer;

  const isViewingSelf = !effectiveIsSpectator && Boolean(viewedPlayer?.id === myPlayer?.id);

  // When human player turn starts, ensure inspected player is cleared so they see their own hand
  const prevIsMyTurnRef = useRef(false);
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurnRef.current) {
      setInspectedPlayerId(null);
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  let timelineClass = 'safe';
  if (timelineLevel >= 4) timelineClass = 'danger';
  else if (timelineLevel >= 2) timelineClass = 'warning';

  const totalRemainingSeconds = typeof state?.gameTimeRemaining === 'number'
    ? state.gameTimeRemaining
    : 2400; // 40 minutes default
  const minutes = Math.floor(totalRemainingSeconds / 60);
  const seconds = totalRemainingSeconds % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleRest = useCallback(() => {
    if (state.phase === 'moving' || !isMyTurn) return;
    sounds.btnClick();
    engine.rest(state.currentPlayerIndex);
    network.sendAction({ type: 'REST', playerIdx: state.currentPlayerIndex });
  }, [state.phase, state.currentPlayerIndex, isMyTurn, engine, network]);

  // Actions
  const handleAcknowledgeSkip = useCallback(() => {
    if (!isMyTurn || isRolling) return;
    sounds.btnClick();
    engine.skipPlayerTurn(state.currentPlayerIndex);
    network.sendAction({ type: 'SKIP_TURN', playerIdx: state.currentPlayerIndex });
  }, [isMyTurn, isRolling, state.currentPlayerIndex, engine, network]);

  const handleRollDice = useCallback(() => {
    if (isRolling || state.phase !== 'rolling' || !isMyTurn) return;
    if (currentPlayer && (currentPlayer.energy <= 0 || currentPlayer.skipNextTurn)) {
      sounds.danger?.();
      return;
    }
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
  }, [isRolling, state.phase, isMyTurn, currentPlayer, engine, network]);

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

  const handleAdjustForesight = useCallback((delta) => {
    if (!isMyTurn) return;
    if (state.phase !== 'moving' || state.hasMovedThisTurn || (state.stepsTakenThisTurn && state.stepsTakenThisTurn > 0)) {
      return;
    }
    sounds.btnClick();
    const ok = engine.adjustTemporalForesight(state.currentPlayerIndex, delta);
    if (ok) {
      network.sendAction({ type: 'ADJUST_FORESIGHT', playerIdx: state.currentPlayerIndex, delta });
    }
  }, [state.phase, state.hasMovedThisTurn, state.stepsTakenThisTurn, state.currentPlayerIndex, isMyTurn, engine, network, sounds]);



  const handleUseSkill = useCallback(() => {
    const isExplorer = currentPlayer?.roleKey === 'EXPLORER';
    const isAbilityPhase = isExplorer ? (state.phase === 'rolling' || state.phase === 'moving') : (state.phase === 'action');
    if (!isAbilityPhase || !isMyTurn) return;
    sounds.abilityActivate?.() || sounds.btnClick();
    engine.useActiveAbility(state.currentPlayerIndex);
    network.sendAction({ type: 'USE_ABILITY', playerIdx: state.currentPlayerIndex });
  }, [state.phase, state.currentPlayerIndex, isMyTurn, currentPlayer?.roleKey, engine, network, sounds]);

  const handleReturnArtifact = useCallback(() => {
    if (state.phase !== 'action' || !isMyTurn) return;
    const matchingArt = currentPlayer.artifactCards.find(a => (a.originEra || a.era) === currentPlayer.currentEra);
    if (matchingArt) {
      sounds.artifact();
      engine.returnArtifact(state.currentPlayerIndex, matchingArt.id);
      network.sendAction({ type: 'RETURN_ARTIFACT', playerIdx: state.currentPlayerIndex, artifactId: matchingArt.id });
    }
  }, [state.phase, isMyTurn, currentPlayer, state.currentPlayerIndex, engine, network]);

  const handleCoopStabilizeTimeline = useCallback(() => {
    if (!isMyTurn || !currentPlayer?.completed) return;
    sounds.portal();
    engine.coopStabilizeTimeline(state.currentPlayerIndex);
    if (network && network.mode === 'online') {
      network.sendAction({ type: 'COOP_STABILIZE_TIMELINE', playerIdx: state.currentPlayerIndex });
    }
  }, [isMyTurn, currentPlayer, engine, state?.currentPlayerIndex, network]);

  const handleCoopTransferEnergy = useCallback((targetPlayerId, amount = 2) => {
    if (!isMyTurn || !currentPlayer?.completed) return;
    sounds.btnClick();
    engine.coopTransferEnergy(state.currentPlayerIndex, targetPlayerId, amount);
    if (network && network.mode === 'online') {
      network.sendAction({ type: 'COOP_TRANSFER_ENERGY', fromIdx: state.currentPlayerIndex, toIdx: targetPlayerId, amount });
    }
  }, [isMyTurn, currentPlayer, engine, state?.currentPlayerIndex, network]);

  const handleEndTurn = useCallback(() => {
    if (state.phase !== 'action' || !isMyTurn) {
      gameLogger.warn(LOG_CATEGORIES.TURN, `handleEndTurn blocked: phase="${state.phase}", isMyTurn=${isMyTurn}, movesRemaining=${state.movesRemaining}`);
      return;
    }
    sounds.btnClick();
    gameLogger.turn(`Local player clicked End Turn: ${currentPlayer?.name} (P#${state.currentPlayerIndex})`);
    engine.endTurn();
    network.sendAction({ type: 'END_TURN' });
    if (network.isHost) {
      network.broadcastState(engine.getState());
    }
  }, [state.phase, isMyTurn, engine, network, currentPlayer, state.currentPlayerIndex, state.movesRemaining]);

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

  const canUseForesight = isMyTurn &&
    state.phase === 'moving' &&
    !state.hasMovedThisTurn &&
    (!state.stepsTakenThisTurn || state.stepsTakenThisTurn === 0) &&
    currentPlayer?.roleKey === 'CHRONOMANCER' &&
    (!currentPlayer?.temporalForesightCooldown || currentPlayer?.temporalForesightCooldown <= 0) &&
    !currentPlayer?.hasUsedForesightThisTurn;

  const hasPreMovementDecision = canReverseTime || canUseForesight;

  const role = currentPlayer?.role || {};
  const activeSkill = role.active || {};
  const activeCost = activeSkill.energyCost || 0;
  const hasEnoughEnergy = (currentPlayer?.energy || 0) >= activeCost;
  const isAbilityOnCooldown = (currentPlayer?.activeCooldown || 0) > 0;
  const hasUsedAbilityThisTurn = Boolean(currentPlayer?.usedAbilityThisTurn);
  const isExplorer = currentPlayer?.roleKey === 'EXPLORER';
  const isAbilityPhase = isExplorer ? (state.phase === 'rolling' || state.phase === 'moving') : (state.phase === 'action');
  const isMomentumPrimed = isExplorer && Boolean(state.momentumActive);
  const canUseAbilityNow = isMyTurn && isAbilityPhase && !hasUsedAbilityThisTurn && !isAbilityOnCooldown && hasEnoughEnergy && !isMomentumPrimed;

  const currentTile = state?.board?.[currentPlayer?.currentEra]?.[currentPlayer?.tileIndex];
  const isOnTimeGate = currentTile?.type === 'timeGate';
  const timeGateCost = currentPlayer?.roleKey === 'EXPLORER' ? 1 : 2;
  const canTimeWarp = isMyTurn && isOnTimeGate && (currentPlayer?.energy || 0) >= timeGateCost;
  const matchingArtifact = currentPlayer?.artifactCards?.find(a => a.era === currentPlayer?.currentEra);

  // --- Comprehensive Keyboard Shortcuts (Roll, Step Move, Skill [Q/S], End Turn [E/T/Space/Enter]) ---
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (showIntro || isPaused || showDebugModal || state?.pendingModal || state?.pendingChoice) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
        return;
      }

      // 1. Skill keybinding: Q or S
      if (e.key === 'q' || e.key === 'Q' || e.key === 's' || e.key === 'S' || e.code === 'KeyQ') {
        if (canUseAbilityNow) {
          e.preventDefault();
          handleUseSkill();
          return;
        }
      }

      // 2. End Turn keybinding: E or T
      if (e.key === 'e' || e.key === 'E' || e.key === 't' || e.key === 'T' || e.code === 'KeyE') {
        if (state?.phase === 'action' && isMyTurn) {
          e.preventDefault();
          handleEndTurn();
          return;
        }
      }

      // 3. Spacebar & Enter: Contextual turn flow (Roll -> Step Move -> End Turn)
      if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
        if (state?.phase === 'rolling' && isMyTurn && !isRolling) {
          e.preventDefault();
          if (currentPlayer && currentPlayer.skipNextTurn) {
            handleAcknowledgeSkip();
          } else if (currentPlayer && currentPlayer.energy <= 0) {
            handleRest();
          } else {
            handleRollDice();
          }
          return;
        }
        if (state?.phase === 'moving' && isMyTurn && (state?.movesRemaining || 0) > 0) {
          e.preventDefault();
          handleStepMove();
          return;
        }
        if (state?.phase === 'action' && isMyTurn) {
          e.preventDefault();
          handleEndTurn();
          return;
        }
      }

      // 4. Arrow keys for step movement
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (state?.phase === 'moving' && isMyTurn && (state?.movesRemaining || 0) > 0) {
          e.preventDefault();
          handleStepMove();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showIntro,
    isPaused,
    showDebugModal,
    state?.pendingModal,
    state?.pendingChoice,
    state?.phase,
    state?.movesRemaining,
    isMyTurn,
    isRolling,
    currentPlayer,
    canUseAbilityNow,
    handleRollDice,
    handleStepMove,
    handleRest,
    handleAcknowledgeSkip,
    handleUseSkill,
    handleEndTurn
  ]);

  if (!state || !engine) return null;

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
        onOpenDebug={() => setShowDebugModal(true)}
        isSpectator={effectiveIsSpectator}
        spectatorCount={spectators?.length || 0}
        currentEra={currentPlayer?.currentEra}
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
        turnNumber={state.turnNumber}
        phase={state.phase}
        movesRemaining={state.movesRemaining}
        movementDirection={state.movementDirection}
        temporalOccurrence={state.temporalOccurrence}
        temporalOccurrenceId={state.temporalOccurrenceId}
        hasPendingModal={Boolean(state.pendingModal)}
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
                {currentPlayer?.skipNextTurn ? (
                  <button
                    type="button"
                    className="btn btn-primary mobile-dock-roll-btn"
                    style={{
                      background: currentPlayer?.timeStoppedBy ? "linear-gradient(180deg, #0891B2 0%, #0E7490 100%)" : "#BE123C",
                      borderColor: currentPlayer?.timeStoppedBy ? "#22D3EE" : "#F43F5E",
                      boxShadow: currentPlayer?.timeStoppedBy ? "0 0 12px rgba(34, 211, 238, 0.5)" : undefined
                    }}
                    onClick={handleAcknowledgeSkip}
                  >
                    <span>{currentPlayer?.timeStoppedBy ? "⌛ THAW (TIME STOPPED)" : "⏭️ SKIP TURN (HAZARD)"}</span>
                  </button>
                ) : currentPlayer?.energy <= 0 ? (
                  <button
                    type="button"
                    className="btn btn-primary mobile-dock-roll-btn"
                    style={{ background: "#27AE60", borderColor: "#2ECC71" }}
                    onClick={handleRest}
                  >
                    <span>💤 REST (+3 EN)</span>
                  </button>
                ) : (
                  <>
                    {isExplorer && canUseAbilityNow && (
                      <button
                        type="button"
                        className="btn btn-accent mobile-dock-btn"
                        style={{
                          background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                          border: '1.5px solid #38BDF8',
                          color: '#FFF'
                        }}
                        onClick={handleUseSkill}
                      >
                        <span>🏃 Momentum [Q]</span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.9 }}>-3En</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-roll-dice mobile-dock-roll-btn"
                      disabled={isRolling}
                      onClick={handleRollDice}
                      style={isMomentumPrimed ? {
                        background: 'linear-gradient(180deg, #0284C7 0%, #0369A1 100%)',
                        borderColor: '#38BDF8',
                        color: '#E0F2FE',
                        boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)'
                      } : undefined}
                    >
                      <span>🎲 {isMomentumPrimed ? "ROLL (MOMENTUM ACTIVE)" : "ROLL DIE"}</span>
                    </button>
                  </>
                )}
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

                {canUseForesight && (
                  <>
                    <button
                      type="button"
                      className="btn mobile-dock-btn"
                      disabled={state.movesRemaining <= 1}
                      onClick={() => handleAdjustForesight(-1)}
                      style={{
                        background: state.movesRemaining > 1 ? '#13352F' : '#221913',
                        border: '1.5px solid #1ABC9C',
                        color: state.movesRemaining > 1 ? '#5EEAD4' : '#6B7280'
                      }}
                      title="Temporal Foresight: -1 Space"
                    >
                      ⏳ -1 Sp
                    </button>
                    <button
                      type="button"
                      className="btn mobile-dock-btn"
                      disabled={state.movesRemaining >= 6}
                      onClick={() => handleAdjustForesight(1)}
                      style={{
                        background: state.movesRemaining < 6 ? '#13352F' : '#221913',
                        border: '1.5px solid #1ABC9C',
                        color: state.movesRemaining < 6 ? '#5EEAD4' : '#6B7280'
                      }}
                      title="Temporal Foresight: +1 Space"
                    >
                      ⏳ +1 Sp
                    </button>
                  </>
                )}

                {state.momentumActive && !state.momentumUsedMidTile && currentTile?.type !== 'start' && currentTile?.type !== 'empty' && (
                  <button
                    type="button"
                    className="btn btn-warning mobile-dock-btn"
                    onClick={handleInteractMomentum}
                  >
                    ✨ Pause & Interact
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-primary mobile-dock-btn mobile-dock-move-btn"
                  onClick={handleStepMove}
                  style={hasPreMovementDecision ? {
                    borderColor: '#5EEAD4',
                    color: '#5EEAD4',
                    boxShadow: '0 0 10px rgba(94, 234, 212, 0.4)'
                  } : undefined}
                >
                  {hasPreMovementDecision
                    ? (state.movementDirection === 'backward' ? '⬅️ Confirm Back' : '➡️ Confirm Move')
                    : (state.movementDirection === 'backward' ? '⬅️ Step Back' : '➡️ Step Forward')}
                </button>
              </div>
            )}

            {state.phase === 'action' && (
              <div className="mobile-dock-action-group">
                {canUseAbilityNow && !isExplorer && (
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
                    <span>✨ {activeSkill?.name} [Q]</span>
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
                  🏁 Finish Turn [E]
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
        onAdjustForesight={handleAdjustForesight}
        onRest={handleRest}
        onAcknowledgeSkip={handleAcknowledgeSkip}
        onUseSkill={handleUseSkill}
        onReturnArtifact={handleReturnArtifact}
        onCoopStabilizeTimeline={handleCoopStabilizeTimeline}
        onCoopTransferEnergy={handleCoopTransferEnergy}
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


      {/* 6. GAME INTRODUCTION & INITIATIVE ROLL-OFF */}
      <GameIntroModal
        isOpen={showIntro}
        players={state?.players || []}
        engine={engine}
        network={network}
        isSpectator={effectiveIsSpectator}
        onComplete={handleIntroComplete}
        onSkip={() => handleIntroComplete(state?.players || [])}
      />

      {/* 7. PAUSE MENU MODAL */}
      <PauseModal
        isOpen={isPaused}
        onResume={handleResume}
        onOpenGuide={onOpenGuide}
        onOpenDebug={() => {
          handleResume();
          setShowDebugModal(true);
        }}
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

      {/* 8. CHRONO TELEMETRY & DEBUG CONSOLE */}
      <DebugLogModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        engine={engine}
        network={network}
        onToast={onToast}
      />
    </div>
  );
}

export default memo(GameScreen);
