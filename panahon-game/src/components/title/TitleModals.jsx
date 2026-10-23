import React, { useState } from 'react';
import sounds from '../../sound.js';
import { ALL_ARTIFACTS, ERA_NAMES, ERAS, ROLES } from '../../gameData.js';

/* ==========================================================================
   1. QUESTS MODAL
   ========================================================================== */
export function QuestsModal({ onClose }) {
  const [claimedQuests, setClaimedQuests] = useState(() => {
    try {
      const saved = localStorage.getItem('panahon_claimed_quests');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const quests = [
    {
      id: 'quest_1',
      title: 'Relic Recovery Directive',
      description: 'Retrieve any Historical Artifact and return it to its designated era.',
      icon: '🏆',
      progress: 1,
      max: 1,
      reward: '150 Chrono Credits',
      completed: true
    },
    {
      id: 'quest_2',
      title: 'Historical Deciphering',
      description: 'Uncover 3 authentic Clue Cards across any timeline quadrant.',
      icon: '🔍',
      progress: 2,
      max: 3,
      reward: '75 Chrono Credits',
      completed: false
    },
    {
      id: 'quest_3',
      title: 'Temporal Hazard Navigator',
      description: 'Successfully evade or endure 2 Hazard Anomaly checks.',
      icon: '⚠️',
      progress: 1,
      max: 2,
      reward: '60 Chrono Credits',
      completed: false
    },
    {
      id: 'quest_4',
      title: 'Timeline Preservation',
      description: 'Complete a match without letting the Timeline Meter exceed 3 Breaches.',
      icon: '⏳',
      progress: 0,
      max: 1,
      reward: '100 Chrono Credits',
      completed: false
    }
  ];

  const handleClaim = (id) => {
    sounds.artifact();
    setClaimedQuests(prev => {
      const updated = { ...prev, [id]: true };
      localStorage.setItem('panahon_claimed_quests', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div className="modal duelyst-modal" style={{ maxWidth: '640px', width: '92%' }}>
        <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8' }}>
          <span>📜</span>
          <span>Chronosphere Quests & Directives</span>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '4px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Complete operative challenges across the Philippine archipelago to stabilize anomalies and earn credentials.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {quests.map(q => {
              const isClaimed = !!claimedQuests[q.id];
              const isReady = q.completed && !isClaimed;
              const percent = Math.min(100, Math.round((q.progress / q.max) * 100));

              return (
                <div
                  key={q.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.8) 0%, rgba(10, 15, 26, 0.9) 100%)',
                    border: isReady ? '1.5px solid #F59E0B' : '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: isReady ? '0 0 16px rgba(245, 158, 11, 0.2)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '2rem', flexShrink: 0, filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.4))' }}>
                    {q.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F1F5F9' }}>{q.title}</span>
                      <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>{q.reward}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '8px', lineHeight: 1.35 }}>
                      {q.description}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: q.completed ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}></div>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 700 }}>
                        {q.progress}/{q.max}
                      </span>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {isClaimed ? (
                      <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', padding: '6px 12px', borderRadius: '6px' }}>
                        ✓ CLAIMED
                      </span>
                    ) : isReady ? (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.78rem', background: 'linear-gradient(135deg, #F59E0B, #D97706)', border: 'none', color: '#000', fontWeight: 800 }}
                        onClick={() => handleClaim(q.id)}
                      >
                        CLAIM
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { sounds.btnClick(); onClose(); }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. PROFILE MODAL
   ========================================================================== */
export function ProfileModal({ onClose }) {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('panahon_player_name') || 'Operative One';
  });
  const [selectedRoleKey, setSelectedRoleKey] = useState(() => {
    return localStorage.getItem('panahon_player_role') || 'HISTORIAN';
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    sounds.btnClick();
    localStorage.setItem('panahon_player_name', playerName.trim() || 'Operative One');
    localStorage.setItem('panahon_player_role', selectedRoleKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const currentRole = ROLES[selectedRoleKey] || ROLES.HISTORIAN;

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div className="modal duelyst-modal" style={{ maxWidth: '580px', width: '92%' }}>
        <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8' }}>
          <span>👤</span>
          <span>Operative Dossier & Record</span>
        </div>

        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
          {/* Identity Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
            <img
              src={currentRole.avatar}
              alt={currentRole.name}
              style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid #38BDF8', background: 'rgba(0,0,0,0.5)', objectFit: 'cover' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC' }}>{playerName}</div>
              <div style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: 600 }}>{currentRole.name} • Specialization</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>Temporal Registry: Rank IV Castaway</div>
            </div>
          </div>

          {/* Edit Name Form */}
          <form onSubmit={handleSave} style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Operative Callsign
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#FFF', fontSize: '0.9rem' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.82rem', minWidth: '80px' }}
              >
                {isSaved ? 'Saved! ✓' : 'Save'}
              </button>
            </div>
          </form>

          {/* Role Specialization */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Choose Role Affinity
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {Object.keys(ROLES).map(k => {
                const r = ROLES[k];
                const active = selectedRoleKey === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { sounds.btnClick(); setSelectedRoleKey(k); }}
                    style={{
                      background: active ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      border: active ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 4px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      color: active ? '#FFF' : '#94A3B8'
                    }}
                  >
                    <img src={r.avatar} alt={r.name} style={{ width: '32px', height: '32px', margin: '0 auto 4px', display: 'block' }} />
                    <div style={{ fontSize: '0.68rem', fontWeight: 700 }}>{r.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operative Statistics */}
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Temporal Service Record
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38BDF8' }}>14</div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Missions Logged</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>71%</div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Success Rate</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F59E0B' }}>19</div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Relics Recovered</div>
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { sounds.btnClick(); onClose(); }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   3. SETTINGS MODAL
   ========================================================================== */
export function SettingsModal({ onClose, soundMuted, onToggleSound, onOpenMapEditor, onReplayIntro }) {
  const [sfxVolume, setSfxVolume] = useState(() => Math.round((sounds.sfxVolume ?? 0.8) * 100));
  const [musicVolume, setMusicVolume] = useState(() => Math.round((sounds.musicVolume ?? 0.75) * 100));

  const handleSfxChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSfxVolume(val);
    sounds.setSfxVolume(val / 100);
  };

  const handleMusicChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setMusicVolume(val);
    sounds.setMusicVolume(val / 100);
  };
  const [particlesActive, setParticlesActive] = useState(() => localStorage.getItem('panahon_particles') !== 'false');

  const handleTestSound = () => {
    sounds.btnClick();
    setTimeout(() => sounds.diceRoll(), 150);
  };

  const handleClearCache = () => {
    sounds.btnClick();
    if (window.confirm('Clear cached mission and map data? Active games will be reset.')) {
      localStorage.removeItem('panahon_active_session');
      alert('Local session cache cleared.');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div className="modal duelyst-modal" style={{ maxWidth: '520px', width: '92%' }}>
        <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8' }}>
          <span>⚙️</span>
          <span>Temporal Settings</span>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {/* Audio Controls */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              🔊 Audio Configuration
            </div>

            {/* Replay Studio Intro */}
            {onReplayIntro && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#F1F5F9' }}>Studio Intro Cinematic</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Replay Pixel Crew intro video & loading sequence</div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  onClick={() => { sounds.btnClick(); onClose(); onReplayIntro(); }}
                >
                  🎬 REPLAY INTRO
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#F1F5F9' }}>Master Audio</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Toggle all synthesized sound & atmosphere</div>
              </div>
              <button
                className={`btn ${soundMuted ? 'btn-secondary' : 'btn-primary'}`}
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                onClick={onToggleSound}
              >
                {soundMuted ? '🔇 MUTED' : '🔊 ACTIVE'}
              </button>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#94A3B8' }}>
                <span>Sound Effects (SFX)</span>
                <span style={{ color: '#38BDF8', fontWeight: 700 }}>{sfxVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVolume}
                onChange={handleSfxChange}
                onMouseUp={() => sounds.btnClick()}
                onTouchEnd={() => sounds.btnClick()}
                style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px', color: '#94A3B8' }}>
                <span>Atmospheric Resonance (BGM)</span>
                <span style={{ color: '#F59E0B', fontWeight: 700 }}>{musicVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={musicVolume}
                onChange={handleMusicChange}
                style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer' }}
              />
            </div>

            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
              onClick={handleTestSound}
            >
              🎵 Test Sound Effects
            </button>
          </div>

          {/* Graphics & Atmosphere */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              ✨ Visual Atmosphere
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#F1F5F9' }}>Chrono Particle Shimmer</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Ethereal temporal glow effects</div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                onClick={() => {
                  sounds.btnClick();
                  const next = !particlesActive;
                  setParticlesActive(next);
                  localStorage.setItem('panahon_particles', next ? 'true' : 'false');
                }}
              >
                {particlesActive ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Developer & Cartography Studio */}
          {onOpenMapEditor && (
            <div style={{
              marginBottom: '20px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#A5B4FC', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🛠️</span> Cartography & Map Studio
              </div>
              <div style={{ fontSize: '0.73rem', color: '#94A3B8', marginBottom: '10px', lineHeight: 1.45 }}>
                Advanced developer tool to customize tile coordinates, event distributions, directed paths, and loop logic across all 4 eras.
              </div>
              <button
                className="btn btn-primary"
                style={{
                  width: '100%',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                  borderColor: '#818CF8',
                  padding: '8px 14px'
                }}
                onClick={() => {
                  sounds.btnClick();
                  onClose();
                  onOpenMapEditor();
                }}
              >
                📐 Launch Map Editor
              </button>
            </div>
          )}

          {/* System & Cache */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              💾 Diagnostics & Cache
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.4)', fontSize: '0.78rem' }}
              onClick={handleClearCache}
            >
              🗑️ Clear Local Session Cache
            </button>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { sounds.btnClick(); onClose(); }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. FRIENDS & ALLIES MODAL
   ========================================================================== */
export function FriendsModal({ onClose, onSelectMode }) {
  const [roomCodeInput, setRoomCodeInput] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      sounds.btnClick();
      onClose();
      onSelectMode('online');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div className="modal duelyst-modal" style={{ maxWidth: '540px', width: '92%' }}>
        <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8' }}>
          <span>👥</span>
          <span>Timeline Allies & Direct Peer Link</span>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Connect with other operatives in the chronosphere via peer-to-peer WebRTC coordinates.
          </p>

          {/* Direct Room Code Entry */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F1F5F9', marginBottom: '4px' }}>
              Join Friend via Room Code
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '10px' }}>
              Enter the 4-digit temporal frequency code shared by your host:
            </div>
            <form onSubmit={handleJoin} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. A9X2"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#FFF', fontSize: '0.95rem', letterSpacing: '2px', textAlign: 'center', fontFamily: 'monospace' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                Join Link
              </button>
            </form>
          </div>

          {/* Host New Session */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F1F5F9', marginBottom: '4px' }}>
              Host a Multiplayer Expedition
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '12px' }}>
              Launch an online lobby, recruit friends, and distribute roles across historical timelines.
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, #0284C7, #0369A1)', fontSize: '0.85rem' }}
              onClick={() => {
                sounds.portal();
                onClose();
                onSelectMode('online');
              }}
            >
              🌐 Open Multiplayer Lobby
            </button>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { sounds.btnClick(); onClose(); }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   5. COLLECTION MODAL (HISTORICAL CODEX)
   ========================================================================== */
export function CollectionModal({ onClose }) {
  const [activeEra, setActiveEra] = useState('all');
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  const filteredArtifacts = activeEra === 'all'
    ? ALL_ARTIFACTS
    : ALL_ARTIFACTS.filter(a => a.era === activeEra);

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div className="modal duelyst-modal" style={{ maxWidth: '820px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B' }}>
          <span>🏛️</span>
          <span>Historical Collection & Artifact Codex</span>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Archival repository of all 16 tangible historical Philippine relics and artifacts scattered throughout the timelines:
          </p>

          {/* Era Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[
              { id: 'all', label: `All Relics (${ALL_ARTIFACTS.length})` },
              { id: ERAS.SPANISH, label: 'Spanish Era (4)' },
              { id: ERAS.AMERICAN, label: 'American Era (4)' },
              { id: ERAS.JAPANESE, label: 'Japanese Era (4)' },
              { id: ERAS.MYTH, label: 'Myth & Legend (4)' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => { sounds.btnClick(); setActiveEra(f.id); }}
                style={{
                  background: activeEra === f.id ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.06)',
                  border: activeEra === f.id ? '1.5px solid #FCD34D' : '1px solid rgba(255,255,255,0.12)',
                  color: activeEra === f.id ? '#000' : 'var(--text-secondary)',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Artifacts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
            {filteredArtifacts.map(a => {
              const isSelected = selectedArtifact?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => { sounds.btnClick(); setSelectedArtifact(a); }}
                  style={{
                    background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.8)',
                    border: isSelected ? '2px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                    boxShadow: isSelected ? '0 0 16px rgba(245, 158, 11, 0.3)' : 'none'
                  }}
                >
                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <img
                      src={a.image}
                      alt={a.name}
                      style={{ maxHeight: '68px', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>
                    {a.nickname}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F1F5F9', marginTop: '2px', lineHeight: 1.25 }}>
                    {a.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '4px' }}>
                    {ERA_NAMES[a.era] || a.era}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Relic Details Preview */}
          {selectedArtifact && (
            <div style={{ marginTop: '16px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))', border: '1.5px solid #F59E0B', borderRadius: '10px', padding: '14px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img src={selectedArtifact.image} alt={selectedArtifact.name} style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 800, textTransform: 'uppercase' }}>{selectedArtifact.category} • {ERA_NAMES[selectedArtifact.era]}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF' }}>{selectedArtifact.name} ("{selectedArtifact.nickname}")</div>
                <div style={{ fontSize: '0.78rem', color: '#CBD5E1', marginTop: '4px', lineHeight: 1.35 }}>
                  Authentic Philippine historical artifact required for victory. Players must collect 3 matching era clues to retrieve this relic and secure the timeline!
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { sounds.btnClick(); onClose(); }}>
            Close Codex
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   6. BUG REPORT / FEEDBACK MODAL
   ========================================================================== */
export function BugReportModal({ onClose }) {
  const [category, setCategory] = useState('Visual');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    sounds.btnClick();
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div className="modal duelyst-modal" style={{ maxWidth: '520px', width: '92%' }}>
        <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
        <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8' }}>
          <span>🐞</span>
          <span>Temporal Anomaly & Bug Reporter</span>
        </div>

        <div className="modal-body">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✅</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981' }}>Report Dispatched!</div>
              <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '6px' }}>
                Thank you for helping stabilize the timeline. The Pixel Crew developers have recorded your telemetry.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Encountered a timeline glitch or visual tear? Transmit details directly to the dev squad:
              </p>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  Anomaly Type
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#FFF', fontSize: '0.88rem' }}
                >
                  <option value="Visual">Visual / UI Glitch</option>
                  <option value="Gameplay">Gameplay Rule Issue</option>
                  <option value="Multiplayer">Multiplayer / Desync</option>
                  <option value="Audio">Audio / Sound Effects</option>
                  <option value="Other">Other Observation</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px' }}>
                  Incident Description
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what occurred, what you expected, and steps to reproduce..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#FFF', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.7rem', color: '#64748B', marginBottom: '16px' }}>
                Auto-Telemetry: Version 0.3 Chrono Shift • Linux Client • 60 FPS
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { sounds.btnClick(); onClose(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Submit Report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
