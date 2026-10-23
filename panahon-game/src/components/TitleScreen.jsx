import React, { useState } from 'react';
import sounds from '../sound.js';
import { ROLES } from '../gameData.js';
import {
  QuestsModal,
  ProfileModal,
  SettingsModal,
  FriendsModal,
  CollectionModal,
  BugReportModal
} from './title/TitleModals.jsx';
import DataBankModal from './title/DataBankModal.jsx';
import StudioPinModal from './StudioPinModal.jsx';
import { isStudioUnlocked } from '../studioAuth.js';

export default function TitleScreen({
  onSelectMode,
  onOpenGuide,
  soundMuted,
  onToggleSound,
  onOpenMapEditor,
  activeSession,
  onReconnect,
  onDiscardSession,
  onReplayIntro
}) {
  const [showStudioPinModal, setShowStudioPinModal] = useState(false);

  const handleLaunchMapStudio = () => {
    sounds.btnClick();
    if (isStudioUnlocked()) {
      onOpenMapEditor();
    } else {
      setShowStudioPinModal(true);
    }
  };

  const [activeModal, setActiveModal] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('modal') || null;
    } catch {
      return null;
    }
  });
  const [isPlayDrawerOpen, setIsPlayDrawerOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('drawer') === 'play';
    } catch {
      return false;
    }
  });

  const isOnlineSession = activeSession?.mode === 'online';
  const sessionState = activeSession?.gameState;
  const currentP = sessionState?.players?.[sessionState?.currentPlayerIndex];
  const roleName = currentP?.roleKey ? (ROLES[currentP.roleKey]?.name || currentP.roleKey) : '';
  const roomCode = activeSession?.onlineInfo?.roomCode;

  const handleOpenPlay = () => {
    sounds.btnClick();
    setIsPlayDrawerOpen(prev => !prev);
  };

  const handleSelectPlayMode = (mode) => {
    sounds.portal();
    setIsPlayDrawerOpen(false);
    onSelectMode(mode);
  };

  return (
    <div className="title-screen duelyst-theme">
      {/* Dynamic Panning Map Background Layer */}
      <div className="duelyst-bg-canvas" aria-hidden="true" />

      {/* 1. TOP HUD BAR */}
      <header className="duelyst-top-bar">
        {/* Top Center: Bug Report Pill */}
        <div className="top-center-tag">
          <button
            className="duelyst-bug-btn"
            onClick={() => { sounds.btnClick(); setActiveModal('bug'); }}
            title="Report a temporal glitch or feedback"
          >
            <span>FOUND A BUG?</span>
          </button>
        </div>

        {/* Top Right: Hexagonal HUD Navigation Buttons */}
        <div className="duelyst-hex-group">
          {/* Quests Button */}
          <button
            className="duelyst-hex-btn"
            onClick={() => { sounds.btnClick(); setActiveModal('quests'); }}
            title="View Daily Quests & Directives"
          >
            <div className="hex-shape">
              <svg viewBox="0 0 100 115" className="hex-svg">
                <polygon points="50 3, 97 28, 97 87, 50 112, 3 87, 3 28" className="hex-polygon" />
              </svg>
              <span className="hex-icon">!</span>
            </div>
            <span className="hex-label">QUESTS</span>
          </button>

          {/* Profile Button */}
          <button
            className="duelyst-hex-btn"
            onClick={() => { sounds.btnClick(); setActiveModal('profile'); }}
            title="View Operative Profile & Stats"
          >
            <div className="hex-shape">
              <svg viewBox="0 0 100 115" className="hex-svg">
                <polygon points="50 3, 97 28, 97 87, 50 112, 3 87, 3 28" className="hex-polygon" />
              </svg>
              <span className="hex-icon">👤</span>
            </div>
            <span className="hex-label">PROFILE</span>
          </button>

          {/* Settings Button */}
          <button
            className="duelyst-hex-btn"
            onClick={() => { sounds.btnClick(); setActiveModal('settings'); }}
            title="Configure Audio & Game Options"
          >
            <div className="hex-shape">
              <svg viewBox="0 0 100 115" className="hex-svg">
                <polygon points="50 3, 97 28, 97 87, 50 112, 3 87, 3 28" className="hex-polygon" />
              </svg>
              <span className="hex-icon">⚙️</span>
            </div>
            <span className="hex-label">SETTINGS</span>
          </button>

          {/* Friends Button */}
          <button
            className="duelyst-hex-btn"
            onClick={() => { sounds.btnClick(); setActiveModal('friends'); }}
            title="Timeline Allies & Room Link"
          >
            <div className="hex-shape">
              <svg viewBox="0 0 100 115" className="hex-svg">
                <polygon points="50 3, 97 28, 97 87, 50 112, 3 87, 3 28" className="hex-polygon" />
              </svg>
              <span className="hex-icon">👥</span>
            </div>
            <span className="hex-label">FRIENDS (0)</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY: LEFT MENU & CHRONO ORB */}
      <div className="duelyst-main-layout">
        {/* Left Column: Brand & Vertical Menu */}
        <div className="duelyst-left-section">
          {/* Logo & Subtitle */}
          <div className="duelyst-logo-wrapper">
            <h1 className="duelyst-logo">PANAHON</h1>
            <div className="duelyst-logo-divider"></div>
            <div className="duelyst-subtitle">CHRONO SHIFT</div>
            <div className="duelyst-acronym">Portal Anomaly Navigation and Historical Origin Network</div>
          </div>

          {/* Vertical Menu Items */}
          <nav className="duelyst-nav-menu">
            {/* PLAY Item */}
            <div className="nav-item-container">
              <button
                className={`duelyst-menu-link ${isPlayDrawerOpen ? 'is-active' : ''}`}
                onClick={handleOpenPlay}
              >
                <div className="menu-link-bullet">
                  <svg viewBox="0 0 24 24" className="constellation-icon">
                    <circle cx="6" cy="6" r="2.2" fill="currentColor" />
                    <circle cx="18" cy="12" r="2.2" fill="currentColor" />
                    <circle cx="6" cy="18" r="2.2" fill="currentColor" />
                    <line x1="6" y1="6" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="6" y1="18" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="menu-link-text">PLAY</span>
                <span className="menu-link-arrow">{isPlayDrawerOpen ? '▼' : '▶'}</span>
              </button>

              {/* Expandable Play Modes Drawer */}
              {isPlayDrawerOpen && (
                <div className="duelyst-play-drawer animate-slide-in">
                  <button
                    className="duelyst-sub-btn primary-glow"
                    onClick={() => handleSelectPlayMode('solo')}
                  >
                    <span className="sub-btn-icon">⚔️</span>
                    <div className="sub-btn-content">
                      <div className="sub-btn-title">PLAYER VS. AI</div>
                      <div className="sub-btn-desc">Solo expedition vs 3 automated bots</div>
                    </div>
                  </button>

                  <button
                    className="duelyst-sub-btn"
                    onClick={() => handleSelectPlayMode('online')}
                  >
                    <span className="sub-btn-icon">🌐</span>
                    <div className="sub-btn-content">
                      <div className="sub-btn-title">ONLINE MULTIPLAYER</div>
                      <div className="sub-btn-desc">Host or join WebRTC peer lobby</div>
                    </div>
                  </button>

                  <button
                    className="duelyst-sub-btn"
                    onClick={() => handleSelectPlayMode('local')}
                  >
                    <span className="sub-btn-icon">🛡️</span>
                    <div className="sub-btn-content">
                      <div className="sub-btn-title">CUSTOM GAME</div>
                      <div className="sub-btn-desc">Local pass-and-play match configuration</div>
                    </div>
                  </button>
                </div>
              )}
            </div>



            {/* COLLECTION (Artifact Codex) */}
            <div className="nav-item-container">
              <button
                className="duelyst-menu-link"
                onClick={() => { sounds.btnClick(); setActiveModal('collection'); }}
              >
                <div className="menu-link-bullet">
                  <svg viewBox="0 0 24 24" className="constellation-icon">
                    <circle cx="6" cy="6" r="2.2" fill="currentColor" />
                    <circle cx="18" cy="12" r="2.2" fill="currentColor" />
                    <circle cx="6" cy="18" r="2.2" fill="currentColor" />
                    <line x1="6" y1="6" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="6" y1="18" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="menu-link-text">COLLECTION</span>
                <span className="menu-link-tag">16 RELICS</span>
              </button>
            </div>

            {/* DATA BANK (Card Codex: Clues, Events, Dangers) */}
            <div className="nav-item-container">
              <button
                className="duelyst-menu-link"
                onClick={() => { sounds.btnClick(); setActiveModal('databank'); }}
              >
                <div className="menu-link-bullet">
                  <svg viewBox="0 0 24 24" className="constellation-icon">
                    <circle cx="6" cy="6" r="2.2" fill="currentColor" />
                    <circle cx="18" cy="12" r="2.2" fill="currentColor" />
                    <circle cx="6" cy="18" r="2.2" fill="currentColor" />
                    <line x1="6" y1="6" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="6" y1="18" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="menu-link-text">DATA BANK</span>
                <span className="menu-link-tag" style={{ color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.35)', background: 'rgba(56, 189, 248, 0.08)' }}>104 CARDS</span>
              </button>
            </div>

            {/* MANUAL (Rules & Field Guide) */}
            <div className="nav-item-container">
              <button
                className="duelyst-menu-link"
                onClick={() => { sounds.btnClick(); onOpenGuide(); }}
              >
                <div className="menu-link-bullet">
                  <svg viewBox="0 0 24 24" className="constellation-icon">
                    <circle cx="6" cy="6" r="2.2" fill="currentColor" />
                    <circle cx="18" cy="12" r="2.2" fill="currentColor" />
                    <circle cx="6" cy="18" r="2.2" fill="currentColor" />
                    <line x1="6" y1="6" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="6" y1="18" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="menu-link-text">MANUAL</span>
                <span className="menu-link-tag">FIELD GUIDE</span>
              </button>
            </div>
          </nav>

          {/* Credits footer with discreet dev link */}
          <div className="duelyst-credits" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>Pixel Crew • BSIT 3-8 • Version 0.3</span>
            <span style={{ opacity: 0.3 }}>•</span>
            <button
              onClick={handleLaunchMapStudio}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.35)',
                fontSize: '0.68rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '1px 5px',
                borderRadius: '3px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#38BDF8'; e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)'; e.currentTarget.style.background = 'none'; }}
              title="Cartography Studio & Map Editor"
            >
              🛠️ Map Studio
            </button>
          </div>
        </div>

        {/* Center-Right: Chrono Core / Orb & Reconnect Anomaly */}
        <div className="duelyst-orb-section">
          {/* Orbital Circle Emblem */}
          <div className={`chrono-orb-container ${activeSession ? 'has-anomaly' : ''}`}>
            <div className="chrono-orb-outer-ring"></div>
            <div className="chrono-orb-middle-ring"></div>
            <div className="chrono-orb-inner-ring">
              <div className="chrono-orb-crystal">
                <span className="crystal-glyph">{activeSession ? '⚡' : '⏳'}</span>
              </div>
            </div>

            <div className="chrono-orb-caption">
              <span className="caption-number">{activeSession ? '1' : '0'}</span>
              <span className="caption-label">{activeSession ? 'ACTIVE ANOMALY' : 'BOOSTER PACKS'}</span>
            </div>
          </div>

          {/* Reconnect Mission Card (If session exists) */}
          {activeSession && (
            <div className="duelyst-reconnect-card animate-pulse-glow">
              <div className="reconnect-badge">
                <span>{isOnlineSession ? '🌐 ONLINE ANOMALY' : '⚡ RESUME EXPEDITION'}</span>
                <button
                  className="reconnect-discard-btn"
                  onClick={() => {
                    sounds.btnClick();
                    if (onDiscardSession) onDiscardSession();
                  }}
                  title="Discard Saved Mission"
                >
                  ✕
                </button>
              </div>

              <div className="reconnect-details">
                {isOnlineSession ? (
                  <div>Room: <strong>{roomCode}</strong> • {activeSession?.onlineInfo?.playerName || 'Castaway'}</div>
                ) : (
                  <div>Round {sessionState?.turnNumber || 1} • {currentP?.name || 'Player'} ({roleName})</div>
                )}
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '3px' }}>
                  Breach: {Math.min(5, sessionState?.timelineMeter ?? 0)}/5 • Saved Mission
                </div>
              </div>

              <button
                className="btn btn-primary reconnect-action-btn"
                onClick={() => {
                  sounds.portal();
                  if (onReconnect) onReconnect();
                }}
              >
                {isOnlineSession ? 'RECONNECT TO ROOM' : 'RESUME MISSION ➔'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. INTERACTIVE MODALS */}
      {activeModal === 'quests' && (
        <QuestsModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'profile' && (
        <ProfileModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'settings' && (
        <SettingsModal
          onClose={() => setActiveModal(null)}
          soundMuted={soundMuted}
          onToggleSound={onToggleSound}
          onOpenMapEditor={handleLaunchMapStudio}
          onReplayIntro={onReplayIntro}
        />
      )}
      {activeModal === 'friends' && (
        <FriendsModal
          onClose={() => setActiveModal(null)}
          onSelectMode={onSelectMode}
        />
      )}
      {activeModal === 'collection' && (
        <CollectionModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'databank' && (
        <DataBankModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'bug' && (
        <BugReportModal onClose={() => setActiveModal(null)} />
      )}

      {/* Developer Encrypted PIN Gate Modal */}
      <StudioPinModal
        isOpen={showStudioPinModal}
        onClose={() => setShowStudioPinModal(false)}
        onSuccess={() => {
          setShowStudioPinModal(false);
          onOpenMapEditor();
        }}
      />
    </div>
  );
}
