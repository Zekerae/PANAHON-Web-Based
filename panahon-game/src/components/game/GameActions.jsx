import React, { memo } from 'react';
import { ERA_NAMES, GAME_CONSTANTS } from '../../gameData.js';

function GameActions({
  state,
  currentPlayer,
  isMyTurn,
  isRolling,
  isAiCurrent,
  logEntries,
  onRollDice,
  onStepMove,
  onTriggerMomentum,
  onInteractMomentum,
  onReverseTime,
  onRest,
  onUseSkill,
  onReturnArtifact,
  onEndTurn
}) {
  if (!state || !currentPlayer) return null;

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

      {/* DICE & MOVEMENT */}
      <div className="panel-section">
        <div className="panel-section-title">Movement & Dice</div>
        <div className="dice-area">
          <div
            id="dice-element"
            className={`dice ${isRolling ? 'rolling' : ''}`}
            title="Click to Roll Die"
            onClick={onRollDice}
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
              onClick={onRollDice}
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
                    onClick={onTriggerMomentum}
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
                  onClick={onStepMove}
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
                    onClick={onTriggerMomentum}
                  >
                    ⚡ Pause & Activate Momentum (-2 En)
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '6px', padding: '5px', fontSize: '0.72rem', opacity: 0.85 }}
                  disabled={!isMyTurn}
                  onClick={onStepMove}
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
            onClick={onReverseTime}
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
            onClick={onRest}
          >
            <span className="action-btn-icon">💤</span>
            <span>Rest (Skip)</span>
            <span className="action-btn-cost">+3 Energy</span>
          </button>

          <button
            className="action-btn"
            disabled={!isMyTurn || state.phase === 'moving' || currentPlayer.usedAbilityThisTurn || currentPlayer.activeCooldown > 0 || currentPlayer.energy < (currentPlayer.role.active.energyCost || 0)}
            title={currentPlayer.role.active.description}
            onClick={onUseSkill}
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
                onClick={onReturnArtifact}
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
          onClick={onEndTurn}
        >
          Finish Turn ⏭️
        </button>
      </div>

      {/* TIMELINE CHRONICLE LOG FEED */}
      <div className="panel-section" style={{ flex: 1, minHeight: '120px', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-section-title">Timeline Chronicle</div>
        <div id="game-log-feed" className="game-log">
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
