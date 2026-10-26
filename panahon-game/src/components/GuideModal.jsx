import React, { useState, useEffect } from 'react';
import sounds from '../sound.js';
import { ROLES, ERAS, ERA_NAMES } from '../gameData.js';

export default function GuideModal({ onClose }) {
  const [guideTab, setGuideTab] = useState('overview');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation?.();
        sounds?.btnClick?.();
        if (typeof onClose === 'function') onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  const handleTab = (tab) => {
    sounds?.btnClick?.();
    setGuideTab(tab);
  };

  const handleClose = () => {
    sounds?.btnClick?.();
    if (typeof onClose === 'function') onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 12500,
        backgroundColor: 'rgba(10, 8, 6, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        inset: 0
      }}
      onClick={handleOverlayClick}
    >
      <div
        className="modal duelyst-modal guide-modal-container"
        style={{
          maxWidth: '860px',
          width: '94%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          position: 'relative',
          background: '#28201A',
          border: '3px solid #C2974D',
          outline: '2px solid #140E0A',
          boxShadow: 'inset 2px 2px 0 #EBC669, inset -2px -2px 0 #7A5823, 0 20px 60px rgba(0, 0, 0, 0.95)',
          borderRadius: '6px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
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
              📜
            </div>
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
                <span style={{ fontSize: '0.65rem', color: '#FFD700', background: 'linear-gradient(180deg, #38281A 0%, #1F150C 100%)', padding: '4px 10px', borderRadius: '3px', border: '1.5px solid #C2974D', boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #120C06, 0 2px 3px rgba(0,0,0,0.6)', fontFamily: 'var(--font-display)', letterSpacing: '1px', textShadow: '1px 1px 0 #000' }}>
                  DIRECTIVE V0.3
                </span>
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#C8B293', marginTop: '2px' }}>
                Operational directives, operative protocols, and timeline stabilization rules
              </div>
            </div>
          </div>

          <button
            className="modal-close"
            onClick={handleClose}
            style={{
              position: 'static',
              color: '#FFD700',
              fontSize: '1.4rem',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              background: '#3A2C21',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #1A120B, 0 2px 0 #140E0A',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Close Manual [ESC]"
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
                  background: isActive ? 'linear-gradient(180deg, #6B491E 0%, #462E10 100%)' : 'linear-gradient(180deg, #3A2C21 0%, #251B14 100%)',
                  border: isActive ? '2px solid #C2974D' : '2px solid #5A422D',
                  boxShadow: isActive ? 'inset 1px 1px 0 #FFD700, inset -1px -1px 0 #1E1204, 0 2px 0 #0D0906' : 'inset 1px 1px 0 #6E5239, inset -1px -1px 0 #140E0A, 0 2px 0 #0D0906',
                  color: isActive ? '#FFD700' : '#C8B293',
                  padding: '7px 14px',
                  borderRadius: '3px',
                  textShadow: '1px 1px 0 #000',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  letterSpacing: '1px',
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
          paddingRight: '6px',
          fontSize: '0.84rem',
          lineHeight: 1.6,
          color: '#C8B293',
          minHeight: 0
        }}>
          {guideTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#1C1510', border: '2px solid #5A422D', boxShadow: 'inset 2px 2px 0 #0E0A07', borderRadius: '4px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '1px', fontSize: '0.92rem' }}>
                  MISSION OBJECTIVE
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#F1E3D3' }}>
                  <strong>PANAHON: Chrono Shift</strong> (Portal Anomaly Navigation and Historical Origin Network) is a strategic time-travel tabletop simulation.
                  Players take the mantle of <strong>Temporal Castaways</strong> deployed across Philippine history to repair catastrophic chronal breaches caused by displaced relics.
                  Operatives must decipher artifact clues, survive historical crises, cross Time Gates, and restore balance to the spacetime continuum.
                </p>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px', color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '1px', fontSize: '0.88rem' }}>
                  THE 4 HISTORICAL TIMELINES & RELICS
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {[
                    { name: 'Spanish Era (1521-1898)', color: '#E74C3C', relics: 'Silver Dos Mundos, Murillo Velarde Map, Concepcion Porcelain, Relicario' },
                    { name: 'American Era (1898-1946)', color: '#3498DB', relics: 'Quezon Typewriter, El Renacimiento Issue, Kellogg Magneto, Port Telephone' },
                    { name: 'Japanese Era (1942-1945)', color: '#2ECC71', relics: 'Death March Marker, Senninbari Belt, Guerrilla Transceiver, Capas Field Litter' },
                    { name: 'Myth & Legend (Ancient)', color: '#F39C12', relics: 'Cordillera Bulul, Batu-Balani Agimat, Kamagong Comb, Kris ng Datu' }
                  ].map((era, i) => (
                    <div key={i} style={{ background: '#1C1510', boxShadow: 'inset 2px 2px 0 #0F0A07', border: `1.5px solid ${era.color}60`, borderTop: `3px solid ${era.color}`, borderRadius: '4px', padding: '10px' }}>
                      <div style={{ color: era.color, fontWeight: 700, fontSize: '0.78rem', marginBottom: '4px', fontFamily: 'var(--font-display)' }}>{era.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#C8B293', lineHeight: 1.4 }}>{era.relics}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#1C1510', boxShadow: 'inset 2px 2px 0 #0F0A07', border: '2px solid #5A422D', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '1px', fontSize: '0.88rem' }}>
                  CORE OPERATIONAL LOOP
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', fontSize: '0.76rem', color: '#C8B293' }}>
                  <div style={{ padding: '8px 10px', background: '#251B12', border: '1px solid #4A3522', borderRadius: '4px' }}>
                    <strong style={{ color: '#FFD700', display: 'block', marginBottom: '2px', fontFamily: 'var(--font-display)' }}>1. Roll & Navigate</strong>
                    Traverse historical spaces, resolve Event & Danger encounters.
                  </div>
                  <div style={{ padding: '8px 10px', background: '#251B12', border: '1px solid #4A3522', borderRadius: '4px' }}>
                    <strong style={{ color: '#FFD700', display: 'block', marginBottom: '2px', fontFamily: 'var(--font-display)' }}>2. Decipher Clues</strong>
                    Collect 3 authentic clues matching a relic to unlock excavation.
                  </div>
                  <div style={{ padding: '8px 10px', background: '#251B12', border: '1px solid #4A3522', borderRadius: '4px' }}>
                    <strong style={{ color: '#FFD700', display: 'block', marginBottom: '2px', fontFamily: 'var(--font-display)' }}>3. Cross Gates</strong>
                    Spend 2 Energy to leap across historical eras via Time Gates.
                  </div>
                  <div style={{ padding: '8px 10px', background: '#251B12', border: '1px solid #4A3522', borderRadius: '4px' }}>
                    <strong style={{ color: '#FFD700', display: 'block', marginBottom: '2px', fontFamily: 'var(--font-display)' }}>4. Restore Spacetime</strong>
                    Deliver artifacts to authentic timelines before Breach Level 6!
                  </div>
                </div>
              </div>
            </div>
          )}

          {guideTab === 'roles' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
              {Object.entries(ROLES || {}).map(([key, role]) => (
                <div
                  key={key}
                  style={{
                    background: '#1C1510',
                    boxShadow: 'inset 2px 2px 0 #0F0A07',
                    border: '2px solid #5A422D',
                    borderLeft: `4px solid ${role?.color || '#C2974D'}`,
                    borderRadius: '4px',
                    padding: '12px',
                    display: 'flex',
                    gap: '12px'
                  }}
                >
                  <img
                    src={role?.avatar}
                    alt={role?.name || key}
                    style={{ width: '52px', height: '52px', borderRadius: '4px', objectFit: 'cover', border: `1.5px solid ${role?.color || '#C2974D'}` }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: role?.color || '#F8FAFC', fontWeight: 800, fontSize: '0.9rem', fontFamily: 'var(--font-display)' }}>
                      {role?.name || key}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#A89885', fontStyle: 'italic', marginBottom: '6px' }}>
                      {role?.description || 'Timeline Operative'}
                    </div>

                    <div style={{ fontSize: '0.74rem', marginBottom: '4px' }}>
                      <strong style={{ color: '#FFD700' }}>Passive ({role?.passive?.name || 'Inherent'}):</strong> {role?.passive?.description || 'None'}
                    </div>
                    <div style={{ fontSize: '0.74rem' }}>
                      <strong style={{ color: '#F59E0B' }}>Active ({role?.active?.name || 'Protocol'}):</strong> {role?.active?.description || 'None'}
                      <span style={{ color: '#A89885', marginLeft: '6px' }}>
                        (Cost: {role?.active?.energyCost ?? 0}⚡, CD: {role?.active?.cooldown ?? 0}T)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {guideTab === 'mechanics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#1C1510', boxShadow: 'inset 2px 2px 0 #0F0A07', border: '2px solid #5A422D', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#FFD700', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>⚡ ENERGY MANAGEMENT (0 - 10)</h4>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  Each operative starts with <strong>10 Chrono Energy</strong>. Traversing a Time Gate requires <strong>2 Energy</strong> (1 for Explorer). Reaching 0 Energy renders an operative <strong>Temporal Stranded</strong>. A stranded operative must spend their turn in <strong>Stasis Rest</strong> to recover <strong>+3 Energy</strong>.
                </p>
              </div>

              <div style={{ background: '#1C1510', boxShadow: 'inset 2px 2px 0 #0F0A07', border: '2px solid #5A422D', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#FFD700', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>⏪ REVERSE TIME PROTOCOL</h4>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  After rolling your movement die at the start of your turn, you can activate <strong>Reverse Time</strong> (-3 Chrono Energy, 2 Turn Cooldown) to flip your movement vector and walk backwards along the timeline using your rolled moves. This can only be activated at the <em>start of the turn</em> before taking any movement steps.
                </p>
              </div>

              <div style={{ background: '#1C1510', boxShadow: 'inset 2px 2px 0 #0F0A07', border: '2px solid #5A422D', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#FFD700', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>⏳ INDIVIDUAL PARADOX ACCUMULATION (0 - 5)</h4>
                <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>&bull; <strong>Level 0-1 (Equilibrium):</strong> Chronological harmony (+2 bonus score at debrief).</div>
                  <div>&bull; <strong>Level 2 (Minor Friction):</strong> Minor temporal strain (-1 Score penalty).</div>
                  <div>&bull; <strong>Level 3 (Temporal Drag):</strong> Immediate loss of 1 Chrono Energy.</div>
                  <div>&bull; <strong>Level 4 (Anomaly Rift):</strong> Immediately draws an unexpected Hazard Anomaly Card.</div>
                  <div>&bull; <strong>Level 5 (Critical Breach):</strong> Adds +2 to Shared Timeline Breach, inflicts -3 Score penalty, and resets individual meter to Level 2.</div>
                </div>
              </div>

              <div style={{ background: '#2A1412', border: '2px solid #8B251A', boxShadow: 'inset 2px 2px 0 #1A0A09', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#EF4444', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>💀 CATASTROPHIC BREACH LIMIT (SHARED 0 - 5)</h4>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  <strong>Failure Condition:</strong> When cumulative breaches cause the Shared Timeline Meter to exceed <strong>5 (Breach Level 6)</strong>, chronological stability completely shatters. <strong>Spacetime collapses, and all castaways immediately lose the mission!</strong>
                </p>
              </div>

              <div style={{ background: '#1C1510', boxShadow: 'inset 2px 2px 0 #0F0A07', border: '2px solid #5A422D', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#FFD700', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>🔍 ARTIFACT EXCAVATION PROTOCOL</h4>
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
                  <tr style={{ borderBottom: '2px solid #C2974D', textAlign: 'left' }}>
                    <th style={{ padding: '8px 6px', color: '#FFD700', fontFamily: 'var(--font-display)' }}>OPERATIONAL MILESTONE</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', color: '#FFD700', fontFamily: 'var(--font-display)' }}>STABILITY RATING</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Complete Assigned Timeline Mission', pts: '+10', color: '#34D399' },
                    { label: 'Return Relic to Authentic Timeline', pts: '+5', color: '#34D399' },
                    { label: 'Complete Secondary Directive', pts: '+2', color: '#34D399' },
                    { label: 'Authentic Clue Deciphered (per card)', pts: '+1 each', color: '#FFD700' },
                    { label: 'Chrono Energy Remaining (per unit)', pts: '+1 each', color: '#FFD700' },
                    { label: 'Paradox Equilibrium Maintained (Level 0-1)', pts: '+2', color: '#34D399' },
                    { label: 'Paradox Destabilization (Level 4-5)', pts: '-3', color: '#F87171' },
                    { label: 'Mission Directive Failure', pts: '-5', color: '#EF4444' }
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #3A2C21' }}>
                      <td style={{ padding: '8px 6px', color: '#F1E3D3' }}>{row.label}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 800, color: row.color, fontFamily: 'var(--font-display)' }}>{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '2px solid #5A422D' }}>
          <div style={{ fontSize: '0.72rem', color: '#A89885' }}>
            Tip: Press <kbd style={{ background: '#32261D', border: '1px solid #5A422D', padding: '2px 6px', borderRadius: '3px', color: '#FFD700', fontFamily: 'var(--font-display)' }}>ESC</kbd> anytime to return
          </div>
          <button
            className="btn btn-primary"
            onClick={handleClose}
            style={{
              padding: '8px 24px',
              fontSize: '0.84rem',
              fontWeight: 800,
              background: '#3A2C21',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #1A120B, 0 3px 0 #140E0A',
              color: '#FFD700',
              fontFamily: 'var(--font-display)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            Acknowledge Directives
          </button>
        </div>
      </div>
    </div>
  );
}
