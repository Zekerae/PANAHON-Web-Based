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

// Tile layout for each era matching Full Map with Tiles.png
export const ERA_TILE_LAYOUTS = {
  [ERAS.SPANISH]: [
    'start', 'event', 'empty', 'danger', 'empty',
    'timegate', 'clue', 'event', 'empty', 'event',
    'clue', 'paradox', 'event', 'empty', 'danger',
    'paradox', 'clue', 'event', 'empty', 'paradox',
    'event', 'paradox', 'clue', 'danger', 'artifact'
  ],
  [ERAS.AMERICAN]: [
    'start', 'empty', 'clue', 'paradox', 'empty',
    'event', 'empty', 'event', 'danger', 'event',
    'empty', 'danger', 'event', 'timegate', 'clue',
    'paradox', 'danger', 'empty', 'clue', 'paradox',
    'event', 'danger', 'artifact', 'danger'
  ],
  [ERAS.JAPANESE]: [
    'start', 'empty', 'danger', 'clue', 'paradox',
    'event', 'empty', 'event', 'paradox', 'clue',
    'event', 'empty', 'danger', 'artifact', 'danger',
    'timegate', 'event', 'paradox', 'clue', 'danger',
    'empty', 'event', 'paradox', 'clue', 'empty', 'event'
  ],
  [ERAS.MYTH]: [
    'start', 'clue', 'paradox', 'event', 'danger',
    'artifact', 'danger', 'event', 'paradox', 'clue',
    'danger', 'empty', 'event', 'danger', 'empty',
    'event', 'empty', 'timegate', 'event', 'event',
    'clue', 'paradox', 'paradox', 'clue'
  ]
};

// Percentage coordinates (0-100%) precisely positioned along the winding roads of Full Map with Tiles.png
export const ERA_TILE_COORDINATES = {
  [ERAS.SPANISH]: [
    { x: 45.9, y: 17.6 },  // 0: Station Cyan Bullseye
    { x: 44.7, y: 22.5 },  // 1: Star
    { x: 42.9, y: 26.9 },  // 2: Empty
    { x: 41.0, y: 31.4 },  // 3: Skull
    { x: 43.5, y: 34.4 },  // 4: Empty
    { x: 45.4, y: 38.6 },  // 5: Timegate (Central Nexus NW entrance)
    { x: 37.6, y: 29.5 },  // 6: Magnifying glass
    { x: 35.7, y: 24.7 },  // 7: Star
    { x: 34.1, y: 20.0 },  // 8: Empty
    { x: 32.0, y: 15.9 },  // 9: Star
    { x: 28.6, y: 14.1 },  // 10: Magnifying glass
    { x: 25.1, y: 13.5 },  // 11: Paradox (P)
    { x: 21.7, y: 12.9 },  // 12: Star
    { x: 18.4, y: 14.5 },  // 13: Empty
    { x: 17.3, y: 18.6 },  // 14: Skull
    { x: 13.9, y: 19.2 },  // 15: Paradox (P)
    { x: 10.5, y: 19.2 },  // 16: Magnifying glass
    { x: 6.8,  y: 18.6 },  // 17: Star
    { x: 4.2,  y: 21.8 },  // 18: Empty
    { x: 3.6,  y: 26.5 },  // 19: Paradox (P)
    { x: 5.0,  y: 31.6 },  // 20: Star
    { x: 8.7,  y: 35.2 },  // 21: Paradox (P)
    { x: 13.4, y: 35.4 },  // 22: Magnifying glass
    { x: 17.1, y: 32.3 },  // 23: Skull
    { x: 17.8, y: 25.1 }   // 24: Artifact Pedestal
  ],
  [ERAS.AMERICAN]: [
    { x: 93.3, y: 24.6 },  // 0: Landing pad Cyan Bullseye
    { x: 92.5, y: 29.5 },  // 1: Empty
    { x: 91.5, y: 34.0 },  // 2: Magnifying glass
    { x: 89.0, y: 37.0 },  // 3: Paradox (P)
    { x: 85.0, y: 37.6 },  // 4: Empty
    { x: 82.0, y: 35.8 },  // 5: Star
    { x: 78.5, y: 33.6 },  // 6: Empty
    { x: 75.0, y: 34.2 },  // 7: Star
    { x: 71.5, y: 34.8 },  // 8: Skull
    { x: 67.5, y: 35.5 },  // 9: Star
    { x: 63.5, y: 35.5 },  // 10: Empty
    { x: 59.8, y: 34.5 },  // 11: Skull
    { x: 56.4, y: 36.8 },  // 12: Star
    { x: 53.0, y: 43.5 },  // 13: Timegate (Central Nexus NE entrance)
    { x: 56.8, y: 27.5 },  // 14: Magnifying glass
    { x: 60.5, y: 26.0 },  // 15: Paradox (P)
    { x: 64.0, y: 27.0 },  // 16: Skull
    { x: 65.5, y: 24.5 },  // 17: Empty
    { x: 69.5, y: 22.0 },  // 18: Magnifying glass
    { x: 74.0, y: 20.0 },  // 19: Paradox (P)
    { x: 78.5, y: 20.5 },  // 20: Star
    { x: 82.5, y: 22.5 },  // 21: Skull
    { x: 83.5, y: 26.5 },  // 22: Artifact Pedestal
    { x: 82.5, y: 31.8 }   // 23: Skull
  ],
  [ERAS.JAPANESE]: [
    { x: 7.7,  y: 88.0 },  // 0: Start Cyan Bullseye
    { x: 7.2,  y: 94.2 },  // 1: Red bunker
    { x: 13.5, y: 91.5 },  // 2: Skull
    { x: 16.8, y: 84.7 },  // 3: Magnifying glass
    { x: 20.3, y: 79.9 },  // 4: Paradox (P)
    { x: 24.8, y: 78.2 },  // 5: Star
    { x: 28.9, y: 79.9 },  // 6: Empty
    { x: 32.2, y: 86.3 },  // 7: Star
    { x: 35.4, y: 92.3 },  // 8: Paradox (P)
    { x: 39.6, y: 93.7 },  // 9: Magnifying glass
    { x: 43.6, y: 91.6 },  // 10: Star
    { x: 45.9, y: 86.0 },  // 11: Empty
    { x: 45.6, y: 78.4 },  // 12: Skull
    { x: 43.5, y: 72.5 },  // 13: Artifact Pedestal
    { x: 42.4, y: 66.4 },  // 14: Skull
    { x: 44.6, y: 60.5 },  // 15: Timegate (Central Nexus SW bridge)
    { x: 38.7, y: 59.6 },  // 16: Star
    { x: 32.7, y: 60.5 },  // 17: Paradox (P)
    { x: 27.8, y: 63.1 },  // 18: Magnifying glass
    { x: 22.4, y: 61.8 },  // 19: Skull
    { x: 17.4, y: 60.1 },  // 20: Empty
    { x: 11.1, y: 59.9 },  // 21: Star
    { x: 8.4,  y: 63.5 },  // 22: Paradox (P)
    { x: 7.6,  y: 70.7 },  // 23: Magnifying glass
    { x: 7.7,  y: 76.9 },  // 24: Empty
    { x: 7.3,  y: 83.5 }   // 25: Star
  ],
  [ERAS.MYTH]: [
    { x: 89.6, y: 37.3 },  // 0: Torii Gate Cyan Bullseye
    { x: 89.1, y: 46.5 },  // 1: Magnifying glass
    { x: 90.3, y: 54.0 },  // 2: Paradox (P)
    { x: 89.4, y: 85.0 },  // 3: Star
    { x: 85.7, y: 87.8 },  // 4: Skull
    { x: 81.5, y: 87.6 },  // 5: Artifact Pedestal
    { x: 78.0, y: 83.9 },  // 6: Skull
    { x: 74.8, y: 80.8 },  // 7: Star
    { x: 68.2, y: 86.9 },  // 8: Paradox (P)
    { x: 65.6, y: 92.5 },  // 9: Magnifying glass
    { x: 61.2, y: 93.9 },  // 10: Skull
    { x: 57.0, y: 91.2 },  // 11: Empty
    { x: 53.8, y: 85.5 },  // 12: Star
    { x: 51.2, y: 77.6 },  // 13: Skull
    { x: 53.0, y: 70.0 },  // 14: Empty
    { x: 57.4, y: 62.5 },  // 15: Star
    { x: 58.1, y: 56.5 },  // 16: Empty
    { x: 56.6, y: 50.8 },  // 17: Timegate (Central Nexus SE bridge)
    { x: 59.5, y: 46.5 },  // 18: Star
    { x: 63.7, y: 46.5 },  // 19: Star
    { x: 68.4, y: 45.8 },  // 20: Magnifying glass
    { x: 71.8, y: 52.0 },  // 21: Paradox (P)
    { x: 73.9, y: 58.2 },  // 22: Paradox (P)
    { x: 74.4, y: 66.5 }   // 23: Magnifying glass
  ]
};

// Dynamic Map Accessors (Supports in-game Map Editor & Local Storage)
// Default loop target index for each era (where the last tile connects to)
// Spanish era: Tile 25 (index 24) connects directly to Tile 15 (index 14) to complete the loop!
export const DEFAULT_ERA_LOOP_TARGETS = {
  [ERAS.SPANISH]: 14,   // Tile #15
  [ERAS.AMERICAN]: 0,   // Tile #1
  [ERAS.JAPANESE]: 0,   // Tile #1
  [ERAS.MYTH]: 0        // Tile #1
};

export function getActiveLoopTargets() {
  try {
    const saved = localStorage.getItem('panahon_custom_map_loops');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_ERA_LOOP_TARGETS, ...parsed };
    }
  } catch (_) {}
  return { ...DEFAULT_ERA_LOOP_TARGETS };
}

// Default Path Traversal Modes for each era:
// 'mario_party': Outward journey (1 -> 25), then returns (25 -> 15 -> 14 -> ... -> 1), like Mario Party!
// 'loop': Standard circular loop (loops from final tile to loop target)
export const DEFAULT_ERA_PATH_MODES = {
  [ERAS.SPANISH]: 'mario_party', // After 25, goes to 15, then 14 down the line!
  [ERAS.AMERICAN]: 'loop',
  [ERAS.JAPANESE]: 'loop',
  [ERAS.MYTH]: 'loop'
};

export function getActivePathModes() {
  try {
    const saved = localStorage.getItem('panahon_custom_map_path_modes');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_ERA_PATH_MODES, ...parsed };
    }
  } catch (_) {}
  return { ...DEFAULT_ERA_PATH_MODES };
}

// Default Path Connections (Graph of which tile flows to which tile)
// Gives the user 100% full manual control to route, branch, or reconnect any tile!
export const DEFAULT_ERA_PATH_CONNECTIONS = {
  [ERAS.SPANISH]: (() => {
    const c = {};
    for (let i = 0; i < 24; i++) c[i] = [i + 1];
    c[3] = [4, 6, 2];   // Space 4 -> 5, 7, 3
    c[5] = [3];         // Space 6 -> 4
    c[6] = [7, 3];      // Space 7 -> 8, 4
    c[14] = [15, 13];   // Space 15 -> 16, 14
    c[24] = [14];       // Space 25 -> 15
    return c;
  })(),
  [ERAS.AMERICAN]: (() => {
    const c = {};
    for (let i = 0; i < 23; i++) c[i] = [i + 1];
    c[23] = [0];
    return c;
  })(),
  [ERAS.JAPANESE]: (() => {
    const c = {};
    for (let i = 0; i < 25; i++) c[i] = [i + 1];
    c[25] = [0];
    return c;
  })(),
  [ERAS.MYTH]: (() => {
    const c = {};
    for (let i = 0; i < 23; i++) c[i] = [i + 1];
    c[23] = [0];
    return c;
  })()
};

// Explicit Junction Approach Rules (Maps incoming space to outgoing destination)
// e.g. "3:2": 4 means "When entering Space 4 (idx 3) from Space 3 (idx 2), go to Space 5 (idx 4)"
export const DEFAULT_ERA_JUNCTION_RULES = {
  [ERAS.SPANISH]: {
    "3:2": 4,   // Space 4: From Space 3 -> Space 5 (ruins / nexus loop)
    "3:5": 6,   // Space 4: From Space 6 -> Space 7 (mountain village trail)
    "3:6": 2,   // Space 4: From Space 7 -> Space 3 (return trail to base)
    "6:3": 7,   // Space 7: From Space 4 -> Space 8 (up village road)
    "6:7": 3,   // Space 7: From Space 8 -> Space 4 (down village road to crossroads)
    "14:13": 15, // Space 15: From Space 14 -> Space 16 (enter mountain loop)
    "14:24": 13, // Space 15: From Space 25 -> Space 14 (exit mountain loop to village trail)
    "0:1": 1    // Space 1: From Space 2 -> Space 2 (turn around at start)
  },
  [ERAS.AMERICAN]: {},
  [ERAS.JAPANESE]: {},
  [ERAS.MYTH]: {}
};

export function getActiveJunctionRules() {
  try {
    const saved = localStorage.getItem("panahon_custom_map_junction_rules");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return {
          ...DEFAULT_ERA_JUNCTION_RULES,
          ...parsed,
          [ERAS.SPANISH]: {
            ...DEFAULT_ERA_JUNCTION_RULES[ERAS.SPANISH],
            ...(parsed[ERAS.SPANISH] || {})
          }
        };
      }
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULT_ERA_JUNCTION_RULES));
}

export function saveCustomJunctionRules(rules) {
  try {
    localStorage.setItem("panahon_custom_map_junction_rules", JSON.stringify(rules));
    return true;
  } catch (_) {
    return false;
  }
}

export function getActivePathConnections() {
  try {
    const saved = localStorage.getItem('panahon_custom_map_connections');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULT_ERA_PATH_CONNECTIONS));
}

export function getActiveTileCoordinates() {
  try {
    const saved = localStorage.getItem('panahon_custom_map_coords');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (_) {}
  return ERA_TILE_COORDINATES;
}

export function getActiveTileLayouts() {
  try {
    const saved = localStorage.getItem('panahon_custom_map_layouts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (_) {}
  return ERA_TILE_LAYOUTS;
}

export function saveCustomMap(coords, layouts, loops, pathModes, connections, junctionRules) {
  try {
    localStorage.setItem('panahon_custom_map_coords', JSON.stringify(coords));
    localStorage.setItem('panahon_custom_map_layouts', JSON.stringify(layouts));
    if (loops) localStorage.setItem('panahon_custom_map_loops', JSON.stringify(loops));
    if (pathModes) localStorage.setItem('panahon_custom_map_path_modes', JSON.stringify(pathModes));
    if (connections) localStorage.setItem('panahon_custom_map_connections', JSON.stringify(connections));
    if (junctionRules) localStorage.setItem('panahon_custom_map_junction_rules', JSON.stringify(junctionRules));
    return true;
  } catch (e) {
    console.error('Failed to save custom map to localStorage:', e);
    return false;
  }
}

export function resetCustomMap() {
  try {
    localStorage.removeItem('panahon_custom_map_coords');
    localStorage.removeItem('panahon_custom_map_layouts');
    localStorage.removeItem('panahon_custom_map_loops');
    localStorage.removeItem('panahon_custom_map_path_modes');
    localStorage.removeItem('panahon_custom_map_connections');
    localStorage.removeItem('panahon_custom_map_junction_rules');
  } catch (_) {}
}

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
      description: 'Select 1 of 3 face-down Clue Cards to keep, shuffle the rest (3 Turn CD, 2 Energy Cost)',
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
      description: 'Spend 2 Energy to reduce Paradox by 1, OR restore 1 Energy (3 Turn CD)',
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
        const imgPath = getClueCardImage(cardNum);
        clueCards.push({
          id: `clue_${era}_${artIdx}_${c}`,
          type: 'clue',
          era: era,
          artifactId: artifact.id,
          artifactName: artifact.name,
          isDecoy: false,
          image: imgPath,
          cardImage: imgPath,
          description: `Clue about ${artifact.name}`,
          hint: `Clue about ${artifact.name}`
        });
      }
    });

    // 5 decoy cards per era
    for (let d = 0; d < 5; d++) {
      const decoyNum = d + 1;
      const decoyImg = `assets/Cards/Decoy Cards/${eraIdx * 4 + decoyNum}.png`;
      clueCards.push({
        id: `decoy_${era}_${d}`,
        type: 'decoy',
        era: era,
        artifactId: null,
        isDecoy: true,
        image: decoyImg,
        cardImage: decoyImg,
        description: 'Decoy - This clue leads nowhere!',
        hint: 'Decoy - This clue leads nowhere!'
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
      image: 'assets/Cards/Event Cards/5.png',
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
      image: 'assets/Cards/Event Cards/5.png',
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
      image: 'assets/Cards/Event Cards/17.png',
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
      image: 'assets/Cards/Event Cards/18.png',
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
      image: 'assets/Cards/Event Cards/19.png',
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
      image: 'assets/Cards/Event Cards/5.png',
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
  MAX_TIMELINE: 5,
  GAME_TIME_MINUTES: 40,
  REQUIRED_CLUES_FOR_ARTIFACT: 3,
  MAX_CLUE_CARDS: 5
};

// Player colors
export const PLAYER_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12'];
export const PLAYER_COLOR_NAMES = ['Red', 'Blue', 'Green', 'Orange'];
