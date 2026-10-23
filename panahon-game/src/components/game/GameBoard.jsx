import React, { useState, memo } from 'react';
import sounds from '../../sound.js';
import { ERA_ORDER, ERA_NAMES, ERA_TILE_COORDINATES } from '../../gameData.js';

function GameBoard({
  board,
  players,
  currentPlayer,
  phase,
  movesRemaining,
  movementDirection,
  temporalOccurrence,
  onMoveToTile
}) {
  const [cameraMode, setCameraMode] = useState('full');

  if (!board || !currentPlayer) return null;

  return (
    <main className="board-container">
      <div className="board-camera-bar">
        {['full', 'focus-spanish', 'focus-american', 'focus-japanese', 'focus-myth', 'auto'].map((cam) => (
          <button
            key={cam}
            className={`board-cam-btn ${cameraMode === cam ? 'active' : ''}`}
            onClick={() => { sounds.btnClick(); setCameraMode(cam); }}
          >
            {cam === 'full' ? '🗺️ Full Map' : (cam === 'auto' ? '🎯 Auto Focus' : cam.replace('focus-', '').toUpperCase())}
          </button>
        ))}
      </div>

      {temporalOccurrence > 0 && (
        <div className="temporal-badge">
          ⚡ Temporal Occurrence Active ({temporalOccurrence} turns left)!
        </div>
      )}

      <div className="board-viewport">
        <div className={`board-map-wrapper ${cameraMode === 'auto' ? `focus-${currentPlayer.currentEra}` : (cameraMode === 'full' ? '' : cameraMode)}`}>
          {/* SVG Path lines connecting circle spaces */}
          <svg className="board-paths-svg" viewBox="0 0 1024 765" preserveAspectRatio="none">
            {ERA_ORDER.map(era => {
              const coords = ERA_TILE_COORDINATES[era];
              if (!coords) return null;
              const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${(c.x * 1024) / 100} ${(c.y * 765) / 100}`).join(' ') + ' Z';
              const isActiveEra = currentPlayer.currentEra === era;
              return <path key={era} d={d} className={`board-path-line ${isActiveEra ? 'active-era-path' : ''}`} />;
            })}
            {/* Connections from Timegate Spaces to Central Nexus Portal Dial */}
            {ERA_ORDER.map(era => {
              const tgIdx = board[era]?.findIndex(t => t.type === 'timegate');
              if (tgIdx === undefined || tgIdx === -1) return null;
              const c = ERA_TILE_COORDINATES[era][tgIdx];
              return (
                <path
                  key={era + '-nexus'}
                  d={`M ${(c.x * 1024) / 100} ${(c.y * 765) / 100} L ${1024 * 0.50} ${765 * 0.49}`}
                  className="board-path-line"
                  style={{ stroke: '#00E5FF', strokeWidth: 3, strokeDasharray: '4 4' }}
                />
              );
            })}
          </svg>

          {/* Circular Spaces along the paths */}
          <div className="board-map">
            {ERA_ORDER.map(era => {
              const tiles = board[era] || [];
              const coords = ERA_TILE_COORDINATES[era] || [];

              return tiles.map((t, idx) => {
                const coord = coords[idx];
                if (!coord) return null;
                const tileType = t.type;
                const playersOnTile = players.filter(p => p.currentEra === era && p.tileIndex === idx);

                let isReachable = false;
                if (phase === 'moving' && movesRemaining > 0 && currentPlayer.currentEra === era) {
                  const cIdx = currentPlayer.tileIndex;
                  const dir = movementDirection === 'backward' ? -1 : 1;
                  if (dir === 1 && idx === (cIdx + 1) % tiles.length) {
                    isReachable = true;
                  } else if (dir === -1 && idx === (cIdx - 1 + tiles.length) % tiles.length) {
                    isReachable = true;
                  }
                }

                let icon = '•';
                if (tileType === 'clue') icon = '🔍';
                else if (tileType === 'event') icon = '⚡';
                else if (tileType === 'danger') icon = '⚠️';
                else if (tileType === 'artifact') icon = '🏆';
                else if (tileType === 'timegate') icon = '🌀';
                else if (tileType === 'paradox') icon = '⏳';
                else if (tileType === 'start') icon = '🚩';

                return (
                  <div
                    key={t.id}
                    className={`mario-party-space space-${tileType} ${isReachable ? 'reachable-space' : ''}`}
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                    title={`${tileType.toUpperCase()} (Space #${idx + 1} - ${ERA_NAMES[era]})`}
                    onClick={() => onMoveToTile(t.id)}
                  >
                    {isReachable && <div className="reachable-arrow-indicator">▼</div>}
                    <div className="space-disc">
                      <span className="space-icon">{icon}</span>
                    </div>
                    {t.trap && <span className="tile-trap-indicator" title="Temporal Trap!">💣</span>}

                    {playersOnTile.length > 0 && (
                      <div className="tile-players">
                        {playersOnTile.map(p => {
                          const isPawnTurn = p.id === currentPlayer.id;
                          return (
                            <div
                              key={p.id}
                              className={`mario-pawn ${isPawnTurn ? 'active-turn' : ''}`}
                              title={`${p.name} (${p.role.name})`}
                            >
                              {isPawnTurn && <div className="pawn-turn-arrow">▼ YOU</div>}
                              <div className="pawn-badge" style={{ background: p.color }}>P{p.id + 1}</div>
                              <img src={p.role.avatar} className="pawn-sprite" alt={p.name} />
                              <div className="pawn-pedestal" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }}></div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

export default memo(GameBoard);
