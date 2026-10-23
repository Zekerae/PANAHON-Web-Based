import React, { memo } from 'react';
import sounds from '../../sound.js';

function GameHeader({
  timelineLevel,
  timelineClass,
  timerStr,
  turnNumber,
  onOpenPause
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
