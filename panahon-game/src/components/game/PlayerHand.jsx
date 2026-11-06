import React, { memo } from 'react';
import sounds from '../../sound.js';
import { ERA_NAMES, GAME_CONSTANTS } from '../../gameData.js';

function PlayerHand({
  viewedPlayer,
  isViewingSelf,
  isOnline,
  activeHandTab,
  onChangeTab,
  onViewMyHand,
  onInspectCard,
  missionTabRef,
  missionAttention = false,
  isSpectator = false,
  omniscientIntel = false
}) {
  if (!viewedPlayer) return null;

  const canReveal = isViewingSelf || (isSpectator && omniscientIntel);
  const clueCards = Array.isArray(viewedPlayer.clueCards) ? viewedPlayer.clueCards : [];
  const artifactCards = Array.isArray(viewedPlayer.artifactCards) ? viewedPlayer.artifactCards : [];
  const mission = viewedPlayer.mission;
  const triangulationSteps = [
    !!viewedPlayer.triangulation?.originAnchor,
    !!viewedPlayer.triangulation?.riftVector,
    !!viewedPlayer.triangulation?.impactSighting
  ];
  const verifiedStepCount = triangulationSteps.filter(Boolean).length;

  const nextDirective = !viewedPlayer.triangulation?.originAnchor
    ? {
        icon: '🔍',
        title: 'Secure the artifact clue',
        detail: <>Land on a Clue Tile in <strong>{ERA_NAMES[mission?.originEra]}</strong> to find intel for <strong>{mission?.artifactNickname || 'your mission artifact'}</strong>.</>
      }
    : !viewedPlayer.triangulation?.riftVector
      ? {
          icon: '🌀',
          title: 'Lock the rift vector',
          detail: <>Pass or land on a <strong>Time Gate</strong> to scan its vortex discharge.</>
        }
      : !viewedPlayer.triangulation?.impactSighting
        ? {
            icon: '👁️',
            title: 'Confirm ground intel',
            detail: <>Warp to <strong>{ERA_NAMES[mission?.displacedEra]}</strong> and land on a Clue Tile.</>
          }
        : {
            icon: '🏺',
            title: 'Retrieve the relic',
            detail: <>Land on the Artifact Tile in <strong>{ERA_NAMES[mission?.displacedEra]}</strong> to recover <strong>{mission?.artifactNickname || 'the relic'}</strong>.</>
          };

  return (
    <section className={`bottom-panel ${missionAttention ? 'mission-attention-active' : ''}`}>
      <div className="hand-panel-header">
        <div className="tab-nav hand-tab-nav" role="tablist" aria-label="Player hand sections">
          <button
            ref={missionTabRef}
            type="button"
            role="tab"
            aria-selected={activeHandTab === 'mission'}
            className={`tab-btn ${activeHandTab === 'mission' ? 'active' : ''} ${missionAttention ? 'mission-tab-attention' : ''}`}
            onClick={() => { sounds.btnClick(); onChangeTab('mission'); }}
          >
            📜 Mission Dossier
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeHandTab === 'clues'}
            className={`tab-btn ${activeHandTab === 'clues' ? 'active' : ''}`}
            onClick={() => { sounds.btnClick(); onChangeTab('clues'); }}
          >
            🔍 Clues ({clueCards.length}/{GAME_CONSTANTS.MAX_CLUE_CARDS || 3})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeHandTab === 'artifacts'}
            className={`tab-btn ${activeHandTab === 'artifacts' ? 'active' : ''}`}
            onClick={() => { sounds.btnClick(); onChangeTab('artifacts'); }}
          >
            🏆 Relics ({artifactCards.length})
          </button>
        </div>

        <div className="hand-viewing-status">
          <span>
            Viewing: <strong style={{ color: viewedPlayer.color }}>{viewedPlayer.name}{isViewingSelf ? ' (You)' : ''}</strong>'s Hand
            {isSpectator && <span style={{ color: '#E5C58A', fontWeight: 700, marginLeft: '4px' }}>[OBSERVER]</span>}
          </span>
          {!isViewingSelf && !isSpectator && (
            <button
              className="btn"
              style={{ padding: '2px 8px', fontSize: '0.65rem', background: 'var(--accent-gold)', color: '#000', borderRadius: '4px', fontWeight: 700, cursor: 'pointer' }}
              onClick={onViewMyHand}
            >
              👁️ View My Hand
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div className={`hand-tab-body ${activeHandTab === 'mission' ? 'tab-body-mission' : ''}`}>
        {activeHandTab === 'mission' && mission && (
          <div className="mission-display mission-compact">
            {/* Row 1: Mission Header & Identity */}
            <div className="mission-compact-header">
              <div className="mission-identity">
                <span className="mission-title">
                  {canReveal
                    ? `MISSION: RETRIEVE ${mission.artifactNickname || mission.artifactName || 'RELIC'}`
                    : `MISSION: CLASSIFIED OBJECTIVE (${viewedPlayer.name})`}
                </span>
                <span className="mission-era-pill">
                  🏛️ {ERA_NAMES[mission.originEra || mission.targetEra]}
                </span>
                <span
                  className="mission-lock-pill"
                  style={{
                    color: verifiedStepCount === 3 ? '#86EFAC' : '#FDE047',
                    borderColor: verifiedStepCount === 3 ? 'rgba(134, 239, 172, 0.65)' : '#8C6527'
                  }}
                >
                  {isViewingSelf
                    ? `🔒 ${verifiedStepCount}/3 VERIFIED`
                    : `📜 ${clueCards.length} CLUES`}
                </span>
              </div>
              <div className="mission-desc-inline" title={canReveal ? mission.description : ''}>
                {canReveal
                  ? mission.description
                  : `Historical mission details and clues are classified to ${viewedPlayer.name}.`}
              </div>
            </div>

            {/* Row 2: Status & Directives */}
            {viewedPlayer.completed ? (
              <div className="mission-completed-row">
                <span className="mission-completed-title">
                  🏆 {viewedPlayer.placementRank === 1 ? '1ST' : viewedPlayer.placementRank === 2 ? '2ND' : viewedPlayer.placementRank === 3 ? '3RD' : `${viewedPlayer.placementRank}TH`} PLACE LOCKED IN!
                </span>
                <span className="mission-completed-copy">
                  Relic returned to {ERA_NAMES[mission.originEra || mission.targetEra]}. Assist allies before Timeline breaches!
                </span>
              </div>
            ) : artifactCards.some(a => a.id === mission.artifactId) ? (
              <div className="mission-phase-row phase-return">
                <span className="mission-phase-tag">📦 PHASE 3: RETURN TO ORIGIN</span>
                <span className="mission-phase-copy">
                  You hold <strong>{mission.artifactNickname}</strong>! Travel back to native <strong>{ERA_NAMES[mission.originEra || mission.targetEra]}</strong> and land on the Artifact Tile to restore history!
                </span>
              </div>
            ) : (viewedPlayer.clueProgress?.[mission.artifactId] || 0) >= 3 ? (
              <div className="mission-phase-row phase-retrieve">
                <span className="mission-phase-tag">📍 PHASE 2: DISPLACED RETRIEVAL</span>
                <span className="mission-phase-copy">
                  Research complete! Materialized in <strong>{ERA_NAMES[mission.displacedEra]}</strong>! Travel there via Time Gate & land on the Artifact Tile to claim it!
                </span>
              </div>
            ) : (
              <div className="mission-triangulation-row">
                {/* Directive Banner */}
                <div className="mission-directive-pill">
                  <span className="mission-directive-icon" aria-hidden="true">{nextDirective.icon}</span>
                  <span className="mission-directive-content">
                    <span className="mission-directive-label">NEXT DIRECTIVE</span>
                    <strong className="mission-directive-title">{nextDirective.title}</strong>
                    <span className="mission-directive-copy">{nextDirective.detail}</span>
                  </span>
                </div>

                <div
                  className="mission-progress-summary"
                  role="progressbar"
                  aria-label="Triangulation progress"
                  aria-valuemin="0"
                  aria-valuemax="3"
                  aria-valuenow={verifiedStepCount}
                >
                  <div className="mission-progress-heading">
                    <span>TRIANGULATION</span>
                    <strong>{verifiedStepCount}/3</strong>
                  </div>
                  <div className="mission-progress-segments" aria-hidden="true">
                    {triangulationSteps.map((done, index) => (
                      <span key={index} className={done ? 'is-verified' : index === verifiedStepCount ? 'is-current' : ''} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeHandTab === 'clues' && (
          <div className="hand-cards">
            {clueCards.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '10px' }}>
                No clues collected yet. Land on Clue Tiles (🔍) in different eras to discover hints.
              </div>
            ) : (
              clueCards.map(c => {
                if (canReveal) {
                  const cardImg = c.cardImage || c.image || '';
                  const cardDesc = c.description || c.hint || (c.isDecoy ? 'Decoy Hint' : 'Clue Card');
                  return (
                    <div
                      key={c.id}
                      className="hand-card clue-card"
                      title={cardDesc}
                      onClick={() => {
                        sounds.btnClick();
                        onInspectCard({
                          title: c.isDecoy ? 'Decoy Card' : 'Clue Card',
                          cardType: c.isDecoy ? 'Decoy Card' : 'Clue Card',
                          description: cardDesc,
                          image: cardImg,
                          era: c.era
                        });
                      }}
                    >
                      <img src={cardImg} alt={cardDesc} />
                      <div className="hand-card-type" style={{ color: c.isDecoy ? 'var(--text-danger)' : 'var(--tile-clue)' }}>
                        {c.isDecoy ? 'Decoy Hint' : `${ERA_NAMES[c.era].replace(' Era', '')}`}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={c.id}
                      className="hand-card clue-card clue-card-secret"
                      title={`Secret Clue Card (${ERA_NAMES[c.era].replace(' Era', '')})`}
                    >
                      <div className="card-secret-back">
                        <div className="card-secret-icon">🔒</div>
                        <div className="card-secret-label">{ERA_NAMES[c.era].replace(' Era', '')}</div>
                      </div>
                      <div className="hand-card-type" style={{ color: 'var(--text-secondary)' }}>
                        Classified Clue
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        )}

        {activeHandTab === 'artifacts' && (
          <div className="hand-cards">
            {artifactCards.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '10px' }}>
                No historical artifacts acquired yet. Reach an Artifact Tile with 3 clues to retrieve one!
              </div>
            ) : (
              artifactCards.map(a => (
                <div
                  key={a.id}
                  className="hand-card artifact-card"
                  title={`${a.name} (${a.nickname})`}
                  onClick={() => {
                    sounds.btnClick();
                    onInspectCard({
                      title: `${a.name} (${a.nickname})`,
                      cardType: 'Historical Relic',
                      description: a.description,
                      image: a.cardImage || a.image,
                      era: a.era
                    });
                  }}
                >
                  <img src={a.cardImage || a.image} alt={a.name} />
                  <div className="hand-card-type" style={{ color: 'var(--tile-artifact)' }}>
                    {a.nickname}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(PlayerHand);
