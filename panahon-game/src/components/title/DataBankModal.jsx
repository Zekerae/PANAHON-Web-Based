import React, { useState, useMemo } from 'react';
import sounds from '../../sound.js';
import {
  ERAS,
  ERA_NAMES,
  ARTIFACTS,
  EVENT_CARDS,
  DANGER_CARDS,
  generateClueCards
} from '../../gameData.js';

const ERA_COLORS = {
  [ERAS.SPANISH]: '#E74C3C',
  [ERAS.AMERICAN]: '#3498DB',
  [ERAS.JAPANESE]: '#2ECC71',
  [ERAS.MYTH]: '#F39C12'
};

export default function DataBankModal({ onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all', 'clue', 'event', 'danger'
  const [selectedEra, setSelectedEra] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedCard, setInspectedCard] = useState(null);

  // Compile full card catalog once
  const allCards = useMemo(() => {
    const cards = [];

    // 1. Clue & Decoy Cards
    const rawClues = generateClueCards();
    rawClues.forEach((c) => {
      const artifact = c.artifactId ? Object.values(ARTIFACTS).flat().find(a => a.id === c.artifactId) : null;
      cards.push({
        id: c.id,
        category: 'clue',
        categoryLabel: c.isDecoy ? 'Decoy Clue' : 'Artifact Clue',
        title: c.isDecoy ? 'False Lead / Decoy' : `Clue: ${c.artifactName}`,
        era: c.era,
        image: c.image || c.cardImage,
        description: c.isDecoy
          ? 'A deceptive whisper through the timeline. This false lead provides no historical artifact coordinates.'
          : `Excavated clue revealing the coordinates and provenance of the ${c.artifactName}. Collect 3 matching clues to unearth this relic.`,
        lore: c.isDecoy
          ? 'Temporal paradoxes create chronological echoes—ghostly traces of events that never transpired.'
          : (artifact?.significance || artifact?.history || 'A fragment of historical evidence vital to restoring timeline continuity.'),
        isDecoy: c.isDecoy,
        artifactName: c.artifactName,
        artifact: artifact,
        badgeColor: c.isDecoy ? '#64748B' : '#38BDF8'
      });
    });

    // 2. Event Cards
    Object.entries(EVENT_CARDS).forEach(([era, list]) => {
      list.forEach((evt) => {
        cards.push({
          id: evt.id,
          category: 'event',
          categoryLabel: 'Temporal Event',
          title: evt.name,
          era: era,
          image: evt.image,
          description: evt.description,
          lore: 'Historical milestone and serendipitous chronological convergence. Operatives landing on this space trigger beneficial temporal resonances.',
          badgeColor: '#F59E0B'
        });
      });
    });

    // 3. Danger Cards
    Object.entries(DANGER_CARDS).forEach(([era, list]) => {
      list.forEach((dng) => {
        cards.push({
          id: dng.id,
          category: 'danger',
          categoryLabel: 'Hazard Anomaly',
          title: dng.name,
          nickname: dng.nickname,
          era: era,
          image: dng.image,
          description: dng.description,
          successMsg: dng.successMsg,
          failMsg: dng.failMsg,
          lore: 'Critical chronological turbulence and historical adversary encounter. Failure to overcome this hazard triggers timeline divergence and paradox buildup.',
          badgeColor: '#EF4444'
        });
      });
    });

    return cards;
  }, []);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return allCards.filter(card => {
      // Category filter
      if (selectedCategory !== 'all' && card.category !== selectedCategory) return false;
      // Era filter
      if (selectedEra !== 'all' && card.era !== selectedEra) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (card.title || '').toLowerCase().includes(q);
        const matchDesc = (card.description || '').toLowerCase().includes(q);
        const matchArt = (card.artifactName || '').toLowerCase().includes(q);
        const matchNick = (card.nickname || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchArt && !matchNick) return false;
      }
      return true;
    });
  }, [allCards, selectedCategory, selectedEra, searchQuery]);

  // Counts for Category Pills
  const counts = useMemo(() => {
    return {
      all: allCards.length,
      clue: allCards.filter(c => c.category === 'clue').length,
      event: allCards.filter(c => c.category === 'event').length,
      danger: allCards.filter(c => c.category === 'danger').length
    };
  }, [allCards]);

  // Navigating through cards in inspector
  const handleNextCard = () => {
    if (!inspectedCard) return;
    const idx = filteredCards.findIndex(c => c.id === inspectedCard.id);
    if (idx >= 0 && idx < filteredCards.length - 1) {
      sounds.btnClick();
      setInspectedCard(filteredCards[idx + 1]);
    }
  };

  const handlePrevCard = () => {
    if (!inspectedCard) return;
    const idx = filteredCards.findIndex(c => c.id === inspectedCard.id);
    if (idx > 0) {
      sounds.btnClick();
      setInspectedCard(filteredCards[idx - 1]);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 12000 }}>
      <div
        className="modal duelyst-modal"
        style={{
          maxWidth: '980px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid rgba(56, 189, 248, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.3))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}>
              🗄️
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontFamily: 'var(--font-display)',
                letterSpacing: '2px',
                color: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                TEMPORAL DATA BANK
                <span style={{ fontSize: '0.68rem', color: '#38BDF8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  {filteredCards.length} RECORDS FOUND
                </span>
              </h2>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
                Comprehensive archival intelligence on Clues, Historical Events, and Hazard Anomalies
              </div>
            </div>
          </div>

          <button
            className="modal-close"
            onClick={() => { sounds.btnClick(); onClose(); }}
            style={{ position: 'static', color: '#94A3B8', fontSize: '1.4rem' }}
          >
            &times;
          </button>
        </div>

        {/* Filter Bar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          {/* Row 1: Search & Type Tabs */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All Cards (${counts.all})`, icon: '🗃️' },
                { id: 'clue', label: `Clues & Decoys (${counts.clue})`, icon: '🔍' },
                { id: 'event', label: `Events (${counts.event})`, icon: '⚡' },
                { id: 'danger', label: `Dangers (${counts.danger})`, icon: '⚠️' }
              ].map(cat => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { sounds.btnClick(); setSelectedCategory(cat.id); }}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(99, 102, 241, 0.4))' : 'rgba(15, 23, 42, 0.6)',
                      border: isActive ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: isActive ? '#FFF' : '#94A3B8',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Live Search Input */}
            <div style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '320px' }}>
              <input
                type="text"
                placeholder="Search card title, effect, relic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 28px 6px 10px',
                  fontSize: '0.78rem',
                  color: '#FFF',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Era Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, marginRight: '4px' }}>TIMELINE:</span>
            {[
              { id: 'all', label: 'All Timelines', color: '#94A3B8' },
              { id: ERAS.SPANISH, label: 'Spanish Era (1521-1898)', color: ERA_COLORS[ERAS.SPANISH] },
              { id: ERAS.AMERICAN, label: 'American Era (1898-1946)', color: ERA_COLORS[ERAS.AMERICAN] },
              { id: ERAS.JAPANESE, label: 'Japanese Era (1942-1945)', color: ERA_COLORS[ERAS.JAPANESE] },
              { id: ERAS.MYTH, label: 'Myth & Legend', color: ERA_COLORS[ERAS.MYTH] }
            ].map(era => {
              const isActive = selectedEra === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => { sounds.btnClick(); setSelectedEra(era.id); }}
                  style={{
                    background: isActive ? `${era.color}25` : 'rgba(255, 255, 255, 0.04)',
                    border: isActive ? `1.5px solid ${era.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                    color: isActive ? era.color : '#94A3B8',
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {era.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Grid Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '6px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '12px',
          alignContent: 'start'
        }}>
          {filteredCards.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '50px 20px',
              color: '#64748B',
              fontSize: '0.9rem'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              No temporal cards match the selected filter criteria.
            </div>
          ) : (
            filteredCards.map(card => {
              const eraColor = ERA_COLORS[card.era] || '#94A3B8';
              const isSelected = inspectedCard?.id === card.id;

              return (
                <div
                  key={card.id}
                  onClick={() => { sounds.btnClick(); setInspectedCard(card); }}
                  style={{
                    background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(15, 23, 42, 0.75)',
                    border: isSelected ? '2px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {/* Card Art Thumbnail Frame */}
                  <div style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    background: '#020617',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative'
                  }}>
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '2rem' }}>{card.category === 'clue' ? '🔍' : (card.category === 'event' ? '⚡' : '⚠️')}</span>
                    )}

                    {/* Category Pin Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      left: '5px',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      background: 'rgba(0, 0, 0, 0.8)',
                      color: card.badgeColor,
                      border: `1px solid ${card.badgeColor}`,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {card.categoryLabel}
                    </div>

                    {/* Era Indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      right: '5px',
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      background: `${eraColor}30`,
                      color: eraColor,
                      border: `1px solid ${eraColor}80`,
                      padding: '1px 5px',
                      borderRadius: '3px'
                    }}>
                      {ERA_NAMES[card.era] || card.era}
                    </div>
                  </div>

                  {/* Title & Description Snippet */}
                  <div>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#F1F5F9',
                      lineHeight: 1.3,
                      marginBottom: '3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {card.title}
                    </div>
                    <div style={{
                      fontSize: '0.68rem',
                      color: '#94A3B8',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {card.description}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Card Dossier Inspector Drawer / Overlay (When a card is clicked) */}
        {inspectedCard && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.94)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 24px',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Inspector Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(56, 189, 248, 0.25)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>
                  {inspectedCard.category === 'clue' ? '🔍' : (inspectedCard.category === 'event' ? '⚡' : '⚠️')}
                </span>
                <div>
                  <div style={{ fontSize: '0.68rem', color: inspectedCard.badgeColor, fontWeight: 800, letterSpacing: '1px' }}>
                    {inspectedCard.categoryLabel.toUpperCase()} &bull; {ERA_NAMES[inspectedCard.era]?.toUpperCase()}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: '#FFF' }}>
                    {inspectedCard.title}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handlePrevCard}
                  className="editor-btn-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  title="Previous Card"
                >
                  ◀ Prev
                </button>
                <button
                  onClick={handleNextCard}
                  className="editor-btn-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  title="Next Card"
                >
                  Next ▶
                </button>
                <button
                  onClick={() => { sounds.btnClick(); setInspectedCard(null); }}
                  className="modal-close"
                  style={{ position: 'static', color: '#FFF', fontSize: '1.4rem' }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Inspector Content Layout */}
            <div style={{ flex: 1, display: 'flex', gap: '24px', overflowY: 'auto', alignItems: 'center', justifyContent: 'center' }}>
              {/* Left Column: High-Res Card Artwork Frame */}
              <div style={{
                flex: '0 0 280px',
                maxWidth: '300px',
                background: '#020617',
                borderRadius: '12px',
                border: `2px solid ${inspectedCard.badgeColor}`,
                boxShadow: `0 0 30px ${inspectedCard.badgeColor}35`,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={inspectedCard.image}
                  alt={inspectedCard.title}
                  style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '8px' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              {/* Right Column: Historical Intelligence & Rules Dossier */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '550px' }}>
                {/* Era & Type Bar */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    background: `${ERA_COLORS[inspectedCard.era]}25`,
                    color: ERA_COLORS[inspectedCard.era],
                    border: `1px solid ${ERA_COLORS[inspectedCard.era]}60`,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}>
                    {ERA_NAMES[inspectedCard.era]}
                  </span>

                  <span style={{
                    background: `${inspectedCard.badgeColor}25`,
                    color: inspectedCard.badgeColor,
                    border: `1px solid ${inspectedCard.badgeColor}60`,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}>
                    {inspectedCard.categoryLabel}
                  </span>
                </div>

                {/* Primary Gameplay Effect / Mechanics */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800, letterSpacing: '1px' }}>
                    CHRONO DIRECTIVE & GAMEPLAY EFFECT
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#F8FAFC', lineHeight: 1.5 }}>
                    {inspectedCard.description}
                  </div>
                  {inspectedCard.successMsg && (
                    <div style={{ fontSize: '0.78rem', color: '#34D399', marginTop: '4px' }}>
                      ✓ <strong>Hazard Evaded:</strong> {inspectedCard.successMsg}
                    </div>
                  )}
                  {inspectedCard.failMsg && (
                    <div style={{ fontSize: '0.78rem', color: '#F87171' }}>
                      ✗ <strong>Hazard Failure:</strong> {inspectedCard.failMsg}
                    </div>
                  )}
                </div>

                {/* Artifact Link (For Clues) */}
                {inspectedCard.artifact && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#FCD34D', fontWeight: 800 }}>
                        LINKED HISTORICAL ARTIFACT:
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#FFF', fontWeight: 700 }}>
                        {inspectedCard.artifact.name} ({inspectedCard.artifact.nickname})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#CBD5E1', marginTop: '2px' }}>
                        {inspectedCard.artifact.history || inspectedCard.artifact.significance}
                      </div>
                    </div>
                  </div>
                )}

                {/* Historical Context & Lore */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '8px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 800, letterSpacing: '1px', marginBottom: '4px' }}>
                    HISTORICAL CONTEXT & ARCHIVAL INTELLIGENCE
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#CBD5E1', lineHeight: 1.6 }}>
                    {inspectedCard.lore}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => { sounds.btnClick(); setInspectedCard(null); }}
                    style={{ padding: '8px 20px', fontSize: '0.82rem' }}
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
