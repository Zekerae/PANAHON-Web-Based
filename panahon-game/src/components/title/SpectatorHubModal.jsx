import React, { useState } from 'react';
import sounds from '../../sound.js';
import { ROLES } from '../../gameData.js';

export default function SpectatorHubModal({ onClose, onStartSpectatorSimulation, onSpectateOnline }) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('tab') === 'ai' ? 'ai' : 'online';
    } catch {
      return 'online';
    }
  }); // 'online' | 'ai'
  const [roomCode, setRoomCode] = useState('');
  const [observerName, setObserverName] = useState(() => {
    return localStorage.getItem('panahon_player_name')
      ? `${localStorage.getItem('panahon_player_name')} (Observer)`
      : 'Chronos Observer';
  });
  const [errorMsg, setErrorMsg] = useState('');

  const handleSpectateOnlineSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      sounds.hazard();
      setErrorMsg('Please enter a valid 5-letter Room Code.');
      return;
    }
    sounds.portal();
    onClose();
    if (onSpectateOnline) {
      onSpectateOnline(cleanCode, observerName.trim() || 'Chronos Observer');
    }
  };

  const handleStartAiSim = () => {
    sounds.portal();
    onClose();
    if (onStartSpectatorSimulation) {
      onStartSpectatorSimulation();
    }
  };

  const roleHighlights = [
    { key: 'HISTORIAN', name: 'The Historian', role: ROLES.HISTORIAN, color: '#E74C3C', perk: 'Clue Decipher & Decoy Discard' },
    { key: 'EXPLORER', name: 'The Explorer', role: ROLES.EXPLORER, color: '#3498DB', perk: 'Momentum & Chrono-Stride' },
    { key: 'GUARDIAN', name: 'The Guardian', role: ROLES.GUARDIAN, color: '#2ECC71', perk: 'Temporal Repair & Aegis Shield' },
    { key: 'STRATEGIST', name: 'The Strategist', role: ROLES.STRATEGIST, color: '#F39C12', perk: 'Temporal Trap & Space Lock' },
  ];

  return (
    <div className="modal-overlay spectator-hub-overlay" style={{ zIndex: 12000 }}>
      <div className="modal duelyst-modal spectator-hub-modal">
        {/* TOP HEADER */}
        <div className="spectator-hub-header">
          <div className="spectator-hub-title-group">
            <div className="spectator-hub-icon-badge">
              <span className="spectator-badge-emoji">🔭</span>
            </div>
            <div>
              <div className="spectator-hub-title-row">
                <h2 className="spectator-hub-title">CHRONO OBSERVATORY</h2>
                <span className="spectator-hub-pill">SPECTATOR HUB</span>
              </div>
              <p className="spectator-hub-subtitle">
                Passive tactical surveillance, omniscient intelligence, and live timeline chronicle monitoring
              </p>
            </div>
          </div>

          <button
            type="button"
            className="spectator-hub-close-btn"
            onClick={() => { sounds.btnClick(); onClose(); }}
            title="Close Observatory Hub"
          >
            ✕
          </button>
        </div>

        {/* MODE SWITCHER TABS */}
        <div className="spectator-hub-tabs-wrapper">
          <div className="spectator-hub-tabs">
            <button
              type="button"
              className={`spectator-tab-btn ${activeTab === 'online' ? 'active' : ''}`}
              onClick={() => { sounds.btnClick(); setActiveTab('online'); setErrorMsg(''); }}
            >
              <span className="spectator-tab-icon">🌐</span>
              <span className="spectator-tab-text">ONLINE MATCH</span>
              {activeTab === 'online' && <span className="spectator-tab-indicator" />}
            </button>

            <button
              type="button"
              className={`spectator-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => { sounds.btnClick(); setActiveTab('ai'); setErrorMsg(''); }}
            >
              <span className="spectator-tab-icon">🤖</span>
              <span className="spectator-tab-text">BOT AI SIMULATION</span>
              {activeTab === 'ai' && <span className="spectator-tab-indicator" />}
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="spectator-hub-body">
          {/* TAB 1: ONLINE MATCH */}
          {activeTab === 'online' && (
            <div className="spectator-tab-content animate-fade-in">
              {/* Intel Feature Highlights */}
              <div className="spectator-intel-grid">
                <div className="spectator-intel-chip">
                  <span className="intel-chip-icon">👁️</span>
                  <div className="intel-chip-content">
                    <span className="intel-chip-title">Omniscient Intel</span>
                    <span className="intel-chip-desc">Inspect all player hands, clues, & secret missions</span>
                  </div>
                </div>
                <div className="spectator-intel-chip">
                  <span className="intel-chip-icon">📡</span>
                  <div className="intel-chip-content">
                    <span className="intel-chip-title">Live Chronicle</span>
                    <span className="intel-chip-desc">Real-time action feed & transmission log</span>
                  </div>
                </div>
                <div className="spectator-intel-chip">
                  <span className="intel-chip-icon">🛡️</span>
                  <div className="intel-chip-content">
                    <span className="intel-chip-title">Zero Interference</span>
                    <span className="intel-chip-desc">Passive observer cannot perturb timeline state</span>
                  </div>
                </div>
              </div>

              {/* Online Form Card */}
              <div className="spectator-form-card">
                <div className="spectator-form-header">
                  <span className="spectator-form-icon">🛰️</span>
                  <span className="spectator-form-heading">Connect to Live Online Room</span>
                </div>

                <div className="spectator-form-row">
                  <label className="spectator-label" htmlFor="spectator-callsign-input">
                    Observer Callsign
                  </label>
                  <div className="spectator-input-wrapper">
                    <span className="spectator-input-prefix">👤</span>
                    <input
                      id="spectator-callsign-input"
                      type="text"
                      className="spectator-text-input"
                      value={observerName}
                      onChange={(e) => setObserverName(e.target.value)}
                      placeholder="e.g. Chronos Observer"
                      maxLength={24}
                    />
                  </div>
                </div>

                <div className="spectator-form-row">
                  <label className="spectator-label" htmlFor="spectator-room-input">
                    Target Room Code
                  </label>
                  <div className="spectator-input-wrapper code-wrapper">
                    <span className="spectator-input-prefix">🔑</span>
                    <input
                      id="spectator-room-input"
                      type="text"
                      className="spectator-text-input spectator-code-input"
                      maxLength={5}
                      value={roomCode}
                      onChange={(e) => {
                        setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                        setErrorMsg('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSpectateOnlineSubmit();
                      }}
                      placeholder="E.G. AB12C"
                      autoFocus
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="spectator-error-pill animate-shake">
                    <span>⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BOT AI SIMULATION */}
          {activeTab === 'ai' && (
            <div className="spectator-tab-content animate-fade-in">
              <div className="spectator-sim-overview">
                <div className="spectator-sim-tagline">
                  <span>⚡</span>
                  <span>Autonomous 4-Way Chronological Clash</span>
                </div>
                <p className="spectator-sim-desc">
                  Simulate an entire match between four specialized AI operatives. Control timeline pacing, toggle omniscient reveals, and auto-track operative turns across all eras.
                </p>
              </div>

              {/* 4 Operatives Showcase */}
              <div className="spectator-roles-grid">
                {roleHighlights.map((r) => (
                  <div key={r.key} className="spectator-role-card" style={{ borderColor: `${r.color}55` }}>
                    <div className="spectator-role-avatar-wrap" style={{ background: `${r.color}22`, borderColor: r.color }}>
                      {r.role?.avatar ? (
                        <img src={r.role.avatar} alt={r.name} className="spectator-role-img" />
                      ) : (
                        <span>🤖</span>
                      )}
                    </div>
                    <div className="spectator-role-info">
                      <span className="spectator-role-name" style={{ color: r.color }}>{r.name}</span>
                      <span className="spectator-role-perk">{r.perk}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulation Perks Row */}
              <div className="spectator-sim-perks">
                <span className="sim-perk-badge">⏩ 1x / 1.5x / Turbo Pacing</span>
                <span className="sim-perk-badge">🎥 Dynamic Camera Tracking</span>
                <span className="sim-perk-badge">🃏 Omniscient Hand Views</span>
              </div>
            </div>
          )}
        </div>

        {/* PINNED MODAL FOOTER */}
        <div className="spectator-hub-footer">
          <button
            type="button"
            className="spectator-btn-cancel"
            onClick={() => { sounds.btnClick(); onClose(); }}
          >
            Cancel
          </button>

          {activeTab === 'online' ? (
            <button
              type="button"
              className="spectator-btn-primary online-submit"
              onClick={handleSpectateOnlineSubmit}
            >
              <span className="btn-icon">👁️</span>
              <span>Watch Live Match</span>
              <span className="btn-arrow">➔</span>
            </button>
          ) : (
            <button
              type="button"
              className="spectator-btn-primary ai-submit"
              onClick={handleStartAiSim}
            >
              <span className="btn-icon">🚀</span>
              <span>Launch AI Simulation</span>
              <span className="btn-arrow">➔</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
