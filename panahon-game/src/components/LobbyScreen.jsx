import React, { useState } from "react";
import sounds from "../sound.js";
import { ROLES, ROLE_ORDER, PLAYER_COLORS } from "../gameData.js";
import ChatBox from "./ChatBox.jsx";
import { isSupabaseAvailable } from "../supabaseClient.js";

export default function LobbyScreen({
  lobbyMode,
  setLobbyMode,
  localPlayers,
  setLocalPlayers,
  onlinePlayerName,
  setOnlinePlayerName,
  onlineSelectedRole,
  setOnlineSelectedRole,
  onlineRoomCodeInput,
  setOnlineRoomCodeInput,
  network,
  currentRoomPlayers,
  isConnectingOnline,
  onStartLocal,
  onConnectOnline,
  onLeaveRoom,
  onStartOnline,
  onBack,
  onOpenSupabaseConfig
}) {
  const [onlineSubMode, setOnlineSubMode] = useState("create");
  const roleKeys = ROLE_ORDER;
  const isRoomActive = network.roomCode !== null;
  const hasSupabase = isSupabaseAvailable();

  // Presets
  const applyPreset1v3 = () => {
    sounds.btnClick();
    setLocalPlayers([
      { name: "Player 1", roleKey: "HISTORIAN", type: "human", difficulty: "normal" },
      { name: "Bot Explorer", roleKey: "EXPLORER", type: "ai", difficulty: "normal" },
      { name: "Bot Guardian", roleKey: "GUARDIAN", type: "ai", difficulty: "normal" },
      { name: "Bot Strategist", roleKey: "STRATEGIST", type: "ai", difficulty: "normal" }
    ]);
  };

  const applyPreset2v2 = () => {
    sounds.btnClick();
    setLocalPlayers([
      { name: "Player 1", roleKey: "HISTORIAN", type: "human", difficulty: "normal" },
      { name: "Player 2", roleKey: "EXPLORER", type: "human", difficulty: "normal" },
      { name: "Bot Guardian", roleKey: "GUARDIAN", type: "ai", difficulty: "normal" },
      { name: "Bot Strategist", roleKey: "STRATEGIST", type: "ai", difficulty: "normal" }
    ]);
  };

  const applyPreset4Human = () => {
    sounds.btnClick();
    setLocalPlayers([
      { name: "Player 1", roleKey: "HISTORIAN", type: "human", difficulty: "normal" },
      { name: "Player 2", roleKey: "EXPLORER", type: "human", difficulty: "normal" },
      { name: "Player 3", roleKey: "GUARDIAN", type: "human", difficulty: "normal" },
      { name: "Player 4", roleKey: "STRATEGIST", type: "human", difficulty: "normal" }
    ]);
  };

  const applyPresetRandom = () => {
    sounds.btnClick();
    const shuffledRoles = [...ROLE_ORDER].sort(() => Math.random() - 0.5);
    setLocalPlayers(localPlayers.map((p, idx) => ({
      ...p,
      roleKey: shuffledRoles[idx % shuffledRoles.length]
    })));
  };

  const updateSlot = (idx, patch) => {
    const updated = [...localPlayers];
    updated[idx] = { ...updated[idx], ...patch };
    setLocalPlayers(updated);
  };

  const activeSlots = localPlayers.filter(p => p.type !== "closed");

  return (
    <div
      className="lobby-screen duelyst-theme"
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "radial-gradient(circle at 50% 20%, #0B192C 0%, #060D17 65%, #020617 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "32px 16px 60px",
        boxSizing: "border-box",
        overflowY: "auto"
      }}
    >
      {/* Top Brand Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.2rem",
            letterSpacing: "3.5px",
            color: "#F8FAFC",
            margin: "0 0 4px",
            textShadow: "0 0 25px rgba(56, 189, 248, 0.45)"
          }}
        >
          CHRONO EXPEDITION STAGING
        </h1>
        <div style={{
          width: "70px",
          height: "2px",
          background: "linear-gradient(90deg, transparent, #38BDF8, transparent)",
          margin: "6px auto 8px"
        }} />
        <div style={{ fontSize: "0.78rem", color: "#94A3B8", letterSpacing: "1px" }}>
          OPERATIVE CADRE CONFIGURATION & TIMELINE SYNCHRONIZATION
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          maxWidth: network.roomCode ? "880px" : "740px",
          width: "100%",
          marginBottom: "16px"
        }}
      >
        <button
          onClick={() => { sounds.btnClick(); setLobbyMode("local"); }}
          style={{
            flex: 1,
            padding: "10px 16px",
            background: lobbyMode === "local"
              ? "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.35))"
              : "rgba(15, 23, 42, 0.6)",
            border: lobbyMode === "local"
              ? "1.5px solid #38BDF8"
              : "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            color: lobbyMode === "local" ? "#FFF" : "#94A3B8",
            fontFamily: "var(--font-display)",
            fontSize: "0.86rem",
            fontWeight: 800,
            letterSpacing: "1px",
            cursor: "pointer",
            transition: "all 0.18s ease"
          }}
        >
          ⚔️ LOCAL EXPEDITION & BOT SIMULATION
        </button>

        <button
          onClick={() => { sounds.btnClick(); setLobbyMode("online"); }}
          style={{
            flex: 1,
            padding: "10px 16px",
            background: lobbyMode === "online"
              ? "linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.35))"
              : "rgba(15, 23, 42, 0.6)",
            border: lobbyMode === "online"
              ? "1.5px solid #38BDF8"
              : "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            color: lobbyMode === "online" ? "#FFF" : "#94A3B8",
            fontFamily: "var(--font-display)",
            fontSize: "0.86rem",
            fontWeight: 800,
            letterSpacing: "1px",
            cursor: "pointer",
            transition: "all 0.18s ease"
          }}
        >
          🌐 QUANTUM RELAY MULTIPLAYER
        </button>
      </div>

      {lobbyMode === "local" ? (
        <div
          style={{
            background: "rgba(10, 14, 26, 0.95)",
            backdropFilter: "blur(16px)",
            border: "1.5px solid rgba(56, 189, 248, 0.35)",
            borderRadius: "12px",
            padding: "20px 24px",
            width: "100%",
            maxWidth: "740px",
            boxShadow: "0 16px 50px rgba(0, 0, 0, 0.7)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "#F59E0B", letterSpacing: "1px", fontWeight: 800 }}>
              OPERATIVE CADRE DOSSIER
            </div>
            <div style={{ fontSize: "0.74rem", color: "#38BDF8", fontWeight: 700 }}>
              {activeSlots.length} / 4 OPERATIVES READY
            </div>
          </div>

          <p style={{ fontSize: "0.78rem", color: "#94A3B8", lineHeight: 1.5, margin: "0 0 14px" }}>
            Configure each slot as <strong>👤 Human Operative</strong>, <strong>🤖 AI Construct</strong>, or <strong>🚫 Deactivated</strong>. Assign roles and calibrate AI parameters:
          </p>

          {/* Tactical Preset Bar */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {[
              { label: "⚔️ Solo Operative (1 Human + 3 AI)", fn: applyPreset1v3 },
              { label: "🤝 Dual Strike (2 Humans + 2 AI)", fn: applyPreset2v2 },
              { label: "👥 Full Cadre (4 Humans)", fn: applyPreset4Human },
              { label: "🎲 Rebalance Roles", fn: applyPresetRandom }
            ].map((p, i) => (
              <button
                key={i}
                onClick={p.fn}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "6px",
                  color: "#CBD5E1",
                  padding: "6px 12px",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#38BDF8"; e.currentTarget.style.color = "#FFF"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)"; e.currentTarget.style.color = "#CBD5E1"; }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Slot Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {localPlayers.map((player, idx) => {
              const isClosed = player.type === "closed";
              const isAi = player.type === "ai";
              const role = ROLES[player.roleKey] || ROLES.HISTORIAN;
              const color = PLAYER_COLORS[idx];

              if (isClosed) {
                return (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(15, 23, 42, 0.4)",
                      border: "1px dashed rgba(255, 255, 255, 0.15)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                        🚫
                      </div>
                      <div>
                        <div style={{ fontSize: "0.74rem", color: "#64748B", fontWeight: 800 }}>
                          SLOT {idx + 1} &bull; DEACTIVATED
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#475569" }}>
                          Slot offline (will not participate in this expedition)
                        </div>
                      </div>
                    </div>

                    <select
                      style={{
                        background: "rgba(15, 23, 42, 0.8)",
                        color: "#94A3B8",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        outline: "none"
                      }}
                      value={player.type}
                      onChange={(e) => updateSlot(idx, { type: e.target.value })}
                    >
                      <option value="human">👤 Human Operative</option>
                      <option value="ai">🤖 AI Construct</option>
                      <option value="closed">🚫 Deactivated</option>
                    </select>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderLeft: `4px solid ${color}`,
                    borderRadius: "8px",
                    padding: "12px 14px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center"
                  }}
                >
                  <img
                    src={role.avatar}
                    alt={role.name}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "6px",
                      objectFit: "cover",
                      border: `1.5px solid ${color}`
                    }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.74rem", color, fontWeight: 900, letterSpacing: "0.5px" }}>
                          SLOT {idx + 1}
                        </span>
                        <span style={{
                          fontSize: "0.64rem",
                          fontWeight: 800,
                          background: isAi ? "rgba(96, 165, 250, 0.15)" : "rgba(52, 211, 153, 0.15)",
                          color: isAi ? "#60A5FA" : "#34D399",
                          border: `1px solid ${isAi ? "rgba(96, 165, 250, 0.35)" : "rgba(52, 211, 153, 0.35)"}`,
                          padding: "1px 6px",
                          borderRadius: "4px"
                        }}>
                          {isAi ? "🤖 AI CONSTRUCT" : "👤 HUMAN OPERATIVE"}
                        </span>
                      </div>

                      <select
                        style={{
                          background: "rgba(15, 23, 42, 0.9)",
                          color: isAi ? "#60A5FA" : "#34D399",
                          border: `1px solid ${isAi ? "rgba(96, 165, 250, 0.3)" : "rgba(52, 211, 153, 0.3)"}`,
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          outline: "none"
                        }}
                        value={player.type}
                        onChange={(e) => updateSlot(idx, { type: e.target.value })}
                      >
                        <option value="human">👤 Human Operative</option>
                        <option value="ai">🤖 AI Construct</option>
                        <option value="closed">🚫 Deactivated</option>
                      </select>
                    </div>

                    {/* Inputs Row */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                      <input
                        type="text"
                        value={player.name}
                        placeholder={isAi ? "AI Construct Name" : "Operative Name"}
                        style={{
                          flex: 1,
                          background: "rgba(0, 0, 0, 0.5)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          borderRadius: "4px",
                          padding: "5px 8px",
                          fontSize: "0.78rem",
                          color: "#FFF",
                          outline: "none"
                        }}
                        onChange={(e) => updateSlot(idx, { name: e.target.value })}
                      />

                      {isAi && (
                        <select
                          style={{
                            background: "rgba(0, 0, 0, 0.5)",
                            color: "#38BDF8",
                            border: "1px solid rgba(56, 189, 248, 0.35)",
                            borderRadius: "4px",
                            padding: "5px 8px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            outline: "none"
                          }}
                          value={player.difficulty || "normal"}
                          onChange={(e) => updateSlot(idx, { difficulty: e.target.value })}
                        >
                          <option value="easy">🟢 Easy Protocol</option>
                          <option value="normal">🔵 Standard AI</option>
                          <option value="hard">🔴 Master AI</option>
                        </select>
                      )}

                      <select
                        style={{
                          background: "rgba(0, 0, 0, 0.5)",
                          color: "#F59E0B",
                          border: "1px solid rgba(245, 158, 11, 0.35)",
                          borderRadius: "4px",
                          padding: "5px 8px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          outline: "none"
                        }}
                        value={player.roleKey}
                        onChange={(e) => updateSlot(idx, { roleKey: e.target.value })}
                      >
                        {roleKeys.map(rk => (
                          <option key={rk} value={rk}>
                            {ROLES[rk].name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ fontSize: "0.7rem", color: "#94A3B8" }}>
                      <strong style={{ color: "#38BDF8" }}>Passive:</strong> {role.passive.name} ({role.passive.description}) &bull; <strong style={{ color: "#F59E0B" }}>Active:</strong> {role.active.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <button
              className="btn btn-secondary"
              onClick={onBack}
              style={{ padding: "10px 20px", fontSize: "0.82rem" }}
            >
              ← Return to Headquarters
            </button>

            <button
              className="btn btn-primary"
              disabled={activeSlots.length === 0}
              onClick={onStartLocal}
              style={{
                padding: "10px 24px",
                fontSize: "0.88rem",
                fontWeight: 800,
                letterSpacing: "1px"
              }}
            >
              🚀 INITIATE EXPEDITION ({activeSlots.length}) ➔
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(10, 14, 26, 0.95)",
            backdropFilter: "blur(16px)",
            border: "1.5px solid rgba(56, 189, 248, 0.35)",
            borderRadius: "12px",
            padding: "20px 24px",
            width: "100%",
            maxWidth: network.roomCode ? "880px" : "740px",
            boxShadow: "0 16px 50px rgba(0, 0, 0, 0.7)"
          }}
        >
          {!isRoomActive && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={() => { sounds.btnClick(); setOnlineSubMode("create"); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: onlineSubMode === "create" ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.05)",
                  border: onlineSubMode === "create" ? "1.5px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  color: onlineSubMode === "create" ? "#FFF" : "#94A3B8",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                🚀 HOST TIMELINE ROOM
              </button>
              <button
                onClick={() => { sounds.btnClick(); setOnlineSubMode("join"); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: onlineSubMode === "join" ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.05)",
                  border: onlineSubMode === "join" ? "1.5px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  color: onlineSubMode === "join" ? "#FFF" : "#94A3B8",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                🚪 JOIN EXISTING ANOMALY
              </button>
            </div>
          )}

          {!isRoomActive ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 800, letterSpacing: "1px" }}>
                  OPERATIVE CALLSIGN:
                </label>
                <input
                  type="text"
                  className="player-name-input"
                  value={onlinePlayerName}
                  style={{
                    width: "100%",
                    marginTop: "4px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    color: "#FFF",
                    fontSize: "0.88rem"
                  }}
                  onChange={(e) => setOnlinePlayerName(e.target.value)}
                  placeholder="Enter your operative callsign"
                />
              </div>

              {/* Role Selection Grid */}
              <div>
                <label style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 800, letterSpacing: "1px", marginBottom: "6px", display: "block" }}>
                  SELECT OPERATIVE DISCIPLINE:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                  {roleKeys.map(rk => {
                    const role = ROLES[rk];
                    const isSel = onlineSelectedRole === rk;
                    return (
                      <div
                        key={rk}
                        onClick={() => { sounds.btnClick(); setOnlineSelectedRole(rk); }}
                        style={{
                          background: isSel ? "rgba(56, 189, 248, 0.2)" : "rgba(15, 23, 42, 0.7)",
                          border: isSel ? "2px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "8px",
                          padding: "10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <img src={role.avatar} alt={role.name} style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: 800, color: isSel ? "#38BDF8" : "#FFF" }}>
                            {role.name}
                          </div>
                          <div style={{ fontSize: "0.64rem", color: "#64748B" }}>
                            {role.passive.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {onlineSubMode === "join" && (
                <div>
                  <label style={{ fontSize: "0.74rem", color: "#94A3B8", fontWeight: 800, letterSpacing: "1px" }}>
                    ANOMALY ROOM CODE:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. KY72P"
                    value={onlineRoomCodeInput}
                    style={{
                      width: "100%",
                      letterSpacing: "4px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      fontSize: "1.1rem",
                      marginTop: "4px",
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      color: "#FFF"
                    }}
                    onChange={(e) => setOnlineRoomCodeInput(e.target.value.toUpperCase())}
                  />
                </div>
              )}

              {/* Supabase Status Banner */}
              <div
                style={{
                  padding: "10px 14px",
                  background: hasSupabase ? "rgba(16, 185, 129, 0.12)" : "rgba(56, 189, 248, 0.1)",
                  border: `1px solid ${hasSupabase ? "rgba(16, 185, 129, 0.35)" : "rgba(56, 189, 248, 0.3)"}`,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.1rem" }}>{hasSupabase ? "⚡" : "☁️"}</span>
                  <div style={{ fontSize: "0.74rem", lineHeight: "1.3" }}>
                    <strong style={{ color: hasSupabase ? "#34D399" : "#60A5FA" }}>
                      {hasSupabase ? "Supabase Realtime Relay Active": "WebSocket Relay Channel"}:
                    </strong>{" "}
                    <span style={{ color: "#94A3B8" }}>
                      {hasSupabase
                        ? "Zero cold starts, instant peer synchronization, and automatic presence."
                        : "Using WebSocket server. Enter your Supabase credentials in settings for instant serverless play."}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                  onClick={onOpenSupabaseConfig}
                >
                  ⚙️ Settings
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <button className="btn btn-secondary" onClick={onBack} style={{ padding: "10px 20px", fontSize: "0.82rem" }}>
                  ← Return
                </button>
                <button
                  className="btn btn-primary"
                  disabled={isConnectingOnline}
                  onClick={() => onConnectOnline(onlineSubMode)}
                  style={{ padding: "10px 24px", fontSize: "0.88rem", fontWeight: 800 }}
                >
                  {isConnectingOnline ? "🔄 Synchronizing Relay...": (onlineSubMode === "create" ? "🚀 Host Room" : "🚪 Enter Room")}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Room Code Badge */}
                  <div style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    borderRadius: "8px",
                    padding: "16px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "0.72rem", color: "#94A3B8", fontWeight: 800, letterSpacing: "1px" }}>
                      ANOMALY SYNC CODE
                    </div>
                    <div style={{
                      fontSize: "2.2rem",
                      letterSpacing: "6px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 900,
                      color: "#38BDF8",
                      margin: "4px 0"
                    }}>
                      {network.roomCode}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                      Transmit this frequency code to up to 3 crew members
                    </div>
                  </div>

                  {/* Connected Operatives List */}
                  <div>
                    <div style={{ fontSize: "0.76rem", color: "#F59E0B", fontWeight: 800, marginBottom: "8px" }}>
                      SYNCHRONIZED OPERATIVES ({currentRoomPlayers.length} / 4)
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {currentRoomPlayers.map((p, idx) => (
                        <div
                          key={p.id ?? idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            background: "rgba(15, 23, 42, 0.6)",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.08)"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34D399", display: "inline-block" }}></span>
                            <span style={{ fontWeight: 800, fontSize: "0.84rem", color: PLAYER_COLORS[idx] || "#FFF" }}>
                              {p.name}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#F59E0B", fontWeight: 700 }}>
                            {ROLES[p.roleKey]?.name || p.roleKey} {p.isHost || p.id === 0 ? "★ Host" : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <ChatBox
                    boxId="lobby-chat"
                    isFloating={false}
                    messages={network.chatMessages}
                    onSendMessage={(text) => network.sendChatMessage(text)}
                    myPlayerId={network.playerId}
                    myPlayerName={onlinePlayerName}
                    isOnline={true}
                  />
                </div>
              </div>

              {/* Waiting Room Action Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <button className="btn btn-secondary" onClick={onLeaveRoom} style={{ padding: "10px 20px", fontSize: "0.82rem" }}>
                  Leave Anomaly Room
                </button>

                {network.isHost ? (
                  <button
                    className="btn btn-primary"
                    disabled={currentRoomPlayers.length < 1}
                    onClick={onStartOnline}
                    style={{ padding: "10px 24px", fontSize: "0.88rem", fontWeight: 800 }}
                  >
                    🚀 INITIATE CHRONO SHIFT ({currentRoomPlayers.length}) ➔
                  </button>
                ) : (
                  <div style={{ fontSize: "0.78rem", color: "#94A3B8", fontStyle: "italic" }}>
                    Waiting for expedition host to initiate Chrono Shift...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
