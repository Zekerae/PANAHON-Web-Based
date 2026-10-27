import React, { useState, useEffect, useRef, memo } from "react";
import sounds from "../../sound.js";
import { ERA_NAMES, PLAYER_COLORS } from "../../gameData.js";

function formatChatTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function PlayerSidebar({
  players,
  currentPlayerIndex,
  viewedPlayerId,
  isOnline,
  myPlayerId,
  myPlayerName,
  onSelectPlayer,
  chatMessages = [],
  onSendMessage,
  isSpectator = false,
  spectators = []
}) {
  const [inputText, setInputText] = useState("");
  const chatFeedRef = useRef(null);

  // Auto-scroll chat feed to newest message
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    sounds.btnClick();
    onSendMessage?.(text);
    setInputText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="left-panel">
      <div className="sidebar-players-header">
        <span className="sidebar-players-title">Castaways</span>
        <span className="sidebar-players-count">({players.length})</span>
      </div>

      <div className="player-sidebar-list">
        {players.map((p, idx) => {
          const isActive = idx === currentPlayerIndex;
          const isMe = isOnline && p.id === myPlayerId;
          const isInspected = viewedPlayerId === p.id;
          const paradoxPercent = Math.min(100, (p.paradox / 5) * 100);
          let paradoxClass = "paradox-fill-low";
          if (p.paradox >= 4) paradoxClass = "paradox-fill-high";
          else if (p.paradox >= 2) paradoxClass = "paradox-fill-mid";

          return (
            <div
              key={p.id ?? idx}
              className={`player-card compact-player-card ${isActive ? "active-turn" : ""} ${isInspected ? "inspected-player" : ""}`}
              style={{ borderLeftColor: p.color, cursor: "pointer" }}
              title={`Click to view ${p.name}'s inventory & clues`}
              onClick={() => {
                sounds.btnClick();
                onSelectPlayer(p.id);
              }}
            >
              {isActive && <div className="turn-indicator" title="Active Turn">▶</div>}

              {/* Row 1: Avatar, Name + Badge, Role, Points */}
              <div className="player-card-header">
                <img src={p.role?.avatar || ""} className="player-avatar-small" alt={p.name} />
                <div className="player-card-info">
                  <div className="player-card-name-row">
                    <span className="player-card-name" style={{ color: p.color }}>
                      {p.name}
                    </span>
                    {p.isAi ? (
                      <span className="bot-badge-mini" title="AI Bot">🤖</span>
                    ) : (
                      <span className="human-badge-mini" title="Human Player">👤</span>
                    )}
                    {isMe && <span className="you-badge-mini">(You)</span>}
                  </div>
                  <div className="player-card-role">{p.role?.name || "Castaway"}</div>
                </div>
                <div className="player-points-badge">
                  <span className="points-val">{p.points}</span>
                  <span className="points-unit">PTS</span>
                </div>
              </div>

              {/* Row 2: Compact Dual Stat Bars (Energy & Paradox on ONE row) */}
              <div className="player-bars-row">
                <div className="compact-bar-group" title={`Energy: ${p.energy}/10`}>
                  <span className="compact-bar-label">EN</span>
                  <div className="stat-bar compact-stat-bar">
                    <div className="stat-bar-fill energy-fill" style={{ width: `${(p.energy / 10) * 100}%` }}></div>
                  </div>
                  <span className="compact-bar-val energy-val">{p.energy}/10</span>
                </div>

                <div className="compact-bar-group" title={`Paradox: ${p.paradox}/5`}>
                  <span className="compact-bar-label">PD</span>
                  <div className="stat-bar compact-stat-bar">
                    <div className={`stat-bar-fill ${paradoxClass}`} style={{ width: `${paradoxPercent}%` }}></div>
                  </div>
                  <span
                    className="compact-bar-val paradox-val"
                    style={{ color: p.paradox >= 4 ? "#ef4444" : (p.paradox >= 2 ? "#f59e0b" : "#22c55e") }}
                  >
                    {p.paradox}/5
                  </span>
                </div>
              </div>

              {/* Row 3: Era, Clues, Relic status */}
              <div className="player-card-footer">
                <span className="footer-era-tag">
                  {ERA_NAMES[p.currentEra]?.replace(" Era", "") || p.currentEra}
                </span>
                <span className="footer-clues-tag">
                  Clues: <strong>{p.clueCards?.length || 0}/5</strong>
                </span>
                {p.missionComplete ? (
                  <span className="footer-mission-done">🏆 Done</span>
                ) : p.artifactCards?.length > 0 ? (
                  <span className="footer-relic-tag" title={`Carrying: ${p.artifactCards.map(a => a.nickname).join(', ')}`}>
                    📦 {p.artifactCards.length}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* EMBEDDED TIMELINE COMMS BENEATH PLAYER LIST */}
      <div className="sidebar-embedded-chat">
        <div className="sidebar-chat-header">
          <span className="sidebar-chat-title">Timeline Comms</span>
          <span className="sidebar-chat-count">{chatMessages.length} msgs</span>
        </div>

        <div className="sidebar-chat-feed" ref={chatFeedRef}>
          {chatMessages.length === 0 ? (
            <div className="sidebar-chat-empty">
              No transmissions yet.
            </div>
          ) : (
            chatMessages.map((m, idx) => {
              const isSpec = Boolean(m.isSpectator || m.roleKey === 'SPECTATOR');
              const senderPlayer = players.find(p => p.id === m.senderId || p.name === m.senderName);
              const playerColor = isSpec ? '#E5C58A' : (senderPlayer?.color || PLAYER_COLORS[(m.senderId ?? 0) % PLAYER_COLORS.length] || "var(--accent-gold)");
              const timeStr = formatChatTime(m.timestamp);

              return (
                <div key={idx} className="sidebar-chat-entry">
                  {timeStr && <span className="sidebar-chat-time">[{timeStr}]</span>}{" "}
                  <span className="sidebar-chat-sender" style={{ color: playerColor }}>
                    [{isSpec ? '👁️ ' : ''}{m.senderName}{isSpec ? ' (Observer)' : ''}]
                  </span>{" "}
                  <span className="sidebar-chat-text">{m.text}</span>
                </div>
              );
            })
          )}
        </div>

        {spectators && spectators.length > 0 && (
          <div style={{ fontSize: "0.65rem", color: "#F5C442", padding: "3px 8px", background: "#251B12", border: "1px solid #5A422D", borderRadius: "4px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span>👁️ {spectators.length} Spectator{spectators.length > 1 ? 's' : ''}:</span>
            <span style={{ color: "#E5C58A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {spectators.map(s => s.name).join(', ')}
            </span>
          </div>
        )}

        <form className="sidebar-chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            className="sidebar-chat-input"
            placeholder={isSpectator ? "Transmit as observer..." : "Transmit to timeline..."}
            maxLength={250}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            className="sidebar-chat-send-btn"
            title="Send transmission"
          >
            ➤
          </button>
        </form>
      </div>
    </aside>
  );
}

export default memo(PlayerSidebar);
