import React, { useState, useEffect, useRef } from 'react';
import sounds from '../sound.js';
import { verifyStudioPin, setStudioUnlocked, isStudioUnlocked } from '../studioAuth.js';

export default function StudioPinModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [showMask, setShowMask] = useState(true);
  const [isShaking, setIsShaking] = useState(false);

  // Rate limiting & lockout state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsChecking(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setFailedAttempts(0);
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  if (!isOpen) return null;

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleVerify = async (candidatePin) => {
    if (lockoutSeconds > 0 || isChecking) return;
    const testVal = candidatePin !== undefined ? candidatePin : pin;
    if (!testVal || testVal.trim().length === 0) {
      setErrorMsg('Please enter the Developer PIN');
      triggerShake();
      return;
    }

    setIsChecking(true);
    setErrorMsg('');

    try {
      const isValid = await verifyStudioPin(testVal);
      if (isValid) {
        sounds.portal();
        setStudioUnlocked(true);
        setPin('');
        setErrorMsg('');
        if (onSuccess) onSuccess();
      } else {
        sounds.btnClick();
        triggerShake();
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          setLockoutSeconds(30);
          setErrorMsg('Security lockout: 5 failed attempts. Please wait 30 seconds.');
        } else {
          setErrorMsg(`Incorrect PIN (${5 - nextAttempts} attempt${5 - nextAttempts === 1 ? '' : 's'} remaining)`);
        }
        setPin('');
      }
    } catch (_) {
      setErrorMsg('Verification error. Please retry.');
    } finally {
      setIsChecking(false);
      inputRef.current?.focus();
    }
  };

  const handleNumberClick = (digit) => {
    if (lockoutSeconds > 0) return;
    sounds.btnClick();
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg('');
      // Auto verify if reached 4 digits
      if (nextPin.length === 4) {
        handleVerify(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (lockoutSeconds > 0) return;
    sounds.btnClick();
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    sounds.btnClick();
    setPin('');
    setErrorMsg('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 14000, backdropFilter: 'blur(10px)', background: 'rgba(2, 6, 23, 0.88)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && lockoutSeconds === 0) onClose();
      }}
    >
      <div
        className="modal duelyst-modal"
        style={{
          maxWidth: '380px',
          width: '92%',
          background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.98) 0%, rgba(3, 7, 18, 0.98) 100%)',
          border: '1.5px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 0 35px rgba(99, 102, 241, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '24px 20px',
          textAlign: 'center',
          animation: isShaking ? 'pinShake 0.45s ease-in-out' : 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <button
          className="modal-close"
          onClick={() => { sounds.btnClick(); onClose(); }}
          style={{ top: '12px', right: '14px', fontSize: '1.2rem', color: '#94A3B8' }}
        >
          &times;
        </button>

        {/* Header Icon & Title */}
        <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', marginBottom: '10px' }}>
          <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))' }}>🔒</span>
        </div>

        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.5px' }}>
          Cartography Studio
        </div>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px', marginBottom: '18px' }}>
          Developer Authorization Required
        </div>

        {/* PIN Display Field */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input
            ref={inputRef}
            type={showMask ? 'password' : 'text'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            value={pin}
            disabled={lockoutSeconds > 0 || isChecking}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setPin(val);
              setErrorMsg('');
              if (val.length === 4) handleVerify(val);
            }}
            onKeyDown={handleKeyDown}
            placeholder={lockoutSeconds > 0 ? `Locked (${lockoutSeconds}s)` : '••••'}
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.55)',
              border: errorMsg ? '1.5px solid #EF4444' : '1.5px solid rgba(99, 102, 241, 0.5)',
              borderRadius: '10px',
              color: '#F8FAFC',
              fontSize: '1.6rem',
              letterSpacing: showMask ? '10px' : '4px',
              textAlign: 'center',
              padding: '10px 42px 10px 16px',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
              fontWeight: 800
            }}
          />

          <button
            type="button"
            onClick={() => { sounds.btnClick(); setShowMask(!showMask); }}
            title={showMask ? 'Show PIN' : 'Hide PIN'}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '4px'
            }}
          >
            {showMask ? '👁️' : '🙈'}
          </button>
        </div>

        {/* Error / Status Message */}
        {errorMsg && (
          <div style={{
            color: '#F87171',
            fontSize: '0.74rem',
            fontWeight: 700,
            marginBottom: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '5px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {errorMsg}
          </div>
        )}

        {lockoutSeconds > 0 && (
          <div style={{
            color: '#FBBF24',
            fontSize: '0.75rem',
            fontWeight: 700,
            marginBottom: '12px',
            background: 'rgba(245, 158, 11, 0.12)',
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.35)'
          }}>
            ⏳ Cooldown active: {lockoutSeconds}s remaining
          </div>
        )}

        {/* Interactive Number Pad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={lockoutSeconds > 0 || isChecking}
              onClick={() => handleNumberClick(String(num))}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#F8FAFC',
                fontSize: '1.15rem',
                fontWeight: 700,
                padding: '10px 0',
                cursor: lockoutSeconds > 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => { if (lockoutSeconds === 0) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            disabled={lockoutSeconds > 0 || isChecking || pin.length === 0}
            onClick={handleClear}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#94A3B8',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '10px 0',
              cursor: (lockoutSeconds > 0 || pin.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            CLEAR
          </button>

          <button
            type="button"
            disabled={lockoutSeconds > 0 || isChecking}
            onClick={() => handleNumberClick('0')}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '1.15rem',
              fontWeight: 700,
              padding: '10px 0',
              cursor: lockoutSeconds > 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.12s ease'
            }}
            onMouseEnter={(e) => { if (lockoutSeconds === 0) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
          >
            0
          </button>

          <button
            type="button"
            disabled={lockoutSeconds > 0 || isChecking || pin.length === 0}
            onClick={handleBackspace}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#94A3B8',
              fontSize: '1rem',
              padding: '10px 0',
              cursor: (lockoutSeconds > 0 || pin.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            ⌫
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
            onClick={() => { sounds.btnClick(); onClose(); }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={lockoutSeconds > 0 || isChecking || pin.length === 0}
            onClick={() => handleVerify()}
            style={{
              flex: 1.5,
              padding: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
              borderColor: '#818CF8'
            }}
          >
            {isChecking ? 'Verifying...' : 'Unlock Studio ➔'}
          </button>
        </div>

        {/* Security badge note */}
        <div style={{ fontSize: '0.62rem', color: 'rgba(255, 255, 255, 0.35)', marginTop: '14px' }}>
          🔒 Protected by Salted SHA-256 One-Way Encryption
        </div>
      </div>
    </div>
  );
}
