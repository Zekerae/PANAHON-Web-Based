import React, { memo } from 'react';
import sounds from '../../sound.js';

function GameHeader({
  timelineLevel,
  timelineClass,
  timerStr,
  turnNumber,
  onOpenPause,
  isSpectator = false,
  spectatorCount = 0
}) {
  return (
    <header className="game-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div className="game-logo-wrapper">
          <div className="game-logo">PANAHON</div>
          <div className="game-logo-divider"></div>
          <div className="game-logo-subtitle">CHRONO SHIFT</div>
        </div>
        <div className="timeline-meter">
          <div className="timeline-meter-label">TIMELINE INTEGRITY:</div>
          <div className="timeline-meter-bar">
            <div
              className={`timeline-meter-fill ${timelineClass}`}
              style={{ width: `${(Math.min(5, timelineLevel) / 5) * 100}%` }}
            ></div>
          </div>
          <div className="timeline-meter-val" style={{ fontWeight: 800 }}>
            {Math.min(5, timelineLevel)} / 5 BREACH
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {isSpectator && (
          <div className="spectator-live-indicator" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(56, 189, 248, 0.2))',
            border: '1px solid #C084FC',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.35)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#F5D0FE',
            letterSpacing: '1px'
          }}>
            <span className="spectator-pulse-dot" style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#EF4444',
              boxShadow: '0 0 8px #EF4444',
              display: 'inline-block'
            }} />
            <span>👁️ SPECTATING LIVE</span>
            {spectatorCount > 1 && (
              <span style={{ fontSize: '0.66rem', color: '#CBD5E1', marginLeft: '4px' }}>
                ({spectatorCount} watching)
              </span>
            )}
          </div>
        )}

        <div className="game-timer">
          <span>⏱️</span>
          <span>{timerStr}</span>
        </div>

        <div className="game-header-round" style={{ fontFamily: 'var(--font-display)', fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
          Round <strong style={{ color: 'var(--text-accent)' }}>{turnNumber}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <button
          id="btn-pause-game"
          className="btn btn-pause"
          onClick={() => {
            sounds.btnClick();
            if (onOpenPause) onOpenPause();
          }}
          title="Pause Game (Esc)"
          aria-label="Pause Game"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden="true"
            style={{ display: 'block' }}
          >
            <rect x="2.5" y="2" width="3" height="10" rx="1" />
            <rect x="8.5" y="2" width="3" height="10" rx="1" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default memo(GameHeader);
