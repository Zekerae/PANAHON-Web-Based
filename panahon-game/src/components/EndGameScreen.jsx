import React, { useEffect } from 'react';
import { recordMatchCompletion } from '../temporalRecords.js';
import { getSavedProfile } from '../sessionManager.js';
import sounds from '../sound.js';

export default function EndGameScreen({ state, onPlayAgain, onBackMenu, isSpectator = false }) {
  if (!state) return null;

  const isCollapse = state.endReason === 'collapse' || state.timelineMeter > 5;
  const sortedPlayers = [...state.players].sort((a, b) => (a.placementRank || 99) - (b.placementRank || 99));
  const winner = isCollapse ? null : (sortedPlayers.find(p => p.placementRank === 1) || sortedPlayers[0]);

  useEffect(() => {
    if (!isSpectator && state) {
      try {
        const prof = getSavedProfile();
        recordMatchCompletion(state, prof?.name);
      } catch (err) {
        console.warn('Failed to record match completion:', err);
      }
    }
  }, [state, isSpectator]);

  return (
    <div
      className="endgame-screen duelyst-theme"
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 25%, #0B192C 0%, #060D17 65%, #020617 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '40px 20px 60px',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}
    >
      {isSpectator && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(180deg, #2D2016 0%, #1A120B 100%)',
          border: '1.5px solid #C2974D',
          boxShadow: 'inset 1px 1px 0 rgba(235, 198, 105, 0.2), 0 3px 6px rgba(0,0,0,0.6)',
          padding: '6px 16px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 800,
          color: '#FFD700',
          letterSpacing: '1px',
          marginBottom: '16px'
        }}>
          <span>👁️</span> OBSERVER TELEMETRY COMPLETED
        </div>
      )}

      {/* Top Chrono Orb Emblem */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: isCollapse
          ? 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(15, 23, 42, 0.9) 70%)'
          : 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, rgba(15, 23, 42, 0.9) 70%)',
        border: isCollapse ? '2px solid #EF4444' : '2px solid #F59E0B',
        boxShadow: isCollapse
          ? '0 0 35px rgba(239, 68, 68, 0.45)'
          : '0 0 35px rgba(245, 158, 11, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2.4rem',
        marginBottom: '16px'
      }}>
        {isCollapse ? '💀' : '🏆'}
      </div>

      {/* Main Title & Lore Subtitle */}
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.1rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          margin: '0 0 8px',
          textAlign: 'center',
          color: isCollapse ? '#EF4444' : '#F59E0B',
          textShadow: isCollapse
            ? '0 0 25px rgba(239, 68, 68, 0.6)'
            : '0 0 25px rgba(245, 158, 11, 0.6)'
        }}
      >
        {isCollapse ? '💀 TIMELINE COLLAPSE: ALL OPERATIVES LOST 💀' : '🏆 TIMELINE RESTORATION ACCOMPLISHED'}
      </h1>

      <p
        style={{
          fontSize: '0.88rem',
          color: '#94A3B8',
          maxWidth: '650px',
          textAlign: 'center',
          lineHeight: 1.6,
          margin: '0 0 30px'
        }}
      >
        {isCollapse
          ? 'GLOBAL LOSE OVERRIDE: The Shared Timeline Breach surpassed stability limits (exceeded 5)! Spacetime stability shattered into total entropy. ALL operatives lose the expedition regardless of individual FIFO placement rank.'
          : `Spacetime equilibrium has been successfully re-anchored through the FIFO Artifact Return Protocol! Congratulations to Operative ${winner?.name || 'Unknown'} (${winner?.role?.name || 'Specialist'}) for securing 1st Place!` }
      </p>

      {/* Operative Debrief: FIFO Placement Rankings */}
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '32px'
        }}
      >
        {sortedPlayers.map((p, idx) => {
          const placementRank = p.placementRank || (idx + 1);
          const isWinner = !isCollapse && placementRank === 1;
          const rankStr = placementRank === 1 ? '1st' : placementRank === 2 ? '2nd' : placementRank === 3 ? '3rd' : `${placementRank}th`;

          const rankColor = placementRank === 1
            ? '#F59E0B'
            : (placementRank === 2 ? '#CBD5E1' : (placementRank === 3 ? '#FB923C' : '#94A3B8'));

          return (
            <div
              key={p.id ?? idx}
              style={{
                background: isCollapse
                  ? 'rgba(30, 10, 10, 0.75)'
                  : (isWinner
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(15, 23, 42, 0.88))'
                    : 'rgba(15, 23, 42, 0.75)'),
                border: isCollapse
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : (isWinner ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)'),
                borderRadius: '10px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                position: 'relative',
                boxShadow: isWinner
                  ? '0 8px 30px rgba(245, 158, 11, 0.25)'
                  : '0 4px 16px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Rank Badge */}
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: isCollapse ? 'rgba(239, 68, 68, 0.15)' : (isWinner ? '#F59E0B' : 'rgba(255, 255, 255, 0.08)'),
                  border: isCollapse ? '1px solid #EF4444' : `1px solid ${rankColor}`,
                  color: isCollapse ? '#EF4444' : (isWinner ? '#000' : rankColor),
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {isCollapse ? '💀' : rankStr}
              </div>

              {/* Operative Avatar */}
              <img
                src={p.role?.avatar}
                alt={p.name}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: `2px solid ${p.color || '#38BDF8'}`
                }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />

              {/* Operative Info & Mission Metrics */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: p.color || '#FFF' }}>
                    {p.name}
                  </span>
                  {isWinner && (
                    <span style={{ fontSize: '0.68rem', background: '#F59E0B', color: '#000', fontWeight: 900, padding: '2px 7px', borderRadius: '10px' }}>
                      👑 1ST PLACE OPERATIVE
                    </span>
                  )}
                  {p.completed ? (
                    <span style={{ fontSize: '0.66rem', background: 'rgba(52, 211, 153, 0.18)', border: '1px solid #34D399', color: '#6EE7B7', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                      ✓ RELIC RESTORED
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.66rem', background: 'rgba(248, 113, 113, 0.15)', border: '1px solid #F87171', color: '#FCA5A5', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                      ⏳ UNFINISHED
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.74rem', color: '#94A3B8', margin: '2px 0 6px' }}>
                  {p.role?.name} &bull; Mission: <strong style={{ color: '#E2E8F0' }}>{p.mission?.artifactNickname || p.mission?.artifactName || 'Relic'}</strong>
                </div>

                {/* Progress Breakdown Chips */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.72rem' }}>
                  <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '4px', color: '#CBD5E1' }}>
                    Relic in Hand: <strong style={{ color: p.artifactCards?.length > 0 || p.completed ? '#34D399' : '#94A3B8' }}>{p.completed ? 'Delivered' : (p.artifactCards?.length > 0 ? 'Yes' : 'No')}</strong>
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '4px', color: '#CBD5E1' }}>
                    Clues: <strong style={{ color: '#38BDF8' }}>{(p.mission && p.clueProgress?.[p.mission.artifactId]) || 0}/3</strong>
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '4px', color: '#CBD5E1' }}>
                    Paradox: <strong style={{ color: p.paradox <= 1 ? '#34D399' : (p.paradox >= 4 ? '#F87171' : '#F59E0B') }}>Level {p.paradox}/5</strong>
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: '4px', color: '#CBD5E1' }}>
                    Energy: <strong style={{ color: '#38BDF8' }}>{p.energy}⚡</strong>
                  </span>
                </div>
              </div>

              {/* FIFO Placement Status */}
              <div style={{ textAlign: 'right', minWidth: '95px' }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  color: isCollapse ? '#EF4444' : rankColor
                }}>
                  {isCollapse ? 'LOST' : `${rankStr}`}
                </div>
                <div style={{ fontSize: '0.64rem', color: isCollapse ? '#F87171' : '#94A3B8', letterSpacing: '1px', fontWeight: 800 }}>
                  {isCollapse ? 'COLLAPSED' : (p.completed ? 'FIFO RESTORED' : 'TIMEOUT')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            sounds.portal();
            onPlayAgain();
          }}
          style={{
            padding: '12px 28px',
            fontSize: '0.9rem',
            fontWeight: 800,
            letterSpacing: '1px',
            background: isSpectator ? 'linear-gradient(135deg, #8B5CF6, #3B82F6)' : undefined,
            border: isSpectator ? '1px solid #C084FC' : undefined
          }}
        >
          {isSpectator ? '👁️ SPECTATE NEXT EXPEDITION ➔' : '🚀 LAUNCH NEW EXPEDITION ➔'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => {
            sounds.btnClick();
            onBackMenu();
          }}
          style={{
            padding: '12px 24px',
            fontSize: '0.88rem',
            fontWeight: 700
          }}
        >
          🏛️ RETURN TO HEADQUARTERS
        </button>
      </div>
    </div>
  );
}
