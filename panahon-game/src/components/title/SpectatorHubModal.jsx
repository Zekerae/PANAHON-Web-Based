import React, { useState, useEffect } from 'react';
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

  // All 6 Roles included
  const roleHighlights = [
    { key: 'HISTORIAN', name: 'The Historian', role: ROLES.HISTORIAN, color: '#E74C3C', perk: 'Clue Decipher & Decoy Discard' },
    { key: 'EXPLORER', name: 'The Explorer', role: ROLES.EXPLORER, color: '#3498DB', perk: 'Momentum & Chrono-Stride' },
    { key: 'GUARDIAN', name: 'The Guardian', role: ROLES.GUARDIAN, color: '#2ECC71', perk: 'Temporal Repair & Aegis Shield' },
    { key: 'STRATEGIST', name: 'The Strategist', role: ROLES.STRATEGIST, color: '#F39C12', perk: 'Tactical Maneuver & Mastermind' },
    { key: 'ROGUE', name: 'The Rogue', role: ROLES.ROGUE, color: '#9B59B6', perk: 'Temporal Trap & Trap Mastery' },
    { key: 'CHRONOMANCER', name: 'The Chronomancer', role: ROLES.CHRONOMANCER, color: '#1ABC9C', perk: 'Temporal Foresight & Time Stop' }
  ];

  // Active combatants in simulation (default to all 6)
  const [selectedRoleKeys, setSelectedRoleKeys] = useState([
    'HISTORIAN', 'EXPLORER', 'GUARDIAN', 'STRATEGIST', 'ROGUE', 'CHRONOMANCER'
  ]);

  // Esc shortcut to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        sounds.btnClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleRole = (key) => {
    sounds.btnClick();
    setSelectedRoleKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 2) return prev; // Keep at least 2 combatants
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const selectAll = () => {
    sounds.btnClick();
    setSelectedRoleKeys(['HISTORIAN', 'EXPLORER', 'GUARDIAN', 'STRATEGIST', 'ROGUE', 'CHRONOMANCER']);
  };

  const selectClassic4 = () => {
    sounds.btnClick();
    setSelectedRoleKeys(['HISTORIAN', 'EXPLORER', 'GUARDIAN', 'STRATEGIST']);
  };

  const selectWithNewTwo = () => {
    sounds.btnClick();
    setSelectedRoleKeys(['ROGUE', 'CHRONOMANCER', 'HISTORIAN', 'EXPLORER']);
  };

  const handleSpectateOnlineSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      sounds.danger?.();
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
    const activeRoles = roleHighlights.filter(r => selectedRoleKeys.includes(r.key));
    const configs = (activeRoles.length >= 2 ? activeRoles : roleHighlights).map(r => ({
      name: `Bot ${r.role?.name?.replace('The ', '') || r.name}`,
      roleKey: r.key,
      type: 'ai',
      difficulty: 'normal'
    }));
    if (onStartSpectatorSimulation) {
      onStartSpectatorSimulation(configs);
    }
  };

  return (
    <div className="modal-overlay spectator-hub-overlay" style={{ zIndex: 12000 }}>
      <div className="modal spectator-hub-modal" role="dialog" aria-label="Chrono Observatory Spectator Hub">
        {/* TOP HEADER */}
        <div className="spectator-hub-header">
          <div className="spectator-hub-title-group">
            <div className="spectator-hub-icon-badge">
              <span>🔭</span>
            </div>
            <div>
              <div className="spectator-hub-title-row">
                <h2 className="spectator-hub-title">CHRONO OBSERVATORY</h2>
                <span className="spectator-hub-pill">[ SPECTATOR HUB ]</span>
              </div>
              <p className="spectator-hub-subtitle">
                Tactical surveillance & omniscient timeline monitoring across all historical eras.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="spectator-hub-close-btn"
            onClick={() => { sounds.btnClick(); onClose(); }}
            title="Close Observatory Hub [ESC]"
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
              <span>🌐</span>
              <span>ONLINE MATCH SPECTATE</span>
            </button>

            <button
              type="button"
              className={`spectator-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => { sounds.btnClick(); setActiveTab('ai'); setErrorMsg(''); }}
            >
              <span>🤖</span>
              <span>BOT AI SIMULATION</span>
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="spectator-hub-body">
          {/* TAB 1: ONLINE MATCH */}
          {activeTab === 'online' && (
            <div className="spectator-tab-content animate-fade-in">
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

              <div className="spectator-form-card">
                <div className="spectator-form-header">
                  <span>🛰️</span>
                  <span>Connect to Live Online Expedition</span>
                </div>

                <div className="spectator-form-row">
                  <label className="spectator-label" htmlFor="spectator-callsign-input">
                    Observer Callsign
                  </label>
                  <div className="spectator-input-wrapper">
                    <span>👤</span>
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
                  <div className="spectator-input-wrapper">
                    <span>🔑</span>
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
                  <span>Autonomous Chronological Clash ({selectedRoleKeys.length} Combatants)</span>
                </div>
                <p className="spectator-sim-desc">
                  Simulate an entire match between AI operatives across all eras. Choose which of the <strong>6 unique historical classes</strong> enter the arena. Click any card below to toggle their participation.
                </p>

                {/* Preset Filters */}
                <div className="spectator-preset-filters">
                  <button type="button" className="spectator-filter-btn" onClick={selectAll}>
                    ⚔️ All 6 Operatives
                  </button>
                  <button type="button" className="spectator-filter-btn" onClick={selectWithNewTwo}>
                    🗡️ With Rogue & Chronomancer
                  </button>
                  <button type="button" className="spectator-filter-btn" onClick={selectClassic4}>
                    📜 Classic 4
                  </button>
                </div>
              </div>

              {/* All 6 Operatives Grid */}
              <div className="spectator-roles-grid">
                {roleHighlights.map((r) => {
                  const isSelected = selectedRoleKeys.includes(r.key);
                  return (
                    <div
                      key={r.key}
                      className={`spectator-role-card ${isSelected ? 'selected' : 'deselected'}`}
                      onClick={() => toggleRole(r.key)}
                      title={`Click to ${isSelected ? 'remove' : 'add'} ${r.name}`}
                    >
                      <div className="spectator-role-avatar-wrap" style={{ borderColor: r.color }}>
                        {r.role?.avatar ? (
                          <img src={r.role.avatar} alt={r.name} className="spectator-role-img" />
                        ) : (
                          <span>🤖</span>
                        )}
                      </div>
                      <div className="spectator-role-info">
                        <div className="spectator-role-topline">
                          <span className="spectator-role-name" style={{ color: r.color }}>
                            {r.name}
                          </span>
                          <span className="spectator-role-status-glyph">
                            {isSelected ? '✓ ACTIVE' : '—'}
                          </span>
                        </div>
                        <span className="spectator-role-perk">{r.perk}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simulation Features */}
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
            Cancel [ ESC ]
          </button>

          {activeTab === 'online' ? (
            <button
              type="button"
              className="spectator-btn-primary"
              onClick={handleSpectateOnlineSubmit}
            >
              <span>👁️</span>
              <span>Watch Live Match ➔</span>
            </button>
          ) : (
            <button
              type="button"
              className="spectator-btn-primary"
              onClick={handleStartAiSim}
            >
              <span>🚀</span>
              <span>Launch AI Simulation ({selectedRoleKeys.length} Bots) ➔</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
