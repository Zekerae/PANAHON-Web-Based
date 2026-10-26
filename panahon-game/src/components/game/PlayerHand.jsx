import React, { memo } from 'react';
import sounds from '../../sound.js';
import { ERA_NAMES } from '../../gameData.js';

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
            🔍 Clues ({viewedPlayer.clueCards.length}/5)
          </button>
          <button
            className={`tab-btn ${activeHandTab === 'artifacts' ? 'active' : ''}`}
            onClick={() => { sounds.btnClick(); onChangeTab('artifacts'); }}
          >
            🏆 Relics ({viewedPlayer.artifactCards.length})
          </button>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>
            Viewing: <strong style={{ color: viewedPlayer.color }}>{viewedPlayer.name}{isViewingSelf ? ' (You)' : ''}</strong>'s Hand
            {isSpectator && <span style={{ color: '#C084FC', fontWeight: 700, marginLeft: '4px' }}>[OBSERVER]</span>}
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
                <span style={{ fontSize: '0.7rem', background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                  Target Era: <strong>{ERA_NAMES[viewedPlayer.mission.targetEra]}</strong>
                </span>
              </div>
            </div>

            {viewedPlayer.missionComplete ? (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: '#34D399', fontWeight: 800, fontSize: '0.85rem' }}>
                  🏆 MISSION ACCOMPLISHED (+10 PTS)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#A7F3D0' }}>
                  Relic safely returned to {ERA_NAMES[viewedPlayer.mission.targetEra]}
                </span>
              </div>
            ) : viewedPlayer.artifactCards.some(a => a.id === viewedPlayer.mission.artifactId) ? (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #F59E0B', borderRadius: '8px' }}>
                <div style={{ color: '#FBBF24', fontWeight: 800, fontSize: '0.82rem', marginBottom: '4px' }}>
                  📦 RELIC IN POSSESSION!
                </div>
                <div style={{ fontSize: '0.75rem', color: '#FDE68A' }}>
                  You hold the <strong>{viewedPlayer.mission.artifactNickname}</strong>! Travel to the <strong>{ERA_NAMES[viewedPlayer.mission.targetEra]}</strong> and click <strong>Return Relic</strong> in your action panel to complete your mission.
                </div>
              </div>
            ) : (
              <div className="mission-progress" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="mission-progress-text" style={{ fontWeight: 700, color: "#BAE6FD" }}>Ancient Intel Acquisition:</span>
                  <span style={{ fontSize: "0.74rem", fontWeight: 800, color: (viewedPlayer.clueProgress?.[viewedPlayer.mission?.artifactId] || 0) >= 3 ? "#4ADE80" : "#FACC15" }}>
                    {isViewingSelf
                      ? `${viewedPlayer.clueProgress?.[viewedPlayer.mission?.artifactId] || 0}/3 Decoded`
                      : `${viewedPlayer.clueCards.length} Clues`}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", margin: "2px 0 6px", alignItems: "center" }}>
                  {[0, 1, 2].map((gemIdx) => {
                    const isCollected = gemIdx < (isViewingSelf ? (viewedPlayer.clueProgress?.[viewedPlayer.mission?.artifactId] || 0) : viewedPlayer.clueCards.length);
                    return (
                      <div
                        key={gemIdx}
                        style={{
                          flex: 1,
                          height: "26px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          background: isCollected ? "linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(2, 132, 199, 0.45) 100%)" : "rgba(255,255,255,0.06)",
                          border: isCollected ? "1px solid #38BDF8" : "1px dashed rgba(255,255,255,0.2)",
                          boxShadow: isCollected ? "0 0 12px rgba(56, 189, 248, 0.4)" : "none",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: isCollected ? "#E0F2FE" : "#64748B",
                          transition: "all 0.3s ease"
                        }}
                        title={isCollected ? `Clue #${gemIdx + 1} Acquired!` : `Clue #${gemIdx + 1} Needed`}
                      >
                        <span>{isCollected ? "💎" : "○"}</span>
                        <span>Clue #{gemIdx + 1}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mission-progress-bar">
                  <div
                    className="mission-progress-fill"
                    style={{
                      width: `${(Math.min(3, isViewingSelf ? (viewedPlayer.clueProgress?.[viewedPlayer.mission?.artifactId] || 0) : viewedPlayer.clueCards.length) / 3) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeHandTab === 'clues' && (
          <div className="hand-cards">
            {viewedPlayer.clueCards.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '10px' }}>
                No clues collected yet. Land on Clue Tiles (🔍) in different eras to discover hints.
              </div>
            ) : (
              viewedPlayer.clueCards.map(c => {
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
            {viewedPlayer.artifactCards.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '10px' }}>
                No historical artifacts acquired yet. Reach an Artifact Tile with 3 clues to retrieve one!
              </div>
            ) : (
              viewedPlayer.artifactCards.map(a => (
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
