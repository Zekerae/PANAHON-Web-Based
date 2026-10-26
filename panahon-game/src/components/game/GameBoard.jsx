import React, { useState, useRef, useCallback, useMemo, memo } from "react";
import sounds from "../../sound.js";
import {
  ERA_ORDER,
  ERA_NAMES,
  ERA_TILE_COORDINATES,
  getActiveTileCoordinates,
  getActivePathConnections,
  TILE_IMAGES
} from "../../gameData.js";

const CAMERA_OPTIONS = [
  { id: 'full', label: 'Full Map', mobileLabel: 'Full', icon: '🗺️' },
  { id: 'focus-spanish', label: 'Spanish', mobileLabel: 'Spanish' },
  { id: 'focus-american', label: 'American', mobileLabel: 'American' },
  { id: 'focus-japanese', label: 'Japanese', mobileLabel: 'Japanese' },
  { id: 'focus-myth', label: 'Myth', mobileLabel: 'Myth' },
  { id: 'auto', label: 'Auto Focus', mobileLabel: 'Auto', icon: '🎯' },
];

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
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const viewportRef = useRef(null);
  const mapWrapperRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const initialPinchDistRef = useRef(null);
  const initialPinchZoomRef = useRef(1.0);

  // High-performance direct RAF transform tracking (Zero React re-renders during gesture)
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.0);
  const rafIdRef = useRef(null);
  const wheelTimeoutRef = useRef(null);

  // Bounds clamping to keep map within accessible limits
  const clampPan = useCallback((x, y, currentZoom) => {
    if (!viewportRef.current) return { x, y };
    const vw = viewportRef.current.clientWidth || 800;
    const vh = viewportRef.current.clientHeight || 600;
    const bw = Math.min(vw, 960);
    const bh = (bw * 765) / 1024;

    const maxPanX = Math.max(0, (bw * currentZoom - vw) / 2) + vw * 0.35;
    const maxPanY = Math.max(0, (bh * currentZoom - vh) / 2) + vh * 0.35;

    return {
      x: Math.min(maxPanX, Math.max(-maxPanX, x)),
      y: Math.min(maxPanY, Math.max(-maxPanY, y))
    };
  }, []);

  // Update DOM transform directly in RAF (60-120fps smooth on mobile)
  const updateTransformDirect = useCallback((newPan, newZoom) => {
    panRef.current = newPan;
    zoomRef.current = newZoom;
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        if (mapWrapperRef.current) {
          mapWrapperRef.current.style.transform = `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0) scale3d(${zoomRef.current}, ${zoomRef.current}, 1)`;
        }
        rafIdRef.current = null;
      });
    }
  }, []);

  // Preset camera quadrant target calculator
  const setCameraPreset = useCallback((camId) => {
    sounds.btnClick();
    setCameraMode(camId);
    if (!viewportRef.current) return;
    const vw = viewportRef.current.clientWidth || 800;
    const vh = viewportRef.current.clientHeight || 600;

    let targetZoom = 1.0;
    let targetPan = { x: 0, y: 0 };

    if (camId === 'full') {
      targetZoom = 1.0;
      targetPan = { x: 0, y: 0 };
    } else if (camId === 'focus-spanish') {
      targetZoom = 2.0;
      targetPan = clampPan(vw * 0.25, vh * 0.22, 2.0);
    } else if (camId === 'focus-american') {
      targetZoom = 2.0;
      targetPan = clampPan(-vw * 0.25, vh * 0.22, 2.0);
    } else if (camId === 'focus-japanese') {
      targetZoom = 2.0;
      targetPan = clampPan(-vw * 0.25, -vh * 0.22, 2.0);
    } else if (camId === 'focus-myth') {
      targetZoom = 2.0;
      targetPan = clampPan(vw * 0.25, -vh * 0.22, 2.0);
    } else if (camId === 'auto') {
      const era = currentPlayer?.currentEra || 'spanish';
      targetZoom = 2.0;
      if (era === 'spanish') targetPan = clampPan(vw * 0.25, vh * 0.22, 2.0);
      else if (era === 'american') targetPan = clampPan(-vw * 0.25, vh * 0.22, 2.0);
      else if (era === 'japanese') targetPan = clampPan(-vw * 0.25, -vh * 0.22, 2.0);
      else targetPan = clampPan(vw * 0.25, -vh * 0.22, 2.0);
    }

    panRef.current = targetPan;
    zoomRef.current = targetZoom;
    setZoom(targetZoom);
    setPan(targetPan);
  }, [currentPlayer?.currentEra, clampPan]);

  const handleZoomStep = (delta) => {
    sounds.btnClick();
    setZoom((prev) => {
      const nextZoom = Math.min(3.2, Math.max(0.85, Number((prev + delta).toFixed(2))));
      const nextPan = clampPan(panRef.current.x, panRef.current.y, nextZoom);
      panRef.current = nextPan;
      zoomRef.current = nextZoom;
      setPan(nextPan);
      return nextZoom;
    });
    setCameraMode('custom');
  };

  const handleResetView = () => {
    sounds.btnClick();
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1.0;
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setCameraMode('full');
  };

  // Touch gesture handling (1 finger pan, 2 finger pinch-to-zoom)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragStartRef.current = {
        x: e.touches[0].clientX - panRef.current.x,
        y: e.touches[0].clientY - panRef.current.y
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      isDraggingRef.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialPinchZoomRef.current = zoomRef.current;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = dist / initialPinchDistRef.current;
      const nextZoom = Math.min(3.2, Math.max(0.85, initialPinchZoomRef.current * scaleFactor));
      const nextPan = clampPan(panRef.current.x, panRef.current.y, nextZoom);
      updateTransformDirect(nextPan, nextZoom);
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - touchStartPosRef.current.x;
      const dy = e.touches[0].clientY - touchStartPosRef.current.y;
      if (Math.hypot(dx, dy) > 6) {
        hasDraggedRef.current = true;
      }
      const rawX = e.touches[0].clientX - dragStartRef.current.x;
      const rawY = e.touches[0].clientY - dragStartRef.current.y;
      const nextPan = clampPan(rawX, rawY, zoomRef.current);
      updateTransformDirect(nextPan, zoomRef.current);
    }
  };

  const handleDragEnd = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      initialPinchDistRef.current = null;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      // Commit final position to React state once
      setPan({ ...panRef.current });
      setZoom(zoomRef.current);
      setCameraMode('custom');
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 120);
    }
  };

  // Mouse drag handling (Desktop)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartRef.current = {
      x: e.clientX - panRef.current.x,
      y: e.clientY - panRef.current.y
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - touchStartPosRef.current.x;
    const dy = e.clientY - touchStartPosRef.current.y;
    if (Math.hypot(dx, dy) > 6) {
      hasDraggedRef.current = true;
    }
    const rawX = e.clientX - dragStartRef.current.x;
    const rawY = e.clientY - dragStartRef.current.y;
    const nextPan = clampPan(rawX, rawY, zoomRef.current);
    updateTransformDirect(nextPan, zoomRef.current);
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0018;
    const nextZoom = Math.min(3.2, Math.max(0.85, zoomRef.current + delta));
    const nextPan = clampPan(panRef.current.x, panRef.current.y, nextZoom);
    updateTransformDirect(nextPan, nextZoom);
    if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    wheelTimeoutRef.current = setTimeout(() => {
      setPan({ ...panRef.current });
      setZoom(zoomRef.current);
      setCameraMode('custom');
    }, 150);
  };

  const activeCoords = useMemo(() => {
    return (typeof getActiveTileCoordinates === "function" ? getActiveTileCoordinates() : null) || ERA_TILE_COORDINATES;
  }, []);

  const connections = useMemo(() => {
    return (typeof getActivePathConnections === "function" ? getActivePathConnections() : {}) || {};
  }, []);

  // Precompute players by tile key in O(P) once per render, avoiding 96 O(P) filter calls
  const playersByTileKey = useMemo(() => {
    const map = {};
    if (!players) return map;
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (p && p.currentEra && p.tileIndex !== undefined) {
        const k = `${p.currentEra}_${p.tileIndex}`;
        if (!map[k]) map[k] = [];
        map[k].push(p);
      }
    }
    return map;
  }, [players]);

  // Precompute reachable target tile once per state change, avoiding O(N) connections looping per tile
  const reachableTileKey = useMemo(() => {
    if (pendingChoice?.type === "teleportTile") {
      return "all_" + (pendingChoice.targetEra || "myth");
    }
    if (phase === "moving" && movesRemaining > 0 && currentPlayer) {
      const era = currentPlayer.currentEra;
      const cIdx = currentPlayer.tileIndex;
      const dir = movementDirection === "backward" ? -1 : 1;
      const tiles = board?.[era] || [];
      let target = null;
      if (dir === 1) {
        const eraConns = connections[era];
        if (eraConns && eraConns[cIdx] && eraConns[cIdx].length > 0) {
          target = eraConns[cIdx][0];
        } else {
          target = (cIdx + 1) % tiles.length;
        }
      } else {
        const eraConns = connections[era];
        if (eraConns) {
          for (const [sourceStr, targetArr] of Object.entries(eraConns)) {
            if (Array.isArray(targetArr) && targetArr.includes(cIdx)) {
              target = parseInt(sourceStr, 10);
              break;
            }
          }
        }
        if (target === null) {
          target = (cIdx - 1 + tiles.length) % tiles.length;
        }
      }
      return `${era}_${target}`;
    }
    return null;
  }, [pendingChoice, phase, movesRemaining, currentPlayer, movementDirection, board, connections]);

  if (!board || !currentPlayer) return null;

  const coordFor = (era) => activeCoords?.[era] || ERA_TILE_COORDINATES?.[era] || [];

  // Build a single list of pawns rendered in their own layer so the pawn stays
  // mounted while moving and can animate smoothly from tile to tile.
  const pawns = (players || []).map((p) => {
    const coords = coordFor(p.currentEra);
    const coord = coords[p.tileIndex];
    if (!p || !coord || typeof coord.x !== "number" || typeof coord.y !== "number") return null;

    const stack = (players || []).filter(q => q && q.currentEra === p.currentEra && q.tileIndex === p.tileIndex);
    const stackIndex = Math.max(0, stack.findIndex(q => q.id === p.id));
    const offset = (stackIndex - (stack.length - 1) / 2) * 18;

    return { player: p, coord, offset };
  }).filter(Boolean);

  return (
    <main className="board-container">
      {/* Top Camera Presets Bar */}
      <div className="board-camera-bar" role="toolbar" aria-label="Board camera controls">
        {CAMERA_OPTIONS.map((cam) => (
          <button
            key={cam.id}
            className={`board-cam-btn ${cameraMode === cam.id ? "active" : ""}`}
            onClick={() => setCameraPreset(cam.id)}
            title={cam.label}
            aria-label={cam.label}
          >
            {cam.icon && <span className="board-cam-icon">{cam.icon}</span>}
            <span className="board-cam-text-desktop">{cam.label}</span>
            <span className="board-cam-text-mobile">{cam.mobileLabel}</span>
          </button>
        ))}
      </div>

      {temporalOccurrence > 0 && (
        <div className="temporal-badge">
          ⚡ Temporal Occurrence Active ({temporalOccurrence} turns left)!
        </div>
      )}

      {/* Interactive Clash-of-Clans Pan & Zoom Viewport */}
      <div
        ref={viewportRef}
        className={`board-viewport ${isDragging ? 'is-dragging' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onTouchCancel={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onWheel={handleWheel}
      >
        {/* Floating Zoom HUD (+ / - / Reset) */}
        <div className="board-zoom-hud" role="group" aria-label="Zoom controls">
          <button
            type="button"
            className="zoom-hud-btn"
            onClick={() => handleZoomStep(0.35)}
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <span>➕</span>
          </button>
          <button
            type="button"
            className="zoom-hud-btn"
            onClick={() => handleZoomStep(-0.35)}
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <span>➖</span>
          </button>
          <button
            type="button"
            className="zoom-hud-btn"
            onClick={handleResetView}
            title="Reset View (Fit Full Map)"
            aria-label="Reset View"
          >
            <span>⤢</span>
          </button>
        </div>

        {/* Freely Translatable & Scalable Board Map */}
        <div
          ref={mapWrapperRef}
          className="board-map-wrapper"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
            willChange: isDragging ? 'transform' : 'transform'
          }}
        >
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
                const tileKey = `${era}_${idx}`;
                const playersOnTile = playersByTileKey[tileKey] || [];
                const isReachable = reachableTileKey === `all_${era}` || reachableTileKey === tileKey;

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
                    key={t.id || tileKey}
                    className={`mario-party-space space-${tileType} ${isReachable ? "reachable-space" : ""} ${playersOnTile.length > 0 ? "has-players" : ""}`}
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                    title={`${(tileType || "").toUpperCase()} (Space #${idx + 1} - ${ERA_NAMES[era] || era})`}
                    onClick={() => {
                      if (!hasDraggedRef.current && onMoveToTile) {
                        onMoveToTile(t.id);
                      }
                    }}
                  >
                    {isReachable && (
                      <div className="reachable-arrow-indicator" title="Move here">
                        {movementDirection === "backward" ? "▲" : "▼"}
                      </div>
                    )}
                    {TILE_IMAGES?.[tileType] ? (
                      <img
                        src={TILE_IMAGES[tileType]}
                        className="space-tile-image"
                        alt={tileType}
                        draggable={false}
                        loading="lazy"
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
                              {p.role?.avatar && <img src={p.role.avatar} className="pawn-sprite" alt={p.name} draggable={false} />}
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

          {/* Pawn layer: kept separate from tiles so movement animates smoothly */}
          <div className="board-pawns-layer">
            {pawns.map(({ player: p, coord, offset }) => {
              const isPawnTurn = p.id === currentPlayer.id;
              return (
                <div
                  key={`pawn-${p.id}`}
                  className={`board-pawn ${isPawnTurn ? "active-turn" : ""}`}
                  style={{ left: `${coord.x}%`, top: `${coord.y}%`, marginLeft: `${offset}px` }}
                  title={`${p.name} (${p.role?.name || ""})`}
                >
                  <div className={`mario-pawn ${isPawnTurn ? "active-turn" : ""}`}>
                    {isPawnTurn && <div className="pawn-turn-arrow">▼ YOU</div>}
                    <div className="pawn-badge" style={{ background: p.color }}>P{(p.id ?? 0) + 1}</div>
                    {p.role?.avatar && <img src={p.role.avatar} className="pawn-sprite" alt={p.name} />}
                    <div className="pawn-pedestal" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

export default memo(GameBoard);
