import React, { useState } from 'react';
import sounds from '../sound.js';
import {
  ERA_NAMES, ERA_ORDER, ROLES, GAME_CONSTANTS, PLAYER_COLORS,
  ERA_TILE_COORDINATES, getActiveTileCoordinates, getActiveLoopTargets, getActivePathConnections
} from '../gameData.js';
import ChatBox from './ChatBox.jsx';

export default function GameScreen({
  state,
  engine,
  network,
  soundMuted,
  onToggleSound,
  onOpenGuide,
  onOpenMapEditor,
  onInspectCard,
  chatMessages,
  unreadChatCount,
  onResetUnreadChat
}) {
  const [cameraMode, setCameraMode] = useState('full');
  const [activeHandTab, setActiveHandTab] = useState('mission');
  const [inspectedPlayerId, setInspectedPlayerId] = useState(null);
  const [isGameChatOpen, setIsGameChatOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [mobileGameTab, setMobileGameTab] = useState("board");

  if (!state) return null;

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
  const activeCoords = getActiveTileCoordinates();

  let timelineClass = 'safe';
  if (timelineLevel >= 8) timelineClass = 'danger';
  else if (timelineLevel >= 5) timelineClass = 'warning';

  const minutes = typeof state.gameTimeRemaining === 'number' ? Math.floor(state.gameTimeRemaining / 60) : 15;
  const seconds = typeof state.gameTimeRemaining === 'number' ? state.gameTimeRemaining % 60 : 0;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Actions
  const handleRollDice = () => {
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
  };

  const handleStepMove = () => {
    if (state.phase !== 'moving' || state.movesRemaining <= 0 || !isMyTurn) return;
    sounds.moveStep();
    const ok = engine.movePlayerStep();
    if (ok) {
      network.sendAction({ type: 'MOVE_STEP' });
    }
  };

  const handleMoveToTile = (tileId) => {
    if (state.phase !== 'moving' || state.movesRemaining <= 0 || !isMyTurn) return;
    const ok = engine.moveToTile(tileId);
    if (ok) {
      sounds.moveStep();
      network.sendAction({ type: 'MOVE_TO_TILE', targetTileId: tileId });
    }
  };

  const handleTriggerMomentum = () => {
    if (state.phase !== 'rolling' && state.phase !== 'moving') return;
    sounds.btnClick();
    const ok = engine.useActiveAbility(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'USE_ABILITY', playerIdx: state.currentPlayerIndex });
    }
  };

  const handleInteractMomentum = () => {
    sounds.btnClick();
    const ok = engine.interactMomentumTile(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'INTERACT_MOMENTUM', playerIdx: state.currentPlayerIndex });
    }
  };

  const handleReverseTime = () => {
    if (state.phase === 'moving' || !isMyTurn) return;
    sounds.portal();
    const ok = engine.reverseTime(state.currentPlayerIndex);
    if (ok) {
      network.sendAction({ type: 'REVERSE_TIME', playerIdx: state.currentPlayerIndex });
    }
  };

  const handleRest = () => {
    if (state.phase === 'moving' || !isMyTurn) return;
    sounds.btnClick();
    engine.rest(state.currentPlayerIndex);
    network.sendAction({ type: 'REST', playerIdx: state.currentPlayerIndex });
  };

  const handleUseSkill = () => {
    if (state.phase === 'moving' || !isMyTurn) return;
    sounds.btnClick();
    engine.useActiveAbility(state.currentPlayerIndex);
    network.sendAction({ type: 'USE_ABILITY', playerIdx: state.currentPlayerIndex });
  };

  const handleReturnArtifact = () => {
    if (state.phase !== 'action' || !isMyTurn) return;
    const matchingArt = currentPlayer.artifactCards.find(a => a.era === currentPlayer.currentEra);
    if (matchingArt) {
      sounds.artifact();
      engine.returnArtifact(state.currentPlayerIndex, matchingArt.id);
      network.sendAction({ type: 'RETURN_ARTIFACT', playerIdx: state.currentPlayerIndex, artifactId: matchingArt.id });
    }
  };

  const handleEndTurn = () => {
    if (state.phase !== 'action' || !isMyTurn) return;
    sounds.btnClick();
    engine.endTurn();
    network.sendAction({ type: 'END_TURN' });
    if (network.isHost) {
      network.broadcastState(engine.getState());
    }
  };

  const toggleChat = () => {
    sounds.btnClick();
    const next = !isGameChatOpen;
    setIsGameChatOpen(next);
    if (next) onResetUnreadChat();
  };

  return (
    <div className={`game-screen mobile-tab-${mobileGameTab}`}>
      {/* HEADER: TIMELINE STATUS & GAUGES */}
      <header className="game-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div className="game-logo">PANAHON</div>
          <div className="timeline-meter">
            <div className="timeline-meter-label">TIMELINE INTEGRITY:</div>
            <div className="timeline-meter-bar">
              <div
                className={`timeline-meter-fill ${timelineClass}`}
                style={{ width: `${(timelineLevel / 10) * 100}%` }}
              ></div>
            </div>
            <div className="timeline-meter-val" style={{ fontWeight: 800 }}>
              {timelineLevel} / 10 BREACH
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div className="game-timer">
            <span>⏱️</span>
            <span>{timerStr}</span>
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Round <strong style={{ color: 'var(--text-accent)' }}>{state.turnNumber}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button
            className={`btn ${unreadChatCount > 0 ? 'btn-chat-unread' : ''}`}
            style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-glass)', position: 'relative' }}
            onClick={toggleChat}
          >
            💬 Comms {unreadChatCount > 0 && <span className="chat-badge">{unreadChatCount}</span>}
          </button>
          <button
            className="btn"
            style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-glass)', borderColor: 'rgba(234, 179, 8, 0.4)' }}
            onClick={() => { sounds.btnClick(); onOpenMapEditor(); }}
            title="Open Real-time Map & Path Editor"
          >
            🗺️ Map Editor
          </button>
          <button
            className="btn"
            style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-glass)' }}
            onClick={() => { sounds.btnClick(); onOpenGuide(); }}
          >
            📖 Manual
          </button>
          <button
            className="btn"
            style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-glass)' }}
            onClick={onToggleSound}
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* MOBILE RESPONSIVE NAVIGATION TABS (< 900px) */}
      <div className="mobile-game-tabs">
        <button
          className={`mobile-game-tab ${mobileGameTab === 'board' ? 'active' : ''}`}
          onClick={() => { sounds.btnClick(); setMobileGameTab('board'); }}
        >
          🗺️ Board
        </button>
        <button
          className={`mobile-game-tab ${mobileGameTab === 'actions' ? 'active' : ''}`}
          onClick={() => { sounds.btnClick(); setMobileGameTab('actions'); }}
        >
          🎲 {isMyTurn ? 'YOUR TURN' : 'Actions'}
          {isMyTurn && state.phase === 'rolling' && <span className="mobile-turn-pulse">!</span>}
        </button>
        <button
          className={`mobile-game-tab ${mobileGameTab === 'players' ? 'active' : ''}`}
          onClick={() => { sounds.btnClick(); setMobileGameTab('players'); }}
        >
          👥 Castaways
        </button>
        <button
          className={`mobile-game-tab ${mobileGameTab === 'hand' ? 'active' : ''}`}
          onClick={() => { sounds.btnClick(); setMobileGameTab('hand'); }}
        >
          📜 Hand ({viewedPlayer.clueCards.length})
        </button>
      </div>

      {/* LEFT PANEL: CASTAWAY DOSSIERS */}
      <aside className="left-panel">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Temporal Castaways
        </div>

        {state.players.map((p, idx) => {
          const isActive = idx === state.currentPlayerIndex;
          const isMe = isOnline && p.id === network.playerId;
          const isInspected = viewedPlayer.id === p.id;
          const paradoxPercent = Math.min(100, (p.paradox / 5) * 100);
          let paradoxClass = 'paradox-fill-low';
          if (p.paradox >= 4) paradoxClass = 'paradox-fill-high';
          else if (p.paradox >= 2) paradoxClass = 'paradox-fill-mid';

          return (
            <div
              key={p.id ?? idx}
              className={`player-card ${isActive ? 'active-turn' : ''} ${isInspected ? 'inspected-player' : ''}`}
              style={{ borderLeft: `4px solid ${p.color}`, cursor: 'pointer' }}
              title={`Click to view ${p.name}'s hand/clues`}
              onClick={() => {
                sounds.btnClick();
                setInspectedPlayerId(p.id);
              }}
            >
              {isActive && <div className="turn-indicator">▶</div>}
              <div className="player-card-header">
                <img src={p.role.avatar} className="player-avatar-small" alt={p.name} />
                <div style={{ flex: 1 }}>
                  <div className="player-card-name" style={{ color: p.color }}>
                    {p.name}
                    {p.isAi ? <span className="bot-badge">🤖 BOT</span> : <span className="human-badge">👤</span>}
                    {isMe && <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', fontWeight: 'normal' }}> (You)</span>}
                  </div>
                  <div className="player-card-role">{p.role.name}</div>
                </div>
                <div className="player-points">{p.points} PTS</div>
              </div>

              <div className="player-stats">
                <div className="stat-row">
                  <span className="stat-label">Energy</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="stat-bar">
                      <div className="stat-bar-fill energy-fill" style={{ width: `${(p.energy / 10) * 100}%` }}></div>
                    </div>
                    <span className="stat-value" style={{ color: 'var(--energy-color)' }}>{p.energy}/10</span>
                  </div>
                </div>

                <div className="stat-row">
                  <span className="stat-label">Paradox</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="stat-bar">
                      <div className={`stat-bar-fill ${paradoxClass}`} style={{ width: `${paradoxPercent}%` }}></div>
                    </div>
                    <span className="stat-value" style={{ color: p.paradox >= 4 ? 'var(--text-danger)' : 'var(--text-primary)' }}>
                      {p.paradox}/5
                    </span>
                  </div>
                </div>

                <div className="stat-row" style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>Era: <strong>{ERA_NAMES[p.currentEra].replace(' Era', '')}</strong></span>
                  <span>Clues: <strong>{(!isOnline || isMe) ? p.clueCards.filter(c => !c.isDecoy).length : p.clueCards.length}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </aside>

      {/* CENTER: THE FOUR QUADRANTS BOARD */}
      <main className="board-container">
        {/* Mobile floating quick action on board */}
        {isMyTurn && (
          <div className="mobile-floating-action hide-desktop" style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 30, display: 'flex', gap: '8px' }}>
            {state.phase === 'rolling' && (
              <button
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 4px 20px rgba(99, 102, 241, 0.7)' }}
                disabled={isRolling}
                onClick={handleRollDice}
              >
                🎲 ROLL DIE
              </button>
            )}
            {state.phase === 'action' && (
              <button
                className="btn btn-accent"
                style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 800, boxShadow: '0 4px 20px rgba(234, 179, 8, 0.6)' }}
                onClick={handleEndTurn}
              >
                ⏭️ FINISH TURN
              </button>
            )}
          </div>
        )}

        <div className="board-camera-bar">
          {['full', 'focus-spanish', 'focus-american', 'focus-japanese', 'focus-myth', 'auto'].map((cam) => (
            <button
              key={cam}
              className={`board-cam-btn ${cameraMode === cam ? 'active' : ''}`}
              onClick={() => { sounds.btnClick(); setCameraMode(cam); }}
            >
              {cam === 'full' ? '🗺️ Full Map' : (cam === 'auto' ? '🎯 Auto Focus' : cam.replace('focus-', '').toUpperCase())}
            </button>
          ))}
        </div>

        {state.temporalOccurrence > 0 && (
          <div className="temporal-badge">
            ⚡ Temporal Occurrence Active ({state.temporalOccurrence} turns left)!
          </div>
        )}

        <div className="board-viewport">
          <div className={`board-map-wrapper ${cameraMode === 'auto' ? `focus-${currentPlayer.currentEra}` : (cameraMode === 'full' ? '' : cameraMode)}`}>
            {/* SVG Path lines connecting circle spaces */}
            <svg className="board-paths-svg" viewBox="0 0 1024 765" preserveAspectRatio="none">
              {ERA_ORDER.map(era => {
                const coords = (activeCoords[era] || ERA_TILE_COORDINATES[era]);
                if (!coords || coords.length === 0) return null;
                const connections = (typeof getActivePathConnections === 'function') ? getActivePathConnections() : {};
                const eraConns = connections[era];
                const isActiveEra = currentPlayer.currentEra === era;

                if (eraConns && Object.keys(eraConns).length > 0) {
                  return Object.entries(eraConns).map(([fromStr, toList]) => {
                    const fromIdx = parseInt(fromStr, 10);
                    const fromCoord = coords[fromIdx];
                    if (!fromCoord || !Array.isArray(toList)) return null;
                    return toList.map(toIdx => {
                      const toCoord = coords[toIdx];
                      if (!toCoord) return null;
                      return (
                        <line
                          key={`${era}_${fromIdx}_${toIdx}`}
                          x1={(fromCoord.x * 1024) / 100}
                          y1={(fromCoord.y * 765) / 100}
                          x2={(toCoord.x * 1024) / 100}
                          y2={(toCoord.y * 765) / 100}
                          className={`board-path-line ${isActiveEra ? 'active-era-path' : ''}`}
                          strokeWidth={isActiveEra ? 3 : 2}
                          opacity={isActiveEra ? 1 : 0.35}
                        />
                      );
                    });
                  });
                }

                let d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${(c.x * 1024) / 100} ${(c.y * 765) / 100}`).join(' ') + ' Z';
                return <path key={era} d={d} className={`board-path-line ${isActiveEra ? 'active-era-path' : ''}`} />;
              })}
              {/* Connections from Timegate Spaces to Central Nexus Portal Dial */}
              {ERA_ORDER.map(era => {
                const tgIdx = state.board[era].findIndex(t => t.type === 'timegate');
                if (tgIdx === -1) return null;
                const c = (activeCoords[era] || ERA_TILE_COORDINATES[era])[tgIdx];
                return (
                  <path
                    key={era + '-nexus'}
                    d={`M ${(c.x * 1024) / 100} ${(c.y * 765) / 100} L ${1024 * 0.50} ${765 * 0.49}`}
                    className="board-path-line"
                    style={{ stroke: '#00E5FF', strokeWidth: 3, strokeDasharray: '4 4' }}
                  />
                );
              })}
            </svg>

            {/* Circular Spaces along the paths */}
            <div className="board-map">
              {ERA_ORDER.map(era => {
                const tiles = state.board[era];
                const coords = (activeCoords[era] || ERA_TILE_COORDINATES[era]);

                return tiles.map((t, idx) => {
                  const coord = coords[idx];
                  const tileType = t.type;
                  const playersOnTile = state.players.filter(p => p.currentEra === era && p.tileIndex === idx);

                  let isReachable = false;
                  if (state.phase === 'moving' && state.movesRemaining > 0 && currentPlayer.currentEra === era) {
                    const cIdx = currentPlayer.tileIndex;
                    const dir = state.movementDirection === 'backward' ? -1 : 1;
                    if (dir === 1 && idx === (cIdx + 1) % tiles.length) {
                      isReachable = true;
                    } else if (dir === -1 && idx === (cIdx - 1 + tiles.length) % tiles.length) {
                      isReachable = true;
                    }
                  }

                  let icon = '•';
                  if (tileType === 'clue') icon = '🔍';
                  else if (tileType === 'event') icon = '⚡';
                  else if (tileType === 'danger') icon = '⚠️';
                  else if (tileType === 'artifact') icon = '🏆';
                  else if (tileType === 'timegate') icon = '🌀';
                  else if (tileType === 'paradox') icon = '⏳';
                  else if (tileType === 'start') icon = '🚩';

                  return (
                    <div
                      key={t.id}
                      className={`mario-party-space space-${tileType} ${isReachable ? 'reachable-space' : ''}`}
                      style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                      title={`${tileType.toUpperCase()} (Space #${idx + 1} - ${ERA_NAMES[era]})`}
                      onClick={() => handleMoveToTile(t.id)}
                    >
                      {isReachable && <div className="reachable-arrow-indicator">▼</div>}
                      <div className="space-disc">
                        <span className="space-icon">{icon}</span>
                      </div>
                      {t.trap && <span className="tile-trap-indicator" title="Temporal Trap!">💣</span>}

                      {playersOnTile.length > 0 && (
                        <div className="tile-players">
                          {playersOnTile.map(p => {
                            const isPawnTurn = p.id === currentPlayer.id;
                            return (
                              <div
                                key={p.id}
                                className={`mario-pawn ${isPawnTurn ? 'active-turn' : ''}`}
                                title={`${p.name} (${p.role.name})`}
                              >
                                {isPawnTurn && <div className="pawn-turn-arrow">▼ YOU</div>}
                                <div className="pawn-badge" style={{ background: p.color }}>P{p.id + 1}</div>
                                <img src={p.role.avatar} className="pawn-sprite" alt={p.name} />
                                <div className="pawn-pedestal" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }}></div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT PANEL: COMMAND CENTER & ACTIONS */}
      <aside className="right-panel">
        <div className="panel-section" style={{ borderLeft: `3px solid ${currentPlayer.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                Current Turn {isAiCurrent ? <span className="bot-badge">🤖 BOT</span> : <span className="human-badge">👤 HUMAN</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: currentPlayer.color }}>
                {currentPlayer.name}
              </div>
            </div>
            <img src={currentPlayer.role.avatar} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} alt="role" />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Location: <strong style={{ color: 'var(--text-primary)' }}>{ERA_NAMES[currentPlayer.currentEra]}</strong> (Tile #{currentPlayer.tileIndex})
          </div>
          {isAiCurrent && (
            <div className="ai-turn-banner" style={{ marginTop: '8px' }}>
              <span className="ai-pulse-dot"></span>
              <span><strong>{currentPlayer.name}</strong> is calculating actions...</span>
            </div>
          )}
        </div>

        {/* DICE & MOVEMENT */}
        <div className="panel-section">
          <div className="panel-section-title">Movement & Dice</div>
          <div className="dice-area">
            <div
              id="dice-element"
              className={`dice ${isRolling ? 'rolling' : ''}`}
              title="Click to Roll Die"
              onClick={handleRollDice}
            >
              {state.diceResult !== null ? state.diceResult : '?'}
            </div>
            <div>
              <div className="dice-result">
                Phase: <strong style={{ color: 'var(--text-accent)', textTransform: 'uppercase' }}>{state.phase}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                {state.phase === 'rolling' ? 'Roll D6 to begin move' : `Moves left: <strong>${state.movesRemaining}</strong>`}
              </div>
            </div>
          </div>

          {state.phase === 'rolling' && (
            <div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'var(--space-sm)', padding: '8px' }}
                disabled={!isMyTurn || isRolling}
                onClick={handleRollDice}
              >
                🎲 Roll Movement Die
              </button>

              {currentPlayer.roleKey === 'EXPLORER' && isMyTurn && (
                <div>
                  {state.momentumActive ? (
                    <div style={{ marginTop: '6px', padding: '6px', background: 'rgba(234, 179, 8, 0.2)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: '6px', fontSize: '0.75rem', color: '#FACC15', textAlign: 'center', fontWeight: 600 }}>
                      🏃 Momentum Activated! Roll to move manually.
                    </div>
                  ) : (currentPlayer.activeCooldown === 0 && !currentPlayer.usedAbilityThisTurn && currentPlayer.energy >= 2 && (
                    <button
                      className="btn btn-accent"
                      style={{ width: '100%', marginTop: '6px', padding: '6px', fontSize: '0.75rem' }}
                      onClick={handleTriggerMomentum}
                    >
                      🏃 Activate Momentum First (-2 Energy, Manual Move)
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {state.phase === 'moving' && (
            <div>
              {state.momentumActive ? (
                <div className="momentum-panel" style={{ marginTop: 'var(--space-sm)', padding: '10px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, color: '#FACC15', fontSize: '0.85rem' }}>
                    <span>🏃 Momentum Active!</span>
                    <span className="badge" style={{ background: '#FACC15', color: '#000', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Manual Move</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '6px 0' }}>
                    Moves left: <strong>{state.movesRemaining}</strong> spaces. Pause & interact with any tile!
                  </div>

                  {!state.momentumUsedMidTile && state.board[currentPlayer.currentEra][currentPlayer.tileIndex].type !== 'start' ? (
                    <button
                      className="btn btn-accent"
                      style={{ width: '100%', marginBottom: '6px', padding: '8px', fontSize: '0.8rem' }}
                      disabled={!isMyTurn}
                      onClick={handleInteractMomentum}
                    >
                      ✨ Interact with Current Space ({state.board[currentPlayer.currentEra][currentPlayer.tileIndex].type.toUpperCase()})
                    </button>
                  ) : (state.momentumUsedMidTile && (
                    <div style={{ fontSize: '0.7rem', color: '#10B981', marginBottom: '6px' }}>
                      ✓ Tile interaction used! Continue moving to finish.
                    </div>
                  ))}

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }}
                    disabled={!isMyTurn}
                    onClick={handleStepMove}
                  >
                    Step Forward ➡️ ({state.movesRemaining} left)
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 'var(--space-sm)', padding: '10px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, color: '#60A5FA', fontSize: '0.85rem' }}>
                    <span style={{ display: 'inline-block', animation: 'pawnHop 0.6s infinite alternate' }}>🚶</span>
                    <span>Auto-Moving... ({state.movesRemaining} left)</span>
                  </div>

                  {currentPlayer.roleKey === 'EXPLORER' && currentPlayer.activeCooldown === 0 && !currentPlayer.usedAbilityThisTurn && currentPlayer.energy >= 2 && isMyTurn && (
                    <button
                      className="btn btn-accent"
                      style={{ width: '100%', marginTop: '8px', padding: '6px 8px', fontSize: '0.75rem' }}
                      onClick={handleTriggerMomentum}
                    >
                      ⚡ Pause & Activate Momentum (-2 En)
                    </button>
                  )}

                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '6px', padding: '5px', fontSize: '0.72rem', opacity: 0.85 }}
                    disabled={!isMyTurn}
                    onClick={handleStepMove}
                  >
                    ⏩ Step Immediately
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SPECIAL ACTIONS */}
        <div className="panel-section">
          <div className="panel-section-title">Temporal Actions</div>
          <div className="action-buttons">
            <button
              className="action-btn"
              disabled={!isMyTurn || state.phase === 'moving' || currentPlayer.reverseTimeCooldown > 0 || currentPlayer.energy < GAME_CONSTANTS.REVERSE_TIME_COST}
              title={`Spend 3 Energy to roll and move backwards (${GAME_CONSTANTS.REVERSE_TIME_COOLDOWN} Turn CD)`}
              onClick={handleReverseTime}
            >
              <span className="action-btn-icon">⏪</span>
              <span>Reverse Time</span>
              <span className="action-btn-cost">
                {currentPlayer.reverseTimeCooldown > 0 ? `CD: ${currentPlayer.reverseTimeCooldown}T` : '-3 Energy'}
              </span>
            </button>

            <button
              className="action-btn"
              disabled={!isMyTurn || state.phase === 'moving'}
              title="Rest your entire turn to recover +3 Energy"
              onClick={handleRest}
            >
              <span className="action-btn-icon">💤</span>
              <span>Rest (Skip)</span>
              <span className="action-btn-cost">+3 Energy</span>
            </button>

            <button
              className="action-btn"
              disabled={!isMyTurn || state.phase === 'moving' || currentPlayer.usedAbilityThisTurn || currentPlayer.activeCooldown > 0 || currentPlayer.energy < (currentPlayer.role.active.energyCost || 0)}
              title={currentPlayer.role.active.description}
              onClick={handleUseSkill}
            >
              <span className="action-btn-icon">✨</span>
              <span>{currentPlayer.role.active.name}</span>
              <span className="action-btn-cost">
                {currentPlayer.usedAbilityThisTurn ? 'Used this turn' : (currentPlayer.activeCooldown > 0 ? `CD: ${currentPlayer.activeCooldown}T` : `-${currentPlayer.role.active.energyCost || 0} En`)}
              </span>
            </button>

            {(() => {
              const matchingArt = currentPlayer.artifactCards.find(a => a.era === currentPlayer.currentEra);
              return (
                <button
                  className="action-btn"
                  disabled={!isMyTurn || !matchingArt}
                  title="Return matching artifact to this timeline for points!"
                  onClick={handleReturnArtifact}
                >
                  <span className="action-btn-icon">📦</span>
                  <span>Return Relic</span>
                  <span className="action-btn-cost">+5 Points</span>
                </button>
              );
            })()}
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'var(--space-md)', padding: '8px' }}
            disabled={!isMyTurn || state.phase === 'moving'}
            onClick={handleEndTurn}
          >
            Finish Turn ⏭️
          </button>
        </div>

        {/* TIMELINE CHRONICLE LOG FEED */}
        <div className="panel-section" style={{ flex: 1, minHeight: '120px', display: 'flex', flexDirection: 'column' }}>
          <div className="panel-section-title">Timeline Chronicle</div>
          <div id="game-log-feed" className="game-log">
            {engine.logEntries.slice().reverse().map((l, i) => (
              <div key={i} className="log-entry">
                <span className="log-player">[{l.type.toUpperCase()}]</span> {l.message}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* BOTTOM PANEL: HAND & DOSSIER */}
      <section className="bottom-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div className="tab-nav" style={{ margin: 0 }}>
            <button
              className={`tab-btn ${activeHandTab === 'mission' ? 'active' : ''}`}
              onClick={() => { sounds.btnClick(); setActiveHandTab('mission'); }}
            >
              📜 Mission Dossier
            </button>
            <button
              className={`tab-btn ${activeHandTab === 'clues' ? 'active' : ''}`}
              onClick={() => { sounds.btnClick(); setActiveHandTab('clues'); }}
            >
              🔍 Clues ({viewedPlayer.clueCards.length})
            </button>
            <button
              className={`tab-btn ${activeHandTab === 'artifacts' ? 'active' : ''}`}
              onClick={() => { sounds.btnClick(); setActiveHandTab('artifacts'); }}
            >
              🏆 Relics ({viewedPlayer.artifactCards.length})
            </button>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Viewing: <strong style={{ color: viewedPlayer.color }}>{viewedPlayer.name}{isViewingSelf && isOnline ? ' (You)' : ''}</strong>'s Hand</span>
            {!isViewingSelf && (
              <button
                className="btn"
                style={{ padding: '2px 8px', fontSize: '0.65rem', background: 'var(--accent-gold)', color: '#000', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => { sounds.btnClick(); setInspectedPlayerId(null); }}
              >
                👁️ View My Hand
              </button>
            )}
          </div>
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeHandTab === 'mission' && viewedPlayer.mission && (
            <div className="mission-display">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="mission-title">
                    {isViewingSelf
                      ? `Mission: Retrieve ${viewedPlayer.mission.artifactNickname || viewedPlayer.mission.artifactName || 'Classified Relic'}`
                      : `Mission: Classified Objective (${viewedPlayer.name})`}
                  </div>
                  <div className="mission-objective">
                    {isViewingSelf
                      ? viewedPlayer.mission.description
                      : `Historical mission details and clues are classified to ${viewedPlayer.name}.`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                    Target Era: <strong>{ERA_NAMES[viewedPlayer.mission.targetEra]}</strong>
                  </span>
                </div>
              </div>

              <div className="mission-progress">
                <span className="mission-progress-text">Clue Progress:</span>
                <div className="mission-progress-bar">
                  <div
                    className="mission-progress-fill"
                    style={{
                      width: `${(Math.min(3, isViewingSelf ? (viewedPlayer.clueProgress[viewedPlayer.mission.artifactId] || 0) : viewedPlayer.clueCards.length) / 3) * 100}%`
                    }}
                  ></div>
                </div>
                <span className="mission-progress-text">
                  {isViewingSelf
                    ? `${viewedPlayer.clueProgress[viewedPlayer.mission.artifactId] || 0}/3 Required Clues`
                    : `${viewedPlayer.clueCards.length} Clues Collected`}
                </span>
              </div>
            </div>
          )}

          {activeHandTab === 'clues' && (
            <div className="hand-cards">
              {viewedPlayer.clueCards.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '10px' }}>
                  No clues collected yet. Land on Clue Tiles (🔍) in different eras to discover hints.
                </div>
              ) : (
                viewedPlayer.clueCards.map(c => {
                  if (isViewingSelf) {
                    const cardImg = c.cardImage || c.image || '';
                    const cardDesc = c.description || c.hint || (c.isDecoy ? 'Decoy Hint' : 'Clue Card');
                    return (
                      <div
                        key={c.id}
                        className="hand-card clue-card"
                        title={cardDesc}
                        onClick={() => {
                          sounds.btnClick();
                          onInspectCard({
                            title: c.isDecoy ? 'Decoy Card' : 'Clue Card',
                            cardType: c.isDecoy ? 'Decoy Card' : 'Clue Card',
                            description: cardDesc,
                            image: cardImg,
                            era: c.era
                          });
                        }}
                      >
                        <img src={cardImg} alt={cardDesc} />
                        <div className="hand-card-type" style={{ color: c.isDecoy ? 'var(--text-danger)' : 'var(--tile-clue)' }}>
                          {c.isDecoy ? 'Decoy Hint' : `${ERA_NAMES[c.era].replace(' Era', '')}`}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={c.id}
                        className="hand-card clue-card clue-card-secret"
                        title={`Secret Clue Card (${ERA_NAMES[c.era].replace(' Era', '')})`}
                      >
                        <div className="card-secret-back">
                          <div className="card-secret-icon">🔒</div>
                          <div className="card-secret-label">{ERA_NAMES[c.era].replace(' Era', '')}</div>
                        </div>
                        <div className="hand-card-type" style={{ color: 'var(--text-secondary)' }}>
                          Classified Clue
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>
          )}

          {activeHandTab === 'artifacts' && (
            <div className="hand-cards">
              {viewedPlayer.artifactCards.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '10px' }}>
                  No historical artifacts acquired yet. Reach an Artifact Tile with 3 clues to retrieve one!
                </div>
              ) : (
                viewedPlayer.artifactCards.map(a => (
                  <div
                    key={a.id}
                    className="hand-card artifact-card"
                    title={`${a.name} (${a.nickname})`}
                    onClick={() => {
                      sounds.btnClick();
                      onInspectCard({
                        title: `${a.name} (${a.nickname})`,
                        cardType: 'Historical Relic',
                        description: a.description,
                        image: a.cardImage || a.image,
                        era: a.era
                      });
                    }}
                  >
                    <img src={a.cardImage || a.image} alt={a.name} />
                    <div className="hand-card-type" style={{ color: 'var(--tile-artifact)' }}>
                      {a.nickname}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      {/* Floating In-Game Chat Drawer */}
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
