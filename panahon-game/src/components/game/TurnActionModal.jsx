import React, { memo, useEffect, useMemo, useRef } from 'react';
import { ERA_NAMES } from '../../gameData.js';
import Dice from './Dice.jsx';

function TurnActionModal({
  state,
  currentPlayer,
  isMyTurn,
  isRolling,
  rollResultVisible,
  resultDiceRef,
  blocked,
  onRollDice,
  onRest,
  onAcknowledgeSkip,
  onUseSkill,
  onReturnArtifact,
  onCoopStabilizeTimeline,
  onCoopTransferEnergy,
  onEndTurn,
  onTimeWarp
}) {
  const dialogRef = useRef(null);

  const model = useMemo(() => {
    if (!state || !currentPlayer || !isMyTurn || blocked) return null;

    if (state.phase === 'rolling' || rollResultVisible) {
      return { mode: 'roll' };
    }
    if (state.phase === 'action') {
      return { mode: 'action' };
    }
    return null;
  }, [state, currentPlayer, isMyTurn, blocked, rollResultVisible]);

  useEffect(() => {
    if (!model || !dialogRef.current) return;
    const focusTarget = dialogRef.current.querySelector('button:not(:disabled)');
    focusTarget?.focus({ preventScroll: true });
  }, [model?.mode, currentPlayer?.id, state?.currentPlayerIndex]);

  if (!model) return null;

  const isExplorer = currentPlayer.roleKey === 'EXPLORER';
  const isSkipped = Boolean(currentPlayer.skipNextTurn);
  const isTimeStopped = Boolean(currentPlayer.timeStoppedBy);
  const isExhausted = currentPlayer.energy <= 0 && !state.momentumActive;
  const activeSkill = currentPlayer.role?.active || {};
  const activeCost = activeSkill.energyCost || 0;
  const hasEnoughEnergy = (currentPlayer.energy || 0) >= activeCost;
  const abilityOnCooldown = (currentPlayer.activeCooldown || 0) > 0;
  const abilityUsed = Boolean(currentPlayer.usedAbilityThisTurn);
  const momentumPrimed = isExplorer && Boolean(state.momentumActive);
  const canUseAbility = !abilityUsed && !abilityOnCooldown && hasEnoughEnergy && !momentumPrimed &&
    (isExplorer ? (state.phase === 'rolling' || state.phase === 'moving') : state.phase === 'action');
  const currentTile = state.board?.[currentPlayer.currentEra]?.[currentPlayer.tileIndex];
  const timeGateCost = isExplorer ? 1 : 2;
  const canTimeWarp = currentTile?.type === 'timeGate' && currentPlayer.energy >= timeGateCost;
  const matchingArtifact = currentTile?.type === 'artifact'
    ? currentPlayer.artifactCards?.find(card => (card.originEra || card.era) === currentPlayer.currentEra)
    : null;

  const abilityStatus = abilityUsed
    ? 'Already used this turn'
    : abilityOnCooldown
      ? `Cooldown: ${currentPlayer.activeCooldown} turn${currentPlayer.activeCooldown === 1 ? '' : 's'}`
      : !hasEnoughEnergy
        ? `Requires ${activeCost} Energy`
        : `${activeCost} Energy`;

  return (
    <div className={`turn-action-overlay turn-action-${model.mode}`}>
      <section
        ref={dialogRef}
        className="turn-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="turn-action-title"
        aria-describedby="turn-action-description"
      >
        <header className="turn-action-header" style={{ '--turn-color': currentPlayer.color || '#C2974D' }}>
          <img src={currentPlayer.role?.avatar} alt="" className="turn-action-avatar" />
          <div>
            <div className="turn-action-eyebrow">
              {model.mode === 'roll' ? 'Your turn' : 'Movement complete'}
            </div>
            <h2 id="turn-action-title">
              {model.mode === 'roll'
                ? `${currentPlayer.name}, roll the Chrono Die`
                : 'Choose an action or end your turn'}
            </h2>
            <div className="turn-action-location">
              {ERA_NAMES[currentPlayer.currentEra]} · Tile #{currentPlayer.tileIndex}
            </div>
          </div>
          <span className="turn-action-energy">⚡ {currentPlayer.energy} EN</span>
        </header>

        {model.mode === 'roll' && (
          <div className="turn-action-body turn-roll-body">
            {currentPlayer.completed ? (
              <>
                <p id="turn-action-description" className="turn-action-copy">
                  Your mission is complete. Support the remaining castaways or pass your turn.
                </p>
                <div className="turn-action-stack">
                  <button
                    className="turn-action-btn secondary"
                    disabled={currentPlayer.energy < 2 || state.timelineMeter <= 0}
                    onClick={onCoopStabilizeTimeline}
                  >
                    🌀 Stabilize Timeline <small>-2 EN · -1 Breach</small>
                  </button>
                  {state.players
                    .filter(player => !player.completed && player.id !== currentPlayer.id)
                    .map(player => (
                      <button
                        key={player.id}
                        className="turn-action-btn secondary"
                        disabled={currentPlayer.energy < 2}
                        onClick={() => onCoopTransferEnergy?.(player.id, 2)}
                      >
                        ⚡ Send 2 Energy to {player.name}
                      </button>
                    ))}
                  <button className="turn-action-btn primary" onClick={onEndTurn}>Pass Turn →</button>
                </div>
              </>
            ) : isSkipped ? (
              <>
                <div className={`turn-action-notice ${isTimeStopped ? 'stasis' : 'danger'}`}>
                  <strong>{isTimeStopped ? '⌛ Temporal Stasis' : '⛔ Hazard Penalty'}</strong>
                  <span id="turn-action-description">
                    {isTimeStopped
                      ? `You were frozen by ${currentPlayer.timeStoppedBy?.name || 'a Chronomancer'}. Thaw to pass the turn.`
                      : 'This turn must be skipped. Acknowledge the penalty to continue.'}
                  </span>
                </div>
                <button className="turn-action-btn primary" disabled={isRolling} onClick={onAcknowledgeSkip}>
                  {isTimeStopped ? 'Break Stasis & Thaw' : 'Acknowledge Skipped Turn'}
                </button>
              </>
            ) : isExhausted ? (
              <>
                <div className="turn-action-notice danger">
                  <strong>⚠️ Exhausted</strong>
                  <span id="turn-action-description">You need to rest before you can move again.</span>
                </div>
                <button className="turn-action-btn primary" disabled={isRolling} onClick={onRest}>
                  💤 Rest and Recover +3 Energy
                </button>
              </>
            ) : (
              <>
                <p id="turn-action-description" className="turn-action-copy">
                  Roll to determine how far your operative travels along the timeline.
                </p>
                <div className="turn-action-dice-stage">
                  <div ref={resultDiceRef} className="turn-action-result-dice-source">
                    <Dice
                      value={state.diceResult}
                      isRolling={isRolling}
                      size="lg"
                      theme="chrono"
                      isInteractive={!isRolling && !rollResultVisible}
                      disabled={isRolling || rollResultVisible}
                      onClick={!rollResultVisible ? onRollDice : undefined}
                    />
                  </div>
                  <div className="turn-action-dice-copy">
                    <strong>
                      {isRolling
                        ? 'Rolling through the quantum flux…'
                        : rollResultVisible
                          ? `You rolled ${state.diceResult}!`
                          : momentumPrimed
                            ? 'Momentum is active'
                            : 'Chrono Movement Die'}
                    </strong>
                    <span>
                      {rollResultVisible
                        ? `${state.movesRemaining || state.totalMoves || state.diceResult} movement spaces granted`
                        : 'The modal will close before your movement begins.'}
                    </span>
                  </div>
                </div>

                {!rollResultVisible && !isRolling && isExplorer && (
                  <div className="turn-action-ability-row">
                    <div>
                      <strong>🏃 {activeSkill.name || 'Momentum'}</strong>
                      <span>{momentumPrimed ? 'Active for this movement' : activeSkill.description}</span>
                    </div>
                    <button
                      className="turn-action-btn compact secondary"
                      disabled={!canUseAbility}
                      onClick={onUseSkill}
                    >
                      {momentumPrimed ? 'Activated' : `Use · ${abilityStatus}`}
                    </button>
                  </div>
                )}

                {!rollResultVisible && (
                  <div className="turn-action-footer-actions">
                    <button className="turn-action-btn ghost" disabled={isRolling} onClick={onRest}>💤 Rest instead</button>
                    <button className="turn-action-btn primary" disabled={isRolling} onClick={onRollDice}>
                      🎲 {isRolling ? 'Rolling…' : 'Roll Die'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {model.mode === 'action' && (
          <div className="turn-action-body">
            <p id="turn-action-description" className="turn-action-copy">
              Your movement is complete. Use an available action, or finish your turn.
            </p>

            <div className={`turn-action-ability-row ${canUseAbility ? 'available' : ''}`}>
              <div>
                <strong>✨ {activeSkill.name || 'Operative Ability'}</strong>
                <span>
                  {isExplorer
                    ? (abilityUsed ? 'Momentum was used during this turn.' : 'Momentum can only be activated before or during movement.')
                    : (activeSkill.description || 'No ability description available.')}
                </span>
              </div>
              {!isExplorer && (
                <button className="turn-action-btn compact secondary" disabled={!canUseAbility} onClick={onUseSkill}>
                  {canUseAbility ? `Use · ${activeCost} EN` : abilityStatus}
                </button>
              )}
            </div>

            <div className="turn-action-stack">
              {matchingArtifact && (
                <button className="turn-action-btn secondary" onClick={onReturnArtifact}>
                  📦 Return {matchingArtifact.name}
                </button>
              )}
              {currentTile?.type === 'timeGate' && (
                <button className="turn-action-btn secondary" disabled={!canTimeWarp} onClick={onTimeWarp}>
                  🌀 Time Warp <small>-{timeGateCost} EN</small>
                </button>
              )}
              <button className="turn-action-btn primary end-turn" onClick={onEndTurn}>
                🏁 {canUseAbility ? 'Skip Ability & End Turn' : 'End Turn'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default memo(TurnActionModal);
