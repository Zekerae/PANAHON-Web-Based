import React, { useState } from 'react';
import sounds from '../sound.js';
import { ROLES, ROLE_ORDER, PLAYER_COLORS } from '../gameData.js';
import ChatBox from './ChatBox.jsx';
import { isSupabaseAvailable } from '../supabaseClient.js';

export default function LobbyScreen({
  lobbyMode,
  setLobbyMode,
  localPlayers,
  setLocalPlayers,
  onlinePlayerName,
  setOnlinePlayerName,
  onlineSelectedRole,
  setOnlineSelectedRole,
  onlineRoomCodeInput,
  setOnlineRoomCodeInput,
  network,
  currentRoomPlayers,
  isConnectingOnline,
  onStartLocal,
  onConnectOnline,
  onLeaveRoom,
  onStartOnline,
  onBack,
  onOpenSupabaseConfig
}) {
  const [onlineSubMode, setOnlineSubMode] = useState('create');
  const roleKeys = ROLE_ORDER;
  const isRoomActive = network.roomCode !== null;
  const hasSupabase = isSupabaseAvailable();

  // Presets
  const applyPreset1v3 = () => {
    sounds.btnClick();
    setLocalPlayers([
      { name: 'Player 1', roleKey: 'HISTORIAN', type: 'human', difficulty: 'normal' },
      { name: 'Bot Explorer', roleKey: 'EXPLORER', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Guardian', roleKey: 'GUARDIAN', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Strategist', roleKey: 'STRATEGIST', type: 'ai', difficulty: 'normal' }
    ]);
  };

  const applyPreset2v2 = () => {
    sounds.btnClick();
    setLocalPlayers([
      { name: 'Player 1', roleKey: 'HISTORIAN', type: 'human', difficulty: 'normal' },
      { name: 'Player 2', roleKey: 'EXPLORER', type: 'human', difficulty: 'normal' },
      { name: 'Bot Guardian', roleKey: 'GUARDIAN', type: 'ai', difficulty: 'normal' },
      { name: 'Bot Strategist', roleKey: 'STRATEGIST', type: 'ai', difficulty: 'normal' }
    ]);
  };

  const applyPreset4Human = () => {
    sounds.btnClick();
    setLocalPlayers([
      { name: 'Player 1', roleKey: 'HISTORIAN', type: 'human', difficulty: 'normal' },
      { name: 'Player 2', roleKey: 'EXPLORER', type: 'human', difficulty: 'normal' },
      { name: 'Player 3', roleKey: 'GUARDIAN', type: 'human', difficulty: 'normal' },
      { name: 'Player 4', roleKey: 'STRATEGIST', type: 'human', difficulty: 'normal' }
    ]);
  };

  const applyPresetRandom = () => {
    sounds.btnClick();
    const shuffledRoles = [...ROLE_ORDER].sort(() => Math.random() - 0.5);
    setLocalPlayers(localPlayers.map((p, idx) => ({
      ...p,
      roleKey: shuffledRoles[idx % shuffledRoles.length]
    })));
  };

  const updateSlot = (idx, patch) => {
    const updated = [...localPlayers];
    updated[idx] = { ...updated[idx], ...patch };
    setLocalPlayers(updated);
  };

  const activeSlots = localPlayers.filter(p => p.type !== 'closed');

  return (
    <div className="lobby-screen">
      <div className="lobby-title">MISSION BRIEFING</div>

      <div className="lobby-mode-tabs" style={{ maxWidth: network.roomCode ? '880px' : '700px', width: '100%' }}>
        <div
          className={`mode-tab ${lobbyMode === 'local' ? 'active' : ''}`}
          onClick={() => { sounds.btnClick(); setLobbyMode('local'); }}
        >
          Custom Game / Bots
        </div>
        <div
          className={`mode-tab ${lobbyMode === 'online' ? 'active' : ''}`}
          onClick={() => { sounds.btnClick(); setLobbyMode('online'); }}
        >
          Online Multiplayer
        </div>
      </div>

      {lobbyMode === 'local' ? (
        <div className="lobby-panel">
          <div className="lobby-section-title">CUSTOM LOBBY: CONFIGURE SLOTS</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
            Configure each slot as <strong>👤 Human</strong>, <strong>🤖 Computer (AI)</strong>, or <strong>🚫 Closed</strong>. Pick a preset or customize roles and AI difficulties.
          </p>

          <div className="wc3-preset-bar">
            <button className="wc3-preset-btn" onClick={applyPreset1v3}>⚔️ 1 Player vs 3 Bots</button>
            <button className="wc3-preset-btn" onClick={applyPreset2v2}>🤝 2 Players vs 2 Bots</button>
            <button className="wc3-preset-btn" onClick={applyPreset4Human}>👥 4 Humans (Pass & Play)</button>
            <button className="wc3-preset-btn" onClick={applyPresetRandom}>🎲 Shuffle Roles</button>
          </div>

          <div className="player-slots">
            {localPlayers.map((player, idx) => {
              const isClosed = player.type === 'closed';
              const isAi = player.type === 'ai';
              const role = ROLES[player.roleKey] || ROLES.HISTORIAN;
              const color = PLAYER_COLORS[idx];

              if (isClosed) {
                return (
                  <div
                    key={idx}
                    className="player-slot closed-slot wc3-slot-card"
                    style={{
                      borderLeft: '4px solid #4b5563',
                      minHeight: '105px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                        🚫
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700 }}>
                          SLOT {idx + 1} &bull; CLOSED
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Slot deactivated (will not participate in game)
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select
                        className="slot-type-select"
                        style={{ background: 'rgba(0,0,0,0.6)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '5px 8px', fontSize: '0.75rem', fontWeight: 600 }}
                        value={player.type}
                        onChange={(e) => updateSlot(idx, { type: e.target.value })}
                      >
                        <option value="human">👤 Human</option>
                        <option value="ai">🤖 Computer (AI)</option>
                        <option value="closed">🚫 Closed</option>
                      </select>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="player-slot selected wc3-slot-card"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <img src={role.avatar} className="player-slot-avatar" alt={role.name} />
                  <div className="player-slot-info" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color, fontWeight: 800, letterSpacing: '0.5px' }}>
                          SLOT {idx + 1}
                        </span>
                        {isAi ? <span className="bot-badge">🤖 BOT</span> : <span className="human-badge">👤 HUMAN</span>}
                      </div>

                      <select
                        className="slot-type-select"
                        style={{
                          background: 'rgba(0,0,0,0.6)',
                          color: isAi ? '#60A5FA' : '#34D399',
                          border: `1px solid ${isAi ? 'rgba(96,165,250,0.4)' : 'rgba(52,211,153,0.4)'}`,
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                        value={player.type}
                        onChange={(e) => updateSlot(idx, { type: e.target.value })}
                      >
                        <option value="human">👤 Human</option>
                        <option value="ai">🤖 Computer (AI)</option>
                        <option value="closed">🚫 Closed</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', margin: '4px 0' }}>
                      <input
                        type="text"
                        className="player-name-input"
                        value={player.name}
                        placeholder={isAi ? 'Bot Name' : 'Player Name'}
                        style={{ flex: 1, margin: 0, padding: '5px 8px', fontSize: '0.8rem' }}
                        onChange={(e) => updateSlot(idx, { name: e.target.value })}
                      />
                      {isAi && (
                        <select
                          className="ai-difficulty-select"
                          style={{ background: 'rgba(0,0,0,0.6)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.4)', borderRadius: '4px', padding: '4px 8px', fontSize: '0.72rem' }}
                          value={player.difficulty || 'normal'}
                          onChange={(e) => updateSlot(idx, { difficulty: e.target.value })}
                        >
                          <option value="easy">🟢 Easy</option>
                          <option value="normal">🔵 Normal</option>
                          <option value="hard">🔴 Hard</option>
                        </select>
                      )}
                    </div>

                    <select
                      className="role-select"
                      style={{ background: 'rgba(0,0,0,0.5)', color: 'var(--text-accent)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '4px', fontSize: '0.75rem', width: '100%' }}
                      value={player.roleKey}
                      onChange={(e) => updateSlot(idx, { roleKey: e.target.value })}
                    >
                      {roleKeys.map(rk => (
                        <option key={rk} value={rk}>
                          {ROLES[rk].name} ({ROLES[rk].passive.name})
                        </option>
                      ))}
                    </select>

                    <div className="player-slot-desc" style={{ marginTop: '4px' }}>
                      <strong>Active:</strong> {role.active.name} | <strong>Passive:</strong> {role.passive.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: 'var(--space-md)', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={onBack}>Back</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Active Castaways: <strong style={{ color: 'var(--text-accent)', fontSize: '0.95rem' }}>{activeSlots.length} / 4</strong>
              </span>
              <button
                className="btn btn-primary"
                disabled={activeSlots.length === 0}
                onClick={onStartLocal}
              >
                Launch Mission ({activeSlots.length} Castaway{activeSlots.length === 1 ? '' : 's'})
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`lobby-panel ${isRoomActive ? 'waiting-room-panel' : ''}`}>
          {!isRoomActive && (
            <div className="lobby-mode-tabs">
              <div
                className={`mode-tab ${onlineSubMode === 'create' ? 'active' : ''}`}
                onClick={() => { sounds.btnClick(); setOnlineSubMode('create'); }}
              >
                Host Mission
              </div>
              <div
                className={`mode-tab ${onlineSubMode === 'join' ? 'active' : ''}`}
                onClick={() => { sounds.btnClick(); setOnlineSubMode('join'); }}
              >
                Join Anomaly
              </div>
            </div>
          )}

          {!isRoomActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Your Name:
                </label>
                <input
                  type="text"
                  className="player-name-input"
                  value={onlinePlayerName}
                  style={{ marginTop: '4px' }}
                  onChange={(e) => setOnlinePlayerName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Choose Your Castaway Role:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginTop: '6px' }}>
                  {roleKeys.map(rk => {
                    const role = ROLES[rk];
                    const isSel = onlineSelectedRole === rk;
                    return (
                      <div
                        key={rk}
                        className={`player-slot ${isSel ? 'selected' : ''}`}
                        style={{ cursor: 'pointer', padding: '8px' }}
                        onClick={() => {
                          sounds.btnClick();
                          setOnlineSelectedRole(rk);
                        }}
                      >
                        <img src={role.avatar} className="player-slot-avatar" style={{ width: '38px', height: '38px' }} alt={role.name} />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSel ? 'var(--text-accent)' : 'var(--text-primary)' }}>
                            {role.name}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                            {role.passive.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {onlineSubMode === 'join' && (
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Room Code:
                  </label>
                  <input
                    type="text"
                    className="player-name-input"
                    placeholder="e.g. KY72P"
                    value={onlineRoomCodeInput}
                    style={{ letterSpacing: '4px', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '1.1rem', marginTop: '4px' }}
                    onChange={(e) => setOnlineRoomCodeInput(e.target.value.toUpperCase())}
                  />
                </div>
              )}

              {/* Supabase Status Banner */}
              <div
                style={{
                  marginTop: 'var(--space-xs)',
                  padding: '10px 14px',
                  background: hasSupabase ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.1)',
                  border: `1px solid ${hasSupabase ? 'rgba(16, 185, 129, 0.35)' : 'rgba(59, 130, 246, 0.3)'}`,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{hasSupabase ? '⚡' : '☁️'}</span>
                  <div style={{ fontSize: '0.73rem', lineHeight: '1.3' }}>
                    <strong style={{ color: hasSupabase ? '#34D399' : '#60A5FA' }}>
                      {hasSupabase ? 'Supabase Realtime Relay Active' : 'WebSocket Relay (Render)'}:
                    </strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {hasSupabase
                        ? 'Zero cold starts, instant peer channels, and automatic presence tracking.'
                        : 'Using WebSocket server. Enter your Supabase credentials for instant serverless play.'}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                  onClick={onOpenSupabaseConfig}
                >
                  ⚙️ Settings
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                <button className="btn btn-secondary" onClick={onBack}>Back</button>
                <button
                  className="btn btn-primary"
                  disabled={isConnectingOnline}
                  onClick={() => onConnectOnline(onlineSubMode)}
                >
                  {isConnectingOnline ? '🔄 Connecting...' : (onlineSubMode === 'create' ? 'Create Room' : 'Join Room')}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="waiting-room-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  <div className="room-code-display" style={{ padding: '16px' }}>
                    <div className="room-code-label">Anomaly Sync Code</div>
                    <div className="room-code" style={{ fontSize: '2.2rem', letterSpacing: '6px' }}>
                      {network.roomCode}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      Share this code with up to 3 allies to form your crew.
                    </p>
                  </div>

                  <div>
                    <div className="lobby-section-title" style={{ marginBottom: '8px' }}>
                      Connected Crew ({currentRoomPlayers.length}/4)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                      {currentRoomPlayers.map((p, idx) => (
                        <div
                          key={p.id ?? idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-glass)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="online-status connected"></span>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: PLAYER_COLORS[idx] || '#fff' }}>
                              {p.name}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-accent)', fontFamily: 'var(--font-display)' }}>
                            {ROLES[p.roleKey]?.name || p.roleKey} {p.isHost || p.id === 0 ? '★ Host' : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <ChatBox
                    boxId="lobby-chat"
                    isFloating={false}
                    messages={network.chatMessages}
                    onSendMessage={(text) => network.sendChatMessage(text)}
                    myPlayerId={network.playerId}
                    myPlayerName={onlinePlayerName}
                    isOnline={true}
                  />
                </div>
              </div>

              <div className="waiting-room-actions">
                <button className="btn btn-secondary" onClick={onLeaveRoom}>Leave Room</button>
                {network.isHost ? (
                  <button
                    className="btn btn-primary"
                    disabled={currentRoomPlayers.length < 1}
                    onClick={onStartOnline}
                  >
                    Launch Mission ({currentRoomPlayers.length} Players)
                  </button>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Waiting for host to initiate Chrono Shift...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
