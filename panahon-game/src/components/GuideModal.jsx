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
            { id: 'scoring', label: 'FIFO Victory Protocol', icon: '🏆' }
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

              {/* KEYBOARD SHORTCUTS REFERENCE */}
              <div style={{ background: '#1C1510', boxShadow: 'inset 2px 2px 0 #0F0A07', border: '2px solid #5A422D', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#FFD700', fontFamily: 'var(--font-display)', letterSpacing: '1px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⌨️</span> KEYBOARD SHORTCUTS & FIELD CONTROLS
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px', fontSize: '0.76rem' }}>
                  <div style={{ padding: '8px 10px', background: '#251B12', border: '1px solid #4A3522', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#E2E8F0' }}>Roll Die / Step / Advance</span>
                    <kbd style={{ background: '#140E0A', border: '1px solid #C2974D', color: '#FFD700', padding: '2px 7px', borderRadius: '3px', fontFamily: 'var(--font-display)', fontSize: '0.68rem' }}>SPACE / ENTER</kbd>
                  </div>
                  <div style={{ padding: '8px 10px', background: '#251B12', border: '1px solid #4A3522', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#E2E8F0' }}>Activate Operative Skill</span>
                    <kbd style={{ background: '#140E0A', border: '1px solid #F5C442', color: '#FFD700', padding: '2px 7px', borderRadius: '3px', fontFamily: 'var(--font-display)', fontSize: '0.68rem' }}>Q or S</kbd>
                  </div>
                  <div style={{ padding: '8px 10px', background: '#251B12', border: '1px solid #4A3522', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#E2E8F0' }}>End / Pass Turn</span>
                    <kbd style={{ background: '#140E0A', border: '1px solid #38BDF8', color: '#38BDF8', padding: '2px 7px', borderRadius: '3px', fontFamily: 'var(--font-display)', fontSize: '0.68rem' }}>E or T</kbd>
                  </div>
                  <div style={{ padding: '8px 10px', background: '#251B12', border: '1px solid #4A3522', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#E2E8F0' }}>Pause Menu / Dismiss</span>
                    <kbd style={{ background: '#140E0A', border: '1px solid #5A422D', color: '#F5C442', padding: '2px 7px', borderRadius: '3px', fontFamily: 'var(--font-display)', fontSize: '0.68rem' }}>ESC</kbd>
                  </div>
                  <div style={{ padding: '8px 10px', background: '#251B12', border: '1px solid #4A3522', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#E2E8F0' }}>Move Step (Manual)</span>
                    <kbd style={{ background: '#140E0A', border: '1px solid #5A422D', color: '#CBD5E1', padding: '2px 7px', borderRadius: '3px', fontFamily: 'var(--font-display)', fontSize: '0.68rem' }}>&larr; / &rarr;</kbd>
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
                  <div>&bull; <strong>Level 0-1 (Stable):</strong> Chronological harmony (Visual calm aura on HUD).</div>
                  <div>&bull; <strong>Level 2 (Minor Friction):</strong> Visual micro-frictions appear on HUD.</div>
                  <div>&bull; <strong>Level 3 (Temporal Strain):</strong> Chronal friction immediately drains 2 Chrono Energy.</div>
                  <div>&bull; <strong>Level 4 (Anomaly Trigger):</strong> Immediately draws and resolves a Danger Card from the current era.</div>
                  <div>&bull; <strong>Level 5 (Critical Breach):</strong> Adds +2 to Shared Timeline Meter, player is Stunned (skips next movement phase), and Paradox resets to Level 2.</div>
                </div>
              </div>

              <div style={{ background: '#2A1412', border: '2px solid #8B251A', boxShadow: 'inset 2px 2px 0 #1A0A09', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#EF4444', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>💀 GLOBAL TIMELINE COLLAPSE (SHARED 0 - 5)</h4>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>
                  <strong>Global Lose Override:</strong> If the Shared Timeline Meter surpasses <strong>5 (reaches 6 Breach)</strong> at any point, spacetime collapses completely into total entropy. <strong>ALL players immediately lose the game regardless of FIFO placement ranks!</strong>
                </p>
              </div>

              <div style={{ background: '#1C1510', boxShadow: 'inset 2px 2px 0 #0F0A07', border: '2px solid #5A422D', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#FFD700', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>🔍 3-STEP DISPLACED ARTIFACT LOOP</h4>
                <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div>&bull; <strong>Phase 1 (Research in Home Era):</strong> Travel to the relic's native Origin Era and gather 3 matching clues from that quadrant's Clue Deck.</div>
                  <div>&bull; <strong>Phase 2 (Retrieval in Displaced Era):</strong> Relics spawn in a DIFFERENT quadrant than their Origin Era. Once 3 clues are gathered, the Displaced Era is highlighted on your HUD. Travel there via Time Gate and land on the Artifact Tile to claim it!</div>
                  <div>&bull; <strong>Phase 3 (Return to Origin Era):</strong> Transport the relic back to its native Origin Era and land on the Return/Artifact Tile to restore history and lock in your FIFO placement rank!</div>
                  <div>&bull; <strong>Contamination Penalties:</strong> Attempting to pick up an artifact before collecting 3 clues, or transporting an artifact into an era that is neither its Displaced Era nor Origin Era, immediately increases Individual Paradox by +1!</div>
                </div>
              </div>
            </div>
          )}

          {guideTab === 'scoring' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#1C1510', border: '1.5px solid #C2974D', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#FFD700', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>🏆 FIFO PLACEMENT RANKING SYSTEM</h4>
                <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                  Points have been completely replaced with a <strong>First-In, First-Out (FIFO) Placement Queue</strong>:
                </p>
                <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>🥇 <strong>1st Place:</strong> First player to collect 3 clues, claim their target displaced relic, and return it to its native Origin Era.</div>
                  <div>🥈 <strong>2nd Place:</strong> Second player to successfully restore their mission relic.</div>
                  <div>🥉 <strong>3rd Place:</strong> Third player to successfully restore their mission relic.</div>
                  <div>🎖️ <strong>4th Place:</strong> Fourth player to restore relic (or remaining players ranked by: <em>Artifact Acquired &gt; Clues Collected &gt; Lowest Paradox</em> if 40-minute timer expires).</div>
                </div>
              </div>

              <div style={{ background: '#1C1510', border: '1.5px solid #38BDF8', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#38BDF8', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>🤝 COOPERATIVE SPECTATE MODE</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                  When you return your relic, your placement rank is locked in! You may then spectate or use cooperative actions on your turn:
                  <br />&bull; <strong>Stabilize Timeline (-2 Energy):</strong> Reduces Shared Timeline Breach by 1.
                  <br />&bull; <strong>Energy Transfer (-2 Energy):</strong> Transmit energy to an active operative.
                  <br />Help your team finish before the Shared Timeline Meter surpasses 5 (reaches 6) to avoid a catastrophic Timeline Collapse!
                </p>
              </div>

              <div style={{ background: '#2A1412', border: '1.5px solid #EF4444', borderRadius: '4px', padding: '12px 14px' }}>
                <h4 style={{ margin: '0 0 6px', color: '#EF4444', fontSize: '0.88rem', fontFamily: 'var(--font-display)' }}>💀 GLOBAL TIMELINE COLLAPSE OVERRIDE</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#FCA5A5', lineHeight: 1.4 }}>
                  If the Shared Timeline Breach surpasses <strong>5 (reaches 6)</strong> at any point in the match, <strong>ALL players immediately lose</strong>, voiding any individual FIFO victory ranks!
                </p>
              </div>
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
