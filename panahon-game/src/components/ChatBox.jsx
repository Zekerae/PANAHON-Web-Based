import React, { useState, useEffect, useRef } from 'react';
import sounds from '../sound.js';
import { ROLES, PLAYER_COLORS } from '../gameData.js';

function formatChatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ChatBox({
  boxId = 'chat-box',
  isFloating = false,
  messages = [],
  onSendMessage,
  onClose,
  myPlayerId,
  myPlayerName,
  isOnline
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const quickChips = [
    '⚡ Ready!',
    '⏳ Need 1 more',
    '🎯 Target Artifact',
    '🔋 Take Energy',
    '⚠️ Paradox Warning',
    '🚀 Chrono Shift!'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;
    sounds.btnClick();
    onSendMessage(text);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={isFloating ? 'game-chat-panel' : 'lobby-chat-panel'} id={boxId}>
      <div className="chat-header">
        <div className="chat-title">
          <span>📡</span>
          <span>CREW COMMS</span>
          <span style={{ fontSize: '0.65rem', color: '#10B981', marginLeft: '4px' }}>● LIVE</span>
        </div>
        {isFloating && (
          <button
            className="btn btn-secondary"
            style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px' }}
            onClick={onClose}
          >
            ✖
          </button>
        )}
      </div>

      <div className="chat-messages" id={`${boxId}-messages`}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <span style={{ fontSize: '1.2rem' }}>📡</span>
            <span style={{ fontWeight: 700 }}>Chrono-Comms Online</span>
            <span>Coordinate roles and plan your strategy here.</span>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isSelf = (isOnline && m.senderId === myPlayerId) ||
              (!isOnline && m.senderName === myPlayerName);
            const isSpec = Boolean(m.isSpectator || m.roleKey === 'SPECTATOR');
            const role = ROLES[m.roleKey] || ROLES.HISTORIAN;
            const playerColor = isSpec ? '#C084FC' : (PLAYER_COLORS[(m.senderId ?? 0) % PLAYER_COLORS.length] || 'var(--text-accent)');
            const timeStr = formatChatTime(m.timestamp);

            return (
              <div key={idx} className={`chat-msg-row ${isSelf ? 'self' : ''}`}>
                {isSpec ? (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(168, 85, 247, 0.25)',
                    border: '1px solid #C084FC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem'
                  }}>
                    👁️
                  </div>
                ) : (
                  <img src={role.avatar} className="chat-msg-avatar" alt={m.roleKey} />
                )}
                <div className="chat-msg-bubble" style={isSpec ? { borderLeft: '2px solid #C084FC' } : undefined}>
                  <div className="chat-msg-meta">
                    <span className="chat-msg-sender" style={{ color: playerColor }}>
                      {isSpec ? '👁️ ' : ''}{m.senderName}{isSpec ? ' [Observer]' : ''}
                    </span>
                    <span className="chat-msg-time">{timeStr}</span>
                  </div>
                  <div className="chat-msg-text">{m.text}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-quick-chips">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            className="quick-chip"
            onClick={() => handleSend(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          className="chat-text-input"
          placeholder="Transmit to crew..."
          maxLength={250}
          autoComplete="off"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn btn-primary btn-chat-send"
          onClick={() => handleSend()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
