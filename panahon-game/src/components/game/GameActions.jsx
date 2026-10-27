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
            {state.phase === "action" && (
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
              background: "#140E0A",
              border: "1px solid #C2974D",
              color: "#FDE047",
              fontFamily: "var(--font-display)",
              fontWeight: 700
            }}>
              AWAITING ROLL
            </span>
          </div>

          <div style={{ fontSize: "0.72rem", color: "#C8B293", marginBottom: "10px", lineHeight: 1.35 }}>
            Roll the movement die to navigate along the timeline, or rest to recover Chrono Energy.
          </div>

          {/* DICE ROLLING SECTION */}
          <div className="roll-phase-dice-card" style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 12px",
            background: "#140E0A",
            borderRadius: "4px",
            border: "1.5px solid #4A3423",
            marginBottom: "10px"
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
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#FFD700", letterSpacing: "0.3px" }}>
                {isRolling ? "Tumbling Die..." : (state.diceResult ? `Rolled: ${state.diceResult}` : "Chrono Movement Die")}
              </div>
              <div style={{ fontSize: "0.68rem", color: "#C8B293", marginTop: "3px", lineHeight: 1.3 }}>
                {isRolling ? "Determining your timeline trajectory..." : "Roll 1–6 movement spaces along the path."}
              </div>
            </div>
          </div>

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
              border: "2px solid #F5C442",
              background: "linear-gradient(180deg, #4D3826 0%, #352518 100%)",
              color: "#FFD700",
              boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 3px 0 #120E0A",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
            disabled={!isMyTurn || isRolling}
            onClick={() => { sounds.diceRoll?.(); onRollDice(); }}
          >
            <span>🎲 ROLL MOVEMENT DIE</span>
            <kbd style={{ background: "#140E0A", border: "1px solid #5A422D", padding: "1px 5px", borderRadius: "3px", fontSize: "0.62rem" }}>SPACE</kbd>
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
              {state.movesRemaining} / {state.diceResult || 1} MOVES LEFT
            </span>
          </div>

          {canReverseTime && (
            <div style={{ marginBottom: "8px", padding: "8px 10px", background: "#140E0A", border: "1.5px solid #8C6239", borderRadius: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", color: "#F5C442", fontWeight: 600, marginBottom: "6px" }}>
                <span>⏪ Reverse Time Option</span>
                <span style={{ fontSize: "0.64rem", color: "#C8B293" }}>Start of turn only</span>
              </div>
              <button
                className="btn"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: "0.74rem",
                  fontWeight: "bold",
                  background: "linear-gradient(180deg, #4D3826 0%, #352518 100%)",
                  border: "1.5px solid #F5C442",
                  color: "#FFD700",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer"
                }}
                onClick={onReverseTime}
              >
                <span>⏪ Reverse Direction (-3 En)</span>
                <span style={{ fontSize: "0.68rem", opacity: 0.9 }}>Walk {state.movesRemaining} spaces backward</span>
              </button>
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
