import React, { useState, useEffect, useRef } from 'react';
import sounds from '../sound.js';
import { verifyStudioPin, setStudioUnlocked } from '../studioAuth.js';

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
    setTimeout(() => setIsShaking(false), 450);
  };

  const handleVerify = async (candidatePin) => {
    if (lockoutSeconds > 0 || isChecking) return;
    const testVal = candidatePin !== undefined ? candidatePin : pin;
    if (!testVal || testVal.trim().length === 0) {
      setErrorMsg('Please enter the PIN');
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
          setErrorMsg('Locked for 30s (5 failed attempts)');
        } else {
          setErrorMsg(`Incorrect PIN (${5 - nextAttempts} left)`);
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
      style={{
        zIndex: 14000,
        backdropFilter: 'blur(8px)',
        background: 'rgba(2, 6, 23, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && lockoutSeconds === 0) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '310px',
          background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.98) 0%, rgba(3, 7, 18, 0.98) 100%)',
          border: '1.5px solid rgba(99, 102, 241, 0.45)',
          boxShadow: '0 16px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(99, 102, 241, 0.25)',
          borderRadius: '14px',
          padding: '16px 18px',
          textAlign: 'center',
          boxSizing: 'border-box',
          position: 'relative',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          animation: isShaking ? 'pinShake 0.45s ease-in-out' : 'modalPop 0.22s ease-out'
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => { sounds.btnClick(); onClose(); }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '10px',
            background: 'none',
            border: 'none',
            color: '#64748B',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1
          }}
        >
          &times;
        </button>

        {/* Header Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '3px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.18)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.95rem'
          }}>
            🔒
          </div>
          <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#F8FAFC', letterSpacing: '0.3px' }}>
            Cartography Studio
          </span>
        </div>

        <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginBottom: '10px' }}>
          Developer Authorization Required
        </div>

        {/* PIN Input Field */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
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
              height: '38px',
              background: 'rgba(0, 0, 0, 0.6)',
              border: errorMsg ? '1.5px solid #EF4444' : '1.5px solid rgba(99, 102, 241, 0.5)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '1.3rem',
              letterSpacing: showMask ? '8px' : '3px',
              textAlign: 'center',
              padding: '4px 34px 4px 12px',
              outline: 'none',
              fontWeight: 800,
              boxSizing: 'border-box'
            }}
          />

          <button
            type="button"
            onClick={() => { sounds.btnClick(); setShowMask(!showMask); }}
            title={showMask ? 'Show PIN' : 'Hide PIN'}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              fontSize: '0.95rem',
              padding: '3px'
            }}
          >
            {showMask ? '👁️' : '🙈'}
          </button>
        </div>

        {/* Status / Error Message */}
        {errorMsg && (
          <div style={{
            color: '#F87171',
            fontSize: '0.68rem',
            fontWeight: 700,
            marginBottom: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            padding: '3px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {errorMsg}
          </div>
        )}

        {lockoutSeconds > 0 && (
          <div style={{
            color: '#FBBF24',
            fontSize: '0.68rem',
            fontWeight: 700,
            marginBottom: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            padding: '3px 6px',
            borderRadius: '4px',
            border: '1px solid rgba(245, 158, 11, 0.35)'
          }}>
            ⏳ Cooldown active: {lockoutSeconds}s
          </div>
        )}

        {/* Number Pad Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '5px',
          marginBottom: '10px'
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={lockoutSeconds > 0 || isChecking}
              onClick={() => handleNumberClick(String(num))}
              style={{
                height: '35px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#F8FAFC',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: lockoutSeconds > 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.1s ease',
                padding: 0
              }}
              onMouseEnter={(e) => { if (lockoutSeconds === 0) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'; }}
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
              height: '35px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: '#94A3B8',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: (lockoutSeconds > 0 || pin.length === 0) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            CLR
          </button>

          <button
            type="button"
            disabled={lockoutSeconds > 0 || isChecking}
            onClick={() => handleNumberClick('0')}
            style={{
              height: '35px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#F8FAFC',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: lockoutSeconds > 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
            onMouseEnter={(e) => { if (lockoutSeconds === 0) e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
          >
            0
          </button>

          <button
            type="button"
            disabled={lockoutSeconds > 0 || isChecking || pin.length === 0}
            onClick={handleBackspace}
            style={{
              height: '35px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              color: '#94A3B8',
              fontSize: '0.95rem',
              cursor: (lockoutSeconds > 0 || pin.length === 0) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0
            }}
          >
            ⌫
          </button>
        </div>

        {/* Bottom Actions Row */}
        <div style={{ display: 'flex', gap: '6px', height: '34px' }}>
          <button
            type="button"
            onClick={() => { sounds.btnClick(); onClose(); }}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              color: '#CBD5E1',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={lockoutSeconds > 0 || isChecking || pin.length === 0}
            onClick={() => handleVerify()}
            style={{
              flex: 1.5,
              background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
              border: '1px solid #818CF8',
              borderRadius: '6px',
              color: '#FFF',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: (lockoutSeconds > 0 || isChecking || pin.length === 0) ? 'not-allowed' : 'pointer',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            {isChecking ? 'Verifying...' : 'Unlock Studio ➔'}
          </button>
        </div>

        {/* Security badge note */}
        <div style={{ fontSize: '0.60rem', color: '#64748B', marginTop: '10px' }}>
          🔒 Salted SHA-256 Encrypted
        </div>
      </div>
    </div>
  );
}
