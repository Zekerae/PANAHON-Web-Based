import React, { useState, useRef, useEffect } from 'react';
import sounds from '../sound.js';
import {
  ERAS, ERA_ORDER, ERA_NAMES,
  ERA_TILE_COORDINATES, ERA_TILE_LAYOUTS,
  getActiveTileCoordinates, getActiveTileLayouts,
  saveCustomMap, resetCustomMap
} from '../gameData.js';

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

  // Path walking preview state
  const [isPreviewWalking, setIsPreviewWalking] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragTileRef = useRef(null);
  const canvasWrapperRef = useRef(null);

  // Toast feedback helper
  const triggerToast = (msg, type = 'success') => {
    setSaveToast({ msg, type });
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Drag & drop logic
  const handleNodeMouseDown = (e, era, index) => {
    e.stopPropagation();
    sounds.btnClick();
    setSelectedTile({ era, index });
    setActiveEra(era);
    setIsDragging(true);
    dragTileRef.current = { era, index };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragTileRef.current || !canvasWrapperRef.current) return;
      const { era, index } = dragTileRef.current;
      const rect = canvasWrapperRef.current.getBoundingClientRect();

      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;

      // Clamp
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

    const handleMouseUp = () => {
      if (dragTileRef.current) {
        dragTileRef.current = null;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
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

  // Save to LocalStorage
  const handleSaveToGame = () => {
    sounds.btnClick();
    const ok = saveCustomMap(coords, layouts);
    if (ok) {
      triggerToast('💾 Custom Map successfully saved! Game will now use these coordinates.');
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
      triggerToast('Map reset to factory defaults.');
    }
  };

  // Path walking simulation preview
  useEffect(() => {
    if (!isPreviewWalking) return;
    const curEra = activeEra === 'all' ? 'spanish' : activeEra;
    const max = coords[curEra]?.length || 1;

    const timer = setInterval(() => {
      setPreviewStep(prev => (prev + 1) % max);
      sounds.moveStep();
    }, 450);

    return () => clearInterval(timer);
  }, [isPreviewWalking, activeEra, coords]);

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
      ''
    ].join('\n');
  };

  return (
    <div className="map-editor-screen">
      {/* HEADER / TOOLBAR */}
      <header className="map-editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="map-editor-title">
            <span>🗺️</span>
            <span>CHRONO MAP & PATH EDITOR</span>
          </div>

          {/* Era Filter Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '2px', borderRadius: '6px' }}>
            <button
              className={`btn ${activeEra === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
              onClick={() => { sounds.btnClick(); setActiveEra('all'); }}
            >
              All Eras
            </button>
            {ERA_ORDER.map(era => (
              <button
                key={era}
                className={`btn ${activeEra === era ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  borderBottom: activeEra === era ? `2px solid ${ERA_COLORS[era]}` : 'none'
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

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Background Toggle */}
          <select
            className="input-field"
            style={{ padding: '4px 8px', fontSize: '0.72rem', background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            value={bgMode}
            onChange={(e) => setBgMode(e.target.value)}
          >
            <option value="clean">Clean Map Art</option>
            <option value="tiles">Reference Tile Art</option>
            <option value="grid">Dark Blueprint Grid</option>
          </select>

          {/* Zoom Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => setZoom(prev => Math.max(0.8, prev - 0.2))}>-</button>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => setZoom(prev => Math.min(2.0, prev + 0.2))}>+</button>
          </div>

          {/* Test Walk Button */}
          <button
            className={`btn ${isPreviewWalking ? 'btn-accent' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
            onClick={() => setIsPreviewWalking(!isPreviewWalking)}
          >
            {isPreviewWalking ? '⏹️ Stop Walk' : '🚶 Test Path'}
          </button>

          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.72rem' }} onClick={() => setShowExportModal(true)}>
            📋 Export Code
          </button>

          <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700 }} onClick={handleSaveToGame}>
            💾 Save & Apply
          </button>

          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={onClose}>
            ✖ Close
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="map-editor-layout">
        {/* CANVAS WORKSPACE */}
        <div className="map-editor-canvas-area">
          {saveToast && (
            <div
              style={{
                position: 'absolute',
                top: '15px',
                zIndex: 100,
                background: saveToast.type === 'danger' ? 'rgba(239, 68, 68, 0.9)' : (saveToast.type === 'warning' ? 'rgba(234, 179, 8, 0.9)' : 'rgba(16, 185, 129, 0.9)'),
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                animation: 'toastIn 0.2s ease-out'
              }}
            >
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
              <defs>
                <marker id="arrow-head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.7)" />
                </marker>
              </defs>

              {/* Path lines for each era */}
              {ERA_ORDER.map(era => {
                const eraCoords = coords[era];
                if (!eraCoords || eraCoords.length === 0) return null;
                const isSelectedEra = activeEra === era || activeEra === 'all';
                const opacity = isSelectedEra ? 1 : 0.25;

                const pathData = eraCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${(c.x * 1024) / 100} ${(c.y * 765) / 100}`).join(' ') + ' Z';

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
                      borderColor: isSelected ? '#FACC15' : ERA_COLORS[era]
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, era, idx)}
                  >
                    {showNumbers && (
                      <span className="editor-node-num" style={{ background: ERA_COLORS[era] }}>
                        {idx + 1}
                      </span>
                    )}

                    {showIcons && (
                      <span className="editor-node-icon">{icon}</span>
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
        </div>

        {/* SIDEBAR: INSPECTOR & CONTROLS */}
        <aside className="map-editor-sidebar">
          {/* Quick Click-to-Add Mode Toggle */}
          <div className="editor-panel-section" style={{ background: clickToAddMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.03)', borderColor: clickToAddMode ? '#3B82F6' : 'rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: clickToAddMode ? '#60A5FA' : 'var(--text-primary)' }}>
                ➕ Click-to-Add Tile Mode
              </span>
              <input
                type="checkbox"
                checked={clickToAddMode}
                onChange={(e) => setClickToAddMode(e.target.checked)}
                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
              />
            </div>
            {clickToAddMode && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Click anywhere on the map to add this tile type:
                </div>
                <select
                  className="input-field"
                  style={{ width: '100%', padding: '4px', fontSize: '0.75rem' }}
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
            <div className="editor-panel-section" style={{ borderLeft: `4px solid ${ERA_COLORS[selectedTile.era]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: ERA_COLORS[selectedTile.era], fontWeight: 800 }}>
                    {ERA_NAMES[selectedTile.era]}
                  </span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    Tile #{selectedTile.index + 1} of {coords[selectedTile.era]?.length}
                  </div>
                </div>
                <div style={{ fontSize: '1.6rem' }}>
                  {TILE_ICONS[curTileType] || '•'}
                </div>
              </div>

              {/* Tile Type Selector */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Tile Type:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '4px' }}>
                  {Object.keys(TILE_ICONS).map(t => (
                    <button
                      key={t}
                      className={`btn ${curTileType === t ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 2px', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}
                      onClick={() => changeTileType(t)}
                    >
                      <span>{TILE_ICONS[t]}</span>
                      <span style={{ fontSize: '0.58rem', textTransform: 'capitalize' }}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Coordinates with Stepper Buttons */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Tile Position (% of map):
                </div>

                <div className="editor-coord-row">
                  <span style={{ width: '45px', fontSize: '0.75rem', fontWeight: 700, color: '#60A5FA' }}>X: {curTileCoords.x}%</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="coord-stepper-btn" onClick={() => stepPosition('x', -1.0)} title="-1.0%">«</button>
                    <button className="coord-stepper-btn" onClick={() => stepPosition('x', -0.1)} title="-0.1%">‹</button>
                    <button className="coord-stepper-btn" onClick={() => stepPosition('x', 0.1)} title="+0.1%">›</button>
                    <button className="coord-stepper-btn" onClick={() => stepPosition('x', 1.0)} title="+1.0%">»</button>
                  </div>
                </div>

                <div className="editor-coord-row">
                  <span style={{ width: '45px', fontSize: '0.75rem', fontWeight: 700, color: '#34D399' }}>Y: {curTileCoords.y}%</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="coord-stepper-btn" onClick={() => stepPosition('y', -1.0)} title="-1.0%">«</button>
                    <button className="coord-stepper-btn" onClick={() => stepPosition('y', -0.1)} title="-0.1%">‹</button>
                    <button className="coord-stepper-btn" onClick={() => stepPosition('y', 0.1)} title="+0.1%">›</button>
                    <button className="coord-stepper-btn" onClick={() => stepPosition('y', 1.0)} title="+1.0%">»</button>
                  </div>
                </div>
              </div>

              {/* Path Order Sequencing */}
              <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Path Sequencing & Traversal:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px', fontSize: '0.7rem' }}
                    disabled={selectedTile.index === 0}
                    onClick={() => moveTileOrder(-1)}
                  >
                    ⬆️ Move Earlier
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px', fontSize: '0.7rem' }}
                    disabled={selectedTile.index >= coords[selectedTile.era].length - 1}
                    onClick={() => moveTileOrder(1)}
                  >
                    ⬇️ Move Later
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px', fontSize: '0.7rem' }}
                    onClick={insertTileAfter}
                  >
                    ➕ Insert After
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px', fontSize: '0.7rem' }}
                    onClick={deleteTile}
                  >
                    🗑️ Delete Tile
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="editor-panel-section" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Select any tile on the map to inspect, edit its position, or change its type.
            </div>
          )}

          {/* Global Era Controls */}
          <div className="editor-panel-section">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-accent)', marginBottom: '8px' }}>
              Pathing & Settings
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', padding: '6px', fontSize: '0.72rem' }}
                disabled={activeEra === 'all'}
                onClick={reversePathDirection}
              >
                🔄 Reverse Era Path Direction
              </button>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                />
                <span>Snap to 0.5% Grid on Drag</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showNumbers}
                  onChange={(e) => setShowNumbers(e.target.checked)}
                />
                <span>Show Tile Number Badges</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showIcons}
                  onChange={(e) => setShowIcons(e.target.checked)}
                />
                <span>Show Space Type Icons</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showNexusLines}
                  onChange={(e) => setShowNexusLines(e.target.checked)}
                />
                <span>Show Central Nexus Portal Lines</span>
              </label>
            </div>
          </div>

          {/* Reset button at bottom */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '6px', fontSize: '0.72rem', color: '#F87171' }}
              onClick={handleResetDefaults}
            >
              🔄 Reset All to Factory Defaults
            </button>
          </div>
        </aside>
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
