import React from 'react';
import sounds from '../sound.js';

export default function EndGameScreen({ state, onPlayAgain, onBackMenu }) {
  if (!state) return null;

  const isCollapse = state.endReason === 'collapse' || state.timelineMeter > 5;
  const sortedPlayers = [...state.players].sort((a, b) => b.points - a.points);
  const winner = isCollapse ? null : sortedPlayers[0];

  return (
    <div className="endgame-screen">
      <div
        className="endgame-title"
        style={{ color: isCollapse ? 'var(--text-danger)' : 'var(--text-accent)' }}
      >
        {isCollapse ? '💀 TIMELINES MESSED UP!' : '🏆 MISSION COMPLETE!'}
      </div>
      <div className="endgame-subtitle">
        {isCollapse
          ? 'The timelines are completely messed up! The temporal breach exceeded 5, causing catastrophic spacetime collapse and all castaways were lost.'
          : `Temporal stability restored! Winner: ${winner.name} (${winner.role.name})`}
      </div>

      <div className="scoreboard">
        {sortedPlayers.map((p, rank) => {
          const isWinner = !isCollapse && rank === 0;
          return (
            <div key={p.id ?? rank} className={`score-card ${isWinner ? 'winner' : ''}`}>
              <div className="score-rank">#{rank + 1}</div>
              <img
                src={p.role.avatar}
                style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }}
                alt={p.name}
              />
              <div className="score-player-info">
                <div className="score-player-name" style={{ color: p.color }}>
                  {p.name} {isWinner ? '👑' : ''}
                </div>
                <div className="score-player-role">{p.role.name}</div>
                <div className="score-breakdown">
                  <span className="score-item">Mission: <span className="score-item-value">{p.missionComplete ? '+10' : '-5'}</span></span>
                  <span className="score-item">Artifacts: <span className="score-item-value">+{p.artifactCards.length * 5}</span></span>
                  <span className="score-item">Clues: <span className="score-item-value">+{p.cluePoints || 0}</span></span>
                  <span className="score-item">Energy: <span className="score-item-value">+{p.energy}</span></span>
                  <span className="score-item">Paradox: <span className="score-item-value">{p.paradox <= 1 ? '+2' : (p.paradox >= 4 ? '-3' : '0')}</span></span>
                </div>
              </div>
              <div className="score-total">{p.points} PTS</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            sounds.portal();
            onPlayAgain();
          }}
        >
          Play Another Shift
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            sounds.btnClick();
            onBackMenu();
          }}
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
