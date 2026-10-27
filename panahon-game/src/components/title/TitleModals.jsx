import React, { useState, useEffect } from 'react';
import { getSavedProfile, savePlayerProfile } from '../../sessionManager.js';
import { getTemporalRecords, getOperativeRank, resetTemporalRecords, logSimulationMission } from '../../temporalRecords.js';
import sounds from '../../sound.js';
import { ALL_ARTIFACTS, ERA_NAMES, ERAS, ROLES } from '../../gameData.js';
import { useGuiScale, resetGuiScale } from '../../guiScale.js';

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
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #5A422D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '4px',
              background: '#32261D',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              📜
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-display)', letterSpacing: '1.5px', color: '#F8FAFC' }}>
                CHRONOSPHERE DIRECTIVES
              </h2>
              <div style={{ fontSize: '0.7rem', color: '#C8B293', marginTop: '2px' }}>
                Active tactical orders and timeline restoration objectives
              </div>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={() => { sounds.btnClick(); onClose(); }}
            style={{ position: 'static' }}
            title="Close Directives"
          >
            &times;
          </button>
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
                      <span style={{ fontSize: '0.75rem', color: '#FFD700', fontWeight: 600 }}>{q.reward}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginBottom: '8px', lineHeight: 1.35 }}>
                      {q.description}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: q.completed ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #C2974D, #FFD700)' }}></div>
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
  const [profile, setProfile] = useState(() => getSavedProfile());
  const [playerName, setPlayerName] = useState(profile.name);
  const [selectedRoleKey, setSelectedRoleKey] = useState(profile.roleKey);
  const [isSaved, setIsSaved] = useState(false);
  const [records, setRecords] = useState(() => getTemporalRecords());
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'history'
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const { name, roleKey } = e.detail || {};
      if (name) setPlayerName(name);
      if (roleKey) setSelectedRoleKey(roleKey);
    };
    const handleRecordsUpdate = (e) => {
      if (e.detail) setRecords(e.detail);
    };
    window.addEventListener('panahon_profile_updated', handleProfileUpdate);
    window.addEventListener('panahon_records_updated', handleRecordsUpdate);
    return () => {
      window.removeEventListener('panahon_profile_updated', handleProfileUpdate);
      window.removeEventListener('panahon_records_updated', handleRecordsUpdate);
    };
  }, []);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    sounds.btnClick();
    const cleanName = playerName.trim() || 'Operative One';
    savePlayerProfile(cleanName, selectedRoleKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleRoleSelect = (key) => {
    sounds.btnClick();
    setSelectedRoleKey(key);
    const cleanName = playerName.trim() || 'Operative One';
    savePlayerProfile(cleanName, key);
  };

  const handleClose = () => {
    const cleanName = playerName.trim() || 'Operative One';
    savePlayerProfile(cleanName, selectedRoleKey);
    sounds.btnClick();
    onClose();
  };

  const currentRole = ROLES[selectedRoleKey] || ROLES.HISTORIAN;
  const rankInfo = getOperativeRank(records);
  const successRate = records.missionsLogged > 0
    ? Math.round((records.missionsWon / records.missionsLogged) * 100)
    : 0;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 12000,
        backgroundColor: "rgba(10, 8, 6, 0.88)"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="modal duelyst-modal"
        style={{
          maxWidth: "600px",
          width: "92%",
          background: "#18120D",
          border: "3px solid #C2974D",
          boxShadow: "inset 2px 2px 0 #5A422D, inset -2px -2px 0 #0F0A07, 0 16px 40px rgba(0,0,0,0.85)",
          borderRadius: "8px",
          padding: "20px 24px",
          color: "#F5EEDC",
          position: "relative"
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #5A422D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '4px',
              background: '#32261D',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              👤
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-display)', letterSpacing: '1.5px', color: '#F8FAFC' }}>
                OPERATIVE DOSSIER & RECORD
              </h2>
              <div style={{ fontSize: '0.7rem', color: '#C8B293', marginTop: '2px' }}>
                Spacetime Registry & Temporal Discipline Calibration
              </div>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={handleClose}
            style={{ position: 'static' }}
            title="Close Dossier"
          >
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "68vh", overflowY: "auto", paddingRight: "4px" }}>
          {/* Identity Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: "#221912",
              border: "2px solid #5A422D",
              boxShadow: "inset 2px 2px 0 #120D08, inset -1px -1px 0 #3D2D1E",
              borderRadius: "6px",
              padding: "14px",
              marginBottom: "16px"
            }}
          >
            <img
              src={currentRole.avatar}
              alt={currentRole.name}
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "6px",
                border: "2px solid #C2974D",
                background: "#120D08",
                objectFit: "cover"
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  color: "#FEF3C7",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.5px"
                }}
              >
                {playerName || "Operative One"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#FCD34D", fontWeight: 700, marginTop: "2px" }}>
                {currentRole.name} &bull; Specialization
              </div>
              <div style={{ fontSize: "0.68rem", color: rankInfo.color, marginTop: "2px", fontWeight: 700 }}>
                Temporal Registry: {rankInfo.rank} &bull; {rankInfo.title} {rankInfo.insignia}
              </div>
            </div>
          </div>

          {/* Edit Callsign Form */}
          <form onSubmit={handleSave} style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "#D4A559",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.5px",
                marginBottom: "6px"
              }}
            >
              OPERATIVE CALLSIGN:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Enter callsign..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: "#140E0A",
                  border: "2px solid #5A422D",
                  borderRadius: "4px",
                  color: "#FEF3C7",
                  fontSize: "0.85rem",
                  outline: "none"
                }}
              />
              <button
                type="submit"
                style={{
                  background: "linear-gradient(180deg, #5C4325 0%, #3D2B16 100%)",
                  border: "2px solid #C2974D",
                  boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #2A1D0E, 0 2px 0 #120E0A",
                  color: "#FEF3C7",
                  borderRadius: "4px",
                  padding: "8px 18px",
                  fontFamily: "var(--font-display)",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {isSaved ? "SAVED! ✓" : "SAVE"}
              </button>
            </div>
          </form>

          {/* Role Specialization */}
          <div style={{ marginBottom: "18px" }}>
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 800,
                color: "#D4A559",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.5px",
                marginBottom: "8px"
              }}
            >
              CHOOSE ROLE AFFINITY:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {Object.keys(ROLES).map((k) => {
                const r = ROLES[k];
                const active = selectedRoleKey === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleRoleSelect(k)}
                    style={{
                      background: active ? "#3D2B16" : "#1C1510",
                      border: active ? "2px solid #FFD700" : "1.5px solid #4A382C",
                      boxShadow: active
                        ? "inset 1px 1px 0 #EBD07D, 0 0 8px rgba(255, 215, 0, 0.3)"
                        : "inset 1px 1px 0 #2E2218",
                      borderRadius: "6px",
                      padding: "10px 4px",
                      textAlign: "center",
                      cursor: "pointer",
                      color: active ? "#FEF3C7" : "#A69279"
                    }}
                  >
                    <img
                      src={r.avatar}
                      alt={r.name}
                      style={{
                        width: "36px",
                        height: "36px",
                        margin: "0 auto 4px",
                        display: "block",
                        borderRadius: "4px",
                        border: active ? "1px solid #FFD700" : "1px solid transparent"
                      }}
                    />
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>
                      {r.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operative Statistics & Deployment History */}
          <div style={{ marginBottom: "18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px"
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  color: "#D4A559",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.5px"
                }}
              >
                TEMPORAL SERVICE RECORD:
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  type="button"
                  onClick={() => { sounds.btnClick?.(); setActiveTab('summary'); }}
                  style={{
                    background: activeTab === 'summary' ? "#3D2B16" : "#1A130E",
                    border: activeTab === 'summary' ? "1.5px solid #FFD700" : "1px solid #4A382C",
                    color: activeTab === 'summary' ? "#FFD700" : "#A69279",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-display)"
                  }}
                >
                  📊 STATS
                </button>
                <button
                  type="button"
                  onClick={() => { sounds.btnClick?.(); setActiveTab('history'); }}
                  style={{
                    background: activeTab === 'history' ? "#3D2B16" : "#1A130E",
                    border: activeTab === 'history' ? "1.5px solid #FFD700" : "1px solid #4A382C",
                    color: activeTab === 'history' ? "#FFD700" : "#A69279",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-display)"
                  }}
                >
                  📜 DOSSIER ({records.missionHistory?.length || 0})
                </button>
              </div>
            </div>

            {activeTab === 'summary' ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "8px" }}>
                  <div
                    style={{
                      background: "#221912",
                      border: "1.5px solid #5A422D",
                      padding: "10px",
                      borderRadius: "6px",
                      textAlign: "center"
                    }}
                    title="Total deployments logged across all timelines"
                  >
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FCD34D", fontFamily: "var(--font-display)" }}>
                      {records.missionsLogged}
                    </div>
                    <div style={{ fontSize: "0.64rem", color: "#C9B69C" }}>Missions Logged</div>
                  </div>
                  <div
                    style={{
                      background: "#221912",
                      border: "1.5px solid #5A422D",
                      padding: "10px",
                      borderRadius: "6px",
                      textAlign: "center"
                    }}
                    title={`${records.missionsWon} Victories out of ${records.missionsLogged} Missions`}
                  >
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: successRate >= 50 ? "#86EFAC" : (records.missionsLogged > 0 ? "#FDE047" : "#A69279"), fontFamily: "var(--font-display)" }}>
                      {successRate}%
                    </div>
                    <div style={{ fontSize: "0.64rem", color: "#C9B69C" }}>Success Rate</div>
                  </div>
                  <div
                    style={{
                      background: "#221912",
                      border: "1.5px solid #5A422D",
                      padding: "10px",
                      borderRadius: "6px",
                      textAlign: "center"
                    }}
                    title="Total historical artifacts safely recovered"
                  >
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FBBF24", fontFamily: "var(--font-display)" }}>
                      {records.relicsRecovered}
                    </div>
                    <div style={{ fontSize: "0.64rem", color: "#C9B69C" }}>Relics Recovered</div>
                  </div>
                </div>

                {/* Additional Telemetry Ribbon */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  background: "#18120D",
                  border: "1px solid #4A382C",
                  borderRadius: "4px",
                  fontSize: "0.64rem",
                  color: "#C8B293"
                }}>
                  <span>🔍 <strong>{records.cluesDecoded}</strong> Clues Decoded</span>
                  <span>🏆 <strong>{records.missionsWon}W</strong> - <strong>{Math.max(0, records.missionsLogged - records.missionsWon)}L</strong></span>
                  <span>🎖️ Standing: <strong style={{ color: rankInfo.color }}>{rankInfo.title}</strong></span>
                </div>
              </>
            ) : (
              /* Mission Dossier List */
              <div style={{
                background: "#140E0A",
                border: "1.5px solid #5A422D",
                borderRadius: "6px",
                padding: "8px",
                maxHeight: "180px",
                overflowY: "auto"
              }}>
                {records.missionHistory && records.missionHistory.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {records.missionHistory.map((m) => {
                      const isWin = m.outcome === 'VICTORY';
                      const isCollapse = m.outcome === 'COLLAPSE';
                      const badgeColor = isWin ? '#F5C442' : (isCollapse ? '#EF4444' : '#94A3B8');
                      const badgeBg = isWin ? '#2D2016' : (isCollapse ? '#2D1414' : '#1F1A17');
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "6px 8px",
                            background: "#1C140E",
                            border: "1px solid #3E2B1D",
                            borderRadius: "4px",
                            fontSize: "0.66rem"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{
                              padding: "2px 5px",
                              borderRadius: "3px",
                              background: badgeBg,
                              border: `1px solid ${badgeColor}`,
                              color: badgeColor,
                              fontWeight: 800,
                              fontFamily: "var(--font-display)",
                              fontSize: "0.56rem"
                            }}>
                              {m.outcome}
                            </span>
                            <span style={{ color: "#FEF3C7", fontWeight: 700 }}>{m.roleName}</span>
                            <span style={{ color: "#8C7764" }}>&bull;</span>
                            <span style={{ color: "#D4A559", textTransform: "capitalize" }}>{m.era} Era</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#C8B293" }}>
                            <span><strong>{m.points}</strong> pts</span>
                            <span>📦 <strong>{m.relics}</strong></span>
                            <span style={{ fontSize: "0.60rem", color: "#796654" }}>{m.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "14px 10px", color: "#8C7764" }}>
                    <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>📜</div>
                    <div style={{ fontSize: "0.72rem", color: "#E5C58A", fontWeight: 700, fontFamily: "var(--font-display)" }}>
                      NO FIELD DEPLOYMENTS RECORDED
                    </div>
                    <div style={{ fontSize: "0.64rem", marginTop: "2px", lineHeight: 1.3 }}>
                      Complete solo or multiplayer games to record your operational timeline service.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Testing & Management Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  sounds.abilityActivate?.();
                  logSimulationMission('VICTORY');
                }}
                style={{
                  background: "transparent",
                  border: "1px dashed #5A422D",
                  borderRadius: "3px",
                  color: "#C2974D",
                  fontSize: "0.60rem",
                  padding: "3px 6px",
                  cursor: "pointer"
                }}
                title="Log a field training drill to calibrate records immediately"
              >
                + Log Field Drill (Calibrate)
              </button>

              {resetConfirm ? (
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.60rem", color: "#EF4444" }}>Confirm Reset?</span>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.btnClick?.();
                      resetTemporalRecords();
                      setResetConfirm(false);
                    }}
                    style={{
                      background: "#450A0A",
                      border: "1px solid #EF4444",
                      color: "#FCA5A5",
                      fontSize: "0.58rem",
                      padding: "2px 5px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetConfirm(false)}
                    style={{
                      background: "#221912",
                      border: "1px solid #5A422D",
                      color: "#C9B69C",
                      fontSize: "0.58rem",
                      padding: "2px 5px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setResetConfirm(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#796654",
                    fontSize: "0.58rem",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                  title="Clear saved service statistics"
                >
                  Reset Records
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: "16px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{
              width: "100%",
              background: "#2D2218",
              border: "2px solid #8C672B",
              boxShadow: "inset 1px 1px 0 #5C3E16, inset -1px -1px 0 #18110B, 0 2px 0 #0D0907",
              color: "#FEF3C7",
              padding: "10px",
              borderRadius: "4px",
              fontFamily: "var(--font-display)",
              fontSize: "0.75rem",
              fontWeight: 800,
              cursor: "pointer"
            }}
            onClick={handleClose}
          >
            ← RETURN TO HEADQUARTERS
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
  const [guiScale, setGuiScale] = useGuiScale();
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
      <div className="modal duelyst-modal settings-modal hide-scrollbar" style={{ maxWidth: '520px', width: '92%', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #5A422D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '4px',
              background: '#32261D',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              ⚙️
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-display)', letterSpacing: '1.5px', color: '#F8FAFC' }}>
                TEMPORAL SETTINGS
              </h2>
              <div style={{ fontSize: '0.7rem', color: '#C8B293', marginTop: '2px' }}>
                Audio parameters, visual atmospheric fidelity, and system cache
              </div>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={() => { sounds.btnClick(); onClose(); }}
            style={{ position: 'static' }}
            title="Close Settings"
          >
            &times;
          </button>
        </div>

        <div
          className="modal-body hide-scrollbar settings-modal-body"
          style={{
            maxHeight: '65vh',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Audio Controls */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
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
                <span style={{ color: '#FFD700', fontWeight: 700 }}>{sfxVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVolume}
                onChange={handleSfxChange}
                onMouseUp={() => sounds.btnClick()}
                onTouchEnd={() => sounds.btnClick()}
                style={{ width: '100%', accentColor: '#C2974D', cursor: 'pointer' }}
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
                style={{ width: '100%', accentColor: '#C2974D', cursor: 'pointer' }}
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
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
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

          {/* Display & GUI Scaling */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🖥️ Interface & GUI Scaling
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {Math.abs(guiScale - 1.0) > 0.01 && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.btnClick();
                      resetGuiScale();
                    }}
                    style={{
                      background: '#1A120B',
                      border: '1px solid #7A5823',
                      borderRadius: '3px',
                      color: '#FCD34D',
                      fontSize: '0.62rem',
                      fontFamily: 'var(--font-display)',
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                    title="Reset GUI scale back to 100% default"
                  >
                    ↺ 100%
                  </button>
                )}
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#FEF3C7',
                  background: '#140E0A',
                  border: '1px solid #C2974D',
                  borderRadius: '3px',
                  padding: '2px 8px'
                }}>
                  {Math.round(guiScale * 100)}%
                </span>
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(194, 151, 77, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '0.73rem', color: '#94A3B8', marginBottom: '10px', lineHeight: 1.4 }}>
                Scale interface elements, fonts, dossiers, and map tiles cleanly without needing browser zoom.
              </div>

              <input
                type="range"
                min="80"
                max="140"
                step="5"
                value={Math.round(guiScale * 100)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 100;
                  setGuiScale(val);
                }}
                style={{ width: '100%', accentColor: '#C2974D', cursor: 'pointer', marginBottom: '10px' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {[
                  { val: 0.9, label: '90%' },
                  { val: 1.0, label: '100%' },
                  { val: 1.1, label: '110%' },
                  { val: 1.2, label: '120% ⭐' },
                  { val: 1.3, label: '130%' }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => {
                      sounds.btnClick();
                      setGuiScale(preset.val);
                    }}
                    style={{
                      padding: '6px 2px',
                      fontSize: '0.64rem',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      background: Math.abs(guiScale - preset.val) < 0.01
                        ? 'linear-gradient(180deg, #F5C442 0%, #C2974D 100%)'
                        : 'linear-gradient(180deg, #382A1B 0%, #22180F 100%)',
                      color: Math.abs(guiScale - preset.val) < 0.01 ? '#140E0A' : '#FEF3C7',
                      border: Math.abs(guiScale - preset.val) < 0.01 ? '1.5px solid #FFE082' : '1.5px solid #5C3E16',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      boxShadow: Math.abs(guiScale - preset.val) < 0.01 ? '0 0 8px rgba(245, 196, 66, 0.5)' : 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '0.66rem', color: '#C8B293', textAlign: 'center', marginTop: '8px' }}>
                ⭐ 120% recommended for high-resolution PC monitors and laptops
              </div>
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
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
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
export function FriendsModal({ onClose, onSelectMode, onSpectateOnline }) {
  const [roomCodeInput, setRoomCodeInput] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      sounds.btnClick();
      onClose();
      onSelectMode('online');
    }
  };

  const handleSpectate = () => {
    if (roomCodeInput.trim()) {
      sounds.portal();
      onClose();
      onSpectateOnline?.(roomCodeInput.trim().toUpperCase());
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div className="modal duelyst-modal" style={{ maxWidth: '520px', width: '92%' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '2px solid #5A422D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '4px',
              background: '#32261D',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              flexShrink: 0
            }}>
              👥
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.08rem', fontFamily: 'var(--font-display)', letterSpacing: '1.2px', color: '#F8FAFC', lineHeight: 1.3 }}>
                TIMELINE ALLIES & DIRECT PEER LINK
              </h2>
              <div style={{ fontSize: '0.68rem', color: '#C8B293', marginTop: '3px', lineHeight: 1.3 }}>
                Connect with other operatives in the chronosphere via WebRTC coordinates
              </div>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={() => { sounds.btnClick(); onClose(); }}
            style={{ position: 'static', flexShrink: 0 }}
            title="Close Allies"
          >
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          {/* Card 1: Direct Room Code Entry */}
          <div style={{
            background: '#231811',
            border: '2px solid #5A422D',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Join Friend via Room Code
            </div>
            <div style={{ fontSize: '0.74rem', color: '#C8B293', marginBottom: '14px', lineHeight: 1.4 }}>
              Enter the 4-digit temporal frequency code shared by your host:
            </div>
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="ENTER 4-DIGIT CODE (e.g. A9X2)"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  background: '#19110B',
                  border: '2px solid #5A422D',
                  borderRadius: '4px',
                  color: '#FFD700',
                  fontSize: '0.96rem',
                  letterSpacing: '3px',
                  textAlign: 'center',
                  fontFamily: "'Courier New', Courier, monospace",
                  fontWeight: 'bold',
                  outline: 'none',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.7)'
                }}
              />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    minWidth: 0,
                    width: '100%',
                    padding: '10px 10px',
                    fontSize: '0.72rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}
                  disabled={!roomCodeInput.trim()}
                >
                  <span>⚡</span> JOIN LINK
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleSpectate}
                  style={{
                    minWidth: 0,
                    width: '100%',
                    padding: '10px 10px',
                    fontSize: '0.72rem',
                    background: 'linear-gradient(180deg, #3B2852 0%, #221533 100%)',
                    color: '#C084FC',
                    border: '2px solid #8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box'
                  }}
                  disabled={!roomCodeInput.trim()}
                >
                  <span>👁️</span> WATCH
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Host New Session */}
          <div style={{
            background: '#231811',
            border: '2px solid #5A422D',
            borderRadius: '6px',
            padding: '16px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Host a Multiplayer Expedition
            </div>
            <div style={{ fontSize: '0.74rem', color: '#C8B293', marginBottom: '14px', lineHeight: 1.4 }}>
              Launch an online lobby, recruit friends, and distribute roles across historical timelines.
            </div>
            <button
              className="btn btn-primary"
              style={{
                minWidth: 0,
                width: '100%',
                padding: '12px 16px',
                fontSize: '0.74rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box'
              }}
              onClick={() => {
                sounds.portal();
                onClose();
                onSelectMode('online');
              }}
            >
              🌐 OPEN MULTIPLAYER LOBBY
            </button>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button
            className="btn btn-secondary"
            style={{ minWidth: 0, width: '100%', padding: '10px 16px', fontSize: '0.74rem', boxSizing: 'border-box' }}
            onClick={() => { sounds.btnClick(); onClose(); }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   5. COLLECTION MODAL (HISTORICAL CODEX)
   ========================================================================== */

const getModalEraRibbonStyle = (era) => {
  switch (era) {
    case ERAS.SPANISH:
      return {
        background: 'linear-gradient(180deg, #7A1A12 0%, #4D0E09 100%)',
        border: '1px solid #C2974D',
        boxShadow: 'inset 1px 1px 0 #D45B4D, inset -1px -1px 0 #280806, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#FFE8A3'
      };
    case ERAS.AMERICAN:
      return {
        background: 'linear-gradient(180deg, #1A375A 0%, #0D2038 100%)',
        border: '1px solid #C2974D',
        boxShadow: 'inset 1px 1px 0 #4A7AB5, inset -1px -1px 0 #08121E, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#E8F1FC'
      };
    case ERAS.JAPANESE:
      return {
        background: 'linear-gradient(180deg, #1C4820 0%, #0F2B12 100%)',
        border: '1px solid #C2974D',
        boxShadow: 'inset 1px 1px 0 #468A4C, inset -1px -1px 0 #08170A, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#E2F7E4'
      };
    case ERAS.MYTH:
      return {
        background: 'linear-gradient(180deg, #6B4210 0%, #3D2405 100%)',
        border: '1px solid #C2974D',
        boxShadow: 'inset 1px 1px 0 #D4892A, inset -1px -1px 0 #1A1003, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#FFD700'
      };
    default:
      return {
        background: 'linear-gradient(180deg, #3A2C21 0%, #221811 100%)',
        border: '1px solid #5A422D',
        boxShadow: 'inset 1px 1px 0 #5C432D, inset -1px -1px 0 #140E0A',
        color: '#C8B293'
      };
  }
};

export function CollectionModal({ onClose }) {
  const [activeEra, setActiveEra] = useState('all');
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  const filteredArtifacts = activeEra === 'all'
    ? ALL_ARTIFACTS
    : ALL_ARTIFACTS.filter(a => a.era === activeEra);

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div
        className="modal duelyst-modal collection-modal-container"
        style={{
          maxWidth: '860px',
          width: '94%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#28201A',
          border: '3px solid #C2974D',
          outline: '2px solid #140E0A',
          boxShadow: 'inset 2px 2px 0 #EBC669, inset -2px -2px 0 #7A5823, 0 20px 60px rgba(0, 0, 0, 0.95)',
          borderRadius: '6px',
          padding: '20px 24px',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '2px solid #5A422D', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '4px',
              background: '#32261D',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem'
            }}>
              🏛️
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontFamily: 'var(--font-display)',
                letterSpacing: '2px',
                color: '#F8FAFC'
              }}>
                HISTORICAL ARTIFACT CODEX
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#C8B293', marginTop: '2px' }}>
                Archival repository of all authentic Philippine historical relics scattered across timelines
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              fontSize: '0.68rem',
              color: '#FFD700',
              background: 'linear-gradient(180deg, #38281A 0%, #1F150C 100%)',
              padding: '6px 14px',
              borderRadius: '3px',
              border: '1.5px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #120C06, 0 2px 3px rgba(0,0,0,0.6)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '1px',
              textShadow: '1px 1px 0 #000',
              whiteSpace: 'nowrap'
            }}>
              16 RELICS CATALOGED
            </div>
            <button
              className="modal-close"
              onClick={() => { sounds.btnClick(); onClose(); }}
              style={{ position: 'static' }}
              title="Close Codex"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {/* Era Filter Chunky 3D Wooden Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {[
              { id: 'all', label: `All Relics (${ALL_ARTIFACTS.length})` },
              { id: ERAS.SPANISH, label: 'Spanish Era (4)' },
              { id: ERAS.AMERICAN, label: 'American Era (4)' },
              { id: ERAS.JAPANESE, label: 'Japanese Era (4)' },
              { id: ERAS.MYTH, label: 'Myth & Legend (4)' }
            ].map(f => {
              const isActive = activeEra === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => { sounds.btnClick(); setActiveEra(f.id); }}
                  style={{
                    background: isActive ? 'linear-gradient(180deg, #6B491E 0%, #462E10 100%)' : 'linear-gradient(180deg, #2D2118 0%, #1A130E 100%)',
                    border: isActive ? '2px solid #C2974D' : '1.5px solid #4D3725',
                    boxShadow: isActive ? 'inset 1px 1px 0 #FFD700, inset -1px -1px 0 #1E1204, 0 2px 0 #0A0704' : 'inset 1px 1px 0 #4D3725, inset -1px -1px 0 #0D0906, 0 2px 0 #0A0704',
                    color: isActive ? '#FFD700' : '#A89885',
                    padding: '6px 14px',
                    borderRadius: '3px',
                    textShadow: '1px 1px 0 #000',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Artifacts Recessed Inventory Slots Grid */}
          <div className="collection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
            {filteredArtifacts.map(a => {
              const isSelected = selectedArtifact?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => { sounds.btnClick(); setSelectedArtifact(a); }}
                  style={{
                    background: isSelected ? '#2D2218' : '#1C1510',
                    border: isSelected ? '2px solid #FFD700' : '2px solid #3A2C21',
                    borderRadius: '4px',
                    padding: '12px 10px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? 'inset 1px 1px 0 #FFE082, inset -1px -1px 0 #140E0A, 0 0 0 2px #5A3F18'
                      : 'inset 2px 2px 0 #0E0A07, inset -1px -1px 0 #4A3828',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <div style={{
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px',
                    background: '#120D09',
                    border: '1px solid #2F231A',
                    borderRadius: '3px',
                    padding: '6px'
                  }}>
                    <img
                      src={a.image}
                      alt={a.name}
                      style={{ maxHeight: '72px', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#FFD700', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-display)' }}>
                    {a.nickname}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF', marginTop: '2px', lineHeight: 1.25 }}>
                    {a.name}
                  </div>
                  <div style={{ marginTop: '5px' }}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      padding: '2px 8px',
                      borderRadius: '2px',
                      textShadow: '1px 1px 0 #000',
                      display: 'inline-block',
                      ...getModalEraRibbonStyle(a.era)
                    }}>
                      {ERA_NAMES[a.era] || a.era}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Relic Details Preview */}
          {selectedArtifact && (
            <div style={{
              marginTop: '16px',
              background: '#201712',
              border: '2px solid #C2974D',
              boxShadow: 'inset 2px 2px 0 #3A2C21, inset -1px -1px 0 #0E0A07, 0 4px 8px rgba(0,0,0,0.6)',
              borderRadius: '4px',
              padding: '16px',
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '88px',
                height: '88px',
                background: '#120D09',
                border: '1px solid #C2974D',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: '4px'
              }}>
                <img src={selectedArtifact.image} alt={selectedArtifact.name} style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#FFD700', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-display)' }}>
                  {selectedArtifact.category} &bull; {ERA_NAMES[selectedArtifact.era]}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFF', fontFamily: 'var(--font-display)' }}>
                  {selectedArtifact.name} ("{selectedArtifact.nickname}")
                </div>
                <div style={{ fontSize: '0.8rem', color: '#C8B293', marginTop: '4px', lineHeight: 1.4 }}>
                  Authentic Philippine historical artifact required for victory. Players must collect 3 matching era clues to retrieve this relic and secure the timeline!
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions collection-modal-actions" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '2px solid #5A422D' }}>
          <button
            className="btn btn-secondary"
            style={{
              width: '100%',
              background: '#3A2C21',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #1A120B, 0 3px 0 #140E0A',
              color: '#FFD700',
              fontFamily: 'var(--font-display)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              padding: '10px 0',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
            onClick={() => { sounds.btnClick(); onClose(); }}
          >
            Close Codex
          </button>
        </div>
      </div>
    </div>
  );
}

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
      <div className="modal duelyst-modal bug-report-modal" style={{ maxWidth: '520px', width: '92%' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #5A422D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '4px',
              background: '#32261D',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              🐞
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'var(--font-display)', letterSpacing: '1.5px', color: '#F8FAFC' }}>
                ANOMALY & BUG REPORTER
              </h2>
              <div style={{ fontSize: '0.7rem', color: '#C8B293', marginTop: '2px' }}>
                Submit chronological turbulence reports to the development team
              </div>
            </div>
          </div>
          <button
            className="modal-close"
            onClick={() => { sounds.btnClick(); onClose(); }}
            style={{ position: 'static' }}
            title="Close Reporter"
          >
            &times;
          </button>
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
              <p className="bug-desc" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
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
                  className="bug-report-textarea"
                  rows={3}
                  required
                  placeholder="Describe what occurred, what you expected, and steps to reproduce..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#FFF', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div className="bug-telemetry" style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.7rem', color: '#64748B', marginBottom: '16px' }}>
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
