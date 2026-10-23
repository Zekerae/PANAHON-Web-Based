import React, { useEffect, useState } from 'react';
import sounds from '../sound.js';
import { ROLES, ERA_NAMES } from '../gameData.js';

export default function PauseModal({
  isOpen,
  onResume,
  onOpenGuide,
  soundMuted,
  onToggleSound,
  onSaveAndExit,
  onAbandonGame,
  state,
  network
}) {
  const [copied, setCopied] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

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
        className="modal pause-modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
        style={{
          maxWidth: '430px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
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
          <div className="pause-subtitle" style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
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
            style={{ padding: '10px', fontSize: '0.88rem', minWidth: 0, width: '100%' }}
            onClick={() => {
              sounds.btnClick();
              onResume();
            }}
          >
            ▶ RESUME MISSION <span className="key-hint">ESC</span>
          </button>

          <button
            className="btn btn-secondary pause-btn"
            style={{ padding: '9px 12px', fontSize: '0.8rem', minWidth: 0, width: '100%' }}
            onClick={() => {
              sounds.btnClick();
              onOpenGuide();
            }}
          >
            📖 RULES & FIELD MANUAL
          </button>

          <button
            className="btn btn-secondary pause-btn"
            style={{ padding: '9px 12px', fontSize: '0.8rem', minWidth: 0, width: '100%' }}
            onClick={() => {
              onToggleSound();
            }}
          >
            {soundMuted ? '🔇 AUDIO: MUTED (Click to Unmute)' : '🔊 AUDIO: ON (Click to Mute)'}
          </button>

          <button
            className="btn btn-secondary pause-btn"
            style={{ borderColor: 'rgba(52, 152, 219, 0.45)', color: '#70b9eb', padding: '9px 12px', fontSize: '0.8rem', minWidth: 0, width: '100%' }}
            onClick={() => {
              sounds.btnClick();
              onSaveAndExit();
            }}
          >
            💾 SAVE & QUIT TO MENU
          </button>

          {!confirmAbandon ? (
            <button
              className="btn pause-btn-abandon"
              style={{ padding: '9px 12px', fontSize: '0.8rem', minWidth: 0, width: '100%', marginTop: '2px' }}
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
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1.5px solid rgba(239, 68, 68, 0.45)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginTop: '4px',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <p
                className="pause-confirm-text"
                style={{
                  fontSize: '0.78rem',
                  color: '#FECACA',
                  margin: '0 0 10px 0',
                  lineHeight: 1.4,
                  textAlign: 'center'
                }}
              >
                {isOnline
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
                    height: '36px',
                    padding: '0 8px',
                    background: 'linear-gradient(135deg, #DC2626, #EF4444)',
                    border: '1px solid #F87171',
                    borderRadius: '6px',
                    color: '#FFF',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  Yes, Abandon
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
                    height: '36px',
                    padding: '0 8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#CBD5E1',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pause-footer-hint" style={{ marginTop: '12px', fontSize: '0.7rem', color: '#64748B' }}>
          Tip: Press <kbd style={{ padding: '1px 5px', fontSize: '0.68rem' }}>ESC</kbd> anytime during gameplay to pause or resume.
        </div>
      </div>
    </div>
  );
}
