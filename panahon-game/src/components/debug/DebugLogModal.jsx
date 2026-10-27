// ===== PANAHON: CHRONO SHIFT - IN-GAME DEBUG LOG & DIAGNOSTICS CONSOLE =====
import React, { useState, useEffect, useRef, useMemo } from 'react';
import sounds from '../../sound.js';
import gameLogger, { LOG_CATEGORIES } from '../../utils/debugLogger.js';
import { analyzeEndTurnStatus, getSystemSnapshot, unstickGame } from '../../utils/gameDiagnostics.js';

export default function DebugLogModal({
  isOpen,
  onClose,
  engine,
  network,
  onToast
}) {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'diagnostics' | 'tools' | 'state'
  const [logs, setLogs] = useState(() => gameLogger.getLogs());
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [unstickMessage, setUnstickMessage] = useState(null);

  const logContainerRef = useRef(null);

  // Subscribe to live log emissions
  useEffect(() => {
    const unsubscribe = gameLogger.subscribe((_, updatedLogs) => {
      setLogs([...updatedLogs]);
    });
    return () => unsubscribe();
  }, []);

  // Keyboard shortcut to close (ESC or ~)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === '`' || e.code === 'Backquote') {
        e.preventDefault();
        sounds.btnClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-scroll to bottom of log feed
  useEffect(() => {
    if (autoScroll && activeTab === 'logs' && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, activeTab]);

  const endTurnStatus = useMemo(() => {
    return analyzeEndTurnStatus(engine, network);
  }, [engine, network, logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filterCategory !== 'ALL' && l.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inMsg = l.message.toLowerCase().includes(query);
        const inCat = l.category.toLowerCase().includes(query);
        const inData = l.data ? JSON.stringify(l.data).toLowerCase().includes(query) : false;
        return inMsg || inCat || inData;
      }
      return true;
    });
  }, [logs, filterCategory, searchQuery]);

  if (!isOpen) return null;

  const handleCopyLogs = async () => {
    sounds.btnClick();
    const success = await gameLogger.copyToClipboard();
    if (success) {
      setCopied(true);
      if (onToast) onToast('Debug Telemetry Copied', `Copied ${logs.length} log entries to clipboard.`, 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadLogs = () => {
    sounds.btnClick();
    gameLogger.downloadLogs();
    if (onToast) onToast('Debug Log Downloaded', 'Log file saved to your device.', 'info');
  };

  const handleClearLogs = () => {
    sounds.btnClick();
    gameLogger.clear();
    setLogs([]);
  };

  const handleExecuteUnstick = (actionType) => {
    sounds.btnClick();
    const res = unstickGame(engine, network, actionType);
    setUnstickMessage(res.message);
    if (onToast) {
      onToast(res.success ? 'Diagnostic Action Applied' : 'Diagnostic Alert', res.message, res.success ? 'success' : 'warning');
    }
    setTimeout(() => setUnstickMessage(null), 5000);
  };

  return (
    <div
      className="modal-overlay debug-modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 13000,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal debug-modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: '880px',
          height: '86vh',
          maxHeight: '740px',
          background: '#120D0A',
          border: '2px solid #C2974D',
          borderRadius: '6px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.9), inset 0 0 20px rgba(194, 151, 77, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--font-body)'
        }}
      >
        {/* TOP BAR / HEADER */}
        <div
          style={{
            background: 'linear-gradient(180deg, #2D1F15 0%, #1A120C 100%)',
            borderBottom: '2px solid #5C3E16',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🐛</span>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#FFD700',
                letterSpacing: '1px'
              }}>
                CHRONO TELEMETRY & DEBUG CONSOLE
              </div>
              <div style={{ fontSize: '0.66rem', color: '#C8B293' }}>
                Live Event Logger & Emergency Diagnostic Recovery (Toggle: <kbd style={{ padding: '1px 4px', background: '#0D0907', border: '1px solid #4A3423', color: '#F5C442' }}>`</kbd> or <kbd style={{ padding: '1px 4px', background: '#0D0907', border: '1px solid #4A3423', color: '#F5C442' }}>ESC</kbd>)
              </div>
            </div>
          </div>

          {/* QUICK TELEMETRY PILLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', flexWrap: 'wrap' }}>
            <span style={{
              background: '#221913',
              border: '1px solid #5A422D',
              color: '#FDE047',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 700
            }}>
              Phase: <strong style={{ textTransform: 'uppercase', color: endTurnStatus.phase === 'action' ? '#34D399' : '#F59E0B' }}>{endTurnStatus.phase}</strong>
            </span>

            <span style={{
              background: '#221913',
              border: '1px solid #5A422D',
              color: '#FDE047',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 700
            }}>
              Turn Owner: <strong style={{ color: endTurnStatus.isMyTurn ? '#34D399' : '#F87171' }}>{endTurnStatus.isMyTurn ? 'YOU' : 'OTHER'}</strong>
            </span>

            <span style={{
              background: endTurnStatus.canEndTurn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: endTurnStatus.canEndTurn ? '1px solid #10B981' : '1px solid #EF4444',
              color: endTurnStatus.canEndTurn ? '#6EE7B7' : '#FCA5A5',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 800
            }}>
              End Turn: {endTurnStatus.canEndTurn ? '🟢 READY' : '🔴 BLOCKED'}
            </span>

            <button
              onClick={() => { sounds.btnClick(); onClose(); }}
              style={{
                background: '#3A1E1A',
                border: '1.5px solid #8B2525',
                color: '#FECACA',
                padding: '4px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.75rem',
                marginLeft: '6px'
              }}
              title="Close Console"
            >
              ✕
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div
          style={{
            background: '#1A120C',
            borderBottom: '1.5px solid #3A281E',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 12px 0 12px',
            gap: '6px'
          }}
        >
          {[
            { id: 'logs', label: `📜 Live Event Feed (${logs.length})` },
            { id: 'diagnostics', label: `🔍 Turn & Blocker Diagnostics ${endTurnStatus.blockers.length > 0 ? `(${endTurnStatus.blockers.length})` : ''}` },
            { id: 'tools', label: '⚡ Emergency Unstick' },
            { id: 'state', label: '📦 State Tree' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { sounds.btnClick(); setActiveTab(tab.id); }}
              style={{
                padding: '6px 12px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #F5C442' : '2px solid transparent',
                background: activeTab === tab.id ? '#291D13' : 'transparent',
                color: activeTab === tab.id ? '#FFD700' : '#A8947E',
                cursor: 'pointer',
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: LIVE LOGS */}
        {activeTab === 'logs' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* LOG FILTER BAR */}
            <div
              style={{
                background: '#160F0B',
                borderBottom: '1px solid #2B1D14',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap'
              }}
            >
              {/* Category Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.65rem', color: '#8C7764', fontWeight: 600 }}>Filter:</span>
                {['ALL', 'TURN', 'ACTION', 'PHASE', 'NETWORK', 'DICE', 'CARDS', 'AI', 'WARN', 'ERROR'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { sounds.btnClick(); setFilterCategory(cat); }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.60rem',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      borderRadius: '3px',
                      border: filterCategory === cat ? '1px solid #F5C442' : '1px solid #3D2D1E',
                      background: filterCategory === cat ? '#3D2D1E' : '#1F150E',
                      color: filterCategory === cat ? '#FFD700' : '#A8947E',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: '#0D0907',
                    border: '1px solid #4A3423',
                    borderRadius: '3px',
                    color: '#FEF3C7',
                    fontSize: '0.68rem',
                    padding: '3px 8px',
                    width: '130px'
                  }}
                />

                <label style={{ fontSize: '0.64rem', color: '#C8B293', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                  Auto-scroll
                </label>

                <button
                  onClick={handleCopyLogs}
                  style={{
                    background: copied ? '#15803D' : '#2D2016',
                    border: '1px solid #C2974D',
                    color: '#FFD700',
                    fontSize: '0.64rem',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>

                <button
                  onClick={handleDownloadLogs}
                  style={{
                    background: '#2D2016',
                    border: '1px solid #C2974D',
                    color: '#FFD700',
                    fontSize: '0.64rem',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  💾 Save .txt
                </button>

                <button
                  onClick={handleClearLogs}
                  style={{
                    background: '#2D1616',
                    border: '1px solid #8B2525',
                    color: '#FCA5A5',
                    fontSize: '0.64rem',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* LOG OUTPUT STREAM */}
            <div
              ref={logContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                background: '#0A0705',
                padding: '8px 12px',
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                lineHeight: 1.45,
                color: '#E2E8F0'
              }}
            >
              {filteredLogs.length === 0 ? (
                <div style={{ color: '#64748B', textAlign: 'center', padding: '30px' }}>
                  No log entries matching filter "{filterCategory}" {searchQuery ? `and query "${searchQuery}"` : ''}.
                </div>
              ) : (
                filteredLogs.map((l) => {
                  let badgeBg = '#334155';
                  let badgeColor = '#F8FAFC';
                  if (l.category === 'TURN') { badgeBg = '#B45309'; }
                  else if (l.category === 'ACTION') { badgeBg = '#047857'; }
                  else if (l.category === 'PHASE') { badgeBg = '#4338CA'; }
                  else if (l.category === 'NETWORK') { badgeBg = '#BE185D'; }
                  else if (l.category === 'DICE') { badgeBg = '#6D28D9'; }
                  else if (l.category === 'CARDS') { badgeBg = '#0F766E'; }
                  else if (l.category === 'AI') { badgeBg = '#334155'; }
                  else if (l.category === 'WARN') { badgeBg = '#A16207'; badgeColor = '#FEF08A'; }
                  else if (l.category === 'ERROR') { badgeBg = '#B91C1C'; badgeColor = '#FEE2E2'; }

                  return (
                    <div
                      key={l.id}
                      style={{
                        padding: '2px 0',
                        borderBottom: '1px solid #17110C',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}
                    >
                      <span style={{ color: '#64748B', whiteSpace: 'nowrap', fontSize: '0.68rem' }}>
                        {l.time}
                      </span>
                      <span
                        style={{
                          background: badgeBg,
                          color: badgeColor,
                          padding: '1px 5px',
                          borderRadius: '2px',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          minWidth: '58px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {l.category}
                      </span>
                      <div style={{ flex: 1, wordBreak: 'break-word' }}>
                        <span style={{ color: l.level === 'error' ? '#F87171' : l.level === 'warn' ? '#FDE047' : '#F1F5F9' }}>
                          {l.message}
                        </span>
                        {l.data && (
                          <span style={{ color: '#94A3B8', marginLeft: '6px', fontSize: '0.68rem' }}>
                            {typeof l.data === 'string' ? l.data : JSON.stringify(l.data)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TURN & BLOCKER DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#0D0907' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#FFD700', fontSize: '0.92rem', margin: '0 0 10px 0' }}>
              🎯 Turn Resolution & End Turn Blocker Analysis
            </h3>

            {/* BLOCKER ALERT BOX */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '4px',
                marginBottom: '16px',
                background: endTurnStatus.canEndTurn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: endTurnStatus.canEndTurn ? '2px solid #10B981' : '2px solid #EF4444'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>{endTurnStatus.canEndTurn ? '✅' : '⚠️'}</span>
                <strong style={{ color: endTurnStatus.canEndTurn ? '#34D399' : '#FCA5A5', fontSize: '0.85rem' }}>
                  {endTurnStatus.canEndTurn
                    ? 'END TURN IS FULLY AVAILABLE & OPERATIONAL'
                    : `END TURN IS CURRENTLY BLOCKED BY ${endTurnStatus.blockers.length} REASON(S)`}
                </strong>
              </div>

              {endTurnStatus.blockers.length > 0 ? (
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '22px', fontSize: '0.74rem', color: '#FECACA', lineHeight: 1.5 }}>
                  {endTurnStatus.blockers.map((b, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {b}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#A7F3D0' }}>
                  The player has completed movement, all modals are closed, and the turn can be concluded using the standard "End Turn" button or Emergency tools below.
                </p>
              )}
            </div>

            {/* TELEMETRY TABLE */}
            <div style={{ background: '#16100C', border: '1.5px solid #4A3423', borderRadius: '4px', padding: '12px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.76rem', color: '#F5C442', fontWeight: 800, marginBottom: '8px' }}>
                LIVE ENGINE METRICS
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '0.72rem' }}>
                <div>
                  <span style={{ color: '#8C7764' }}>Active Player: </span>
                  <strong style={{ color: '#FEF3C7' }}>{endTurnStatus.currentPlayer?.name || 'None'} (P#{engine?.state?.currentPlayerIndex})</strong>
                </div>
                <div>
                  <span style={{ color: '#8C7764' }}>Is AI Bot: </span>
                  <strong style={{ color: endTurnStatus.currentPlayer?.isAi ? '#F59E0B' : '#38BDF8' }}>{endTurnStatus.currentPlayer?.isAi ? 'Yes 🤖' : 'No 👤'}</strong>
                </div>
                <div>
                  <span style={{ color: '#8C7764' }}>Is Local Player: </span>
                  <strong style={{ color: endTurnStatus.currentPlayer?.isLocal ? '#34D399' : '#F87171' }}>{endTurnStatus.currentPlayer?.isLocal ? 'Yes' : 'No'}</strong>
                </div>
                <div>
                  <span style={{ color: '#8C7764' }}>Turn Phase: </span>
                  <strong style={{ color: '#F5C442', textTransform: 'uppercase' }}>{endTurnStatus.phase}</strong>
                </div>
                <div>
                  <span style={{ color: '#8C7764' }}>Moves Remaining: </span>
                  <strong style={{ color: '#FEF3C7' }}>{endTurnStatus.movesRemaining}</strong>
                </div>
                <div>
                  <span style={{ color: '#8C7764' }}>Steps Taken This Turn: </span>
                  <strong style={{ color: '#FEF3C7' }}>{endTurnStatus.stepsTaken}</strong>
                </div>
                <div>
                  <span style={{ color: '#8C7764' }}>Network Mode: </span>
                  <strong style={{ color: '#FEF3C7' }}>{network?.mode || 'local'} ({network?.isHost ? 'Host' : 'Guest'})</strong>
                </div>
                <div>
                  <span style={{ color: '#8C7764' }}>My Connection Player ID: </span>
                  <strong style={{ color: '#FEF3C7' }}>{network?.playerId !== undefined ? network.playerId : 'N/A (Local)'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMERGENCY UNSTICK */}
        {activeTab === 'tools' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#0D0907' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#FFD700', fontSize: '0.92rem', margin: '0 0 4px 0' }}>
              ⚡ Emergency Unstick & Diagnostic Overrides
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#C8B293', margin: '0 0 14px 0' }}>
              If a match stalls because the End Turn button is missing, a modal did not close, an AI stopped responding, or turns are out of sync across multiplayer, apply these live overrides without restarting the match!
            </p>

            {unstickMessage && (
              <div style={{ padding: '8px 12px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38BDF8', color: '#BAE6FD', borderRadius: '4px', marginBottom: '12px', fontSize: '0.74rem' }}>
                ℹ️ {unstickMessage}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: Force End Turn */}
              <div style={{ background: '#16100C', border: '1.5px solid #5A422D', padding: '10px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <strong style={{ color: '#FCD34D', fontSize: '0.78rem' }}>🏁 Force Pass / End Turn</strong>
                  <div style={{ fontSize: '0.68rem', color: '#A8947E', marginTop: '2px' }}>
                    Immediately concludes the current player's turn and advances turn order to the next operative.
                  </div>
                </div>
                <button
                  onClick={() => handleExecuteUnstick('forceEndTurn')}
                  style={{
                    padding: '8px 14px',
                    background: 'linear-gradient(180deg, #4D3826 0%, #352518 100%)',
                    border: '1.5px solid #F5C442',
                    color: '#FFD700',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ⚡ Force End Turn
                </button>
              </div>

              {/* Option 2: Force Action Phase */}
              <div style={{ background: '#16100C', border: '1.5px solid #5A422D', padding: '10px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <strong style={{ color: '#67E8F9', fontSize: '0.78rem' }}>🌀 Force Phase to "Action"</strong>
                  <div style={{ fontSize: '0.68rem', color: '#A8947E', marginTop: '2px' }}>
                    If End Turn button is missing because phase got stuck in "moving" or "cardResolution", resets phase to "action".
                  </div>
                </div>
                <button
                  onClick={() => handleExecuteUnstick('forceActionPhase')}
                  style={{
                    padding: '8px 14px',
                    background: 'linear-gradient(180deg, #1E3A4D 0%, #122430 100%)',
                    border: '1.5px solid #38BDF8',
                    color: '#67E8F9',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Restore End Turn
                </button>
              </div>

              {/* Option 3: Dismiss Stuck Modals */}
              <div style={{ background: '#16100C', border: '1.5px solid #5A422D', padding: '10px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <strong style={{ color: '#F87171', fontSize: '0.78rem' }}>🛑 Clear Lingering Modals & Choices</strong>
                  <div style={{ fontSize: '0.68rem', color: '#A8947E', marginTop: '2px' }}>
                    Clears any orphan card popup or choice prompt that is blocking game progression.
                  </div>
                </div>
                <button
                  onClick={() => handleExecuteUnstick('dismissStuckModals')}
                  style={{
                    padding: '8px 14px',
                    background: 'linear-gradient(180deg, #3A1E1A 0%, #24110E 100%)',
                    border: '1.5px solid #EF4444',
                    color: '#FECACA',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Clear Modals
                </button>
              </div>

              {/* Option 4: Wake AI Bot */}
              <div style={{ background: '#16100C', border: '1.5px solid #5A422D', padding: '10px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <strong style={{ color: '#A78BFA', fontSize: '0.78rem' }}>🤖 Wake Up Stalled AI Bot</strong>
                  <div style={{ fontSize: '0.68rem', color: '#A8947E', marginTop: '2px' }}>
                    Re-triggers bot AI logic and releases any pause/hover wait locks if an AI player stopped taking steps.
                  </div>
                </div>
                <button
                  onClick={() => handleExecuteUnstick('wakeAi')}
                  style={{
                    padding: '8px 14px',
                    background: 'linear-gradient(180deg, #33204D 0%, #1F1330 100%)',
                    border: '1.5px solid #A855F7',
                    color: '#E9D5FF',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Wake AI Bot
                </button>
              </div>

              {/* Option 5: Force Network Resync */}
              {network?.mode === 'online' && (
                <div style={{ background: '#16100C', border: '1.5px solid #5A422D', padding: '10px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <strong style={{ color: '#F472B6', fontSize: '0.78rem' }}>🔄 Force Multiplayer State Resync</strong>
                    <div style={{ fontSize: '0.68rem', color: '#A8947E', marginTop: '2px' }}>
                      {network.isHost ? 'Re-broadcast current host game state to all peers.' : 'Request complete state refresh from Host.'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleExecuteUnstick('requestSync')}
                    style={{
                      padding: '8px 14px',
                      background: 'linear-gradient(180deg, #4D1A33 0%, #301020 100%)',
                      border: '1.5px solid #EC4899',
                      color: '#FBCFE8',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.70rem',
                      fontWeight: 800,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Resync Network
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RAW STATE TREE */}
        {activeTab === 'state' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: '#0A0705' }}>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.68rem', color: '#38BDF8', lineHeight: 1.45 }}>
              {JSON.stringify(getSystemSnapshot(engine, network), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
