// ===== PANAHON: CHRONO SHIFT - Game Data =====

export const ERAS = {
  SPANISH: 'spanish',
  AMERICAN: 'american',
  JAPANESE: 'japanese',
  MYTH: 'myth'
};

export const ERA_NAMES = {
  [ERAS.SPANISH]: 'Spanish Era',
  [ERAS.AMERICAN]: 'American Era',
  [ERAS.JAPANESE]: 'Japanese Era',
  [ERAS.MYTH]: 'Myth/Legend Era'
};

export const ERA_ORDER = [ERAS.SPANISH, ERAS.AMERICAN, ERAS.JAPANESE, ERAS.MYTH];

export const TILE_TYPES = {
  START: 'start',
  CLUE: 'clue',
  EVENT: 'event',
  DANGER: 'danger',
  ARTIFACT: 'artifact',
  TIMEGATE: 'timegate',
  PARADOX: 'paradox',
  EMPTY: 'empty'
};

// Tile layout for each era (20 spaces forming a continuous road loop)
export const ERA_TILE_LAYOUTS = {
  [ERAS.SPANISH]: [
    'start', 'clue', 'event', 'clue', 'danger',
    'clue', 'empty', 'artifact', 'empty', 'clue',
    'clue', 'event', 'clue', 'clue', 'danger',
    'clue', 'paradox', 'timegate', 'event', 'clue'
  ],
  [ERAS.AMERICAN]: [
    'start', 'clue', 'event', 'clue', 'danger',
    'clue', 'empty', 'clue', 'clue', 'timegate',
    'clue', 'event', 'danger', 'empty', 'artifact',
    'clue', 'empty', 'paradox', 'event', 'clue'
  ],
  [ERAS.JAPANESE]: [
    'start', 'clue', 'danger', 'clue', 'event',
    'artifact', 'empty', 'clue', 'event', 'timegate',
    'clue', 'empty', 'clue', 'danger', 'clue',
    'clue', 'paradox', 'event', 'clue', 'clue'
  ],
  [ERAS.MYTH]: [
    'start', 'event', 'clue', 'clue', 'danger',
    'clue', 'artifact', 'clue', 'event', 'empty',
    'paradox', 'clue', 'empty', 'timegate', 'clue',
    'clue', 'event', 'danger', 'clue', 'clue'
  ]
};

// Percentage coordinates (0-100%) precisely positioned along the winding roads of Full Map.png
export const ERA_TILE_COORDINATES = {
  [ERAS.SPANISH]: [
    { x: 15.6, y: 19.6 },  // 0 start (Village Gateway near red roof house)
    { x: 11.2, y: 18.3 },  // 1 clue (Road turning left)
    { x: 7.3, y: 22.9 },  // 2 event (Western road descending)
    { x: 6.3, y: 30.1 },  // 3 clue (Western road)
    { x: 6.8, y: 35.9 },  // 4 danger (Western road lower stretch)
    { x: 9.3, y: 40.5 },  // 5 clue (Bottom-left corner curve)
    { x: 13.7, y: 39.9 },  // 6 empty (Road curving east under terraced garden)
    { x: 18.1, y: 37.9 },  // 7 artifact (Terraced garden southern trail)
    { x: 21.5, y: 33.3 },  // 8 empty (Road east curve around garden)
    { x: 22.5, y: 26.8 },  // 9 clue (Road heading north)
    { x: 23.4, y: 20.9 },  // 10 clue (Rising towards top junction)
    { x: 27.3, y: 19.0 },  // 11 event (Top highway past northern house)
    { x: 32.2, y: 18.3 },  // 12 clue (Top highway ridge)
    { x: 37.1, y: 19.0 },  // 13 clue (Top highway curve)
    { x: 41.5, y: 24.2 },  // 14 danger (Descending southeast avenue)
    { x: 44.4, y: 31.4 },  // 15 clue (Avenue heading to nexus)
    { x: 46.4, y: 38.6 },  // 16 paradox (Avenue approaching nexus)
    { x: 47.9, y: 46.4 },  // 17 timegate (Central Nexus NW bridge entrance!)
    { x: 43.5, y: 34.6 },  // 18 event (Ascending avenue return)
    { x: 33.2, y: 19.0 }   // 19 clue (Returning highway link to start)
  ],
  [ERAS.AMERICAN]: [
    { x: 93.3, y: 18.3 },  // 0 start (Circular landing pad)
    { x: 90.3, y: 26.8 },  // 1 clue (Highway descending south)
    { x: 86.9, y: 34.0 },  // 2 event (Following eastern highway down)
    { x: 82.5, y: 36.6 },  // 3 clue (Curving southwest along highway)
    { x: 77.6, y: 36.6 },  // 4 danger (Passing above southern house)
    { x: 72.3, y: 35.3 },  // 5 clue (Highway stretch)
    { x: 66.4, y: 34.6 },  // 6 empty (Highway heading towards nexus)
    { x: 61.0, y: 34.6 },  // 7 clue (Highway pass)
    { x: 55.2, y: 37.3 },  // 8 clue (Approaching Nexus entrance)
    { x: 51.3, y: 44.4 },  // 9 timegate (Central Nexus NE entrance!)
    { x: 56.2, y: 36.6 },  // 10 clue (Ascending northeast)
    { x: 59.6, y: 28.1 },  // 11 event (North branch)
    { x: 64.0, y: 22.9 },  // 12 danger (Upper highway top curve)
    { x: 69.3, y: 20.9 },  // 13 empty (Upper highway curve)
    { x: 75.2, y: 21.6 },  // 14 artifact (Upper highway radar installation)
    { x: 81.1, y: 24.2 },  // 15 clue (Curving east)
    { x: 85.0, y: 30.7 },  // 16 empty (East curve around oval)
    { x: 83.0, y: 36.6 },  // 17 paradox (East-south curve around oval)
    { x: 77.1, y: 35.3 },  // 18 event (Inner highway pass)
    { x: 87.4, y: 24.8 }   // 19 clue (Connecting back to Landing Pad!)
  ],
  [ERAS.JAPANESE]: [
    { x: 10.3, y: 91.5 },  // 0 start (Glowing Red Beacon!)
    { x: 16.6, y: 93.5 },  // 1 clue (Wide dirt road along south edge)
    { x: 23.4, y: 92.8 },  // 2 danger (South road)
    { x: 30.3, y: 92.2 },  // 3 clue (South road)
    { x: 36.1, y: 90.8 },  // 4 event (South road curve)
    { x: 41.5, y: 88.9 },  // 5 artifact (Southeast corner shrine)
    { x: 44.4, y: 81.0 },  // 6 empty (Eastern road heading north)
    { x: 44.4, y: 72.5 },  // 7 clue (Eastern road)
    { x: 43.0, y: 64.7 },  // 8 event (Eastern road turning to Nexus)
    { x: 47.4, y: 54.9 },  // 9 timegate (Central Nexus SW bridge!)
    { x: 41.0, y: 62.7 },  // 10 clue (Top road heading west)
    { x: 33.7, y: 61.4 },  // 11 empty (Top road under hangar)
    { x: 25.9, y: 60.1 },  // 12 clue (Top road)
    { x: 18.1, y: 59.5 },  // 13 danger (Top road curve)
    { x: 11.2, y: 60.1 },  // 14 clue (Top-left corner)
    { x: 9.3, y: 67.3 },  // 15 clue (Western road descending)
    { x: 9.3, y: 74.5 },  // 16 paradox (Western road outpost)
    { x: 9.3, y: 81.7 },  // 17 event (Western road)
    { x: 9.3, y: 87.6 },  // 18 clue (Western road near beacon)
    { x: 9.8, y: 90.8 }   // 19 clue (Returning to Beacon!)
  ],
  [ERAS.MYTH]: [
    { x: 89.4, y: 56.2 },  // 0 start (Torii Gate Shrine!)
    { x: 86.9, y: 64.7 },  // 1 event (Descending south)
    { x: 85.4, y: 73.2 },  // 2 clue (Eastern ridge path)
    { x: 84.0, y: 82.4 },  // 3 clue (Eastern ridge path)
    { x: 80.6, y: 89.5 },  // 4 danger (Southeast terrace)
    { x: 74.7, y: 93.5 },  // 5 clue (South terrace near pink flower)
    { x: 68.8, y: 94.8 },  // 6 artifact (Glowing Spirit Tree grove)
    { x: 62.5, y: 94.8 },  // 7 clue (South terrace)
    { x: 56.6, y: 93.5 },  // 8 event (South terrace near blue rune)
    { x: 51.8, y: 88.9 },  // 9 empty (Curving under fiery tree)
    { x: 48.8, y: 81.0 },  // 10 paradox (West terrace ascending)
    { x: 47.9, y: 71.9 },  // 11 clue (Past cyan pool)
    { x: 48.8, y: 62.7 },  // 12 empty (Approaching nexus)
    { x: 51.3, y: 54.9 },  // 13 timegate (Central Nexus SE bridge!)
    { x: 55.7, y: 53.6 },  // 14 clue (Path heading east under sakura)
    { x: 61.0, y: 53.6 },  // 15 clue (Path under sakura)
    { x: 66.9, y: 54.2 },  // 16 event (Northern trail)
    { x: 72.8, y: 54.9 },  // 17 danger (Trail under second sakura)
    { x: 78.6, y: 55.6 },  // 18 clue (Trail towards Torii)
    { x: 84.5, y: 55.9 }   // 19 clue (Torii platform entrance)
  ]
};


// Roles
export const ROLES = {
  HISTORIAN: {
    id: 'historian',
    name: 'The Historian',
    description: 'Master of historical knowledge',
    avatar: 'assets/Characters/Copy of librarian.png',
    color: '#E74C3C',
    passive: {
      name: 'Decoy Discard',
      description: 'Discard a drawn Decoy Card (2 Turn CD)',
      cooldown: 2
    },
    active: {
      name: 'Clue Decipher',
      description: 'Look at the top 3 cards on the Clue Deck, keep 1, and shuffle the rest (3 Turn CD, 2 Energy Cost)',
      cooldown: 3,
      energyCost: 2
    }
  },
  EXPLORER: {
    id: 'explorer',
    name: 'The Explorer',
    description: 'Thrives on movement and discovery',
    avatar: 'assets/Characters/Copy of adventurer.png',
    color: '#3498DB',
    passive: {
      name: 'Chrono-Stride',
      description: 'Reduced Time Gate travel cost to 1 Energy',
      cooldown: 0 // Always active
    },
    active: {
      name: 'Momentum',
      description: 'Pause movement to interact with a tile, then continue moving remaining rolled spaces (2 Turn CD, 2 Energy Cost)',
      cooldown: 2,
      energyCost: 2
    }
  },
  GUARDIAN: {
    id: 'guardian',
    name: 'The Guardian',
    description: 'Protects timeline stability',
    avatar: 'assets/Characters/Copy of guardian.jpg',
    color: '#2ECC71',
    passive: {
      name: 'Aegis Shield',
      description: 'Reduce any Hazard/Danger Card penalty by 1',
      cooldown: 0
    },
    active: {
      name: 'Temporal Repair',
      description: 'Reduce Paradox Meter by 1 and reduce 2 Energy or restore 1 Energy (3 Turn CD)',
      cooldown: 3,
      energyCost: 0 // variable
    }
  },
  STRATEGIST: {
    id: 'strategist',
    name: 'The Strategist',
    description: 'Manipulates resources and controls spaces',
    avatar: 'assets/Characters/Copy of strategist.png',
    color: '#F39C12',
    passive: {
      name: 'Trap Mastery',
      description: '+1 Energy when someone triggers your Trap',
      cooldown: 0
    },
    active: {
      name: 'Temporal Trap',
      description: 'Plant a Trap (Danger Tile) in your current tile (2 Turn CD, 2 Energy Cost)',
      cooldown: 2,
      energyCost: 2
    }
  }
};

export const ROLE_ORDER = ['HISTORIAN', 'EXPLORER', 'GUARDIAN', 'STRATEGIST'];

// Artifacts (16 total, 4 per era)
export const ARTIFACTS = {
  [ERAS.SPANISH]: [
    {
      id: 'sp_coin',
      name: '1732 Silver Dos Mundos',
      nickname: 'Barya ng OG',
      category: 'Currency',
      era: ERAS.SPANISH,
      image: 'assets/Artifacts/Png/spanish_coin.png',
      cardImage: 'assets/Cards/Artifact Card/1.png'
    },
    {
      id: 'sp_map',
      name: '1734 Murillo Velarde Map',
      nickname: 'The Philippine Poneglyph',
      category: 'Map',
      era: ERAS.SPANISH,
      image: 'assets/Artifacts/Png/spanish_murillo_map.png',
      cardImage: 'assets/Cards/Artifact Card/2.png'
    },
    {
      id: 'sp_vase',
      name: 'Salvaged Ming Porcelain Cargo',
      nickname: 'Treasure Vase of the Deep Sea',
      category: 'Vessel',
      era: ERAS.SPANISH,
      image: 'assets/Artifacts/Png/spanish_porcelain_Vase.png',
      cardImage: 'assets/Cards/Artifact Card/3.png'
    },
    {
      id: 'sp_medallion',
      name: 'Gintong Relicario ng Intramuros',
      nickname: '18 carat gold',
      category: 'Medallion',
      era: ERAS.SPANISH,
      image: 'assets/Artifacts/Png/spanish_medallion.png',
      cardImage: 'assets/Cards/Artifact Card/4.png'
    }
  ],
  [ERAS.AMERICAN]: [
    {
      id: 'am_typewriter',
      name: "Quezon's Underwood No. 5 Typewriter",
      nickname: 'The Executive Order',
      category: 'Device',
      era: ERAS.AMERICAN,
      image: 'assets/Artifacts/Png/english_typewritter.png',
      cardImage: 'assets/Cards/Artifact Card/5.png'
    },
    {
      id: 'am_paper',
      name: 'El Renacimiento "Aves de Rapiña"',
      nickname: 'Pahina ng Tadhana',
      category: 'Document',
      era: ERAS.AMERICAN,
      image: 'assets/Artifacts/Png/english_renacimiento_paper.png',
      cardImage: 'assets/Cards/Artifact Card/6.png'
    },
    {
      id: 'am_telephone',
      name: '1905 Kellogg Magneto Telephone',
      nickname: 'Ang teleponong walang private Chat',
      category: 'Communication',
      era: ERAS.AMERICAN,
      image: 'assets/Artifacts/Png/english_telephone.png',
      cardImage: 'assets/Cards/Artifact Card/7.png'
    },
    {
      id: 'am_cargo',
      name: 'Manila Port Sealed Cargo',
      nickname: 'Kargamentong Selyado',
      category: 'Cargo',
      era: ERAS.AMERICAN,
      image: 'assets/Artifacts/Png/englisg_ratified_draft.png',
      cardImage: 'assets/Cards/Artifact Card/8.png'
    }
  ],
  [ERAS.JAPANESE]: [
    {
      id: 'jp_marker',
      name: 'Kilometer 0 Death March Marker',
      nickname: 'Ruta ng Matatapang',
      category: 'Memorial',
      era: ERAS.JAPANESE,
      image: 'assets/Artifacts/Png/japanese_wooden_marker.png',
      cardImage: 'assets/Cards/Artifact Card/9.png'
    },
    {
      id: 'jp_belt',
      name: 'Senninbari Thousand-Stitch Belt',
      nickname: 'Ang belt na hand made',
      category: 'Wearable',
      era: ERAS.JAPANESE,
      image: 'assets/Artifacts/Png/japanese_beltnijester.png',
      cardImage: 'assets/Cards/Artifact Card/10.png'
    },
    {
      id: 'jp_radio',
      name: 'SCR-300 Guerrilla Transceiver',
      nickname: 'Radyo ng Katipunan',
      category: 'Device',
      era: ERAS.JAPANESE,
      image: 'assets/Artifacts/Png/japanese_guerrilla_backpack.png',
      cardImage: 'assets/Cards/Artifact Card/11.png'
    },
    {
      id: 'jp_litter',
      name: 'Capas Camp "Doongan" Litter',
      nickname: 'Bamboo Express',
      category: 'Transport',
      era: ERAS.JAPANESE,
      image: 'assets/Artifacts/Png/japanese_doongan_litter.png',
      cardImage: 'assets/Cards/Artifact Card/12.png'
    }
  ],
  [ERAS.MYTH]: [
    {
      id: 'my_bulul',
      name: 'Cordillera Bulul Rice Guardian',
      nickname: 'The rice security guard',
      category: 'Idol',
      era: ERAS.MYTH,
      image: 'assets/Artifacts/Png/myth_cordillera_bulul.png',
      cardImage: 'assets/Cards/Artifact Card/13.png'
    },
    {
      id: 'my_agimat',
      name: 'Batu-Balani Agimat',
      nickname: 'kwintas ni ravillas',
      category: 'Amulet',
      era: ERAS.MYTH,
      image: 'assets/Artifacts/Png/myth_batubalani_agimat.png',
      cardImage: 'assets/Cards/Artifact Card/14.png'
    },
    {
      id: 'my_comb',
      name: "Sudludan ni Maria Makiling",
      nickname: 'Suklay ni diwata',
      category: 'Enchanted Item',
      era: ERAS.MYTH,
      image: 'assets/Artifacts/Png/myth_kamagong_comb.png',
      cardImage: 'assets/Cards/Artifact Card/15.png'
    },
    {
      id: 'my_kris',
      name: 'Kris ng Datu',
      nickname: "Lothar's Edge",
      category: 'Weapon',
      era: ERAS.MYTH,
      image: 'assets/Artifacts/Png/myth_knife.png',
      cardImage: 'assets/Cards/Artifact Card/16.png'
    }
  ]
};

// All artifacts flattened
export const ALL_ARTIFACTS = Object.values(ARTIFACTS).flat();

// Clue card images mapping: 48 clue cards + 20 decoy cards = 68 total
// Cards 1-48 are clue cards (organized: 1-12 Spanish, 13-24 American, 25-36 Japanese, 37-48 Myth)
// Decoy cards use remaining numbers
export function getClueCardImage(cardIndex) {
  return `assets/Cards/Clue Cards/${cardIndex}.png`;
}

// Generate clue cards data
export function generateClueCards() {
  const clueCards = [];
  const eras = [ERAS.SPANISH, ERAS.AMERICAN, ERAS.JAPANESE, ERAS.MYTH];

  eras.forEach((era, eraIdx) => {
    const eraArtifacts = ARTIFACTS[era];
    // 3 clues per artifact x 4 artifacts = 12 artifact clues per era
    eraArtifacts.forEach((artifact, artIdx) => {
      for (let c = 0; c < 3; c++) {
        const cardNum = eraIdx * 12 + artIdx * 3 + c + 1;
        clueCards.push({
          id: `clue_${era}_${artIdx}_${c}`,
          type: 'clue',
          era: era,
          artifactId: artifact.id,
          isDecoy: false,
          image: getClueCardImage(cardNum),
          description: `Clue about ${artifact.name}`
        });
      }
    });

    // 5 decoy cards per era
    for (let d = 0; d < 5; d++) {
      const decoyNum = d + 1;
      clueCards.push({
        id: `decoy_${era}_${d}`,
        type: 'decoy',
        era: era,
        artifactId: null,
        isDecoy: true,
        image: `assets/Cards/Decoy Cards/${eraIdx * 4 + decoyNum}.png`,
        description: 'Decoy - This clue leads nowhere!'
      });
    }
  });

  return clueCards;
}

// Event Cards
export const EVENT_CARDS = {
  [ERAS.SPANISH]: [
    {
      id: 'evt_sp_1',
      name: 'Galleon Trade Arrival',
      description: 'Gains 2 energy and draws 1 Clue Card.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/1.png',
      effect: (player, game) => {
        game.modifyEnergy(player, 2);
        game.drawClueCard(player);
        return 'Gained 2 Energy and drew 1 Clue Card!';
      }
    },
    {
      id: 'evt_sp_2',
      name: 'Fiesta Celebration',
      description: 'Gains 1 energy and reduces individual paradox meter by 1.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/2.png',
      effect: (player, game) => {
        game.modifyEnergy(player, 1);
        game.modifyParadox(player, -1);
        return 'Gained 1 Energy and reduced Paradox by 1!';
      }
    },
    {
      id: 'evt_sp_3',
      name: 'Secret Propaganda Network',
      description: 'Trade 1 Clue Card with any player or move to any adjacent Time Gate space.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/3.png',
      effect: (player, game) => {
        game.offerChoice(player, 'Secret Propaganda Network', [
          { label: 'Trade a Clue Card', action: 'tradeClue' },
          { label: 'Move to Time Gate', action: 'moveToTimeGate' }
        ]);
        return 'Choose: Trade a Clue or move to a Time Gate!';
      }
    },
    {
      id: 'evt_sp_4',
      name: 'Sanctuary in Intramuros',
      description: 'Protected from the next Danger Card drawn.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/4.png',
      effect: (player, game) => {
        player.shielded = true;
        return 'You are protected from the next Danger Card!';
      }
    },
    {
      id: 'evt_sp_5',
      name: 'Temporal Occurrence!',
      description: 'For the next 2 turns, players draw from any era randomly on Clue, Event, or Danger tiles.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/5.png',
      effect: (player, game) => {
        game.activateTemporalOccurrence(2);
        return 'Temporal Disturbance! Drawing from random eras for 2 rounds!';
      }
    }
  ],
  [ERAS.AMERICAN]: [
    {
      id: 'evt_am_1',
      name: 'Telegraph Message',
      description: 'Immediately look at the top 3 Clue Cards in the deck.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/6.png',
      effect: (player, game) => {
        game.peekClueCards(player, 3);
        return 'Peeked at top 3 Clue Cards!';
      }
    },
    {
      id: 'evt_am_2',
      name: 'Railroad Express',
      description: 'Move up to 4 extra spaces forward without consuming energy.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/7.png',
      effect: (player, game) => {
        player.bonusMoves = 4;
        return 'You can move 4 extra spaces!';
      }
    },
    {
      id: 'evt_am_3',
      name: 'Thomasite School Grant',
      description: 'Gains 2 energy.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/8.png',
      effect: (player, game) => {
        game.modifyEnergy(player, 2);
        return 'Gained 2 Energy!';
      }
    },
    {
      id: 'evt_am_4',
      name: 'Manila Port Shipments',
      description: 'Gains 1 point and recovers 1 energy.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/9.png',
      effect: (player, game) => {
        player.points += 1;
        game.modifyEnergy(player, 1);
        return 'Gained 1 Point and 1 Energy!';
      }
    },
    {
      id: 'evt_am_5',
      name: 'Temporal Occurrence!',
      description: 'For the next 2 turns, players draw from any era randomly on Clue, Event, or Danger tiles.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/10.png',
      effect: (player, game) => {
        game.activateTemporalOccurrence(2);
        return 'Temporal Disturbance! Drawing from random eras for 2 rounds!';
      }
    }
  ],
  [ERAS.JAPANESE]: [
    {
      id: 'evt_jp_1',
      name: 'Guerrilla Intelligence',
      description: 'Draw 1 Artifact Card or Clue Card of your choice from the current era.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/11.png',
      effect: (player, game) => {
        game.offerChoice(player, 'Guerrilla Intelligence', [
          { label: 'Draw Clue Card', action: 'drawClue' },
          { label: 'View Artifact', action: 'viewArtifact' }
        ]);
        return 'Choose: Draw a Clue or view an Artifact!';
      }
    },
    {
      id: 'evt_jp_2',
      name: 'Radio Broadcast',
      description: 'Decreases the Timeline Meter by 1.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/12.png',
      effect: (player, game) => {
        game.modifyTimelineMeter(-1);
        return 'Timeline Meter decreased by 1!';
      }
    },
    {
      id: 'evt_jp_3',
      name: 'Hidden Cache Supply',
      description: 'Gains 3 energy.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/13.png',
      effect: (player, game) => {
        game.modifyEnergy(player, 3);
        return 'Gained 3 Energy!';
      }
    },
    {
      id: 'evt_jp_4',
      name: 'Underground Safehouse',
      description: 'Skip next turn to fully restore energy to 10.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/14.png',
      effect: (player, game) => {
        player.skipNextTurn = true;
        player.energy = 10;
        return 'Energy fully restored to 10! (Skip next turn)';
      }
    },
    {
      id: 'evt_jp_5',
      name: 'Temporal Occurrence!',
      description: 'For the next 2 turns, players draw from any era randomly on Clue, Event, or Danger tiles.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/15.png',
      effect: (player, game) => {
        game.activateTemporalOccurrence(2);
        return 'Temporal Disturbance! Drawing from random eras for 2 rounds!';
      }
    }
  ],
  [ERAS.MYTH]: [
    {
      id: 'evt_my_1',
      name: "Diwata's Blessing",
      description: 'Gains 2 energy and reduces individual paradox meter by 2.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/16.png',
      effect: (player, game) => {
        game.modifyEnergy(player, 2);
        game.modifyParadox(player, -2);
        return 'Gained 2 Energy and reduced Paradox by 2!';
      }
    },
    {
      id: 'evt_my_2',
      name: 'Anito Guidance',
      description: 'Teleport to any tile within the Myth/Legend timeline.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/16.png',
      effect: (player, game) => {
        game.offerTeleport(player, ERAS.MYTH);
        return 'Teleport to any tile in the Myth/Legend timeline!';
      }
    },
    {
      id: 'evt_my_3',
      name: 'Enchanted Healing Spring',
      description: 'Restores 3 energy to all players in this timeline.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/16.png',
      effect: (player, game) => {
        game.healAllInEra(ERAS.MYTH, 3);
        return 'All players in Myth era restored 3 Energy!';
      }
    },
    {
      id: 'evt_my_4',
      name: 'Ancient Relic Harmony',
      description: 'Decreases the Timeline Meter by 1.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/16.png',
      effect: (player, game) => {
        game.modifyTimelineMeter(-1);
        return 'Timeline Meter decreased by 1!';
      }
    },
    {
      id: 'evt_my_5',
      name: 'Temporal Occurrence!',
      description: 'For the next 2 turns, players draw from any era randomly on Clue, Event, or Danger tiles.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/16.png',
      effect: (player, game) => {
        game.activateTemporalOccurrence(2);
        return 'Temporal Disturbance! Drawing from random eras for 2 rounds!';
      }
    }
  ]
};

// Danger Cards
export const DANGER_CARDS = {
  [ERAS.SPANISH]: [
    {
      id: 'dng_sp_1',
      name: 'Volcano Eruption',
      nickname: 'Bulkang Galit',
      description: 'Roll a die: even number = escape, otherwise move 3 spaces backward.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Danger Cards/1.png',
      check: (roll) => roll % 2 === 0,
      successMsg: 'You escaped the eruption safely!',
      failMsg: 'The eruption forces you back 3 spaces!',
      failEffect: (player, game) => { game.movePlayer(player, -3); }
    },
    {
      id: 'dng_sp_2',
      name: 'Pirate Raid',
      nickname: 'Tulisan sa Dagat',
      description: 'Roll a die: higher than 3 = fend off pirates, otherwise lose 2 points.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Danger Cards/2.png',
      check: (roll) => roll > 3,
      successMsg: 'You fended off the pirates!',
      failMsg: 'Pirates plundered your supplies! Lost 2 points.',
      failEffect: (player) => { player.points -= 2; }
    },
    {
      id: 'dng_sp_3',
      name: 'Guardia Civil Patrol',
      nickname: 'Huli ka, indio!',
      description: 'Roll a die: odd number = blend in, otherwise skip your turn.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Danger Cards/3.png',
      check: (roll) => roll % 2 !== 0,
      successMsg: 'You blended into the crowd!',
      failMsg: 'Caught by Guardia Civil! Skip your next turn.',
      failEffect: (player) => { player.skipNextTurn = true; }
    },
    {
      id: 'dng_sp_4',
      name: 'Tropical Storm',
      nickname: 'Bagyong Espanya',
      description: 'Roll a die: lower than 5 = find shelter, otherwise lose 1 energy and +1 paradox.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Danger Cards/4.png',
      check: (roll) => roll < 5,
      successMsg: 'You found shelter from the storm!',
      failMsg: 'Storm hits! Lost 1 Energy, Paradox +1.',
      failEffect: (player, game) => { game.modifyEnergy(player, -1); game.modifyParadox(player, 1); }
    }
  ],
  [ERAS.AMERICAN]: [
    {
      id: 'dng_am_1',
      name: 'Flash Flood',
      nickname: 'Basa na ba ang lahat',
      description: 'Roll a die: odd number = find high ground, otherwise move 3 spaces backward.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Danger Cards/5.png',
      check: (roll) => roll % 2 !== 0,
      successMsg: 'You found high ground!',
      failMsg: 'Swept by the flood! Move 3 spaces backward.',
      failEffect: (player, game) => { game.movePlayer(player, -3); }
    },
    {
      id: 'dng_am_2',
      name: 'Nuclear Bomb',
      nickname: 'Goodbye, Philippines!',
      description: 'Roll a die: higher than 5 = escape, otherwise lose 2 points.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Danger Cards/6.png',
      check: (roll) => roll > 5,
      successMsg: 'You escaped the blast radius!',
      failMsg: 'Caught in the blast! Lost 2 points.',
      failEffect: (player) => { player.points -= 2; }
    },
    {
      id: 'dng_am_3',
      name: 'Earthquake',
      nickname: 'Lindol-lindulan',
      description: 'Roll a die: even number = stay balanced, otherwise lose 1 energy and +1 paradox.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Danger Cards/7.png',
      check: (roll) => roll % 2 === 0,
      successMsg: 'You stayed balanced!',
      failMsg: 'Earthquake! Lost 1 Energy, Paradox +1.',
      failEffect: (player, game) => { game.modifyEnergy(player, -1); game.modifyParadox(player, 1); }
    },
    {
      id: 'dng_am_4',
      name: 'Constabulary Patrol',
      nickname: 'Patrol de Albino',
      description: 'Roll a die: lower than 3 = slip past, otherwise skip turn.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Danger Cards/8.png',
      check: (roll) => roll < 3,
      successMsg: 'You slipped past undetected!',
      failMsg: 'Caught by patrol! Skip your next turn.',
      failEffect: (player) => { player.skipNextTurn = true; }
    }
  ],
  [ERAS.JAPANESE]: [
    {
      id: 'dng_jp_1',
      name: 'Japanese Patrol',
      nickname: 'Tagu-taguan sa hapon',
      description: 'Roll a die: higher than 2 = hide, otherwise skip turn.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Danger Cards/9.png',
      check: (roll) => roll > 2,
      successMsg: 'You hid successfully!',
      failMsg: 'Spotted by patrol! Skip your next turn.',
      failEffect: (player) => { player.skipNextTurn = true; }
    },
    {
      id: 'dng_jp_2',
      name: 'Soldier Encounter',
      nickname: 'Surpresa pero sundalo',
      description: 'Roll a die: lower than 4 = evade, otherwise move 3 backward.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Danger Cards/10.png',
      check: (roll) => roll < 4,
      successMsg: 'You evaded the soldiers!',
      failMsg: 'Soldiers push you back! Move 3 spaces backward.',
      failEffect: (player, game) => { game.movePlayer(player, -3); }
    },
    {
      id: 'dng_jp_3',
      name: 'Checkpoint Raid',
      nickname: 'Inspection Reveal: Kabado',
      description: 'Roll a die: odd number = clear inspection, otherwise lose 2 points.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Danger Cards/11.png',
      check: (roll) => roll % 2 !== 0,
      successMsg: 'You cleared the inspection!',
      failMsg: 'Failed inspection! Lost 2 points.',
      failEffect: (player) => { player.points -= 2; }
    },
    {
      id: 'dng_jp_4',
      name: 'Earthquake',
      nickname: 'Gumalawgaw si Earth',
      description: 'Roll a die: even number = avoid debris, otherwise move 2 backward.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Danger Cards/12.png',
      check: (roll) => roll % 2 === 0,
      successMsg: 'You avoided the falling debris!',
      failMsg: 'Debris! Move 2 spaces backward.',
      failEffect: (player, game) => { game.movePlayer(player, -2); }
    }
  ],
  [ERAS.MYTH]: [
    {
      id: 'dng_my_1',
      name: 'Manananggal Encounter',
      nickname: 'Hating Katawan',
      description: 'Roll a die: even number = survive, otherwise lose 2 energy.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Danger Cards/13.png',
      check: (roll) => roll % 2 === 0,
      successMsg: 'You survived the Manananggal!',
      failMsg: 'The Manananggal drains you! Lost 2 Energy.',
      failEffect: (player, game) => { game.modifyEnergy(player, -2); }
    },
    {
      id: 'dng_my_2',
      name: "Kapre's Curse",
      nickname: 'Isoy break na kapre',
      description: 'Roll a die: higher than 4 = break spell, otherwise skip turn.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Danger Cards/14.png',
      check: (roll) => roll > 4,
      successMsg: 'You broke the spell!',
      failMsg: "Kapre's curse! Skip your next turn.",
      failEffect: (player) => { player.skipNextTurn = true; }
    },
    {
      id: 'dng_my_3',
      name: 'Engkanto Illusion',
      nickname: 'Scammer na Engkanto',
      description: 'Roll a die: lower than 3 = see through illusion, otherwise move 3 backward.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Danger Cards/15.png',
      check: (roll) => roll < 3,
      successMsg: 'You saw through the illusion!',
      failMsg: 'Fooled by Engkanto! Move 3 spaces backward.',
      failEffect: (player, game) => { game.movePlayer(player, -3); }
    },
    {
      id: 'dng_my_4',
      name: 'Tiyanak Trap',
      nickname: 'Baby with plot twist',
      description: 'Roll a die: odd number = escape, otherwise lose 1 energy and +1 paradox.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Danger Cards/16.png',
      check: (roll) => roll % 2 !== 0,
      successMsg: 'You escaped the Tiyanak!',
      failMsg: 'Tiyanak got you! Lost 1 Energy, Paradox +1.',
      failEffect: (player, game) => { game.modifyEnergy(player, -1); game.modifyParadox(player, 1); }
    }
  ]
};

// Mission Cards (16 missions, one per artifact)
export function generateMissions() {
  const missions = [];
  ALL_ARTIFACTS.forEach((artifact, idx) => {
    missions.push({
      id: `mission_${idx}`,
      artifactId: artifact.id,
      artifactName: artifact.name,
      artifactNickname: artifact.nickname,
      targetEra: artifact.era,
      title: `Recover: ${artifact.nickname}`,
      description: `Find and recover the ${artifact.name} (${artifact.nickname}). Collect at least 3 related clues, acquire the artifact, and return it to the ${ERA_NAMES[artifact.era]}.`,
      requiredClues: 3,
      returnEra: artifact.era,
      points: 10
    });
  });
  return missions;
}

// Scoring rules
export const SCORING = {
  COMPLETE_MISSION: 10,
  RETURN_ARTIFACT_CORRECT: 5,
  OPTIONAL_OBJECTIVE: 2,
  PER_CLUE: 1,
  PER_UNUSED_ENERGY: 1,
  PARADOX_LOW_BONUS: 2,    // Level 0-1
  PARADOX_MID: 0,           // Level 2-3
  PARADOX_HIGH: -3,         // Level 4-5
  MISSION_FAILURE: -5
};

// Game constants
export const GAME_CONSTANTS = {
  MAX_PLAYERS: 4,
  STARTING_ENERGY: 10,
  MAX_ENERGY: 10,
  TIME_GATE_COST: 2,
  TIME_GATE_COST_EXPLORER: 1,
  TIME_WARP_COST: 2,
  REVERSE_TIME_COST: 3,
  REVERSE_TIME_COOLDOWN: 2,
  MAX_PARADOX: 5,
  MAX_TIMELINE: 10,
  GAME_TIME_MINUTES: 40,
  REQUIRED_CLUES_FOR_ARTIFACT: 3
};

// Player colors
export const PLAYER_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12'];
export const PLAYER_COLOR_NAMES = ['Red', 'Blue', 'Green', 'Orange'];
