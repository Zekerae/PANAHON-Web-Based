import React, { useState, useEffect } from 'react';
import sounds from '../sound.js';
import { ROLES, ERAS, ERA_NAMES } from '../gameData.js';

export default function GuideModal({ onClose }) {
  const [guideTab, setGuideTab] = useState('overview');

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

  const handleTab = (tab) => {
    sounds.btnClick();
    setGuideTab(tab);
  };

  const handleClose = () => {
    sounds.btnClick();
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 12500 }} onClick={handleOverlayClick}>
      <div
        className="modal duelyst-modal"
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(56, 189, 248, 0.25)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📜</span>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontFamily: 'var(--font-display)',
                letterSpacing: '2px',
                color: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                CHRONO FIELD MANUAL & CODEX
                <span style={{ fontSize: '0.65rem', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  DIRECTIVE V0.3
                </span>
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
                Operational directives, operative protocols, and timeline stabilization rules
              </div>
            </div>
          </div>

          <button
            className="modal-close"
            onClick={handleClose}
            style={{ position: 'static', color: '#94A3B8', fontSize: '1.4rem' }}
          >
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'Timeline Overview', icon: '🌐' },
            { id: 'roles', label: 'Operative Protocols', icon: '🛡️' },
            { id: 'mechanics', label: 'Temporal Dynamics', icon: '⚡' },
            { id: 'scoring', label: 'Stability Rating', icon: '🏆' }
          ].map(tab => {
            const isActive = guideTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`duelyst-tab-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => handleTab(tab.id)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.35))' : 'rgba(15, 23, 42, 0.6)',
                  border: isActive ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: isActive ? '#FFF' : '#94A3B8',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Manual Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '8px',
          fontSize: '0.84rem',
          lineHeight: 1.6,
          color: '#CBD5E1'
        }}>
          {guideTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#38BDF8', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
                  MISSION OBJECTIVE
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#E2E8F0' }}>
                  <strong>PANAHON: Chrono Shift</strong> (Portal Anomaly Navigation and Historical Origin Network) is a strategic time-travel tabletop simulation.
                  Players take the mantle of <strong>Temporal Castaways</strong> deployed across Philippine history to repair catastrophic chronal breaches caused by displaced relics.
                  Operatives must decipher artifact clues, survive historical crises, cross Time Gates, and restore balance to the spacetime continuum.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px', color: '#F59E0B', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
                  THE 4 HISTORICAL TIMELINES & RELICS
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {[
                    { name: 'Spanish Era (1521-1898)', color: '#E74C3C', relics: 'Silver Dos Mundos, Murillo Velarde Map, Concepcion Porcelain, Relicario' },
                    { name: 'American Era (1898-1946)', color: '#3498DB', relics: 'Quezon Typewriter, El Renacimiento Issue, Kellogg Magneto, Port Telephone' },
                    { name: 'Japanese Era (1942-1945)', color: '#2ECC71', relics: 'Death March Marker, Senninbari Belt, Guerrilla Transceiver, Capas Field Litter' },
                    { name: 'Myth & Legend (Ancient)', color: '#F39C12', relics: 'Cordillera Bulul, Batu-Balani Agimat, Kamagong Comb, Kris ng Datu' }
                  ].map((era, i) => (
                    <div key={i} style={{ background: 'rgba(15, 23, 42, 0.7)', border: `1px solid ${era.color}40`, borderTop: `3px solid ${era.color}`, borderRadius: '6px', padding: '10px' }}>
                      <div style={{ color: era.color, fontWeight: 700, fontSize: '0.78rem', marginBottom: '4px' }}>{era.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4 }}>{era.relics}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {guideTab === 'roles' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
              {Object.entries(ROLES).map(([key, role]) => (
                <div
                  key={key}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderLeft: `4px solid ${role.color || '#38BDF8'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <img
                    src={role.avatar}
                    alt={role.name}
                    style={{ width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover', border: `1px solid ${role.color || '#38BDF8'}` }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: role.color || '#F8FAFC', fontWeight: 800, fontSize: '0.9rem' }}>
                      {role.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic', marginBottom: '6px' }}>
                      {role.title || 'Timeline Operative'}
                    </div>

                    <div style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                      <strong style={{ color: '#38BDF8' }}>Passive ({role.passive.name}):</strong> {role.passive.description}
                    </div>
                    <div style={{ fontSize: '0.74rem' }}>
                      <strong style={{ color: '#F59E0B' }}>Active ({role.active.name}):</strong> {role.active.description}
                      <span style={{ color: '#94A3B8', marginLeft: '6px' }}>(Cost: {role.active.energyCost}⚡, CD: {role.active.cooldown}T)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {guideTab === 'mechanics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#38BDF8', fontSize: '0.88rem' }}>⚡ ENERGY MANAGEMENT (0 - 10)</h4>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  Each operative starts with <strong>10 Chrono Energy</strong>. Traversing a Time Gate requires <strong>2 Energy</strong> (1 for Explorer). Reaching 0 Energy renders an operative <strong>Temporal Stranded</strong>. A stranded operative must spend their turn in <strong>Stasis Rest</strong> to recover <strong>+3 Energy</strong>.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#F59E0B', fontSize: '0.88rem' }}>⏳ INDIVIDUAL PARADOX ACCUMULATION (0 - 5)</h4>
                <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>&bull; <strong>Level 0-1 (Equilibrium):</strong> Chronological harmony (+2 bonus score at debrief).</div>
                  <div>&bull; <strong>Level 2 (Minor Friction):</strong> Minor temporal strain (-1 Score penalty).</div>
                  <div>&bull; <strong>Level 3 (Temporal Drag):</strong> Immediate loss of 1 Chrono Energy.</div>
                  <div>&bull; <strong>Level 4 (Anomaly Rift):</strong> Immediately draws an unexpected Hazard Anomaly Card.</div>
                  <div>&bull; <strong>Level 5 (Critical Breach):</strong> Adds +2 to Shared Timeline Breach, inflicts -3 Score penalty, and resets individual meter to Level 2.</div>
                </div>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#EF4444', fontSize: '0.88rem' }}>💀 CATASTROPHIC BREACH LIMIT (SHARED 0 - 5)</h4>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  <strong>Failure Condition:</strong> When cumulative breaches cause the Shared Timeline Meter to exceed <strong>5 (Breach Level 6)</strong>, chronological stability completely shatters. <strong>Spacetime collapses, and all castaways immediately lose the mission!</strong>
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#A5B4FC', fontSize: '0.88rem' }}>🔍 ARTIFACT EXCAVATION PROTOCOL</h4>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  Operatives must decipher at least <strong>3 Clues</strong> related to a specific historical relic before they can successfully extract it from an Artifact Tile.
                </p>
              </div>
            </div>
          )}

          {guideTab === 'scoring' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid rgba(56, 189, 248, 0.3)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 6px', color: '#38BDF8' }}>OPERATIONAL MILESTONE</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', color: '#38BDF8' }}>STABILITY RATING</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Complete Assigned Timeline Mission', pts: '+10', color: '#34D399' },
                    { label: 'Return Relic to Authentic Timeline', pts: '+5', color: '#34D399' },
                    { label: 'Complete Secondary Directive', pts: '+2', color: '#34D399' },
                    { label: 'Authentic Clue Deciphered (per card)', pts: '+1 each', color: '#38BDF8' },
                    { label: 'Chrono Energy Remaining (per unit)', pts: '+1 each', color: '#38BDF8' },
                    { label: 'Paradox Equilibrium Maintained (Level 0-1)', pts: '+2', color: '#34D399' },
                    { label: 'Paradox Destabilization (Level 4-5)', pts: '-3', color: '#F87171' },
                    { label: 'Mission Directive Failure', pts: '-5', color: '#EF4444' }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <td style={{ padding: '8px 6px', color: '#E2E8F0' }}>{row.label}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: row.color }}>{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            className="btn btn-primary"
            onClick={handleClose}
            style={{ padding: '8px 24px', fontSize: '0.84rem' }}
          >
            Acknowledge Directives
          </button>
        </div>
      </div>
    </div>
  );
}
