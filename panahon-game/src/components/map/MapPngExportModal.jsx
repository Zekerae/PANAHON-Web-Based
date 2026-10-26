import React, { useState } from 'react';
import sounds from '../../sound.js';
import { ERA_ORDER, ERA_NAMES, TILE_IMAGES } from '../../gameData.js';

const ERA_COLORS = {
  spanish: '#E74C3C',
  american: '#3498DB',
  japanese: '#2ECC71',
  myth: '#F39C12'
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

const RESOLUTION_PRESETS = [
  {
    id: '1x',
    name: 'Standard HD',
    scale: 1,
    width: 1024,
    height: 765,
    tag: 'Web / Fast',
    description: '1024 × 765 px • ~1.2 MB',
    printSize: '3.4" × 2.6" (at 300 DPI)'
  },
  {
    id: '2x',
    name: '2K Desktop Print',
    scale: 2,
    width: 2048,
    height: 1530,
    tag: 'Recommended (A4)',
    description: '2048 × 1530 px • ~3.8 MB',
    printSize: '6.8" × 5.1" (at 300 DPI) / A4 Sheet'
  },
  {
    id: '3x',
    name: '3K Fine Art',
    scale: 3,
    width: 3072,
    height: 2295,
    tag: 'High Density',
    description: '3072 × 2295 px • ~7.5 MB',
    printSize: '10.2" × 7.7" (at 300 DPI) / A3 Sheet'
  },
  {
    id: '4x',
    name: '4K Ultra Print Poster',
    scale: 4,
    width: 4096,
    height: 3060,
    tag: 'Pro 300 DPI Board',
    description: '4096 × 3060 px • ~12 MB',
    printSize: '13.7" × 10.2" (34.7 × 25.9 cm at 300 DPI)'
  },
  {
    id: 'custom',
    name: 'Custom Resolution',
    scale: null,
    width: 2560,
    height: 1913,
    tag: 'Custom',
    description: 'User specified width and height',
    printSize: 'Variable'
  }
];

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderMapToCanvas({
  coords,
  layouts,
  connections,
  width,
  height,
  bgChoice = 'clean',
  showNumbers = true,
  showIcons = true,
  showPaths = true,
  showNexus = true,
  showTargets = false,
  selectedEra = 'all'
}) {
  const baseW = 1024;
  const baseH = 765;
  const actualScale = width / baseW;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Background
  if (bgChoice === 'clean' || bgChoice === 'tiles') {
    const bgUrl = bgChoice === 'clean' ? '/assets/Map/Full Map.png' : '/assets/Map/Full Map with Tiles.png';
    const bgImg = await loadImage(bgUrl);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#0B0F19';
      ctx.fillRect(0, 0, width, height);
    }
  } else if (bgChoice === 'grid') {
    ctx.fillStyle = '#0B0F19';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1 * actualScale;
    const gridSpacing = 50 * actualScale;
    for (let x = 0; x <= width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // 2. Preload Tile Images
  const tileImageMap = {};
  if (showIcons && TILE_IMAGES) {
    const loadPromises = Object.entries(TILE_IMAGES).map(async ([type, url]) => {
      if (url) {
        tileImageMap[type] = await loadImage(url);
      }
    });
    await Promise.all(loadPromises);
  }

  // 3. Draw Nexus Lines
  if (showNexus && (selectedEra === 'all' || selectedEra)) {
    ctx.save();
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2.5 * actualScale;
    ctx.setLineDash([6 * actualScale, 6 * actualScale]);
    ctx.globalAlpha = 0.8;
    const nexusX = width * 0.50;
    const nexusY = height * 0.49;

    const erasToDraw = selectedEra === 'all' ? ERA_ORDER : [selectedEra];
    erasToDraw.forEach(era => {
      const tgIdx = layouts[era]?.indexOf('timegate');
      if (tgIdx !== -1 && coords[era]?.[tgIdx]) {
        const c = coords[era][tgIdx];
        const cx = (c.x / 100) * width;
        const cy = (c.y / 100) * height;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(nexusX, nexusY);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  // 4. Draw Path Connections with Arrowheads
  if (showPaths) {
    const erasToDraw = selectedEra === 'all' ? ERA_ORDER : [selectedEra];
    erasToDraw.forEach(era => {
      const eraCoords = coords[era] || [];
      const eraConns = connections[era] || {};
      const strokeColor = ERA_COLORS[era] || '#FFF';

      Object.entries(eraConns).forEach(([fromStr, toList]) => {
        const fromIdx = parseInt(fromStr, 10);
        const fromCoord = eraCoords[fromIdx];
        if (!fromCoord || !Array.isArray(toList)) return;

        const x1 = (fromCoord.x / 100) * width;
        const y1 = (fromCoord.y / 100) * height;

        toList.forEach(toIdx => {
          const toCoord = eraCoords[toIdx];
          if (!toCoord) return;

          const x2 = (toCoord.x / 100) * width;
          const y2 = (toCoord.y / 100) * height;

          // Draw line
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 2.5 * actualScale;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.restore();

          // Draw directed arrowhead
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const nodeRadius = 14 * actualScale;
          const tipX = x2 - Math.cos(angle) * (nodeRadius + 2 * actualScale);
          const tipY = y2 - Math.sin(angle) * (nodeRadius + 2 * actualScale);
          const arrowLength = 9 * actualScale;
          const arrowWidth = 5 * actualScale;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(
            tipX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
            tipY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
          );
          ctx.lineTo(
            tipX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
            tipY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
          );
          ctx.closePath();
          ctx.fillStyle = strokeColor;
          ctx.fill();
          ctx.restore();
        });
      });
    });
  }

  // 5. Draw Central Nexus Dial
  if (showNexus) {
    const nexusX = width * 0.50;
    const nexusY = height * 0.49;
    const nexusR = 19 * actualScale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(nexusX, nexusY, nexusR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.fill();
    ctx.lineWidth = 2 * actualScale;
    ctx.strokeStyle = '#00E5FF';
    ctx.setLineDash([4 * actualScale, 4 * actualScale]);
    ctx.stroke();

    ctx.font = `${14 * actualScale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌀', nexusX, nexusY);
    ctx.restore();
  }

  // 6. Draw Nodes
  const erasToDraw = selectedEra === 'all' ? ERA_ORDER : [selectedEra];
  erasToDraw.forEach(era => {
    const eraCoords = coords[era] || [];
    const eraLayout = layouts[era] || [];
    const eraColor = ERA_COLORS[era] || '#FFF';

    eraCoords.forEach((c, idx) => {
      const cx = (c.x / 100) * width;
      const cy = (c.y / 100) * height;
      const r = 13.5 * actualScale;
      const tileType = eraLayout[idx] || 'empty';

      // Drop shadow and disc
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 6 * actualScale;
      ctx.shadowOffsetY = 2 * actualScale;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#0F172A';
      ctx.fill();

      ctx.lineWidth = 2 * actualScale;
      ctx.strokeStyle = eraColor;
      ctx.stroke();
      ctx.restore();

      // Tile image or icon
      if (showIcons) {
        const img = tileImageMap[tileType];
        if (img) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r - 1.5 * actualScale, 0, Math.PI * 2);
          ctx.clip();
          const imgSize = r * 1.85;
          ctx.drawImage(img, cx - imgSize / 2, cy - imgSize / 2, imgSize, imgSize);
          ctx.restore();
        } else {
          ctx.save();
          const icon = TILE_ICONS[tileType] || '•';
          ctx.font = `${r * 1.05}px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(icon, cx, cy + 0.5 * actualScale);
          ctx.restore();
        }
      }

      // Tile number badge (top-left)
      if (showNumbers) {
        const br = r * 0.52;
        const bx = cx - r * 0.72;
        const by = cy - r * 0.72;

        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fillStyle = eraColor;
        ctx.fill();
        ctx.lineWidth = 1 * actualScale;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.font = `bold ${br * 1.15}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), bx, by);
        ctx.restore();
      }

      // Target Hints
      if (showTargets) {
        const targets = connections[era]?.[idx] || [];
        if (targets.length > 0) {
          const pillText = `➔ ${targets.map(t => t + 1).join(',')}`;
          const pillFontSize = 7 * actualScale;
          ctx.save();
          ctx.font = `bold ${pillFontSize}px system-ui, sans-serif`;
          const textMetrics = ctx.measureText(pillText);
          const pillW = textMetrics.width + 6 * actualScale;
          const pillH = 10 * actualScale;
          const pillX = cx - pillW / 2;
          const pillY = cy + r - 2 * actualScale;

          ctx.fillStyle = targets.length > 1 ? '#10B981' : '#3B82F6';
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, 3 * actualScale);
            ctx.fill();
          } else {
            ctx.fillRect(pillX, pillY, pillW, pillH);
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pillText, cx, pillY + pillH / 2);
          ctx.restore();
        }
      }
    });
  });

  return canvas;
}

export default function MapPngExportModal({
  isOpen,
  onClose,
  coords,
  layouts,
  connections,
  activeEra = 'all',
  bgMode = 'clean',
  triggerToast
}) {
  const [selectedPreset, setSelectedPreset] = useState('2x');
  const [customWidthInput, setCustomWidthInput] = useState(2560);
  const [bgChoice, setBgChoice] = useState(bgMode === 'tiles' ? 'tiles' : 'clean');
  const [selectedEra, setSelectedEra] = useState('all');
  const [showNumbers, setShowNumbers] = useState(true);
  const [showIcons, setShowIcons] = useState(true);
  const [showPaths, setShowPaths] = useState(true);
  const [showNexus, setShowNexus] = useState(true);
  const [showTargets, setShowTargets] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const currentPreset = RESOLUTION_PRESETS.find(p => p.id === selectedPreset) || RESOLUTION_PRESETS[1];
  const finalWidth = selectedPreset === 'custom' ? Math.max(500, Math.min(10000, parseInt(customWidthInput, 10) || 2560)) : currentPreset.width;
  const finalHeight = Math.round((finalWidth / 1024) * 765);
  const finalPrintInchesW = (finalWidth / 300).toFixed(1);
  const finalPrintInchesH = (finalHeight / 300).toFixed(1);
  const finalPrintCmW = ((finalWidth / 300) * 2.54).toFixed(1);
  const finalPrintCmH = ((finalHeight / 300) * 2.54).toFixed(1);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      sounds.btnClick();

      // Allow UI to render loading state
      await new Promise(r => setTimeout(r, 60));

      const canvas = await renderMapToCanvas({
        coords,
        layouts,
        connections,
        width: finalWidth,
        height: finalHeight,
        bgChoice,
        showNumbers,
        showIcons,
        showPaths,
        showNexus,
        showTargets,
        selectedEra
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          triggerToast?.('Failed to create PNG blob', 'error');
          setIsExporting(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const eraLabel = selectedEra === 'all' ? 'FullBoard' : selectedEra;
        a.href = url;
        a.download = `Panahon_Map_${eraLabel}_${finalWidth}x${finalHeight}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        sounds.artifact?.();
        triggerToast?.(`Exported PNG (${finalWidth} × ${finalHeight} px) successfully!`, 'success');
        setIsExporting(false);
        onClose();
      }, 'image/png');
    } catch (err) {
      console.error('Map PNG export failed:', err);
      triggerToast?.('Error generating high-resolution PNG', 'error');
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
      <div
        className="modal"
        style={{
          maxWidth: '640px',
          width: '94%',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'radial-gradient(circle at 50% 20%, #151F32 0%, #0B1120 70%, #030712 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(56, 189, 248, 0.25)',
          padding: '22px 24px',
          boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🖨️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: '#F8FAFC', letterSpacing: '1px' }}>
                EXPORT MAP AS PNG (FOR PRINTING)
              </h2>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '3px' }}>
              Render razor-sharp board map graphics with custom resolutions and layout elements
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* Resolution Selection Grid */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            1. Select Output Resolution
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {RESOLUTION_PRESETS.map(preset => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => { sounds.btnClick(); setSelectedPreset(preset.id); }}
                  style={{
                    background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(15, 23, 42, 0.65)',
                    border: isSelected ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: isSelected ? '#FFFFFF' : '#E2E8F0' }}>
                      {preset.name}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isSelected ? '#38BDF8' : 'rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#000' : '#94A3B8'
                    }}>
                      {preset.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: isSelected ? '#7DD3FC' : '#94A3B8' }}>
                    {preset.id === 'custom' ? `${customWidthInput} × ${Math.round((customWidthInput / 1024) * 765)} px` : preset.description}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#64748B', marginTop: '3px' }}>
                    {preset.printSize}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Width Input if selected */}
          {selectedPreset === 'custom' && (
            <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: '#CBD5E1', fontWeight: 700 }}>Custom Width (px):</span>
                <input
                  type="number"
                  min="500"
                  max="8192"
                  step="100"
                  value={customWidthInput}
                  onChange={e => setCustomWidthInput(e.target.value)}
                  style={{
                    background: '#0B1120',
                    border: '1px solid #38BDF8',
                    borderRadius: '4px',
                    color: '#FFF',
                    padding: '6px 10px',
                    fontSize: '0.84rem',
                    width: '120px'
                  }}
                />
                <span style={{ fontSize: '0.76rem', color: '#38BDF8' }}>
                  ➔ Height auto: {finalHeight} px
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Print Sizing Telemetry Box */}
        <div style={{
          marginBottom: '18px',
          padding: '10px 14px',
          background: 'rgba(30, 41, 59, 0.45)',
          border: '1px dashed rgba(56, 189, 248, 0.35)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Physical Print Dimensions (300 DPI)
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
              {finalPrintInchesW}" × {finalPrintInchesH}" inches <span style={{ color: '#64748B', fontWeight: 400 }}>({finalPrintCmW} × {finalPrintCmH} cm)</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.68rem', background: '#0284C7', color: '#FFF', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
              {finalWidth} × {finalHeight} PX
            </span>
          </div>
        </div>

        {/* Background & Scope Configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
          {/* Background Choice */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#E2E8F0', marginBottom: '6px' }}>
              2. Background Image
            </label>
            <select
              value={bgChoice}
              onChange={e => setBgChoice(e.target.value)}
              style={{
                width: '100%',
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#FFF',
                padding: '8px 10px',
                fontSize: '0.78rem'
              }}
            >
              <option value="clean">Clean Map (Full Map.png) ⭐</option>
              <option value="tiles">Map with Original Drawn Tiles</option>
              <option value="transparent">Transparent PNG (Nodes & Paths Only)</option>
              <option value="grid">Dark Technical Grid</option>
            </select>
          </div>

          {/* Era Scope */}
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#E2E8F0', marginBottom: '6px' }}>
              3. Board Scope
            </label>
            <select
              value={selectedEra}
              onChange={e => setSelectedEra(e.target.value)}
              style={{
                width: '100%',
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#FFF',
                padding: '8px 10px',
                fontSize: '0.78rem'
              }}
            >
              <option value="all">Complete Board (All 4 Eras)</option>
              <option value="spanish">Spanish Era Quadrant Only</option>
              <option value="american">American Era Quadrant Only</option>
              <option value="japanese">Japanese Era Quadrant Only</option>
              <option value="myth">Myth Era Quadrant Only</option>
            </select>
          </div>
        </div>

        {/* Graphic Layers Toggles */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#E2E8F0', marginBottom: '8px' }}>
            4. Elements to Include in Printout
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#CBD5E1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showNumbers}
                onChange={e => setShowNumbers(e.target.checked)}
                style={{ accentColor: '#38BDF8' }}
              />
              <span>Tile Sequence Numbers (1..25)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#CBD5E1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showPaths}
                onChange={e => setShowPaths(e.target.checked)}
                style={{ accentColor: '#38BDF8' }}
              />
              <span>Path Lines & Flow Arrows</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#CBD5E1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showIcons}
                onChange={e => setShowIcons(e.target.checked)}
                style={{ accentColor: '#38BDF8' }}
              />
              <span>Tile Graphics & Icons</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#CBD5E1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showNexus}
                onChange={e => setShowNexus(e.target.checked)}
                style={{ accentColor: '#38BDF8' }}
              />
              <span>Central Nexus Dial & Portal Rays</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#CBD5E1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showTargets}
                onChange={e => setShowTargets(e.target.checked)}
                style={{ accentColor: '#38BDF8' }}
              />
              <span>Branch / Target Flow Badges</span>
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isExporting}
            style={{ padding: '9px 18px', fontSize: '0.8rem' }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={isExporting}
            style={{
              padding: '9px 24px',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.5)'
            }}
          >
            {isExporting ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                <span>Rendering High-Res PNG...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>Generate & Download PNG ({finalWidth}×{finalHeight})</span>
              </>
            )}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
