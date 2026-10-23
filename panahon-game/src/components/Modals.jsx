import React, { useEffect } from 'react';
import sounds from '../sound.js';
import { ERA_NAMES } from '../gameData.js';

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
              <div className="dice" style={{ borderColor: data.success ? 'var(--text-success)' : 'var(--text-danger)' }}>
                {data.diceRoll}
              </div>
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
        <div className="modal-title" style={{ color: isDanger ? 'var(--text-danger)' : (isEvent ? 'var(--tile-event)' : 'var(--text-accent)') }}>
          {modal.cardType || modal.title}
        </div>

        <div className="modal-body">
          <div className="card-display">
            {modal.image && <img src={modal.image} alt={modal.title} />}
            <div className="card-display-title">{modal.title}</div>
            <div className="card-display-desc">{modal.description}</div>
          </div>

          {isDanger && modal.diceRoll !== undefined && (
            <div className="modal-dice">
              <div className="dice" style={{ borderColor: modal.success ? 'var(--text-success)' : 'var(--text-danger)' }}>
                {modal.diceRoll}
              </div>
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
          <button className="btn btn-primary" onClick={handleDismiss}>Acknowledge</button>
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
    if (action && (action.startsWith('warp_') || ['spanish', 'american', 'japanese', 'myth'].includes(action))) {
      sounds.portal();
    }
    engine.resolveChoice(action);
    network.sendAction({ type: 'RESOLVE_CHOICE', action });
    onDismiss();
  };

  if (isAi) {
    const targetCard = (isDecipher && choice.drawnCards) ? choice.drawnCards[0] : null;

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

  return (
    <div className="modal-overlay" id="active-modal">
      <div className="modal" style={isDecipher ? { maxWidth: '500px', width: '95%' } : {}}>
        <div className="modal-title">{choice.title}</div>
        <div className="modal-body" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
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
      </div>
    </div>
  );
}
