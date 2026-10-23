import React, { useState, useRef, useEffect } from 'react';
import sounds from '../sound.js';
import {
  ERAS, ERA_ORDER, ERA_NAMES,
  ERA_TILE_COORDINATES, ERA_TILE_LAYOUTS,
  DEFAULT_ERA_LOOP_TARGETS, DEFAULT_ERA_PATH_CONNECTIONS, getActivePathConnections, DEFAULT_ERA_JUNCTION_RULES, getActiveJunctionRules, saveCustomJunctionRules, getActiveTileCoordinates, getActiveTileLayouts, getActiveLoopTargets,
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
  const [connections, setConnections] = useState(() => JSON.parse(JSON.stringify(getActivePathConnections())));
  const [junctionRules, setJunctionRules] = useState(() => JSON.parse(JSON.stringify(getActiveJunctionRules())));
  const [isConnectingMode, setIsConnectingMode] = useState(false);

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
    if (isConnectingMode && selectedTile) {
      if (selectedTile.era === era && selectedTile.index !== index) {
        handleAddConnection(era, selectedTile.index, index);
        setIsConnectingMode(false);
        return;
      }
    }
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

  // Add directed connection from -> to
  const handleAddConnection = (era, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    sounds.btnClick();
    setConnections(prev => {
      const next = { ...prev };
      const eraConns = { ...(next[era] || {}) };
      const curList = [...(eraConns[fromIdx] || [])];
      if (!curList.includes(toIdx)) {
        curList.push(toIdx);
      }
      eraConns[fromIdx] = curList;
      next[era] = eraConns;
      return next;
    });
    triggerToast(`Connected Tile #${fromIdx + 1} ➔ Tile #${toIdx + 1}!`);
  };

  // Remove connection
  const handleRemoveConnection = (era, fromIdx, toIdx) => {
    sounds.btnClick();
    setConnections(prev => {
      const next = { ...prev };
      const eraConns = { ...(next[era] || {}) };
      eraConns[fromIdx] = (eraConns[fromIdx] || []).filter(t => t !== toIdx);
      next[era] = eraConns;
      return next;
    });
    triggerToast(`Disconnected Tile #${fromIdx + 1} ➔ Tile #${toIdx + 1}`, 'info');
  };

  // Move connection position up or down (reorder priority)
  const handleMoveConnection = (era, fromIdx, targetIdx, delta) => {
    sounds.btnClick();
    setConnections(prev => {
      const next = { ...prev };
      const eraConns = { ...(next[era] || {}) };
      const list = [...(eraConns[fromIdx] || [])];
      const curPos = list.indexOf(targetIdx);
      if (curPos < 0) return prev;
      const newPos = curPos + delta;
      if (newPos < 0 || newPos >= list.length) return prev;
      const [item] = list.splice(curPos, 1);
      list.splice(newPos, 0, item);
      eraConns[fromIdx] = list;
      next[era] = eraConns;
      return next;
    });
  };

  // Set any connection directly as Primary / First-Choice route (moves to index 0)
  const handleSetPrimaryConnection = (era, fromIdx, targetIdx) => {
    sounds.btnClick();
    setConnections(prev => {
      const next = { ...prev };
      const eraConns = { ...(next[era] || {}) };
      const list = [...(eraConns[fromIdx] || [])];
      const curPos = list.indexOf(targetIdx);
      if (curPos <= 0) return prev;
      const [item] = list.splice(curPos, 1);
      list.unshift(item);
      eraConns[fromIdx] = list;
      next[era] = eraConns;
      return next;
    });
    triggerToast(`Set Space #${targetIdx + 1} as Primary Route! ⭐`);
  };

  // Cycle connection order for multi-way junctions
  const handleCycleConnectionOrder = (era, idx) => {
    sounds.btnClick();
    setConnections(prev => {
      const next = { ...prev };
      const eraConns = { ...(next[era] || {}) };
      const list = [...(eraConns[idx] || [])];
      if (list.length >= 2) {
        const first = list.shift();
        list.push(first);
      }
      eraConns[idx] = list;
      next[era] = eraConns;
      return next;
    });
    triggerToast('Rotated route priority!');
  };

  // Map specific arrival space to departure space for multi-path junctions
  const handleSetJunctionRule = (era, junctionIdx, fromIdx, toIdx) => {
    sounds.btnClick();
    setJunctionRules(prev => {
      const next = { ...prev };
      const eraRules = { ...(next[era] || {}) };
      eraRules[`${junctionIdx}:${fromIdx}`] = toIdx;
      next[era] = eraRules;
      return next;
    });
    triggerToast(`Mapped: From Space #${fromIdx + 1} ➔ Space #${toIdx + 1}! 🔀`);
  };

  // Swap #1 and #2 connection order for junctions
  const handleSwapConnectionOrder = (era, idx) => {
    sounds.btnClick();
    setConnections(prev => {
      const next = { ...prev };
      const eraConns = { ...(next[era] || {}) };
      const list = [...(eraConns[idx] || [])];
      if (list.length >= 2) {
        const temp = list[0];
        list[0] = list[1];
        list[1] = temp;
      }
      eraConns[idx] = list;
      next[era] = eraConns;
      return next;
    });
    triggerToast('Swapped #1 and #2 route priority!');
  };

  // Auto-chain all tiles sequentially (1 -> 2 -> ... -> N)
  const handleAutoChainEra = (era) => {
    sounds.portal();
    const count = coords[era]?.length || 0;
    if (count < 2) return;
    setConnections(prev => {
      const next = { ...prev };
      const eraConns = {};
      for (let i = 0; i < count - 1; i++) {
        eraConns[i] = [i + 1];
      }
      eraConns[count - 1] = [0];
      next[era] = eraConns;
      return next;
    });
    triggerToast(`Auto-chained all ${count} tiles sequentially in ${ERA_NAMES[era]}`);
  };

  // Invert all path connections in era
  const handleInvertEraFlow = (era) => {
    sounds.portal();
    setConnections(prev => {
      const next = { ...prev };
      const oldConns = next[era] || {};
      const newConns = {};
      for (const [fromStr, toList] of Object.entries(oldConns)) {
        const fromIdx = parseInt(fromStr, 10);
        if (Array.isArray(toList)) {
          toList.forEach(toIdx => {
            if (!newConns[toIdx]) newConns[toIdx] = [];
            newConns[toIdx].push(fromIdx);
          });
        }
      }
      next[era] = newConns;
      return next;
    });
    triggerToast(`Reversed all path connections for ${ERA_NAMES[era]}!`);
  };

  // Clear all connections in era (allows fully manual routing from scratch)
  const handleClearEraConnections = (era) => {
    if (confirm(`Clear all path connections for ${ERA_NAMES[era]}? You can route them manually from scratch.`)) {
      sounds.portal();
      setConnections(prev => {
        const next = { ...prev };
        next[era] = {};
        return next;
      });
      triggerToast(`Cleared connections for ${ERA_NAMES[era]}`, 'warning');
    }
  };

  // Toggle Path Mode ('mario_party' vs 'loop')
  const handleTogglePathMode = (era, mode) => {
    sounds.btnClick();
    setPathModes(prev => ({
      ...prev,
      [era]: mode
    }));
    triggerToast(
      mode === 'mario_party'
        ? `🎮 Set ${ERA_NAMES[era]} to Mario Party Flow: 25 ➔ 15 ➔ 14... ➔ 1!`
        : `🔁 Set ${ERA_NAMES[era]} to Circuit Loop Mode`
    );
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
    const ok = saveCustomMap(coords, layouts, loopTargets, null, connections, junctionRules);
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
      setConnections(JSON.parse(JSON.stringify(DEFAULT_ERA_PATH_CONNECTIONS)));
      setJunctionRules(JSON.parse(JSON.stringify(DEFAULT_ERA_JUNCTION_RULES)));
      triggerToast('Map reset to factory defaults.');
    }
  };

  // Path walking simulation preview following exact node-graph connections and approach junction rules
  useEffect(() => {
    if (!isPreviewWalking) return;
    const curEra = activeEra === 'all' ? 'spanish' : activeEra;
    const max = coords[curEra]?.length || 1;
    let step = 0;
    let prevStep = null;
    setPreviewStep(0);

    const timer = setInterval(() => {
      const eraConns = connections[curEra] || {};
      const eraRules = junctionRules[curEra] || {};

      let next;

      // 1. Explicit junction rule based on arrival space (step:prevStep)
      if (prevStep !== null) {
        const ruleKey = `${step}:${prevStep}`;
        if (eraRules[ruleKey] !== undefined) {
          next = eraRules[ruleKey];
        }
      }

      // 2. Linear return along two-way trail (village road 14 down to 7, or base road 3 down to 1):
      if (next === undefined && prevStep !== null && prevStep > step) {
        if ((step >= 6 && step <= 14) || (step >= 0 && step <= 2)) {
          if (step === 6) next = 3; // From Space 7 exit to Space 4
          else if (step === 0) next = 1; // From Space 1 turn around to Space 2
          else next = step - 1;
        }
      }

      // 3. Fallback to node-graph targets
      if (next === undefined) {
        const nextList = eraConns[step];
        if (!Array.isArray(nextList) || nextList.length === 0 || (nextList.length === 1 && nextList[0] === prevStep)) {
          if (prevStep !== null && prevStep > step) {
            next = step <= 0 ? 1 : step - 1;
          } else {
            next = (Array.isArray(nextList) && nextList.length === 1) ? nextList[0] : (step + 1) % max;
          }
        } else if (nextList.length === 1) {
          next = nextList[0];
        } else {
          const candidates = nextList.filter(t => t !== prevStep);
          next = candidates.length > 0 ? candidates[0] : nextList[0];
        }
      }

      prevStep = step;
      step = next;
      setPreviewStep(step);
      sounds.moveStep();
    }, 450);

    return () => clearInterval(timer);
  }, [isPreviewWalking, activeEra, coords, connections, junctionRules]);

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
      '',
      'export const DEFAULT_ERA_PATH_CONNECTIONS = ' + JSON.stringify(connections, null, 2) + ';',
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
            {/* SVG DIRECTED PATH LINES WITH ARROWS */}
            <svg className="editor-paths-svg" viewBox="0 0 1024 765" preserveAspectRatio="none">
              <defs>
                <marker
                  id="flow-arrow-active"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#FACC15" />
                </marker>
                {ERA_ORDER.map(era => (
                  <marker
                    key={`arrow-${era}`}
                    id={`arrow-${era}`}
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 2 L 7 5 L 0 8 z" fill={ERA_COLORS[era]} />
                  </marker>
                ))}
              </defs>

              {ERA_ORDER.map(era => {
                const eraCoords = coords[era] || [];
                const eraConns = connections[era] || {};
                const isSelectedEra = activeEra === era || activeEra === 'all';
                const opacity = isSelectedEra ? 1 : 0.25;

                return Object.entries(eraConns).map(([fromStr, toList]) => {
                  const fromIdx = parseInt(fromStr, 10);
                  const fromCoord = eraCoords[fromIdx];
                  if (!fromCoord || !Array.isArray(toList)) return null;

                  return toList.map(toIdx => {
                    const toCoord = eraCoords[toIdx];
                    if (!toCoord) return null;

                    const isOutgoing = selectedTile?.era === era && selectedTile?.index === fromIdx;
                    const isIncoming = selectedTile?.era === era && selectedTile?.index === toIdx;

                    let strokeColor = ERA_COLORS[era];
                    let strokeWidth = isSelectedEra ? 2.5 : 1.5;
                    let marker = `url(#arrow-${era})`;

                    if (isOutgoing) {
                      strokeColor = '#FACC15';
                      strokeWidth = 3.5;
                      marker = 'url(#flow-arrow-active)';
                    } else if (isIncoming) {
                      strokeColor = '#00E5FF';
                      strokeWidth = 3;
                    }

                    return (
                      <line
                        key={`${era}_${fromIdx}_${toIdx}`}
                        x1={(fromCoord.x * 1024) / 100}
                        y1={(fromCoord.y * 765) / 100}
                        x2={(toCoord.x * 1024) / 100}
                        y2={(toCoord.y * 765) / 100}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        opacity={opacity}
                        markerEnd={marker}
                        strokeLinecap="round"
                      />
                    );
                  });
                });
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

                    {/* Outgoing Next Targets Indicators */}
                    {(() => {
                      const targets = connections[era]?.[idx] || [];
                      if (targets.length === 0) return null;
                      return (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '-9px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '0.52rem',
                            background: targets.length > 1 ? '#10B981' : '#3B82F6',
                            color: '#fff',
                            padding: '0 4px',
                            borderRadius: '4px',
                            lineHeight: '11px',
                            fontWeight: 800,
                            boxShadow: targets.length > 1 ? '0 0 6px rgba(16, 185, 129, 0.8)' : '0 0 5px rgba(59, 130, 246, 0.7)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            zIndex: 20
                          }}
                          title={`Flows into: ${targets.map((t, ti) => (ti === 0 && targets.length > 1 ? `#${t + 1} (Primary ⭐)` : `#${t + 1}`)).join(', ')}`}
                        >
                          ➔ {targets.map((t, ti) => (ti === 0 && targets.length > 1 ? `⭐${t + 1}` : `${t + 1}`)).join(',')}
                        </span>
                      );
                    })()}

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

                  {/* MANUAL PATH CONNECTIONS & FLOW */}
                  <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.64rem', fontWeight: 800, color: 'var(--text-accent)' }}>
                        ➔ FLOWS INTO (Next Spaces):
                      </span>
                      <button
                        className={`sidebar-btn ${isConnectingMode ? 'active' : ''}`}
                        style={{ width: 'auto', padding: '2px 6px', height: '20px', fontSize: '0.58rem' }}
                        onClick={() => {
                          sounds.btnClick();
                          setIsConnectingMode(!isConnectingMode);
                          if (!isConnectingMode) {
                            triggerToast('Click any space on map to connect!', 'info');
                          }
                        }}
                        title="Click to enter linking mode, then click any tile on map"
                      >
                        {isConnectingMode ? '🎯 Click Map...' : '🔗 Link Space'}
                      </button>
                    </div>

                    {/* Connected Targets Badges & Multi-Route Junction Manager */}
                    {(() => {
                      const targets = connections[selectedTile.era]?.[selectedTile.index] || [];
                      const isJunction = targets.length >= 2;
                      return (
                        <div style={{ marginBottom: '4px' }}>
                          {isJunction && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.58rem',
                              color: '#34D399',
                              background: 'rgba(16, 185, 129, 0.12)',
                              padding: '2px 5px',
                              borderRadius: '3px',
                              marginBottom: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              <span style={{ fontWeight: 700 }}>
                                🔀 Fork (${targets.length} Links): ⭐#${targets[0] + 1}
                              </span>
                              <div style={{ display: 'flex', gap: '3px' }}>
                                <button
                                  onClick={() => handleCycleConnectionOrder(selectedTile.era, selectedTile.index)}
                                  style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: '2px', padding: '1px 4px', fontSize: '0.55rem', cursor: 'pointer', fontWeight: 700 }}
                                  title="Rotate all routes (1st -> 2nd -> 3rd)"
                                >
                                  🔄 Rotate
                                </button>
                                <button
                                  onClick={() => handleSwapConnectionOrder(selectedTile.era, selectedTile.index)}
                                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '2px', padding: '1px 4px', fontSize: '0.55rem', cursor: 'pointer', fontWeight: 700 }}
                                  title="Swap #1 and #2 route"
                                >
                                  ⇄ Swap
                                </button>
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {targets.length === 0 ? (
                              <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                No outgoing path (dead end)
                              </span>
                            ) : (
                              targets.map((targetIdx, tRank) => {
                                const isPrimary = tRank === 0;
                                const isForward = targetIdx > selectedTile.index;
                                const tileType = layouts[selectedTile.era]?.[targetIdx] || 'tile';
                                return (
                                  <div
                                    key={targetIdx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      background: isPrimary ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.16)',
                                      border: `1px solid ${isPrimary ? '#F59E0B' : 'rgba(59, 130, 246, 0.35)'}`,
                                      borderRadius: '3px',
                                      padding: '1px 4px',
                                      fontSize: '0.59rem',
                                      color: '#fff',
                                      height: '20px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0, overflow: 'hidden' }}>
                                      <span style={{ color: isPrimary ? '#FBBF24' : '#94A3B8', fontWeight: 800, fontSize: '0.56rem' }}>
                                        {isPrimary ? '⭐ #1' : `#${tRank + 1}`}
                                      </span>
                                      <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontWeight: isPrimary ? 700 : 500 }}>
                                        ➔ Space #{targetIdx + 1} ({tileType})
                                      </span>
                                      <span style={{ fontSize: '0.50rem', color: isForward ? '#34D399' : '#60A5FA', padding: '0 2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                                        {isForward ? '↗' : '↙'}
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                                      {!isPrimary && (
                                        <button
                                          onClick={() => handleSetPrimaryConnection(selectedTile.era, selectedTile.index, targetIdx)}
                                          style={{
                                            background: 'rgba(245, 158, 11, 0.25)',
                                            border: '1px solid rgba(245, 158, 11, 0.5)',
                                            color: '#FBBF24',
                                            borderRadius: '2px',
                                            padding: '0 3px',
                                            fontSize: '0.54rem',
                                            cursor: 'pointer',
                                            lineHeight: '14px',
                                            height: '16px'
                                          }}
                                          title="Set as Primary Route ⭐"
                                        >
                                          ⭐
                                        </button>
                                      )}
                                      {tRank > 0 && (
                                        <button
                                          onClick={() => handleMoveConnection(selectedTile.era, selectedTile.index, targetIdx, -1)}
                                          style={{
                                            background: 'rgba(255,255,255,0.12)',
                                            border: 'none',
                                            color: '#fff',
                                            borderRadius: '2px',
                                            padding: '0 3px',
                                            fontSize: '0.52rem',
                                            cursor: 'pointer',
                                            lineHeight: '14px',
                                            height: '16px'
                                          }}
                                          title="Move Up"
                                        >
                                          ▲
                                        </button>
                                      )}
                                      {tRank < targets.length - 1 && (
                                        <button
                                          onClick={() => handleMoveConnection(selectedTile.era, selectedTile.index, targetIdx, 1)}
                                          style={{
                                            background: 'rgba(255,255,255,0.12)',
                                            border: 'none',
                                            color: '#fff',
                                            borderRadius: '2px',
                                            padding: '0 3px',
                                            fontSize: '0.52rem',
                                            cursor: 'pointer',
                                            lineHeight: '14px',
                                            height: '16px'
                                          }}
                                          title="Move Down"
                                        >
                                          ▼
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveConnection(selectedTile.era, selectedTile.index, targetIdx);
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#F87171',
                                          cursor: 'pointer',
                                          padding: '0 2px',
                                          fontSize: '0.68rem',
                                          lineHeight: '14px',
                                          height: '16px'
                                        }}
                                        title="Remove connection"
                                      >
                                        &times;
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Approach / Junction Rules Table */}
                          {(() => {
                            const curEra = selectedTile.era;
                            const targetIdx = selectedTile.index;
                            if (targets.length < 2) return null;
                            const eraConns = connections[curEra] || {};
                            const inc = [];
                            Object.keys(eraConns).forEach(fromStr => {
                              const fromIdx = parseInt(fromStr, 10);
                              if (fromIdx !== targetIdx && (eraConns[fromIdx] || []).includes(targetIdx)) {
                                if (!inc.includes(fromIdx)) inc.push(fromIdx);
                              }
                            });
                            if (targetIdx === 3) {
                              [2, 5, 6].forEach(k => { if (!inc.includes(k)) inc.push(k); });
                            } else if (targetIdx === 6) {
                              [3, 7].forEach(k => { if (!inc.includes(k)) inc.push(k); });
                            } else if (targetIdx === 14) {
                              [13, 24].forEach(k => { if (!inc.includes(k)) inc.push(k); });
                            }
                            inc.sort((a, b) => a - b);
                            if (inc.length === 0) return null;

                            return (
                              <div style={{
                                marginTop: '4px',
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '3px',
                                padding: '3px 5px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#A5B4FC' }}>
                                    🔀 Flow by Arrival Space:
                                  </span>
                                  <span style={{ fontSize: '0.49rem', color: 'rgba(255,255,255,0.45)' }}>
                                    Arrival ➔ Destination
                                  </span>
                                </div>

                                {inc.map(incIdx => {
                                  const ruleKey = `${targetIdx}:${incIdx}`;
                                  let assignedTarget = junctionRules[curEra]?.[ruleKey];
                                  if (assignedTarget === undefined) {
                                    if (targetIdx === 3) {
                                      if (incIdx === 2) assignedTarget = 4;
                                      else if (incIdx === 5) assignedTarget = 6;
                                      else if (incIdx === 6) assignedTarget = 2;
                                    } else if (targetIdx === 6) {
                                      if (incIdx === 3) assignedTarget = 7;
                                      else if (incIdx === 7) assignedTarget = 3;
                                    } else if (targetIdx === 14) {
                                      if (incIdx === 13) assignedTarget = 15;
                                      else if (incIdx === 24) assignedTarget = 13;
                                    }
                                    if (assignedTarget === undefined) {
                                      assignedTarget = targets.find(t => t !== incIdx) ?? targets[0];
                                    }
                                  }

                                  return (
                                    <div key={incIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3px', height: '18px' }}>
                                      <span style={{ fontSize: '0.56rem', color: '#E2E8F0', whiteSpace: 'nowrap' }}>
                                        From Space #${incIdx + 1} ➔
                                      </span>
                                      <select
                                        value={assignedTarget !== undefined ? assignedTarget : ''}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value, 10);
                                          handleSetJunctionRule(curEra, targetIdx, incIdx, val);
                                        }}
                                        style={{
                                          background: '#1E293B',
                                          color: '#FACC15',
                                          border: '1px solid rgba(250, 204, 21, 0.4)',
                                          borderRadius: '2px',
                                          fontSize: '0.56rem',
                                          height: '17px',
                                          padding: '0 2px',
                                          fontWeight: 700
                                        }}
                                      >
                                        {targets.map(t => (
                                          <option key={t} value={t}>
                                            Space #${t + 1} ({layouts[curEra]?.[t] || 'tile'})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

                    {/* Quick Dropdown to Add Connection */}
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      <select
                        className="input-field"
                        style={{ flex: 1, padding: '1px 4px', fontSize: '0.63rem', height: '22px', minWidth: 0 }}
                        value=""
                        onChange={(e) => {
                          if (e.target.value !== '') {
                            handleAddConnection(selectedTile.era, selectedTile.index, parseInt(e.target.value, 10));
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="" disabled>➕ Connect to Space #...</option>
                        {(coords[selectedTile.era] || []).map((_, i) => {
                          if (i === selectedTile.index) return null;
                          const curList = connections[selectedTile.era]?.[selectedTile.index] || [];
                          const isConnected = curList.includes(i);
                          return (
                            <option key={i} value={i} disabled={isConnected}>
                              Tile #{i + 1} ({layouts[selectedTile.era]?.[i] || 'tile'}) {isConnected ? '✓ Connected' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="editor-panel-section" style={{ textAlign: 'center', padding: '12px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Select a tile to inspect.
              </div>
            )}

            {/* Pathing Tools */}
            <div className="editor-panel-section" style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-accent)', marginBottom: '4px' }}>
                PATH FLOW TOOLS:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', marginBottom: '4px' }}>
                <button
                  className="sidebar-btn"
                  style={{ height: '24px', fontSize: '0.62rem' }}
                  disabled={activeEra === 'all'}
                  onClick={() => handleAutoChainEra(activeEra)}
                  title="Chain all tiles sequentially 1 -> 2 -> ... -> End -> 1"
                >
                  🔗 Auto-Chain (1➔End)
                </button>
                <button
                  className="sidebar-btn"
                  style={{ height: '24px', fontSize: '0.62rem' }}
                  disabled={activeEra === 'all'}
                  onClick={() => handleInvertEraFlow(activeEra)}
                  title="Invert all path directions in this era"
                >
                  🔄 Invert Flow
                </button>
              </div>
              <button
                className="sidebar-btn danger"
                style={{ width: '100%', height: '22px', fontSize: '0.60rem', marginBottom: '5px' }}
                disabled={activeEra === 'all'}
                onClick={() => handleClearEraConnections(activeEra)}
                title="Clear all connections so you can route from scratch"
              >
                🧹 Clear Era Flow (Draw from Scratch)
              </button>

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
