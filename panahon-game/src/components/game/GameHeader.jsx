import React, { memo } from 'react';
import sounds from '../../sound.js';

function GameHeader({
  timelineLevel,
  timelineClass,
  timerStr,
  turnNumber,
  unreadChatCount,
  soundMuted,
  onToggleChat,
  onOpenGuide,
  onToggleSound
}) {
  return (
    <header className="game-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div className="game-logo">PANAHON</div>
        <div className="timeline-meter">
          <div className="timeline-meter-label">TIMELINE INTEGRITY:</div>
          <div className="timeline-meter-bar">
            <div
              className={`timeline-meter-fill ${timelineClass}`}
              style={{ width: `${(timelineLevel / 10) * 100}%` }}
            ></div>
          </div>
          <div className="timeline-meter-val" style={{ fontWeight: 800 }}>
            {timelineLevel} / 10 BREACH
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div className="game-timer">
          <span>⏱️</span>
          <span>{timerStr}</span>
        </div>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Round <strong style={{ color: 'var(--text-accent)' }}>{turnNumber}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <button
          className={`btn ${unreadChatCount > 0 ? 'btn-chat-unread' : ''}`}
          style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-glass)', position: 'relative' }}
          onClick={onToggleChat}
        >
          💬 Comms {unreadChatCount > 0 && <span className="chat-badge">{unreadChatCount}</span>}
        </button>
        <button
          className="btn"
          style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-glass)' }}
          onClick={() => { sounds.btnClick(); onOpenGuide(); }}
        >
          📖 Manual
        </button>
        <button
          className="btn"
          style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-glass)' }}
          onClick={onToggleSound}
        >
          {soundMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </header>
  );
}

export default memo(GameHeader);
