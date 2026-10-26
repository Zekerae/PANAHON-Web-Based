import React, { memo } from 'react';
import sounds from '../../sound.js';
import { ERA_NAMES, GAME_CONSTANTS } from '../../gameData.js';
import Dice from './Dice';

function GameActions({
  state,
  currentPlayer,
  isMyTurn,
  isRolling,
  isAiCurrent,
  logEntries,
  onRollDice,
  onStepMove,
  onInteractMomentum,
  onReverseTime,
  onRest,
  onUseSkill,
  onReturnArtifact,
  onEndTurn,
  onTimeWarp,
  isSpectator = false,
  viewedPlayerId = null,
  onSelectPlayer = null,
  autoFollow = true,
  onToggleAutoFollow = null,
  omniscientIntel = true,
  onToggleOmniscientIntel = null,
  simulationSpeed = 1,
  onChangeSimulationSpeed = null
}) {
  if (!state || !currentPlayer) return null;

  const isStartOfMovement = state.phase === 'moving' && !state.hasMovedThisTurn && (!state.stepsTakenThisTurn || state.stepsTakenThisTurn === 0);
  const isMovingBackward = state.movementDirection === 'backward';
  const canReverseTime = isMyTurn && isStartOfMovement && !isMovingBackward && currentPlayer.reverseTimeCooldown === 0 && currentPlayer.energy >= GAME_CONSTANTS.REVERSE_TIME_COST;

  let reverseTimeBadge = '-3 Energy';
  let reverseTimeTitle = 'Roll movement die first. Reverse Time can only be activated after rolling at the start of your turn.';
  let reverseTimeDisabled = true;

  if (currentPlayer.reverseTimeCooldown > 0) {
    reverseTimeBadge = `CD: ${currentPlayer.reverseTimeCooldown}T`;
    reverseTimeTitle = `Reverse Time is on cooldown (${currentPlayer.reverseTimeCooldown} turns remaining).`;
  } else if (isMovingBackward) {
    reverseTimeBadge = 'Active ⏪';
    reverseTimeTitle = 'Reverse Time is currently active for this turn.';
  } else if (state.phase === 'rolling') {
    reverseTimeBadge = 'Roll Die First';
    reverseTimeTitle = 'Roll the movement die first! Reverse Time can be activated right after rolling at the start of your turn.';
  } else if (state.phase === 'moving') {
    if (!isStartOfMovement) {
      reverseTimeBadge = 'Moved Already';
      reverseTimeTitle = 'Reverse Time can only be activated at the start of your turn before moving!';
    } else if (currentPlayer.energy < GAME_CONSTANTS.REVERSE_TIME_COST) {
      reverseTimeBadge = 'Need 3 Energy';
      reverseTimeTitle = `Requires ${GAME_CONSTANTS.REVERSE_TIME_COST} Chrono Energy (You have ${currentPlayer.energy}).`;
    } else if (isMyTurn) {
      reverseTimeDisabled = false;
      reverseTimeBadge = '-3 Energy';
      reverseTimeTitle = 'Reverse your movement direction! Spend 3 Energy to walk backwards along the timeline.';
    }
  }

  const role = currentPlayer.role || {};
  const activeSkill = role.active || {};
  const activeCost = activeSkill.energyCost || 0;
  const hasEnoughEnergy = (currentPlayer.energy || 0) >= activeCost;
  const isAbilityOnCooldown = (currentPlayer.activeCooldown || 0) > 0;
  const hasUsedAbilityThisTurn = Boolean(currentPlayer.usedAbilityThisTurn);
  const canUseAbilityNow = isMyTurn && state.phase === 'action' && !hasUsedAbilityThisTurn && !isAbilityOnCooldown && hasEnoughEnergy;

  let abilityBadge = `-${activeCost} En`;
  let abilityStatusText = activeSkill.description || 'Activate operative ability.';
  if (hasUsedAbilityThisTurn) {
    abilityBadge = 'Used this turn';
    abilityStatusText = 'Ability already activated this turn.';
  } else if (isAbilityOnCooldown) {
    abilityBadge = `CD: ${currentPlayer.activeCooldown}T`;
    abilityStatusText = `On cooldown for ${currentPlayer.activeCooldown} more turn(s).`;
  } else if (!hasEnoughEnergy) {
    abilityBadge = `Need ${activeCost} En`;
    abilityStatusText = `Requires ${activeCost} Chrono Energy (You have ${currentPlayer.energy || 0}).`;
  }

  const currentTile = state.board?.[currentPlayer.currentEra]?.[currentPlayer.tileIndex];
  const isOnTimeGate = currentTile?.type === 'timeGate';
  const timeGateCost = currentPlayer.roleKey === 'EXPLORER' ? 1 : 2;
  const canTimeWarp = isMyTurn && isOnTimeGate && (currentPlayer.energy || 0) >= timeGateCost;

  const matchingArtifact = currentPlayer.artifactCards?.find(a => a.era === currentPlayer.currentEra);

  if (isSpectator) {
    const players = state.players || [];
    return (
      <aside className="right-panel spectator-panel">
        {/* OBSERVATORY HEADER */}
        <div className="panel-section" style={{
          borderLeft: '4px solid #C084FC',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '1.2px',
              color: '#D8B4FE',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444', display: 'inline-block', boxShadow: '0 0 6px #EF4444' }} />
              CHRONO OBSERVATORY
            </span>
            <span style={{
              fontSize: '0.64rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#F5D0FE',
              fontWeight: 700
            }}>
              LIVE SPECTATOR
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Active Operative:
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: currentPlayer.color }}>
                {currentPlayer.name} {isAiCurrent ? '🤖' : '👤'}
              </div>
            </div>
            <img src={currentPlayer.role.avatar} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} alt="role" />
          </div>

          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Location: <strong style={{ color: '#FFF' }}>{ERA_NAMES[currentPlayer.currentEra]}</strong> (Tile #{currentPlayer.tileIndex})
          </div>

          <div style={{
            marginTop: '8px',
            padding: '6px 10px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '6px',
            fontSize: '0.74rem',
            color: '#93C5FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Phase: <strong style={{ textTransform: 'uppercase', color: '#FACC15' }}>{state.phase}</strong></span>
            {state.phase === 'moving' && (
              <span>Moves: <strong style={{ color: '#FACC15' }}>{state.movesRemaining}</strong> / {state.diceResult || 1}</span>
            )}
            {state.phase === 'rolling' && (
              <span style={{ color: '#94A3B8' }}>Awaiting roll...</span>
            )}
            {state.phase === 'action' && (
              <span style={{ color: '#34D399' }}>Resolving action...</span>
            )}
          </div>
        </div>

        {/* OPERATIVE PERSPECTIVE SWITCHER */}
        <div className="panel-section">
          <div className="panel-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Operative Focus</span>
            <span style={{ fontSize: '0.65rem', color: '#94A3B8', textTransform: 'none' }}>Click to view hand</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
            {players.map((p, idx) => {
              const isTurn = idx === state.currentPlayerIndex;
              const isViewed = (viewedPlayerId === p.id) || (viewedPlayerId === null && isTurn);
              return (
                <button
                  key={p.id ?? idx}
                  onClick={() => onSelectPlayer?.(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: isViewed
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(56, 189, 248, 0.2))'
                      : 'rgba(15, 23, 42, 0.6)',
                    border: isViewed ? `1.5px solid ${p.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#FFF'
                  }}
                >
                  <img src={p.role.avatar} style={{ width: '22px', height: '22px', borderRadius: '4px' }} alt="" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: p.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>
                      {p.points} pts &bull; {p.clueCards.length}/5
                    </div>
                  </div>
                  {isTurn && <span style={{ fontSize: '0.65rem' }}>▶</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* OBSERVATORY CONTROLS */}
        <div className="panel-section">
          <div className="panel-section-title">Spectator Controls</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: '#E2E8F0',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.25)',
              padding: '6px 10px',
              borderRadius: '6px'
            }}>
              <span>🎥 Auto-Follow Active Turn</span>
              <input
                type="checkbox"
                checked={Boolean(autoFollow)}
                onChange={(e) => onToggleAutoFollow?.(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#A855F7' }}
              />
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: '#E2E8F0',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.25)',
              padding: '6px 10px',
              borderRadius: '6px'
            }}>
              <span>👁️ Omniscient Intel (Reveal All)</span>
              <input
                type="checkbox"
                checked={Boolean(omniscientIntel)}
                onChange={(e) => onToggleOmniscientIntel?.(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#38BDF8' }}
              />
            </label>

            {/* Simulation Speed Buttons */}
            {onChangeSimulationSpeed && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.25)',
                padding: '6px 10px',
                borderRadius: '6px'
              }}>
                <span style={{ fontSize: '0.74rem', color: '#CBD5E1' }}>⚡ Pacing Speed:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => onChangeSimulationSpeed(spd)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        borderRadius: '4px',
                        background: simulationSpeed === spd ? '#A855F7' : 'rgba(255,255,255,0.08)',
                        color: simulationSpeed === spd ? '#FFF' : '#94A3B8',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {spd === 2 ? 'Turbo' : `${spd}x`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE CHRONICLE */}
        <div className="panel-section timeline-chronicle-section" style={{ flex: 1, minHeight: '160px', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
          <div className="panel-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Live Chronicle</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'none', fontWeight: 500 }}>
              {logEntries.length} entries
            </span>
          </div>
          <div id="game-log-feed" className="game-log" style={{ flex: 1, maxHeight: 'none', minHeight: 0 }}>
            {logEntries.slice().reverse().map((l, i) => (
              <div key={i} className="log-entry">
                <span className="log-player">[{l.type.toUpperCase()}]</span> {l.message}
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="right-panel">
      {/* TURN BANNER */}
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

      {/* ============================================================== */}
      {/* PHASE 1: ROLL PHASE                                            */}
      {/* ============================================================== */}
      {state.phase === 'rolling' && (
        <div className="panel-section phase-card phase-roll-card" style={{
          borderLeft: '4px solid #8B5CF6',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(15, 23, 42, 0.75) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem' }}>🎲</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.8px', color: '#C4B5FD', textTransform: 'uppercase' }}>
                Phase 1: Roll Phase
              </span>
            </div>
            <span style={{ fontSize: '0.64rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.25)', border: '1px solid rgba(139, 92, 246, 0.45)', color: '#DDD6FE', fontWeight: 700 }}>
              AWAITING ROLL
            </span>
          </div>

          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginBottom: '12px', lineHeight: 1.35 }}>
            Roll the movement die to navigate along the timeline, or rest to recover Chrono Energy.
          </div>

          {/* DICE ROLLING SECTION */}
          <div className="roll-phase-dice-card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 14px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '10px',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            marginBottom: '12px'
          }}>
            <Dice
              value={state.diceResult}
              isRolling={isRolling}
              size="md"
              theme="chrono"
              onClick={() => { sounds.diceRoll?.(); onRollDice(); }}
              disabled={!isMyTurn || isRolling}
              isInteractive={isMyTurn && !isRolling}
              showLabel={false}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FACC15', letterSpacing: '0.3px' }}>
                {isRolling ? 'Tumbling Die...' : (state.diceResult ? `Rolled: ${state.diceResult}` : 'Chrono Movement Die')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '3px', lineHeight: 1.35 }}>
                {isRolling ? 'Determining your timeline trajectory...' : 'Roll 1–6 movement spaces along the path.'}
              </div>
            </div>
          </div>

          <button
            className="btn btn-roll-dice"
            style={{ width: '100%', minWidth: 0, marginTop: '2px', marginBottom: '12px' }}
            disabled={!isMyTurn || isRolling}
            onClick={() => { sounds.diceRoll?.(); onRollDice(); }}
          >
            <span>🎲 ROLL MOVEMENT DIE</span>
            <kbd>SPACEBAR</kbd>
          </button>

          {/* REST (SKIP TURN) ALTERNATIVE */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="action-btn"
              style={{ flex: 1, padding: '7px', fontSize: '0.75rem' }}
              disabled={!isMyTurn || isRolling}
              title="Skip your turn to recover +3 Chrono Energy"
              onClick={() => { sounds.btnClick?.(); onRest(); }}
            >
              <span className="action-btn-icon">💤</span>
              <span>Rest (Skip Turn)</span>
              <span className="action-btn-cost">+3 Energy</span>
            </button>
          </div>

          <div style={{ marginTop: '8px', fontSize: '0.66rem', color: '#64748B', textAlign: 'center', fontStyle: 'italic' }}>
            Turn completion ("End Turn") will be available in Phase 2 after moving.
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MOVEMENT IN PROGRESS                                           */}
      {/* ============================================================== */}
      {state.phase === 'moving' && (
        <div className="panel-section phase-card phase-moving-card" style={{
          borderLeft: '4px solid #38BDF8',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.75) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem' }}>🚶</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.8px', color: '#7DD3FC', textTransform: 'uppercase' }}>
                Moving Along Timeline
              </span>
            </div>
            <span style={{ fontSize: '0.64rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.25)', border: '1px solid rgba(56, 189, 248, 0.45)', color: '#BAE6FD', fontWeight: 700 }}>
              {state.movesRemaining} / {state.diceResult || 1} MOVES LEFT
            </span>
          </div>

          {canReverseTime && (
            <div style={{ marginBottom: '8px', padding: '8px 10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.45)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#FACC15', fontWeight: 600, marginBottom: '6px' }}>
                <span>⏪ Reverse Time Option</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Start of turn only</span>
              </div>
              <button
                className="btn"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #d97706, #b45309)',
                  border: '1px solid #fbbf24',
                  color: '#fff',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.4)'
                }}
                onClick={onReverseTime}
              >
                <span>⏪ Reverse Direction (-3 En)</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>Walk {state.movesRemaining} spaces backward</span>
              </button>
            </div>
          )}

          {isMovingBackward && (
            <div style={{ marginBottom: '8px', padding: '6px 8px', background: 'rgba(234, 88, 12, 0.2)', border: '1px solid rgba(234, 88, 12, 0.5)', borderRadius: '6px', fontSize: '0.75rem', color: '#FDBA74', textAlign: 'center', fontWeight: 700 }}>
              ⏪ Reverse Time Active: Moving backwards along path
            </div>
          )}

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
                  onClick={onInteractMomentum}
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
                onClick={() => { sounds.stepHop?.(); onStepMove(); }}
              >
                {isMovingBackward ? 'Step Backward ⬅️' : 'Step Forward ➡️'} ({state.movesRemaining} left)
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 'var(--space-sm)', padding: '12px', background: isMovingBackward ? 'rgba(234, 88, 12, 0.12)' : 'rgba(59, 130, 246, 0.12)', border: isMovingBackward ? '1px solid rgba(234, 88, 12, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)', borderRadius: '8px' }}>
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  letterSpacing: '0.4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: isMovingBackward ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : undefined,
                  boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 3px 0 #120E0A'
                }}
                disabled={!isMyTurn}
                onClick={onStepMove}
              >
                <span>{isMovingBackward ? '⬅️ Step Backward' : '➡️ Move Forward'}</span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.22)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  {state.movesRemaining} {state.movesRemaining === 1 ? 'step left' : 'steps left'}
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', color: isMovingBackward ? '#FB923C' : '#93C5FD', marginTop: '8px', textAlign: 'center' }}>
                <span style={{ display: 'inline-block', animation: 'pawnHop 0.6s infinite alternate' }}>{isMovingBackward ? '⏪' : '🚶'}</span>
                <span>{isMovingBackward ? 'Moving in Reverse' : 'Stepping along timeline'} &bull; Click tile or press <strong>Space</strong></span>
              </div>


            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* PHASE 2: ACTION PHASE                                          */}
      {/* ============================================================== */}
      {state.phase === 'action' && (
        <div className="panel-section phase-card phase-action-card" style={{
          borderLeft: '4px solid #10B981',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.75) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1rem' }}>⚡</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.8px', color: '#6EE7B7', textTransform: 'uppercase' }}>
                Phase 2: Action Phase
              </span>
            </div>
            <span style={{ fontSize: '0.64rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.25)', border: '1px solid rgba(16, 185, 129, 0.45)', color: '#A7F3D0', fontWeight: 700 }}>
              READY FOR ACTION
            </span>
          </div>

          <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginBottom: '10px', lineHeight: 1.35 }}>
            Movement complete. Activate your ability (if not yet used), resolve tile actions, or end your turn.
          </div>

          {/* POST-MOVE ABILITY ACTIVATION */}
          <div style={{
            marginBottom: '10px',
            padding: '9px 10px',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: canUseAbilityNow ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>✨</span>
                <span>Operative Ability:</span>
                <strong style={{ color: currentPlayer.color }}>{activeSkill.name}</strong>
              </span>
              <span style={{
                fontSize: '0.64rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: hasUsedAbilityThisTurn ? 'rgba(59, 130, 246, 0.2)' : (canUseAbilityNow ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                border: hasUsedAbilityThisTurn ? '1px solid rgba(59, 130, 246, 0.4)' : (canUseAbilityNow ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)'),
                color: hasUsedAbilityThisTurn ? '#93C5FD' : (canUseAbilityNow ? '#6EE7B7' : '#FCA5A5')
              }}>
                {hasUsedAbilityThisTurn ? '✓ Used this turn' : abilityBadge}
              </span>
            </div>

            {hasUsedAbilityThisTurn ? (
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>
                ✓ {activeSkill.name} was already activated this turn.
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginBottom: '8px', lineHeight: 1.3 }}>
                  {activeSkill.description}
                </div>
                <button
                  className="btn btn-accent"
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    opacity: canUseAbilityNow ? 1 : 0.55,
                    cursor: canUseAbilityNow ? 'pointer' : 'not-allowed'
                  }}
                  disabled={!canUseAbilityNow}
                  title={abilityStatusText}
                  onClick={() => { sounds.abilityActivate?.(); onUseSkill(); }}
                >
                  <span>✨ Activate {activeSkill.name} ({abilityBadge})</span>
                </button>
              </>
            )}
          </div>

          {/* CONTEXTUAL ACTIONS: RELIC RETURN & TIME WARP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {matchingArtifact && (
              <button
                className="btn"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: 'linear-gradient(180deg, #384D26 0%, #253518 100%)',
                  border: '2px solid #6DBF4E',
                  color: '#FFF',
                  borderRadius: '6px',
                  boxShadow: 'inset 1px 1px 0 #A7F3D0, 0 3px 0 #120E0A',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                disabled={!isMyTurn}
                onClick={onReturnArtifact}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📦</span>
                  <span>Return Matching Relic: <strong>{matchingArtifact.name}</strong></span>
                </span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                  +5 Points
                </span>
              </button>
            )}

            {isOnTimeGate && (
              <button
                className="btn"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  background: canTimeWarp ? 'linear-gradient(180deg, #4D3826 0%, #352518 100%)' : '#241D17',
                  border: canTimeWarp ? '2px solid #C2974D' : '1.5px solid #4A382A',
                  color: '#FFF',
                  borderRadius: '6px',
                  cursor: canTimeWarp ? 'pointer' : 'not-allowed',
                  opacity: canTimeWarp ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                disabled={!canTimeWarp}
                title={canTimeWarp ? `Warp through the Time Gate to another era (-${timeGateCost} En)` : `Requires ${timeGateCost} Energy to warp`}
                onClick={onTimeWarp}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🌀</span>
                  <span>Time Warp (Time Gate)</span>
                </span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                  -{timeGateCost} Energy
                </span>
              </button>
            )}
          </div>

          {/* PRIMARY FINISH TURN BUTTON */}
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.88rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              borderRadius: '8px',
              boxShadow: isMyTurn ? 'inset 1px 1px 0 #FFF, inset -1px -1px 0 #7A5823, 0 3px 0 #120E0A' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isMyTurn ? 'pointer' : 'not-allowed'
            }}
            disabled={!isMyTurn}
            onClick={onEndTurn}
          >
            <span>🏁 End Turn ⏭️</span>
          </button>
        </div>
      )}

      {/* TIMELINE CHRONICLE LOG FEED */}
      <div className="panel-section timeline-chronicle-section" style={{ flex: 1, minHeight: '160px', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
        <div className="panel-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span>Timeline Chronicle</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'none', fontWeight: 500 }}>
            {logEntries.length} entries
          </span>
        </div>
        <div id="game-log-feed" className="game-log" style={{ flex: 1, maxHeight: 'none', minHeight: 0 }}>
          {logEntries.slice().reverse().map((l, i) => (
            <div key={i} className="log-entry">
              <span className="log-player">[{l.type.toUpperCase()}]</span> {l.message}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default memo(GameActions);
