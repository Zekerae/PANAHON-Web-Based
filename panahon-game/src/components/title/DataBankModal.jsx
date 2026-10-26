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

// Authentic 16-Bit Retro RPG Heraldic Tag Styles (Solid 3D Beveled Ribbons & Plaques)
const getEraRibbonStyle = (era) => {
  switch (era) {
    case ERAS.SPANISH:
      return {
        background: 'linear-gradient(180deg, #7A1A12 0%, #4D0E09 100%)',
        border: '1px solid #C2974D',
        boxShadow: 'inset 1px 1px 0 #D45B4D, inset -1px -1px 0 #280806, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#FFE8A3'
      };
    case ERAS.AMERICAN:
      return {
        background: 'linear-gradient(180deg, #1A375A 0%, #0D2038 100%)',
        border: '1px solid #C2974D',
        boxShadow: 'inset 1px 1px 0 #4A7AB5, inset -1px -1px 0 #08121E, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#E8F1FC'
      };
    case ERAS.JAPANESE:
      return {
        background: 'linear-gradient(180deg, #1C4820 0%, #0F2B12 100%)',
        border: '1px solid #C2974D',
        boxShadow: 'inset 1px 1px 0 #468A4C, inset -1px -1px 0 #08170A, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#E2F7E4'
      };
    case ERAS.MYTH:
      return {
        background: 'linear-gradient(180deg, #6B4210 0%, #3D2405 100%)',
        border: '1px solid #C2974D',
        boxShadow: 'inset 1px 1px 0 #D4892A, inset -1px -1px 0 #1A1003, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#FFD700'
      };
    default:
      return {
        background: 'linear-gradient(180deg, #3A2C21 0%, #221811 100%)',
        border: '1px solid #5A422D',
        boxShadow: 'inset 1px 1px 0 #5C432D, inset -1px -1px 0 #140E0A',
        color: '#C8B293'
      };
  }
};

const getCategoryTagStyle = (category, isDecoy) => {
  if (isDecoy) {
    return {
      background: 'linear-gradient(180deg, #3A3530 0%, #201D1A 100%)',
      border: '1px solid #7A726A',
      boxShadow: 'inset 1px 1px 0 #8A8077, inset -1px -1px 0 #100E0D, 0 1px 2px rgba(0,0,0,0.6)',
      color: '#D4CECA'
    };
  }
  switch (category) {
    case 'clue':
      return {
        background: 'linear-gradient(180deg, #5A3E1B 0%, #38240D 100%)',
        border: '1px solid #C2974D',
        boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #1E1204, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#FFD700'
      };
    case 'event':
      return {
        background: 'linear-gradient(180deg, #684214 0%, #3E2407 100%)',
        border: '1px solid #D4A045',
        boxShadow: 'inset 1px 1px 0 #FFD482, inset -1px -1px 0 #201002, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#FFE8A3'
      };
    case 'danger':
      return {
        background: 'linear-gradient(180deg, #6E1E1E 0%, #3D0D0D 100%)',
        border: '1px solid #D44D4D',
        boxShadow: 'inset 1px 1px 0 #E57A7A, inset -1px -1px 0 #200505, 0 1px 2px rgba(0,0,0,0.6)',
        color: '#FFE0E0'
      };
    default:
      return {
        background: 'linear-gradient(180deg, #3A2C21 0%, #221811 100%)',
        border: '1px solid #5A422D',
        color: '#C8B293'
      };
  }
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
        badgeColor: c.isDecoy ? '#A89885' : '#FFD700'
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
        className="modal duelyst-modal databank-modal"
        style={{
          maxWidth: '980px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          position: 'relative',
          overflow: 'hidden',
          background: '#28201A',
          border: '3px solid #C2974D',
          outline: '2px solid #140E0A',
          boxShadow: 'inset 2px 2px 0 #EBC669, inset -2px -2px 0 #7A5823, 0 20px 60px rgba(0, 0, 0, 0.95)',
          borderRadius: '6px',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '12px', borderBottom: '2px solid #5A422D' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '4px',
              background: '#32261D',
              border: '2px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem'
            }}>
              🗄️
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontFamily: 'var(--font-display)',
                letterSpacing: '2px',
                color: '#F8FAFC'
              }}>
                HISTORICAL DATA BANK
              </h2>
              <div className="databank-header-sub" style={{ fontSize: '0.74rem', color: '#C8B293', marginTop: '2px' }}>
                Archival repository of Clues, Historic Encounters, and Hazard Anomalies
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              fontSize: '0.68rem',
              color: '#FFD700',
              background: 'linear-gradient(180deg, #38281A 0%, #1F150C 100%)',
              padding: '6px 14px',
              borderRadius: '3px',
              border: '1.5px solid #C2974D',
              boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #120C06, 0 2px 3px rgba(0,0,0,0.6)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '1px',
              textShadow: '1px 1px 0 #000',
              whiteSpace: 'nowrap'
            }}>
              {filteredCards.length} RECORDS ARCHIVED
            </div>
            <button
              className="modal-close"
              onClick={() => { sounds.btnClick(); onClose(); }}
              style={{ position: 'static' }}
              title="Close Data Bank"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Filter Bar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          {/* Row 1: Category Tabs & Search Bar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                      background: isActive ? 'linear-gradient(180deg, #6B491E 0%, #462E10 100%)' : 'linear-gradient(180deg, #3A2C21 0%, #251B14 100%)',
                      border: isActive ? '2px solid #C2974D' : '2px solid #5A422D',
                      boxShadow: isActive ? 'inset 1px 1px 0 #FFD700, inset -1px -1px 0 #1E1204, 0 2px 0 #0D0906' : 'inset 1px 1px 0 #6E5239, inset -1px -1px 0 #140E0A, 0 2px 0 #0D0906',
                      color: isActive ? '#FFD700' : '#C8B293',
                      padding: '7px 14px',
                      borderRadius: '3px',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      letterSpacing: '1px',
                      textShadow: '1px 1px 0 #000',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
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
                  background: '#120D09',
                  border: '2px solid #5A422D',
                  boxShadow: 'inset 2px 2px 0 #070403, inset -1px -1px 0 #2A1D13',
                  borderRadius: '3px',
                  padding: '8px 30px 8px 12px',
                  fontSize: '0.78rem',
                  color: '#FFE082',
                  outline: 'none',
                  boxSizing: 'border-box'
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
                    color: '#C2974D',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Era Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#C2974D', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '1px', textShadow: '1px 1px 0 #000', marginRight: '4px' }}>
              TIMELINE:
            </span>
            {[
              { id: 'all', label: 'All Timelines' },
              { id: ERAS.SPANISH, label: 'Spanish Era (1521-1898)' },
              { id: ERAS.AMERICAN, label: 'American Era (1898-1946)' },
              { id: ERAS.JAPANESE, label: 'Japanese Era (1942-1945)' },
              { id: ERAS.MYTH, label: 'Myth & Legend' }
            ].map(era => {
              const isActive = selectedEra === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => { sounds.btnClick(); setSelectedEra(era.id); }}
                  style={{
                    background: isActive ? 'linear-gradient(180deg, #6B491E 0%, #462E10 100%)' : 'linear-gradient(180deg, #2D2118 0%, #1A130E 100%)',
                    border: isActive ? '2px solid #C2974D' : '1.5px solid #4D3725',
                    boxShadow: isActive ? 'inset 1px 1px 0 #FFD700, inset -1px -1px 0 #1E1204, 0 2px 0 #0A0704' : 'inset 1px 1px 0 #4D3725, inset -1px -1px 0 #0D0906, 0 2px 0 #0A0704',
                    color: isActive ? '#FFD700' : '#A89885',
                    padding: '5px 12px',
                    borderRadius: '3px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    textShadow: '1px 1px 0 #000',
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
              color: '#A89885',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-display)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
              No historical records match the selected filter criteria.
            </div>
          ) : (
            filteredCards.map(card => {
              const isSelected = inspectedCard?.id === card.id;

              return (
                <div
                  key={card.id}
                  onClick={() => { sounds.btnClick(); setInspectedCard(card); }}
                  style={{
                    background: isSelected ? '#2D2218' : '#1C1510',
                    border: isSelected ? '2px solid #FFD700' : '2px solid #3A2C21',
                    borderRadius: '4px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'transform 0.15s ease',
                    boxShadow: isSelected
                      ? 'inset 1px 1px 0 #FFE082, inset -1px -1px 0 #140E0A, 0 0 0 2px #5A3F18'
                      : 'inset 2px 2px 0 #0E0A07, inset -1px -1px 0 #4A3828'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = '#C2974D';
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = '#3A2C21';
                      e.currentTarget.style.boxShadow = 'inset 2px 2px 0 #0E0A07, inset -1px -1px 0 #4A3828';
                    }
                  }}
                >
                  {/* Card Art Thumbnail Frame (Clean, pristine presentation without floating sticker tags) */}
                  <div style={{
                    width: '100%',
                    height: '145px',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    background: '#100C09',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #2F231A',
                    boxShadow: 'inset 1px 1px 0 #070503, inset -1px -1px 0 #1E150E',
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
                  </div>

                  {/* Authentic Heraldic Label Tag Bar (Solid Beveled Ribbons, neatly integrated below the art) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '4px',
                    marginTop: '2px'
                  }}>
                    {/* Category Label Tag */}
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      fontFamily: 'var(--font-display)',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      textShadow: '1px 1px 0 #000',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      ...getCategoryTagStyle(card.category, card.isDecoy)
                    }}>
                      {card.categoryLabel}
                    </span>

                    {/* Era Ribbon Tag */}
                    <span style={{
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      textShadow: '1px 1px 0 #000',
                      whiteSpace: 'nowrap',
                      ...getEraRibbonStyle(card.era)
                    }}>
                      {ERA_NAMES[card.era] || card.era}
                    </span>
                  </div>

                  {/* Title & Description Snippet */}
                  <div style={{ marginTop: '2px' }}>
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#FFF',
                      lineHeight: 1.3,
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: 'var(--font-display)',
                      textShadow: '1px 1px 0 #000'
                    }}>
                      {card.title}
                    </div>
                    <div style={{
                      fontSize: '0.68rem',
                      color: '#C8B293',
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
            background: '#201712',
            border: '3px solid #C2974D',
            outline: '2px solid #140E0A',
            boxShadow: 'inset 2px 2px 0 #EBC669, inset -2px -2px 0 #7A5823, 0 10px 40px rgba(0,0,0,0.95)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 24px',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease',
            boxSizing: 'border-box'
          }}>
            {/* Inspector Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #5A422D', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>
                  {inspectedCard.category === 'clue' ? '🔍' : (inspectedCard.category === 'event' ? '⚡' : '⚠️')}
                </span>
                <div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      padding: '2px 8px',
                      borderRadius: '2px',
                      textShadow: '1px 1px 0 #000',
                      ...getCategoryTagStyle(inspectedCard.category, inspectedCard.isDecoy)
                    }}>
                      {inspectedCard.categoryLabel.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      padding: '2px 8px',
                      borderRadius: '2px',
                      textShadow: '1px 1px 0 #000',
                      ...getEraRibbonStyle(inspectedCard.era)
                    }}>
                      {ERA_NAMES[inspectedCard.era]?.toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: '#FFF', textShadow: '1px 1px 0 #000' }}>
                    {inspectedCard.title}
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handlePrevCard}
                  className="editor-btn-sm"
                  style={{
                    background: 'linear-gradient(180deg, #3A2C21 0%, #251B14 100%)',
                    border: '2px solid #C2974D',
                    boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #1A120B, 0 2px 0 #140E0A',
                    color: '#FFD700',
                    padding: '5px 12px',
                    borderRadius: '3px',
                    fontFamily: 'var(--font-display)',
                    textShadow: '1px 1px 0 #000',
                    cursor: 'pointer'
                  }}
                  title="Previous Card"
                >
                  ◀ Prev
                </button>
                <button
                  onClick={handleNextCard}
                  className="editor-btn-sm"
                  style={{
                    background: 'linear-gradient(180deg, #3A2C21 0%, #251B14 100%)',
                    border: '2px solid #C2974D',
                    boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #1A120B, 0 2px 0 #140E0A',
                    color: '#FFD700',
                    padding: '5px 12px',
                    borderRadius: '3px',
                    fontFamily: 'var(--font-display)',
                    textShadow: '1px 1px 0 #000',
                    cursor: 'pointer'
                  }}
                  title="Next Card"
                >
                  Next ▶
                </button>
                <button
                  onClick={() => { sounds.btnClick(); setInspectedCard(null); }}
                  className="modal-close"
                  style={{
                    position: 'static',
                    color: '#FFD700',
                    fontSize: '1.4rem',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '3px',
                    background: '#3A2C21',
                    border: '2px solid #C2974D',
                    boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #1A120B, 0 2px 0 #140E0A',
                    cursor: 'pointer'
                  }}
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
                background: '#120D09',
                borderRadius: '4px',
                border: '2px solid #C2974D',
                boxShadow: 'inset 2px 2px 0 #0A0705, 0 4px 12px rgba(0, 0, 0, 0.8)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={inspectedCard.image}
                  alt={inspectedCard.title}
                  style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '4px' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              {/* Right Column: Historical Intelligence & Rules Dossier */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '550px' }}>
                {/* Era & Type Bar (Solid Beveled Ribbons) */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '3px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    textShadow: '1px 1px 0 #000',
                    ...getEraRibbonStyle(inspectedCard.era)
                  }}>
                    {ERA_NAMES[inspectedCard.era]}
                  </span>

                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '3px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    textShadow: '1px 1px 0 #000',
                    ...getCategoryTagStyle(inspectedCard.category, inspectedCard.isDecoy)
                  }}>
                    {inspectedCard.categoryLabel}
                  </span>
                </div>

                {/* Primary Gameplay Effect / Mechanics */}
                <div style={{
                  background: '#1A130E',
                  border: '2px solid #5A422D',
                  boxShadow: 'inset 2px 2px 0 #0E0A07',
                  borderRadius: '4px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#FFD700', fontWeight: 800, letterSpacing: '1px', fontFamily: 'var(--font-display)', textShadow: '1px 1px 0 #000' }}>
                    CHRONO DIRECTIVE & GAMEPLAY EFFECT
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#F1E3D3', lineHeight: 1.5 }}>
                    {inspectedCard.description}
                  </div>
                  {inspectedCard.successMsg && (
                    <div style={{ fontSize: '0.78rem', color: '#34D399', marginTop: '4px', textShadow: '1px 1px 0 #000' }}>
                      ✓ <strong>Hazard Evaded:</strong> {inspectedCard.successMsg}
                    </div>
                  )}
                  {inspectedCard.failMsg && (
                    <div style={{ fontSize: '0.78rem', color: '#F87171', textShadow: '1px 1px 0 #000' }}>
                      ✗ <strong>Hazard Failure:</strong> {inspectedCard.failMsg}
                    </div>
                  )}
                </div>

                {/* Artifact Link (For Clues) */}
                {inspectedCard.artifact && (
                  <div style={{
                    background: '#251B12',
                    border: '2px solid #C2974D',
                    boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #5C3E16',
                    borderRadius: '4px',
                    padding: '12px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#FFD700', fontWeight: 800, fontFamily: 'var(--font-display)', textShadow: '1px 1px 0 #000' }}>
                        LINKED HISTORICAL ARTIFACT:
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#FFF', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                        {inspectedCard.artifact.name} ({inspectedCard.artifact.nickname})
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#C8B293', marginTop: '2px' }}>
                        {inspectedCard.artifact.history || inspectedCard.artifact.significance}
                      </div>
                    </div>
                  </div>
                )}

                {/* Historical Context & Lore */}
                <div style={{
                  background: '#17110C',
                  border: '1.5px solid #4A3522',
                  boxShadow: 'inset 2px 2px 0 #0A0705',
                  borderRadius: '4px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: '#FFD700', fontWeight: 800, letterSpacing: '1px', marginBottom: '4px', fontFamily: 'var(--font-display)', textShadow: '1px 1px 0 #000' }}>
                    HISTORICAL CONTEXT & ARCHIVAL INTELLIGENCE
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#C8B293', lineHeight: 1.6 }}>
                    {inspectedCard.lore}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => { sounds.btnClick(); setInspectedCard(null); }}
                    style={{
                      padding: '8px 24px',
                      fontSize: '0.82rem',
                      background: 'linear-gradient(180deg, #5A3E1B 0%, #38240D 100%)',
                      border: '2px solid #C2974D',
                      boxShadow: 'inset 1px 1px 0 #EBD07D, inset -1px -1px 0 #1A120B, 0 3px 0 #140E0A',
                      color: '#FFD700',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      textShadow: '1px 1px 0 #000',
                      cursor: 'pointer'
                    }}
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
