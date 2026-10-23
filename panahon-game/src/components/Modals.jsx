import React, { useEffect, useState } from 'react';
import sounds from '../sound.js';
import { ERA_NAMES } from '../gameData.js';
import Dice from './game/Dice';

export function MaximizedCardPreview({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal card-preview-modal" style={{ maxWidth: '460px', width: '92%', animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
        <div className="modal-title" style={{ color: data.isDanger ? 'var(--text-danger)' : (data.isEvent ? 'var(--tile-event)' : 'var(--text-accent)') }}>
          {data.cardType || data.title}
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div className="card-display" style={{ maxWidth: '330px', margin: '0 auto' }}>
            {data.image && (
              <img
                src={data.image}
                alt={data.title}
                style={{ maxHeight: '230px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '8px' }}
              />
            )}
            <div className="card-display-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-accent)' }}>
              {data.title}
            </div>
            {data.era && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 8px' }}>
                Era: <strong style={{ color: '#fff' }}>{ERA_NAMES[data.era] || data.era}</strong>
              </div>
            )}
            <div className="card-display-desc" style={{ fontSize: '0.88rem', lineHeight: 1.45, color: 'var(--text-primary)', textAlign: 'left', background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '6px' }}>
              {data.description || data.hint || 'Classified historical intel.'}
            </div>
          </div>

          {data.diceRoll !== undefined && (
            <div className="modal-dice" style={{ marginTop: '14px' }}>
              <Dice value={data.diceRoll} size="sm" theme={data.success ? 'success' : 'hazard'} isInteractive={false} />
              <div className="modal-dice-result">
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dice Check Roll</div>
                <div className={`modal-dice-outcome ${data.success ? 'success' : 'failure'}`}>
                  {data.success ? '✓ HAZARD EVADED' : '✗ HAZARD TRIGGERED'}
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px', color: data.success ? 'var(--text-success)' : 'var(--text-danger)' }}>
                  {data.success ? data.successMsg : data.failMsg}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { sounds.btnClick(); onClose(); }}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

export function CardModal({ modal, engine, network, onDismiss, onMaximize }) {
  if (!modal) return null;

  const activePlayer = engine.getCurrentPlayer();
  const drawingPlayer = (modal.playerId !== undefined && engine.state?.players[modal.playerId])
    ? engine.state.players[modal.playerId]
    : activePlayer;
  const isAi = drawingPlayer?.isAi === true;

  const isDanger = modal.type === 'danger';
  const isEvent = modal.type === 'event';
  const isArtifact = modal.type === 'artifact';
  const isClue = modal.isClue || modal.cardType === 'Clue Card' || modal.cardType === 'Decoy Card';

  // In online multiplayer, hide other players' clue cards
  const isSecretToMe = (network.mode === 'online') && isClue && (modal.playerId !== undefined) && (modal.playerId !== network.playerId);

  // Auto-dismiss for AI bot card draw after 3s
  useEffect(() => {
    if (isAi) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAi, modal]);

  if (isAi) {
    return (
      <div className="side-card-overlay" id="active-modal">
        <div className="side-card-header">
          <div className="side-card-title">
            <span className="bot-badge">🤖 BOT</span>
            <span style={{ color: isDanger ? 'var(--text-danger)' : (isEvent ? 'var(--tile-event)' : 'var(--text-accent)') }}>
              {modal.cardType || modal.title}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              className="side-card-maximize"
              title="Click to view card in full screen"
              onClick={() => {
                sounds.btnClick();
                onMaximize({
                  title: modal.title,
                  cardType: modal.cardType || (isDanger ? 'Hazard Anomaly' : 'Event Card'),
                  description: modal.description,
                  image: modal.image,
                  diceRoll: modal.diceRoll,
                  success: modal.success,
                  successMsg: modal.successMsg,
                  failMsg: modal.failMsg,
                  isDanger,
                  isEvent,
                  era: modal.era
                });
              }}
            >
              🔍
            </button>
            <button className="side-card-close" title="Dismiss" onClick={() => { sounds.btnClick(); onDismiss(); }}>
              &times;
            </button>
          </div>
        </div>

        <div className="side-card-body">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <strong style={{ color: drawingPlayer?.color || '#fff' }}>{drawingPlayer?.name || modal.playerName || 'Bot'}</strong> drew a card:
          </div>

          <div
            className="side-card-content-preview side-card-clickable"
            onClick={() => {
              sounds.btnClick();
              onMaximize({
                title: modal.title,
                cardType: modal.cardType || (isDanger ? 'Hazard Anomaly' : 'Event Card'),
                description: modal.description,
                image: modal.image,
                diceRoll: modal.diceRoll,
                success: modal.success,
                successMsg: modal.successMsg,
                failMsg: modal.failMsg,
                isDanger,
                isEvent,
                era: modal.era
              });
            }}
          >
            {modal.image && <img src={modal.image} className="side-card-thumb" alt={modal.title} />}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{modal.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3, marginTop: '2px' }}>
                {modal.description || ''}
              </div>
            </div>
          </div>

          <div
            style={{ fontSize: '0.68rem', color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            onClick={() => {
              sounds.btnClick();
              onMaximize({
                title: modal.title,
                cardType: modal.cardType || (isDanger ? 'Hazard Anomaly' : 'Event Card'),
                description: modal.description,
                image: modal.image,
                diceRoll: modal.diceRoll,
                success: modal.success,
                successMsg: modal.successMsg,
                failMsg: modal.failMsg,
                isDanger,
                isEvent,
                era: modal.era
              });
            }}
          >
            <span>🔍</span> Click card to view in full size
          </div>

          {isDanger && modal.diceRoll !== undefined && (
            <div style={{ marginTop: '6px', fontSize: '0.75rem', color: modal.success ? 'var(--text-success)' : 'var(--text-danger)', fontWeight: 700 }}>
              🎲 Rolled {modal.diceRoll}: {modal.success ? '✓ Hazard Evaded' : '✗ Hazard Triggered'}
            </div>
          )}
        </div>

        <div className="overlay-timer-bar">
          <div className="overlay-timer-fill"></div>
        </div>
      </div>
    );
  }

  const handleDismiss = () => {
    sounds.btnClick();
    if (network.mode !== 'online' || modal.playerId === undefined || modal.playerId === network.playerId) {
      engine.dismissModal();
      network.sendAction({ type: 'DISMISS_MODAL' });
    }
    onDismiss();
  };

  if (isSecretToMe) {
    return (
      <div className="modal-overlay" id="active-modal">
        <div className="modal">
          <button className="modal-close" onClick={handleDismiss}>&times;</button>
          <div className="modal-title" style={{ color: 'var(--tile-clue)' }}>
            🔍 Clue Discovered
          </div>

          <div className="modal-body">
            <div className="card-display card-back-display">
              <div className="card-back-icon">⏳🔍</div>
              <div className="card-display-title">Secret Clue Card</div>
              <div className="card-display-desc">
                <strong style={{ color: 'var(--text-accent)' }}>{modal.playerName || 'A Castaway'}</strong> excavated a secret Clue Card in <strong>{ERA_NAMES[modal.era] || 'the timeline'}</strong>.
                <br /><br />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Card details, hints, and authenticity are secret to {modal.playerName || 'the drawer'}.
                </span>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDismiss}>Understood</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" id="active-modal">
      <div className="modal">
        <button className="modal-close" onClick={handleDismiss}>&times;</button>
        <div className="modal-title" style={{ color: isDanger ? '#EF4444' : (isEvent ? '#F59E0B' : '#38BDF8'), letterSpacing: '1.5px' }}>
          {modal.cardType || (isDanger ? 'HAZARD ANOMALY' : (isEvent ? 'TEMPORAL EVENT' : modal.title))}
        </div>
        {modal.era && (
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, textAlign: 'center', marginTop: '-8px', marginBottom: '10px' }}>
            TIMELINE: <span style={{ color: '#F8FAFC' }}>{ERA_NAMES[modal.era]?.toUpperCase() || modal.era}</span>
          </div>
        )}

        <div className="modal-body">
          <div className="card-display">
            {modal.image && <img src={modal.image} alt={modal.title} />}
            <div className="card-display-title">{modal.title}</div>
            <div className="card-display-desc">{modal.description}</div>
          </div>

          {isDanger && modal.diceRoll !== undefined && (
            <div className="modal-dice">
              <Dice value={modal.diceRoll} size="sm" theme={modal.success ? 'success' : 'hazard'} isInteractive={false} />
              <div className="modal-dice-result">
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dice Check Roll</div>
                <div className={`modal-dice-outcome ${modal.success ? 'success' : 'failure'}`}>
                  {modal.success ? '✓ HAZARD EVADED' : '✗ HAZARD TRIGGERED'}
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px', color: modal.success ? 'var(--text-success)' : 'var(--text-danger)' }}>
                  {modal.success ? modal.successMsg : modal.failMsg}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleDismiss} style={{ padding: '10px 24px', fontWeight: 800 }}>
            {engine?.state?.pendingChoice?.type === 'teleportTile' ? 'Choose Destination ➔' : 'Acknowledge Directive ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChoiceModal({ choice, engine, network, onDismiss, onMaximize }) {
  if (!choice) return null;

  const activePlayer = engine.getCurrentPlayer();
  const isAi = activePlayer?.isAi === true;
  const isMyTurn = !isAi && network.isMyTurn(engine.state.currentPlayerIndex);
  const isDecipher = choice.type === 'historianDecipher';
  const isClueHandLimit = choice.type === 'clueHandLimit';
  const isTeleport = choice.type === 'teleportTile';
  const [tileFilter, setTileFilter] = useState('all');

  useEffect(() => {
    if (isAi) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [isAi, choice]);

  const handleSelect = (action) => {
    sounds.btnClick();
    if (action && (action.startsWith('warp_') || action.startsWith('teleport_') || ['spanish', 'american', 'japanese', 'myth'].includes(action))) {
      sounds.portal();
    }
    engine.resolveChoice(action);
    network.sendAction({ type: 'RESOLVE_CHOICE', action });
    onDismiss();
  };

  if (isAi) {
    const targetCard = (isDecipher && choice.drawnCards) ? choice.drawnCards[0] : (isClueHandLimit && choice.drawnCard) ? choice.drawnCard : null;

    return (
      <div className="side-card-overlay" id="active-modal">
        <div className="side-card-header">
          <div className="side-card-title">
            <span className="bot-badge">🤖 BOT</span>
            <span>{choice.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {targetCard && (
              <button
                className="side-card-maximize"
                title="Click to view card in full screen"
                onClick={() => {
                  sounds.btnClick();
                  onMaximize({
                    title: targetCard.title || (targetCard.isDecoy ? 'Decoy Card' : 'Clue Card'),
                    cardType: targetCard.isDecoy ? 'Decoy Card' : 'Clue Card',
                    description: targetCard.description || targetCard.hint,
                    image: targetCard.image || targetCard.cardImage,
                    era: targetCard.era
                  });
                }}
              >
                🔍
              </button>
            )}
            <button className="side-card-close" title="Dismiss" onClick={() => { sounds.btnClick(); onDismiss(); }}>
              &times;
            </button>
          </div>
        </div>

        <div className="side-card-body">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: activePlayer.color || '#fff' }}>{activePlayer.name}</strong> evaluated tactical options:
          </div>

          {isTeleport && (
            <div style={{ marginTop: "8px", padding: "8px 10px", background: "rgba(139, 92, 246, 0.12)", borderRadius: "6px", border: "1px solid rgba(139, 92, 246, 0.35)" }}>
              <div style={{ fontSize: "0.72rem", color: "#A78BFA", fontWeight: 700, textTransform: "uppercase" }}>
                ✨ Anito Guidance Teleport
              </div>
              <div style={{ fontSize: "0.75rem", color: "#E2E8F0", marginTop: "3px" }}>
                Seeking optimal coordinates in {ERA_NAMES[choice.targetEra] || choice.targetEra}...
              </div>
            </div>
          )}

          {isClueHandLimit && choice.drawnCard && (
            <div style={{ marginTop: "8px", padding: "8px 10px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              <div style={{ fontSize: "0.72rem", color: "#F87171", fontWeight: 700, textTransform: "uppercase" }}>
                🎴 Hand Limit (5/5) Reached
              </div>
              <div style={{ fontSize: "0.75rem", color: "#E2E8F0", marginTop: "3px" }}>
                Drawn: <strong>{choice.drawnCard.isDecoy ? "Decoy Card" : (choice.drawnCard.hint || choice.drawnCard.description)}</strong> ({ERA_NAMES[choice.drawnCard.era] || choice.drawnCard.era})
              </div>
            </div>
          )}

          {isDecipher && choice.drawnCards && (
            <div className="mystery-cards-mini-row side-card-clickable">
              {choice.drawnCards.map((c, idx) => (
                <div key={idx} className={`mystery-card-mini ${idx === 0 ? 'selected-by-bot' : ''}`}>
                  <div style={{ fontSize: '1.4rem' }}>📜</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60A5FA' }}>Card #{idx + 1}</div>
                  {idx === 0 ? <div className="mini-choice-badge">DECIPHERED</div> : <div style={{ fontSize: '0.6rem', color: '#94A3B8' }}>Deck Return</div>}
                </div>
              ))}
            </div>
          )}

          <div className="side-card-status">
            <span className="ai-pulse-dot"></span>
            <span style={{ fontSize: '0.78rem', color: '#93C5FD', fontWeight: 600 }}>
              {choice.options[0]?.label || 'Resolving automatically...'}
            </span>
          </div>
        </div>

        <div className="overlay-timer-bar">
          <div className="overlay-timer-fill"></div>
        </div>
      </div>
    );
  }

  if (isClueHandLimit && choice.drawnCard) {
    const drawn = choice.drawnCard;
    const handCards = choice.handCards || activePlayer?.clueCards || [];
    const missionArtifactId = activePlayer?.mission?.artifactId;

    return (
      <div className="modal-overlay" id="active-modal">
        <div className="modal" style={{ maxWidth: "740px", width: "95%", maxHeight: "90vh", overflowY: "auto" }}>
          <div className="modal-title" style={{ color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span>🎴</span> Hand Limit Reached (5/5 Clue Cards)
          </div>

          <div className="modal-body" style={{ textAlign: "center", marginBottom: "var(--space-md)" }}>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: "0 auto 16px", maxWidth: "600px", lineHeight: 1.45 }}>
              Your clue inventory is full! You excavated a new card. You must either <strong>discard this drawn card</strong> back to the {ERA_NAMES[drawn.era] || drawn.era} pool, or <strong>keep it and discard 1 card</strong> from your hand.
            </p>

            {/* NEWLY DRAWN CARD SECTION */}
            <div style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
              border: "2px solid rgba(245, 158, 11, 0.6)",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "18px",
              boxShadow: "0 0 20px rgba(245, 158, 11, 0.15)",
              textAlign: "left"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ background: "#F59E0B", color: "#000", fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase" }}>
                    ✨ Newly Drawn Card
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#94A3B8", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "4px" }}>
                    {ERA_NAMES[drawn.era] || drawn.era}
                  </span>
                </div>
                {drawn.artifactId === missionArtifactId && (
                  <span style={{ fontSize: "0.72rem", color: "#FCD34D", fontWeight: 700, background: "rgba(245, 158, 11, 0.2)", padding: "2px 8px", borderRadius: "4px", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
                    ⭐ Matches Target Relic!
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {(drawn.cardImage || drawn.image) ? (
                  <img
                    src={drawn.cardImage || drawn.image}
                    alt={drawn.hint || "Clue"}
                    style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: "64px", height: "64px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", flexShrink: 0 }}>
                    {drawn.isDecoy ? "🎭" : "🔍"}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: drawn.isDecoy ? "#F87171" : "#60A5FA" }}>
                    {drawn.isDecoy ? "🎭 Decoy Card (False Lead)" : (drawn.hint || drawn.description || "Clue Card")}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.35 }}>
                    {drawn.description || drawn.hint}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn choice-btn"
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.6)",
                    color: "#FCA5A5",
                    fontSize: "0.82rem",
                    padding: "8px 16px",
                    fontWeight: 700,
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                  disabled={!isMyTurn && network.mode === "online"}
                  onClick={() => handleSelect("discard_drawn")}
                >
                  ❌ Discard Drawn Card (Return to {ERA_NAMES[drawn.era] || drawn.era} Pool)
                </button>
              </div>
            </div>

            {/* OR CHOOSE 1 FROM HAND TO DISCARD */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              margin: "14px 0 12px",
              color: "var(--text-secondary)",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px"
            }}>
              <span style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }}></span>
              <span>OR Keep Drawn Card & Discard 1 From Hand</span>
              <span style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }}></span>
            </div>

            {/* HAND CARDS GRID */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
              gap: "10px",
              marginTop: "10px"
            }}>
              {handCards.map((c, idx) => {
                const isMatch = c.artifactId === missionArtifactId;
                return (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(15, 23, 42, 0.85)",
                      border: c.isDecoy ? "1px dashed rgba(239, 68, 68, 0.5)" : (isMatch ? "1px solid rgba(245, 158, 11, 0.6)" : "1px solid rgba(59, 130, 246, 0.4)"),
                      borderRadius: "8px",
                      padding: "10px 8px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      textAlign: "center",
                      position: "relative",
                      minHeight: "170px"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.65rem" }}>
                        <span style={{ color: "#94A3B8", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px" }}>
                          {ERA_NAMES[c.era]?.replace(" Era", "") || c.era}
                        </span>
                        {c.isDecoy ? (
                          <span style={{ color: "#F87171", fontWeight: 700 }}>🎭 Decoy</span>
                        ) : isMatch ? (
                          <span style={{ color: "#FCD34D", fontWeight: 700 }}>⭐ Mission</span>
                        ) : (
                          <span style={{ color: "#60A5FA" }}>🔍 Clue</span>
                        )}
                      </div>

                      {(c.cardImage || c.image) ? (
                        <img
                          src={c.cardImage || c.image}
                          alt="card"
                          style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", margin: "0 auto 6px", display: "block", border: "1px solid rgba(255,255,255,0.1)" }}
                        />
                      ) : (
                        <div style={{ fontSize: "1.5rem", margin: "4px 0" }}>{c.isDecoy ? "🎭" : "📜"}</div>
                      )}

                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25, maxHeight: "38px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.hint || c.description || (c.isDecoy ? "Decoy Card" : "Clue Card")}
                      </div>
                    </div>

                    <button
                      className="btn choice-btn"
                      style={{
                        marginTop: "8px",
                        fontSize: "0.68rem",
                        padding: "6px 4px",
                        background: "rgba(59, 130, 246, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.4)",
                        color: "#93C5FD",
                        borderRadius: "6px",
                        fontWeight: 700,
                        cursor: "pointer",
                        lineHeight: 1.2
                      }}
                      disabled={!isMyTurn && network.mode === "online"}
                      onClick={() => handleSelect(`discard_hand_${idx}`)}
                    >
                      🔄 Discard #{idx + 1} & Keep New
                    </button>
                  </div>
                );
              })}
            </div>

            {!isMyTurn && network.mode === "online" && (
              <div style={{ fontSize: "0.85rem", color: "#60A5FA", marginTop: "14px", fontWeight: 600 }}>
                ⏳ Waiting for {activePlayer.name} to choose...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isTeleport) {
    const tiles = choice.tiles || [];
    const targetEra = choice.targetEra || 'myth';
    const eraName = ERA_NAMES[targetEra] || targetEra;
    const boardTiles = engine?.state?.board?.[targetEra] || [];

    // Filter tiles based on selected pill
    let filteredTiles = tiles;
    if (tileFilter === 'clue') filteredTiles = tiles.filter(t => t.type === 'clue');
    else if (tileFilter === 'artifact') filteredTiles = tiles.filter(t => t.type === 'artifact');
    else if (tileFilter === 'timegate') filteredTiles = tiles.filter(t => t.type === 'timegate');
    else if (tileFilter === 'event') filteredTiles = tiles.filter(t => t.type === 'event');
    else if (tileFilter === 'safe') filteredTiles = tiles.filter(t => t.type !== 'danger' && t.type !== 'paradox');

    return (
      <div className="modal-overlay" id="active-modal">
        <div className="modal" style={{ maxWidth: "780px", width: "95%", maxHeight: "90vh", overflowY: "auto", animation: "modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div className="modal-title" style={{ color: "#C084FC", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "1.25rem" }}>
            <span style={{ filter: "drop-shadow(0 0 8px #A855F7)" }}>✨</span>
            <span>Anito Guidance — Choose Destination</span>
          </div>

          <div className="modal-body" style={{ textAlign: "center", marginBottom: "var(--space-md)" }}>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", margin: "0 auto 14px", maxWidth: "620px", lineHeight: 1.45 }}>
              The ancestral Anito spirits open ethereal pathways across time! Choose <strong>any tile</strong> in the <strong>{eraName}</strong> to materialize upon:
            </p>

            {/* Quick Filters */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px", marginBottom: "16px" }}>
              {[
                { id: 'all', label: `All Spaces (${tiles.length})` },
                { id: 'artifact', label: `🏆 Artifact Tile` },
                { id: 'clue', label: `🔍 Clues (${tiles.filter(t => t.type === 'clue').length})` },
                { id: 'timegate', label: `🌀 Time Gate` },
                { id: 'event', label: `⚡ Events (${tiles.filter(t => t.type === 'event').length})` },
                { id: 'safe', label: `🛡️ Safe Spaces` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => { sounds.btnClick(); setTileFilter(f.id); }}
                  style={{
                    background: tileFilter === f.id ? "linear-gradient(135deg, #7C3AED, #4F46E5)" : "rgba(255, 255, 255, 0.06)",
                    border: tileFilter === f.id ? "1.5px solid #A78BFA" : "1px solid rgba(255, 255, 255, 0.12)",
                    color: tileFilter === f.id ? "#FFF" : "var(--text-secondary)",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Interactive Tile Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: "10px",
              maxHeight: "380px",
              overflowY: "auto",
              padding: "4px",
              borderRadius: "8px",
              background: "rgba(0, 0, 0, 0.25)"
            }}>
              {filteredTiles.map((t) => {
                const bTile = boardTiles[t.index];
                const occupants = (bTile?.players || []).map(pId => engine.state.players[pId]).filter(Boolean);
                const isArtifact = t.type === 'artifact';
                const isClue = t.type === 'clue';
                const isTimeGate = t.type === 'timegate';
                const isDanger = t.type === 'danger';
                const isParadox = t.type === 'paradox';

                let borderStyle = "1px solid rgba(255, 255, 255, 0.12)";
                let bgStyle = "rgba(15, 23, 42, 0.7)";
                let glowStyle = "none";

                if (isArtifact) {
                  borderStyle = "2px solid #F59E0B";
                  bgStyle = "linear-gradient(145deg, rgba(245, 158, 11, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)";
                  glowStyle = "0 0 16px rgba(245, 158, 11, 0.35)";
                } else if (isClue) {
                  borderStyle = "1.5px solid #3B82F6";
                  bgStyle = "linear-gradient(145deg, rgba(59, 130, 246, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)";
                  glowStyle = "0 0 12px rgba(59, 130, 246, 0.25)";
                } else if (isTimeGate) {
                  borderStyle = "1.5px solid #A855F7";
                  bgStyle = "linear-gradient(145deg, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)";
                  glowStyle = "0 0 12px rgba(168, 85, 247, 0.25)";
                } else if (isDanger) {
                  borderStyle = "1px solid rgba(239, 68, 68, 0.6)";
                } else if (isParadox) {
                  borderStyle = "1px solid rgba(139, 92, 246, 0.5)";
                }

                return (
                  <button
                    key={t.index}
                    className="teleport-tile-card"
                    style={{
                      background: bgStyle,
                      border: borderStyle,
                      borderRadius: "10px",
                      padding: "10px 6px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "center",
                      cursor: (isMyTurn || network.mode !== "online") ? "pointer" : "not-allowed",
                      position: "relative",
                      minHeight: "105px",
                      boxShadow: glowStyle,
                      transition: "transform 0.18s ease, box-shadow 0.18s ease"
                    }}
                    disabled={!isMyTurn && network.mode === "online"}
                    onClick={() => handleSelect(t.action)}
                    title={`Click to teleport to Space #${t.index + 1} (${t.typeLabel})`}
                  >
                    <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.65rem", padding: "0 2px" }}>
                      <span style={{
                        background: isArtifact ? "#F59E0B" : (isClue ? "#3B82F6" : "rgba(255, 255, 255, 0.12)"),
                        color: isArtifact ? "#000" : "#FFF",
                        fontWeight: 800,
                        padding: "1px 5px",
                        borderRadius: "3px"
                      }}>
                        #{t.index + 1}
                      </span>
                      {isArtifact && <span style={{ fontSize: "0.6rem", color: "#FCD34D", fontWeight: 700 }}>RELIC</span>}
                    </div>

                    <div style={{ fontSize: isArtifact ? "2rem" : "1.7rem", margin: "4px 0", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
                      {t.icon}
                    </div>

                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: isArtifact ? "#FCD34D" : (isClue ? "#93C5FD" : "var(--text-primary)") }}>
                      {t.typeLabel}
                    </div>

                    {occupants.length > 0 && (
                      <div style={{ display: "flex", gap: "2px", marginTop: "4px" }}>
                        {occupants.map(p => (
                          <span
                            key={p.id}
                            style={{
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              background: p.color || "#FFF",
                              border: "1px solid #000",
                              display: "inline-block"
                            }}
                            title={`Occupant: ${p.name}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {!isMyTurn && network.mode === "online" && (
              <div style={{ fontSize: "0.85rem", color: "#60A5FA", marginTop: "14px", fontWeight: 600 }}>
                ⏳ Waiting for {activePlayer.name} to select destination...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="modal-overlay" id="active-modal">
      <div className="modal" style={isDecipher ? { maxWidth: '500px', width: '95%' } : {}}>
        <div className="modal-title">{choice.title}</div>
        <div className="modal-body" style={{ textAlign: 'center', marginBottom: isDecipher ? '4px' : 'var(--space-lg)' }}>
          <p>{choice.message}</p>
          {isDecipher && choice.drawnCards && (
            <div>
              <div className="mystery-cards-grid">
                {choice.drawnCards.map((c, idx) => (
                  <div
                    key={idx}
                    className="mystery-card choice-btn"
                    title={`Click to choose Mystery Card #${idx + 1}`}
                    style={(!isMyTurn && network.mode === 'online') ? { pointerEvents: 'none', opacity: 0.6 } : { cursor: 'pointer' }}
                    onClick={() => isMyTurn && handleSelect(`pick_${idx}`)}
                  >
                    <div style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.7))' }}>📜</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#60A5FA', letterSpacing: '0.5px' }}>CARD #{idx + 1}</div>
                    <div style={{ fontSize: '0.62rem', color: '#93C5FD', background: 'rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                      FACE DOWN
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#93C5FD', marginTop: '12px', fontWeight: 600 }}>
                🔍 Click any face-down mystery card above to keep it!
              </div>
            </div>
          )}

          {!isMyTurn && network.mode === 'online' && (
            <div style={{ fontSize: '0.85rem', color: '#60A5FA', marginTop: '10px', fontWeight: 600 }}>
              ⏳ Waiting for {activePlayer.name} to choose...
            </div>
          )}
        </div>

        {!isDecipher && (
          <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {choice.options.map((opt, i) => (
              <button
                key={i}
                className="btn btn-secondary choice-btn"
                style={{ width: '100%' }}
                disabled={!isMyTurn && network.mode === 'online'}
                onClick={() => handleSelect(opt.action)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
