import React from 'react';
import sounds from '../sound.js';

export default function TitleScreen({ onSelectMode, onOpenGuide, soundMuted, onToggleSound, onOpenMapEditor }) {
  return (
    <div className="title-screen">
      <div className="title-content">
        <h1 className="title-logo">PANAHON</h1>
        <div className="title-subtitle">Chrono Shift</div>
        <div className="title-acronym">Portal Anomaly Navigation and Historical Origin Network</div>

        <div className="title-buttons">
          <button
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 0 20px rgba(124, 58, 237, 0.45)',
              fontSize: '0.95rem'
            }}
            onClick={() => {
              sounds.btnClick();
              onSelectMode('solo');
            }}
          >
            ⚔️ Player vs. AI (Solo vs. Bots)
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              sounds.btnClick();
              onSelectMode('local');
            }}
          >
            🛡️ Custom Game
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              sounds.btnClick();
              onSelectMode('online');
            }}
          >
            🌐 Online Multiplayer
          </button>

          <button
            className="btn btn-secondary"
            style={{
              borderColor: 'rgba(234, 179, 8, 0.4)',
              background: 'rgba(234, 179, 8, 0.08)'
            }}
            onClick={() => {
              sounds.btnClick();
              onOpenMapEditor();
            }}
          >
            🗺️ Map & Path Editor
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => {
              sounds.btnClick();
              onOpenGuide();
            }}
          >
            📖 Rules & Field Manual
          </button>

          <button
            className="btn"
            style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--bg-glass)' }}
            onClick={() => {
              onToggleSound();
            }}
          >
            {soundMuted ? '🔇 Audio Off' : '🔊 Audio On'}
          </button>
        </div>

        <div style={{ marginTop: '30px', fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
          Pixel Crew • BSIT 3-8 • Version 0.3
        </div>
      </div>
    </div>
  );
}
