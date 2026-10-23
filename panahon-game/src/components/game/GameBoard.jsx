import React, { useState, memo } from "react";
import sounds from "../../sound.js";
import {
  ERA_ORDER,
  ERA_NAMES,
  ERA_TILE_COORDINATES,
  getActiveTileCoordinates,
  getActivePathConnections,
  TILE_IMAGES
} from "../../gameData.js";

function GameBoard({
  board,
  players,
  currentPlayer,
  phase,
  movesRemaining,
  movementDirection,
  temporalOccurrence,
  pendingChoice,
  onMoveToTile
}) {
  const [cameraMode, setCameraMode] = useState("full");

  if (!board || !currentPlayer) return null;

  const activeCoords = (typeof getActiveTileCoordinates === "function" ? getActiveTileCoordinates() : null) || ERA_TILE_COORDINATES;
  const connections = (typeof getActivePathConnections === "function" ? getActivePathConnections() : {}) || {};

  return (
    <main className="board-container">
      <div className="board-camera-bar">
        {["full", "focus-spanish", "focus-american", "focus-japanese", "focus-myth", "auto"].map((cam) => (
          <button
            key={cam}
            className={`board-cam-btn ${cameraMode === cam ? "active" : ""}`}
            onClick={() => { sounds.btnClick(); setCameraMode(cam); }}
          >
            {cam === "full" ? "🗺️ Full Map" : (cam === "auto" ? "🎯 Auto Focus" : cam.replace("focus-", "").toUpperCase())}
          </button>
        ))}
      </div>

      {temporalOccurrence > 0 && (
        <div className="temporal-badge">
          ⚡ Temporal Occurrence Active ({temporalOccurrence} turns left)!
        </div>
      )}

      <div className="board-viewport">
        <div className={`board-map-wrapper ${cameraMode === "auto" ? `focus-${currentPlayer.currentEra}` : (cameraMode === "full" ? "" : cameraMode)}`}>
          {/* SVG Path lines connecting circle spaces */}
          <svg className="board-paths-svg" viewBox="0 0 1024 765" preserveAspectRatio="none">
            {ERA_ORDER.map(era => {
              const coords = activeCoords?.[era] || ERA_TILE_COORDINATES?.[era] || [];
              if (!coords || coords.length === 0) return null;
              const eraConns = connections?.[era];
              const isActiveEra = currentPlayer.currentEra === era;

              if (eraConns && Object.keys(eraConns).length > 0) {
                return Object.entries(eraConns).map(([fromStr, toList]) => {
                  const fromIdx = parseInt(fromStr, 10);
                  const fromCoord = coords[fromIdx];
                  if (!fromCoord || typeof fromCoord.x !== "number" || typeof fromCoord.y !== "number" || !Array.isArray(toList)) return null;
                  return toList.map(toIdx => {
                    const toCoord = coords[toIdx];
                    if (!toCoord || typeof toCoord.x !== "number" || typeof toCoord.y !== "number") return null;
                    return (
                      <line
                        key={`${era}_${fromIdx}_${toIdx}`}
                        x1={(fromCoord.x * 1024) / 100}
                        y1={(fromCoord.y * 765) / 100}
                        x2={(toCoord.x * 1024) / 100}
                        y2={(toCoord.y * 765) / 100}
                        className={`board-path-line ${isActiveEra ? "active-era-path" : ""}`}
                        strokeWidth={isActiveEra ? 3 : 2}
                        opacity={isActiveEra ? 1 : 0.35}
                      />
                    );
                  });
                });
              }

              const validCoords = coords.filter(c => c && typeof c.x === "number" && typeof c.y === "number");
              if (validCoords.length === 0) return null;
              const d = validCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${(c.x * 1024) / 100} ${(c.y * 765) / 100}`).join(" ") + " Z";
              return <path key={era} d={d} className={`board-path-line ${isActiveEra ? "active-era-path" : ""}`} />;
            })}

            {/* Connections from Timegate Spaces to Central Nexus Portal Dial */}
            {ERA_ORDER.map(era => {
              const tgIdx = board[era]?.findIndex(t => t && t.type === "timegate");
              if (tgIdx === undefined || tgIdx === -1) return null;
              const coords = activeCoords?.[era] || ERA_TILE_COORDINATES?.[era] || [];
              const c = coords[tgIdx];
              if (!c || typeof c.x !== "number" || typeof c.y !== "number") return null;
              return (
                <path
                  key={era + "-nexus"}
                  d={`M ${(c.x * 1024) / 100} ${(c.y * 765) / 100} L ${1024 * 0.50} ${765 * 0.49}`}
                  className="board-path-line"
                  style={{ stroke: "#00E5FF", strokeWidth: 3, strokeDasharray: "4 4" }}
                />
              );
            })}
          </svg>

          {/* Circular Spaces along the paths */}
          <div className="board-map">
            {ERA_ORDER.map(era => {
              const tiles = board[era] || [];
              const coords = activeCoords?.[era] || ERA_TILE_COORDINATES?.[era] || [];

              return tiles.map((t, idx) => {
                if (!t) return null;
                const coord = coords[idx];
                if (!coord || typeof coord.x !== "number" || typeof coord.y !== "number") return null;
                const tileType = t.type;
                const playersOnTile = (players || []).filter(p => p && p.currentEra === era && p.tileIndex === idx);

                let isReachable = false;
                if (pendingChoice?.type === "teleportTile" && (pendingChoice.targetEra || "myth") === era) {
                  isReachable = true;
                } else if (phase === "moving" && movesRemaining > 0 && currentPlayer.currentEra === era) {
                  const cIdx = currentPlayer.tileIndex;
                  const dir = movementDirection === "backward" ? -1 : 1;
                  if (dir === 1 && idx === (cIdx + 1) % tiles.length) {
                    isReachable = true;
                  } else if (dir === -1 && idx === (cIdx - 1 + tiles.length) % tiles.length) {
                    isReachable = true;
                  }
                }

                let icon = "•";
                if (tileType === "clue") icon = "🔍";
                else if (tileType === "event") icon = "⚡";
                else if (tileType === "danger") icon = "⚠️";
                else if (tileType === "artifact") icon = "🏆";
                else if (tileType === "timegate") icon = "🌀";
                else if (tileType === "paradox") icon = "⏳";
                else if (tileType === "start") icon = "🚩";

                return (
                  <div
                    key={t.id || `${era}_${idx}`}
                    className={`mario-party-space space-${tileType} ${isReachable ? "reachable-space" : ""} ${playersOnTile.length > 0 ? "has-players" : ""}`}
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                    title={`${(tileType || "").toUpperCase()} (Space #${idx + 1} - ${ERA_NAMES[era] || era})`}
                    onClick={() => onMoveToTile && onMoveToTile(t.id)}
                  >
                    {isReachable && <div className="reachable-arrow-indicator">▼</div>}
                    {TILE_IMAGES?.[tileType] ? (
                      <img
                        src={TILE_IMAGES[tileType]}
                        className="space-tile-image"
                        alt={tileType}
                        draggable={false}
                      />
                    ) : (
                      <div className="space-disc">
                        <span className="space-icon">{icon}</span>
                      </div>
                    )}
                    {t.trap && <span className="tile-trap-indicator" title="Temporal Trap!">💣</span>}

                    {playersOnTile.length > 0 && (
                      <div className="tile-players">
                        {playersOnTile.map(p => {
                          const isPawnTurn = p.id === currentPlayer.id;
                          return (
                            <div
                              key={p.id}
                              className={`mario-pawn ${isPawnTurn ? "active-turn" : ""}`}
                              title={`${p.name} (${p.role?.name || ""})`}
                            >
                              {isPawnTurn && <div className="pawn-turn-arrow">▼ YOU</div>}
                              <div className="pawn-badge" style={{ background: p.color }}>P{(p.id ?? 0) + 1}</div>
                              {p.role?.avatar && <img src={p.role.avatar} className="pawn-sprite" alt={p.name} />}
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
