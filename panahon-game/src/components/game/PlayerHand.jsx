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
      <div className="hand-tab-body">
        {activeHandTab === 'mission' && viewedPlayer.mission && (
          <div className="mission-display">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="mission-title">
                  {canReveal
                    ? `Mission: Retrieve ${viewedPlayer.mission.artifactNickname || viewedPlayer.mission.artifactName || 'Classified Relic'}`
                    : `Mission: Classified Objective (${viewedPlayer.name})`}
                </div>
                <div className="mission-objective">
                  {canReveal
                    ? viewedPlayer.mission.description
                    : `Historical mission details and clues are classified to ${viewedPlayer.name}.`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', background: '#140E0A', padding: '2px 6px', borderRadius: '3px', border: '1px solid #5A422D', color: '#E5C58A' }}>
                  Target Era: <strong>{ERA_NAMES[viewedPlayer.mission.targetEra]}</strong>
                </span>
              </div>
            </div>

            {viewedPlayer.completed ? (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'linear-gradient(180deg, #3A2E1E 0%, #20170E 100%)', border: '2px solid #C2974D', borderRadius: '4px', boxShadow: 'inset 1px 1px 0 #EBD07D, 0 4px 12px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#FFD700', fontWeight: 800, fontSize: '0.85rem' }}>
                  🏆 {viewedPlayer.placementRank === 1 ? '1ST' : viewedPlayer.placementRank === 2 ? '2ND' : viewedPlayer.placementRank === 3 ? '3RD' : `${viewedPlayer.placementRank}TH`} PLACE LOCKED IN!
                </span>
                <span style={{ fontSize: '0.72rem', color: '#FDE047' }}>
                  Relic returned to {ERA_NAMES[viewedPlayer.mission.originEra || viewedPlayer.mission.targetEra]}. Assist allies before Timeline Meter exceeds 5 (reaches 6)!
                </span>
              </div>
            ) : artifactCards.some(a => a.id === viewedPlayer.mission.artifactId) ? (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'linear-gradient(180deg, #352518 0%, #1A120B 100%)', border: '2px solid #5EEAD4', borderRadius: '4px', boxShadow: '0 0 14px rgba(94, 234, 212, 0.3)' }}>
                <div style={{ color: '#5EEAD4', fontWeight: 800, fontSize: '0.84rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📦</span> PHASE 3: RETURN TO ORIGIN ERA ({ERA_NAMES[viewedPlayer.mission.originEra || viewedPlayer.mission.targetEra]})
                </div>
                <div style={{ fontSize: '0.75rem', color: '#FDE68A' }}>
                  You hold the <strong>{viewedPlayer.mission.artifactNickname}</strong>! Travel back to its native <strong>{ERA_NAMES[viewedPlayer.mission.originEra || viewedPlayer.mission.targetEra]}</strong> and land on the Artifact/Return Tile to restore history and lock in your FIFO placement!
                </div>
              </div>
            ) : (viewedPlayer.clueProgress?.[viewedPlayer.mission?.artifactId] || 0) >= 3 ? (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'linear-gradient(180deg, #422006 0%, #1E120A 100%)', border: '2px solid #F59E0B', borderRadius: '4px', boxShadow: '0 0 14px rgba(245, 158, 11, 0.35)' }}>
                <div style={{ color: '#FCD34D', fontWeight: 800, fontSize: '0.84rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📍</span> PHASE 2: RETRIEVAL IN DISPLACED ERA
                </div>
                <div style={{ fontSize: '0.75rem', color: '#FEF08A' }}>
                  Research complete (3/3 Clues)! The <strong>{viewedPlayer.mission.artifactNickname}</strong> has materialized in the <strong>{ERA_NAMES[viewedPlayer.mission.displacedEra]}</strong>! Travel there via Time Gate and land on the Artifact Tile to claim it!
                </div>
              </div>
            ) : (
              <div className="mission-progress" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="mission-progress-text" style={{ fontWeight: 700, color: "#E5C58A" }}>
                    Temporal Triangulation: {viewedPlayer.mission?.artifactNickname || 'Relic'}
                  </span>
                  <span style={{ fontSize: "0.74rem", fontWeight: 800, color: (viewedPlayer.clueProgress?.[viewedPlayer.mission?.artifactId] || 0) >= 3 ? "#4ADE80" : "#FACC15" }}>
                    {isViewingSelf
                      ? `${(viewedPlayer.triangulation?.originAnchor ? 1 : 0) + (viewedPlayer.triangulation?.riftVector ? 1 : 0) + (viewedPlayer.triangulation?.impactSighting ? 1 : 0)}/3 Locked`
                      : `${clueCards.length} Clues`}
                  </span>
                </div>

                {/* 3 Triangulation Step Badges */}
                <div style={{ display: "flex", gap: "6px", margin: "2px 0 4px", alignItems: "center" }}>
                  {[
                    { step: 1, label: "Origin Anchor", icon: "📜", done: !!viewedPlayer.triangulation?.originAnchor, desc: `Excavate historical records in ${ERA_NAMES[viewedPlayer.mission?.originEra]}` },
                    { step: 2, label: "Rift Vector", icon: "🌀", done: !!viewedPlayer.triangulation?.riftVector, desc: "Scan vortex discharge at a Time Gate" },
                    { step: 3, label: "Ground Intel", icon: "👁️", done: !!viewedPlayer.triangulation?.impactSighting, desc: `Confirm ground sightings in ${ERA_NAMES[viewedPlayer.mission?.displacedEra]}` }
                  ].map((s) => (
                    <div
                      key={s.step}
                      style={{
                        flex: 1,
                        padding: "5px 3px",
                        minHeight: "32px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        background: s.done ? "linear-gradient(180deg, #4D3826 0%, #352518 100%)" : "#140E0A",
                        border: s.done ? "1.5px solid #F5C442" : "1px dashed #5A422D",
                        boxShadow: s.done ? "inset 1px 1px 0 #EBD07D, 0 2px 6px rgba(0,0,0,0.6)" : "none",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: s.done ? "#FFD700" : "#735E4E",
                        transition: "all 0.3s ease",
                        textAlign: "center"
                      }}
                      title={`${s.label}: ${s.desc} - ${s.done ? "VERIFIED ✅" : "PENDING ⏳"}`}
                    >
                      <span>{s.done ? "✅" : s.icon}</span>
                      <span style={{ fontSize: "0.68rem" }}>{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Directive Guidance */}
                <div style={{ fontSize: "0.72rem", color: "#FDE68A", background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "4px", borderLeft: "3px solid #F59E0B" }}>
                  {!viewedPlayer.triangulation?.originAnchor ? (
                    <span>🎯 <strong>Next Directive:</strong> Land on a Clue Tile (🔍) in <strong>{ERA_NAMES[viewedPlayer.mission?.originEra]}</strong> to lock the historical Origin Anchor.</span>
                  ) : !viewedPlayer.triangulation?.riftVector ? (
                    <span>🎯 <strong>Next Directive:</strong> Pass or land on a <strong>Time Gate (🌀)</strong> to perform a Chrono-Scan and lock the Rift Vector!</span>
                  ) : !viewedPlayer.triangulation?.impactSighting ? (
                    <span>🎯 <strong>Next Directive:</strong> Warp to <strong>{ERA_NAMES[viewedPlayer.mission?.displacedEra]}</strong> and land on a Clue Tile (🔍) for ground sightings.</span>
                  ) : (
                    <span>🎯 <strong>Triangulation Complete!</strong> Proceed to the Artifact Tile (🏺) in <strong>{ERA_NAMES[viewedPlayer.mission?.displacedEra]}</strong> to retrieve {viewedPlayer.mission?.artifactNickname}!</span>
                  )}
                </div>

                <div className="mission-progress-bar">
                  <div
                    className="mission-progress-fill"
                    style={{
                      width: `${(((viewedPlayer.triangulation?.originAnchor ? 1 : 0) + (viewedPlayer.triangulation?.riftVector ? 1 : 0) + (viewedPlayer.triangulation?.impactSighting ? 1 : 0)) / 3) * 100}%`
                    }}
                  ></div>
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
