import React, { useState, useRef, useEffect } from 'react';
import sounds from '../sound.js';
import {
  ERAS, ERA_ORDER, ERA_NAMES,
  ERA_TILE_COORDINATES, ERA_TILE_LAYOUTS,
  DEFAULT_ERA_LOOP_TARGETS, getActiveTileCoordinates, getActiveTileLayouts, getActiveLoopTargets,
  saveCustomMap, resetCustomMap
} from '../gameData.js';

const TILE_LABELS = {
  start: 'Start',
  clue: 'Clue',
  event: 'Event',
  danger: 'Danger',
  artifact: 'Artifact',
  timegate: 'Gate',
  paradox: 'Paradox',
  empty: 'Normal'
};

const TILE_ICONS = {
  start: '🚩',
  clue: '🔍',
  event: '⚡',
  danger: '⚠️',
  artifact: '🏆',
  timegate: '🌀',
  paradox: '⏳',
  empty: '•'
};

const ERA_COLORS = {
  spanish: '#E74C3C',
  american: '#3498DB',
  japanese: '#2ECC71',
  myth: '#F39C12'
};

export default function MapEditor({ onClose }) {
  // Deep clone initial coordinates and layouts
  const [coords, setCoords] = useState(() => JSON.parse(JSON.stringify(getActiveTileCoordinates())));
  const [layouts, setLayouts] = useState(() => JSON.parse(JSON.stringify(getActiveTileLayouts())));
  const [loopTargets, setLoopTargets] = useState(() => JSON.parse(JSON.stringify(getActiveLoopTargets())));

  const [activeEra, setActiveEra] = useState('spanish');
  const [selectedTile, setSelectedTile] = useState({ era: 'spanish', index: 0 });
  const [bgMode, setBgMode] = useState('clean'); // 'clean' | 'tiles' | 'grid'
  const [zoom, setZoom] = useState(1);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showIcons, setShowIcons] = useState(true);
  const [showNexusLines, setShowNexusLines] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [clickToAddMode, setClickToAddMode] = useState(false);
  const [clickAddType, setClickAddType] = useState('clue');
  const [showExportModal, setShowExportModal] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  // Responsive drawer & device detection
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [activeSidebarTab, setActiveSidebarTab] = useState('inspector'); // 'inspector' | 'path' | 'settings'

  // Path walking preview state
  const [isPreviewWalking, setIsPreviewWalking] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragTileRef = useRef(null);
  const canvasWrapperRef = useRef(null);

  // Screen resize detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Toast feedback helper
  const triggerToast = (msg, type = 'success') => {
    setSaveToast({ msg, type });
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Node position calculation helper (used by mouse and touch)
  const updateNodePosition = (clientX, clientY) => {
    if (!dragTileRef.current || !canvasWrapperRef.current) return;
    const { era, index } = dragTileRef.current;
    const rect = canvasWrapperRef.current.getBoundingClientRect();

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    x = Math.max(1, Math.min(99, x));
    y = Math.max(1, Math.min(99, y));

    if (snapToGrid) {
      x = Math.round(x * 2) / 2;
      y = Math.round(y * 2) / 2;
    }

    x = parseFloat(x.toFixed(1));
    y = parseFloat(y.toFixed(1));

    setCoords(prev => {
      const next = { ...prev };
      next[era] = [...next[era]];
      next[era][index] = { x, y };
      return next;
    });
  };

  // Drag start (mouse & touch)
  const handleNodeStart = (e, era, index) => {
    e.stopPropagation();
    sounds.btnClick();
    setSelectedTile({ era, index });
    setActiveEra(era);
    setIsDragging(true);
    dragTileRef.current = { era, index };
  };

  // Mouse & Touch global drag listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragTileRef.current) return;
      updateNodePosition(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (dragTileRef.current) {
        dragTileRef.current = null;
        setIsDragging(false);
      }
    };

    const handleTouchMove = (e) => {
      if (!dragTileRef.current) return;
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        updateNodePosition(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      if (dragTileRef.current) {
        dragTileRef.current = null;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [snapToGrid]);

  // Click on canvas to add tile
  const handleCanvasClick = (e) => {
    if (!clickToAddMode || !canvasWrapperRef.current) return;
    const rect = canvasWrapperRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = parseFloat(Math.max(1, Math.min(99, x)).toFixed(1));
    y = parseFloat(Math.max(1, Math.min(99, y)).toFixed(1));

    const targetEra = activeEra === 'all' ? 'spanish' : activeEra;
    sounds.btnClick();

    setCoords(prev => {
      const next = { ...prev };
      next[targetEra] = [...next[targetEra], { x, y }];
      return next;
    });

    setLayouts(prev => {
      const next = { ...prev };
      next[targetEra] = [...next[targetEra], clickAddType];
      return next;
    });

    const newIdx = (coords[targetEra] || []).length;
    setSelectedTile({ era: targetEra, index: newIdx });
    triggerToast(`Added ${clickAddType.toUpperCase()} tile #${newIdx + 1} to ${ERA_NAMES[targetEra]}`, 'info');
  };

  // Fine-tuning position step
  const stepPosition = (axis, delta) => {
    if (!selectedTile) return;
    const { era, index } = selectedTile;
    const current = coords[era][index];
    if (!current) return;

    let val = parseFloat((current[axis] + delta).toFixed(1));
    val = Math.max(0.5, Math.min(99.5, val));

    setCoords(prev => {
      const next = { ...prev };
      next[era] = [...next[era]];
      next[era][index] = { ...current, [axis]: val };
      return next;
    });
  };

  // Change Tile Type
  const changeTileType = (newType) => {
    if (!selectedTile) return;
    sounds.btnClick();
    const { era, index } = selectedTile;
    setLayouts(prev => {
      const next = { ...prev };
      next[era] = [...next[era]];
      next[era][index] = newType;
      return next;
    });
  };

  // Move Tile Earlier in Path Order
  const moveTileOrder = (direction) => {
    if (!selectedTile) return;
    sounds.btnClick();
    const { era, index } = selectedTile;
    const targetIdx = index + direction;
    const eraCoords = coords[era];

    if (targetIdx < 0 || targetIdx >= eraCoords.length) return;

    setCoords(prev => {
      const next = { ...prev };
      const arr = [...next[era]];
      const temp = arr[index];
      arr[index] = arr[targetIdx];
      arr[targetIdx] = temp;
      next[era] = arr;
      return next;
    });

    setLayouts(prev => {
      const next = { ...prev };
      const arr = [...next[era]];
      const temp = arr[index];
      arr[index] = arr[targetIdx];
      arr[targetIdx] = temp;
      next[era] = arr;
      return next;
    });

    setSelectedTile({ era, index: targetIdx });
  };

  // Insert Tile After Current
  const insertTileAfter = () => {
    if (!selectedTile) return;
    sounds.btnClick();
    const { era, index } = selectedTile;
    const cur = coords[era][index];
    const nextIdx = (index + 1) % coords[era].length;
    const nxt = coords[era][nextIdx];

    const midX = parseFloat(((cur.x + nxt.x) / 2).toFixed(1));
    const midY = parseFloat(((cur.y + nxt.y) / 2).toFixed(1));

    setCoords(prev => {
      const next = { ...prev };
      const arr = [...next[era]];
      arr.splice(index + 1, 0, { x: midX, y: midY });
      next[era] = arr;
      return next;
    });

    setLayouts(prev => {
      const next = { ...prev };
      const arr = [...next[era]];
      arr.splice(index + 1, 0, 'empty');
      next[era] = arr;
      return next;
    });

    setSelectedTile({ era, index: index + 1 });
    triggerToast(`Inserted new space at position #${index + 2}`, 'info');
  };

  // Delete Selected Tile
  const deleteTile = () => {
    if (!selectedTile) return;
    const { era, index } = selectedTile;
    if (coords[era].length <= 3) {
      alert('An era requires at least 3 tiles to form a valid path loop.');
      return;
    }

    sounds.btnClick();
    setCoords(prev => {
      const next = { ...prev };
      const arr = [...next[era]];
      arr.splice(index, 1);
      next[era] = arr;
      return next;
    });

    setLayouts(prev => {
      const next = { ...prev };
      const arr = [...next[era]];
      arr.splice(index, 1);
      next[era] = arr;
      return next;
    });

    const newIndex = Math.max(0, index - 1);
    setSelectedTile({ era, index: newIndex });
    triggerToast(`Deleted tile #${index + 1}`, 'warning');
  };

  // Reverse Era Path Direction
  const reversePathDirection = () => {
    if (activeEra === 'all') return;
    sounds.portal();
    setCoords(prev => {
      const next = { ...prev };
      next[activeEra] = [...next[activeEra]].reverse();
      return next;
    });
    setLayouts(prev => {
      const next = { ...prev };
      next[activeEra] = [...next[activeEra]].reverse();
      return next;
    });
    triggerToast(`Reversed path traversal direction for ${ERA_NAMES[activeEra]}`, 'info');
  };

  // Set Loop Target for Era (e.g. Tile 25 loops back to Tile 15 in Spanish Era)
  const handleSetLoopTarget = (era, targetIndex) => {
    sounds.btnClick();
    setLoopTargets(prev => ({
      ...prev,
      [era]: targetIndex
    }));
    const total = coords[era]?.length || 0;
    triggerToast(`Connected ${ERA_NAMES[era]} End (Tile #${total}) to Tile #${targetIndex + 1}!`);
  };

  // Save to LocalStorage
  const handleSaveToGame = () => {
    sounds.btnClick();
    const ok = saveCustomMap(coords, layouts, loopTargets);
    if (ok) {
      triggerToast('💾 Custom Map saved! Game is now using these coordinates.');
    } else {
      triggerToast('Failed to save to localStorage', 'danger');
    }
  };

  // Reset
  const handleResetDefaults = () => {
    if (confirm('Reset all tile positions and layouts back to original defaults?')) {
      sounds.portal();
      resetCustomMap();
      setCoords(JSON.parse(JSON.stringify(ERA_TILE_COORDINATES)));
      setLayouts(JSON.parse(JSON.stringify(ERA_TILE_LAYOUTS)));
      setLoopTargets(JSON.parse(JSON.stringify(DEFAULT_ERA_LOOP_TARGETS)));
      triggerToast('Map reset to factory defaults.');
    }
  };

  // Path walking simulation preview
  useEffect(() => {
    if (!isPreviewWalking) return;
    const curEra = activeEra === 'all' ? 'spanish' : activeEra;
    const max = coords[curEra]?.length || 1;
    const loopTarget = loopTargets[curEra] !== undefined ? loopTargets[curEra] : (curEra === 'spanish' ? 14 : 0);

    const timer = setInterval(() => {
      setPreviewStep(prev => {
        if (prev >= max - 1) return loopTarget;
        return prev + 1;
      });
      sounds.moveStep();
    }, 450);

    return () => clearInterval(timer);
  }, [isPreviewWalking, activeEra, coords, loopTargets]);

  // Selected tile details
  const curTileCoords = selectedTile ? coords[selectedTile.era]?.[selectedTile.index] : null;
  const curTileType = selectedTile ? layouts[selectedTile.era]?.[selectedTile.index] : null;

  // Generate JS code for export
  const generateExportCode = () => {
    return [
      '// ==========================================',
      '// EXPORTED PANAHON MAP COORDINATES & LAYOUTS',
      '// ==========================================',
      '',
      'export const ERA_TILE_LAYOUTS = ' + JSON.stringify(layouts, null, 2) + ';',
      '',
      'export const ERA_TILE_COORDINATES = ' + JSON.stringify(coords, null, 2) + ';',
      '',
      'export const DEFAULT_ERA_LOOP_TARGETS = ' + JSON.stringify(loopTargets, null, 2) + ';',
      ''
    ].join('\n');
  };

  return (
    <div className="map-editor-screen">
      {/* RESPONSIVE HEADER */}
      <header className="map-editor-header">
        {/* Left: Title & Era Chips */}
        <div className="map-editor-header-left">
          <div className="map-editor-title">
            <span>🗺️</span>
            <span className="title-text">MAP EDITOR</span>
          </div>

          {/* Era Filter Chips */}
          <div className="map-editor-era-scroll">
            <button
              className={`era-chip ${activeEra === 'all' ? 'active' : ''}`}
              onClick={() => { sounds.btnClick(); setActiveEra('all'); }}
            >
              All
            </button>
            {ERA_ORDER.map(era => (
              <button
                key={era}
                className={`era-chip ${activeEra === era ? 'active' : ''}`}
                style={{
                  borderBottom: activeEra === era ? `3px solid ${ERA_COLORS[era]}` : 'none'
                }}
                onClick={() => {
                  sounds.btnClick();
                  setActiveEra(era);
                  setSelectedTile({ era, index: 0 });
                }}
              >
                {ERA_NAMES[era].replace(' Era', '')} ({coords[era]?.length || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions Toolbar */}
        <div className="map-editor-header-actions">
          {/* Background switcher */}
          <select
            className="editor-select-sm"
            value={bgMode}
            onChange={(e) => setBgMode(e.target.value)}
            title="Map Background Mode"
          >
            <option value="clean">Clean Art</option>
            <option value="tiles">Reference Art</option>
            <option value="grid">Grid</option>
          </select>

          {/* Zoom controls */}
          <div className="editor-zoom-group">
            <button className="editor-btn-sm" onClick={() => setZoom(prev => Math.max(0.7, prev - 0.15))}>-</button>
            <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
            <button className="editor-btn-sm" onClick={() => setZoom(prev => Math.min(2.2, prev + 0.15))}>+</button>
          </div>

          {/* Walk simulation button */}
          <button
            className={`editor-btn-sm ${isPreviewWalking ? 'active-accent' : ''}`}
            onClick={() => setIsPreviewWalking(!isPreviewWalking)}
            title="Walk Path Preview"
          >
            {isPreviewWalking ? '⏹️' : '🚶'} <span className="hide-xs">Walk</span>
          </button>

          {/* Inspector Panel Toggle Button */}
          <button
            className={`editor-btn-sm ${sidebarOpen ? 'active-panel' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Inspector Panel"
          >
            📐 <span className="hide-xs">Panel</span>
          </button>

          {/* Export Code */}
          <button
            className="editor-btn-sm"
            onClick={() => setShowExportModal(true)}
            title="Export Code"
          >
            📋 <span className="hide-xs">Export</span>
          </button>

          {/* Save & Apply */}
          <button
            className="editor-btn-sm primary-save"
            onClick={handleSaveToGame}
            title="Save and Apply to Game"
          >
            💾 <span className="hide-xs">Save</span>
          </button>

          {/* Close */}
          <button
            className="editor-btn-sm close-btn"
            onClick={onClose}
            title="Exit Map Editor"
          >
            ✖
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="map-editor-layout">
        {/* CANVAS WORKSPACE */}
        <div className="map-editor-canvas-area">
          {saveToast && (
            <div className={`map-editor-toast toast-${saveToast.type}`}>
              {saveToast.msg}
            </div>
          )}

          <div
            ref={canvasWrapperRef}
            className={`map-editor-canvas-wrapper bg-${bgMode}`}
            style={{
              transform: `scale(${zoom})`,
              cursor: clickToAddMode ? 'crosshair' : (isDragging ? 'grabbing' : 'default')
            }}
            onClick={handleCanvasClick}
          >
            {/* SVG PATHS */}
            <svg className="editor-paths-svg" viewBox="0 0 1024 765" preserveAspectRatio="none">
              {ERA_ORDER.map(era => {
                const eraCoords = coords[era];
                if (!eraCoords || eraCoords.length === 0) return null;
                const isSelectedEra = activeEra === era || activeEra === 'all';
                const opacity = isSelectedEra ? 1 : 0.25;

                const targetIdx = loopTargets[era] !== undefined ? loopTargets[era] : (era === 'spanish' ? 14 : 0);
                const targetCoord = eraCoords[targetIdx];
                let pathData = eraCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${(c.x * 1024) / 100} ${(c.y * 765) / 100}`).join(' ');
                if (targetIdx === 0) {
                  pathData += ' Z';
                } else if (targetCoord) {
                  pathData += ` L ${(targetCoord.x * 1024) / 100} ${(targetCoord.y * 765) / 100}`;
                }

                return (
                  <path
                    key={era}
                    d={pathData}
                    className={`editor-path-line ${activeEra === era ? 'active-era' : ''}`}
                    style={{
                      stroke: ERA_COLORS[era],
                      opacity,
                      strokeWidth: activeEra === era ? 3.5 : 2
                    }}
                  />
                );
              })}

              {/* Timegate connectors to Nexus Dial Center (50%, 49%) */}
              {showNexusLines && ERA_ORDER.map(era => {
                const tgIdx = layouts[era]?.indexOf('timegate');
                if (tgIdx === -1 || !coords[era]?.[tgIdx]) return null;
                const c = coords[era][tgIdx];
                return (
                  <path
                    key={era + '-nexus'}
                    d={`M ${(c.x * 1024) / 100} ${(c.y * 765) / 100} L ${1024 * 0.50} ${765 * 0.49}`}
                    style={{ stroke: '#00E5FF', strokeWidth: 2.5, strokeDasharray: '4 4', opacity: 0.8 }}
                  />
                );
              })}
            </svg>

            {/* Central Nexus Dial Marker */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '49%',
                transform: 'translate(-50%, -50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '2px dashed #00E5FF',
                background: 'rgba(0, 229, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                pointerEvents: 'none',
                zIndex: 4
              }}
              title="Central Nexus Portal Dial (50%, 49%)"
            >
              🌀
            </div>

            {/* INTERACTIVE NODES */}
            {ERA_ORDER.map(era => {
              const eraCoords = coords[era] || [];
              const eraLayout = layouts[era] || [];
              const isSelectedEra = activeEra === era || activeEra === 'all';
              if (!isSelectedEra && activeEra !== 'all') return null;

              return eraCoords.map((c, idx) => {
                const isSelected = selectedTile?.era === era && selectedTile?.index === idx;
                const isPawnHere = isPreviewWalking && (activeEra === 'all' || activeEra === era) && previewStep === idx;
                const tileType = eraLayout[idx] || 'empty';
                const icon = TILE_ICONS[tileType] || '•';

                return (
                  <div
                    key={`${era}_${idx}`}
                    className={`editor-node space-${tileType} ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${c.x}%`,
                      top: `${c.y}%`,
                      background: isSelected ? 'rgba(250, 204, 21, 0.35)' : 'rgba(15, 23, 42, 0.85)',
                      borderColor: isSelected ? '#FACC15' : ERA_COLORS[era],
                      touchAction: 'none'
                    }}
                    onMouseDown={(e) => handleNodeStart(e, era, idx)}
                    onTouchStart={(e) => handleNodeStart(e, era, idx)}
                  >
                    {showNumbers && (
                      <span className="editor-node-num" style={{ background: ERA_COLORS[era] }}>
                        {idx + 1}
                      </span>
                    )}

                    {showIcons && (
                      <span className="editor-node-icon">{icon}</span>
                    )}

                    {/* Loop Destination Marker Badge */}
                    {loopTargets[era] === idx && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-9px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.58rem',
                          background: '#10B981',
                          color: '#fff',
                          padding: '0 4px',
                          borderRadius: '6px',
                          lineHeight: '12px',
                          fontWeight: 800,
                          boxShadow: '0 0 6px rgba(16, 185, 129, 0.8)',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          zIndex: 20
                        }}
                        title="Loop Destination Space"
                      >
                        🔁 Loop
                      </span>
                    )}

                    {/* Test Walker Pawn */}
                    {isPawnHere && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-24px',
                          fontSize: '1.4rem',
                          filter: 'drop-shadow(0 0 8px #FACC15)',
                          animation: 'pawnHop 0.4s infinite alternate',
                          pointerEvents: 'none',
                          zIndex: 35
                        }}
                      >
                        🚶
                      </div>
                    )}
                  </div>
                );
              });
            })}
          </div>

          {/* FLOATING MOBILE MINI DOCK (when sidebar is minimized on small screens) */}
          {isMobile && !sidebarOpen && selectedTile && curTileCoords && (
            <div className="editor-mobile-dock">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{TILE_ICONS[curTileType] || '•'}</span>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: ERA_COLORS[selectedTile.era] }}>
                    #{selectedTile.index + 1} ({curTileType.toUpperCase()})
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    X:{curTileCoords.x}% Y:{curTileCoords.y}%
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="editor-btn-sm" onClick={() => stepPosition('x', -0.5)}>←</button>
                <button className="editor-btn-sm" onClick={() => stepPosition('x', 0.5)}>→</button>
                <button className="editor-btn-sm" onClick={() => stepPosition('y', -0.5)}>↑</button>
                <button className="editor-btn-sm" onClick={() => stepPosition('y', 0.5)}>↓</button>
                <button
                  className="editor-btn-sm active-panel"
                  onClick={() => setSidebarOpen(true)}
                  style={{ marginLeft: '4px' }}
                >
                  📐 Edit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR / DRAWER */}
        {sidebarOpen && (
          <aside className={`map-editor-sidebar ${isMobile ? 'mobile-drawer' : ''}`}>
            {/* Mobile Drawer Header */}
            {isMobile && (
              <div className="mobile-drawer-header">
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-accent)' }}>
                  📐 MAP CONTROLS
                </div>
                <button className="editor-btn-sm" onClick={() => setSidebarOpen(false)}>✖ Close</button>
              </div>
            )}

            {/* Click-to-Add Mode Toggle (Ultra-compact) */}
            <div className="editor-panel-section" style={{ padding: '6px 8px', background: clickToAddMode ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255,255,255,0.03)', borderColor: clickToAddMode ? '#3B82F6' : 'rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: clickToAddMode ? '#60A5FA' : 'var(--text-primary)' }}>
                  ➕ Click-to-Add Mode
                </span>
                <input
                  type="checkbox"
                  checked={clickToAddMode}
                  onChange={(e) => setClickToAddMode(e.target.checked)}
                  style={{ cursor: 'pointer', transform: 'scale(1.1)', margin: 0 }}
                />
              </div>
              {clickToAddMode && (
                <div style={{ marginTop: '4px' }}>
                  <select
                    className="input-field"
                    style={{ width: '100%', padding: '3px 6px', fontSize: '0.72rem', height: '26px' }}
                    value={clickAddType}
                    onChange={(e) => setClickAddType(e.target.value)}
                  >
                    {Object.keys(TILE_ICONS).map(t => (
                      <option key={t} value={t}>{TILE_ICONS[t]} {t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* SELECTED NODE INSPECTOR */}
            {selectedTile && curTileCoords ? (
              <div className="editor-panel-section" style={{ padding: '6px 8px', borderLeft: `3px solid ${ERA_COLORS[selectedTile.era]}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: ERA_COLORS[selectedTile.era], fontWeight: 800 }}>
                      {ERA_NAMES[selectedTile.era]}
                    </span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                      Tile #{selectedTile.index + 1} of {coords[selectedTile.era]?.length}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>
                    {TILE_ICONS[curTileType] || '•'}
                  </div>
                </div>

                {/* Tile Type Selector (Ultra-compact 4x2 grid of icon buttons) */}
                <div style={{ marginTop: '5px' }}>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>Tile Type:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px' }}>
                    {Object.keys(TILE_ICONS).map(t => (
                      <button
                        key={t}
                        className={`sidebar-btn ${curTileType === t ? 'active' : ''}`}
                        style={{ height: '32px', padding: '2px 1px', flexDirection: 'column', gap: '1px' }}
                        onClick={() => changeTileType(t)}
                        title={t.toUpperCase()}
                      >
                        <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>{TILE_ICONS[t]}</span>
                        <span style={{ fontSize: '0.54rem', lineHeight: 1, textTransform: 'capitalize' }}>{TILE_LABELS[t] || t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exact Coordinates with Stepper Buttons */}
                <div style={{ marginTop: '6px' }}>
                  <div className="editor-coord-row" style={{ marginTop: '2px' }}>
                    <span style={{ width: '48px', fontSize: '0.7rem', fontWeight: 700, color: '#60A5FA' }}>X: {curTileCoords.x}%</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button className="coord-stepper-btn" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }} onClick={() => stepPosition('x', -1.0)} title="-1.0%">«</button>
                      <button className="coord-stepper-btn" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }} onClick={() => stepPosition('x', -0.1)} title="-0.1%">‹</button>
                      <button className="coord-stepper-btn" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }} onClick={() => stepPosition('x', 0.1)} title="+0.1%">›</button>
                      <button className="coord-stepper-btn" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }} onClick={() => stepPosition('x', 1.0)} title="+1.0%">»</button>
                    </div>
                  </div>

                  <div className="editor-coord-row" style={{ marginTop: '2px' }}>
                    <span style={{ width: '48px', fontSize: '0.7rem', fontWeight: 700, color: '#34D399' }}>Y: {curTileCoords.y}%</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button className="coord-stepper-btn" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }} onClick={() => stepPosition('y', -1.0)} title="-1.0%">«</button>
                      <button className="coord-stepper-btn" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }} onClick={() => stepPosition('y', -0.1)} title="-0.1%">‹</button>
                      <button className="coord-stepper-btn" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }} onClick={() => stepPosition('y', 0.1)} title="+0.1%">›</button>
                      <button className="coord-stepper-btn" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }} onClick={() => stepPosition('y', 1.0)} title="+1.0%">»</button>
                    </div>
                  </div>
                </div>

                {/* Path Order & Actions (2x2 grid) */}
                <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <button
                      className="sidebar-btn"
                      disabled={selectedTile.index === 0}
                      onClick={() => moveTileOrder(-1)}
                      style={{ height: '26px' }}
                    >
                      ⬆️ Earlier
                    </button>
                    <button
                      className="sidebar-btn"
                      disabled={selectedTile.index >= coords[selectedTile.era].length - 1}
                      onClick={() => moveTileOrder(1)}
                      style={{ height: '26px' }}
                    >
                      ⬇️ Later
                    </button>
                    <button
                      className="sidebar-btn"
                      onClick={insertTileAfter}
                      style={{ height: '26px' }}
                    >
                      ➕ Insert
                    </button>
                    <button
                      className="sidebar-btn danger"
                      onClick={deleteTile}
                      style={{ height: '26px' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  {/* Connect Era End to this Space button */}
                  <button
                    className="sidebar-btn"
                    style={{
                      height: '24px',
                      fontSize: '0.66rem',
                      marginTop: '4px',
                      background: loopTargets[selectedTile.era] === selectedTile.index ? 'rgba(16, 185, 129, 0.28)' : 'rgba(255,255,255,0.06)',
                      borderColor: loopTargets[selectedTile.era] === selectedTile.index ? '#10B981' : 'rgba(255,255,255,0.18)',
                      color: loopTargets[selectedTile.era] === selectedTile.index ? '#34D399' : '#fff'
                    }}
                    onClick={() => handleSetLoopTarget(selectedTile.era, selectedTile.index)}
                    title={`Set Tile #${selectedTile.index + 1} as the loop destination for the final space (#${coords[selectedTile.era]?.length})`}
                  >
                    {loopTargets[selectedTile.era] === selectedTile.index
                      ? `✓ Loop Target: Tile #${selectedTile.index + 1}`
                      : `🔗 Connect End to Tile #${selectedTile.index + 1}`}
                  </button>
                </div>
              </div>
            ) : (
              <div className="editor-panel-section" style={{ textAlign: 'center', padding: '12px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Select a tile to inspect.
              </div>
            )}

            {/* Pathing & Toggles */}
            <div className="editor-panel-section" style={{ padding: '6px 8px' }}>
              <button
                className="sidebar-btn"
                style={{ width: '100%', marginBottom: '5px', height: '25px', fontSize: '0.68rem' }}
                disabled={activeEra === 'all'}
                onClick={reversePathDirection}
              >
                🔄 Reverse Era Path
              </button>

              {/* Era Loop Target selector */}
              {(() => {
                const targetEra = activeEra === 'all' ? (selectedTile ? selectedTile.era : 'spanish') : activeEra;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      🔁 Loop End to:
                    </span>
                    <select
                      className="input-field"
                      style={{ padding: '1px 4px', fontSize: '0.66rem', height: '23px', flex: 1, minWidth: 0 }}
                      value={loopTargets[targetEra] ?? (targetEra === 'spanish' ? 14 : 0)}
                      onChange={(e) => handleSetLoopTarget(targetEra, parseInt(e.target.value, 10))}
                    >
                      {(coords[targetEra] || []).map((_, i) => (
                        <option key={i} value={i}>
                          Tile #{i + 1} {layouts[targetEra]?.[i] ? `(${layouts[targetEra][i]})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              <div className="editor-checkbox-grid">
                <label className="editor-checkbox-item">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                  />
                  <span>0.5% Snap</span>
                </label>

                <label className="editor-checkbox-item">
                  <input
                    type="checkbox"
                    checked={showNumbers}
                    onChange={(e) => setShowNumbers(e.target.checked)}
                  />
                  <span>Numbers</span>
                </label>

                <label className="editor-checkbox-item">
                  <input
                    type="checkbox"
                    checked={showIcons}
                    onChange={(e) => setShowIcons(e.target.checked)}
                  />
                  <span>Icons</span>
                </label>

                <label className="editor-checkbox-item">
                  <input
                    type="checkbox"
                    checked={showNexusLines}
                    onChange={(e) => setShowNexusLines(e.target.checked)}
                  />
                  <span>Nexus Lines</span>
                </label>
              </div>
            </div>

            {/* Reset button docked at bottom */}
            <div style={{ marginTop: 'auto' }}>
              <button
                className="sidebar-btn danger"
                style={{ width: '100%', height: '26px' }}
                onClick={handleResetDefaults}
              >
                🔄 Reset Factory Defaults
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* EXPORT CODE MODAL */}
      {showExportModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal" style={{ maxWidth: '680px', width: '92%' }}>
            <button className="modal-close" onClick={() => setShowExportModal(false)}>&times;</button>
            <div className="modal-title">📋 Export JavaScript Code</div>
            <div className="modal-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Copy and paste this code directly into <code>src/gameData.js</code> to make your new coordinates and path layouts permanent!
              </p>
              <textarea
                className="input-field"
                rows={16}
                readOnly
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
                value={generateExportCode()}
              />
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>Close</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  sounds.btnClick();
                  navigator.clipboard.writeText(generateExportCode());
                  triggerToast('Copied code to clipboard!');
                  setShowExportModal(false);
                }}
              >
                📋 Copy Code to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
