import React, { memo } from 'react';
import sounds from '../../sound.js';
import { ERA_NAMES } from '../../gameData.js';

const ERA_HISTORICAL_SUBTITLES = {
  spanish: 'Colonial Timeline (1565–1898)',
  american: 'Industrial Era (1898–1946)',
  japanese: 'Wartime Resistance (1942–1945)',
  myth: 'Pre-Colonial & Anito Lore'
};

const ERA_ICONS = {
  spanish: '⚔️',
  american: '📻',
  japanese: '🏮',
  myth: '✨'
};

function GameHeader({
  timelineLevel,
  timelineClass,
  timerStr,
  turnNumber,
  onOpenPause,
  onOpenDebug,
  isSpectator = false,
  spectatorCount = 0,
  currentEra = 'spanish'
}) {
  const eraName = ERA_NAMES[currentEra] || currentEra;
  const eraSubtitle = ERA_HISTORICAL_SUBTITLES[currentEra] || 'Active Timeline';
  const eraIcon = ERA_ICONS[currentEra] || '⏳';

  return (
    <header className="game-header">
      {/* LEFT: LOGO & ACTIVE ERA BADGE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div className="game-logo-wrapper" title="PANAHON: Chrono Shift">
          <img
            src="/assets/panahon_chrono_shift_logo.png"
            alt="PANAHON: Chrono Shift"
            className="game-header-logo"
          />
        </div>

        {/* Dynamic In-Game Active Era Badge */}
        <div className={`header-era-badge era-badge-${currentEra}`}>
          <span className="header-era-icon">{eraIcon}</span>
          <div className="header-era-details">
            <span className="header-era-name">{eraName}</span>
            <span className="header-era-period">{eraSubtitle}</span>
          </div>
        </div>
      </div>

      {/* CENTER: TIMELINE INTEGRITY METER */}
      <div className="timeline-meter" title="Timeline Integrity breaches caused by temporal paradoxes">
        <div className="timeline-meter-header">
          <span className="timeline-meter-label">TIMELINE INTEGRITY:</span>
          <span className={`timeline-status-badge status-${timelineClass}`}>
            {timelineLevel >= 4 ? '⚠️ CRITICAL' : timelineLevel >= 2 ? '⚡ DISTURBANCE' : '✓ STABLE'}
          </span>
        </div>
        <div className="timeline-meter-bar">
          <div
            className={`timeline-meter-fill ${timelineClass}`}
            style={{ width: `${(Math.min(5, timelineLevel) / 5) * 100}%` }}
          >
            <div className="timeline-meter-plasma" />
          </div>
        </div>
        <div className="timeline-meter-val" style={{ fontWeight: 800 }}>
          {Math.min(5, timelineLevel)} / 5 BREACH
        </div>
      </div>

      {/* RIGHT: SPECTATOR, TIMER, ROUND & PAUSE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {isSpectator && (
          <div className="spectator-live-indicator" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(180deg, #2D2016 0%, #1A120B 100%)',
            border: '1.5px solid #C2974D',
            boxShadow: 'inset 1px 1px 0 rgba(235, 198, 105, 0.2), 0 3px 6px rgba(0,0,0,0.6)',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '0.70rem',
            fontWeight: 800,
            color: '#FFD700',
            letterSpacing: '0.8px'
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

        <div className="game-timer" title="Expedition Timer (Time remaining before spacetime collapse)">
          <span>⏱️</span>
          <span>{timerStr}</span>
        </div>

        <div className="game-header-round" style={{ fontFamily: 'var(--font-display)', fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
          Round <strong style={{ color: 'var(--text-accent)' }}>{turnNumber}</strong>
        </div>

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