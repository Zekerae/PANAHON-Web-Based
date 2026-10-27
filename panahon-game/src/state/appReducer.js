import { getSavedProfile } from '../sessionManager.js';

const initialProfile = getSavedProfile();

function getInitialScreen() {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.has('room') || p.has('join')) return 'lobby';
  } catch {}
  return 'title';
}

function getInitialLobbyMode() {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.has('room') || p.has('join') || p.get('mode') === 'online') return 'online';
  } catch {}
  return 'local';
}

export const initialAppState = {
  currentScreen: getInitialScreen(), // 'title' | 'lobby' | 'game' | 'endgame' | 'map-editor'
  lobbyMode: getInitialLobbyMode(), // 'local' | 'online'
  showGuide: false,
  maximizedCardData: null,
  isSpectator: false,
  simulationSpeed: 1, // 1 | 1.5 | 2
  localPlayers: [
    { name: initialProfile.name, roleKey: initialProfile.roleKey, type: 'human', difficulty: 'normal' },
    { name: 'Bot Explorer', roleKey: 'EXPLORER', type: 'ai', difficulty: 'normal' },
    { name: 'Bot Guardian', roleKey: 'GUARDIAN', type: 'ai', difficulty: 'normal' },
    { name: 'Bot Strategist', roleKey: 'STRATEGIST', type: 'ai', difficulty: 'normal' }
  ]
};

export function appReducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, currentScreen: action.screen };

    case 'OPEN_LOBBY': {
      const prof = getSavedProfile();
      return {
        ...state,
        currentScreen: 'lobby',
        lobbyMode: action.mode || state.lobbyMode,
        localPlayers: state.localPlayers.map((p, idx) => {
          if (idx === 0) {
            const currentName = (p.name || '').trim();
            const useName = (!currentName || currentName === 'Player 1') ? prof.name : currentName;
            return {
              ...p,
              name: useName,
              roleKey: p.roleKey || prof.roleKey
            };
          }
          return p;
        })
      };
    }

    case 'SYNC_PROFILE_NAME': {
      const { name, roleKey } = action.payload || getSavedProfile();
      return {
        ...state,
        localPlayers: state.localPlayers.map((p, idx) => {
          if (idx === 0) {
            return {
              ...p,
              name: name || p.name,
              roleKey: roleKey || p.roleKey
            };
          }
          return p;
        })
      };
    }

    case 'SET_LOBBY_MODE':
      return { ...state, lobbyMode: action.mode };

    case 'SET_LOCAL_PLAYERS': {
      const prof = getSavedProfile();
      const rawPlayers = typeof action.payload === 'function' ? action.payload(state.localPlayers) : action.payload;
      const players = (rawPlayers || []).map((p, idx) => {
        if (idx === 0 && p.type === 'human') {
          const name = (p.name || '').trim();
          if (!name || name === 'Player 1') {
            return { ...p, name: prof.name, roleKey: p.roleKey || prof.roleKey };
          }
        }
        return p;
      });
      return {
        ...state,
        localPlayers: players
      };
    }

    case 'START_GAME':
      return {
        ...state,
        currentScreen: 'game',
        isSpectator: action.isSpectator !== undefined ? action.isSpectator : state.isSpectator,
        maximizedCardData: null
      };

    case 'SET_SPECTATOR':
      return { ...state, isSpectator: Boolean(action.payload) };

    case 'SET_SIMULATION_SPEED':
      return { ...state, simulationSpeed: action.payload || 1 };

    case 'GAME_OVER':
      return {
        ...state,
        currentScreen: 'endgame'
      };

    case 'OPEN_GUIDE':
      return { ...state, showGuide: true };

    case 'CLOSE_GUIDE':
      return { ...state, showGuide: false };

    case 'SET_MAXIMIZED_CARD':
      return { ...state, maximizedCardData: action.cardData };

    case 'RETURN_TO_TITLE':
      return {
        ...state,
        currentScreen: 'title',
        isSpectator: false,
        simulationSpeed: 1,
        maximizedCardData: null,
        showGuide: false,
        showSupabaseConfig: false
      };

    default:
      return state;
  }
}
