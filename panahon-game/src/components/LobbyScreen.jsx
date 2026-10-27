import React, { useState, useEffect } from "react";
import sounds from "../sound.js";
import { ROLES, ROLE_ORDER, PLAYER_COLORS } from "../gameData.js";
import ChatBox from "./ChatBox.jsx";
import { isSupabaseAvailable } from "../supabaseClient.js";
import { getSavedProfile, savePlayerProfile } from "../sessionManager.js";

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
  spectators = [],
  isSpectator = false,
  canSpectatePrompt = null,
  isConnectingOnline,
  onStartLocal,
  onStartSpectatorSimulation,
  onConnectOnline,
  onSpectateOnline,
  onAcceptCanSpectate,
  onDismissCanSpectatePrompt,
  onLeaveRoom,
  onStartOnline,
  onBack,
}) {
  const [onlineSubMode, setOnlineSubMode] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return (p.has("room") || p.has("join")) ? "join" : "create";
    } catch {
      return "create";
    }
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [sharedLink, setSharedLink] = useState(false);

  const getInviteUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("room", network.roomCode || "");
      url.searchParams.set("mode", "online");
      return url.toString();
    } catch {
      return `${window.location.origin}${window.location.pathname}?room=${network.roomCode || ""}&mode=online`;
    }
  };

  const handleCopyCode = async () => {
    sounds.btnClick();
    if (!network?.roomCode) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(network.roomCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = network.roomCode;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2400);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }
  };

  const handleShare = async () => {
    sounds.btnClick();
    if (!network?.roomCode) return;
    const inviteUrl = getInviteUrl();
    const shareText = `⚡ Join my PANAHON: Chrono Shift expedition!\nFrequency Code: ${network.roomCode}\n${inviteUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "PANAHON: Chrono Shift Expedition",
          text: ` Join my PANAHON expedition room: ${network.roomCode}`,
          url: inviteUrl
        });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setSharedLink(true);
      setTimeout(() => setSharedLink(false), 2400);
    } catch (err) {
      console.warn("Share fallback copy failed:", err);
    }
  };
  const roleKeys = ROLE_ORDER;
  const validRoomPlayers = (currentRoomPlayers || []).filter(p => p && !p.isSpectator && p.roleKey !== 'SPECTATOR');
  const isRoomActive = network.roomCode !== null;
  const hasSupabase = isSupabaseAvailable();

  // Presets
  const applyPreset1v3 = () => {
    sounds.btnClick();
    const prof = getSavedProfile();
    setLocalPlayers([
      { name: prof.name, roleKey: prof.roleKey, type: "human", difficulty: "normal" },
      { name: "Bot Explorer", roleKey: "EXPLORER", type: "ai", difficulty: "normal" },
      { name: "Bot Guardian", roleKey: "GUARDIAN", type: "ai", difficulty: "normal" },
      { name: "Bot Strategist", roleKey: "STRATEGIST", type: "ai", difficulty: "normal" }
    ]);
  };

  const applyPreset2v2 = () => {
    sounds.btnClick();
    const prof = getSavedProfile();
    setLocalPlayers([
      { name: prof.name, roleKey: prof.roleKey, type: "human", difficulty: "normal" },
      { name: "Player 2", roleKey: "EXPLORER", type: "human", difficulty: "normal" },
      { name: "Bot Guardian", roleKey: "GUARDIAN", type: "ai", difficulty: "normal" },
      { name: "Bot Strategist", roleKey: "STRATEGIST", type: "ai", difficulty: "normal" }
    ]);
  };

  const applyPreset4Human = () => {
    sounds.btnClick();
    const prof = getSavedProfile();
    setLocalPlayers([
      { name: prof.name, roleKey: prof.roleKey, type: "human", difficulty: "normal" },
      { name: "Player 2", roleKey: "EXPLORER", type: "human", difficulty: "normal" },
      { name: "Player 3", roleKey: "GUARDIAN", type: "human", difficulty: "normal" },
      { name: "Player 4", roleKey: "STRATEGIST", type: "human", difficulty: "normal" }
    ]);
  };

  const applyPresetSpectator = () => {
    sounds.btnClick();
    setLocalPlayers([
      { name: "Bot Historian", roleKey: "HISTORIAN", type: "ai", difficulty: "normal" },
      { name: "Bot Explorer", roleKey: "EXPLORER", type: "ai", difficulty: "normal" },
      { name: "Bot Guardian", roleKey: "GUARDIAN", type: "ai", difficulty: "normal" },
      { name: "Bot Strategist", roleKey: "STRATEGIST", type: "ai", difficulty: "normal" }
    ]);
  };

  const applyPresetRogueChrono = () => {
    sounds.btnClick();
    const prof = getSavedProfile();
    setLocalPlayers([
      { name: prof.name, roleKey: prof.roleKey, type: "human", difficulty: "normal" },
      { name: "Bot Rogue", roleKey: "ROGUE", type: "ai", difficulty: "normal" },
      { name: "Bot Chronomancer", roleKey: "CHRONOMANCER", type: "ai", difficulty: "normal" },
      { name: "Bot Explorer", roleKey: "EXPLORER", type: "ai", difficulty: "normal" }
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
    if (patch.roleKey && patch.roleKey !== updated[idx].roleKey) {
      const oldRole = updated[idx].roleKey;
      const targetRole = patch.roleKey;
      // If another active slot already has this role, swap them so all characters remain strictly unique!
      const conflictIdx = updated.findIndex((p, i) => i !== idx && p.type !== "closed" && p.roleKey === targetRole);
      if (conflictIdx !== -1) {
        updated[conflictIdx] = { ...updated[conflictIdx], roleKey: oldRole };
      }
    }
    if (patch.type && patch.type !== "closed" && updated[idx].type === "closed") {
      // Opening a slot: assign an unused role so no duplicate exists
      const usedRoles = new Set(updated.filter((p, i) => i !== idx && p.type !== "closed").map(p => p.roleKey));
      const availableRole = ROLE_ORDER.find(rk => !usedRoles.has(rk)) || ROLE_ORDER[idx % ROLE_ORDER.length];
      patch.roleKey = availableRole;
    }
    updated[idx] = { ...updated[idx], ...patch };
    if (idx === 0 && updated[0].type === "human") {
      if (patch.name !== undefined || patch.roleKey !== undefined) {
        savePlayerProfile(updated[0].name, updated[0].roleKey);
      }
    }
    setLocalPlayers(updated);
  };

  const activeSlots = localPlayers.filter(p => p.type !== "closed");

  // Ensure Slot 1 and Online Multiplayer reflect the saved profile callsign and role
  useEffect(() => {
    const prof = getSavedProfile();
    // 1. Sync Slot 1
    if (localPlayers && localPlayers.length > 0) {
      const slot0 = localPlayers[0];
      const name = (slot0?.name || "").trim();
      const needsNameSync = !name || name === "Player 1";
      const needsRoleSync = !slot0?.roleKey;
      if (needsNameSync || needsRoleSync) {
        const updated = [...localPlayers];
        updated[0] = {
          ...updated[0],
          name: needsNameSync ? prof.name : slot0.name,
          roleKey: needsRoleSync ? prof.roleKey : slot0.roleKey
        };
        setLocalPlayers(updated);
      }
    }
    // 2. Sync Online Name and Role
    if (prof.name && (!onlinePlayerName || onlinePlayerName === "Temporal Castaway" || onlinePlayerName === "Operative One" || onlinePlayerName !== prof.name)) {
      setOnlinePlayerName(prof.name);
    }
    if (prof.roleKey && (!onlineSelectedRole || onlineSelectedRole !== prof.roleKey)) {
      setOnlineSelectedRole(prof.roleKey);
    }
  }, [lobbyMode, setOnlinePlayerName, setOnlineSelectedRole]);

  // Listen to live profile updates
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const { name, roleKey } = e.detail || {};
      if (name) {
        setOnlinePlayerName(name);
        setLocalPlayers((prev) => {
          if (!prev || prev.length === 0) return prev;
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            name: name
          };
          return updated;
        });
      }
      if (roleKey) {
        setOnlineSelectedRole(roleKey);
        setLocalPlayers((prev) => {
          if (!prev || prev.length === 0) return prev;
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            roleKey: roleKey
          };
          return updated;
        });
      }
    };
    window.addEventListener("panahon_profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("panahon_profile_updated", handleProfileUpdate);
  }, [setLocalPlayers, setOnlinePlayerName, setOnlineSelectedRole]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation?.();
        sounds?.btnClick?.();
        if (isRoomActive) {
          onLeaveRoom();
        } else if (typeof onBack === "function") {
          onBack();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onBack, onLeaveRoom, isRoomActive]);


  return (
    <div
      className="modal-overlay lobby-modal-overlay"
      style={{
        zIndex: 12000,
        backgroundColor: "rgba(10, 8, 6, 0.88)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        inset: 0,
        padding: "16px",
        overflowX: "auto",
        overflowY: "auto",
        boxSizing: "border-box"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRoomActive) {
          sounds.btnClick();
          onBack();
        }
      }}
    >
      <div
        className="modal duelyst-modal lobby-modal-container"
        style={{
          maxWidth: isRoomActive ? "960px" : "840px",
          width: "min(96%, 960px)",
          maxHeight: "92vh",
          margin: "auto",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "#28201A",
          border: "3px solid #C2974D",
          outline: "2px solid #140E0A",
          boxShadow: "inset 2px 2px 0 #EBC669, inset -2px -2px 0 #7A5823, 0 20px 60px rgba(0, 0, 0, 0.95)",
          borderRadius: "6px",
          padding: "20px 24px",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", paddingBottom: "12px", borderBottom: "2px solid #5A422D" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "4px",
              background: "#32261D",
              border: "2px solid #C2974D",
              boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem"
            }}>
              {lobbyMode === "online" ? "🌐" : "⚔️"}
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: "1.25rem",
                fontFamily: "var(--font-display)",
                letterSpacing: "2px",
                color: "#F8FAFC"
              }}>
                CHRONO EXPEDITION STAGING
              </h2>
              <div style={{ fontSize: "0.74rem", color: "#C8B293", marginTop: "2px" }}>
                Operative Cadre Configuration & Spacetime Timeline Synchronization
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="button"
              onClick={isRoomActive ? handleCopyCode : undefined}
              title={isRoomActive ? "Click to copy room code" : undefined}
              style={{
                fontSize: "0.68rem",
                color: copiedCode ? "#34D399" : "#FFD700",
                background: "linear-gradient(180deg, #38281A 0%, #1F150C 100%)",
                padding: "6px 14px",
                borderRadius: "3px",
                border: copiedCode ? "1.5px solid #34D399" : "1.5px solid #C2974D",
                boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #120C06, 0 2px 3px rgba(0,0,0,0.6)",
                fontFamily: "var(--font-display)",
                letterSpacing: "1px",
                textShadow: "1px 1px 0 #000",
                whiteSpace: "nowrap",
                cursor: isRoomActive ? "pointer" : "default",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease"
              }}
            >
              <span>{isRoomActive ? (copiedCode ? "✓ COPIED" : `ROOM: ${network.roomCode}`) : (lobbyMode === "online" ? "ONLINE MULTIPLAYER" : `${activeSlots.length} OPERATIVES`)}</span>
              {isRoomActive && !copiedCode && <span style={{ opacity: 0.85, fontSize: "0.75rem" }}>📋</span>}
            </button>
            <button
              className="modal-close"
              onClick={() => {
                sounds.btnClick();
                if (isRoomActive) {
                  onLeaveRoom();
                } else {
                  onBack();
                }
              }}
              style={{ position: "static" }}
              title={isRoomActive ? "Leave Room" : "Close Staging [ESC]"}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Mode Switcher Tabs (Only shown when not in an active room) */}
        {!isRoomActive && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "14px",
              width: "100%"
            }}
          >
            <button
              onClick={() => { sounds.btnClick(); setLobbyMode("local"); }}
              style={{
                flex: 1,
                padding: "9px 16px",
                background: lobbyMode === "local" ? "linear-gradient(180deg, #6B491E 0%, #462E10 100%)" : "linear-gradient(180deg, #3A2C21 0%, #251B14 100%)",
                border: lobbyMode === "local" ? "2px solid #C2974D" : "2px solid #5A422D",
                boxShadow: lobbyMode === "local"
                  ? "inset 1px 1px 0 #FFD700, inset -1px -1px 0 #1E1204, 0 2px 0 #0D0906"
                  : "inset 1px 1px 0 #6E5239, inset -1px -1px 0 #140E0A, 0 2px 0 #0D0906",
                borderRadius: "3px",
                color: lobbyMode === "local" ? "#FFD700" : "#C8B293",
                fontFamily: "var(--font-display)",
                fontSize: "0.76rem",
                fontWeight: 800,
                letterSpacing: "1px",
                textShadow: "1px 1px 0 #000",
                cursor: "pointer",
                transition: "all 0.12s ease"
              }}
            >
              ⚔️ LOCAL EXPEDITION
            </button>

            <button
              onClick={() => { sounds.btnClick(); setLobbyMode("online"); }}
              style={{
                flex: 1,
                padding: "9px 16px",
                background: lobbyMode === "online" ? "linear-gradient(180deg, #6B491E 0%, #462E10 100%)" : "linear-gradient(180deg, #3A2C21 0%, #251B14 100%)",
                border: lobbyMode === "online" ? "2px solid #C2974D" : "2px solid #5A422D",
                boxShadow: lobbyMode === "online"
                  ? "inset 1px 1px 0 #FFD700, inset -1px -1px 0 #1E1204, 0 2px 0 #0D0906"
                  : "inset 1px 1px 0 #6E5239, inset -1px -1px 0 #140E0A, 0 2px 0 #0D0906",
                borderRadius: "3px",
                color: lobbyMode === "online" ? "#FFD700" : "#C8B293",
                fontFamily: "var(--font-display)",
                fontSize: "0.76rem",
                fontWeight: 800,
                letterSpacing: "1px",
                textShadow: "1px 1px 0 #000",
                cursor: "pointer",
                transition: "all 0.12s ease"
              }}
            >
              🌐 ONLINE MULTIPLAYER
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "6px", minHeight: 0 }}>
          {lobbyMode === "local" ? (
            <div
              className="lobby-dossier-card"
              style={{
                background: "transparent",
                border: "none",
                boxShadow: "none",
                padding: "0",
                width: "100%"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", background: "#32261D", border: "2px solid #C2974D", boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16", borderRadius: "4px", padding: "4px 14px", fontFamily: "var(--font-display)", fontSize: "0.78rem", color: "#FCD34D", letterSpacing: "1px" }}>
                  OPERATIVE CADRE DOSSIER
                </div>
                <div style={{ fontSize: "0.68rem", color: "#FFD700", fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  {activeSlots.length} / 4 OPERATIVES READY
                </div>
              </div>

              <p className="lobby-dossier-desc" style={{ fontSize: "0.75rem", color: "#C4B39E", lineHeight: 1.5, margin: "0 0 14px" }}>
                Configure each slot as <strong>👤 Human Operative</strong>, <strong>🤖 AI Construct</strong>, or <strong>🚫 Deactivated</strong>. Assign roles and calibrate AI parameters:
              </p>

              {/* Tactical Preset Bar */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {[
                  { label: "⚔️ Solo (1 Human + 3 AI)", fn: applyPreset1v3 },
                  { label: "🗡️ Rogue & Chronomancer", fn: applyPresetRogueChrono },
                  { label: "🤝 Dual Strike (2H + 2 AI)", fn: applyPreset2v2 },
                  { label: "👥 Full Cadre (4 Humans)", fn: applyPreset4Human },
                  { label: "👁️ Spectator Sim (AI Bots)", fn: applyPresetSpectator },
                  { label: "🎲 Rebalance Roles", fn: applyPresetRandom }
                ].map((p, i) => (
                  <button
                    key={i}
                    onClick={p.fn}
                    style={{
                      background: "#3A2C21",
                      border: "2px solid #C2974D",
                      borderRadius: "4px",
                      boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A",
                      color: "#FEF3C7",
                      padding: "7px 14px",
                      fontSize: "0.65rem",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FFD700"; e.currentTarget.style.background = "#473629"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#8C672B"; e.currentTarget.style.background = "#382C22"; }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Slot Cards List */}
              <div className="lobby-slots-list" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
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
                          background: "#16100C",
                          border: "2px dashed #4A382C",
                          borderRadius: "6px",
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
                            background: "#140E0A",
                            color: "#F5EEDC",
                            border: "1.5px solid #5A422D",
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
                        background: "#1C1510",
                        border: "2px solid #3D2F23",
                        borderLeft: `6px solid ${color}`,
                        boxShadow: "inset 2px 2px 0 #0F0A07, inset -1px -1px 0 #4A3A2C",
                        borderRadius: "6px",
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
                              fontSize: "0.58rem",
                              fontWeight: 800,
                              fontFamily: "var(--font-display)",
                              background: isAi ? "#261D16" : "#2D2218",
                              color: isAi ? "#D4A559" : "#FCD34D",
                              border: "1.5px solid #8C672B",
                              boxShadow: "inset 1px 1px 0 #5C3E16, 0 1px 0 #000",
                              padding: "3px 8px",
                              borderRadius: "3px"
                            }}>
                              {isAi ? "🤖 CPU BOT" : (idx === 0 ? "👤 OPERATIVE" : "👤 PLAYER")}
                            </span>
                          </div>

                          <select
                            style={{
                              background: "#3A2C21",
                              color: "#FEF3C7",
                              border: "2px solid #C2974D",
                              boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A",
                              borderRadius: "4px",
                              padding: "5px 10px",
                              fontSize: "0.68rem",
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              outline: "none",
                              cursor: "pointer"
                            }}
                            value={player.type}
                            onChange={(e) => updateSlot(idx, { type: e.target.value })}
                          >
                            <option value="human">👤 Human Player</option>
                            <option value="ai">🤖 CPU Bot</option>
                            <option value="closed">🚫 Closed Slot</option>
                          </select>
                        </div>

                        {/* Inputs Row */}
                        <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                          <input
                            type="text"
                            value={player.name}
                            placeholder={isAi ? "AI Construct Name" : (idx === 0 ? "Operative Callsign" : "Operative Name")}
                            style={{
                              flex: 1,
                              background: "#140E0A",
                              border: "1.5px solid #5A422D",
                              borderRadius: "4px",
                              padding: "5px 8px",
                              fontSize: "0.78rem",
                              color: "#F5EEDC",
                              outline: "none"
                            }}
                            onChange={(e) => updateSlot(idx, { name: e.target.value })}
                          />

                          {isAi && (
                            <select
                              style={{
                                background: "#3A2C21",
                                color: "#FEF3C7",
                                border: "2px solid #C2974D",
                                boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A",
                                borderRadius: "4px",
                                padding: "5px 10px",
                                fontSize: "0.68rem",
                                fontFamily: "var(--font-display)",
                                fontWeight: 700,
                                outline: "none",
                                cursor: "pointer"
                              }}
                              value={player.difficulty || "normal"}
                              onChange={(e) => updateSlot(idx, { difficulty: e.target.value })}
                            >
                              <option value="easy">🟢 Novice AI</option>
                              <option value="normal">🔵 Standard AI</option>
                              <option value="hard">🔴 Master AI</option>
                            </select>
                          )}

                          <select
                            style={{
                              background: "#3A2C21",
                              color: "#FFD700",
                              border: "2px solid #C2974D",
                              boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A",
                              borderRadius: "4px",
                              padding: "5px 10px",
                              fontSize: "0.68rem",
                              fontFamily: "var(--font-display)",
                              fontWeight: 700,
                              outline: "none",
                              cursor: "pointer"
                            }}
                            value={player.roleKey}
                            onChange={(e) => updateSlot(idx, { roleKey: e.target.value })}
                          >
                            {roleKeys.map(rk => {
                              const conflictSlot = localPlayers.find((p, i) => i !== idx && p.type !== "closed" && p.roleKey === rk);
                              return (
                                <option key={rk} value={rk}>
                                  {ROLES[rk].name} {conflictSlot ? `(Swap with ${conflictSlot.name || `P${localPlayers.indexOf(conflictSlot) + 1}`})` : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div style={{ fontSize: "0.72rem", color: "#C4B39E", fontFamily: "var(--font-body)" }}>
                          <strong style={{ color: "#FCD34D" }}>Passive:</strong> {role.passive.name} ({role.passive.description}) &bull; <strong style={{ color: "#67E8F9" }}>Active:</strong> {role.active.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "2px solid #5A422D" }}>
                <button
                  className="btn btn-secondary"
                  onClick={onBack}
                  style={{ padding: "10px 20px", fontSize: "0.82rem" }}
                >
                  ← Return to Headquarters
                </button>

                {activeSlots.length > 0 && activeSlots.every(p => p.type === 'ai') ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => onStartLocal(undefined, true)}
                    style={{
                      padding: "10px 24px",
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      letterSpacing: "1px",
                      background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
                      boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)",
                      border: "1px solid #C084FC"
                    }}
                  >
                    👁️ SPECTATE AI EXPEDITION ({activeSlots.length} BOTS) ➔
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={activeSlots.length === 0}
                    onClick={() => onStartLocal()}
                    style={{
                      padding: "10px 24px",
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      letterSpacing: "1px"
                    }}
                  >
                    🚀 INITIATE EXPEDITION ({activeSlots.length}) ➔
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div
              className="lobby-dossier-card"
              style={{
                background: "transparent",
                border: "none",
                boxShadow: "none",
                padding: "0",
                width: "100%"
              }}
            >
              {canSpectatePrompt && (
                <div style={{
                  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(56, 189, 248, 0.2))",
                  border: "1.5px solid #A855F7",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  boxShadow: "0 0 25px rgba(168, 85, 247, 0.3)"
                }}>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#E9D5FF", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>👁️</span> Live Match Available to Spectate
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#CBD5E1", marginTop: "2px" }}>
                      {canSpectatePrompt.message || "This match is ongoing or full. You can join the observatory deck to watch!"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn"
                      onClick={onAcceptCanSpectate}
                      style={{
                        background: "linear-gradient(135deg, #A855F7, #6366F1)",
                        color: "#FFF",
                        fontWeight: 800,
                        fontSize: "0.8rem",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      👁️ Watch Match
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={onDismissCanSpectatePrompt}
                      style={{ padding: "8px 12px", fontSize: "0.76rem" }}
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                </div>
              )}

              {!isRoomActive && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <button
                    onClick={() => { sounds.btnClick(); setOnlineSubMode("create"); }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: onlineSubMode === "create" ? "#382C22" : "#221913",
                      border: onlineSubMode === "create" ? "2px solid #FFD700" : "1.5px solid #5A422D",
                      boxShadow: onlineSubMode === "create" ? "inset 1px 1px 0 #EBD07D, 0 0 10px rgba(255, 215, 0, 0.3)" : "inset 1px 1px 0 #3D2F23",
                      borderRadius: "4px",
                      color: onlineSubMode === "create" ? "#FFD700" : "#A89885",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    🚀 HOST ROOM
                  </button>
                  <button
                    onClick={() => { sounds.btnClick(); setOnlineSubMode("join"); }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: onlineSubMode === "join" ? "#382C22" : "#221913",
                      border: onlineSubMode === "join" ? "2px solid #FFD700" : "1.5px solid #5A422D",
                      boxShadow: onlineSubMode === "join" ? "inset 1px 1px 0 #EBD07D, 0 0 10px rgba(255, 215, 0, 0.3)" : "inset 1px 1px 0 #3D2F23",
                      borderRadius: "4px",
                      color: onlineSubMode === "join" ? "#FFD700" : "#A89885",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    🚪 JOIN AS PLAYER
                  </button>
                  <button
                    onClick={() => { sounds.btnClick(); setOnlineSubMode("spectate"); }}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: onlineSubMode === "spectate" ? "#382C22" : "#221913",
                      border: onlineSubMode === "spectate" ? "2px solid #FFD700" : "1.5px solid #5A422D",
                      boxShadow: onlineSubMode === "spectate" ? "inset 1px 1px 0 #EBD07D, 0 0 10px rgba(255, 215, 0, 0.3)" : "inset 1px 1px 0 #3D2F23",
                      borderRadius: "4px",
                      color: onlineSubMode === "spectate" ? "#FFD700" : "#A89885",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    👁️ SPECTATE MATCH
                  </button>
                </div>
              )}

              {!isRoomActive ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>
                  <div>
                    <label style={{ fontSize: "0.72rem", color: "#D4A559", fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "1px", textShadow: "1px 1px 0 #000" }}>
                      OPERATIVE CALLSIGN:
                    </label>
                    <input
                      type="text"
                      className="player-name-input"
                      value={onlinePlayerName || getSavedProfile().name}
                      style={{
                        width: "100%",
                        marginTop: "4px",
                        background: "#140E0A",
                        border: "2px solid #5A422D",
                        boxShadow: "inset 1px 1px 0 #0F0A07",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        color: "#FEF3C7",
                        fontSize: "0.88rem",
                        outline: "none"
                      }}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setOnlinePlayerName(newName);
                        savePlayerProfile(newName, onlineSelectedRole);
                      }}
                      placeholder="Enter your operative callsign"
                    />
                  </div>

                  {/* Role Selection Grid (Only if creating or joining as player) */}
                  {onlineSubMode !== "spectate" && (
                    <div>
                      <label style={{ fontSize: "0.72rem", color: "#D4A559", fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "1px", marginBottom: "6px", display: "block", textShadow: "1px 1px 0 #000" }}>
                        SELECT OPERATIVE DISCIPLINE:
                      </label>
                      <div className="lobby-discipline-grid">
                        {roleKeys.map(rk => {
                          const role = ROLES[rk];
                          const isSel = onlineSelectedRole === rk;
                          const takenBy = validRoomPlayers?.find(p => p.roleKey === rk && p.name !== onlinePlayerName);
                          const isTaken = Boolean(takenBy);

                          return (
                            <div
                              key={rk}
                              onClick={() => {
                                if (isTaken) {
                                  sounds.danger?.();
                                  return;
                                }
                                sounds.btnClick();
                                setOnlineSelectedRole(rk);
                                savePlayerProfile(onlinePlayerName, rk);
                              }}
                              style={{
                                background: isTaken ? "#150E0A" : (isSel ? "#382C22" : "#1C1510"),
                                border: isTaken ? "1.5px dashed #4A281E" : (isSel ? "2px solid #FFD700" : "1.5px solid #3D2F23"),
                                boxShadow: isSel ? "inset 1px 1px 0 #EBD07D, 0 0 12px rgba(255, 215, 0, 0.4)" : "inset 1px 1px 0 #0F0A07",
                                borderRadius: "6px",
                                padding: "9px 12px",
                                cursor: isTaken ? "not-allowed" : "pointer",
                                opacity: isTaken ? 0.45 : 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                minWidth: 0,
                                transition: "all 0.15s ease",
                                position: "relative"
                              }}
                              title={isTaken ? `Character already selected by ${takenBy.name}` : undefined}
                            >
                              <img
                                src={role.avatar}
                                alt={role.name}
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "4px",
                                  objectFit: "cover",
                                  border: isSel ? "1.5px solid #FFD700" : "1.5px solid #5A422D",
                                  imageRendering: "pixelated",
                                  flexShrink: 0,
                                  filter: isTaken ? "grayscale(90%)" : "none"
                                }}
                              />
                              <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{
                                  fontSize: "0.76rem",
                                  fontWeight: 800,
                                  fontFamily: "var(--font-display)",
                                  color: isTaken ? "#8C7764" : (isSel ? "#FFD700" : "#F5EEDC"),
                                  letterSpacing: "0.5px",
                                  lineHeight: 1.25,
                                  whiteSpace: "nowrap"
                                }}>
                                  {role.name}
                                </div>
                                <div style={{
                                  fontSize: "0.64rem",
                                  color: isTaken ? "#EF4444" : (isSel ? "#FCD34D" : "#94A3B8"),
                                  fontWeight: isTaken ? 700 : 400,
                                  marginTop: "2px",
                                  lineHeight: 1.2,
                                  whiteSpace: "nowrap"
                                }}>
                                  {isTaken ? `🔒 Taken by ${takenBy.name}` : (role.passive?.name || "Active Ability")}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {onlineSubMode === "spectate" && (
                    <div style={{
                      background: "rgba(168, 85, 247, 0.1)",
                      border: "1px dashed rgba(168, 85, 247, 0.4)",
                      borderRadius: "8px",
                      padding: "12px 14px"
                    }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#D8B4FE", marginBottom: "4px" }}>
                        👁️ CHRONOS OBSERVATORY SUITE
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#94A3B8", lineHeight: 1.45 }}>
                        Enter the Room Code of an ongoing match or staging lobby. As an observer, you can watch player movements, track clue discoveries and anomalies, view secret cards, and communicate in timeline comms.
                      </div>
                    </div>
                  )}

                  {(onlineSubMode === "join" || onlineSubMode === "spectate") && (
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
                          background: "#140E0A", border: "1.5px solid #5A422D",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          color: "#FFF"
                        }}
                        onChange={(e) => setOnlineRoomCodeInput(e.target.value.toUpperCase())}
                      />
                    </div>
                  )}

                  {/* Network Relay Status Indicator */}
                  <div
                    style={{
                      padding: "8px 14px",
                      background: hasSupabase ? "rgba(16, 185, 129, 0.1)" : "rgba(56, 189, 248, 0.1)",
                      border: `1px solid ${hasSupabase ? "rgba(16, 185, 129, 0.3)" : "rgba(56, 189, 248, 0.25)"}`,
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{hasSupabase ? "⚡" : "☁️"}</span>
                    <div style={{ fontSize: "0.74rem", lineHeight: "1.3" }}>
                      <strong style={{ color: hasSupabase ? "#34D399" : "#60A5FA" }}>
                        {hasSupabase ? "Supabase Realtime Relay Active" : "WebSocket Relay Channel Active"}
                      </strong> &bull;{" "}
                      <span style={{ color: "#94A3B8" }}>
                        {hasSupabase
                          ? "Zero cold starts, instant peer synchronization (Configured in config.js / .env)."
                          : "Using WebSocket relay server."}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "2px solid #5A422D" }}>
                    <button className="btn btn-secondary" onClick={onBack} style={{ padding: "10px 20px", fontSize: "0.82rem" }}>
                      ← Return
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={isConnectingOnline}
                      onClick={() => {
                        if (onlineSubMode === "spectate") {
                          onSpectateOnline(onlineRoomCodeInput, onlinePlayerName);
                        } else {
                          onConnectOnline(onlineSubMode);
                        }
                      }}
                      style={{
                        padding: "10px 24px",
                        fontSize: "0.88rem",
                        fontWeight: 800,
                        background: onlineSubMode === "spectate" ? "linear-gradient(135deg, #A855F7, #6366F1)" : undefined,
                        borderColor: onlineSubMode === "spectate" ? "#C084FC" : undefined
                      }}
                    >
                      {isConnectingOnline
                        ? "🔄 Synchronizing Relay..."
                        : (onlineSubMode === "create"
                          ? "🚀 Host Room"
                          : (onlineSubMode === "spectate" ? "👁️ Enter Observatory" : "🚪 Enter Room"))}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="lobby-staging-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "16px", marginBottom: "16px", minWidth: 0, width: "100%" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>
                      {/* Room Code Badge */}
                      <div style={{
                        background: "#1C1510",
                        border: "2px solid #C2974D",
                        boxShadow: "inset 2px 2px 0 #0F0A07, inset -1px -1px 0 #4A3A2C",
                        borderRadius: "6px",
                        padding: "16px 18px",
                        textAlign: "center"
                      }}>
                        <div style={{ fontSize: "0.68rem", color: "#FCD34D", fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "1px" }}>
                          ANOMALY SYNC CODE
                        </div>

                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          margin: "8px 0"
                        }}>
                          <div
                            onClick={handleCopyCode}
                            title="Click to copy anomaly sync code"
                            style={{
                              fontSize: "2.1rem",
                              letterSpacing: "6px",
                              fontFamily: "var(--font-display)",
                              fontWeight: 900,
                              color: "#FFD700",
                              textShadow: "2px 2px 0 #120E0A, 0 0 15px rgba(255, 215, 0, 0.45)",
                              cursor: "pointer",
                              padding: "3px 14px",
                              borderRadius: "4px",
                              background: "rgba(0, 0, 0, 0.35)",
                              border: "1.5px dashed rgba(194, 151, 77, 0.5)",
                              userSelect: "all",
                              display: "inline-flex",
                              alignItems: "center",
                              transition: "all 0.15s ease"
                            }}
                          >
                            {network.roomCode}
                          </div>

                          <button
                            type="button"
                            onClick={handleShare}
                            title="Forward room invite link and code to friends"
                            style={{
                              padding: "6px 16px",
                              fontSize: "0.72rem",
                              fontFamily: "var(--font-display)",
                              fontWeight: 800,
                              letterSpacing: "1px",
                              background: sharedLink
                                ? "linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%)"
                                : "linear-gradient(180deg, #6B21A8 0%, #3B0764 100%)",
                              border: sharedLink ? "1.5px solid #38BDF8" : "1.5px solid #C084FC",
                              color: "#FFFFFF",
                              boxShadow: sharedLink
                                ? "0 0 10px rgba(14, 165, 233, 0.6), inset 1px 1px 0 rgba(255,255,255,0.4)"
                                : "inset 1px 1px 0 #E9D5FF, inset -1px -1px 0 #1E0538, 0 2px 4px rgba(0,0,0,0.5)",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <span style={{ fontSize: "0.82rem" }}>{sharedLink ? "✓" : "📤"}</span>
                            <span>{sharedLink ? "LINK COPIED!" : "FORWARD TO FRIENDS"}</span>
                          </button>
                        </div>

                        <div style={{
                          fontSize: "0.72rem",
                          marginTop: "6px",
                          color: copiedCode ? "#34D399" : (sharedLink ? "#38BDF8" : "#94A3B8"),
                          fontWeight: (copiedCode || sharedLink) ? 700 : 400,
                          transition: "all 0.2s ease"
                        }}>
                          {copiedCode
                            ? `✓ Frequency code ${network.roomCode} copied to clipboard!`
                            : (sharedLink
                              ? "✓ Expedition invite link copied! Forward it to friends."
                              : "Transmit this frequency code to up to 3 crew members")}
                        </div>
                      </div>

                      {isSpectator && (
                        <div style={{
                          background: "rgba(168, 85, 247, 0.15)",
                          border: "1px solid rgba(168, 85, 247, 0.5)",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          fontSize: "0.78rem",
                          color: "#E9D5FF",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <span>👁️</span> SPECTATOR MODE ACTIVE &bull; Waiting for host to launch Chrono Shift...
                        </div>
                      )}

                      {/* Connected Operatives List */}
                      <div>
                        <div style={{ fontSize: "0.76rem", color: "#F59E0B", fontWeight: 800, marginBottom: "8px" }}>
                          SYNCHRONIZED OPERATIVES ({validRoomPlayers.length} / 4)
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {validRoomPlayers.map((p, idx) => (
                            <div
                              key={p.id ?? idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "8px 12px",
                                background: "#140E0A",
                                borderRadius: "4px",
                                border: "1.5px solid #3D2F23",
                                boxShadow: "inset 1px 1px 0 #000"
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

                    <div style={{ minWidth: 0 }}>
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

                  {/* Spectators List */}
                  {spectators && spectators.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ fontSize: "0.72rem", color: "#C084FC", fontWeight: 800, marginBottom: "6px" }}>
                        TIMELINE OBSERVERS ({spectators.length})
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {spectators.map((s, idx) => (
                          <span
                            key={s.id || idx}
                            style={{
                              background: "rgba(168, 85, 247, 0.12)",
                              border: "1px solid rgba(168, 85, 247, 0.3)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.72rem",
                              color: "#DDD6FE"
                            }}
                          >
                            👁️ {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Waiting Room Action Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "2px solid #5A422D" }}>
                    <button className="btn btn-secondary" onClick={onLeaveRoom} style={{ padding: "10px 20px", fontSize: "0.82rem" }}>
                      {isSpectator ? "Leave Observatory" : "Leave Anomaly Room"}
                    </button>

                    {network.isHost ? (
                      <button
                        className="btn btn-primary"
                        disabled={validRoomPlayers.length < 1}
                        onClick={onStartOnline}
                        style={{ padding: "10px 24px", fontSize: "0.88rem", fontWeight: 800 }}
                      >
                        🚀 INITIATE CHRONO SHIFT ({validRoomPlayers.length}) ➔
                      </button>
                    ) : (
                      <div style={{ fontSize: "0.78rem", color: isSpectator ? "#C084FC" : "#94A3B8", fontStyle: "italic" }}>
                        {isSpectator
                          ? "Observing frequency transmission... Match will start once host initiates Chrono Shift."
                          : "Waiting for expedition host to initiate Chrono Shift..."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
