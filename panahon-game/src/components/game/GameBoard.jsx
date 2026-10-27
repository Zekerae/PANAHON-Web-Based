import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import sounds from "../../sound.js";
import { getNextTileIndex } from "../../gameEngine.js";
import {
  ERA_ORDER,
  ERA_NAMES,
  ERA_TILE_COORDINATES,
  getActiveTileCoordinates,
  getActivePathConnections,
  TILE_IMAGES
} from "../../gameData.js";

const CAMERA_OPTIONS = [
  { id: 'full', label: 'Full Map', icon: '🗺️', desc: 'Overview of entire timeline' },
  { id: 'auto', label: 'Auto Focus', icon: '🎯', desc: 'Track active player turn' },
  { id: 'custom', label: 'Free Cam', icon: '✋', desc: 'Free pan & drag anywhere (tap board to reset)' },
  { id: 'focus-spanish', label: 'Spanish Era', icon: '⚔️', desc: '16th Century Spanish timeline' },
  { id: 'focus-american', label: 'American Era', icon: '📻', desc: 'Early 20th Century timeline' },
  { id: 'focus-japanese', label: 'Japanese Era', icon: '🏮', desc: 'WWII Japanese occupation' },
  { id: 'focus-myth', label: 'Myth Era', icon: '✨', desc: 'Ancient Philippine mythology' },
];

function GameBoard({
  board,
  players,
  currentPlayer,
  turnNumber,
  phase,
  movesRemaining,
  movementDirection,
  temporalOccurrence,
  pendingChoice,
  onMoveToTile
}) {
  const [turnToast, setTurnToast] = useState(null);
  const prevTurnKeyRef = useRef(null);

  // Temporal Occurrence Shockwave Announcement & Sound Trigger
  const [showRiftAnnouncement, setShowRiftAnnouncement] = useState(false);
  const prevTemporalRef = useRef(temporalOccurrence || 0);

  useEffect(() => {
    const curr = temporalOccurrence || 0;
    const prev = prevTemporalRef.current || 0;
    if (curr > 0 && prev === 0) {
      setShowRiftAnnouncement(true);
      sounds.timeRift?.();
      const t = setTimeout(() => {
        setShowRiftAnnouncement(false);
      }, 4500);
      return () => clearTimeout(t);
    }
    prevTemporalRef.current = curr;
  }, [temporalOccurrence]);

  useEffect(() => {
    if (!currentPlayer) return;
    if (phase === "rolling" && prevTurnKeyRef.current !== `${currentPlayer.id}_${currentPlayer.currentEra}`) {
      prevTurnKeyRef.current = `${currentPlayer.id}_${currentPlayer.currentEra}`;
      sounds.turnStart?.();
      setTurnToast({
        player: currentPlayer,
        era: currentPlayer.currentEra
      });
      const t = setTimeout(() => setTurnToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [currentPlayer?.id, currentPlayer?.currentEra, phase]);

  const [cameraMode, setCameraMode] = useState("full");
  const [isCameraDropdownOpen, setIsCameraDropdownOpen] = useState(false);
  const [hoveredCam, setHoveredCam] = useState(null);
  const cameraMenuRef = useRef(null);
  const hasIntroducedRef = useRef(false);
  const prevTurnPlayerKeyRef = useRef(null);

  const currentCamOption = useMemo(() => {
    return CAMERA_OPTIONS.find(c => c.id === cameraMode) || CAMERA_OPTIONS[1];
  }, [cameraMode]);

  // Close camera dropdown when clicking outside
  useEffect(() => {
    if (!isCameraDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (cameraMenuRef.current && !cameraMenuRef.current.contains(e.target)) {
        setIsCameraDropdownOpen(false);
      }
    };
    window.addEventListener("pointerdown", handleClickOutside);
    return () => window.removeEventListener("pointerdown", handleClickOutside);
  }, [isCameraDropdownOpen]);

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

  // Bounds clamping to keep map accurately within accessible limits
  const clampPan = useCallback((x, y, currentZoom) => {
    if (!viewportRef.current) return { x, y };
    const vw = viewportRef.current.clientWidth || 800;
    const vh = viewportRef.current.clientHeight || 600;
    const bw = mapWrapperRef.current?.clientWidth || Math.min(vw, (vh * 1024) / 765);
    const bh = mapWrapperRef.current?.clientHeight || (bw * 765) / 1024;

    const scaledWidth = bw * currentZoom;
    const scaledHeight = bh * currentZoom;

    const maxPanX = Math.max(0, (scaledWidth - vw) / 2) + vw * 0.2;
    const maxPanY = Math.max(0, (scaledHeight - vh) / 2) + vh * 0.2;

    return {
      x: Math.min(maxPanX, Math.max(-maxPanX, x)),
      y: Math.min(maxPanY, Math.max(-maxPanY, y))
    };
  }, []);

  // Update DOM transform directly in RAF (60-120fps smooth on mobile & desktop)
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

  // Calculate pan offset to center on a given era & tile coordinate
  const getTilePan = useCallback((era, tileIndex, targetZoom = 1.9) => {
    if (!viewportRef.current) return { x: 0, y: 0 };
    const vw = viewportRef.current.clientWidth || 800;
    const vh = viewportRef.current.clientHeight || 600;
    const bw = mapWrapperRef.current?.clientWidth || Math.min(vw, (vh * 1024) / 765);
    const bh = mapWrapperRef.current?.clientHeight || (bw * 765) / 1024;

    const coords = (typeof getActiveTileCoordinates === "function" ? getActiveTileCoordinates() : null)?.[era] || ERA_TILE_COORDINATES?.[era] || [];
    const coord = coords[tileIndex] || coords[0];

    if (!coord || typeof coord.x !== "number" || typeof coord.y !== "number") {
      return { x: 0, y: 0 };
    }

    const rawX = (0.5 - coord.x / 100) * bw * targetZoom;
    const rawY = (0.5 - coord.y / 100) * bh * targetZoom;

    return clampPan(rawX, rawY, targetZoom);
  }, [clampPan]);

  // Preset camera quadrant target calculator
  const setCameraPreset = useCallback((camId, playSound = false) => {
    if (playSound) {
      sounds.btnClick();
    }
    setCameraMode(camId);

    let targetZoom = 1.0;
    let targetPan = { x: 0, y: 0 };

    if (camId === "full") {
      targetZoom = 1.0;
      targetPan = { x: 0, y: 0 };
    } else if (camId === "focus-spanish") {
      targetZoom = 1.9;
      targetPan = getTilePan("spanish", 10, 1.9);
    } else if (camId === "focus-american") {
      targetZoom = 1.9;
      targetPan = getTilePan("american", 10, 1.9);
    } else if (camId === "focus-japanese") {
      targetZoom = 1.9;
      targetPan = getTilePan("japanese", 10, 1.9);
    } else if (camId === "focus-myth") {
      targetZoom = 1.9;
      targetPan = getTilePan("myth", 10, 1.9);
    } else if (camId === "auto") {
      targetZoom = 1.9;
      targetPan = getTilePan(
        currentPlayer?.currentEra || "spanish",
        currentPlayer?.tileIndex ?? 0,
        1.9
      );
    } else if (camId === "custom") {
      return;
    }

    panRef.current = targetPan;
    zoomRef.current = targetZoom;
    setZoom(targetZoom);
    setPan(targetPan);
    updateTransformDirect(targetPan, targetZoom);
  }, [currentPlayer?.currentEra, currentPlayer?.tileIndex, getTilePan, updateTransformDirect]);

  // Auto-camera tracking: smooth camera follow when player moves or turn changes in Auto mode
  useEffect(() => {
    if (cameraMode === "auto" && currentPlayer) {
      const targetZoom = 1.9;
      const targetPan = getTilePan(
        currentPlayer.currentEra || "spanish",
        currentPlayer.tileIndex ?? 0,
        targetZoom
      );
      panRef.current = targetPan;
      zoomRef.current = targetZoom;
      setZoom(targetZoom);
      setPan(targetPan);
      updateTransformDirect(targetPan, targetZoom);
    }
  }, [
    cameraMode,
    currentPlayer?.id,
    currentPlayer?.currentEra,
    currentPlayer?.tileIndex,
    phase,
    getTilePan,
    updateTransformDirect
  ]);

  // 1. Initial game start: introduce full map for 1.8s, then smoothly transition into Auto Focus
  useEffect(() => {
    if (!currentPlayer) return;

    if (!hasIntroducedRef.current) {
      const introTimer = setTimeout(() => {
        hasIntroducedRef.current = true;
        const turnKey = `${currentPlayer.id}_${currentPlayer.currentEra}_${turnNumber || 0}`;
        prevTurnPlayerKeyRef.current = turnKey;
        setCameraPreset("auto", false);
      }, 1800);
      return () => clearTimeout(introTimer);
    }
  }, [currentPlayer, turnNumber, setCameraPreset]);

  // 2. When a player starts their turn, default to auto focus
  useEffect(() => {
    if (!currentPlayer) return;
    const turnKey = `${currentPlayer.id}_${currentPlayer.currentEra}_${turnNumber || 0}`;
    if (hasIntroducedRef.current && prevTurnPlayerKeyRef.current !== turnKey && phase === "rolling") {
      prevTurnPlayerKeyRef.current = turnKey;
      setCameraPreset("auto", false);
    }
  }, [currentPlayer?.id, currentPlayer?.currentEra, turnNumber, phase, setCameraPreset]);

  // 3. Tapping somewhere on the board resets Free Cam back to Auto Focus
  const handleViewportClick = useCallback((e) => {
    if (hasDraggedRef.current) return;
    if (e?.target?.closest?.('.board-camera-container') || e?.target?.closest?.('.board-zoom-hud')) {
      return;
    }
    if (cameraMode === "custom") {
      setCameraPreset("auto", true);
    }
  }, [cameraMode, setCameraPreset]);

  // Keep camera centered & bounded on window resize and orientation change
  useEffect(() => {
    const handleResize = () => {
      if (cameraMode === "auto" && currentPlayer) {
        const targetPan = getTilePan(
          currentPlayer.currentEra || "spanish",
          currentPlayer.tileIndex ?? 0,
          zoomRef.current
        );
        panRef.current = targetPan;
        setPan(targetPan);
        updateTransformDirect(targetPan, zoomRef.current);
      } else {
        const nextPan = clampPan(panRef.current.x, panRef.current.y, zoomRef.current);
        panRef.current = nextPan;
        setPan(nextPan);
        updateTransformDirect(nextPan, zoomRef.current);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [cameraMode, currentPlayer, getTilePan, clampPan, updateTransformDirect]);

  const handleZoomStep = (delta) => {
    sounds.btnClick();
    setZoom((prev) => {
      const nextZoom = Math.min(3.2, Math.max(0.85, Number((prev + delta).toFixed(2))));
      const nextPan = clampPan(panRef.current.x, panRef.current.y, nextZoom);
      panRef.current = nextPan;
      zoomRef.current = nextZoom;
      setPan(nextPan);
      updateTransformDirect(nextPan, nextZoom);
      return nextZoom;
    });
    setCameraMode("custom");
  };

  const handleResetView = () => {
    sounds.btnClick();
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1.0;
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setCameraMode("full");
    updateTransformDirect({ x: 0, y: 0 }, 1.0);
  };

  // Touch gesture handling (1 finger pan, 2 finger pinch-to-zoom)
  const handleTouchStart = (e) => {
    if (e.target?.closest?.('.board-camera-container') || e.target?.closest?.('.board-zoom-hud')) {
      return;
    }
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
        if (cameraMode !== 'custom') {
          setCameraMode('custom');
        }
        if (e.cancelable) e.preventDefault();
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
      // Commit final position to React state only if user actually dragged
      if (hasDraggedRef.current) {
        setPan({ ...panRef.current });
        setZoom(zoomRef.current);
        setCameraMode('custom');
      }
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 150);
    }
  };

  // Mouse drag handling (Desktop)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target?.closest?.('.board-camera-container') || e.target?.closest?.('.board-zoom-hud')) {
      return;
    }
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
      if (cameraMode !== 'custom') {
        setCameraMode('custom');
      }
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

  // Precompute players by tile key once per render
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
  }, [players, currentPlayer?.tileIndex, currentPlayer?.currentEra]);

  // Precompute reachable target tile using authoritative getNextTileIndex
  const reachableTileKey = useMemo(() => {
    if (pendingChoice?.type === "teleportTile") {
      return "all_" + (pendingChoice.targetEra || "myth");
    }
    if (phase === "moving" && movesRemaining > 0 && currentPlayer) {
      const era = currentPlayer.currentEra;
      const cIdx = currentPlayer.tileIndex;
      const dir = movementDirection === "backward" ? -1 : 1;
      const tiles = board?.[era] || [];
      const target = getNextTileIndex(currentPlayer, era, cIdx, dir, tiles.length);
      if (target !== null && target !== undefined) {
        return `${era}_${target}`;
      }
    }
    return null;
  }, [
    pendingChoice,
    phase,
    movesRemaining,
    currentPlayer?.currentEra,
    currentPlayer?.tileIndex,
    currentPlayer?.previousTileIndex,
    movementDirection,
    board
  ]);

  if (!board || !currentPlayer) return null;

  return (
    <main className="board-container">
      {/* Cinematic Turn Announcement Banner */}
      {turnToast && (
        <div className="board-turn-toast" role="status" aria-live="polite">
          <div className="turn-toast-glow" style={{ background: turnToast.player.color }} />
          <div className="turn-toast-content">
            <img
              src={turnToast.player.role?.avatar || ""}
              alt=""
              className="turn-toast-avatar"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div className="turn-toast-info">
              <div className="turn-toast-era" style={{ color: turnToast.player.color }}>
                {ERA_NAMES[turnToast.era] || turnToast.era}
              </div>
              <div className="turn-toast-title">
                <span style={{ color: turnToast.player.color }}>{turnToast.player.name}</span>'s Turn
              </div>
              <div className="turn-toast-sub">
                {turnToast.player.role?.name || "Operative"} &bull; Phase 1: Roll Movement Die
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Top Camera Controls Dropdown */}
      <div className="board-camera-container" ref={cameraMenuRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {cameraMode === 'custom' && (
            <div
              className="free-cam-badge animate-fade-in"
              title="Free Cam Active. Tap anywhere on the board to refocus on player."
              onClick={(e) => {
                e.stopPropagation();
                setCameraPreset('auto', true);
              }}
              style={{ cursor: 'pointer' }}
            >
              <span>✋ Free Cam</span>
              <span className="free-cam-hint">• Tap to refocus</span>
            </div>
          )}

          <button
            className={`board-cam-dropdown-toggle ${isCameraDropdownOpen ? 'is-open' : ''}`}
            onClick={() => {
              sounds.btnClick();
              setIsCameraDropdownOpen(prev => !prev);
            }}
            title={`Camera Mode: ${currentCamOption?.label || 'Options'}`}
            aria-label="Toggle camera view presets"
          >
            <span className="cam-toggle-icon">📹</span>
            <span className="cam-active-badge">{currentCamOption?.icon || '🎯'}</span>
            <span className="cam-toggle-arrow">{isCameraDropdownOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {isCameraDropdownOpen && (
          <div className="board-cam-dropdown-menu">
            <div className="board-cam-dropdown-header">
              <span className="cam-header-title">CAMERA</span>
              <span className="current-mode-label">
                {hoveredCam ? `${hoveredCam.icon} ${hoveredCam.label}` : `${currentCamOption?.icon || ''} ${currentCamOption?.label || ''}`}
              </span>
            </div>

            <div className="board-cam-icon-palette">
              {CAMERA_OPTIONS.map((cam) => {
                const isActive = cameraMode === cam.id;
                return (
                  <button
                    key={cam.id}
                    className={`board-cam-icon-btn ${isActive ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCameraPreset(cam.id, true);
                      setIsCameraDropdownOpen(false);
                    }}
                    onMouseEnter={() => setHoveredCam(cam)}
                    onMouseLeave={() => setHoveredCam(null)}
                    title={`${cam.label}: ${cam.desc}`}
                    aria-label={cam.label}
                  >
                    <span className="cam-btn-icon">{cam.icon}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CINEMATIC TEMPORAL RIFT SHOCKWAVE ANNOUNCEMENT */}
      {showRiftAnnouncement && (
        <div
          className="temporal-rift-announcement"
          onClick={() => setShowRiftAnnouncement(false)}
          role="dialog"
          aria-label="Temporal Occurrence Event"
        >
          <div className="temporal-rift-backdrop" />
          <div className="temporal-shockwave-ring ring-1" />
          <div className="temporal-shockwave-ring ring-2" />
          <div className="temporal-rift-card" onClick={(e) => e.stopPropagation()}>
            <div className="temporal-rift-header">
              <span className="temporal-rift-bolt">⚡</span>
              <span className="temporal-rift-tag">DIMENSIONAL DISTURBANCE</span>
              <span className="temporal-rift-bolt">⚡</span>
            </div>
            <div className="temporal-rift-title">TEMPORAL OCCURRENCE!</div>
            <div className="temporal-rift-rule" />
            <div className="temporal-rift-desc">
              The fabric of time has fractured across the timeline!
              For the next <strong>{Math.ceil(temporalOccurrence / (players?.length || 4))} rounds</strong>, landing on Clue, Event, or Hazard tiles will draw cards across <strong>RANDOM ERAS</strong>!
            </div>
            <div className="temporal-rift-badge">
              <span>⌛ {temporalOccurrence} TURNS REMAINING</span>
            </div>
            <button
              className="btn btn-primary temporal-rift-dismiss-btn"
              onClick={() => setShowRiftAnnouncement(false)}
            >
              BRACE FOR CHRONO FLUX
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE TEMPORAL OCCURRENCE ATMOSPHERIC OVERLAY & RETRO BRASS PLAQUE */}
      {temporalOccurrence > 0 && (
        <>
          <div className="temporal-occurrence-board-overlay" aria-hidden="true">
            <div className="temporal-vignette-pulse" />
            <div className="temporal-corner-glyph glyph-tl">⏳</div>
            <div className="temporal-corner-glyph glyph-tr">⌛</div>
            <div className="temporal-corner-glyph glyph-bl">⌛</div>
            <div className="temporal-corner-glyph glyph-br">⏳</div>
          </div>

          <div
            className="temporal-occurrence-plaque"
            title="Temporal flux active: Clue, Event, and Hazard cards are drawn from random eras!"
          >
            <div className="temporal-plaque-gear">🌀</div>
            <div className="temporal-plaque-body">
              <div className="temporal-plaque-title-row">
                <span className="temporal-plaque-title">TEMPORAL OCCURRENCE</span>
                <span className="temporal-plaque-rounds">
                  {Math.ceil(temporalOccurrence / (players?.length || 4))} {Math.ceil(temporalOccurrence / (players?.length || 4)) === 1 ? 'ROUND' : 'ROUNDS'} LEFT
                </span>
              </div>
              <div className="temporal-plaque-sub">
                ⚡ Dimensional flux active &bull; Cards drawn across random eras ({temporalOccurrence} turns left)
              </div>
            </div>
          </div>
        </>
      )}

      {/* Interactive Clash-of-Clans Pan & Zoom Viewport */}
      <div
        ref={viewportRef}
        className={`board-viewport ${isDragging ? 'is-dragging' : ''} era-ambient-${currentPlayer?.currentEra || 'spanish'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleDragEnd}
        onTouchCancel={handleDragEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onClick={handleViewportClick}
        onWheel={handleWheel}
      >
        {/* Dynamic Era Vignette Ambiance */}
        <div className={`board-era-vignette era-vignette-${currentPlayer?.currentEra || 'spanish'}`} />

        {/* Ambient Chrono Floating Particles */}
        <div className="chrono-particles-overlay" aria-hidden="true">
          <span className="chrono-mote m1"></span>
          <span className="chrono-mote m2"></span>
          <span className="chrono-mote m3"></span>
          <span className="chrono-mote m4"></span>
          <span className="chrono-mote m5"></span>
          <span className="chrono-mote m6"></span>
        </div>

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
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale3d(${zoom}, ${zoom}, 1)`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
            willChange: isDragging ? 'transform' : 'auto'
          }}
        >
          {/* SVG Path lines connecting circle spaces */}
          <svg className="board-paths-svg" viewBox="0 0 1024 765" preserveAspectRatio="xMidYMid meet">
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
                else if (tileType === "paradox") icon = "🌀";
                else if (tileType === "start") icon = "🚩";

                return (
                  <div
                    key={t.id || tileKey}
                    className={`mario-party-space space-${tileType} ${isReachable ? "reachable-space" : ""} ${playersOnTile.length > 0 ? "has-players" : ""}`}
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                    title={`${(tileType || "").toUpperCase()} (Space #${idx + 1} - ${ERA_NAMES[era] || era})`}
                    onClick={() => {
                      if (!hasDraggedRef.current) {
                        if (cameraMode === "custom") {
                          setCameraPreset("auto");
                        }
                        if (onMoveToTile) {
                          onMoveToTile(t.id);
                        }
                      }
                    }}
                  >
                    {isReachable && <div className="reachable-arrow-indicator">▼</div>}
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
                    {t.trap && (
                      <span
                        className="tile-trap-indicator"
                        title={
                          t.trap.ownerId !== undefined && players?.[t.trap.ownerId]
                            ? `Temporal Trap (Planted by ${players[t.trap.ownerId].name})`
                            : "The Strategist's Temporal Trap!"
                        }
                      >
                        💀
                      </span>
                    )}

                    {tileType === "paradox" && playersOnTile.length > 0 && (
                      <div className="paradox-anomaly-presence" aria-hidden="true">
                        <div className="paradox-anomaly-distortion" />
                        <div className="paradox-anomaly-ring ring-1" />
                        <div className="paradox-anomaly-ring ring-2" />
                        <div className="paradox-anomaly-tag">⚠️ +1 PARADOX</div>
                      </div>
                    )}

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
                              {p.skipNextTurn && <div className="pawn-skip-indicator" title="Turn Skipped">⛔</div>}
                              <div className="pawn-badge" style={{ background: p.color }}>P{(p.id ?? 0) + 1}</div>
                              {p.role?.avatar && <img src={p.role.avatar} className="pawn-sprite" alt={p.name} draggable={false} />}
                              <div className="pawn-pedestal" style={{ background: p.color, boxShadow: `0 0 10px ${p.color}, 0 0 4px #fff` }}>
                                {isPawnTurn && <div className="pawn-pedestal-ring" style={{ borderColor: p.color }} />}
                              </div>
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
