import React, { useEffect, useState, useRef, useCallback } from 'react';
import sounds from '../sound.js';
import { ERA_NAMES, ARTIFACTS } from '../gameData.js';
import Dice from './game/Dice';

export function MaximizedCardPreview({ data, onClose }) {
  if (!data) return null;

  if (data.isAbilityActivate) {
    const pName = data.playerName || 'Operative';
    const pAvatar = data.playerAvatar || 'assets/Characters/Copy of adventurer.png';
    const pColor = data.playerColor || '#38BDF8';
    const pRole = data.playerRole || 'Operative';

    const abilityKey = data.abilityKey || 'GENERIC';
    const isMomentum = abilityKey === 'MOMENTUM';
    const isTrap = abilityKey === 'TEMPORAL_TRAP';
    const isRepair = abilityKey === 'TEMPORAL_REPAIR';
    const isPickpocket = abilityKey === 'PICKPOCKET' || abilityKey === 'SHADOW_POCKETS';
    const isDecoyDiscard = abilityKey === 'DECOY_DISCARD';
    const isForesight = abilityKey === 'TEMPORAL_FORESIGHT';
    const isReverseTime = abilityKey === 'REVERSE_TIME';

    const themeClass = isMomentum
      ? 'theme-momentum'
      : (isTrap
        ? 'theme-trap'
        : (isRepair
          ? 'theme-repair'
          : (isPickpocket
            ? 'theme-pickpocket'
            : (isDecoyDiscard
              ? 'theme-decoy'
              : (isForesight
                ? 'theme-foresight'
                : 'theme-reverse')))));

    const icon = isMomentum
      ? '⚡'
      : (isTrap
        ? '🕸️'
        : (isRepair
          ? '✨'
          : (isPickpocket
            ? '🗡️'
            : (isDecoyDiscard
              ? '📜'
              : (isForesight
                ? '🔮'
                : '⏪')))));

    return (
      <div className={`modal-overlay ability-immersion-overlay ${themeClass}`} style={{ zIndex: 10000 }}>
        <div className="ability-vignette-backdrop" />
        <div className="modal ability-immersion-modal card-preview-modal" style={{ maxWidth: "520px", width: "92%", animation: "modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
          <div className="ability-modal-header">
            <div className="ability-header-badge">
              <span>{icon}</span>
              <span>{data.subtitle || 'ABILITY INSPECTION'}</span>
              <span>{icon}</span>
            </div>
            <div className="ability-modal-title">{data.title}</div>
          </div>

          <div className="modal-body ability-modal-body">
            <div className="ability-showcase-stage">
              <div className="ability-single-operative">
                <div className="ability-avatar-large-wrap" style={{ borderColor: pColor, boxShadow: `0 0 24px ${pColor}, inset 0 0 14px ${pColor}` }}>
                  <img src={pAvatar} alt={pName} className="operative-large-img" />
                  <div className="ability-floating-icon">{icon}</div>
                </div>
                <div className="ability-hero-caption">
                  <div className="hero-name" style={{ color: pColor }}>{pName}</div>
                  <div className="hero-class">{pRole}</div>
                </div>
              </div>
            </div>

            <div className="ability-lore-card">
              <div className="ability-lore-text">{data.description}</div>
            </div>
          </div>

          <div className="modal-actions ability-modal-actions">
            <button className="btn btn-primary ability-confirm-btn" onClick={() => { sounds.btnClick(); onClose(); }}>
              Close Inspection
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!data) return null;

  if (data.isTimeStop) {
    const casterName = data.casterName || 'Chronomancer';
    const casterAvatar = data.casterAvatar || 'assets/Characters/chronomancer_128x128.png';
    const casterColor = data.casterColor || '#38BDF8';
    const casterRole = data.casterRole || 'CHRONOMANCER';

    const victimName = data.victimName || data.playerName || 'Operative';
    const victimAvatar = data.victimAvatar || 'assets/Characters/adventurer_128x128.png';
    const victimColor = data.victimColor || '#FDA4AF';
    const victimRole = data.victimRole || 'Operative';

    return (
      <div className="modal-overlay timestop-modal-overlay" style={{ zIndex: 10000 }}>
        <div className="timestop-frost-vignette" />
        <div className="modal timestop-card-modal card-preview-modal" style={{ maxWidth: "520px", width: "92%", animation: "modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
          <div className="timestop-header">
            <div className="timestop-header-badge">
              <span>⏳</span>
              <span>TEMPORAL STASIS</span>
              <span>⏳</span>
            </div>
            <div className="timestop-title">⌛ TIME STOPPED! ⌛</div>
            <div className="timestop-subtitle">CHRONOMANCER'S TIME WEAVING MAGIC</div>
          </div>

          <div className="modal-body timestop-modal-body" style={{ textAlign: "center" }}>
            <div className="timestop-chamber-stage">
              <div className="timestop-operative-card caster-operative">
                <div className="operative-role-tag" style={{ color: casterColor }}>CASTER</div>
                <div className="operative-portrait-wrap">
                  <img src={casterAvatar} alt={casterName} className="operative-img" />
                </div>
                <div className="operative-name" style={{ color: casterColor }}>{casterName}</div>
                <div className="operative-class-badge">{casterRole}</div>
              </div>

              <div className="timestop-stasis-conduit">
                <div className="stasis-rune-orb">
                  <span className="stasis-rune-glyph">⌛</span>
                </div>
                <div className="stasis-beam-status">TIME FREEZE</div>
              </div>

              <div className="timestop-operative-card victim-operative frozen">
                <div className="operative-role-tag" style={{ color: '#EF4444' }}>FROZEN TARGET</div>
                <div className="operative-portrait-wrap frozen-portrait">
                  <img src={victimAvatar} alt={victimName} className="operative-img frozen-sprite" />
                  <div className="stasis-ice-crystal" />
                </div>
                <div className="operative-name" style={{ color: victimColor }}>{victimName}</div>
                <div className="operative-class-badge frozen-badge">TURN SKIPPED</div>
              </div>
            </div>

            <div className="timestop-lore-box">
              <div className="timestop-lore-desc">
                {data.description || `<strong>${victimName}</strong> was caught in Chronomancer <strong>${casterName}</strong>'s temporal freeze! All movement is locked in stasis—their next turn is skipped.`}
              </div>
            </div>

            <div className="timestop-specs-grid">
              <div className="timestop-spec-item">
                <div className="spec-label">CASTER</div>
                <div className="spec-val" style={{ color: '#FFD700' }}>{casterName}</div>
              </div>
              <div className="timestop-spec-item">
                <div className="spec-label">EFFECT</div>
                <div className="spec-val" style={{ color: '#EF4444' }}>TURN SKIPPED</div>
              </div>
              <div className="timestop-spec-item">
                <div className="spec-label">DURATION</div>
                <div className="spec-val" style={{ color: '#F59E0B' }}>1 TURN</div>
              </div>
            </div>
          </div>

          <div className="modal-actions timestop-modal-actions">
            <button className="btn btn-primary timestop-confirm-btn" onClick={() => { sounds.btnClick(); onClose(); }}>
              CLOSE
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data.isParadox) {
    const oldP = data.oldParadox ?? 0;
    const newP = data.newParadox ?? 1;
    const maxP = data.maxParadox ?? 5;
    const isCritical = data.criticalOverload || newP >= 5;
    const isDangerTriggered = data.triggeredDanger || (newP === 4 && oldP < 4);

    return (
      <div className="modal-overlay paradox-rift-modal-overlay" style={{ zIndex: 10000 }}>
        <div className="paradox-rift-backdrop" />
        <div className="modal paradox-card-modal card-preview-modal" style={{ maxWidth: "480px", width: "92%", animation: "modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>
          <div className="paradox-header">
            <div className="paradox-header-badge">
              <span>⏳</span>
              <span>TEMPORAL ANOMALY DETECTED</span>
              <span>⏳</span>
            </div>
            <div className="paradox-title">🌀 PARADOX BREACH! 🌀</div>
            {data.era && (
              <div className="paradox-sector-tag">
                TIMELINE SECTOR: <span>{ERA_NAMES[data.era]?.toUpperCase() || data.era}</span> • TILE #{Number(data.tileIndex ?? 0) + 1}
              </div>
            )}
          </div>

          <div className="modal-body paradox-modal-body" style={{ textAlign: "center" }}>
            <div className="paradox-chamber-stage">
              <div className="paradox-vortex-container">
                <div className="paradox-vortex-ring ring-outer" />
                <div className="paradox-vortex-ring ring-inner" />
                <div className="paradox-vortex-tile-wrapper">
                  <img
                    src="/assets/Tiles/paradox_tile.png"
                    alt="Paradox Tile"
                    className="paradox-chamber-tile-img"
                  />
                </div>
                <div className="paradox-lightning-arc arc-1" />
                <div className="paradox-lightning-arc arc-2" />
              </div>

              <div className={`paradox-status-badge ${isCritical ? "status-critical" : (isDangerTriggered ? "status-danger" : "status-warning")}`}>
                {isCritical
                  ? "💥 CRITICAL BREACH (+2 Timeline Meter)"
                  : isDangerTriggered
                    ? "⚠️ SEVERE INSTABILITY: HAZARD ANOMALY IMMINENT"
                    : newP >= 3
                      ? "⚡ TEMPORAL DRAIN: -1 ENERGY"
                      : newP >= 2
                        ? "📉 CAUSAL DISCORD: -1 POINT"
                        : "⚠️ TEMPORAL FRICTION (+1 PARADOX)"}
              </div>
            </div>

            <div className="paradox-meter-container">
              <div className="paradox-meter-header">
                <span className="paradox-meter-title">PARADOX METER</span>
                <span className="paradox-meter-count">
                  <span className="old-count">{oldP}</span>
                  <span className="arrow-sep">➔</span>
                  <span className="new-count">{newP}</span>
                  <span className="max-count"> / {maxP}</span>
                </span>
              </div>

              <div className="paradox-pip-bar">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const wasFilled = oldP >= lvl;
                  const isNewlyFilled = !wasFilled && (newP >= lvl || (isCritical && lvl === 5));
                  const penaltyLabel = lvl === 2 ? "-1 Point" : lvl === 3 ? "-1 Energy" : lvl === 4 ? "Danger Card" : lvl === 5 ? "+2 Timeline" : "Stable";

                  return (
                    <div
                      key={lvl}
                      className={`paradox-pip-slot ${wasFilled ? "filled" : ""} ${isNewlyFilled ? "newly-filled pulsing" : ""}`}
                    >
                      <div className="pip-level-num">LVL {lvl}</div>
                      <div className="pip-gem">
                        <span className="pip-glyph">{lvl >= 4 ? "💀" : lvl >= 2 ? "⚠️" : "💠"}</span>
                      </div>
                      <div className="pip-penalty-tag">{penaltyLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="paradox-lore-box">
              <div className="paradox-lore-desc">{data.description}</div>
              {data.playerName && (
                <div className="paradox-affected-player">
                  Operative Affected: <strong>{data.playerName}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions paradox-modal-actions">
            <button className="btn btn-primary paradox-stabilize-btn" onClick={() => { sounds.btnClick(); onClose(); }}>
              Close Inspection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data.isDanger) {
    return (
      <div className="modal-overlay danger-modal-overlay" style={{ zIndex: 10000 }}>
        <div className="danger-vignette-backdrop" />
        <div className="modal danger-card-modal card-preview-modal" style={{ maxWidth: "530px", width: "94%", animation: "modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>

          <div className="danger-header">
            <div className="danger-header-badge">
              <span>⚠️</span>
              <span>HISTORICAL HAZARD STRIKE</span>
              <span>⚠️</span>
            </div>
            <div className="danger-title">
              <span>🚨</span>
              <span>{data.title || 'HAZARD ANOMALY'}</span>
              <span>🚨</span>
            </div>
            {data.era && (
              <div className="danger-sector-tag">
                SECTOR: <span>{ERA_NAMES[data.era]?.toUpperCase() || data.era}</span> • HAZARD STRIKE
              </div>
            )}
          </div>

          <div className="modal-body danger-modal-body">
            <div className="danger-chamber-stage">
              <div className="danger-card-frame">
                {data.image ? (
                  <img src={data.image} alt={data.title} className="danger-card-img" />
                ) : (
                  <div className="danger-fallback-icon">⚠️</div>
                )}
                <div className="danger-tile-token">
                  <img src="/assets/Tiles/danger_tile.png" alt="Danger Tile" className="danger-mini-tile-img" />
                </div>
              </div>
              <div className="danger-status-alert">
                {data.diceRoll !== null && data.diceRoll !== undefined ? (
                  data.success ? <span className="text-success">✓ HAZARD EVADED SAFELY</span> : <span className="text-danger">💥 HAZARD PENALTY INFLICTED</span>
                ) : (
                  <span>⚠️ SURVIVAL HAZARD CHECK REQUIRED</span>
                )}
              </div>
            </div>

            <div className="danger-lore-box">
              <div className="danger-lore-title">HAZARD REPORT</div>
              <div className="danger-lore-desc">{data.description}</div>
            </div>

            {data.diceRoll !== null && data.diceRoll !== undefined && (
              <div className={`danger-outcome-plaque ${data.success ? 'outcome-evaded' : 'outcome-failed'}`}>
                <div className="outcome-dice-wrap">
                  <Dice value={data.diceRoll} size="sm" theme={data.success ? 'success' : 'hazard'} isInteractive={false} />
                </div>
                <div className="outcome-details">
                  <div className="outcome-verdict">
                    {data.success ? '✓ HAZARD EVADED!' : '✗ HAZARD TRIGGERED!'}
                    <span className="outcome-roll-val">(Rolled {data.diceRoll})</span>
                  </div>
                  <div className="outcome-msg">
                    {data.success ? (data.successMsg || 'Survival check passed!') : (data.failMsg || 'Hazard penalty suffered!')}
                  </div>
                  {data.guardianReduction && (
                    <div className="guardian-relief-tag">
                      🛡️ GUARDIAN MASTERY: Hazard penalty reduced by 1!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions danger-modal-actions">
            <button className="btn btn-primary danger-continue-btn" onClick={() => { sounds.btnClick(); onClose(); }}>
              Close Inspection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data.isEvent) {
    return (
      <div className="modal-overlay event-modal-overlay" style={{ zIndex: 10000 }}>
        <div className="event-vignette-backdrop" />
        <div className="modal event-card-modal card-preview-modal" style={{ maxWidth: "530px", width: "94%", animation: "modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>

          <div className="event-header">
            <div className="event-header-badge">
              <span>⚡</span>
              <span>CHRONAL TIMELINE EVENT</span>
              <span>⚡</span>
            </div>
            <div className="event-title">
              <span>📜</span>
              <span>{data.title || 'TIMELINE EVENT'}</span>
              <span>📜</span>
            </div>
            {data.era && (
              <div className="event-sector-tag">
                HISTORICAL SECTOR: <span>{ERA_NAMES[data.era]?.toUpperCase() || data.era}</span> • CHRONO SHIFT
              </div>
            )}
          </div>

          <div className="modal-body event-modal-body">
            <div className="event-chamber-stage">
              <div className="event-card-frame">
                {data.image ? (
                  <img src={data.image} alt={data.title} className="event-card-img" />
                ) : (
                  <div className="event-fallback-icon">⚡</div>
                )}
                <div className="event-tile-token">
                  <img src="/assets/Tiles/event_tile.png" alt="Event Tile" className="event-mini-tile-img" />
                </div>
              </div>
              <div className="event-interference-tag">
                <span>🌀</span>
                <span>TIMELINE INTERFERENCE FLUX APPLIED</span>
              </div>
            </div>

            <div className="event-lore-box">
              <div className="event-lore-title">HISTORICAL DIVERGENCE REPORT</div>
              <div className="event-lore-desc">{data.description}</div>
            </div>

            {data.resultText && (
              <div className="event-consequence-plaque">
                <div className="consequence-label">CHRONO RESOLUTION RESULT</div>
                <div className="consequence-text">⚡ {data.resultText}</div>
              </div>
            )}
          </div>

          <div className="modal-actions event-modal-actions">
            <button className="btn btn-primary event-confirm-btn" onClick={() => { sounds.btnClick(); onClose(); }}>
              Close Inspection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data.isClue) {
    const isDecoy = data.isDecoy || data.cardType === 'Decoy Card' || data.title?.includes('Decoy');
    const clueCount = data.clueCount ?? 1;
    const maxClues = data.maxClues ?? 5;
    const relicName = data.artifactName || (data.artifactId && ARTIFACTS[data.era]?.find(a => a.id === data.artifactId)?.name) || 'Historical Relic';
    const progressCount = data.artifactProgress ?? 1;

    return (
      <div className="modal-overlay clue-modal-overlay" style={{ zIndex: 10000 }}>
        <div className="clue-vignette-backdrop" />
        <div className="modal clue-card-modal card-preview-modal" style={{ maxWidth: "530px", width: "94%", animation: "modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <button className="modal-close" onClick={() => { sounds.btnClick(); onClose(); }}>&times;</button>

          <div className="clue-header">
            <div className="clue-header-badge">
              <span>📜</span>
              <span>HISTORICAL INTEL DISCOVERY</span>
              <span>📜</span>
            </div>
            <div className="clue-title">
              <span>🔍</span>
              <span>{data.title || (isDecoy ? 'DECOY ANOMALY!' : 'CLUE FOUND!')}</span>
              <span>🔍</span>
            </div>
            {data.era && (
              <div className="clue-sector-tag">
                TIMELINE SECTOR: <span>{ERA_NAMES[data.era]?.toUpperCase() || data.era}</span> • ARCHIVAL INTEL
              </div>
            )}
          </div>

          <div className="modal-body clue-modal-body">
            <div className="clue-chamber-stage">
              <div className="clue-card-frame">
                {data.image ? (
                  <img src={data.image} alt={data.title} className="clue-card-img" />
                ) : (
                  <div className="clue-fallback-icon">🔍</div>
                )}
                <div className="clue-tile-token">
                  <img src="/assets/Tiles/clue_tile.png" alt="Clue Tile" className="clue-mini-tile-img" />
                </div>
              </div>

              <div className={`clue-seal-badge ${isDecoy ? 'seal-decoy' : 'seal-authentic'}`}>
                {isDecoy ? (
                  <span>⚠️ DECOY INTEL — FALSE ANOMALY LEAD</span>
                ) : (
                  <span>✓ VERIFIED HISTORICAL ARTIFACT CLUE</span>
                )}
              </div>
            </div>

            <div className="clue-lore-box">
              <div className="clue-lore-title">DECRYPTED FIELD NOTES</div>
              <div className="clue-lore-desc">{data.description}</div>
              {data.hint && data.hint !== data.description && (
                <div className="clue-hint-line">
                  <span>💡</span> <em>Context: {data.hint}</em>
                </div>
              )}
            </div>

            <div className="clue-specs-grid">
              <div className="clue-spec-item">
                <div className="spec-label">ASSOCIATED RELIC</div>
                <div className="spec-val" style={{ color: isDecoy ? '#FCA5A5' : '#FFD700' }}>
                  {isDecoy ? 'None (Decoy Trail)' : relicName}
                </div>
                {!isDecoy && (
                  <div className="spec-sub">
                    Intel: <strong>{progressCount} / 3</strong> Fragments
                  </div>
                )}
              </div>

              <div className="clue-spec-item">
                <div className="spec-label">CLUE SATCHEL</div>
                <div className="spec-val" style={{ color: '#FDE047' }}>
                  {clueCount} / {maxClues} HELD
                </div>
                <div className="satchel-pip-row">
                  {[...Array(maxClues)].map((_, i) => (
                    <span
                      key={i}
                      className={`satchel-pip ${i < clueCount ? 'pip-filled' : 'pip-empty'}`}
                    >
                      {i < clueCount ? '📜' : '⬝'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions clue-modal-actions">
            <button className="btn btn-primary clue-confirm-btn" onClick={() => { sounds.btnClick(); onClose(); }}>
              Close Inspection
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  const activePlayer = engine?.getCurrentPlayer?.() || engine?.state?.players?.[engine?.state?.currentPlayerIndex];
  const drawingPlayer = (modal.playerId !== undefined && engine?.state?.players?.[modal.playerId])
    ? engine.state.players[modal.playerId]
    : (modal.drawingPlayer || activePlayer);

  const isAi = drawingPlayer?.isAi === true;
  const isSpectator = network?.isSpectator === true;
  const isOnline = network?.mode === 'online';

  // In online mode, drawing player id matches network.playerId; in local mode, human player is taking turn
  const isMyCard = !isSpectator && (
    isOnline
      ? (drawingPlayer?.id !== undefined ? drawingPlayer.id === network.playerId : false)
      : (!isAi && activePlayer?.id === drawingPlayer?.id)
  );

  const isOtherPlayer = !isMyCard;

  const isDanger = modal.type === 'danger';
  const isEvent = modal.type === 'event';
  const isArtifact = modal.type === 'artifact';
  const isClue = modal.isClue || modal.cardType === 'Clue Card' || modal.cardType === 'Decoy Card';
  const isTemporalOccurrence = modal.title === 'Temporal Occurrence!' || (modal.description && modal.description.includes('Temporal Occurrence'));
  const isParadox = modal.type === 'paradox' || modal.title === 'Paradox Zone Breach!';
  const isTimeStop = modal.type === 'timeStop' || modal.title?.includes('Time Stop') || modal.title?.includes('TEMPORAL STASIS');
  const isAbilityActivate = modal.type === 'abilityActivate';

  // In local mode or when user is victim/caster, treat as time stop for me
  const isTimeStopForMe = isTimeStop && (!isOnline || network?.playerId === modal.victimId || network?.playerId === modal.playerId);

  // Hide other players' and bots' clue cards (unless observing as spectator)
  const isSecretToMe = isClue && !isMyCard && !isSpectator;

  // Duration: 6.0 seconds for Event / Danger / TimeStop cards, 5.5s for Artifacts, 4.5s for Clues/Info
  const speed = engine?.simulationSpeed || 1;
  const durationMs = (isDanger || isEvent || isParadox || isTimeStop)
    ? Math.max(3500, Math.round(6500 / speed))
    : (isArtifact ? Math.max(2600, Math.round(5500 / speed)) : Math.max(2200, Math.round(4500 / speed)));

  const [isHovered, setIsHovered] = useState(false);
  const [isRollingDanger, setIsRollingDanger] = useState(false);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const timerRef = useRef(null);
  const onDismissRef = useRef(onDismiss);

  const handleRollDanger = useCallback(() => {
    if (isRollingDanger || !modal?.needsRoll || isOtherPlayer) return;
    setIsRollingDanger(true);
    sounds.diceRoll?.();

    setTimeout(() => {
      const res = engine?.rollDangerDie?.(activePlayer?.id);
      network?.sendAction?.({ type: 'ROLL_DANGER_DIE', playerIdx: activePlayer?.id });
      setIsRollingDanger(false);
      if (res?.success) {
        sounds.artifact?.();
      } else {
        sounds.danger?.();
      }
    }, 700);
  }, [isRollingDanger, modal?.needsRoll, isOtherPlayer, engine, network, activePlayer?.id]);

  // Spacebar and Enter shortcut to roll survival die
  useEffect(() => {
    if (!isDanger || !modal?.needsRoll || isOtherPlayer || isRollingDanger) return;
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleRollDanger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDanger, modal?.needsRoll, isOtherPlayer, isRollingDanger, handleRollDanger]);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Immersion sound effects on tile landing
  useEffect(() => {
    if (isClue && !isTemporalOccurrence && !isParadox && !isTimeStop && !isAbilityActivate) {
      sounds.clueDiscovery?.() || sounds.clue?.();
    }
  }, [isClue, isTemporalOccurrence, isParadox, isTimeStop, isAbilityActivate, modal?._timestamp, modal?.title]);

  useEffect(() => {
    if (isEvent && !isTemporalOccurrence && !isParadox && !isTimeStop && !isAbilityActivate) {
      sounds.eventTrigger?.();
    }
  }, [isEvent, isTemporalOccurrence, isParadox, isTimeStop, isAbilityActivate, modal?._timestamp, modal?.title]);

  useEffect(() => {
    if (isDanger && !isTemporalOccurrence && !isParadox && !isTimeStop && !isAbilityActivate) {
      sounds.dangerAlarm?.() || sounds.danger?.();
    }
  }, [isDanger, isTemporalOccurrence, isParadox, isTimeStop, isAbilityActivate, modal?._timestamp, modal?.title]);

  useEffect(() => {
    if (isTemporalOccurrence) {
      sounds.timeRift?.();
    }
  }, [isTemporalOccurrence]);

  useEffect(() => {
    if (isTimeStop) {
      sounds.timeFreeze?.() || sounds.timeRift?.();
    }
  }, [isTimeStop]);

  useEffect(() => {
    if (isParadox) {
      sounds.paradox?.();
      const t = setTimeout(() => {
        sounds.timeRift?.();
      }, 160);
      return () => clearTimeout(t);
    }
  }, [isParadox]);

  useEffect(() => {
    if (isAbilityActivate) {
      switch (modal.abilityKey) {
        case 'MOMENTUM':
          sounds.momentumSurge?.();
          break;
        case 'TEMPORAL_TRAP':
          sounds.trapPlant?.();
          break;
        case 'TEMPORAL_REPAIR':
          sounds.holyRepair?.();
          break;
        case 'PICKPOCKET':
        case 'SHADOW_POCKETS':
          sounds.shadowSwipe?.();
          break;
        case 'DECOY_DISCARD':
          sounds.decipherScroll?.();
          break;
        case 'TEMPORAL_FORESIGHT':
        case 'REVERSE_TIME':
          sounds.chronalRewind?.();
          break;
        default:
          sounds.abilityActivate?.();
      }
    }
  }, [isAbilityActivate, modal?.abilityKey]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    elapsedRef.current = 0;
  }, [modal?.title, modal?._timestamp, modal?.id]);

  // Tell engine when user is hovering so AI bots and auto-move pause
  useEffect(() => {
    if (engine) {
      engine._isModalHovered = isHovered;
    }
    return () => {
      if (engine) {
        engine._isModalHovered = false;
      }
    };
  }, [isHovered, engine]);

  // High-performance timer with pause/resume support
  useEffect(() => {
    if (!isOtherPlayer || modal?.needsRoll) return;

    if (isHovered) {
      elapsedRef.current += (Date.now() - startTimeRef.current);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    startTimeRef.current = Date.now();
    const remaining = Math.max(100, durationMs - elapsedRef.current);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onDismissRef.current?.();
    }, remaining);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOtherPlayer, isHovered, durationMs, modal?.title, modal?._timestamp, modal?.id, modal?.diceRoll, modal?.needsRoll]);

  const handleDismiss = useCallback(() => {
    sounds.btnClick();
    if (!network?.isSpectator && (network?.mode !== 'online' || modal.playerId === undefined || modal.playerId === network.playerId)) {
      if (typeof engine?.dismissModal === 'function') {
        engine.dismissModal();
      }
      network?.sendAction?.({ type: 'DISMISS_MODAL' });
    }
    onDismissRef.current?.();
  }, [network, modal.playerId, engine]);

  // Spacebar and Enter shortcut for active player / victim to acknowledge modals when not waiting for a die roll
  useEffect(() => {
    if (isDanger && modal?.needsRoll && !isOtherPlayer) return; // Handled by handleRollDanger
    if (isOtherPlayer && (!isTimeStop || !isTimeStopForMe)) return;
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDanger, modal?.needsRoll, isOtherPlayer, isTimeStop, isTimeStopForMe, handleDismiss]);

  if (isOtherPlayer && (!isTimeStop || !isTimeStopForMe)) {
    const cardClass = isTimeStop
      ? 'side-card-timestop event-card'
      : (isAbilityActivate
        ? 'side-card-ability event-card'
        : (isParadox
          ? 'side-card-paradox danger-card'
          : (isTemporalOccurrence
            ? 'side-card-temporal event-card'
            : (isDanger
              ? 'side-card-danger danger-card'
              : (isEvent
                ? 'side-card-event event-card'
                : (isArtifact
                  ? 'side-card-artifact artifact-card'
                  : 'side-card-clue clue-card'))))));
    const timerFillGradient = isTimeStop
      ? 'linear-gradient(90deg, #00FFFF, #0E7490)'
      : (isAbilityActivate
        ? (modal.playerColor ? `linear-gradient(90deg, ${modal.playerColor}, #F59E0B)` : 'linear-gradient(90deg, #38BDF8, #6366F1)')
        : (isParadox
          ? 'linear-gradient(90deg, #D946EF, #9333EA)'
          : (isDanger
            ? 'linear-gradient(90deg, #EF4444, #F97316)'
            : (isEvent ? 'linear-gradient(90deg, #F59E0B, #FCD34D)' : (isArtifact ? 'linear-gradient(90deg, #10B981, #34D399)' : 'linear-gradient(90deg, #3B82F6, #60A5FA)')))));

    const isSecretClue = isSecretToMe;
    const displayCardType = isSecretClue ? 'Secret Clue' : (modal.cardType || modal.title);
    const previewTitle = isSecretClue ? 'Secret Clue Card' : modal.title;
    const previewDesc = isSecretClue
      ? `${drawingPlayer?.name || modal.playerName || 'A Castaway'} excavated a secret Clue Card in ${ERA_NAMES[modal.era] || 'the timeline'}.`
      : (modal.description || '');
    const previewImage = isSecretClue ? null : modal.image;

    const handlePreviewClick = () => {
      sounds.btnClick();
      if (isSecretClue) return;
      onMaximize({
        title: modal.title,
        cardType: modal.cardType || (isTimeStop ? '⌛ Temporal Stasis Field' : (isParadox ? '🌀 Temporal Paradox Node' : (isDanger ? 'Hazard Anomaly' : (isEvent ? 'Temporal Event' : 'Intel Card')))),
        description: modal.description,
        image: modal.image,
        diceRoll: modal.diceRoll,
        needsRoll: modal.needsRoll,
        success: modal.success,
        successMsg: modal.successMsg,
        failMsg: modal.failMsg,
        isDanger,
        isEvent,
        isParadox,
        isTimeStop,
        isClue,
        isDecoy: modal.isDecoy,
        hint: modal.hint,
        artifactId: modal.artifactId,
        artifactName: modal.artifactName,
        clueCount: modal.clueCount,
        maxClues: modal.maxClues,
        artifactProgress: modal.artifactProgress,
        resultText: modal.resultText,
        cardName: modal.cardName,
        cardNickname: modal.cardNickname,
        guardianReduction: modal.guardianReduction,
        victimName: modal.victimName,
        victimAvatar: modal.victimAvatar,
        victimRole: modal.victimRole,
        victimColor: modal.victimColor,
        casterName: modal.casterName,
        casterAvatar: modal.casterAvatar,
        casterRole: modal.casterRole,
        casterColor: modal.casterColor,
        oldParadox: modal.oldParadox,
        newParadox: modal.newParadox,
        maxParadox: modal.maxParadox,
        criticalOverload: modal.criticalOverload,
        triggeredDanger: modal.triggeredDanger,
        era: modal.era,
        tileIndex: modal.tileIndex,
        playerName: drawingPlayer?.name || modal.playerName
      });
    };

    return (
      <div
        className={`side-card-overlay ${cardClass} ${isHovered ? 'paused' : ''}`}
        id="active-modal"
        style={{
          position: 'fixed',
          top: '74px',
          right: '255px',
          zIndex: 9999,
          '--timer-duration': `${durationMs}ms`
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="side-card-header">
          <div className="side-card-title">
            {isAi ? (
              <span className="bot-badge">🤖 BOT</span>
            ) : isSpectator ? (
              <span className="bot-badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                👁️ OBSERVED
              </span>
            ) : (
              <span className="bot-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#C084FC', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
                👤 {drawingPlayer?.name || 'Player'}
              </span>
            )}
            <span style={{ color: isDanger ? 'var(--text-danger)' : (isEvent ? 'var(--tile-event)' : 'var(--text-accent)') }}>
              {displayCardType}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {!isSecretClue && (
              <button
                className="side-card-maximize"
                title="Click to view card in full screen"
                onClick={handlePreviewClick}
              >
                🔍
              </button>
            )}
            <button className="side-card-close" title="Dismiss" onClick={handleDismiss}>
              &times;
            </button>
          </div>
        </div>

        <div className="side-card-body">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ color: drawingPlayer?.color || '#fff' }}>{drawingPlayer?.name || modal.playerName || 'Bot'}</strong> landed on {isDanger ? 'Hazard' : (isEvent ? 'Event' : (isClue ? 'Clue' : 'Tile'))}:
            </div>
            {modal.era && (
              <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{ERA_NAMES[modal.era] || modal.era}</span>
            )}
          </div>

          <div
            className={`side-card-content-preview ${!isSecretClue ? 'side-card-clickable' : ''}`}
            onClick={handlePreviewClick}
          >
            {previewImage && <img src={previewImage} className="side-card-thumb" alt={previewTitle} />}
            {isSecretClue && (
              <div style={{ fontSize: '1.4rem', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px', flexShrink: 0 }}>
                ⏳
              </div>
            )}
            {isTimeStop && !previewImage && (
              <div style={{ fontSize: '1.4rem', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6, 182, 212, 0.2)', border: '1.5px solid #22D3EE', borderRadius: '4px', flexShrink: 0, boxShadow: '0 0 10px rgba(34, 211, 238, 0.4)' }}>
                ⌛
              </div>
            )}
            {isParadox && !previewImage && (
              <div style={{ fontSize: '1.4rem', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(217, 70, 239, 0.2)', border: '1.5px solid #D946EF', borderRadius: '4px', flexShrink: 0, boxShadow: '0 0 10px rgba(217, 70, 239, 0.4)' }}>
                🌀
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{previewTitle}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35, marginTop: '2px' }}>
                {previewDesc}
              </div>
            </div>
          </div>

          {isParadox && (
            <div style={{ marginTop: "8px", padding: "6px 8px", background: "rgba(59, 7, 100, 0.35)", border: "1px solid rgba(217, 70, 239, 0.4)", borderRadius: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "#F0ABFC", letterSpacing: "0.5px" }}>SUIT PARADOX GAUGE</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#FFD700" }}>
                  {modal.oldParadox ?? 0} ➔ <strong style={{ color: "#F43F5E" }}>{modal.newParadox ?? 1}</strong> / {modal.maxParadox ?? 5}
                </span>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {[1, 2, 3, 4, 5].map(lvl => (
                  <div
                    key={lvl}
                    style={{
                      flex: 1,
                      height: "6px",
                      borderRadius: "2px",
                      background: (modal.newParadox ?? 1) >= lvl ? "linear-gradient(90deg, #D946EF, #C084FC)" : "rgba(255,255,255,0.1)",
                      boxShadow: (modal.newParadox ?? 1) >= lvl ? "0 0 6px #D946EF" : "none"
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {isDanger && modal.needsRoll && (
            <div style={{
              marginTop: '8px',
              padding: '8px 10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              fontSize: '0.75rem',
              color: '#FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Dice size="sm" isRolling={true} theme="hazard" />
              <div>
                <strong style={{ color: '#FFF' }}>Survival Hazard Check</strong>
                <div style={{ fontSize: '0.7rem', color: '#CBD5E1', marginTop: '1px' }}>
                  Rolling survival die to determine fate...
                </div>
              </div>
            </div>
          )}

          {isDanger && !modal.needsRoll && modal.diceRoll !== null && modal.diceRoll !== undefined && (
            <div style={{
              marginTop: '8px',
              padding: '8px 10px',
              background: modal.success ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
              border: `1.5px solid ${modal.success ? '#10B981' : '#EF4444'}`,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: modal.success
                ? '0 0 14px rgba(16, 185, 129, 0.3), inset 0 0 6px rgba(16, 185, 129, 0.15)'
                : '0 0 14px rgba(239, 68, 68, 0.3), inset 0 0 6px rgba(239, 68, 68, 0.15)'
            }}>
              <Dice
                value={modal.diceRoll}
                size="sm"
                theme={modal.success ? 'success' : 'hazard'}
                isInteractive={false}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: modal.success ? '#34D399' : '#FCA5A5',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>{modal.success ? '✓ HAZARD EVADED' : '✗ HAZARD TRIGGERED'}</span>
                  <span style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 600 }}>
                    (Rolled {modal.diceRoll})
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#E2E8F0', marginTop: '2px', lineHeight: 1.35 }}>
                  {modal.success ? (modal.successMsg || 'Survival check passed!') : (modal.failMsg || 'Hazard triggered!')}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.68rem' }}>
            {!isSecretClue ? (
              <span
                style={{ color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                onClick={handlePreviewClick}
              >
                <span>🔍</span> Click card to expand
              </span>
            ) : (
              <span style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🔒 Secret Clue
              </span>
            )}

            {isHovered ? (
              <span style={{ color: '#FCD34D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                ⏸️ Paused (Hovering)
              </span>
            ) : (
              <span style={{ color: '#94A3B8' }}>
                ⏱️ Auto-closing (Hover to pause)
              </span>
            )}
          </div>
        </div>

        <div className="overlay-timer-bar">
          <div
            className="overlay-timer-fill"
            style={{
              background: timerFillGradient,
              animationDuration: `${durationMs}ms`,
              animationPlayState: isHovered ? 'paused' : 'running'
            }}
            onAnimationEnd={() => {
              if (!isHovered) {
                onDismissRef.current?.();
              }
            }}
          ></div>
        </div>
      </div>
    );
  }

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

  if (isTimeStop) {
    const casterName = modal.casterName || 'Chronomancer';
    const casterAvatar = modal.casterAvatar || 'assets/Characters/chronomancer_128x128.png';
    const casterColor = modal.casterColor || '#38BDF8';
    const casterRole = modal.casterRole || 'CHRONOMANCER';

    const victimName = modal.victimName || drawingPlayer?.name || 'Operative';
    const victimAvatar = modal.victimAvatar || drawingPlayer?.role?.avatar || 'assets/Characters/Copy of adventurer.png';
    const victimColor = modal.victimColor || drawingPlayer?.color || '#FDA4AF';
    const victimRole = modal.victimRole || drawingPlayer?.role?.name || drawingPlayer?.roleKey || 'Operative';

    return (
      <div className="modal-overlay timestop-modal-overlay" id="active-modal">
        <div className="timestop-frost-vignette" />
        <div className="timestop-shockwave-ring ring-1" />
        <div className="timestop-shockwave-ring ring-2" />
        <div className="timestop-clock-gears">
          <div className="clock-dial">
            <span className="clock-num num-12">XII</span>
            <span className="clock-num num-3">III</span>
            <span className="clock-num num-6">VI</span>
            <span className="clock-num num-9">IX</span>
            <div className="clock-hand hand-hour" />
            <div className="clock-hand hand-minute" />
            <div className="clock-center-freeze" />
          </div>
        </div>

        <div className="modal timestop-card-modal" role="dialog" aria-label="Temporal Stasis (Time Stop)">
          <button className="modal-close" onClick={handleDismiss} title="Close">&times;</button>

          <div className="timestop-header">
            <div className="timestop-header-badge">
              <span>⏳</span>
              <span>TEMPORAL STASIS</span>
              <span>⏳</span>
            </div>
            <div className="timestop-title">⌛ TIME STOPPED! ⌛</div>
            <div className="timestop-subtitle">
              CHRONOMANCER'S TIME WEAVING MAGIC
            </div>
          </div>

          <div className="modal-body timestop-modal-body">
            <div className="timestop-chamber-stage">
              <div className="timestop-operative-card caster-operative">
                <div className="operative-role-tag" style={{ color: casterColor }}>CASTER</div>
                <div className="operative-portrait-wrap">
                  <img src={casterAvatar} alt={casterName} className="operative-img" />
                </div>
                <div className="operative-name" style={{ color: casterColor }}>{casterName}</div>
                <div className="operative-class-badge">{casterRole}</div>
              </div>

              <div className="timestop-stasis-conduit">
                <div className="stasis-rune-orb">
                  <span className="stasis-rune-glyph">⌛</span>
                </div>
                <div className="stasis-beam-status">TIME FREEZE</div>
              </div>

              <div className="timestop-operative-card victim-operative frozen">
                <div className="operative-role-tag" style={{ color: '#EF4444' }}>FROZEN TARGET</div>
                <div className="operative-portrait-wrap frozen-portrait">
                  <img src={victimAvatar} alt={victimName} className="operative-img frozen-sprite" />
                  <div className="stasis-ice-crystal" />
                  <div className="stasis-lock-symbol">🔒</div>
                </div>
                <div className="operative-name" style={{ color: victimColor }}>{victimName}</div>
                <div className="operative-class-badge frozen-badge">TURN SKIPPED</div>
              </div>
            </div>

            <div className="timestop-lore-box">
              <div className="timestop-lore-desc">
                <strong>{victimName}</strong> was caught in Chronomancer <strong>{casterName}</strong>'s temporal freeze! All movement is locked in stasis—their next turn is skipped.
              </div>
            </div>

            <div className="timestop-specs-grid">
              <div className="timestop-spec-item">
                <div className="spec-label">CASTER</div>
                <div className="spec-val" style={{ color: '#FFD700' }}>{casterName}</div>
              </div>
              <div className="timestop-spec-item">
                <div className="spec-label">EFFECT</div>
                <div className="spec-val" style={{ color: '#EF4444' }}>TURN SKIPPED</div>
              </div>
              <div className="timestop-spec-item">
                <div className="spec-label">DURATION</div>
                <div className="spec-val" style={{ color: '#F59E0B' }}>1 TURN</div>
              </div>
            </div>
          </div>

          <div className="modal-actions timestop-modal-actions">
            <button className="btn btn-primary timestop-confirm-btn" onClick={handleDismiss}>
              <span>⌛</span>
              <span>CONTINUE</span>
              <kbd className="timestop-kbd">[ SPACE ]</kbd>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAbilityActivate) {
    const pName = modal.playerName || drawingPlayer?.name || 'Operative';
    const pAvatar = modal.playerAvatar || drawingPlayer?.role?.avatar || 'assets/Characters/Copy of adventurer.png';
    const pColor = modal.playerColor || drawingPlayer?.color || '#38BDF8';
    const pRole = modal.playerRole || drawingPlayer?.role?.name || drawingPlayer?.roleKey || 'Operative';

    const abilityKey = modal.abilityKey || 'GENERIC';
    const isMomentum = abilityKey === 'MOMENTUM';
    const isTrap = abilityKey === 'TEMPORAL_TRAP';
    const isRepair = abilityKey === 'TEMPORAL_REPAIR';
    const isPickpocket = abilityKey === 'PICKPOCKET' || abilityKey === 'SHADOW_POCKETS';
    const isDecoyDiscard = abilityKey === 'DECOY_DISCARD';
    const isForesight = abilityKey === 'TEMPORAL_FORESIGHT';
    const isReverseTime = abilityKey === 'REVERSE_TIME';

    const themeClass = isMomentum
      ? 'theme-momentum'
      : (isTrap
        ? 'theme-trap'
        : (isRepair
          ? 'theme-repair'
          : (isPickpocket
            ? 'theme-pickpocket'
            : (isDecoyDiscard
              ? 'theme-decoy'
              : (isForesight
                ? 'theme-foresight'
                : 'theme-reverse')))));

    const icon = isMomentum
      ? '⚡'
      : (isTrap
        ? '🕸️'
        : (isRepair
          ? '✨'
          : (isPickpocket
            ? '🗡️'
            : (isDecoyDiscard
              ? '📜'
              : (isForesight
                ? '🔮'
                : '⏪')))));

    return (
      <div className={`modal-overlay ability-immersion-overlay ${themeClass}`} id="active-modal">
        <div className="ability-vignette-backdrop" />
        <div className="ability-shockwave-ring ring-1" />
        <div className="ability-shockwave-ring ring-2" />

        <div className="modal ability-immersion-modal" role="dialog" aria-label={modal.title}>
          <button className="modal-close" onClick={handleDismiss} title="Close">&times;</button>

          <div className="ability-modal-header">
            <div className="ability-header-badge">
              <span>{icon}</span>
              <span>{modal.subtitle || 'OPERATIVE ABILITY ACTIVATED'}</span>
              <span>{icon}</span>
            </div>
            <div className="ability-modal-title">{modal.title}</div>
          </div>

          <div className="modal-body ability-modal-body">
            <div className="ability-showcase-stage">
              {isPickpocket && modal.victimName ? (
                <div className="ability-dual-showdown">
                  <div className="ability-operative-card operative-rogue">
                    <div className="operative-role-tag" style={{ color: pColor }}>THIEF</div>
                    <div className="operative-avatar-halo" style={{ borderColor: pColor, boxShadow: `0 0 16px ${pColor}` }}>
                      <img src={pAvatar} alt={pName} className="operative-hero-img" />
                    </div>
                    <div className="operative-hero-name" style={{ color: pColor }}>{pName}</div>
                    <div className="operative-hero-role">{pRole}</div>
                  </div>

                  <div className="ability-versus-nexus">
                    <div className="ability-loot-orb">
                      <span className="loot-glyph">{modal.stolenType === 'clue' ? '🔍' : '⚡'}</span>
                    </div>
                    <div className="ability-beam-label">
                      {modal.stolenType === 'clue' ? 'CLUE SWIPED' : `${modal.stolenAmount || 2} EN SIPHONED`}
                    </div>
                  </div>

                  <div className="ability-operative-card operative-victim">
                    <div className="operative-role-tag" style={{ color: '#F43F5E' }}>TARGET</div>
                    <div className="operative-avatar-halo" style={{ borderColor: '#F43F5E', boxShadow: '0 0 16px #F43F5E' }}>
                      <img src={modal.victimAvatar || 'assets/Characters/Copy of adventurer.png'} alt={modal.victimName} className="operative-hero-img" />
                    </div>
                    <div className="operative-hero-name" style={{ color: modal.victimColor || '#FDA4AF' }}>{modal.victimName}</div>
                    <div className="operative-hero-role">LOOT EXPOSED</div>
                  </div>
                </div>
              ) : (
                <div className="ability-single-operative">
                  <div className="ability-avatar-large-wrap" style={{ borderColor: pColor, boxShadow: `0 0 24px ${pColor}, inset 0 0 14px ${pColor}` }}>
                    <img src={pAvatar} alt={pName} className="operative-large-img" />
                    <div className="ability-avatar-orbit-ring" />
                    <div className="ability-floating-icon">{icon}</div>
                  </div>
                  <div className="ability-hero-caption">
                    <div className="hero-name" style={{ color: pColor }}>{pName}</div>
                    <div className="hero-class">{pRole}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="ability-lore-card">
              <div className="ability-lore-text">
                {modal.description}
              </div>
            </div>

            <div className="ability-stats-grid">
              {isMomentum && (
                <>
                  <div className="ability-stat-pill">
                    <span className="pill-label">BONUS MOVES</span>
                    <span className="pill-val" style={{ color: '#38BDF8' }}>+2 Spaces</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">ACCELERATION</span>
                    <span className="pill-val" style={{ color: '#FCD34D' }}>Hyper-Sonic</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">ENERGY COST</span>
                    <span className="pill-val" style={{ color: '#60A5FA' }}>-2 Energy</span>
                  </div>
                </>
              )}

              {isTrap && (
                <>
                  <div className="ability-stat-pill">
                    <span className="pill-label">MINE SPACE</span>
                    <span className="pill-val" style={{ color: '#F59E0B' }}>Tile #{Number(modal.tileIndex ?? 0) + 1}</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">STATUS</span>
                    <span className="pill-val" style={{ color: '#EF4444' }}>Armed & Lethal</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">TRAP MASTERY</span>
                    <span className="pill-val" style={{ color: '#10B981' }}>+1 En on Trigger</span>
                  </div>
                </>
              )}

              {isRepair && (
                <>
                  <div className="ability-stat-pill">
                    <span className="pill-label">REPAIR FOCUS</span>
                    <span className="pill-val" style={{ color: '#10B981' }}>{modal.mode === 'reduceEnergy' ? 'Mend Paradox' : 'Recharge Energy'}</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">TIMELINE STABILITY</span>
                    <span className="pill-val" style={{ color: '#34D399' }}>Restored</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">CHRONO-CORE</span>
                    <span className="pill-val" style={{ color: '#6EE7B7' }}>Shields Online</span>
                  </div>
                </>
              )}

              {isPickpocket && (
                <>
                  <div className="ability-stat-pill">
                    <span className="pill-label">MARK</span>
                    <span className="pill-val" style={{ color: '#C084FC' }}>{modal.victimName || 'Operative'}</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">SWIPED</span>
                    <span className="pill-val" style={{ color: '#F472B6' }}>{modal.stolenType === 'clue' ? '1 Clue Card' : `${modal.stolenAmount || 2} Energy`}</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">STEALTH</span>
                    <span className="pill-val" style={{ color: '#A855F7' }}>Unbroken</span>
                  </div>
                </>
              )}

              {isDecoyDiscard && (
                <>
                  <div className="ability-stat-pill">
                    <span className="pill-label">DECOY STATUS</span>
                    <span className="pill-val" style={{ color: '#F59E0B' }}>Neutralized</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">ARCHIVE DESTINY</span>
                    <span className="pill-val" style={{ color: '#10B981' }}>Burned to Ash</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">HAND CAPACITY</span>
                    <span className="pill-val" style={{ color: '#EBD07D' }}>Preserved</span>
                  </div>
                </>
              )}

              {isForesight && (
                <>
                  <div className="ability-stat-pill">
                    <span className="pill-label">ORIGINAL ROLL</span>
                    <span className="pill-val" style={{ color: '#94A3B8' }}>{modal.oldRoll ?? '-'}</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">SHIFT</span>
                    <span className="pill-val" style={{ color: '#22D3EE' }}>{(modal.delta ?? 0) > 0 ? '+1 Space' : '-1 Space'}</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">DESTINY</span>
                    <span className="pill-val" style={{ color: '#67E8F9' }}>{modal.newRoll ?? '-'} Spaces</span>
                  </div>
                </>
              )}

              {isReverseTime && (
                <>
                  <div className="ability-stat-pill">
                    <span className="pill-label">CHRONO COST</span>
                    <span className="pill-val" style={{ color: '#F43F5E' }}>-3 Energy</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">VECTOR</span>
                    <span className="pill-val" style={{ color: '#C084FC' }}>Backwards</span>
                  </div>
                  <div className="ability-stat-pill">
                    <span className="pill-label">REWIND DISTANCE</span>
                    <span className="pill-val" style={{ color: '#EC4899' }}>{modal.movesRemaining ?? '-'} Spaces</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-actions ability-modal-actions">
            <button className="btn btn-primary ability-confirm-btn" onClick={handleDismiss}>
              <span>{icon}</span>
              <span>CONTINUE [ SPACE ]</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isParadox) {
    const oldP = modal.oldParadox ?? 0;
    const newP = modal.newParadox ?? 1;
    const maxP = modal.maxParadox ?? 5;
    const isCritical = modal.criticalOverload || newP >= 5;
    const isDangerTriggered = modal.triggeredDanger || (newP === 4 && oldP < 4);

    return (
      <div className="modal-overlay paradox-rift-modal-overlay" id="active-modal">
        <div className="paradox-rift-backdrop" />
        <div className="paradox-shockwave-ring ring-1" />
        <div className="paradox-shockwave-ring ring-2" />

        <div className="modal paradox-card-modal" role="dialog" aria-label="Paradox Zone Breach">
          <button className="modal-close" onClick={handleDismiss} title="Close">&times;</button>

          <div className="paradox-header">
            <div className="paradox-header-badge">
              <span>⏳</span>
              <span>TEMPORAL ANOMALY DETECTED</span>
              <span>⏳</span>
            </div>
            <div className="paradox-title">🌀 PARADOX BREACH! 🌀</div>
            {modal.era && (
              <div className="paradox-sector-tag">
                TIMELINE SECTOR: <span>{ERA_NAMES[modal.era]?.toUpperCase() || modal.era}</span> • TILE #{Number(modal.tileIndex ?? 0) + 1}
              </div>
            )}
          </div>

          <div className="modal-body paradox-modal-body">
            {/* Hypnotic Chrono Singularity Core */}
            <div className="paradox-chamber-stage">
              <div className="paradox-vortex-container">
                <div className="paradox-vortex-ring ring-outer" />
                <div className="paradox-vortex-ring ring-inner" />
                <div className="paradox-vortex-tile-wrapper">
                  <img
                    src="/assets/Tiles/paradox_tile.png"
                    alt="Paradox Tile"
                    className="paradox-chamber-tile-img"
                  />
                </div>
                <div className="paradox-lightning-arc arc-1" />
                <div className="paradox-lightning-arc arc-2" />
              </div>

              {/* Status Alert Badge */}
              <div className={`paradox-status-badge ${isCritical ? "status-critical" : (isDangerTriggered ? "status-danger" : "status-warning")}`}>
                {isCritical
                  ? "💥 CRITICAL BREACH (+2 Timeline Meter)"
                  : isDangerTriggered
                    ? "⚠️ SEVERE INSTABILITY: HAZARD ANOMALY IMMINENT"
                    : newP >= 3
                      ? "⚡ TEMPORAL DRAIN: -1 ENERGY"
                      : newP >= 2
                        ? "📉 CAUSAL DISCORD: -1 POINT"
                        : "⚠️ TEMPORAL FRICTION (+1 PARADOX)"}
              </div>
            </div>

            {/* Paradox Meter Breakdown (1 to 5) */}
            <div className="paradox-meter-container">
              <div className="paradox-meter-header">
                <span className="paradox-meter-title">PARADOX METER</span>
                <span className="paradox-meter-count">
                  <span className="old-count">{oldP}</span>
                  <span className="arrow-sep">➔</span>
                  <span className="new-count">{newP}</span>
                  <span className="max-count"> / {maxP}</span>
                </span>
              </div>

              <div className="paradox-pip-bar">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const wasFilled = oldP >= lvl;
                  const isNewlyFilled = !wasFilled && (newP >= lvl || (isCritical && lvl === 5));
                  const isOverloadReset = isCritical && lvl > 2;
                  const penaltyLabel = lvl === 2 ? "-1 Point" : lvl === 3 ? "-1 Energy" : lvl === 4 ? "Danger Card" : lvl === 5 ? "+2 Timeline" : "Stable";

                  return (
                    <div
                      key={lvl}
                      className={`paradox-pip-slot ${wasFilled ? "filled" : ""} ${isNewlyFilled ? "newly-filled pulsing" : ""} ${isOverloadReset ? "overloaded" : ""}`}
                    >
                      <div className="pip-level-num">LVL {lvl}</div>
                      <div className="pip-gem">
                        <span className="pip-glyph">{lvl >= 4 ? "💀" : lvl >= 2 ? "⚠️" : "💠"}</span>
                      </div>
                      <div className="pip-penalty-tag">{penaltyLabel}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lore / Consequence Description */}
            <div className="paradox-lore-box">
              <div className="paradox-lore-desc">{modal.description}</div>
              {modal.playerName && (
                <div className="paradox-affected-player">
                  Traveler: <strong>{modal.playerName}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions paradox-modal-actions">
            <button
              className="btn btn-primary paradox-stabilize-btn"
              onClick={handleDismiss}
              autoFocus
            >
              <span>🛡️</span>
              <span>CONTINUE</span>
              <kbd className="paradox-kbd">[ SPACE ]</kbd>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isDanger) {
    return (
      <div className="modal-overlay danger-modal-overlay" id="active-modal">
        <div className="danger-vignette-backdrop" />
        <div className="danger-shockwave-ring ring-1" />
        <div className="danger-shockwave-ring ring-2" />

        <div className="modal danger-card-modal" role="dialog" aria-label="Hazard Anomaly Strike">
          <button className="modal-close" onClick={handleDismiss} title="Close">&times;</button>

          <div className="danger-header">
            <div className="danger-header-badge">
              <span>⚠️</span>
              <span>HISTORICAL HAZARD STRIKE</span>
              <span>⚠️</span>
            </div>
            <div className="danger-title">
              <span>🚨</span>
              <span>{modal.title || 'HAZARD ANOMALY!'}</span>
              <span>🚨</span>
            </div>
            {modal.era && (
              <div className="danger-sector-tag">
                SECTOR: <span>{ERA_NAMES[modal.era]?.toUpperCase() || modal.era}</span> • HAZARD STRIKE
              </div>
            )}
          </div>

          <div className="modal-body danger-modal-body">
            <div className="danger-chamber-stage">
              <div className="danger-card-frame">
                {modal.image ? (
                  <img src={modal.image} alt={modal.title} className="danger-card-img" />
                ) : (
                  <div className="danger-fallback-icon">⚠️</div>
                )}
                <div className="danger-tile-token">
                  <img src="/assets/Tiles/danger_tile.png" alt="Danger Tile" className="danger-mini-tile-img" />
                </div>
              </div>

              <div className="danger-status-alert">
                {modal.needsRoll ? (
                  <span>⚠️ IMMINENT DANGER: SURVIVAL ROLL REQUIRED</span>
                ) : modal.success ? (
                  <span className="text-success">✓ HAZARD EVADED SAFELY</span>
                ) : (
                  <span className="text-danger">💥 HAZARD PENALTY INFLICTED</span>
                )}
              </div>
            </div>

            <div className="danger-lore-box">
              <div className="danger-lore-title">HAZARD REPORT</div>
              <div className="danger-lore-desc">{modal.description}</div>
            </div>

            {modal.needsRoll ? (
              <div className="danger-survival-stage">
                <div className="survival-rule-banner">
                  <span className="rule-icon">🎲</span>
                  <span className="rule-text">TUMBLE THE SURVIVAL DIE TO DETERMINE YOUR FATE</span>
                </div>
                <div className="danger-dice-roll-area">
                  <Dice
                    value={modal.diceRoll}
                    isRolling={isRollingDanger}
                    size="md"
                    theme="hazard"
                    onClick={handleRollDanger}
                    disabled={isRollingDanger}
                    isInteractive={!isRollingDanger}
                    showLabel={false}
                  />
                  <div className="dice-action-caption">
                    <div className="caption-bold">{isRollingDanger ? 'Tumbling Survival Die...' : 'Roll to Survive!'}</div>
                    <div className="caption-sub">Press Space or click the die</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`danger-outcome-plaque ${modal.success ? 'outcome-evaded' : 'outcome-failed'}`}>
                <div className="outcome-dice-wrap">
                  <Dice value={modal.diceRoll} size="sm" theme={modal.success ? 'success' : 'hazard'} isInteractive={false} />
                </div>
                <div className="outcome-details">
                  <div className="outcome-verdict">
                    {modal.success ? '✓ HAZARD EVADED!' : '✗ HAZARD TRIGGERED!'}
                    <span className="outcome-roll-val">(Rolled {modal.diceRoll})</span>
                  </div>
                  <div className="outcome-msg">
                    {modal.success ? (modal.successMsg || 'Survival check passed!') : (modal.failMsg || 'Hazard penalty suffered!')}
                  </div>
                  {modal.guardianReduction && (
                    <div className="guardian-relief-tag">
                      🛡️ GUARDIAN MASTERY: Hazard penalty reduced by 1!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions danger-modal-actions">
            {modal.needsRoll ? (
              <button
                type="button"
                className="btn btn-primary danger-roll-btn"
                disabled={isRollingDanger}
                onClick={handleRollDanger}
                autoFocus
              >
                <span>🎲</span>
                <span>{isRollingDanger ? 'TUMBLING DIE...' : 'ROLL SURVIVAL DIE'}</span>
                <kbd className="danger-kbd">[ SPACE ]</kbd>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary danger-continue-btn"
                onClick={handleDismiss}
                autoFocus
              >
                <span>🛡️</span>
                <span>CONTINUE</span>
                <kbd className="danger-kbd">[ SPACE ]</kbd>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isEvent) {
    return (
      <div className="modal-overlay event-modal-overlay" id="active-modal">
        <div className="event-vignette-backdrop" />
        <div className="event-ripple-ring ring-1" />
        <div className="event-ripple-ring ring-2" />

        <div className="modal event-card-modal" role="dialog" aria-label="Chronal Timeline Event">
          <button className="modal-close" onClick={handleDismiss} title="Close">&times;</button>

          <div className="event-header">
            <div className="event-header-badge">
              <span>⚡</span>
              <span>CHRONAL TIMELINE EVENT</span>
              <span>⚡</span>
            </div>
            <div className="event-title">
              <span>📜</span>
              <span>{modal.title || 'TIMELINE EVENT'}</span>
              <span>📜</span>
            </div>
            {modal.era && (
              <div className="event-sector-tag">
                HISTORICAL SECTOR: <span>{ERA_NAMES[modal.era]?.toUpperCase() || modal.era}</span> • CHRONO SHIFT
              </div>
            )}
          </div>

          <div className="modal-body event-modal-body">
            <div className="event-chamber-stage">
              <div className="event-card-frame">
                {modal.image ? (
                  <img src={modal.image} alt={modal.title} className="event-card-img" />
                ) : (
                  <div className="event-fallback-icon">⚡</div>
                )}
                <div className="event-tile-token">
                  <img src="/assets/Tiles/event_tile.png" alt="Event Tile" className="event-mini-tile-img" />
                </div>
              </div>
              <div className="event-interference-tag">
                <span>🌀</span>
                <span>TIMELINE INTERFERENCE FLUX APPLIED</span>
              </div>
            </div>

            <div className="event-lore-box">
              <div className="event-lore-title">HISTORICAL DIVERGENCE REPORT</div>
              <div className="event-lore-desc">{modal.description}</div>
            </div>

            {modal.resultText && (
              <div className="event-consequence-plaque">
                <div className="consequence-label">CHRONO RESOLUTION RESULT</div>
                <div className="consequence-text">⚡ {modal.resultText}</div>
              </div>
            )}
          </div>

          <div className="modal-actions event-modal-actions">
            <button
              type="button"
              className="btn btn-primary event-confirm-btn"
              onClick={handleDismiss}
              autoFocus
            >
              <span>⚡</span>
              <span>ACKNOWLEDGE EVENT</span>
              <kbd className="event-kbd">[ SPACE ]</kbd>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isClue) {
    const isDecoy = modal.isDecoy || modal.cardType === 'Decoy Card' || modal.title?.includes('Decoy');
    const clueCount = modal.clueCount ?? drawingPlayer?.clueCards?.length ?? 1;
    const maxClues = modal.maxClues ?? 5;
    const relicName = modal.artifactName || (modal.artifactId && ARTIFACTS[modal.era]?.find(a => a.id === modal.artifactId)?.name) || 'Historical Relic';
    const progressCount = modal.artifactProgress ?? (modal.artifactId && drawingPlayer?.clueProgress?.[modal.artifactId]) ?? 1;

    return (
      <div className="modal-overlay clue-modal-overlay" id="active-modal">
        <div className="clue-vignette-backdrop" />
        <div className="clue-astrolabe-ring ring-1" />
        <div className="clue-astrolabe-ring ring-2" />

        <div className="modal clue-card-modal" role="dialog" aria-label="Historical Intel Discovery">
          <button className="modal-close" onClick={handleDismiss} title="Close">&times;</button>

          <div className="clue-header">
            <div className="clue-header-badge">
              <span>📜</span>
              <span>HISTORICAL INTEL DISCOVERY</span>
              <span>📜</span>
            </div>
            <div className="clue-title">
              <span>🔍</span>
              <span>{modal.title || (isDecoy ? 'DECOY ANOMALY!' : 'CLUE FOUND!')}</span>
              <span>🔍</span>
            </div>
            {modal.era && (
              <div className="clue-sector-tag">
                TIMELINE SECTOR: <span>{ERA_NAMES[modal.era]?.toUpperCase() || modal.era}</span> • ARCHIVAL INTEL
              </div>
            )}
          </div>

          <div className="modal-body clue-modal-body">
            <div className="clue-chamber-stage">
              <div className="clue-card-frame">
                {modal.image ? (
                  <img src={modal.image} alt={modal.title} className="clue-card-img" />
                ) : (
                  <div className="clue-fallback-icon">🔍</div>
                )}
                <div className="clue-tile-token">
                  <img src="/assets/Tiles/clue_tile.png" alt="Clue Tile" className="clue-mini-tile-img" />
                </div>
              </div>

              <div className={`clue-seal-badge ${isDecoy ? 'seal-decoy' : 'seal-authentic'}`}>
                {isDecoy ? (
                  <span>⚠️ DECOY INTEL — FALSE ANOMALY LEAD</span>
                ) : (
                  <span>✓ VERIFIED HISTORICAL ARTIFACT CLUE</span>
                )}
              </div>
            </div>

            <div className="clue-lore-box">
              <div className="clue-lore-title">DECRYPTED FIELD NOTES</div>
              <div className="clue-lore-desc">{modal.description}</div>
              {modal.hint && modal.hint !== modal.description && (
                <div className="clue-hint-line">
                  <span>💡</span> <em>Context: {modal.hint}</em>
                </div>
              )}
            </div>

            <div className="clue-specs-grid">
              <div className="clue-spec-item">
                <div className="spec-label">ASSOCIATED RELIC</div>
                <div className="spec-val" style={{ color: isDecoy ? '#FCA5A5' : '#FFD700' }}>
                  {isDecoy ? 'None (Decoy Trail)' : relicName}
                </div>
                {!isDecoy && (
                  <div className="spec-sub">
                    Intel: <strong>{progressCount} / 3</strong> Fragments
                  </div>
                )}
              </div>

              <div className="clue-spec-item">
                <div className="spec-label">CLUE SATCHEL</div>
                <div className="spec-val" style={{ color: '#FDE047' }}>
                  {clueCount} / {maxClues} HELD
                </div>
                <div className="satchel-pip-row">
                  {[...Array(maxClues)].map((_, i) => (
                    <span
                      key={i}
                      className={`satchel-pip ${i < clueCount ? 'pip-filled' : 'pip-empty'}`}
                    >
                      {i < clueCount ? '📜' : '⬝'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions clue-modal-actions">
            <button
              type="button"
              className="btn btn-primary clue-confirm-btn"
              onClick={handleDismiss}
              autoFocus
            >
              <span>📜</span>
              <span>SECURE INTEL</span>
              <kbd className="clue-kbd">[ SPACE ]</kbd>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modal-overlay ${isTemporalOccurrence ? "temporal-rift-modal-overlay" : ""}`} id="active-modal">
      <div className={`modal ${isTemporalOccurrence ? "temporal-occurrence-card-modal" : ""}`}>
        <button className="modal-close" onClick={handleDismiss}>&times;</button>
        <div className="modal-title" style={{ color: isTemporalOccurrence ? "#FFD700" : "#C2974D", letterSpacing: "1.5px" }}>
          {isTemporalOccurrence ? "⚡ TEMPORAL OCCURRENCE! ⚡" : (modal.cardType || modal.title)}
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
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleDismiss} style={{ padding: '10px 24px', fontWeight: 800 }} autoFocus>
            {engine?.state?.pendingChoice?.type === 'teleportTile' ? 'Choose Destination ➔' : 'Acknowledge Directive ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChoiceModal({ choice, engine, network, onDismiss, onMaximize }) {
  if (!choice) return null;

  const activePlayer = engine?.getCurrentPlayer?.() || engine?.state?.players?.[engine?.state?.currentPlayerIndex];
  const isAi = activePlayer?.isAi === true;
  const isSpectator = network?.isSpectator === true;
  const isMyTurn = !isAi && !isSpectator && network.isMyTurn(engine?.state?.currentPlayerIndex);
  const isDecipher = choice.type === 'historianDecipher';
  const isClueHandLimit = choice.type === 'clueHandLimit';
  const isTeleport = choice.type === 'teleportTile';
  const [tileFilter, setTileFilter] = useState('all');
  const [selectedDecipherIdx, setSelectedDecipherIdx] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAddingToHand, setIsAddingToHand] = useState(false);

  useEffect(() => {
    setSelectedDecipherIdx(null);
    setIsRevealed(false);
    setIsAddingToHand(false);
  }, [choice?.type, choice?.drawnCards]);

  useEffect(() => {
    if (isDecipher && !isAi) {
      sounds.clue?.();
    }
  }, [isDecipher, isAi]);

  const handleDecipherCardClick = (idx) => {
    if (!isMyTurn && network.mode === "online") return;
    if (isRevealed || isAddingToHand) return;

    sounds.clue?.();
    setSelectedDecipherIdx(idx);
    setIsRevealed(true);
  };

  const handleConfirmAddToHand = () => {
    if (selectedDecipherIdx === null || isAddingToHand) return;
    if (!isMyTurn && network.mode === "online") return;

    sounds.btnClick?.();
    setIsAddingToHand(true);

    setTimeout(() => {
      sounds.artifact?.();
      handleSelect("pick_" + selectedDecipherIdx);
    }, 450);
  };

  const speed = engine?.simulationSpeed || 1;
  const durationMs = Math.max(2400, Math.round(4200 / speed));
  const [isHovered, setIsHovered] = useState(false);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
    elapsedRef.current = 0;
  }, [choice?.title]);

  useEffect(() => {
    if (isAi && engine) {
      engine._isModalHovered = isHovered;
    }
    return () => {
      if (isAi && engine) {
        engine._isModalHovered = false;
      }
    };
  }, [isHovered, isAi, engine]);

  useEffect(() => {
    if (!isAi) return;

    if (isHovered) {
      elapsedRef.current += Date.now() - startTimeRef.current;
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const remaining = Math.max(400, durationMs - elapsedRef.current);

    timerRef.current = setTimeout(() => {
      onDismiss();
    }, remaining);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAi, isHovered, durationMs, onDismiss]);

  const handleSelect = (action) => {
    if (network.isSpectator) return;
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
      <div
        className={`side-card-overlay ${isHovered ? 'paused' : ''}`}
        id="active-modal"
        style={{ '--timer-duration': `${durationMs}ms` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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
            <strong style={{ color: activePlayer?.color || '#fff' }}>{activePlayer?.name || 'Bot'}</strong> evaluated tactical options:
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
                {isSpectator ? (
                  <>Drawn: <strong>{choice.drawnCard.isDecoy ? "Decoy Card" : (choice.drawnCard.hint || choice.drawnCard.description)}</strong> ({ERA_NAMES[choice.drawnCard.era] || choice.drawnCard.era})</>
                ) : (
                  <>Drawn: <strong>Secret Clue Card</strong> ({ERA_NAMES[choice.drawnCard.era] || choice.drawnCard.era})</>
                )}
              </div>
            </div>
          )}

          {isDecipher && choice.drawnCards && (
            <div>
              <div className="mystery-cards-mini-row side-card-clickable">
              {choice.drawnCards.map((c, idx) => (
                <div key={idx} className={`mystery-card-mini ${idx === 0 ? 'selected-by-bot' : ''}`}>
                  <div style={{ fontSize: '1.4rem' }}>📜</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60A5FA' }}>Card #{idx + 1}</div>
                  {idx === 0 ? <div className="mini-choice-badge">DECIPHERED</div> : <div style={{ fontSize: '0.6rem', color: '#94A3B8' }}>Deck Return</div>}
                </div>
              ))}
            </div>

            {choice.drawnCards[0] && (
              isSpectator ? (
                <div className="ai-decipher-preview" style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(96, 165, 250, 0.35)", borderRadius: "8px", padding: "8px 10px", margin: "8px 0", textAlign: "left" }}>
                  <img
                    src={choice.drawnCards[0].cardImage || choice.drawnCards[0].image}
                    alt={choice.drawnCards[0].artifactName || "Clue"}
                    style={{ width: "42px", height: "58px", objectFit: "cover", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: choice.drawnCards[0].isDecoy ? "#EF4444" : "#60A5FA" }}>
                      {choice.drawnCards[0].isDecoy ? "🎭 Decoy Card Drawn" : ("✨ " + (choice.drawnCards[0].artifactName || "Historical Clue"))}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#CBD5E1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {choice.drawnCards[0].hint || choice.drawnCards[0].description}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#94A3B8" }}>
                      Deciphered by {activePlayer?.name || "Bot"} &bull; Moving to hand
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ai-decipher-preview" style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(96, 165, 250, 0.35)", borderRadius: "8px", padding: "8px 10px", margin: "8px 0", textAlign: "left" }}>
                  <div style={{ width: "42px", height: "58px", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e293b", borderRadius: "4px", border: "1px dashed rgba(96, 165, 250, 0.4)", fontSize: "1.4rem" }}>
                    🔒
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#60A5FA" }}>
                      🔒 Secret Clue Deciphered
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#CBD5E1" }}>
                      {activePlayer?.name || "Bot"} deciphered a classified clue in {ERA_NAMES[choice.drawnCards[0]?.era] || 'the timeline'}.
                    </div>
                  </div>
                </div>
              )
            )}
            </div>
          )}

          <div className="side-card-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="ai-pulse-dot"></span>
              <span style={{ fontSize: '0.78rem', color: '#93C5FD', fontWeight: 600 }}>
                {choice.options?.[0]?.label || 'Resolving automatically...'}
              </span>
            </div>
            {isHovered ? (
              <span style={{ color: '#FCD34D', fontSize: '0.68rem', fontWeight: 700 }}>
                ⏸️ Paused
              </span>
            ) : (
              <span style={{ color: '#94A3B8', fontSize: '0.68rem' }}>
                ⏱️ Resolving...
              </span>
            )}
          </div>
        </div>

        <div className="overlay-timer-bar">
          <div
            className="overlay-timer-fill"
            style={{
              animationDuration: `${durationMs}ms`,
              animationPlayState: isHovered ? 'paused' : 'running'
            }}
          ></div>
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
        <div className="modal" style={{ maxWidth: "800px", width: "95%", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }}>
          <div className="modal-title" style={{ color: "#F5C442", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span>🎴</span> Hand Limit Reached (5/5 Clue Cards)
          </div>

          <div className="modal-body" style={{ textAlign: "center", marginBottom: "var(--space-md)" }}>
            <p style={{ fontSize: "0.85rem", color: "#C8B293", margin: "0 auto 16px", maxWidth: "620px", lineHeight: 1.45 }}>
              Your clue inventory is full! You excavated a new card. You must either <strong>discard this drawn card</strong> back to the {ERA_NAMES[drawn.era] || drawn.era} pool, or <strong>keep it and discard 1 card</strong> from your hand.
            </p>

            {/* NEWLY DRAWN CARD SECTION */}
            <div style={{
              background: "linear-gradient(180deg, #251B12 0%, #17100B 100%)",
              border: "2px solid #C2974D",
              borderRadius: "6px",
              padding: "14px",
              marginBottom: "16px",
              boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 4px 14px rgba(0, 0, 0, 0.6)",
              textAlign: "left"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    background: "#F5C442",
                    color: "#1A110A",
                    fontSize: "0.70rem",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "3px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontFamily: "var(--font-display)"
                  }}>
                    ✨ Newly Drawn Card
                  </span>
                  <span style={{
                    fontSize: "0.72rem",
                    color: "#D4AF37",
                    background: "#140E0A",
                    border: "1px solid #5A422D",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    fontWeight: 700
                  }}>
                    {ERA_NAMES[drawn.era] || drawn.era}
                  </span>
                </div>
                {drawn.artifactId === missionArtifactId && (
                  <span style={{
                    fontSize: "0.72rem",
                    color: "#FFD700",
                    fontWeight: 700,
                    background: "#3A2A14",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    border: "1px solid #FFD700"
                  }}>
                    ⭐ Matches Target Relic!
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                {(drawn.cardImage || drawn.image) ? (
                  <img
                    src={drawn.cardImage || drawn.image}
                    alt={drawn.hint || "Clue"}
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "contain",
                      borderRadius: "6px",
                      border: "1.5px solid #8C6239",
                      background: "#140E0A",
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{
                    width: "60px",
                    height: "60px",
                    background: "#140E0A",
                    border: "1.5px solid #8C6239",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    flexShrink: 0
                  }}>
                    {drawn.isDecoy ? "🎭" : "🔍"}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: drawn.isDecoy ? "#F87171" : "#FFD700",
                    fontFamily: "var(--font-display)",
                    letterSpacing: "0.5px"
                  }}>
                    {drawn.isDecoy ? "🎭 Decoy Card (False Lead)" : (drawn.hint || drawn.description || "Clue Card")}
                  </div>
                  <div style={{ fontSize: "0.80rem", color: "#C8B293", marginTop: "4px", lineHeight: 1.35 }}>
                    {drawn.description || drawn.hint}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn choice-btn"
                  style={{
                    minWidth: 0,
                    maxWidth: "100%",
                    padding: "8px 16px",
                    fontSize: "0.80rem",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    background: "linear-gradient(180deg, #5C2222 0%, #3B1212 100%)",
                    border: "1.5px solid #E57373",
                    color: "#FFCDD2",
                    borderRadius: "4px",
                    boxShadow: "inset 1px 1px 0 #EF9A9A, inset -1px -1px 0 #2A0808, 0 2px 0 #120E0A",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxSizing: "border-box"
                  }}
                  disabled={!isMyTurn && network.mode === "online"}
                  onClick={() => handleSelect("discard_drawn")}
                  title={`Discard this newly drawn card and return it to the ${ERA_NAMES[drawn.era] || drawn.era} pool`}
                >
                  <span>❌ Discard Drawn Card</span>
                  <span style={{
                    fontSize: "0.66rem",
                    background: "#220A0A",
                    border: "1px solid #E57373",
                    color: "#FFCDD2",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontWeight: 700
                  }}>
                    Return to {ERA_NAMES[drawn.era]?.replace(" Era", "") || drawn.era} Pool
                  </span>
                </button>
              </div>
            </div>

            {/* OR CHOOSE 1 FROM HAND TO DISCARD */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              margin: "16px 0 14px",
              color: "#C2974D",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontFamily: "var(--font-display)"
            }}>
              <span style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, transparent, #8C6239)" }}></span>
              <span>OR Keep Drawn Card & Discard 1 From Hand</span>
              <span style={{ height: "1px", flex: 1, background: "linear-gradient(90deg, #8C6239, transparent)" }}></span>
            </div>

            {/* HAND CARDS GRID */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
              marginTop: "10px",
              boxSizing: "border-box",
              width: "100%"
            }}>
              {handCards.map((c, idx) => {
                const isMatch = c.artifactId === missionArtifactId;
                return (
                  <div
                    key={idx}
                    style={{
                      background: isMatch
                        ? "linear-gradient(180deg, #322212 0%, #1D140B 100%)"
                        : c.isDecoy
                        ? "linear-gradient(180deg, #2D1414 0%, #1A0B0B 100%)"
                        : "linear-gradient(180deg, #241A12 0%, #17100B 100%)",
                      border: isMatch
                        ? "2px solid #F5C442"
                        : c.isDecoy
                        ? "1.5px dashed #EF4444"
                        : "1.5px solid #8C6239",
                      borderRadius: "6px",
                      padding: "10px 8px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      textAlign: "center",
                      position: "relative",
                      minWidth: 0,
                      minHeight: "215px",
                      boxShadow: isMatch
                        ? "inset 1px 1px 0 #FFF099, 0 0 12px rgba(245, 196, 66, 0.3)"
                        : "inset 1px 1px 0 rgba(235, 208, 125, 0.15), 0 3px 6px rgba(0, 0, 0, 0.5)",
                      boxSizing: "border-box",
                      overflow: "hidden"
                    }}
                  >
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "0.62rem" }}>
                        <span style={{
                          color: "#D4AF37",
                          background: "#140E0A",
                          border: "1px solid #5A422D",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          fontWeight: 700,
                          whiteSpace: "nowrap"
                        }}>
                          {ERA_NAMES[c.era]?.replace(" Era", "") || c.era}
                        </span>
                        {c.isDecoy ? (
                          <span style={{ color: "#F87171", fontWeight: 700 }}>🎭 Decoy</span>
                        ) : isMatch ? (
                          <span style={{ color: "#FCD34D", fontWeight: 700 }}>⭐ Mission</span>
                        ) : (
                          <span style={{ color: "#C8B293" }}>🔍 Clue</span>
                        )}
                      </div>

                      <div style={{
                        height: "46px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "2px 0 6px"
                      }}>
                        {(c.cardImage || c.image) ? (
                          <img
                            src={c.cardImage || c.image}
                            alt="card"
                            style={{
                              width: "42px",
                              height: "42px",
                              objectFit: "contain",
                              borderRadius: "4px",
                              border: "1px solid #5A422D",
                              background: "#140E0A"
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: "1.6rem" }}>{c.isDecoy ? "🎭" : "📜"}</div>
                        )}
                      </div>

                      <div style={{
                        fontSize: "0.70rem",
                        fontWeight: 700,
                        color: isMatch ? "#FFD700" : "#EBD07D",
                        lineHeight: 1.25,
                        minHeight: "36px",
                        maxHeight: "36px",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        textOverflow: "ellipsis",
                        wordBreak: "break-word"
                      }}>
                        {c.hint || c.description || (c.isDecoy ? "Decoy Card" : "Clue Card")}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn choice-btn"
                      style={{
                        marginTop: "10px",
                        width: "100%",
                        minWidth: 0,
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        fontSize: "0.70rem",
                        fontWeight: 800,
                        letterSpacing: "0.3px",
                        padding: "7px 4px",
                        background: "linear-gradient(180deg, #4D3826 0%, #352518 100%)",
                        border: "1.5px solid #F5C442",
                        color: "#FFD700",
                        borderRadius: "4px",
                        boxShadow: "inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16, 0 2px 0 #120E0A",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                      disabled={!isMyTurn && network.mode === "online"}
                      onClick={() => handleSelect(`discard_hand_${idx}`)}
                      title={`Discard this card and keep the newly drawn card`}
                    >
                      <span>🗑️</span>
                      <span>Discard #{idx + 1}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {!isMyTurn && network.mode === "online" && (
              <div style={{ fontSize: "0.85rem", color: "#F5C442", marginTop: "14px", fontWeight: 600 }}>
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


  if (choice.type === 'guardianRepair') {
    return (
      <div className="modal-overlay guardian-sanctum-overlay" id="active-modal">
        <div className="guardian-sanctum-backdrop" />
        <div className="modal guardian-sanctum-modal" role="dialog" aria-label="Temporal Repair">
          <div className="guardian-sanctum-header">
            <div className="guardian-header-badge">
              <span>✨</span>
              <span>GUARDIAN SACRED SANCTUM</span>
              <span>✨</span>
            </div>
            <div className="guardian-title">✨ TEMPORAL REPAIR ✨</div>
            <div className="guardian-subtitle">RESTORE TIMELINE STABILITY OR CHRONO-CORE</div>
          </div>

          <div className="modal-body guardian-sanctum-body">
            <div className="guardian-sanctum-grid">
              {choice.options.map((opt, i) => {
                const isMend = opt.action === 'reduceEnergy';
                return (
                  <button
                    key={i}
                    type="button"
                    className={`guardian-choice-card ${isMend ? 'card-mend' : 'card-recharge'}`}
                    disabled={!isMyTurn && network.mode === 'online'}
                    onClick={() => { sounds.holyRepair?.(); handleSelect(opt.action); }}
                  >
                    <div className="choice-card-icon">{isMend ? '⚙️' : '🔋'}</div>
                    <div className="choice-card-title">{isMend ? 'Mend Paradox Level' : 'Recharge Chrono-Core'}</div>
                    <div className="choice-card-cost">{isMend ? 'Cost: 2 Energy' : 'Cost: 0 Energy (FREE)'}</div>
                    <div className="choice-card-desc">
                      {isMend
                        ? 'Expends 2 Energy to mend temporal fractures, reducing your Paradox Meter by -1.'
                        : 'Channels ambient timeline resonance to safely recover +1 Chrono Energy.'}
                    </div>
                    <div className="choice-card-btn-tag">
                      {isMend ? 'MEND -1 PARADOX ➔' : 'RECHARGE +1 ENERGY ➔'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (choice.type === 'roguePickpocket') {
    return (
      <div className="modal-overlay rogue-shadow-overlay" id="active-modal">
        <div className="rogue-shadow-backdrop" />
        <div className="modal rogue-shadow-modal" role="dialog" aria-label="Rogue Pickpocket">
          <div className="rogue-header">
            <div className="rogue-header-badge">
              <span>🗡️</span>
              <span>SHADOW POCKETS</span>
              <span>🗡️</span>
            </div>
            <div className="rogue-title">🗡️ PICKPOCKET 🗡️</div>
            <div className="rogue-subtitle">TARGET A PLAYER WITHIN 2 TILES</div>
          </div>

          <div className="modal-body rogue-body">
            <div className="rogue-target-grid">
              {choice.options.map((opt, i) => {
                const isClueSteal = opt.action.startsWith('steal_clue_');
                return (
                  <button
                    key={i}
                    type="button"
                    className={`rogue-action-card ${isClueSteal ? 'card-clue-steal' : 'card-energy-steal'}`}
                    disabled={!isMyTurn && network.mode === 'online'}
                    onClick={() => { sounds.shadowSwipe?.(); handleSelect(opt.action); }}
                  >
                    <div className="rogue-card-header">
                      <span className="rogue-type-glyph">{isClueSteal ? '🔍' : '⚡'}</span>
                      <span className="rogue-type-name">{isClueSteal ? 'SWIPE CLUE CARD' : 'SIPHON ENERGY'}</span>
                    </div>
                    <div className="rogue-card-label">{opt.label}</div>
                    <div className="rogue-swipe-tag">EXECUTE THEFT ➔</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" id="active-modal">
      <div className="modal" style={isDecipher ? { maxWidth: '560px', width: '95%' } : {}}>
        <div className="modal-title">
          {isDecipher ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#60A5FA' }}>
              <span>📜</span> Clue Decipher (Historian Ability)
            </span>
          ) : choice.type === 'roguePickpocket' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#C084FC' }}>
              <span>🗡️</span> Pickpocket / Swipe (Rogue)
            </span>
          ) : choice.type === 'chronomancerTimeStop' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#2DD4BF' }}>
              <span>⌛</span> Time Stop (Chronomancer)
            </span>
          ) : choice.title}
        </div>
        <div className="modal-body" style={{ textAlign: 'center', marginBottom: isDecipher ? '4px' : 'var(--space-lg)' }}>
          <p style={{ color: '#CBD5E1', fontSize: '0.88rem', margin: '4px 0 12px', lineHeight: 1.45 }}>
            {isDecipher
              ? (isRevealed
                  ? "Historical intel deciphered! Inspect the discovered card below, then take it into your inventory."
                  : "Select 1 of the 3 face-down mystery Clue Cards to decipher. The other cards will return to the timeline deck.")
              : choice.message}
          </p>

          {isDecipher && choice.drawnCards && (
            <div>
              <div className="mystery-cards-grid">
                {choice.drawnCards.map((c, idx) => {
                  const isSelected = selectedDecipherIdx === idx;
                  const isDimmed = isRevealed && !isSelected;
                  const isFlipped = isSelected && isRevealed;
                  const eraBorder = c.era === 'spanish' ? '#EF4444' : (c.era === 'american' ? '#3B82F6' : (c.era === 'japanese' ? '#F59E0B' : '#8B5CF6'));

                  return (
                    <div
                      key={idx}
                      className={`mystery-card-wrapper ${isSelected ? 'selected' : ''} ${isDimmed ? 'dimmed' : ''} ${isSelected && isAddingToHand ? 'adding-to-hand' : ''}`}
                      style={(!isMyTurn && network.mode === 'online') ? { pointerEvents: 'none', opacity: 0.6 } : {}}
                    >
                      <div className={`mystery-card-inner ${isFlipped ? 'is-flipped' : ''}`}>
                        {/* Card Back (Face Down) */}
                        <div
                          className="mystery-card-face mystery-card-back"
                          onClick={() => isMyTurn && !isRevealed && handleDecipherCardClick(idx)}
                          title={!isRevealed ? `Click to choose Mystery Card #${idx + 1}` : undefined}
                        >
                          <div className="card-back-ornament">⏳</div>
                          <div className="card-back-title">CARD #{idx + 1}</div>
                          <div className="card-back-status">
                            {isDimmed ? 'RETURNING' : 'MYSTERY'}
                          </div>
                          <div className="card-back-shimmer"></div>
                        </div>

                        {/* Card Front (Revealed Clue / Decoy) */}
                        <div
                          className="mystery-card-face mystery-card-front"
                          style={{ borderColor: c.isDecoy ? '#EF4444' : eraBorder }}
                          onClick={() => onMaximize && onMaximize({
                            title: c.isDecoy ? 'Decoy Card' : (c.artifactName || 'Clue Card'),
                            cardType: c.isDecoy ? 'Decoy Card' : 'Clue Card',
                            description: c.description || c.hint,
                            image: c.cardImage || c.image,
                            era: c.era
                          })}
                          title="Click to view full preview"
                        >
                          <div className={`card-front-badge ${c.isDecoy ? 'badge-decoy' : 'badge-authentic'}`}
                            style={{
                              background: c.isDecoy ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                              color: c.isDecoy ? '#F87171' : '#34D399',
                              border: `1px solid ${c.isDecoy ? '#EF4444' : '#10B981'}`
                            }}
                          >
                            {c.isDecoy ? '🎭 DECOY' : '✨ CLUE'}
                          </div>
                          <div className="card-front-img-wrap">
                            <img
                              src={c.cardImage || c.image}
                              alt={c.artifactName || c.description}
                              className="card-front-img"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                          <div className="card-front-title" title={c.artifactName || c.description}>
                            {c.artifactName || (c.isDecoy ? 'Decoy Card' : 'Clue Card')}
                          </div>
                          <div className="card-front-era" style={{ backgroundColor: `${eraBorder}33`, color: eraBorder, borderColor: eraBorder }}>
                            {ERA_NAMES[c.era]?.replace(' Era', '') || c.era}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isRevealed && selectedDecipherIdx !== null && choice.drawnCards[selectedDecipherIdx] && (() => {
                const chosen = choice.drawnCards[selectedDecipherIdx];
                const hasDecoyPassive = activePlayer?.roleKey === 'HISTORIAN' && (activePlayer?.passiveCooldown || 0) <= 0;
                const eraBorder = chosen.era === 'spanish' ? '#EF4444' : (chosen.era === 'american' ? '#3B82F6' : (chosen.era === 'japanese' ? '#F59E0B' : '#8B5CF6'));

                return (
                  <div className="decipher-dossier" style={{ animation: 'fadeInUp 0.35s ease-out' }}>
                    <div className="decipher-dossier-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>{chosen.isDecoy ? '🎭' : '🔍'}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: chosen.isDecoy ? '#F87171' : '#60A5FA' }}>
                          {chosen.isDecoy ? 'Decoy Card Discovered' : (chosen.artifactName ? `Clue: ${chosen.artifactName}` : 'Historical Clue')}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: `${eraBorder}22`, color: eraBorder, border: `1px solid ${eraBorder}55`, fontWeight: 700 }}>
                        {ERA_NAMES[chosen.era] || chosen.era}
                      </span>
                    </div>

                    <div className="decipher-dossier-quote" style={{ background: 'rgba(0, 0, 0, 0.45)', borderLeft: `3px solid ${chosen.isDecoy ? '#EF4444' : '#3B82F6'}`, padding: '10px 12px', borderRadius: '4px', fontSize: '0.84rem', color: '#E2E8F0', fontStyle: 'italic', marginBottom: '10px', lineHeight: 1.45, textAlign: 'left' }}>
                      "{chosen.hint || chosen.description || 'Ancient timeline manuscript data.'}"
                    </div>

                    {chosen.isDecoy && hasDecoyPassive && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '6px', padding: '8px 10px', fontSize: '0.78rem', color: '#6EE7B7', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                        <span>🛡️</span>
                        <span><strong>Historian Decoy Discard Active!</strong> This decoy card will be safely neutralized and returned to the deck without consuming hand space.</span>
                      </div>
                    )}

                    {chosen.isDecoy && !hasDecoyPassive && (
                      <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '6px', padding: '8px 10px', fontSize: '0.78rem', color: '#FCA5A5', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                        <span>⚠️</span>
                        <span><strong>Decoy Discard on Cooldown</strong> ({activePlayer?.passiveCooldown || 0} turns left). Decoy will take 1 slot in your hand.</span>
                      </div>
                    )}

                    {!chosen.isDecoy && (activePlayer?.clueCards?.length || 0) >= 5 && (
                      <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '6px', padding: '8px 10px', fontSize: '0.78rem', color: '#FCD34D', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                        <span>⚠️</span>
                        <span><strong>Hand Limit Full (5/5 Clues):</strong> Taking this card will trigger the discard selection modal to replace a card.</span>
                      </div>
                    )}

                    <div className="decipher-dossier-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        className={`btn ${chosen.isDecoy && hasDecoyPassive ? 'btn-success' : 'btn-primary'} decipher-add-btn`}
                        style={{ flex: 2, padding: '10px 14px', fontSize: '0.9rem', fontWeight: 700 }}
                        onClick={handleConfirmAddToHand}
                        disabled={isAddingToHand}
                      >
                        {isAddingToHand ? (
                          <span>✨ Taking into Hand...</span>
                        ) : chosen.isDecoy && hasDecoyPassive ? (
                          <span>🛡️ Neutralize Decoy & Discard ➔</span>
                        ) : (
                          <span>🎴 Add Card to Hand / Inventory ➔</span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '10px 12px', fontSize: '0.82rem' }}
                        onClick={() => onMaximize && onMaximize({
                          title: chosen.isDecoy ? 'Decoy Card' : (chosen.artifactName || 'Clue Card'),
                          cardType: chosen.isDecoy ? 'Decoy Card' : 'Clue Card',
                          description: chosen.description || chosen.hint,
                          image: chosen.cardImage || chosen.image,
                          era: chosen.era
                        })}
                      >
                        🔍 Inspect
                      </button>
                    </div>
                  </div>
                );
              })()}

              {!isRevealed && (
                <div style={{ fontSize: '0.82rem', color: '#93C5FD', marginTop: '12px', fontWeight: 600 }}>
                  🔍 Click any face-down mystery card above to decipher and reveal it!
                </div>
              )}
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
