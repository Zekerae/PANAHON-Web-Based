import React, { memo } from 'react';
import sounds from '../../sound.js';
import { ERA_NAMES } from '../../gameData.js';

function PlayerSidebar({
  players,
  currentPlayerIndex,
  viewedPlayerId,
  isOnline,
  myPlayerId,
  onSelectPlayer
}) {
  return (
    <aside className="left-panel">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Temporal Castaways
      </div>

      {players.map((p, idx) => {
        const isActive = idx === currentPlayerIndex;
        const isMe = isOnline && p.id === myPlayerId;
        const isInspected = viewedPlayerId === p.id;
        const paradoxPercent = Math.min(100, (p.paradox / 5) * 100);
        let paradoxClass = 'paradox-fill-low';
        if (p.paradox >= 4) paradoxClass = 'paradox-fill-high';
        else if (p.paradox >= 2) paradoxClass = 'paradox-fill-mid';

        return (
          <div
            key={p.id ?? idx}
            className={`player-card ${isActive ? 'active-turn' : ''} ${isInspected ? 'inspected-player' : ''}`}
            style={{ borderLeft: `4px solid ${p.color}`, cursor: 'pointer' }}
            title={`Click to view ${p.name}'s hand/clues`}
            onClick={() => {
              sounds.btnClick();
              onSelectPlayer(p.id);
            }}
          >
            {isActive && <div className="turn-indicator">▶</div>}
            <div className="player-card-header">
              <img src={p.role.avatar} className="player-avatar-small" alt={p.name} />
              <div style={{ flex: 1 }}>
                <div className="player-card-name" style={{ color: p.color }}>
                  {p.name}
                  {p.isAi ? <span className="bot-badge">🤖 BOT</span> : <span className="human-badge">👤</span>}
                  {isMe && <span style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', fontWeight: 'normal' }}> (You)</span>}
                </div>
                <div className="player-card-role">{p.role.name}</div>
              </div>
              <div className="player-points">{p.points} PTS</div>
            </div>

            <div className="player-stats">
              <div className="stat-row">
                <span className="stat-label">Energy</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="stat-bar">
                    <div className="stat-bar-fill energy-fill" style={{ width: `${(p.energy / 10) * 100}%` }}></div>
                  </div>
                  <span className="stat-value" style={{ color: 'var(--energy-color)' }}>{p.energy}/10</span>
                </div>
              </div>

              <div className="stat-row">
                <span className="stat-label">Paradox</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="stat-bar">
                    <div className={`stat-bar-fill ${paradoxClass}`} style={{ width: `${paradoxPercent}%` }}></div>
                  </div>
                  <span className="stat-value" style={{ color: p.paradox >= 4 ? 'var(--text-danger)' : 'var(--text-primary)' }}>
                    {p.paradox}/5
                  </span>
                </div>
              </div>

              <div className="stat-row" style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>Era: <strong>{ERA_NAMES[p.currentEra].replace(' Era', '')}</strong></span>
                <span>Clues: <strong>{p.clueCards.length}/5</strong></span>
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}

export default memo(PlayerSidebar);
