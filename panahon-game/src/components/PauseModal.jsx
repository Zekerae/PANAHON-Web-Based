import React, { useEffect, useState } from 'react';
import sounds from '../sound.js';
import { useGuiScale, resetGuiScale } from '../guiScale.js';
import { ROLES, ERA_NAMES } from '../gameData.js';

export default function PauseModal({
  isOpen,
  onResume,
  onOpenGuide,
  onOpenDebug,
  soundMuted,
  onToggleSound,
  onSaveAndExit,
  onAbandonGame,
  state,
  network
}) {
  const [copied, setCopied] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [guiScale, setGuiScale] = useGuiScale();

  useEffect(() => {
    if (!isOpen) {
      setConfirmAbandon(false);
      setCopied(false);
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        sounds.btnClick();
        onResume();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onResume]);

  if (!isOpen) return null;

  const isOnline = network?.mode === 'online';
  const currentPlayer = state?.players?.[state?.currentPlayerIndex];
  const roleName = currentPlayer ? (ROLES[currentPlayer.roleKey]?.name || currentPlayer.roleKey) : '';
  const currentEra = currentPlayer?.currentEra ? (ERA_NAMES[currentPlayer.currentEra] || currentPlayer.currentEra) : '';
  const timelineLevel = state?.timelineMeter ?? 0;

  let timelineClass = 'safe';
  if (timelineLevel >= 4) timelineClass = 'danger';
  else if (timelineLevel >= 2) timelineClass = 'warning';

  const handleCopyCode = () => {
    if (network?.roomCode) {
      navigator.clipboard.writeText(network.roomCode);
      setCopied(true);
      sounds.btnClick();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay pause-modal-overlay" onClick={onResume} style={{ zIndex: 12000 }}>
      <div
        className="modal pause-modal animate-scale-up mobile-compact-pause hide-scrollbar"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
        style={{
          maxWidth: '430px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '18px 20px',
          boxSizing: 'border-box'
        }}
      >
        {/* Pause Modal Header */}
        <div className="pause-header" style={{ marginBottom: '12px' }}>
          <div className="pause-icon-badge" style={{ width: '42px', height: '42px', fontSize: '1.2rem', marginBottom: '6px' }}>
            <div className="pause-icon-bars">
              <span></span>
              <span></span>
            </div>
          </div>
          <h2 id="pause-title" className="pause-title" style={{ fontSize: '1.3rem', letterSpacing: '2.5px' }}>
            MISSION PAUSED
          </h2>
          <div className="pause-subtitle" style={{ fontSize: '0.74rem', color: '#C8B293', marginTop: '2px' }}>
            Temporal anomaly suspended
          </div>
        </div>

        {/* Mission Telemetry Summary */}
        <div className="pause-telemetry" style={{ padding: '10px 14px', gap: '6px', marginBottom: '14px' }}>
          <div className="pause-telemetry-row">
            <span className="telemetry-label">Timeline Breach:</span>
            <span className={`telemetry-val ${timelineClass}`}>
              {Math.min(5, timelineLevel)} / 5 BREACH
            </span>
          </div>
          <div className="pause-telemetry-row">
            <span className="telemetry-label">Current Turn:</span>
            <span className="telemetry-val text-accent">
              Round {state?.turnNumber || 1} &bull; {currentPlayer?.name} ({roleName})
            </span>
          </div>
          {currentEra && (
            <div className="pause-telemetry-row">
              <span className="telemetry-label">Active Sector:</span>
              <span className="telemetry-val">{currentEra}</span>
            </div>
          )}

          {isOnline && network?.roomCode && (
            <div className="pause-online-badge">
              <span>🌐 Online Room: <strong>{network.roomCode}</strong></span>
              <button
                className="btn btn-copy-code"
                onClick={handleCopyCode}
                title="Copy Room Code to clipboard"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Pause Action Buttons */}
        <div className="pause-actions" style={{ gap: '8px' }}>
          <button
            className="btn btn-primary pause-btn-resume"
            style={{
              padding: '11px 14px',
              fontSize: '0.84rem',
              minWidth: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(180deg, #4D3826 0%, #352518 100%)',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 3px 0 #120E0A',
              color: '#FFD700',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '1px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => {
              sounds.btnClick();
              onResume();
            }}
          >
            ▶ RESUME MISSION <span className="key-hint" style={{ background: '#140E0A', border: '1px solid #5A422D', color: '#F5C442' }}>ESC</span>
          </button>

          <button
            id="pause-btn-manual"
            className="btn btn-secondary pause-btn pause-btn-manual"
            style={{
              padding: '10px 14px',
              fontSize: '0.80rem',
              minWidth: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(180deg, #382A1B 0%, #22180F 100%)',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A',
              color: '#FEF3C7',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => {
              sounds.btnClick();
              if (onOpenGuide) onOpenGuide();
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>📖</span> RULES & FIELD MANUAL
          </button>

          <button
            className="btn btn-secondary pause-btn"
            style={{
              padding: '10px 14px',
              fontSize: '0.80rem',
              minWidth: 0,
              width: '100%',
              background: 'linear-gradient(180deg, #382A1B 0%, #22180F 100%)',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A',
              color: '#FEF3C7',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => {
              onToggleSound();
            }}
          >
            {soundMuted ? '🔇 AUDIO: MUTED (CLICK TO UNMUTE)' : '🔊 AUDIO: ON (CLICK TO MUTE)'}
          </button>

          <button
            id="pause-btn-debug-logs"
            className="btn btn-secondary pause-btn"
            style={{
              padding: '10px 14px',
              fontSize: '0.80rem',
              minWidth: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(180deg, #2D1F15 0%, #1A120C 100%)',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A',
              color: '#FFD700',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => {
              sounds.btnClick();
              if (onOpenDebug) onOpenDebug();
            }}
          >
            <span style={{ fontSize: '0.95rem' }}>📋</span> GAME LOGS & DIAGNOSTICS <span className="key-hint" style={{ background: '#140E0A', border: '1px solid #5A422D', color: '#F5C442' }}>`</span>
          </button>

          {/* GUI Scaling Adjustment Control */}
          <div className="pause-scale-box" style={{
            background: 'linear-gradient(180deg, #2D2016 0%, #1A120B 100%)',
            border: '2px solid #C2974D',
            boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 3px 6px rgba(0,0,0,0.6)',
            borderRadius: '4px',
            padding: '10px 14px',
            boxSizing: 'border-box',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.95rem' }}>🖥️</span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#FFD700',
                  letterSpacing: '0.8px'
                }}>
                  GUI SCALING
                </span>
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
              style={{
                width: '100%',
                accentColor: '#C2974D',
                cursor: 'pointer',
                margin: '2px 0'
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
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
                    padding: '5px 2px',
                    fontSize: '0.62rem',
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
            <div style={{ fontSize: '0.62rem', color: '#C8B293', textAlign: 'center', marginTop: '1px', lineHeight: 1.45 }}>
              ⭐ 120% recommended for PC &bull; Press <kbd style={{ padding: '1px 5px', fontSize: '0.60rem', background: '#140E0A', border: '1px solid #5A422D', color: '#F5C442' }}>Alt + 0</kbd> anytime to reset
            </div>
          </div>

          {!isOnline && (
            <button
              className="btn btn-secondary pause-btn"
              style={{
                padding: '10px 14px',
                fontSize: '0.80rem',
                minWidth: 0,
                width: '100%',
                background: 'linear-gradient(180deg, #382A1B 0%, #22180F 100%)',
                border: '2px solid #C2974D',
                boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A',
                color: '#FEF3C7',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => {
                sounds.btnClick();
                onSaveAndExit();
              }}
            >
              💾 SAVE & QUIT TO MENU
            </button>
          )}

          {!confirmAbandon ? (
            <button
              className="btn pause-btn-abandon"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.80rem',
                minWidth: 0,
                marginTop: '4px',
                borderRadius: '4px',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                letterSpacing: '0.8px',
                background: 'linear-gradient(180deg, #301916 0%, #1F0E0C 100%)',
                border: '2px solid #8C3A3A',
                boxShadow: 'inset 1px 1px 0 rgba(235, 120, 120, 0.2), inset -1px -1px 0 #120705, 0 2px 0 #0E0504',
                color: '#FCA5A5',
                cursor: 'pointer'
              }}
              onClick={() => {
                sounds.btnClick();
                setConfirmAbandon(true);
              }}
            >
              🚪 {isOnline ? 'LEAVE ONLINE ROOM' : 'ABANDON MISSION'}
            </button>
          ) : (
            <div
              className="pause-confirm-box"
              style={{
                background: 'linear-gradient(180deg, #2D1A16 0%, #1A0E0C 100%)',
                border: '2px solid #8C3A3A',
                boxShadow: 'inset 1px 1px 0 rgba(235, 120, 120, 0.2), inset -1px -1px 0 #120705, 0 4px 12px rgba(0, 0, 0, 0.7)',
                borderRadius: '4px',
                padding: '12px 14px',
                marginTop: '6px',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <p
                className="pause-confirm-text"
                style={{
                  fontSize: '0.74rem',
                  color: '#FECACA',
                  margin: '0 0 10px 0',
                  lineHeight: 1.45,
                  textAlign: 'center',
                  letterSpacing: '0.3px'
                }}
              >
                ⚠️ {isOnline
                  ? 'Disconnect from current room? Other castaways will continue.'
                  : 'Abandon mission? All unsaved expedition progress will be lost.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                <button
                  type="button"
                  onClick={() => {
                    sounds.btnClick();
                    onAbandonGame();
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '38px',
                    padding: '0 10px',
                    background: 'linear-gradient(180deg, #8B2525 0%, #5C1818 100%)',
                    border: '2px solid #DC2626',
                    boxShadow: 'inset 1px 1px 0 #F87171, inset -1px -1px 0 #3A0C0C, 0 2px 0 #120505',
                    borderRadius: '4px',
                    color: '#FEE2E2',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ⚠️ Yes, Abandon
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.btnClick();
                    setConfirmAbandon(false);
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '38px',
                    padding: '0 10px',
                    background: 'linear-gradient(180deg, #3D2D1E 0%, #251B12 100%)',
                    border: '2px solid #C2974D',
                    boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A',
                    borderRadius: '4px',
                    color: '#FFD700',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ← Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pause-footer-hint" style={{ marginTop: '12px', fontSize: '0.7rem', color: '#8C7764' }}>
          Tip: Press <kbd style={{ padding: '1px 5px', fontSize: '0.68rem', background: '#140E0A', border: '1px solid #5A422D', color: '#F5C442' }}>ESC</kbd> anytime during gameplay to pause or resume.
        </div>
      </div>
    </div>
  );
}
