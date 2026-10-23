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
  onSendMessage
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
      <div style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>
        Temporal Castaways
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
              className={`player-card ${isActive ? "active-turn" : ""} ${isInspected ? "inspected-player" : ""}`}
              style={{ borderLeft: `4px solid ${p.color}`, cursor: "pointer" }}
              title={`Click to view ${p.name}'s hand/clues`}
              onClick={() => {
                sounds.btnClick();
                onSelectPlayer(p.id);
              }}
            >
              {isActive && <div className="turn-indicator">▶</div>}
              <div className="player-card-header">
                <img src={p.role?.avatar || ""} className="player-avatar-small" alt={p.name} />
                <div style={{ flex: 1 }}>
                  <div className="player-card-name" style={{ color: p.color }}>
                    {p.name}
                    {p.isAi ? <span className="bot-badge">🤖 BOT</span> : <span className="human-badge">👤</span>}
                    {isMe && <span style={{ fontSize: "0.65rem", color: "var(--accent-gold)", fontWeight: "normal" }}> (You)</span>}
                  </div>
                  <div className="player-card-role">{p.role?.name || "Castaway"}</div>
                </div>
                <div className="player-points">{p.points} PTS</div>
              </div>

              <div className="player-stats">
                <div className="stat-row">
                  <span className="stat-label">Energy</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div className="stat-bar">
                      <div className="stat-bar-fill energy-fill" style={{ width: `${(p.energy / 10) * 100}%` }}></div>
                    </div>
                    <span className="stat-value" style={{ color: "var(--energy-color)" }}>{p.energy}/10</span>
                  </div>
                </div>

                <div className="stat-row">
                  <span className="stat-label">Paradox</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div className="stat-bar">
                      <div className={`stat-bar-fill ${paradoxClass}`} style={{ width: `${paradoxPercent}%` }}></div>
                    </div>
                    <span className="stat-value" style={{ color: p.paradox >= 4 ? "var(--text-danger)" : "var(--text-primary)" }}>
                      {p.paradox}/5
                    </span>
                  </div>
                </div>

                <div className="stat-row" style={{ marginTop: "4px", fontSize: "0.7rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Era: <strong>{ERA_NAMES[p.currentEra].replace(" Era", "")}</strong></span>
                  <span>Clues: <strong>{p.clueCards.length}/5</strong></span>
                  {p.missionComplete ? (
                    <span style={{ color: "#34D399", fontWeight: 700 }}>🏆 Done</span>
                  ) : p.artifactCards.length > 0 ? (
                    <span style={{ color: "#F59E0B", fontWeight: 700 }} title={`Carrying: ${p.artifactCards.map(a => a.nickname).join(', ')}`}>
                      📦 {p.artifactCards.length} Relic{p.artifactCards.length > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EMBEDDED TIMELINE COMMS BENEATH PLAYER LIST - NO DIVIDER LINE, NO BUTTONS */}
      <div className="sidebar-embedded-chat">
        <div className="panel-section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span>Timeline Comms</span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "none", fontWeight: 500 }}>
            {chatMessages.length} transmissions
          </span>
        </div>

        <div className="sidebar-chat-feed" ref={chatFeedRef}>
          {chatMessages.length === 0 ? (
            <div className="sidebar-chat-empty">
              No transmissions yet.
            </div>
          ) : (
            chatMessages.map((m, idx) => {
              const senderPlayer = players.find(p => p.id === m.senderId || p.name === m.senderName);
              const playerColor = senderPlayer?.color || PLAYER_COLORS[(m.senderId ?? 0) % PLAYER_COLORS.length] || "var(--accent-gold)";
              const timeStr = formatChatTime(m.timestamp);

              return (
                <div key={idx} className="sidebar-chat-entry">
                  {timeStr && <span className="sidebar-chat-time">[{timeStr}]</span>}{" "}
                  <span className="sidebar-chat-sender" style={{ color: playerColor }}>
                    [{m.senderName}]
                  </span>{" "}
                  <span className="sidebar-chat-text">{m.text}</span>
                </div>
              );
            })
          )}
        </div>

        <form className="sidebar-chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            className="sidebar-chat-input"
            placeholder="Transmit to timeline..."
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
