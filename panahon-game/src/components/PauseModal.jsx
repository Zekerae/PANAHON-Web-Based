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
    <div className="modal-overlay pause-modal-overlay" onClick={onResume}>
      <div
        className="modal pause-modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
      >
        {/* Pause Modal Header */}
        <div className="pause-header">
          <div className="pause-icon-badge">
            <div className="pause-icon-bars">
              <span></span>
              <span></span>
            </div>
          </div>
          <h2 id="pause-title" className="pause-title">MISSION PAUSED</h2>
          <div className="pause-subtitle">Temporal anomaly suspended</div>
        </div>

        {/* Mission Telemetry Summary */}
        <div className="pause-telemetry">
          <div className="pause-telemetry-row">
            <span className="telemetry-label">Timeline Breach:</span>
            <span className={`telemetry-val ${timelineClass}`}>
              {Math.min(5, timelineLevel)} / 5 BREACH
            </span>
          </div>
          <div className="pause-telemetry-row">
            <span className="telemetry-label">Current Turn:</span>
            <span className="telemetry-val text-accent">
              Round {state?.turnNumber || 1} • {currentPlayer?.name} ({roleName})
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
        <div className="pause-actions">
          <button
            className="btn btn-primary pause-btn-resume"
            onClick={() => {
              sounds.btnClick();
              onResume();
            }}
          >
            ▶ RESUME MISSION <span className="key-hint">ESC</span>
          </button>

          <button
            className="btn btn-secondary pause-btn"
            onClick={() => {
              sounds.btnClick();
              onOpenGuide();
            }}
          >
            📖 RULES & FIELD MANUAL
          </button>

          <button
            className="btn btn-secondary pause-btn"
            onClick={() => {
              onToggleSound();
            }}
          >
            {soundMuted ? '🔇 AUDIO: MUTED (Click to Unmute)' : '🔊 AUDIO: ON (Click to Mute)'}
          </button>

          <button
            className="btn btn-secondary pause-btn"
            style={{ borderColor: 'rgba(52, 152, 219, 0.45)', color: '#70b9eb' }}
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
              onClick={() => {
                sounds.btnClick();
                setConfirmAbandon(true);
              }}
            >
              🚪 {isOnline ? 'LEAVE ONLINE ROOM' : 'ABANDON MISSION'}
            </button>
          ) : (
            <div className="pause-confirm-box">
              <p className="pause-confirm-text">
                {isOnline
                  ? 'Disconnect from current room? Other castaways will continue.'
                  : 'Abandon mission? Progress will be lost.'}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  className="btn btn-danger"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={() => {
                    sounds.btnClick();
                    onAbandonGame();
                  }}
                >
                  Yes, Abandon
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={() => {
                    sounds.btnClick();
                    setConfirmAbandon(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pause-footer-hint">
          Tip: Press <kbd>ESC</kbd> anytime during gameplay to pause or resume.
        </div>
      </div>
    </div>
  );
}
