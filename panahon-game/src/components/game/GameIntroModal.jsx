import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import sounds from "../../sound.js";
import Dice from "./Dice.jsx";
import { ROLES, ERA_NAMES, ERAS } from "../../gameData.js";

const STAGE_BRIEFING = "briefing";
const STAGE_INITIATIVE = "initiative";
const STAGE_CEREMONY = "ceremony";

export default function GameIntroModal({
  isOpen,
  players = [],
  engine,
  network,
  isSpectator = false,
  onComplete,
  onSkip
}) {
  const [stage, setStage] = useState(STAGE_BRIEFING);
  const [briefingTab, setBriefingTab] = useState("lore"); // "lore" | "roster"

  // Initiative State
  // groups: Array of player arrays, preserving rank order from 1st place to last.
  // When a group has length > 1, those players are tied and must re-roll within their bracket.
  const [groups, setGroups] = useState(() => (players.length > 0 ? [[...players]] : []));
  const [round, setRound] = useState(1);
  const [currentRolls, setCurrentRolls] = useState({});
  const [rollingPlayerId, setRollingPlayerId] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [tieNotice, setTieNotice] = useState(null);
  const [lockedRanks, setLockedRanks] = useState({}); // { [playerId]: rankNumber }
  const [finalTurnOrder, setFinalTurnOrder] = useState([]);

  // Auto-roll timers ref
  const rollTimeoutsRef = useRef([]);
  const clearAllTimeouts = () => {
    rollTimeoutsRef.current.forEach((t) => clearTimeout(t));
    rollTimeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // Sync initial groups when modal opens or players change
  useEffect(() => {
    if (players && players.length > 0 && groups.length === 0) {
      setGroups([[...players]]);
    }
  }, [players, groups.length]);

  // Which players must roll in the current round?
  // Only players in tied groups (groups with length > 1) need to roll!
  const activeTiedPlayers = useMemo(() => {
    return groups.filter((g) => g.length > 1).flat();
  }, [groups]);

  // Find human player among active rollers
  const humanActiveRoller = useMemo(() => {
    if (isSpectator) return null;
    return activeTiedPlayers.find((p) => !p.isAi) || null;
  }, [activeTiedPlayers, isSpectator]);

  const hasHumanRolledThisRound = Boolean(
    !humanActiveRoller || currentRolls[humanActiveRoller.id] !== undefined
  );

  // Compute locked ranks for display
  useEffect(() => {
    const newLocked = {};
    let currentRank = 1;
    groups.forEach((g) => {
      if (g.length === 1) {
        newLocked[g[0].id] = currentRank;
      }
      currentRank += g.length;
    });
    setLockedRanks(newLocked);
  }, [groups]);

  // Roll a d6 for a given player
  const rollForPlayer = useCallback(
    (player, callback) => {
      setRollingPlayerId(player.id);
      sounds.diceRoll();

      const rollDuration = 550;
      const t = setTimeout(() => {
        const val = Math.floor(Math.random() * 6) + 1;
        setCurrentRolls((prev) => {
          const next = { ...prev, [player.id]: val };
          return next;
        });
        setRollingPlayerId(null);
        if (callback) callback(val);
      }, rollDuration);
      rollTimeoutsRef.current.push(t);
    },
    []
  );

  // Trigger automated rolls for AI bots in active tied groups
  const triggerAiRolls = useCallback(
    (startingRolls) => {
      const botsToRoll = activeTiedPlayers.filter(
        (p) => p.isAi && startingRolls[p.id] === undefined
      );

      if (botsToRoll.length === 0) {
        evaluateRoundResults(startingRolls);
        return;
      }

      let accumulatedRolls = { ...startingRolls };
      botsToRoll.forEach((bot, index) => {
        const delay = 450 * (index + 1);
        const t = setTimeout(() => {
          rollForPlayer(bot, (val) => {
            accumulatedRolls[bot.id] = val;
            if (Object.keys(accumulatedRolls).length >= activeTiedPlayers.length) {
              const evalTimeout = setTimeout(() => {
                evaluateRoundResults(accumulatedRolls);
              }, 400);
              rollTimeoutsRef.current.push(evalTimeout);
            }
          });
        }, delay);
        rollTimeoutsRef.current.push(t);
      });
    },
    [activeTiedPlayers, rollForPlayer]
  );

  // Human player clicks roll button or hits Spacebar
  const handleHumanRoll = useCallback(() => {
    if (!humanActiveRoller || currentRolls[humanActiveRoller.id] !== undefined || rollingPlayerId !== null || isEvaluating) {
      return;
    }
    rollForPlayer(humanActiveRoller, (humanVal) => {
      const updatedRolls = { ...currentRolls, [humanActiveRoller.id]: humanVal };
      triggerAiRolls(updatedRolls);
    });
  }, [humanActiveRoller, currentRolls, rollingPlayerId, isEvaluating, rollForPlayer, triggerAiRolls]);

  // If no human needs to roll (spectator mode or human already locked), auto-trigger AI rolls
  useEffect(() => {
    if (stage !== STAGE_INITIATIVE || isEvaluating || rollingPlayerId !== null) return;
    if (!humanActiveRoller && activeTiedPlayers.length > 0) {
      const activeUnrolled = activeTiedPlayers.filter((p) => currentRolls[p.id] === undefined);
      if (activeUnrolled.length > 0 && rollTimeoutsRef.current.length === 0) {
        const startTimer = setTimeout(() => {
          triggerAiRolls(currentRolls);
        }, 500);
        rollTimeoutsRef.current.push(startTimer);
      }
    }
  }, [stage, isEvaluating, rollingPlayerId, humanActiveRoller, activeTiedPlayers, currentRolls, triggerAiRolls]);

  // Evaluate round results and form new groups
  const evaluateRoundResults = useCallback(
    (rolls) => {
      setIsEvaluating(true);
      const newGroups = [];
      let foundTieInThisRound = false;
      const tiedDetails = [];

      groups.forEach((g) => {
        if (g.length === 1) {
          newGroups.push(g);
        } else {
          // Group by score descending
          const byScore = {};
          g.forEach((p) => {
            const score = rolls[p.id];
            if (!byScore[score]) byScore[score] = [];
            byScore[score].push(p);
          });
          const sortedScores = Object.keys(byScore)
            .map(Number)
            .sort((a, b) => b - a);

          sortedScores.forEach((s) => {
            const subgroup = byScore[s];
            newGroups.push(subgroup);
            if (subgroup.length > 1) {
              foundTieInThisRound = true;
              tiedDetails.push({
                names: subgroup.map((p) => p.name).join(" & "),
                score: s
              });
            }
          });
        }
      });

      if (foundTieInThisRound) {
        // Tie detected! Show notification and prepare re-roll
        sounds.danger();
        const msg = tiedDetails
          .map((t) => `${t.names} tied with roll of ${t.score}`)
          .join(" • ");
        setTieNotice(`⚔️ TIE DETECTED: ${msg}! Re-rolling for position...`);

        const t = setTimeout(() => {
          setGroups(newGroups);
          setRound((r) => r + 1);
          setCurrentRolls({});
          setTieNotice(null);
          setIsEvaluating(false);
          clearAllTimeouts();
        }, 1600);
        rollTimeoutsRef.current.push(t);
      } else {
        // All positions resolved uniquely!
        const resolvedOrder = newGroups.flat();
        setFinalTurnOrder(resolvedOrder);
        setGroups(newGroups);
        sounds.victory();

        const t = setTimeout(() => {
          setIsEvaluating(false);
          setStage(STAGE_CEREMONY);
        }, 900);
        rollTimeoutsRef.current.push(t);
      }
    },
    [groups]
  );

  // Fast-forward / instant resolve
  const handleQuickResolve = useCallback(() => {
    clearAllTimeouts();
    setRollingPlayerId(null);

    let tempGroups = groups.map((g) => [...g]);
    let currentRoundRolls = { ...currentRolls };

    while (tempGroups.some((g) => g.length > 1)) {
      const newGroups = [];
      tempGroups.forEach((g) => {
        if (g.length === 1) {
          newGroups.push(g);
        } else {
          const byScore = {};
          g.forEach((p) => {
            const score = Math.floor(Math.random() * 6) + 1;
            currentRoundRolls[p.id] = score;
            if (!byScore[score]) byScore[score] = [];
            byScore[score].push(p);
          });
          const sortedScores = Object.keys(byScore)
            .map(Number)
            .sort((a, b) => b - a);
          sortedScores.forEach((s) => newGroups.push(byScore[s]));
        }
      });
      tempGroups = newGroups;
    }

    sounds.victory();
    setCurrentRolls(currentRoundRolls);
    setGroups(tempGroups);
    setFinalTurnOrder(tempGroups.flat());
    setIsEvaluating(false);
    setStage(STAGE_CEREMONY);
  }, [groups, currentRolls]);

  // Handle final expedition commencement
  const handleCommence = useCallback(() => {
    sounds.turnStart();
    if (onComplete) {
      onComplete(finalTurnOrder.length > 0 ? finalTurnOrder : players);
    }
  }, [finalTurnOrder, players, onComplete]);

  // Global key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === " " || e.code === "Space") {
        if (stage === STAGE_BRIEFING) {
          e.preventDefault();
          setStage(STAGE_INITIATIVE);
          sounds.btnClick();
        } else if (stage === STAGE_INITIATIVE) {
          if (humanActiveRoller && currentRolls[humanActiveRoller.id] === undefined && !rollingPlayerId && !isEvaluating) {
            e.preventDefault();
            handleHumanRoll();
          }
        } else if (stage === STAGE_CEREMONY) {
          e.preventDefault();
          handleCommence();
        }
      } else if (e.key === "Enter") {
        if (stage === STAGE_BRIEFING) {
          e.preventDefault();
          setStage(STAGE_INITIATIVE);
          sounds.btnClick();
        } else if (stage === STAGE_CEREMONY) {
          e.preventDefault();
          handleCommence();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    stage,
    humanActiveRoller,
    currentRolls,
    rollingPlayerId,
    isEvaluating,
    handleHumanRoll,
    handleCommence
  ]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay game-intro-overlay" style={{ zIndex: 11500 }}>
      <div className="modal game-intro-modal animate-scale-up">
        {/* HEADER */}
        <div className="intro-header">
          <div className="intro-badge">
            <span className="intro-badge-icon">⏳</span>
            MISYON KRONOLOHIKAL • TEMPORAL PROTOCOL
          </div>
          <h2 className="intro-title">
            {stage === STAGE_BRIEFING && "CHRONO-EXPEDITION: MISSION BRIEFING"}
            {stage === STAGE_INITIATIVE && (round === 1 ? "🎲 TABLETOP INITIATIVE: ROLL FOR FIRST TURN" : `⚔️ TIE-BREAKER RE-ROLL (ROUND ${round})`)}
            {stage === STAGE_CEREMONY && "🏆 INITIATIVE DETERMINED • EXPEDITION ORDER"}
          </h2>
          <div className="intro-subtitle">
            {stage === STAGE_BRIEFING && "PHILIPPINE ARCHIPELAGO TIMELINE CONVERGENCE CRISIS"}
            {stage === STAGE_INITIATIVE && "Standard board game rules: The highest roll takes first turn. Tied operatives must roll again until all positions are settled!"}
            {stage === STAGE_CEREMONY && "All positions uniquely settled down to the last place. The expedition begins!"}
          </div>
        </div>

        {/* STAGE 1: BRIEFING */}
        {stage === STAGE_BRIEFING && (
          <div className="intro-stage-content intro-briefing-stage">
            {/* TABS */}
            <div className="intro-tabs">
              <button
                type="button"
                className={`intro-tab-btn ${briefingTab === "lore" ? "active" : ""}`}
                onClick={() => {
                  sounds.btnClick();
                  setBriefingTab("lore");
                }}
              >
                📜 Mission & Timeline Convergence
              </button>
              <button
                type="button"
                className={`intro-tab-btn ${briefingTab === "roster" ? "active" : ""}`}
                onClick={() => {
                  sounds.btnClick();
                  setBriefingTab("roster");
                }}
              >
                👥 Deployed Operative Squad ({players.length})
              </button>
            </div>

            {/* TAB CONTENT: LORE */}
            {briefingTab === "lore" && (
              <div className="intro-lore-container">
                <div className="intro-lore-box">
                  <p className="intro-lore-lead">
                    An unprecedented rift in the spacetime continuum has entangled four pivotal Philippine epochs into a colliding chronological storm:
                  </p>
                  <div className="intro-eras-grid">
                    <div className="intro-era-card era-spanish">
                      <div className="era-icon">🇪🇸</div>
                      <div className="era-title">Spanish Era (1565)</div>
                      <div className="era-desc">Colonial galleons, Intramuros fortresses, and early revolutionary friction.</div>
                    </div>
                    <div className="intro-era-card era-american">
                      <div className="era-icon">🦅</div>
                      <div className="era-title">American Era (1898)</div>
                      <div className="era-desc">Revolutionary struggle, early industrial telegraphs, and contested sovereignty.</div>
                    </div>
                    <div className="intro-era-card era-japanese">
                      <div className="era-icon">🎌</div>
                      <div className="era-title">Japanese Era (1942)</div>
                      <div className="era-desc">Guerilla radio resistance, wartime peril, and covert timeline breaches.</div>
                    </div>
                    <div className="intro-era-card era-myth">
                      <div className="era-icon">🐉</div>
                      <div className="era-title">Mythical Realm</div>
                      <div className="era-desc">Ancestral spirits, Tikbalang, Bakunawa, and primordial divine energy.</div>
                    </div>
                  </div>
                </div>

                <div className="intro-rules-summary">
                  <div className="rule-item">
                    <span className="rule-bullet">🎯</span>
                    <div>
                      <strong>Mission Objective:</strong> Search tiles across the map to locate your target Era Artifact, collect clues, and return it to restore balance.
                    </div>
                  </div>
                  <div className="rule-item">
                    <span className="rule-bullet">⚠️</span>
                    <div>
                      <strong>Contain Timeline Breach:</strong> Avoid letting the Timeline Breach Meter reach 6, or spacetime collapses into total oblivion!
                    </div>
                  </div>
                  <div className="rule-item">
                    <span className="rule-bullet">🎲</span>
                    <div>
                      <strong>First Turn Protocol:</strong> Roll d6 dice for initiative. Highest number goes first. Any tied players re-roll until everyone has a distinct place!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ROSTER */}
            {briefingTab === "roster" && (
              <div className="intro-roster-grid">
                {players.map((p, idx) => {
                  const role = ROLES[p.roleKey] || {};
                  return (
                    <div key={p.id ?? idx} className="intro-operative-card" style={{ borderTop: `4px solid ${p.color || role.color || "#C2974D"}` }}>
                      <div className="operative-avatar-wrap">
                        <img
                          src={role.avatar || "assets/Characters/Copy of librarian.png"}
                          alt={p.name}
                          className="operative-avatar-img"
                        />
                        <span className="operative-type-tag" style={{ background: p.isAi ? "#3A281E" : "#8C6721" }}>
                          {p.isAi ? "🤖 AI BOT" : "⭐ OPERATIVE (YOU)"}
                        </span>
                      </div>
                      <div className="operative-info">
                        <h4 className="operative-name">{p.name}</h4>
                        <div className="operative-role-name" style={{ color: p.color || role.color || "#F5C442" }}>
                          {role.name || p.roleKey}
                        </div>
                        <p className="operative-role-desc">{role.description}</p>
                      </div>
                      <div className="operative-perks">
                        <div className="perk-row">
                          <span className="perk-tag">PASSIVE:</span>
                          <span className="perk-val">{role.passive?.name}: {role.passive?.description}</span>
                        </div>
                        <div className="perk-row">
                          <span className="perk-tag">ACTIVE:</span>
                          <span className="perk-val">{role.active?.name}: {role.active?.description}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="intro-actions-bar">
              {onSkip && (
                <button
                  type="button"
                  className="btn btn-secondary intro-btn-skip"
                  onClick={() => {
                    sounds.btnClick();
                    handleQuickResolve();
                  }}
                >
                  ⚡ Fast-Track Game Start
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary intro-btn-proceed"
                onClick={() => {
                  sounds.btnClick();
                  setStage(STAGE_INITIATIVE);
                }}
              >
                🎲 PROCEED TO ROLL FOR FIRST TURN → <span className="key-hint">SPACE</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: INITIATIVE ROLL-OFF */}
        {stage === STAGE_INITIATIVE && (
          <div className="intro-stage-content intro-initiative-stage">
            {/* TIE NOTICE BANNER */}
            {tieNotice && (
              <div className="initiative-tie-banner animate-pulse">
                {tieNotice}
              </div>
            )}

            {/* DICE GRID */}
            <div className="initiative-cards-grid">
              {players.map((p, idx) => {
                const role = ROLES[p.roleKey] || {};
                const rollVal = currentRolls[p.id];
                const isRolling = rollingPlayerId === p.id;
                const isLocked = lockedRanks[p.id] !== undefined;
                const lockedRank = lockedRanks[p.id];
                const isTied = !isLocked && activeTiedPlayers.some((tp) => tp.id === p.id);
                const isHuman = !p.isAi && !isSpectator;
                const canHumanClick = isHuman && isTied && rollVal === undefined && !isRolling && !isEvaluating;

                return (
                  <div
                    key={p.id ?? idx}
                    className={`initiative-player-card ${isTied ? "is-active-roller" : ""} ${isLocked ? "is-locked" : ""} ${canHumanClick ? "can-click-roll" : ""}`}
                    style={{
                      borderColor: isTied ? "#F5C442" : isLocked ? "#5A422D" : "#3A281E"
                    }}
                    onClick={canHumanClick ? handleHumanRoll : undefined}
                  >
                    <div className="initiative-card-top">
                      <div className="initiative-avatar-box">
                        <img
                          src={role.avatar || "assets/Characters/Copy of librarian.png"}
                          alt={p.name}
                          className="initiative-avatar"
                        />
                      </div>
                      <div className="initiative-card-meta">
                        <div className="initiative-player-name">{p.name}</div>
                        <div className="initiative-player-type" style={{ color: p.color || role.color }}>
                          {p.isAi ? "AI BOT" : "YOU"} • {role.name || p.roleKey}
                        </div>
                      </div>
                    </div>

                    {/* DICE COMPONENT */}
                    <div className="initiative-dice-wrap">
                      <Dice
                        value={rollVal ?? null}
                        isRolling={isRolling}
                        size="lg"
                        theme={isTied ? "chrono" : "hazard"}
                        disabled={isLocked || (rollVal !== undefined && !isRolling)}
                        isInteractive={canHumanClick}
                        onClick={canHumanClick ? handleHumanRoll : undefined}
                      />
                    </div>

                    {/* STATUS PILL */}
                    <div className="initiative-status-pill">
                      {isRolling ? (
                        <span className="status-text text-accent animate-pulse">Rolling d6...</span>
                      ) : rollVal !== undefined ? (
                        <span className="status-text status-rolled">
                          ROLLED <strong className="roll-number">{rollVal}</strong>
                        </span>
                      ) : isLocked ? (
                        <span className="status-text status-locked">
                          🔒 Rank #{lockedRank} Confirmed
                        </span>
                      ) : isHuman ? (
                        <span className="status-text text-accent font-bold animate-pulse">
                          👉 YOUR TURN TO ROLL!
                        </span>
                      ) : (
                        <span className="status-text text-muted">Awaiting turn...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INITIATIVE CONTROLS */}
            <div className="initiative-controls-bar">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleQuickResolve}
                title="Immediately resolve all rolls and tie-breakers"
              >
                ⚡ Fast-Forward All Rolls
              </button>

              {humanActiveRoller && currentRolls[humanActiveRoller.id] === undefined ? (
                <button
                  type="button"
                  className="btn btn-primary initiative-roll-btn animate-bounce"
                  onClick={handleHumanRoll}
                  disabled={rollingPlayerId !== null || isEvaluating}
                >
                  🎲 ROLL INITIATIVE DIE <span className="key-hint">SPACE</span>
                </button>
              ) : (
                <div className="initiative-eval-notice">
                  {isEvaluating ? (
                    <span className="text-accent animate-pulse">Evaluating rolls and tie rankings...</span>
                  ) : (
                    <span>Tied operatives re-roll until every place is strictly determined.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAGE 3: CEREMONY */}
        {stage === STAGE_CEREMONY && (
          <div className="intro-stage-content intro-ceremony-stage">
            {/* FIRST PLACE CELEBRATION */}
            {finalTurnOrder.length > 0 && (
              <div className="ceremony-winner-card">
                <div className="ceremony-crown">👑</div>
                <div className="ceremony-winner-badge">FIRST TURN INITIATIVE WINNER</div>
                <div className="ceremony-winner-profile">
                  <img
                    src={ROLES[finalTurnOrder[0].roleKey]?.avatar || "assets/Characters/Copy of librarian.png"}
                    alt={finalTurnOrder[0].name}
                    className="ceremony-winner-avatar"
                  />
                  <div className="ceremony-winner-info">
                    <h3 className="ceremony-winner-name">{finalTurnOrder[0].name}</h3>
                    <div className="ceremony-winner-role" style={{ color: finalTurnOrder[0].color || "#F5C442" }}>
                      {ROLES[finalTurnOrder[0].roleKey]?.name || finalTurnOrder[0].roleKey}
                    </div>
                    <p className="ceremony-winner-desc">
                      Won the initiative roll-off and leads the expedition into the fractured timeline!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* FULL STANDINGS TABLE */}
            <div className="ceremony-standings-box">
              <div className="ceremony-standings-title">OFFICIAL EXPEDITION TURN SEQUENCE</div>
              <div className="ceremony-standings-list">
                {finalTurnOrder.map((p, idx) => {
                  const role = ROLES[p.roleKey] || {};
                  const isFirst = idx === 0;
                  const isLast = idx === finalTurnOrder.length - 1;

                  return (
                    <div key={p.id ?? idx} className={`ceremony-standing-row ${isFirst ? "standing-first" : ""}`}>
                      <div className="standing-rank-badge">
                        {isFirst ? "🥇 1ST" : idx === 1 ? "🥈 2ND" : idx === 2 ? "🥉 3RD" : `4TH`}
                      </div>
                      <img
                        src={role.avatar || "assets/Characters/Copy of librarian.png"}
                        alt={p.name}
                        className="standing-avatar"
                      />
                      <div className="standing-details">
                        <span className="standing-name">{p.name}</span>
                        <span className="standing-role" style={{ color: p.color || role.color }}>
                          ({role.name || p.roleKey})
                        </span>
                      </div>
                      <div className="standing-extra">
                        {isFirst && <span className="standing-tag-first">Opening Turn 🚀</span>}
                        {isLast && <span className="standing-tag-last">Rearguard 🛡️</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COMMENCE BUTTON */}
            <div className="ceremony-actions-bar">
              <button
                type="button"
                className="btn btn-primary ceremony-commence-btn animate-glow"
                onClick={handleCommence}
              >
                🚀 COMMENCE EXPEDITION → <span className="key-hint">ENTER / SPACE</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
