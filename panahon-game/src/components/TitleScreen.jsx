import React from 'react';
import sounds from '../sound.js';
import { ROLES } from '../gameData.js';

export default function TitleScreen({
  onSelectMode,
  onOpenGuide,
  soundMuted,
  onToggleSound,
  onOpenMapEditor,
  activeSession,
  onReconnect,
  onDiscardSession
}) {
  const isOnlineSession = activeSession?.mode === 'online';
  const sessionState = activeSession?.gameState;
  const currentP = sessionState?.players?.[sessionState?.currentPlayerIndex];
  const roleName = currentP?.roleKey ? (ROLES[currentP.roleKey]?.name || currentP.roleKey) : '';
  const roomCode = activeSession?.onlineInfo?.roomCode;

  return (
    <div className="title-screen">
      <div className="title-content">
        <h1 className="title-logo">PANAHON</h1>
        <div className="title-subtitle">Chrono Shift</div>
        <div className="title-acronym">Portal Anomaly Navigation and Historical Origin Network</div>

        <div className="title-buttons">
          {/* Active Session Reconnect / Resume Card */}
          {activeSession && (
            <div className="title-resume-card animate-pulse-border">
              <div className="title-resume-header">
                <span className="title-resume-badge">
                  {isOnlineSession ? '🌐 ONLINE ANOMALY ACTIVE' : '⚡ RECONNECT AVAILABLE'}
                </span>
                <button
                  className="title-resume-discard-btn"
                  title="Discard saved session"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.btnClick();
                    if (onDiscardSession) onDiscardSession();
                  }}
                >
                  ✕
                </button>
              </div>

              <div className="title-resume-details">
                {isOnlineSession ? (
                  <div>Room: <strong>{roomCode}</strong> • Playing as {activeSession?.onlineInfo?.playerName || 'Castaway'}</div>
                ) : (
                  <div>Round {sessionState?.turnNumber || 1} • {currentP?.name || 'Player'} ({roleName})</div>
                )}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Breach: {Math.min(5, sessionState?.timelineMeter ?? 0)}/5 • Saved session
                </div>
              </div>

              <button
                className="btn btn-primary title-resume-btn"
                onClick={() => {
                  sounds.btnClick();
                  if (onReconnect) onReconnect();
                }}
              >
                {isOnlineSession ? '🔄 RECONNECT TO ROOM' : '▶ RESUME MISSION'}
              </button>
            </div>
          )}

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
            style={{
              borderColor: 'rgba(46, 204, 113, 0.4)',
              background: 'rgba(46, 204, 113, 0.08)'
            }}
            onClick={() => {
              sounds.btnClick();
              window.open('cards.html', '_blank', 'noopener');
            }}
          >
            🃏 Hybrid Card Atlas
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
