function getLocalStorage() {
  if (typeof window !== 'undefined' && typeof window['localStorage'] !== 'undefined') {
    try {
      return window['localStorage'];
    } catch (_) {
      return null;
    }
  }
  return null;
}

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

// Custom tile artwork assets (paradox is WIP)
export const TILE_IMAGES = {
  [TILE_TYPES.CLUE]: '/assets/Tiles/clue_tile.png',
  [TILE_TYPES.EVENT]: '/assets/Tiles/event_tile.png',
  [TILE_TYPES.DANGER]: '/assets/Tiles/danger_tile.png',
  [TILE_TYPES.ARTIFACT]: '/assets/Tiles/artifact_tile.png',
  [TILE_TYPES.TIMEGATE]: '/assets/Tiles/portal_tile.png',
  [TILE_TYPES.PARADOX]: '/assets/Tiles/paradox_tile.png',
  [TILE_TYPES.EMPTY]: '/assets/Tiles/empty_tile.png'
};

// Tile layout for each era matching Full Map with Tiles.png
export const ERA_TILE_LAYOUTS = {
  [ERAS.SPANISH]: [
    'empty', 'event', 'empty', 'danger', 'empty',
    'timegate', 'clue', 'event', 'empty', 'event',
    'clue', 'paradox', 'event', 'empty', 'danger',
    'empty', 'clue', 'empty', 'empty', 'danger',
    'empty', 'empty', 'clue', 'danger', 'artifact'
  ],
  [ERAS.AMERICAN]: [
    'empty', 'empty', 'clue', 'paradox', 'empty',
    'event', 'empty', 'clue', 'danger', 'event',
    'empty', 'danger', 'event', 'timegate', 'clue',
    'empty', 'danger', 'empty', 'clue', 'empty',
    'event', 'danger', 'artifact', 'empty', 'empty'
  ],
  [ERAS.JAPANESE]: [
    'empty', 'empty', 'danger', 'clue', 'paradox',
    'event', 'empty', 'event', 'empty', 'clue',
    'event', 'empty', 'danger', 'artifact', 'danger',
    'timegate', 'empty', 'empty', 'clue', 'danger',
    'empty', 'event', 'empty', 'clue', 'empty'
  ],
  [ERAS.MYTH]: [
    'empty', 'clue', 'paradox', 'event', 'danger',
    'artifact', 'danger', 'event', 'empty', 'clue',
    'danger', 'empty', 'event', 'danger', 'empty',
    'event', 'empty', 'timegate', 'empty', 'empty',
    'clue', 'empty', 'empty', 'clue', 'empty'
  ]
};

// Percentage coordinates (0-100%) precisely positioned along the winding roads of Full Map with Tiles.png
export const ERA_TILE_COORDINATES = {
  [ERAS.SPANISH]: [
    { x: 45.9, y: 17.6 },  // 0: Station Cyan Bullseye (Blank)
    { x: 44.7, y: 22.5 },  // 1: Star (Event)
    { x: 42.9, y: 26.9 },  // 2: Empty (Blank)
    { x: 41.0, y: 31.4 },  // 3: Skull (Danger)
    { x: 43.5, y: 34.4 },  // 4: Empty (Blank)
    { x: 45.4, y: 38.6 },  // 5: Timegate (Central Nexus NW entrance)
    { x: 37.6, y: 29.5 },  // 6: Magnifying glass (Clue)
    { x: 35.7, y: 24.7 },  // 7: Star (Event)
    { x: 34.1, y: 20.0 },  // 8: Empty (Blank)
    { x: 32.0, y: 15.9 },  // 9: Star (Event)
    { x: 28.6, y: 14.1 },  // 10: Magnifying glass (Clue)
    { x: 25.1, y: 13.5 },  // 11: Paradox (P)
    { x: 21.7, y: 12.9 },  // 12: Star (Event)
    { x: 18.4, y: 14.5 },  // 13: Empty (Blank)
    { x: 17.3, y: 18.6 },  // 14: Skull (Danger)
    { x: 13.9, y: 19.2 },  // 15: Empty (Blank)
    { x: 10.5, y: 19.2 },  // 16: Magnifying glass (Clue)
    { x: 6.8,  y: 18.6 },  // 17: Empty (Blank)
    { x: 4.2,  y: 21.8 },  // 18: Empty (Blank)
    { x: 3.6,  y: 26.5 },  // 19: Skull (Danger)
    { x: 5.0,  y: 31.6 },  // 20: Empty (Blank)
    { x: 8.7,  y: 35.2 },  // 21: Empty (Blank)
    { x: 13.4, y: 35.4 },  // 22: Magnifying glass (Clue)
    { x: 17.1, y: 32.3 },  // 23: Skull (Danger)
    { x: 17.8, y: 25.1 }   // 24: Artifact Pedestal
  ],
  [ERAS.AMERICAN]: [
    { x: 93.3, y: 24.6 },  // 0: Landing pad Cyan Bullseye (Blank)
    { x: 92.5, y: 29.5 },  // 1: Empty (Blank)
    { x: 91.5, y: 34.0 },  // 2: Magnifying glass (Clue)
    { x: 89.0, y: 37.0 },  // 3: Paradox (P)
    { x: 85.0, y: 37.6 },  // 4: Empty (Blank)
    { x: 82.0, y: 35.8 },  // 5: Star (Event)
    { x: 78.5, y: 33.6 },  // 6: Empty (Blank)
    { x: 75.0, y: 34.2 },  // 7: Magnifying glass (Clue)
    { x: 71.5, y: 34.8 },  // 8: Skull (Danger)
    { x: 67.5, y: 35.5 },  // 9: Star (Event)
    { x: 63.5, y: 35.5 },  // 10: Empty (Blank)
    { x: 59.8, y: 34.5 },  // 11: Skull (Danger)
    { x: 56.4, y: 36.8 },  // 12: Star (Event)
    { x: 53.0, y: 43.5 },  // 13: Timegate (Central Nexus NE entrance)
    { x: 56.8, y: 27.5 },  // 14: Magnifying glass (Clue)
    { x: 60.5, y: 26.0 },  // 15: Empty (Blank)
    { x: 64.0, y: 27.0 },  // 16: Skull (Danger)
    { x: 65.5, y: 24.5 },  // 17: Empty (Blank)
    { x: 69.5, y: 22.0 },  // 18: Magnifying glass (Clue)
    { x: 74.0, y: 20.0 },  // 19: Empty (Blank)
    { x: 78.5, y: 20.5 },  // 20: Star (Event)
    { x: 82.5, y: 22.5 },  // 21: Skull (Danger)
    { x: 83.5, y: 26.5 },  // 22: Artifact Pedestal
    { x: 82.5, y: 31.8 },  // 23: Empty (Blank)
    { x: 88.0, y: 28.0 }   // 24: Empty (Blank - return to landing pad)
  ],
  [ERAS.JAPANESE]: [
    { x: 7.7,  y: 88.0 },  // 0: Start Cyan Bullseye (Blank)
    { x: 7.2,  y: 94.2 },  // 1: Red bunker (Blank)
    { x: 13.5, y: 91.5 },  // 2: Skull (Danger)
    { x: 16.8, y: 84.7 },  // 3: Magnifying glass (Clue)
    { x: 20.3, y: 79.9 },  // 4: Paradox (P)
    { x: 24.8, y: 78.2 },  // 5: Star (Event)
    { x: 28.9, y: 79.9 },  // 6: Empty (Blank)
    { x: 32.2, y: 86.3 },  // 7: Star (Event)
    { x: 35.4, y: 92.3 },  // 8: Empty (Blank)
    { x: 39.6, y: 93.7 },  // 9: Magnifying glass (Clue)
    { x: 43.6, y: 91.6 },  // 10: Star (Event)
    { x: 45.9, y: 86.0 },  // 11: Empty (Blank)
    { x: 45.6, y: 78.4 },  // 12: Skull (Danger)
    { x: 43.5, y: 72.5 },  // 13: Artifact Pedestal
    { x: 42.4, y: 66.4 },  // 14: Skull (Danger)
    { x: 44.6, y: 60.5 },  // 15: Timegate (Central Nexus SW bridge)
    { x: 38.7, y: 59.6 },  // 16: Empty (Blank)
    { x: 32.7, y: 60.5 },  // 17: Empty (Blank)
    { x: 27.8, y: 63.1 },  // 18: Magnifying glass (Clue)
    { x: 22.4, y: 61.8 },  // 19: Skull (Danger)
    { x: 17.4, y: 60.1 },  // 20: Empty (Blank)
    { x: 11.1, y: 59.9 },  // 21: Star (Event)
    { x: 8.4,  y: 63.5 },  // 22: Empty (Blank)
    { x: 7.6,  y: 70.7 },  // 23: Magnifying glass (Clue)
    { x: 7.5,  y: 80.2 }   // 24: Empty (Blank - return to start station)
  ],
  [ERAS.MYTH]: [
    { x: 89.6, y: 37.3 },  // 0: Torii Gate Cyan Bullseye (Blank)
    { x: 89.1, y: 46.5 },  // 1: Magnifying glass (Clue)
    { x: 90.3, y: 54.0 },  // 2: Paradox (P)
    { x: 89.4, y: 85.0 },  // 3: Star (Event)
    { x: 85.7, y: 87.8 },  // 4: Skull (Danger)
    { x: 81.5, y: 87.6 },  // 5: Artifact Pedestal
    { x: 78.0, y: 83.9 },  // 6: Skull (Danger)
    { x: 74.8, y: 80.8 },  // 7: Star (Event)
    { x: 68.2, y: 86.9 },  // 8: Empty (Blank)
    { x: 65.6, y: 92.5 },  // 9: Magnifying glass (Clue)
    { x: 61.2, y: 93.9 },  // 10: Skull (Danger)
    { x: 57.0, y: 91.2 },  // 11: Empty (Blank)
    { x: 53.8, y: 85.5 },  // 12: Star (Event)
    { x: 51.2, y: 77.6 },  // 13: Skull (Danger)
    { x: 53.0, y: 70.0 },  // 14: Empty (Blank)
    { x: 57.4, y: 62.5 },  // 15: Star (Event)
    { x: 58.1, y: 56.5 },  // 16: Empty (Blank)
    { x: 56.6, y: 50.8 },  // 17: Timegate (Central Nexus SE bridge)
    { x: 59.5, y: 46.5 },  // 18: Empty (Blank)
    { x: 63.7, y: 46.5 },  // 19: Empty (Blank)
    { x: 68.4, y: 45.8 },  // 20: Magnifying glass (Clue)
    { x: 71.8, y: 52.0 },  // 21: Empty (Blank)
    { x: 73.9, y: 58.2 },  // 22: Empty (Blank)
    { x: 74.4, y: 66.5 },  // 23: Magnifying glass (Clue)
    { x: 82.5, y: 45.0 }   // 24: Empty (Blank - return to Torii gate)
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
    const saved = getLocalStorage()?.getItem('panahon_custom_map_loops');
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
    const saved = getLocalStorage()?.getItem('panahon_custom_map_path_modes');
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
    for (let i = 0; i < 24; i++) c[i] = [i + 1];
    c[24] = [0];
    return c;
  })(),
  [ERAS.JAPANESE]: (() => {
    const c = {};
    for (let i = 0; i < 24; i++) c[i] = [i + 1];
    c[24] = [0];
    return c;
  })(),
  [ERAS.MYTH]: (() => {
    const c = {};
    for (let i = 0; i < 24; i++) c[i] = [i + 1];
    c[24] = [0];
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
    "0:1": 1    // Space 1: From Space 2 -> Space 2 (turn around at start)
  },
  [ERAS.AMERICAN]: {},
  [ERAS.JAPANESE]: {},
  [ERAS.MYTH]: {}
};

export function getActiveJunctionRules() {
  try {
    const saved = getLocalStorage()?.getItem("panahon_custom_map_junction_rules");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return {
          [ERAS.SPANISH]: {},
          [ERAS.AMERICAN]: {},
          [ERAS.JAPANESE]: {},
          [ERAS.MYTH]: {},
          ...parsed
        };
      }
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULT_ERA_JUNCTION_RULES));
}

export function saveCustomJunctionRules(rules) {
  try {
    getLocalStorage()?.setItem("panahon_custom_map_junction_rules", JSON.stringify(rules));
    return true;
  } catch (_) {
    return false;
  }
}

export function getActivePathConnections() {
  try {
    const saved = getLocalStorage()?.getItem('panahon_custom_map_connections');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULT_ERA_PATH_CONNECTIONS));
}

export function getActiveTileCoordinates() {
  try {
    const saved = getLocalStorage()?.getItem('panahon_custom_map_coords');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed && typeof parsed === 'object' &&
        parsed[ERAS.SPANISH]?.length === 25 &&
        parsed[ERAS.AMERICAN]?.length === 25 &&
        parsed[ERAS.JAPANESE]?.length === 25 &&
        parsed[ERAS.MYTH]?.length === 25
      ) {
        return parsed;
      }
    }
  } catch (_) {}
  return ERA_TILE_COORDINATES;
}

export function getActiveTileLayouts() {
  try {
    const saved = getLocalStorage()?.getItem('panahon_custom_map_layouts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed && typeof parsed === 'object' &&
        parsed[ERAS.SPANISH]?.length === 25 &&
        parsed[ERAS.AMERICAN]?.length === 25 &&
        parsed[ERAS.JAPANESE]?.length === 25 &&
        parsed[ERAS.MYTH]?.length === 25
      ) {
        return parsed;
      }
    }
  } catch (_) {}
  return ERA_TILE_LAYOUTS;
}

export function saveCustomMap(coords, layouts, loops, pathModes, connections, junctionRules) {
  try {
    getLocalStorage()?.setItem('panahon_custom_map_coords', JSON.stringify(coords));
    getLocalStorage()?.setItem('panahon_custom_map_layouts', JSON.stringify(layouts));
    if (loops) getLocalStorage()?.setItem('panahon_custom_map_loops', JSON.stringify(loops));
    if (pathModes) getLocalStorage()?.setItem('panahon_custom_map_path_modes', JSON.stringify(pathModes));
    if (connections) getLocalStorage()?.setItem('panahon_custom_map_connections', JSON.stringify(connections));
    if (junctionRules) getLocalStorage()?.setItem('panahon_custom_map_junction_rules', JSON.stringify(junctionRules));
    return true;
  } catch (e) {
    console.error('Failed to save custom map to getLocalStorage()?:', e);
    return false;
  }
}

export function resetCustomMap() {
  try {
    getLocalStorage()?.removeItem('panahon_custom_map_coords');
    getLocalStorage()?.removeItem('panahon_custom_map_layouts');
    getLocalStorage()?.removeItem('panahon_custom_map_loops');
    getLocalStorage()?.removeItem('panahon_custom_map_path_modes');
    getLocalStorage()?.removeItem('panahon_custom_map_connections');
    getLocalStorage()?.removeItem('panahon_custom_map_junction_rules');
  } catch (_) {}
}

// ==========================================
// TILE LAYOUT & MAP BACKUP MANAGEMENT
// ==========================================
const MAP_BACKUPS_STORAGE_KEY = 'panahon_map_layout_backups';

export function getMapBackups() {
  try {
    const raw = getLocalStorage()?.getItem(MAP_BACKUPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function saveMapBackup(coords, layouts, connections, junctionRules, loopTargets, name = '') {
  try {
    const backups = getMapBackups();
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const backupName = (name && name.trim()) ? name.trim() : `Backup ${dateStr}`;
    
    const newBackup = {
      id: 'backup_' + Date.now(),
      name: backupName,
      timestamp: now.toISOString(),
      dateStr,
      coords: JSON.parse(JSON.stringify(coords)),
      layouts: JSON.parse(JSON.stringify(layouts)),
      connections: connections ? JSON.parse(JSON.stringify(connections)) : {},
      junctionRules: junctionRules ? JSON.parse(JSON.stringify(junctionRules)) : {},
      loopTargets: loopTargets ? JSON.parse(JSON.stringify(loopTargets)) : {}
    };

    // Keep up to 25 most recent backups
    const updated = [newBackup, ...backups.slice(0, 24)];
    getLocalStorage()?.setItem(MAP_BACKUPS_STORAGE_KEY, JSON.stringify(updated));
    return newBackup;
  } catch (e) {
    console.error('Failed to create map backup:', e);
    return null;
  }
}

export function deleteMapBackup(backupId) {
  try {
    const backups = getMapBackups().filter(b => b.id !== backupId);
    getLocalStorage()?.setItem(MAP_BACKUPS_STORAGE_KEY, JSON.stringify(backups));
    return backups;
  } catch (_) {
    return [];
  }
}

export function clearAllMapBackups() {
  try {
    getLocalStorage()?.removeItem(MAP_BACKUPS_STORAGE_KEY);
    return true;
  } catch (_) {
    return false;
  }
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
      description: 'Reduced Time Gate travel cost to 1 Energy.',
      cooldown: 0 // Always active
    },
    active: {
      name: 'Momentum',
      description: 'Pause movement to interact with a tile, then continue moving remaining rolled spaces (2 Turn CD, 3 Energy Cost).',
      cooldown: 2,
      energyCost: 3
    }
  },
  GUARDIAN: {
    id: 'guardian',
    name: 'The Guardian',
    description: 'Protects timeline stability',
    avatar: 'assets/Characters/Copy of guardian.png',
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
  },
  ROGUE: {
    id: 'rogue',
    name: 'The Rogue',
    description: 'Master of shadows, swift theft, and opportunism',
    avatar: 'assets/Characters/rogue_128x128.png',
    color: '#9B59B6',
    passive: {
      name: 'Shadow Pockets',
      description: 'When passing through or landing on an occupied tile, steal 1 Energy or 1 Clue Card (once per player per turn)',
      cooldown: 0
    },
    active: {
      name: 'Pickpocket',
      description: 'Target a player within 2 tiles to steal 1 Clue Card or 2 Energy (3 Turn CD, 2 Energy Cost)',
      cooldown: 3,
      energyCost: 2
    }
  },
  CHRONOMANCER: {
    id: 'chronomancer',
    name: 'The Chronomancer',
    description: 'Bends the flow of time and alters temporal destiny',
    avatar: 'assets/Characters/chronomancer_128x128.png',
    color: '#1ABC9C',
    passive: {
      name: 'Temporal Foresight',
      description: 'Once per 3 turns, adjust rolled movement die result by +1 or -1 (within 1-6 range)',
      cooldown: 3
    },
    active: {
      name: 'Time Stop',
      description: 'Skip the next turn of a chosen operative (3 Turn CD, 3 Energy Cost)',
      cooldown: 3,
      energyCost: 3
    }
  }
};

export const ROLE_ORDER = ['HISTORIAN', 'EXPLORER', 'GUARDIAN', 'STRATEGIST', 'ROGUE', 'CHRONOMANCER'];

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
// Event Cards (20 Total - 5 per Era)
export const EVENT_CARDS = {
  [ERAS.SPANISH]: [
    {
      id: 'evt_sp_1',
      name: 'Paldoooo',
      description: 'Player gains +2 Energy (capped at 10) and draws 1 Clue Card from the current era deck.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/3.png',
      vfxTag: 'gold_coins',
      sfxTag: 'galleonBell',
      effect: (player, game) => {
        game.modifyEnergy(player, 2);
        game.drawClueCard(player);
        return 'Gained +2 Energy and drew 1 Clue Card!';
      }
    },
    {
      id: 'evt_sp_2',
      name: 'Fiesta now, problem later',
      description: 'Player gains +2 Energy and increases their Individual Paradox Meter by +1.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/2.png',
      vfxTag: 'fiesta_confetti_paradox',
      sfxTag: 'guitarFlourish',
      effect: (player, game) => {
        game.modifyEnergy(player, 2);
        game.modifyParadox(player, 1);
        return 'Gained +2 Energy, but increased Paradox by +1!';
      }
    },
    {
      id: 'evt_sp_3',
      name: 'Marites Network',
      description: 'Request a 1-for-1 Clue Card trade with any chosen player. If Accepted, swap cards. If Denied, gain +2 Energy.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/1.png',
      vfxTag: 'whispering_shadow',
      sfxTag: 'fanSnap',
      effect: (player, game) => {
        if (typeof game.offerMaritesTrade === 'function') {
          return game.offerMaritesTrade(player);
        }
        game.modifyEnergy(player, 2);
        return 'No trade targets available. Gained +2 Energy!';
      }
    },
    {
      id: 'evt_sp_4',
      name: 'Safe ka rito sa Intra',
      description: 'Grants persistent Sanctuary Shield status buff. Negates and discards the next Danger Card drawn.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/4.png',
      vfxTag: 'sanctuary_shield',
      sfxTag: 'cathedralChime',
      effect: (player, game) => {
        player.sanctuaryShield = true;
        return 'Sanctuary Shield active! Next Danger Card will be completely negated.';
      }
    },
    {
      id: 'evt_sp_5',
      name: 'Ay nag-glitch',
      description: 'Global Temporal Disturbance! For the next 2 turns, drawing on Clue, Event, or Danger tiles pulls from a random Era deck.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Event Cards/5.png',
      vfxTag: 'rgb_chromatic_split',
      sfxTag: 'crtDistortion',
      effect: (player, game) => {
        game.activateTemporalGlitch(2);
        return 'Global Temporal Disturbance! All card draws randomized across eras for 2 turns.';
      }
    }
  ],

  [ERAS.AMERICAN]: [
    {
      id: 'evt_am_1',
      name: 'Updated ka dapat dito ah!',
      description: 'Inspect top 3 Clue Cards of current era without drawing them, then return them in the same order.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/8.png',
      vfxTag: 'sepia_ticker_tape',
      sfxTag: 'morseCode',
      effect: (player, game) => {
        if (typeof game.peekTopClues === 'function') {
          return game.peekTopClues(player, 3);
        }
        return 'Inspected top 3 Clue Cards of this era!';
      }
    },
    {
      id: 'evt_am_2',
      name: 'Thomas and Friends',
      description: 'Immediately move 3 spaces forward along the path (costs 0 Energy) and resolve destination tile.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/7.png',
      vfxTag: 'train_smoke',
      sfxTag: 'trainWhistle',
      effect: (player, game) => {
        game.movePlayer(player, 3);
        return 'All aboard! Moved 3 spaces forward at 0 energy cost.';
      }
    },
    {
      id: 'evt_am_3',
      name: 'You’re Passed! Passed Away…',
      description: 'Player gains +2 Energy, and applies turn skipped debuff.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/10.png',
      vfxTag: 'detention_badge',
      sfxTag: 'schoolBell',
      effect: (player, game) => {
        game.modifyEnergy(player, 2);
        player.skipNextTurn = true;
        return 'Gained +2 Energy, but sent to detention—next turn skipped!';
      }
    },
    {
      id: 'evt_am_4',
      name: 'Free SHIPping fee',
      description: 'Player recovers +1 Energy.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/9.png',
      vfxTag: 'cyan_energy_ripple',
      sfxTag: 'foghorn',
      effect: (player, game) => {
        game.modifyEnergy(player, 1);
        return 'Special delivery! Recovered +1 Energy.';
      }
    },
    {
      id: 'evt_am_5',
      name: 'Ay nag-glitch',
      description: 'Global Temporal Disturbance! For the next 2 turns, drawing on Clue, Event, or Danger tiles pulls from a random Era deck.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Event Cards/6.png',
      vfxTag: 'rgb_chromatic_split',
      sfxTag: 'crtDistortion',
      effect: (player, game) => {
        game.activateTemporalGlitch(2);
        return 'Global Temporal Disturbance! All card draws randomized across eras for 2 turns.';
      }
    }
  ],

  [ERAS.JAPANESE]: [
    {
      id: 'evt_jp_1',
      name: 'Secret Chismis',
      description: 'Choose 1 specific Clue Card from current era remaining deck to add to hand, then shuffle deck.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/12.png',
      vfxTag: 'classified_folder',
      sfxTag: 'radioDialStatic',
      effect: (player, game) => {
        if (typeof game.offerSecretChismis === 'function') {
          return game.offerSecretChismis(player);
        }
        game.drawClueCard(player);
        return 'Acquired classified intelligence!';
      }
    },
    {
      id: 'evt_jp_2',
      name: 'Radyo patrol, iwas gulo',
      description: 'Decreases the shared global Timeline Meter by -1 (minimum 0).',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/14.png',
      vfxTag: 'timeline_cooling_waves',
      sfxTag: 'radioBroadcast',
      effect: (player, game) => {
        game.modifyTimelineMeter(-1);
        return 'Broadcasting calm frequencies! Timeline Meter decreased by 1.';
      }
    },
    {
      id: 'evt_jp_3',
      name: 'Kayamanan ng Buwaya',
      description: 'Player gains +3 Energy (capped at 10).',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/13.png',
      vfxTag: 'golden_crate_burst',
      sfxTag: 'crateCrack',
      effect: (player, game) => {
        game.modifyEnergy(player, 3);
        return 'Cracked open the hidden cache! Gained +3 Energy.';
      }
    },
    {
      id: 'evt_jp_4',
      name: 'HIDEous plan',
      description: 'Choice: Skip next 2 turns to fully restore Energy to 10/10 OR skip next 2 turns to reset Paradox to 0.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/15.png',
      vfxTag: 'dimmed_spotlight',
      sfxTag: 'trapdoorLatch',
      effect: (player, game) => {
        if (typeof game.offerHideousPlan === 'function') {
          return game.offerHideousPlan(player);
        }
        return 'Offered stealth sanctuary choices.';
      }
    },
    {
      id: 'evt_jp_5',
      name: 'Ay nag-glitch',
      description: 'Global Temporal Disturbance! For the next 2 turns, drawing on Clue, Event, or Danger tiles pulls from a random Era deck.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Event Cards/11.png',
      vfxTag: 'rgb_chromatic_split',
      sfxTag: 'crtDistortion',
      effect: (player, game) => {
        game.activateTemporalGlitch(2);
        return 'Global Temporal Disturbance! All card draws randomized across eras for 2 turns.';
      }
    }
  ],

  [ERAS.MYTH]: [
    {
      id: 'evt_my_1',
      name: 'Diwata Pares blessing',
      description: 'Player gains +2 Energy and reduces Individual Paradox Meter by -2 (minimum 0).',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/17.png',
      vfxTag: 'forest_fireflies',
      sfxTag: 'kulintangChord',
      effect: (player, game) => {
        game.modifyEnergy(player, 2);
        game.modifyParadox(player, -2);
        return 'Blessed by the Diwata! Gained +2 Energy and cleansed -2 Paradox.';
      }
    },
    {
      id: 'evt_my_2',
      name: 'Anito Grab',
      description: 'Optional exchange: Spend 2 Energy to immediately draw 1 Clue Card from current era deck.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/18.png',
      vfxTag: 'cyan_spirit_wisps',
      sfxTag: 'spiritWisp',
      effect: (player, game) => {
        if (typeof game.offerAnitoGrab === 'function') {
          return game.offerAnitoGrab(player);
        }
        return 'Anito spirits offer an ancient bargain!';
      }
    },
    {
      id: 'evt_my_3',
      name: 'Healing for everything',
      description: 'Loop through all 4 players: restore +2 Energy if in Myth quadrant, +1 Energy if in any other quadrant.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/19.png',
      vfxTag: 'water_ripple',
      sfxTag: 'waterRipple',
      effect: (player, game) => {
        (game.state?.players || []).forEach(p => {
          const amt = p.currentEra === ERAS.MYTH ? 2 : 1;
          game.modifyEnergy(p, amt);
        });
        return 'Enchanted waters surge! Restored Energy to all operatives across timelines.';
      }
    },
    {
      id: 'evt_my_4',
      name: 'Bato-bato sa langit',
      description: 'Roll D6: on 4-6, select any Era and draw 1 Clue Card from its deck. On 1-3, nothing happens.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/20.png',
      vfxTag: 'floating_rune_stones',
      sfxTag: 'runeBeam',
      needsRoll: true,
      check: (roll) => roll >= 4,
      successMsg: 'Rune stones resonated! You may choose an Era Clue deck to draw from.',
      failMsg: 'The rune stones remained silent. Nothing happened.',
      effect: (player, game) => {
        if (typeof game.offerBatoBato === 'function') {
          return game.offerBatoBato(player);
        }
        return 'Rune stones cast towards the heavens!';
      }
    },
    {
      id: 'evt_my_5',
      name: 'Ay nag-glitch',
      description: 'Global Temporal Disturbance! For the next 2 turns, drawing on Clue, Event, or Danger tiles pulls from a random Era deck.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Event Cards/16.png',
      vfxTag: 'rgb_chromatic_split',
      sfxTag: 'crtDistortion',
      effect: (player, game) => {
        game.activateTemporalGlitch(2);
        return 'Global Temporal Disturbance! All card draws randomized across eras for 2 turns.';
      }
    }
  ]
};

// Danger Cards (16 Total - 4 per Era, Interactive D6 Roll)
export const DANGER_CARDS = {
  [ERAS.SPANISH]: [
    {
      id: 'dng_sp_1',
      name: 'Bulkang galit',
      nickname: 'Group Hazard!',
      description: 'ALL 4 players must roll a D6. Roll 6 = escapes safely. Roll 1–5 = loses 3 Energy.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Danger Cards/2.png',
      isGroupHazard: true,
      check: (roll) => roll === 6,
      successMsg: 'You escaped the volcanic eruption safely!',
      failMsg: 'Hit by volcanic ash! Lost 3 Energy.',
      failEffect: (player, game, reduction) => {
        const loss = Math.max(0, 3 - (reduction ? 1 : 0));
        game.modifyEnergy(player, -loss);
      },
      vfxTag: 'falling_ash',
      sfxTag: 'volcanoRumble'
    },
    {
      id: 'dng_sp_2',
      name: 'Tulisan sa Dagat',
      nickname: 'Pirate Corsairs',
      description: 'Roll D6. Roll 4–6 = Fend off pirates safely. Roll 1–3 = Lose 1 Clue Card AND lose 1 Energy.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Danger Cards/1.png',
      check: (roll) => roll >= 4,
      successMsg: 'You fended off the pirates safely!',
      failMsg: 'Pirates raided your deck! Lost 1 Clue Card and 1 Energy.',
      failEffect: (player, game, reduction) => {
        if (typeof game.discardRandomClueOrLoseEnergy === 'function') {
          game.discardRandomClueOrLoseEnergy(player, 0);
        }
        const loss = Math.max(0, 1 - (reduction ? 1 : 0));
        if (loss > 0) game.modifyEnergy(player, -loss);
      },
      vfxTag: 'cutlass_slash',
      sfxTag: 'cannonBlast'
    },
    {
      id: 'dng_sp_3',
      name: 'Huli ka, Indio!',
      nickname: 'Guardia Civil Patrol',
      description: 'Roll D6. Odd (1, 3, 5) = Blend into the crowd safely. Even (2, 4, 6) = Skip player\'s next turn.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Danger Cards/4.png',
      check: (roll) => roll % 2 !== 0,
      successMsg: 'You blended into the Intramuros crowd safely!',
      failMsg: 'Caught by Guardia Civil! Skip your next turn.',
      failEffect: (player) => {
        player.skipNextTurn = true;
      },
      vfxTag: 'amber_torchlight',
      sfxTag: 'guardWhistle'
    },
    {
      id: 'dng_sp_4',
      name: 'Bagyong Espanya',
      nickname: 'Tropical Storm',
      description: 'Roll D6. Roll 1–4 = Find shelter safely. Roll 5–6 = Lose 1 Energy and increase Individual Paradox by +1.',
      era: ERAS.SPANISH,
      image: 'assets/Cards/Danger Cards/3.png',
      check: (roll) => roll <= 4,
      successMsg: 'You found sturdy shelter from the storm!',
      failMsg: 'Battered by the typhoon! Lost 1 Energy and +1 Paradox.',
      failEffect: (player, game, reduction) => {
        const eLoss = Math.max(0, 1 - (reduction ? 1 : 0));
        if (eLoss > 0) game.modifyEnergy(player, -eLoss);
        const pGain = (reduction && eLoss === 0) ? 1 : (reduction ? 0 : 1);
        game.modifyParadox(player, pGain);
      },
      vfxTag: 'whipping_rain',
      sfxTag: 'thunderclap'
    }
  ],

  [ERAS.AMERICAN]: [
    {
      id: 'dng_am_1',
      name: 'Basa na ba ang lahat',
      nickname: 'Surging Floodwater',
      description: 'Roll D6. Odd (1, 3, 5) = Reach high ground safely. Even (2, 4, 6) = Move 3 spaces backward.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Danger Cards/5.png',
      check: (roll) => roll % 2 !== 0,
      successMsg: 'You reached high ground safely!',
      failMsg: 'Swept back 3 spaces by the floodwaters!',
      failEffect: (player, game, reduction) => {
        const back = Math.max(1, 3 - (reduction ? 1 : 0));
        game.movePlayer(player, -back);
      },
      vfxTag: 'floodwater_wave',
      sfxTag: 'floodSplash'
    },
    {
      id: 'dng_am_2',
      name: 'Goodbye, Philippines!',
      nickname: 'Explosive Payload',
      description: 'Roll D6. Roll 5–6 = Defuse bomb successfully. Roll 1–4 = Increase shared global Timeline Meter by +1.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Danger Cards/8.png',
      check: (roll) => roll >= 5,
      successMsg: 'Bomb defused in the nick of time!',
      failMsg: 'Detonation destabilized the timeline! Timeline Meter +1.',
      failEffect: (player, game) => {
        game.modifyTimelineMeter(1);
      },
      vfxTag: 'orange_shockwave',
      sfxTag: 'airRaidSiren'
    },
    {
      id: 'dng_am_3',
      name: 'Lindol-lindulan',
      nickname: 'Seismic Tremor',
      description: 'Roll D6. Even (2, 4, 6) = Stay balanced. Odd (1, 3, 5) = Lose 1 Energy and increase Individual Paradox by +1.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Danger Cards/7.png',
      check: (roll) => roll % 2 === 0,
      successMsg: 'Kept your balance through the tremors!',
      failMsg: 'Tumbled in the quake! Lost 1 Energy and +1 Paradox.',
      failEffect: (player, game, reduction) => {
        const eLoss = Math.max(0, 1 - (reduction ? 1 : 0));
        if (eLoss > 0) game.modifyEnergy(player, -eLoss);
        const pGain = (reduction && eLoss === 0) ? 1 : (reduction ? 0 : 1);
        game.modifyParadox(player, pGain);
      },
      vfxTag: 'cracking_pavement',
      sfxTag: 'earthquakeRumble'
    },
    {
      id: 'dng_am_4',
      name: 'Patrol de Albino',
      nickname: 'Curfew Patrol',
      description: 'Roll D6. Roll 1–2 = Slip past undetected. Roll 3–6 = Skip player\'s next turn.',
      era: ERAS.AMERICAN,
      image: 'assets/Cards/Danger Cards/6.png',
      check: (roll) => roll <= 2,
      successMsg: 'You slipped past the patrol car undetected!',
      failMsg: 'Caught after curfew! Skip your next turn.',
      failEffect: (player) => {
        player.skipNextTurn = true;
      },
      vfxTag: 'police_flashing',
      sfxTag: 'policeSiren'
    }
  ],

  [ERAS.JAPANESE]: [
    {
      id: 'dng_jp_1',
      name: 'Tagu-taguan sa Hapon',
      nickname: 'Searchlight Evasion',
      description: 'Roll D6. Roll 3–6 = Hide successfully. Roll 1–2 = Skip player\'s next turn.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Danger Cards/10.png',
      check: (roll) => roll >= 3,
      successMsg: 'You stayed hidden in the shadows!',
      failMsg: 'Spotted by the patrol garrison! Skip your next turn.',
      failEffect: (player) => {
        player.skipNextTurn = true;
      },
      vfxTag: 'sweeping_searchlight',
      sfxTag: 'marchingBoots'
    },
    {
      id: 'dng_jp_2',
      name: 'Surpresa pero Sundalo',
      nickname: 'Garrison Ambush',
      description: 'Roll D6. Roll 1–3 = Evade safely. Roll 4–6 = Move 3 spaces backward.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Danger Cards/12.png',
      check: (roll) => roll <= 3,
      successMsg: 'You slipped around the ambush safely!',
      failMsg: 'Ambushed by sentries! Forced back 3 spaces.',
      failEffect: (player, game, reduction) => {
        const back = Math.max(1, 3 - (reduction ? 1 : 0));
        game.movePlayer(player, -back);
      },
      vfxTag: 'bayonet_glint',
      sfxTag: 'bayonetAlarm'
    },
    {
      id: 'dng_jp_3',
      name: 'Inspection Reveal: Kabado',
      nickname: 'Kempeitai Checkpoint',
      description: 'Roll D6. Odd (1, 3, 5) = Pass inspection safely. Even (2, 4, 6) = Reveal all Clue Cards for 5 seconds and discard 1 core Mission Clue Card.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Danger Cards/9.png',
      check: (roll) => roll % 2 !== 0,
      successMsg: 'Your papers checked out! Passed inspection safely.',
      failMsg: 'Inspection failed! Hand revealed and 1 Mission Clue confiscated.',
      failEffect: (player, game) => {
        if (typeof game.revealAndDiscardMissionClue === 'function') {
          game.revealAndDiscardMissionClue(player);
        }
      },
      vfxTag: 'red_ink_stamp',
      sfxTag: 'heartbeatStamp'
    },
    {
      id: 'dng_jp_4',
      name: 'Gumalawgaw si Earth',
      nickname: 'Ground Tremor',
      description: 'Roll D6. Even (2, 4, 6) = Avoid falling debris. Odd (1, 3, 5) = Move 2 spaces backward.',
      era: ERAS.JAPANESE,
      image: 'assets/Cards/Danger Cards/11.png',
      check: (roll) => roll % 2 === 0,
      successMsg: 'You dodged the falling debris cleanly!',
      failMsg: 'Falling debris knocked you back 2 spaces!',
      failEffect: (player, game, reduction) => {
        const back = Math.max(1, 2 - (reduction ? 1 : 0));
        game.movePlayer(player, -back);
      },
      vfxTag: 'falling_rocks',
      sfxTag: 'rockCrumble'
    }
  ],

  [ERAS.MYTH]: [
    {
      id: 'dng_my_1',
      name: 'Gojo na Lumilipad',
      nickname: 'Manananggal Swoop',
      description: 'Roll D6. Even (2, 4, 6) = Survive without loss. Odd (1, 3, 5) = Lose 2 Energy.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Danger Cards/16.png',
      check: (roll) => roll % 2 === 0,
      successMsg: 'You ducked beneath the bat-like wings safely!',
      failMsg: 'Clawed from the skies! Lost 2 Energy.',
      failEffect: (player, game, reduction) => {
        const loss = Math.max(0, 2 - (reduction ? 1 : 0));
        game.modifyEnergy(player, -loss);
      },
      vfxTag: 'bat_shadow',
      sfxTag: 'nightHowl'
    },
    {
      id: 'dng_my_2',
      name: 'Isoy break na Kapre',
      nickname: 'Enchanted Balete Tree',
      description: 'Roll D6. Roll 4–6 = Escape enchanted tree. Roll 1–3 = Lose 2 Energy AND move 2 spaces backward.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Danger Cards/15.png',
      check: (roll) => roll >= 4,
      successMsg: 'You escaped the Kapre\'s enchanted Balete tree!',
      failMsg: 'Choked by cigar smoke and kicked back 2 spaces! Lost 2 Energy.',
      failEffect: (player, game, reduction) => {
        const loss = Math.max(0, 2 - (reduction ? 1 : 0));
        const back = Math.max(1, 2 - (reduction ? 1 : 0));
        game.modifyEnergy(player, -loss);
        game.movePlayer(player, -back);
      },
      vfxTag: 'cigar_smoke',
      sfxTag: 'kapreLaughter'
    },
    {
      id: 'dng_my_3',
      name: 'Scammer na Engkanto',
      nickname: 'Trickster Illusion',
      description: 'Roll D6. Roll 1–2 = See through illusion safely. Roll 3–6 = Convert 1 valid Clue Card into a Decoy Card.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Danger Cards/14.png',
      check: (roll) => roll <= 2,
      successMsg: 'You pierced through the Engkanto\'s glamorous illusion!',
      failMsg: 'Tricked! 1 valid Clue Card dissolved into an illusionary Decoy.',
      failEffect: (player, game) => {
        if (typeof game.convertClueToDecoy === 'function') {
          game.convertClueToDecoy(player);
        }
      },
      vfxTag: 'trickster_mirage',
      sfxTag: 'tricksterGlitch'
    },
    {
      id: 'dng_my_4',
      name: 'Baby ama',
      nickname: 'Tiyanak Wail',
      description: 'Roll D6. Odd (1, 3, 5) = Escape lure safely. Even (2, 4, 6) = Lose 2 Energy and increase Individual Paradox by +1.',
      era: ERAS.MYTH,
      image: 'assets/Cards/Danger Cards/13.png',
      check: (roll) => roll % 2 !== 0,
      successMsg: 'Ignored the false crying and escaped the lure safely!',
      failMsg: 'Lured into the demonic nursery! Lost 2 Energy and +1 Paradox.',
      failEffect: (player, game, reduction) => {
        const loss = Math.max(0, 2 - (reduction ? 1 : 0));
        game.modifyEnergy(player, -loss);
        const pGain = (reduction && loss === 0) ? 1 : (reduction ? 0 : 1);
        game.modifyParadox(player, pGain);
      },
      vfxTag: 'red_claw_scratch',
      sfxTag: 'babySnarl'
    }
  ]
};


export function generateMissions() {
  const missions = [];
  ALL_ARTIFACTS.forEach((artifact, idx) => {
    missions.push({
      id: `mission_${idx}`,
      artifactId: artifact.id,
      artifactName: artifact.name,
      artifactNickname: artifact.nickname,
      targetEra: artifact.era,
      originEra: artifact.era,
      title: `Recover: ${artifact.nickname}`,
      description: `Find and recover the ${artifact.name} (${artifact.nickname}). Collect 3 matching clues in the ${ERA_NAMES[artifact.era]}, retrieve it from its displaced era, and return it to restore history!`,
      requiredClues: 3,
      returnEra: artifact.era
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
export const PLAYER_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];
export const PLAYER_COLOR_NAMES = ['Red', 'Blue', 'Green', 'Orange', 'Purple', 'Teal'];
