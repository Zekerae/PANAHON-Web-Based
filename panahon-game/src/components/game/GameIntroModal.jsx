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

  const isOnline = Boolean(network && network.mode === "online");
  const isHost = Boolean(!isOnline || network?.isHost);

  // Initiative State
  // groups: Array of player arrays, preserving rank order from 1st place to last.
  // When a group has length > 1, those players are tied and must re-roll within their bracket.
  const [groups, setGroups] = useState(() => (Array.isArray(players) && players.length > 0 ? [[...players]] : []));
  const [round, setRound] = useState(1);
  const [currentRolls, setCurrentRolls] = useState({});
  const [rollingPlayerId, setRollingPlayerId] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [tieNotice, setTieNotice] = useState(null);
  const [lockedRanks, setLockedRanks] = useState({}); // { [playerId]: rankNumber }
  const [finalTurnOrder, setFinalTurnOrder] = useState([]);

  // Auto-roll timers ref
  const rollTimeoutsRef = useRef([]);
  const aiRollingRef = useRef(false);
  const clearAllTimeouts = () => {
    rollTimeoutsRef.current.forEach((t) => clearTimeout(t));
    rollTimeoutsRef.current = [];
    aiRollingRef.current = false;
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  // Sync initial groups when modal opens or players change
  useEffect(() => {
    if (Array.isArray(players) && players.length > 0 && (!groups || groups.length === 0)) {
      setGroups([[...players]]);
    }
  }, [players, groups?.length]);

  // Which players must roll in the current round?
  // Only players in tied groups (groups with length > 1) need to roll!
  const activeTiedPlayers = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    return groups.filter((g) => Array.isArray(g) && g.length > 1).flat();
  }, [groups]);

  const activeTiedPlayerIds = useMemo(() => {
    const s = new Set();
    (activeTiedPlayers || []).forEach((p) => {
      s.add(p.id);
      s.add(String(p.id));
      if (typeof p.id === "string" && !isNaN(Number(p.id))) s.add(Number(p.id));
    });
    return s;
  }, [activeTiedPlayers]);

  // The local player on THIS machine
  const myLocalPlayer = useMemo(() => {
    if (isSpectator) return null;
    if (isOnline) {
      if (network?.myPlayerName) {
        const byName = players.find((p) => p.name === network.myPlayerName && p.roleKey !== 'SPECTATOR');
        if (byName) return byName;
      }
      const byLocal = players.find((p) => p.isLocal && p.roleKey !== 'SPECTATOR');
      if (byLocal) return byLocal;
      if (network?.playerId !== null && network?.playerId !== undefined) {
        const byId = players.find((p) => String(p.id) === String(network.playerId) && p.roleKey !== 'SPECTATOR');
        if (byId) return byId;
      }
      return null;
    }

    // Offline local / pass-and-play:
    // First, select the next active tied human player who has not yet rolled
    const unrolledHuman = players.find(
      (p) => !p.isAi && activeTiedPlayerIds.has(p.id) && currentRolls[p.id] === undefined
    );
    if (unrolledHuman) return unrolledHuman;

    // Next, any tied player who hasn't rolled yet
    const anyUnrolledTied = players.find(
      (p) => activeTiedPlayerIds.has(p.id) && currentRolls[p.id] === undefined
    );
    if (anyUnrolledTied) return anyUnrolledTied;

    // Fallback
    return players.find((p) => !p.isAi) || players[0] || null;
  }, [
    players,
    isSpectator,
    isOnline,
    network?.myPlayerName,
    network?.playerId,
    activeTiedPlayerIds,
    currentRolls
  ]);

  const canMyPlayerRoll = useMemo(() => {
    if (isSpectator || !myLocalPlayer) return false;
    const isTied = activeTiedPlayerIds.has(myLocalPlayer.id);
    const hasRolled = currentRolls[myLocalPlayer.id] !== undefined;
    return isTied && !hasRolled && !rollingPlayerId && !isEvaluating;
  }, [myLocalPlayer, activeTiedPlayerIds, currentRolls, rollingPlayerId, isEvaluating]);

  // Compute locked ranks for display
  useEffect(() => {
    const newLocked = {};
    let currentRank = 1;
    if (Array.isArray(groups)) {
      groups.forEach((g) => {
        if (!Array.isArray(g) || g.length === 0) return;
        if (g.length === 1 && g[0]) {
          newLocked[g[0].id] = currentRank;
        }
        currentRank += g.length;
      });
    }
    setLockedRanks(newLocked);
  }, [groups]);

  // Evaluate round results and form new groups (Host-authoritative in online mode)
  const evaluateRoundResults = useCallback(
    (rolls) => {
      if (isOnline && !isHost) return;
      if (!rolls || typeof rolls !== 'object') return;

      setIsEvaluating(true);
      const newGroups = [];
      let foundTieInThisRound = false;
      const tiedDetails = [];

      (groups || []).forEach((g) => {
        if (!Array.isArray(g) || g.length === 0) return;
        if (g.length === 1) {
          newGroups.push(g);
        } else {
          // Group by score descending
          const byScore = {};
          g.forEach((p) => {
            if (!p) return;
            const rawScore = rolls[p.id];
            const score = (typeof rawScore === 'number' && !isNaN(rawScore)) ? rawScore : 1;
            if (!byScore[score]) byScore[score] = [];
            byScore[score].push(p);
          });
          const sortedScores = Object.keys(byScore)
            .map(Number)
            .filter((n) => !isNaN(n))
            .sort((a, b) => b - a);

          sortedScores.forEach((s) => {
            const subgroup = byScore[s];
            if (Array.isArray(subgroup) && subgroup.length > 0) {
              newGroups.push(subgroup);
              if (subgroup.length > 1) {
                foundTieInThisRound = true;
                tiedDetails.push({
                  names: subgroup.map((p) => p.name || 'Operative').join(" & "),
                  score: s
                });
              }
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
        const tieMsg = `⚔️ TIE DETECTED: ${msg}! Re-rolling for position...`;
        setTieNotice(tieMsg);

        if (isOnline && isHost && network) {
          network.sendAction({
            type: "INITIATIVE_TIE_REROLL",
            newGroups,
            round: round + 1,
            msg: tieMsg
          });
        }

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

        if (isOnline && isHost && network) {
          network.sendAction({
            type: "INITIATIVE_FINAL_ORDER",
            finalTurnOrder: resolvedOrder
          });
        }

        const t = setTimeout(() => {
          setIsEvaluating(false);
          setStage(STAGE_CEREMONY);
        }, 900);
        rollTimeoutsRef.current.push(t);
      }
    },
    [groups, isOnline, isHost, network, round]
  );

  // Trigger automated rolls for AI bots in active tied groups
  const triggerAiRolls = useCallback(
    (startingRolls) => {
      // In online mode, only the Host controls AI bot rolls
      if (isOnline && !isHost) return;

      const botsToRoll = activeTiedPlayers.filter(
        (p) => p.isAi && startingRolls[p.id] === undefined
      );

      if (botsToRoll.length === 0) {
        // Check if all active tied players have rolls
        const allTiedHaveRolls = activeTiedPlayers.every(
          (p) => startingRolls[p.id] !== undefined
        );
        if (allTiedHaveRolls && activeTiedPlayers.length > 0) {
          evaluateRoundResults(startingRolls);
        }
        return;
      }

      // In offline local mode, let human players finish rolling before AI bots roll
      const humansToRoll = activeTiedPlayers.filter(
        (p) => !p.isAi && startingRolls[p.id] === undefined
      );
      if (!isOnline && humansToRoll.length > 0) {
        return;
      }

      if (aiRollingRef.current) return;
      aiRollingRef.current = true;

      let accumulatedRolls = { ...startingRolls };
      botsToRoll.forEach((bot, index) => {
        const delay = 350 + index * 650;
        const t = setTimeout(() => {
          setRollingPlayerId(bot.id);
          sounds.diceRoll();

          const rollT = setTimeout(() => {
            const val = Math.floor(Math.random() * 6) + 1;
            accumulatedRolls[bot.id] = val;

            setCurrentRolls((prev) => {
              const nextRolls = { ...prev, [bot.id]: val };

              // Broadcast AI roll in online mode
              if (isOnline && isHost && network) {
                network.sendAction({
                  type: "INITIATIVE_ROLL",
                  playerId: bot.id,
                  roll: val
                });
              }

              const allDone = activeTiedPlayers.every(
                (p) => nextRolls[p.id] !== undefined
              );
              if (allDone) {
                aiRollingRef.current = false;
                const evalTimeout = setTimeout(() => {
                  evaluateRoundResults(nextRolls);
                }, 400);
                rollTimeoutsRef.current.push(evalTimeout);
              }

              return nextRolls;
            });

            setRollingPlayerId(null);
          }, 550);
          rollTimeoutsRef.current.push(rollT);
        }, delay);
        rollTimeoutsRef.current.push(t);
      });
    },
    [activeTiedPlayers, isOnline, isHost, network, evaluateRoundResults]
  );

  // Human player clicks roll button, card, or hits Spacebar
  const handleHumanRoll = useCallback(
    (targetPlayerId) => {
      if (isEvaluating || rollingPlayerId !== null) return;

      const rollPlayer = (targetPlayerId !== undefined)
        ? (players.find((p) => p.id === targetPlayerId) || myLocalPlayer)
        : myLocalPlayer;

      if (!rollPlayer) return;

      // Ensure this player is in an active tied bracket and hasn't rolled yet
      const isTied = activeTiedPlayerIds.has(rollPlayer.id);
      if (!isTied) return;
      if (currentRolls[rollPlayer.id] !== undefined) return;

      // In online mode, you can only roll your own assigned operative
      if (isOnline && (!myLocalPlayer || String(rollPlayer.id) !== String(myLocalPlayer.id))) return;

      setRollingPlayerId(rollPlayer.id);
      sounds.diceRoll();

      const rollDuration = 550;
      const t = setTimeout(() => {
        const val = Math.floor(Math.random() * 6) + 1;

        setCurrentRolls((prev) => {
          const updatedRolls = { ...prev, [rollPlayer.id]: val };

          // In online mode, broadcast roll to all peers!
          if (isOnline && network) {
            network.sendAction({
              type: "INITIATIVE_ROLL",
              playerId: rollPlayer.id,
              roll: val
            });
          }

          // If Host (or offline), check if round is complete or trigger AI bot rolls
          if (!isOnline || isHost) {
            const allDone = activeTiedPlayers.every((p) => updatedRolls[p.id] !== undefined);
            if (allDone && activeTiedPlayers.length > 0) {
              const evalT = setTimeout(() => {
                evaluateRoundResults(updatedRolls);
              }, 400);
              rollTimeoutsRef.current.push(evalT);
            } else {
              triggerAiRolls(updatedRolls);
            }
          }

          return updatedRolls;
        });

        setRollingPlayerId(null);
      }, rollDuration);
      rollTimeoutsRef.current.push(t);
    },
    [
      isEvaluating,
      rollingPlayerId,
      players,
      myLocalPlayer,
      activeTiedPlayers,
      activeTiedPlayerIds,
      currentRolls,
      isOnline,
      isHost,
      network,
      evaluateRoundResults,
      triggerAiRolls
    ]
  );

  // Network listener for synchronized initiative rolls, tie-breakers, and turn order
  useEffect(() => {
    if (!network || !isOnline) return;

    network.onInitiativeAction = (action) => {
      if (!action) return;

      if (action.type === "INITIATIVE_STAGE") {
        if (action.stage) {
          setStage(action.stage);
          sounds.btnClick();
        }
      } else if (action.type === "INITIATIVE_ROLL") {
        const { playerId, roll } = action;
        if (playerId !== undefined && roll !== undefined) {
          setRollingPlayerId(playerId);
          sounds.diceRoll();

          const t = setTimeout(() => {
            setCurrentRolls((prev) => {
              const nextRolls = { ...prev, [playerId]: roll };
              // If Host, check if this completed the active round or if remaining bots must roll
              if (isHost) {
                const allDone = activeTiedPlayers.every(
                  (p) => nextRolls[p.id] !== undefined
                );
                if (allDone && activeTiedPlayers.length > 0) {
                  const evalT = setTimeout(() => {
                    evaluateRoundResults(nextRolls);
                  }, 400);
                  rollTimeoutsRef.current.push(evalT);
                } else {
                  const remainingBots = activeTiedPlayers.filter(
                    (p) => p.isAi && nextRolls[p.id] === undefined
                  );
                  if (remainingBots.length > 0 && !aiRollingRef.current) {
                    triggerAiRolls(nextRolls);
                  }
                }
              }
              return nextRolls;
            });
            setRollingPlayerId(null);
          }, 550);
          rollTimeoutsRef.current.push(t);
        }
      } else if (action.type === "INITIATIVE_TIE_REROLL") {
        const { newGroups, round: nextRound, msg } = action;
        sounds.danger();
        setTieNotice(msg || "⚔️ TIE DETECTED! Re-rolling for position...");

        const t = setTimeout(() => {
          if (Array.isArray(newGroups)) {
            setGroups(newGroups.filter((g) => Array.isArray(g) && g.length > 0));
          }
          if (nextRound) setRound(nextRound);
          setCurrentRolls({});
          setTieNotice(null);
          setIsEvaluating(false);
          clearAllTimeouts();
        }, 1600);
        rollTimeoutsRef.current.push(t);
      } else if (action.type === "INITIATIVE_FINAL_ORDER") {
        const { finalTurnOrder: order } = action;
        if (order && order.length > 0) {
          setFinalTurnOrder(order);
          sounds.victory();
          const t = setTimeout(() => {
            setIsEvaluating(false);
            setStage(STAGE_CEREMONY);
          }, 800);
          rollTimeoutsRef.current.push(t);
        }
      } else if (action.type === "INITIATIVE_FAST_FORWARD") {
        const { rolls, finalTurnOrder: order } = action;
        clearAllTimeouts();
        setRollingPlayerId(null);
        if (rolls) setCurrentRolls(rolls);
        if (order) setFinalTurnOrder(order);
        sounds.victory();
        setIsEvaluating(false);
        setStage(STAGE_CEREMONY);
      }
    };

    return () => {
      network.onInitiativeAction = null;
    };
  }, [network, isOnline, isHost, activeTiedPlayers, evaluateRoundResults, triggerAiRolls]);

  // If no human needs to roll (spectator mode or humans finished), auto-trigger AI rolls (Host only)
  useEffect(() => {
    if (stage !== STAGE_INITIATIVE || isEvaluating || rollingPlayerId !== null) return;
    if (isOnline && !isHost) return;

    if (activeTiedPlayers.length > 0) {
      const activeUnrolledBots = activeTiedPlayers.filter((p) => p.isAi && currentRolls[p.id] === undefined);
      const activeUnrolledHumans = activeTiedPlayers.filter((p) => !p.isAi && currentRolls[p.id] === undefined);

      const shouldTrigger = isOnline
        ? activeUnrolledBots.length > 0
        : (activeUnrolledBots.length > 0 && activeUnrolledHumans.length === 0);

      if (shouldTrigger && !aiRollingRef.current) {
        const startTimer = setTimeout(() => {
          triggerAiRolls(currentRolls);
        }, 400);
        rollTimeoutsRef.current.push(startTimer);
      }
    }
  }, [
    stage,
    isEvaluating,
    rollingPlayerId,
    activeTiedPlayers,
    currentRolls,
    triggerAiRolls,
    isOnline,
    isHost
  ]);

  // Fast-forward / instant resolve
  const handleQuickResolve = useCallback(() => {
    if (isOnline && !isHost) return;

    clearAllTimeouts();
    setRollingPlayerId(null);

    let tempGroups = (groups || [])
      .filter((g) => Array.isArray(g) && g.length > 0)
      .map((g) => [...g]);
    let currentRoundRolls = { ...currentRolls };

    while (tempGroups.some((g) => Array.isArray(g) && g.length > 1)) {
      const newGroups = [];
      tempGroups.forEach((g) => {
        if (!Array.isArray(g) || g.length === 0) return;
        if (g.length === 1) {
          newGroups.push(g);
        } else {
          const byScore = {};
          g.forEach((p) => {
            if (!p) return;
            const score = Math.floor(Math.random() * 6) + 1;
            currentRoundRolls[p.id] = score;
            if (!byScore[score]) byScore[score] = [];
            byScore[score].push(p);
          });
          const sortedScores = Object.keys(byScore)
            .map(Number)
            .filter((n) => !isNaN(n))
            .sort((a, b) => b - a);
          sortedScores.forEach((s) => {
            const subgroup = byScore[s];
            if (Array.isArray(subgroup) && subgroup.length > 0) {
              newGroups.push(subgroup);
            }
          });
        }
      });
      tempGroups = newGroups;
    }

    const resolvedOrder = tempGroups.flat();
    sounds.victory();
    setCurrentRolls(currentRoundRolls);
    setGroups(tempGroups);
    setFinalTurnOrder(resolvedOrder);
    setIsEvaluating(false);
    setStage(STAGE_CEREMONY);

    if (isOnline && isHost && network) {
      network.sendAction({
        type: "INITIATIVE_FAST_FORWARD",
        rolls: currentRoundRolls,
        finalTurnOrder: resolvedOrder
      });
    }
  }, [groups, currentRolls, isOnline, isHost, network]);

  // Advance from Briefing to Initiative
  const handleProceedToInitiative = () => {
    sounds.btnClick();
    setStage(STAGE_INITIATIVE);
    if (isOnline && isHost && network) {
      network.sendAction({
        type: "INITIATIVE_STAGE",
        stage: STAGE_INITIATIVE
      });
    }
  };

  // Handle final expedition commencement
  const handleCommence = useCallback(() => {
    sounds.turnStart();
    const orderToCommence = (Array.isArray(finalTurnOrder) && finalTurnOrder.length > 0) ? finalTurnOrder : (players || []);
    if (onComplete) {
      onComplete(orderToCommence);
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
          handleProceedToInitiative();
        } else if (stage === STAGE_INITIATIVE) {
          if (canMyPlayerRoll && myLocalPlayer) {
            e.preventDefault();
            handleHumanRoll(myLocalPlayer.id);
          }
        } else if (stage === STAGE_CEREMONY) {
          if (!isOnline || isHost) {
            e.preventDefault();
            handleCommence();
          }
        }
      } else if (e.key === "Enter") {
        if (stage === STAGE_BRIEFING) {
          e.preventDefault();
          handleProceedToInitiative();
        } else if (stage === STAGE_CEREMONY) {
          if (!isOnline || isHost) {
            e.preventDefault();
            handleCommence();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    stage,
    canMyPlayerRoll,
    isOnline,
    isHost,
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
            {stage === STAGE_INITIATIVE &&
              (round === 1
                ? "🎲 TABLETOP INITIATIVE: ROLL FOR FIRST TURN"
                : `⚔️ TIE-BREAKER RE-ROLL (ROUND ${round})`)}
            {stage === STAGE_CEREMONY && "🏆 INITIATIVE DETERMINED • EXPEDITION ORDER"}
          </h2>
          <div className="intro-subtitle">
            {stage === STAGE_BRIEFING &&
              "PHILIPPINE ARCHIPELAGO TIMELINE CONVERGENCE CRISIS"}
            {stage === STAGE_INITIATIVE &&
              "Standard board game rules: The highest roll takes first turn. Tied operatives must roll again until all positions are settled!"}
            {stage === STAGE_CEREMONY &&
              "All positions uniquely settled down to the last place. The expedition begins!"}
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
                👥 Deployed Operative Squad ({(players || []).length})
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
                  const isMe = Boolean(myLocalPlayer && p.id === myLocalPlayer.id);

                  return (
                    <div
                      key={p.id ?? idx}
                      className="intro-operative-card"
                      style={{ borderTop: `4px solid ${p.color || role.color || "#C2974D"}` }}
                    >
                      <div className="operative-avatar-wrap">
                        <img
                          src={role.avatar || "assets/Characters/Copy of librarian.png"}
                          alt={p.name}
                          className="operative-avatar-img"
                        />
                        <span
                          className="operative-type-tag"
                          style={{ background: isMe ? "#15803D" : p.isAi ? "#3A281E" : "#8C6721" }}
                        >
                          {isMe ? "⭐ OPERATIVE (YOU)" : p.isAi ? "🤖 AI BOT" : "👤 ALLY"}
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
              {(!isOnline || isHost) && onSkip && (
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
              {(!isOnline || isHost) ? (
                <button
                  type="button"
                  className="btn btn-primary intro-btn-proceed"
                  onClick={handleProceedToInitiative}
                >
                  🎲 PROCEED TO ROLL FOR FIRST TURN → <span className="key-hint">SPACE</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary intro-btn-proceed"
                  onClick={() => {
                    sounds.btnClick();
                    setStage(STAGE_INITIATIVE);
                  }}
                >
                  🎲 PROCEED TO ROLL FOR FIRST TURN →
                </button>
              )}
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
                const isTied = !isLocked && activeTiedPlayerIds.has(p.id);
                const isMe = Boolean(myLocalPlayer && p.id === myLocalPlayer.id);
                const canClickThis = Boolean(
                  !isLocked &&
                  isTied &&
                  rollVal === undefined &&
                  !isRolling &&
                  !isEvaluating &&
                  rollingPlayerId === null &&
                  (isOnline ? isMe : (!p.isAi || isMe))
                );

                return (
                  <div
                    key={p.id ?? idx}
                    className={`initiative-player-card ${isTied ? "is-active-roller" : ""} ${isLocked ? "is-locked" : ""} ${canClickThis ? "can-click-roll" : ""}`}
                    style={{
                      borderColor: isTied ? "#F5C442" : isLocked ? "#5A422D" : "#3A281E",
                      cursor: canClickThis ? "pointer" : "default"
                    }}
                    onClick={canClickThis ? () => handleHumanRoll(p.id) : undefined}
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
                          {isMe ? "⭐ YOU" : p.isAi ? "🤖 AI BOT" : "👤 OPERATIVE"} • {role.name || p.roleKey}
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
                        isInteractive={canClickThis}
                        onClick={canClickThis ? () => handleHumanRoll(p.id) : undefined}
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
                      ) : isMe ? (
                        <span className="status-text text-accent font-bold animate-pulse">
                          👉 YOUR TURN TO ROLL!
                        </span>
                      ) : canClickThis ? (
                        <span className="status-text text-accent font-bold">
                          👉 CLICK TO ROLL!
                        </span>
                      ) : (
                        <span className="status-text text-muted">
                          {p.isAi ? "Awaiting turn..." : `Awaiting ${p.name}'s roll...`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INITIATIVE CONTROLS */}
            <div className="initiative-controls-bar">
              {(!isOnline || isHost) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleQuickResolve}
                  title="Immediately resolve all rolls and tie-breakers"
                >
                  ⚡ Fast-Forward All Rolls
                </button>
              )}

              {canMyPlayerRoll ? (
                <button
                  type="button"
                  className="btn btn-primary initiative-roll-btn animate-bounce"
                  onClick={() => handleHumanRoll(myLocalPlayer?.id)}
                  disabled={rollingPlayerId !== null || isEvaluating}
                >
                  🎲 ROLL FOR {(myLocalPlayer?.name || 'OPERATIVE').toUpperCase()} <span className="key-hint">SPACE</span>
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
            {(finalTurnOrder || []).length > 0 && (
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
                  const isLast = idx === (finalTurnOrder?.length || 1) - 1;

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
              {(!isOnline || isHost) ? (
                <button
                  type="button"
                  className="btn btn-primary ceremony-commence-btn animate-glow"
                  onClick={handleCommence}
                >
                  🚀 COMMENCE EXPEDITION → <span className="key-hint">ENTER / SPACE</span>
                </button>
              ) : (
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "0.82rem",
                    color: "#FCD34D",
                    letterSpacing: "1px",
                    padding: "10px 20px",
                    background: "rgba(26, 18, 11, 0.85)",
                    border: "1.5px solid #C2974D",
                    borderRadius: "6px"
                  }}
                  className="animate-pulse"
                >
                  ⏳ Expedition Host is finalizing launch...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
