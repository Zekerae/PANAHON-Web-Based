import React, { memo } from 'react';
import sounds from '../../sound.js';

function GameHeader({
  timelineLevel,
  timelineClass,
  timerStr,
  turnNumber,
  onOpenGuide,
  onOpenPause
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
          className="btn"
          style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--bg-glass)' }}
          onClick={() => { sounds.btnClick(); onOpenGuide(); }}
        >
          📖 Manual
        </button>
        <button
          className="btn btn-pause"
          onClick={() => {
            sounds.btnClick();
            if (onOpenPause) onOpenPause();
          }}
          title="Pause Game (Esc)"
        >
          <span className="pause-bars-icon"><span></span><span></span></span>
          <span className="pause-btn-text">PAUSE</span>
        </button>
      </div>
    </header>
  );
}

export default memo(GameHeader);
