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
  isSpectator = false,
  omniscientIntel = false
}) {
  if (!viewedPlayer) return null;

  const canReveal = isViewingSelf || (isSpectator && omniscientIntel);
  const clueCards = Array.isArray(viewedPlayer.clueCards) ? viewedPlayer.clueCards : [];
  const artifactCards = Array.isArray(viewedPlayer.artifactCards) ? viewedPlayer.artifactCards : [];

  return (
    <section className="bottom-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div className="tab-nav" style={{ margin: 0 }}>
          <button
            className={`tab-btn ${activeHandTab === 'mission' ? 'active' : ''}`}
            onClick={() => { sounds.btnClick(); onChangeTab('mission'); }}
          >
            📜 Mission Dossier
          </button>
          <button
            className={`tab-btn ${activeHandTab === 'clues' ? 'active' : ''}`}
            onClick={() => { sounds.btnClick(); onChangeTab('clues'); }}
          >
            🔍 Clues ({clueCards.length}/{GAME_CONSTANTS.MAX_CLUE_CARDS || 3})
          </button>
          <button
            className={`tab-btn ${activeHandTab === 'artifacts' ? 'active' : ''}`}
            onClick={() => { sounds.btnClick(); onChangeTab('artifacts'); }}
          >
            🏆 Relics ({artifactCards.length})
          </button>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        {activeHandTab === 'mission' && viewedPlayer.mission && (
          <div className="mission-display mission-compact">
            {/* Row 1: Mission Header & Identity */}
            <div className="mission-compact-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 0 }}>
                <span className="mission-title" style={{ fontSize: '0.74rem', margin: 0, whiteSpace: 'nowrap' }}>
                  {canReveal
                    ? `MISSION: RETRIEVE ${viewedPlayer.mission.artifactNickname || viewedPlayer.mission.artifactName || 'RELIC'}`
                    : `MISSION: CLASSIFIED OBJECTIVE (${viewedPlayer.name})`}
                </span>
                <span className="mission-era-pill">
                  🏛️ {ERA_NAMES[viewedPlayer.mission.originEra || viewedPlayer.mission.targetEra]}
                </span>
                <span
                  className="mission-lock-pill"
                  style={{
                    color: ((viewedPlayer.triangulation?.originAnchor ? 1 : 0) + (viewedPlayer.triangulation?.riftVector ? 1 : 0) + (viewedPlayer.triangulation?.impactSighting ? 1 : 0)) === 3 ? '#4ADE80' : '#FACC15',
                    borderColor: ((viewedPlayer.triangulation?.originAnchor ? 1 : 0) + (viewedPlayer.triangulation?.riftVector ? 1 : 0) + (viewedPlayer.triangulation?.impactSighting ? 1 : 0)) === 3 ? 'rgba(74, 222, 128, 0.4)' : '#5A422D'
                  }}
                >
                  {isViewingSelf
                    ? `🔒 ${(viewedPlayer.triangulation?.originAnchor ? 1 : 0) + (viewedPlayer.triangulation?.riftVector ? 1 : 0) + (viewedPlayer.triangulation?.impactSighting ? 1 : 0)}/3 LOCKED`
                    : `📜 ${clueCards.length} CLUES`}
                </span>
              </div>
              <div className="mission-desc-inline" title={canReveal ? viewedPlayer.mission.description : ''}>
                {canReveal
                  ? viewedPlayer.mission.description
                  : `Historical mission details and clues are classified to ${viewedPlayer.name}.`}
              </div>
            </div>

            {/* Row 2: Status & Directives */}
            {viewedPlayer.completed ? (
              <div className="mission-completed-row">
                <span style={{ color: '#FFD700', fontWeight: 800, fontSize: '0.78rem' }}>
                  🏆 {viewedPlayer.placementRank === 1 ? '1ST' : viewedPlayer.placementRank === 2 ? '2ND' : viewedPlayer.placementRank === 3 ? '3RD' : `${viewedPlayer.placementRank}TH`} PLACE LOCKED IN!
                </span>
                <span style={{ fontSize: '0.7rem', color: '#FDE047', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Relic returned to {ERA_NAMES[viewedPlayer.mission.originEra || viewedPlayer.mission.targetEra]}. Assist allies before Timeline breaches!
                </span>
              </div>
            ) : artifactCards.some(a => a.id === viewedPlayer.mission.artifactId) ? (
              <div className="mission-phase-row phase-return">
                <span className="mission-phase-tag">📦 PHASE 3: RETURN TO ORIGIN</span>
                <span style={{ fontSize: '0.7rem', color: '#FDE68A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  You hold <strong>{viewedPlayer.mission.artifactNickname}</strong>! Travel back to native <strong>{ERA_NAMES[viewedPlayer.mission.originEra || viewedPlayer.mission.targetEra]}</strong> and land on the Artifact Tile to restore history!
                </span>
              </div>
            ) : (viewedPlayer.clueProgress?.[viewedPlayer.mission?.artifactId] || 0) >= 3 ? (
              <div className="mission-phase-row phase-retrieve">
                <span className="mission-phase-tag">📍 PHASE 2: DISPLACED RETRIEVAL</span>
                <span style={{ fontSize: '0.7rem', color: '#FEF08A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Research complete! Materialized in <strong>{ERA_NAMES[viewedPlayer.mission.displacedEra]}</strong>! Travel there via Time Gate & land on the Artifact Tile to claim it!
                </span>
              </div>
            ) : (
              <div className="mission-triangulation-row">
                {/* 3 Step Badges */}
                <div className="mission-step-chips">
                  {[
                    { step: 1, label: "1. Origin Anchor", icon: "📜", done: !!viewedPlayer.triangulation?.originAnchor, desc: `Excavate historical records in ${ERA_NAMES[viewedPlayer.mission?.originEra]}` },
                    { step: 2, label: "2. Rift Vector", icon: "🌀", done: !!viewedPlayer.triangulation?.riftVector, desc: "Scan vortex discharge at a Time Gate" },
                    { step: 3, label: "3. Ground Intel", icon: "👁️", done: !!viewedPlayer.triangulation?.impactSighting, desc: `Confirm ground sightings in ${ERA_NAMES[viewedPlayer.mission?.displacedEra]}` }
                  ].map((s) => (
                    <div
                      key={s.step}
                      className={`mission-step-chip ${s.done ? 'step-done' : ''}`}
                      title={`${s.label}: ${s.desc} - ${s.done ? "VERIFIED ✅" : "PENDING ⏳"}`}
                    >
                      <span className="step-icon">{s.done ? "✅" : s.icon}</span>
                      <span className="step-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Directive Banner */}
                <div className="mission-directive-pill">
                  {!viewedPlayer.triangulation?.originAnchor ? (
                    <span>🎯 <strong>Next Directive:</strong> Land on Clue Tile (🔍) in <strong>{ERA_NAMES[viewedPlayer.mission?.originEra]}</strong> to lock Origin Anchor.</span>
                  ) : !viewedPlayer.triangulation?.riftVector ? (
                    <span>🎯 <strong>Next Directive:</strong> Pass or land on a <strong>Time Gate (🌀)</strong> to scan & lock Rift Vector!</span>
                  ) : !viewedPlayer.triangulation?.impactSighting ? (
                    <span>🎯 <strong>Next Directive:</strong> Warp to <strong>{ERA_NAMES[viewedPlayer.mission?.displacedEra]}</strong> & land on Clue Tile (🔍) for Ground Intel.</span>
                  ) : (
                    <span>🎯 <strong>Triangulation Complete!</strong> Land on Artifact Tile (🏺) in <strong>{ERA_NAMES[viewedPlayer.mission?.displacedEra]}</strong> to retrieve {viewedPlayer.mission?.artifactNickname}!</span>
                  )}
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
