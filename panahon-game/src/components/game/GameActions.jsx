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
  onAdjustForesight,
  onRest,
  onAcknowledgeSkip,
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
  const isExhausted = Boolean(currentPlayer && currentPlayer.energy <= 0);
  const isSkipped = Boolean(currentPlayer && currentPlayer.skipNextTurn);
  const isTimeStopped = Boolean(currentPlayer && currentPlayer.timeStoppedBy);
  const canReverseTime = isMyTurn && isStartOfMovement && !isMovingBackward && currentPlayer.reverseTimeCooldown === 0 && currentPlayer.energy >= GAME_CONSTANTS.REVERSE_TIME_COST;
  const isChronomancer = currentPlayer.roleKey === 'CHRONOMANCER';
  const isExplorer = currentPlayer.roleKey === 'EXPLORER';
  const isMomentumPrimed = isExplorer && Boolean(state.momentumActive || (currentPlayer.bonusMoves && currentPlayer.bonusMoves > 0));
  const canUseForesight = isMyTurn && isStartOfMovement && isChronomancer && (!currentPlayer.temporalForesightCooldown || currentPlayer.temporalForesightCooldown <= 0) && !currentPlayer.hasUsedForesightThisTurn;

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
  const isAbilityPhase = isExplorer ? (state.phase === 'rolling') : (state.phase === 'action');
  const canUseAbilityNow = isMyTurn && isAbilityPhase && !hasUsedAbilityThisTurn && !isAbilityOnCooldown && hasEnoughEnergy && !isMomentumPrimed;

  let abilityBadge = `-${activeCost} En`;
  let abilityStatusText = activeSkill.description || 'Activate operative ability.';
  if (isExplorer && isMomentumPrimed) {
    abilityBadge = '+2 Primed ⚡';
    abilityStatusText = 'Momentum is primed! Roll the movement die to surge +2 spaces forward.';
  } else if (hasUsedAbilityThisTurn) {
    abilityBadge = 'Used this turn';
    abilityStatusText = isExplorer ? 'Momentum was already activated this turn.' : 'Ability already activated this turn.';
  } else if (isAbilityOnCooldown) {
    abilityBadge = `CD: ${currentPlayer.activeCooldown}T`;
    abilityStatusText = `On cooldown for ${currentPlayer.activeCooldown} more turn(s).`;
  } else if (!hasEnoughEnergy) {
    abilityBadge = `Need ${activeCost} En`;
    abilityStatusText = `Requires ${activeCost} Chrono Energy (You have ${currentPlayer.energy || 0}).`;
  } else if (isExplorer && state.phase !== 'rolling') {
    abilityBadge = 'Rolling Phase Only';
    abilityStatusText = 'Momentum must be activated before rolling the movement die!';
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
          border: "2px solid #C2974D",
          borderLeft: "4px solid #F5C442",
          background: "linear-gradient(135deg, #2D2016 0%, #1A120B 100%)",
          boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 4px 12px rgba(0,0,0,0.6)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "1px",
              color: "#FFD700",
              fontFamily: "var(--font-display)",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#EF4444", display: "inline-block", boxShadow: "0 0 6px #EF4444" }} />
              CHRONO OBSERVATORY
            </span>
            <span style={{
              fontSize: "0.60rem",
              padding: "2px 6px",
              borderRadius: "4px",
              background: "#140E0A",
              border: "1px solid #C2974D",
              color: "#FDE047",
              fontFamily: "var(--font-display)",
              fontWeight: 700
            }}>
              SPECTATOR
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.64rem", color: "#C8B293", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Operative:
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, color: currentPlayer.color, marginTop: "2px" }}>
                {currentPlayer.name} {isAiCurrent ? "🤖" : "👤"}
              </div>
            </div>
            <img
              src={currentPlayer.role.avatar}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "4px",
                border: "1.5px solid #5A422D",
                background: "#140E0A",
                objectFit: "contain"
              }}
              alt="role"
            />
          </div>

          <div style={{ fontSize: "0.72rem", color: "#C8B293", marginTop: "6px" }}>
            Location: <strong style={{ color: "#FFD700" }}>{ERA_NAMES[currentPlayer.currentEra]}</strong> (Tile #{currentPlayer.tileIndex})
          </div>

          <div style={{
            marginTop: "8px",
            padding: "6px 10px",
            background: "#140E0A",
            border: "1px solid #4A3423",
            borderRadius: "4px",
            fontSize: "0.72rem",
            color: "#C8B293",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>Phase: <strong style={{ textTransform: "uppercase", color: "#F5C442" }}>{state.phase}</strong></span>
            {state.phase === "moving" && (
              <span>Moves: <strong style={{ color: "#F5C442" }}>{state.movesRemaining}</strong> / {state.diceResult || 1}</span>
            )}
            {state.phase === "rolling" && (
              <span style={{ color: "#94806A" }}>Awaiting roll...</span>
            )}
            {(state.phase === "action" || (state.movesRemaining <= 0 && state.phase !== "rolling" && !state.pendingModal && !state.pendingChoice)) && (
              <span style={{ color: "#4ADE80" }}>Resolving action...</span>
            )}
          </div>
        </div>

        {/* OPERATIVE PERSPECTIVE SWITCHER */}
        <div className="panel-section">
          <div style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "1px",
                color: "#FFD700",
                textTransform: "uppercase"
              }}>
                OPERATIVE FOCUS
              </span>
              <span style={{
                fontSize: "0.58rem",
                color: "#C8B293",
                background: "#19110B",
                border: "1px solid #5A422D",
                padding: "2px 6px",
                borderRadius: "3px",
                fontWeight: 700,
                letterSpacing: "0.5px"
              }}>
                INSPECT
              </span>
            </div>
            <div style={{ fontSize: "0.62rem", color: "#94806A", marginTop: "3px", lineHeight: 1.2 }}>
              Click operative to view hand & clues
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {players.map((p, idx) => {
              const isTurn = idx === state.currentPlayerIndex;
              const isViewed = (viewedPlayerId === p.id) || (viewedPlayerId === null && isTurn);
              return (
                <button
                  key={p.id ?? idx}
                  onClick={() => onSelectPlayer?.(p.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 10px",
                    borderRadius: "4px",
                    background: isViewed
                      ? "linear-gradient(90deg, #38271A 0%, #281D14 100%)"
                      : "#19110B",
                    border: isViewed
                      ? "2px solid #F5C442"
                      : "1.5px solid #5A422D",
                    boxShadow: isViewed
                      ? "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 0 10px rgba(245, 196, 66, 0.25)"
                      : "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#FFF",
                    width: "100%",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease"
                  }}
                  title={`Inspect ${p.name}'s hand`}
                >
                  <img
                    src={p.role.avatar}
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "4px",
                      border: `1.5px solid ${p.color || "#C2974D"}`,
                      background: "#120C08",
                      flexShrink: 0
                    }}
                    alt=""
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: p.color || "#FFD700",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      <span>{p.name}</span>
                      <span style={{ fontSize: "0.62rem", color: "#94806A" }}>
                        ({p.roleKey?.toLowerCase() || "agent"})
                      </span>
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#C8B293", marginTop: "1px" }}>
                      <strong style={{ color: "#FFD700" }}>{p.points}</strong> pts &bull; {p.clueCards?.length || 0}/5 clues
                    </div>
                  </div>
                  {isTurn && (
                    <span style={{
                      fontSize: "0.58rem",
                      background: "#38271A",
                      border: "1px solid #F5C442",
                      color: "#FFD700",
                      padding: "2px 5px",
                      borderRadius: "3px",
                      fontWeight: 800,
                      letterSpacing: "0.5px",
                      flexShrink: 0
                    }}>
                      TURN
                    </span>
                  )}
                  {isViewed && !isTurn && (
                    <span style={{
                      fontSize: "0.58rem",
                      background: "#2D2016",
                      border: "1px solid #C2974D",
                      color: "#F5C442",
                      padding: "2px 5px",
                      borderRadius: "3px",
                      fontWeight: 800,
                      letterSpacing: "0.5px",
                      flexShrink: 0
                    }}>
                      VIEW
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* OBSERVATORY CONTROLS */}
        <div className="panel-section">
          <div className="panel-section-title" style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.68rem",
            color: "#FFD700",
            letterSpacing: "1px",
            marginBottom: "8px"
          }}>
            SPECTATOR CONTROLS
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.74rem",
              color: "#C8B293",
              cursor: "pointer",
              background: "#140E0A",
              border: "1px solid #4A3423",
              padding: "7px 10px",
              borderRadius: "4px"
            }}>
              <span>🎥 Auto-Follow Active Turn</span>
              <input
                type="checkbox"
                checked={Boolean(autoFollow)}
                onChange={(e) => onToggleAutoFollow?.(e.target.checked)}
                style={{ cursor: "pointer", accentColor: "#F5C442" }}
              />
            </label>

            <label style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.74rem",
              color: "#C8B293",
              cursor: "pointer",
              background: "#140E0A",
              border: "1px solid #4A3423",
              padding: "7px 10px",
              borderRadius: "4px"
            }}>
              <span>👁️ Omniscient Intel (Reveal All)</span>
              <input
                type="checkbox"
                checked={Boolean(omniscientIntel)}
                onChange={(e) => onToggleOmniscientIntel?.(e.target.checked)}
                style={{ cursor: "pointer", accentColor: "#F5C442" }}
              />
            </label>

            {/* Simulation Speed Buttons */}
            {onChangeSimulationSpeed && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#140E0A",
                border: "1px solid #4A3423",
                padding: "7px 10px",
                borderRadius: "4px"
              }}>
                <span style={{ fontSize: "0.72rem", color: "#C8B293" }}>⚡ Pacing Speed:</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[1, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => onChangeSimulationSpeed(spd)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        borderRadius: "3px",
                        background: simulationSpeed === spd ? "#38271A" : "#19110B",
                        color: simulationSpeed === spd ? "#FFD700" : "#8C7764",
                        border: simulationSpeed === spd ? "1.5px solid #F5C442" : "1px solid #4A3423",
                        boxShadow: simulationSpeed === spd ? "inset 0 1px 0 #EBD07D" : "none",
                        cursor: "pointer"
                      }}
                    >
                      {spd === 2 ? "Turbo" : `${spd}x`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE CHRONICLE */}
        <div className="panel-section timeline-chronicle-section" style={{
          flex: 1,
          minHeight: "160px",
          display: "flex",
          flexDirection: "column",
          marginBottom: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontSize: "0.68rem",
              color: "#FFD700",
              letterSpacing: "1px"
            }}>
              LIVE CHRONICLE
            </span>
            <span style={{
              fontSize: "0.62rem",
              color: "#C8B293",
              background: "#140E0A",
              border: "1px solid #4A3423",
              padding: "2px 6px",
              borderRadius: "3px",
              fontWeight: 500
            }}>
              {logEntries.length} entries
            </span>
          </div>
          <div
            id="game-log-feed"
            className="game-log"
            style={{
              flex: 1,
              maxHeight: "none",
              minHeight: 0,
              background: "#140E0A",
              border: "1px solid #4A3423",
              borderRadius: "4px",
              padding: "6px 8px"
            }}
          >
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
      <div className="panel-section" style={{
        border: "2px solid #5A422D",
        borderLeft: `4px solid ${currentPlayer.color || "#C2974D"}`,
        background: "linear-gradient(135deg, #2D2016 0%, #1A120B 100%)",
        boxShadow: "inset 1px 1px 0 rgba(235, 198, 105, 0.15), 0 3px 8px rgba(0,0,0,0.5)",
        borderRadius: "4px"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.64rem", color: "#C8B293", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>Current Turn</span>
              {isAiCurrent ? <span className="bot-badge">🤖 BOT</span> : <span className="human-badge">👤 HUMAN</span>}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 700, color: currentPlayer.color, marginTop: "2px" }}>
              {currentPlayer.name}
            </div>
          </div>
          <img
            src={currentPlayer.role.avatar}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "4px",
              border: `1.5px solid ${currentPlayer.color || "#5A422D"}`,
              background: "#140E0A",
              objectFit: "contain"
            }}
            alt="role"
          />
        </div>
        <div style={{ fontSize: "0.72rem", color: "#C8B293", marginTop: "5px" }}>
          Location: <strong style={{ color: "#FFD700" }}>{ERA_NAMES[currentPlayer.currentEra]}</strong> (Tile #{currentPlayer.tileIndex})
        </div>
        {isAiCurrent && (
          <div className="ai-turn-banner" style={{ marginTop: "8px", background: "#140E0A", border: "1px solid #4A3423", borderRadius: "4px", color: "#F5C442" }}>
            <span className="ai-pulse-dot" style={{ background: "#F5C442" }}></span>
            <span><strong>{currentPlayer.name}</strong> is calculating trajectory...</span>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* PHASE 1: ROLL PHASE                                            */}
      {/* ============================================================== */}
      {state.phase === "rolling" && (
        <div className="panel-section phase-card phase-roll-card" style={{
          border: "2px solid #5A422D",
          borderLeft: "4px solid #C2974D",
          background: "linear-gradient(180deg, #2D2016 0%, #1A120B 100%)",
          borderRadius: "4px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.9rem" }}>🎲</span>
              <span style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "1px",
                color: "#FFD700",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase"
              }}>
                Phase 1: Roll Phase
              </span>
            </div>
            <span style={{
              fontSize: "0.58rem",
              padding: "2px 6px",
              borderRadius: "3px",
              background: isSkipped ? "#4C0519" : (isExhausted ? "#4A1818" : "#140E0A"),
              border: isSkipped ? "1px solid #F43F5E" : (isExhausted ? "1px solid #E74C3C" : "1px solid #C2974D"),
              color: isSkipped ? "#FDA4AF" : (isExhausted ? "#FF7675" : "#FDE047"),
              fontFamily: "var(--font-display)",
              fontWeight: 700
            }}>
              {isSkipped ? "TURN SKIPPED (HAZARD)" : (isExhausted ? "EXHAUSTED (0 ENERGY)" : "AWAITING ROLL")}
            </span>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#C8B293", marginBottom: "10px", lineHeight: 1.35 }}>
            {isSkipped
              ? "Operative is recovering from a previous hazard and must skip this turn."
              : "Roll the movement die to navigate along the timeline, or rest to recover Chrono Energy."}
          </div>

          {/* STATUS NOTICE: SKIPPED, EXHAUSTED, OR STANDARD */}
          {isSkipped ? (
            <div className="skip-turn-alert-box animate-pulse" style={{
              background: "linear-gradient(90deg, #3D1220 0%, #240A14 100%)",
              border: "1.5px solid #F43F5E",
              borderRadius: "4px",
              padding: "10px 12px",
              marginBottom: "10px",
              boxShadow: "0 0 14px rgba(244, 63, 94, 0.3)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "1rem" }}>⛔</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "0.68rem", color: "#FDA4AF", fontWeight: 700 }}>
                  HAZARD PENALTY — TURN SKIPPED
                </span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#FECDD3", lineHeight: 1.35 }}>
                You were detained or cursed by a Hazard Anomaly and must skip this turn. You cannot roll the movement die or move this round.
              </div>
            </div>
          ) : isExhausted ? (
            <div className="exhaustion-alert-box animate-pulse" style={{
              background: "linear-gradient(90deg, #421614 0%, #2A100E 100%)",
              border: "1.5px solid #E74C3C",
              borderRadius: "4px",
              padding: "10px 12px",
              marginBottom: "10px",
              boxShadow: "0 0 14px rgba(231, 76, 60, 0.3)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "1rem" }}>⚠️</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "0.68rem", color: "#FF7675", fontWeight: 700 }}>
                  0 ENERGY — EXHAUSTED (+1 PARADOX)
                </span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#E0B4B4", lineHeight: 1.35 }}>
                You have reached 0 Energy and suffered +1 Paradox. You cannot roll the die or move. The only action you can take is to <strong>Rest</strong> to recover +3 Energy and skip your turn.
              </div>
            </div>
          ) : null}

          {/* DICE ROLLING SECTION */}
          <div className="roll-phase-dice-card" style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 12px",
            background: (isSkipped || isExhausted) ? "#1F1212" : "#140E0A",
            borderRadius: "4px",
            border: isSkipped ? "1.5px solid #BE123C" : (isExhausted ? "1.5px solid #8C2A2A" : "1.5px solid #4A3423"),
            marginBottom: "10px",
            opacity: (isSkipped || isExhausted) ? 0.75 : 1
          }}>
            <Dice
              value={state.diceResult}
              isRolling={isRolling}
              size="md"
              theme={(isSkipped || isExhausted) ? "hazard" : "chrono"}
              onClick={(!isExhausted && !isSkipped) ? () => { sounds.diceRoll?.(); onRollDice(); } : undefined}
              disabled={!isMyTurn || isRolling || isExhausted || isSkipped}
              isInteractive={isMyTurn && !isRolling && !isExhausted && !isSkipped}
              showLabel={false}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: isTimeStopped ? "#67E8F9" : (isSkipped ? "#FDA4AF" : (isExhausted ? "#FF7675" : "#FFD700")), letterSpacing: "0.3px" }}>
                {isTimeStopped ? "⌛ Temporal Stasis (Turn Frozen)" : (isSkipped ? "Die Locked (Turn Skipped)" : (isExhausted ? "Die Locked (0 Energy)" : (isRolling ? "Tumbling Die..." : (state.diceResult ? `Rolled: ${state.diceResult}` : "Chrono Movement Die"))))}
              </div>
              <div style={{ fontSize: "0.68rem", color: isTimeStopped ? "#A5F3FC" : (isSkipped ? "#FECDD3" : (isExhausted ? "#FFAAAA" : "#C8B293")), marginTop: "3px", lineHeight: 1.3 }}>
                {isTimeStopped ? `Trapped in a stasis field by Chronomancer ${currentPlayer.timeStoppedBy.name}. Break stasis to thaw.` : (isSkipped ? "Detained/cursed by hazard penalty. Cannot roll the die this turn." : (isExhausted ? "Cannot roll while exhausted. You must rest to recover energy." : (isRolling ? "Determining your timeline trajectory..." : "Roll 1–6 movement spaces along the path.")))}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS: ACKNOWLEDGE SKIP IF SKIPPED, REST IF EXHAUSTED, ROLL/REST OTHERWISE */}
          {isSkipped ? (
            isTimeStopped ? (
              <button
                className="btn btn-primary animate-glow"
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "12px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  borderRadius: "4px",
                  border: "2px solid #22D3EE",
                  background: "linear-gradient(180deg, #0891B2 0%, #0E7490 100%)",
                  color: "#FFF",
                  boxShadow: "0 0 20px rgba(34, 211, 238, 0.55), inset 0 0 10px rgba(6, 182, 212, 0.4)",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: isMyTurn ? "pointer" : "not-allowed"
                }}
                disabled={!isMyTurn || isRolling}
                onClick={() => { sounds.timeFreeze?.() || sounds.btnClick?.(); onAcknowledgeSkip?.(); }}
                title={`Break out of Temporal Stasis cast by ${currentPlayer.timeStoppedBy.name} and pass turn`}
              >
                <span>❄️</span>
                <span>BREAK TEMPORAL STASIS & THAW</span>
                <kbd style={{ background: "#164E63", border: "1px solid #22D3EE", padding: "1px 5px", borderRadius: "3px", fontSize: "0.62rem" }}>SPACE</kbd>
              </button>
            ) : (
              <button
                className="btn btn-primary animate-glow"
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "12px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  borderRadius: "4px",
                  border: "2px solid #F43F5E",
                  background: "linear-gradient(180deg, #BE123C 0%, #881337 100%)",
                  color: "#FFF",
                  boxShadow: "0 0 16px rgba(244, 63, 94, 0.4)",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: isMyTurn ? "pointer" : "not-allowed"
                }}
                disabled={!isMyTurn || isRolling}
                onClick={() => { sounds.btnClick?.(); onAcknowledgeSkip?.(); }}
                title="Acknowledge skipped turn and pass to next player"
              >
                <span>⏭️ ACKNOWLEDGE SKIPPED TURN</span>
                <kbd style={{ background: "#4C0519", border: "1px solid #F43F5E", padding: "1px 5px", borderRadius: "3px", fontSize: "0.62rem" }}>SPACE</kbd>
              </button>
            )
          ) : isExhausted ? (
            <button
              className="btn btn-primary animate-glow"
              style={{
                width: "100%",
                minWidth: 0,
                padding: "12px 14px",
                fontSize: "0.82rem",
                fontWeight: 800,
                letterSpacing: "1px",
                borderRadius: "4px",
                border: "2px solid #2ECC71",
                background: "linear-gradient(180deg, #27AE60 0%, #196F3D 100%)",
                color: "#FFF",
                boxShadow: "0 0 16px rgba(46, 204, 113, 0.4)",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer"
              }}
              disabled={!isMyTurn || isRolling}
              onClick={() => { sounds.btnClick?.(); onRest(); }}
              title="Rest to recover +3 Chrono Energy and skip your turn"
            >
              <span>💤 REST TO RECOVER (+3 ENERGY)</span>
              <kbd style={{ background: "#0D3D22", border: "1px solid #2ECC71", padding: "1px 5px", borderRadius: "3px", fontSize: "0.62rem" }}>SPACE</kbd>
            </button>
          ) : (
            <>
              {isExplorer && (
                <div style={{
                  marginBottom: "10px",
                  padding: "9px 10px",
                  borderRadius: "4px",
                  background: "#140E0A",
                  border: isMomentumPrimed ? "1.5px solid #38BDF8" : (canUseAbilityNow ? "1.5px solid #F5C442" : "1px solid #4A3423"),
                  boxShadow: isMomentumPrimed ? "0 0 10px rgba(56, 189, 248, 0.3)" : (canUseAbilityNow ? "0 0 8px rgba(245, 196, 66, 0.15)" : "inset 0 1px 3px rgba(0,0,0,0.6)")
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#E2E8F0", display: "flex", alignItems: "center", gap: "5px" }}>
                      <span>⚡</span>
                      <span>Explorer Ability:</span>
                      <strong style={{ color: "#38BDF8" }}>MOMENTUM</strong>
                    </span>
                    <span style={{
                      fontSize: "0.60rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      background: isMomentumPrimed ? "#0C2E24" : "#251B12",
                      border: isMomentumPrimed ? "1px solid #2ECC71" : "1px solid #8C6239",
                      color: isMomentumPrimed ? "#4ADE80" : (canUseAbilityNow ? "#FFD700" : "#FCA5A5")
                    }}>
                      {isMomentumPrimed ? "✓ PRIMED (+2 MOVES)" : abilityBadge}
                    </span>
                  </div>

                  {isMomentumPrimed ? (
                    <div style={{ fontSize: "0.68rem", color: "#4ADE80", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>✨</span>
                      <span>Kinetic Chronal Thrusters Primed! Roll the die to surge forward with +2 spaces!</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: "0.68rem", color: "#C8B293", marginBottom: "8px", lineHeight: 1.3 }}>
                        Surge forward with +2 Bonus Movement steps along the timeline on this turn's roll!
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{
                          width: "100%",
                          padding: "7px 10px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          borderRadius: "4px",
                          background: canUseAbilityNow ? "linear-gradient(180deg, #1E3A5F 0%, #0F2038 100%)" : "#221913",
                          border: canUseAbilityNow ? "1.5px solid #38BDF8" : "1.5px solid #4A3423",
                          color: canUseAbilityNow ? "#38BDF8" : "#735E4E",
                          boxShadow: canUseAbilityNow ? "inset 1px 1px 0 #7DD3FC, inset -1px -1px 0 #075985, 0 3px 0 #081628" : "none",
                          opacity: canUseAbilityNow ? 1 : 0.6,
                          cursor: canUseAbilityNow ? "pointer" : "not-allowed"
                        }}
                        disabled={!canUseAbilityNow}
                        title={abilityStatusText}
                        onClick={() => { sounds.abilityActivate?.(); onUseSkill(); }}
                      >
                        <span>⚡ ACTIVATE MOMENTUM (+2 MOVES) • -2 EN</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{
                  width: "100%",
                  minWidth: 0,
                  padding: "10px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  letterSpacing: "1px",
                  borderRadius: "4px",
                  border: isMomentumPrimed ? "2px solid #38BDF8" : "2px solid #F5C442",
                  background: isMomentumPrimed
                    ? "linear-gradient(180deg, #1E3A5F 0%, #0F2038 100%)"
                    : "linear-gradient(180deg, #4D3826 0%, #352518 100%)",
                  color: isMomentumPrimed ? "#E0F2FE" : "#FFD700",
                  boxShadow: isMomentumPrimed
                    ? "inset 1px 1px 0 #7DD3FC, inset -1px -1px 0 #075985, 0 0 14px rgba(56, 189, 248, 0.4)"
                    : "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 3px 0 #120E0A",
                  marginBottom: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
                disabled={!isMyTurn || isRolling}
                onClick={() => { sounds.diceRoll?.(); onRollDice(); }}
              >
                <span>🎲 {isMomentumPrimed ? "ROLL MOVEMENT DIE (+2 MOMENTUM PRIMED)" : "ROLL MOVEMENT DIE"}</span>
                <kbd style={{ background: isMomentumPrimed ? "#0A192F" : "#140E0A", border: isMomentumPrimed ? "1px solid #38BDF8" : "1px solid #5A422D", padding: "1px 5px", borderRadius: "3px", fontSize: "0.62rem" }}>SPACE</kbd>
              </button>

              {/* REST (SKIP TURN) ALTERNATIVE */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="action-btn"
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    fontSize: "0.72rem",
                    background: "#140E0A",
                    border: "1.5px solid #4A3423",
                    borderRadius: "4px",
                    color: "#C8B293",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                  disabled={!isMyTurn || isRolling}
                  title="Skip your turn to recover +3 Chrono Energy"
                  onClick={() => { sounds.btnClick?.(); onRest(); }}
                >
                  <span>💤</span>
                  <span>Rest (Skip Turn)</span>
                  <span style={{ fontSize: "0.64rem", color: "#F5C442", fontWeight: "bold" }}>+3 Energy</span>
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: "8px", fontSize: "0.64rem", color: "#8C7764", textAlign: "center", fontStyle: "italic" }}>
            Turn completion will be available in Phase 2 after moving.
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MOVEMENT IN PROGRESS                                           */}
      {/* ============================================================== */}
      {state.phase === "moving" && (
        <div className="panel-section phase-card phase-moving-card" style={{
          border: "2px solid #5A422D",
          borderLeft: "4px solid #F5C442",
          background: "linear-gradient(180deg, #2D2016 0%, #1A120B 100%)",
          borderRadius: "4px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.9rem" }}>🚶</span>
              <span style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "1px",
                color: "#FFD700",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase"
              }}>
                Moving Along Timeline
              </span>
            </div>
            <span style={{
              fontSize: "0.58rem",
              padding: "2px 6px",
              borderRadius: "3px",
              background: "#140E0A",
              border: "1px solid #C2974D",
              color: "#FDE047",
              fontFamily: "var(--font-display)",
              fontWeight: 700
            }}>
              {state.movesRemaining} / {state.totalMoves || state.diceResult || 1} MOVES LEFT
            </span>
          </div>

          {canReverseTime && (
            <div style={{ marginBottom: "8px", padding: "8px 10px", background: "#140E0A", border: "1.5px solid #8C6239", borderRadius: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", color: "#F5C442", fontWeight: 600, marginBottom: "6px" }}>
                <span>⏪ Reverse Time</span>
                <span style={{ fontSize: "0.64rem", color: "#C8B293" }}>Start of turn</span>
              </div>
              <button
                className="btn"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  letterSpacing: "0.4px",
                  background: "linear-gradient(180deg, #4D3826 0%, #352518 100%)",
                  border: "1.5px solid #F5C442",
                  color: "#FFD700",
                  borderRadius: "4px",
                  boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer"
                }}
                onClick={onReverseTime}
                title={`Spend 3 Chrono Energy to reverse movement direction and walk ${state.movesRemaining} spaces backward`}
              >
                <span>⏪ Reverse Time</span>
                <span style={{
                  fontSize: "0.68rem",
                  background: "#251B12",
                  border: "1px solid #8C6239",
                  color: "#F5C442",
                  padding: "2px 6px",
                  borderRadius: "3px",
                  fontWeight: 700,
                  whiteSpace: "nowrap"
                }}>
                  -3 EN
                </span>
              </button>
              <div style={{ fontSize: "0.65rem", color: "#C8B293", textAlign: "center", marginTop: "5px" }}>
                Walk {state.movesRemaining} {state.movesRemaining === 1 ? "space" : "spaces"} backward instead
              </div>
            </div>
          )}

          {canUseForesight && (
            <div style={{ marginBottom: "8px", padding: "8px 10px", background: "#140E0A", border: "1.5px solid #1ABC9C", borderRadius: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", color: "#1ABC9C", fontWeight: 700, marginBottom: "6px" }}>
                <span>⏳ Temporal Foresight</span>
                <span style={{ fontSize: "0.64rem", color: "#C8B293" }}>Passive &bull; 1 / 3 Turns</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn"
                  disabled={state.movesRemaining <= 1}
                  onClick={() => onAdjustForesight?.(-1)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "7px 6px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    background: state.movesRemaining > 1 ? "linear-gradient(180deg, #1C3833 0%, #102622 100%)" : "#1A1512",
                    border: state.movesRemaining > 1 ? "1.5px solid #1ABC9C" : "1px solid #4A3423",
                    color: state.movesRemaining > 1 ? "#5EEAD4" : "#6B7280",
                    borderRadius: "4px",
                    cursor: state.movesRemaining > 1 ? "pointer" : "not-allowed"
                  }}
                  title="Adjust movement die by -1 (Min: 1 space)"
                >
                  ➖ -1 Space ({state.movesRemaining - 1})
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={state.movesRemaining >= 6}
                  onClick={() => onAdjustForesight?.(1)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "7px 6px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    background: state.movesRemaining < 6 ? "linear-gradient(180deg, #1C3833 0%, #102622 100%)" : "#1A1512",
                    border: state.movesRemaining < 6 ? "1.5px solid #1ABC9C" : "1px solid #4A3423",
                    color: state.movesRemaining < 6 ? "#5EEAD4" : "#6B7280",
                    borderRadius: "4px",
                    cursor: state.movesRemaining < 6 ? "pointer" : "not-allowed"
                  }}
                  title="Adjust movement die by +1 (Max: 6 spaces)"
                >
                  ➕ +1 Space ({state.movesRemaining + 1})
                </button>
              </div>
            </div>
          )}

          {isMovingBackward && (
            <div style={{ marginBottom: "8px", padding: "6px 8px", background: "#251B12", border: "1px solid #8C6239", borderRadius: "4px", fontSize: "0.72rem", color: "#F5C442", textAlign: "center", fontWeight: 700 }}>
              ⏪ Reverse Time Active: Moving backwards along path
            </div>
          )}

          {state.momentumActive ? (
            <div className="momentum-panel" style={{ marginTop: "8px", padding: "10px", background: "#140E0A", border: "1.5px solid #8C6239", borderRadius: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700, color: "#FFD700", fontSize: "0.80rem" }}>
                <span>🏃 Momentum Active!</span>
                <span className="badge" style={{ background: "#38271A", border: "1px solid #F5C442", color: "#FFD700", fontSize: "0.62rem", padding: "2px 6px", borderRadius: "3px", fontWeight: "bold" }}>Manual Move</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: "#C8B293", margin: "6px 0" }}>
                Moves left: <strong style={{ color: "#FFD700" }}>{state.movesRemaining}</strong> spaces. Pause & interact with any tile!
              </div>

              {!state.momentumUsedMidTile && state.board[currentPlayer.currentEra][currentPlayer.tileIndex].type !== "start" ? (
                <button
                  className="btn btn-accent"
                  style={{
                    width: "100%",
                    marginBottom: "6px",
                    padding: "8px",
                    fontSize: "0.76rem",
                    background: "linear-gradient(180deg, #4D3826 0%, #352518 100%)",
                    border: "1.5px solid #F5C442",
                    color: "#FFD700",
                    borderRadius: "4px"
                  }}
                  disabled={!isMyTurn}
                  onClick={onInteractMomentum}
                >
                  ✨ Interact with Current Space ({state.board[currentPlayer.currentEra][currentPlayer.tileIndex].type.toUpperCase()})
                </button>
              ) : (state.momentumUsedMidTile && (
                <div style={{ fontSize: "0.68rem", color: "#4ADE80", marginBottom: "6px" }}>
                  ✓ Tile interaction used! Continue moving to finish.
                </div>
              ))}

              <button
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  fontSize: "0.82rem",
                  background: "linear-gradient(180deg, #4D3826 0%, #352518 100%)",
                  border: "2px solid #F5C442",
                  color: "#FFD700",
                  borderRadius: "4px"
                }}
                disabled={!isMyTurn}
                onClick={() => { sounds.stepHop?.(); onStepMove(); }}
              >
                {isMovingBackward ? "Step Backward ⬅️" : "Step Forward ➡️"} ({state.movesRemaining} left)
              </button>
            </div>
          ) : (
            <div style={{ marginTop: "8px", padding: "10px", background: "#140E0A", border: "1.5px solid #4A3423", borderRadius: "4px" }}>
              <button
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "0.88rem",
                  fontWeight: 800,
                  letterSpacing: "0.4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "linear-gradient(180deg, #4D3826 0%, #352518 100%)",
                  border: "2px solid #F5C442",
                  color: "#FFD700",
                  borderRadius: "4px",
                  boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 3px 0 #120E0A"
                }}
                disabled={!isMyTurn}
                onClick={onStepMove}
              >
                <span>{isMovingBackward ? "⬅️ Step Backward" : "➡️ Move Forward"}</span>
                <span style={{ fontSize: "0.68rem", background: "#251B12", border: "1px solid #8C6239", color: "#F5C442", padding: "2px 6px", borderRadius: "3px", fontWeight: 700 }}>
                  {state.movesRemaining} {state.movesRemaining === 1 ? "step left" : "steps left"}
                </span>
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.70rem", color: "#C8B293", marginTop: "8px", textAlign: "center" }}>
                <span>{isMovingBackward ? "⏪ Moving in Reverse" : "🚶 Stepping along timeline"} &bull; Click tile or press <strong>Space</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* PHASE 2: ACTION PHASE                                          */}
      {/* ============================================================== */}
      {state.phase === "action" && (
        <div className="panel-section phase-card phase-action-card" style={{
          border: "2px solid #5A422D",
          borderLeft: "4px solid #C2974D",
          background: "linear-gradient(180deg, #2D2016 0%, #1A120B 100%)",
          borderRadius: "4px"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.9rem" }}>⚡</span>
              <span style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "1px",
                color: "#FFD700",
                fontFamily: "var(--font-display)",
                textTransform: "uppercase"
              }}>
                Phase 2: Action Phase
              </span>
            </div>
            <span style={{
              fontSize: "0.58rem",
              padding: "2px 6px",
              borderRadius: "3px",
              background: "#140E0A",
              border: "1px solid #C2974D",
              color: "#FDE047",
              fontFamily: "var(--font-display)",
              fontWeight: 700
            }}>
              READY FOR ACTION
            </span>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#C8B293", marginBottom: "10px", lineHeight: 1.35 }}>
            Movement complete. Activate your ability (if not yet used), resolve tile actions, or end your turn.
          </div>

          {/* POST-MOVE ABILITY ACTIVATION */}
          {isExplorer ? (
            <div style={{
              marginBottom: "10px",
              padding: "8px 10px",
              borderRadius: "4px",
              background: "#140E0A",
              border: "1px solid #4A3423",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span style={{ fontSize: "0.68rem", color: "#C8B293", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⚡</span>
                <strong style={{ color: "#38BDF8" }}>Explorer Momentum:</strong>
                <span style={{ color: hasUsedAbilityThisTurn ? "#4ADE80" : "#8C7764", fontStyle: "italic" }}>
                  {hasUsedAbilityThisTurn ? "✓ Added +2 Bonus Spaces on your roll this turn" : "Activated before rolling movement die"}
                </span>
              </span>
              <span style={{
                fontSize: "0.60rem",
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: "3px",
                background: "#251B12",
                border: "1px solid #8C6239",
                color: hasUsedAbilityThisTurn ? "#4ADE80" : "#8C7764"
              }}>
                {hasUsedAbilityThisTurn ? "Used" : "Before Roll"}
              </span>
            </div>
          ) : (
            <div style={{
              marginBottom: "10px",
              padding: "9px 10px",
              borderRadius: "4px",
              background: "#140E0A",
              border: canUseAbilityNow ? "1.5px solid #C2974D" : "1px solid #4A3423",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.6)"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#E2E8F0", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>✨</span>
                  <span>Operative Ability:</span>
                  <strong style={{ color: currentPlayer.color || "#FFD700" }}>{activeSkill.name}</strong>
                </span>
                <span style={{
                  fontSize: "0.60rem",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "3px",
                  background: "#251B12",
                  border: "1px solid #8C6239",
                  color: hasUsedAbilityThisTurn ? "#C8B293" : (canUseAbilityNow ? "#FFD700" : "#FCA5A5")
                }}>
                  {hasUsedAbilityThisTurn ? "✓ Used" : abilityBadge}
                </span>
              </div>

              {hasUsedAbilityThisTurn ? (
                <div style={{ fontSize: "0.68rem", color: "#8C7764", fontStyle: "italic" }}>
                  ✓ {activeSkill.name} was already activated this turn.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "0.68rem", color: "#C8B293", marginBottom: "8px", lineHeight: 1.3 }}>
                    {activeSkill.description}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      borderRadius: "4px",
                      background: canUseAbilityNow ? "linear-gradient(180deg, #4D3826 0%, #352518 100%)" : "#221913",
                      border: canUseAbilityNow ? "2px solid #F5C442" : "1.5px solid #4A3423",
                      color: canUseAbilityNow ? "#FFD700" : "#735E4E",
                      boxShadow: canUseAbilityNow ? "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 3px 0 #120E0A" : "none",
                      opacity: canUseAbilityNow ? 1 : 0.6,
                      cursor: canUseAbilityNow ? "pointer" : "not-allowed"
                    }}
                    disabled={!canUseAbilityNow}
                    title={abilityStatusText}
                    onClick={() => { sounds.abilityActivate?.(); onUseSkill(); }}
                  >
                    <span>✨ ACTIVATE {activeSkill.name.toUpperCase()} ({abilityBadge})</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* CONTEXTUAL ACTIONS: RELIC RETURN & TIME WARP */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
            {matchingArtifact && (
              <button
                className="btn"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  background: "linear-gradient(180deg, #3A2E1E 0%, #251B12 100%)",
                  border: "2px solid #C2974D",
                  color: "#FFD700",
                  borderRadius: "4px",
                  boxShadow: "inset 1px 1px 0 #EBD07D, 0 3px 0 #120E0A",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
                disabled={!isMyTurn}
                onClick={onReturnArtifact}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📦</span>
                  <span>Return Matching Relic: <strong>{matchingArtifact.name}</strong></span>
                </span>
                <span style={{ fontSize: "0.68rem", background: "#140E0A", border: "1px solid #8C6239", color: "#F5C442", padding: "2px 6px", borderRadius: "3px" }}>
                  +5 Points
                </span>
              </button>
            )}

            {isOnTimeGate && (
              <button
                className="btn"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  fontSize: "0.76rem",
                  fontWeight: 800,
                  background: canTimeWarp ? "linear-gradient(180deg, #4D3826 0%, #352518 100%)" : "#241D17",
                  border: canTimeWarp ? "2px solid #C2974D" : "1.5px solid #4A382A",
                  color: canTimeWarp ? "#FFD700" : "#8C7764",
                  borderRadius: "4px",
                  cursor: canTimeWarp ? "pointer" : "not-allowed",
                  opacity: canTimeWarp ? 1 : 0.6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
                disabled={!canTimeWarp}
                title={canTimeWarp ? `Warp through the Time Gate to another era (-${timeGateCost} En)` : `Requires ${timeGateCost} Energy to warp`}
                onClick={onTimeWarp}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>🌀</span>
                  <span>Time Warp (Time Gate)</span>
                </span>
                <span style={{ fontSize: "0.68rem", background: "#140E0A", border: "1px solid #8C6239", color: "#F5C442", padding: "2px 6px", borderRadius: "3px" }}>
                  -{timeGateCost} Energy
                </span>
              </button>
            )}
          </div>

          {/* PRIMARY FINISH TURN BUTTON */}
          <button
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: "0.85rem",
              fontWeight: 800,
              letterSpacing: "1px",
              borderRadius: "4px",
              border: "2px solid #C2974D",
              background: "linear-gradient(180deg, #3D2D1E 0%, #291D12 100%)",
              color: "#FFD700",
              boxShadow: isMyTurn ? "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 3px 0 #120E0A" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: isMyTurn ? "pointer" : "not-allowed"
            }}
            disabled={!isMyTurn}
            onClick={onEndTurn}
          >
            <span>🏁 END TURN ⏩</span>
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
