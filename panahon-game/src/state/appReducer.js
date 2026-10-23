export const initialAppState = {
  currentScreen: 'title', // 'title' | 'lobby' | 'game' | 'endgame' | 'map-editor'
  lobbyMode: 'local', // 'local' | 'online'
  showGuide: false,
  showSupabaseConfig: false,
  maximizedCardData: null,
  localPlayers: [
    { name: 'Player 1', roleKey: 'HISTORIAN', type: 'human', difficulty: 'normal' },
    { name: 'Bot Explorer', roleKey: 'EXPLORER', type: 'ai', difficulty: 'normal' },
    { name: 'Bot Guardian', roleKey: 'GUARDIAN', type: 'ai', difficulty: 'normal' },
    { name: 'Bot Strategist', roleKey: 'STRATEGIST', type: 'ai', difficulty: 'normal' }
  ]
};

export function appReducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, currentScreen: action.screen };

    case 'OPEN_LOBBY':
      return {
        ...state,
        currentScreen: 'lobby',
        lobbyMode: action.mode || state.lobbyMode
      };

    case 'SET_LOBBY_MODE':
      return { ...state, lobbyMode: action.mode };

    case 'SET_LOCAL_PLAYERS':
      return {
        ...state,
        localPlayers: typeof action.payload === 'function' ? action.payload(state.localPlayers) : action.payload
      };

    case 'START_GAME':
      return {
        ...state,
        currentScreen: 'game',
        maximizedCardData: null
      };

    case 'GAME_OVER':
      return {
        ...state,
        currentScreen: 'endgame'
      };

    case 'OPEN_GUIDE':
      return { ...state, showGuide: true };

    case 'CLOSE_GUIDE':
      return { ...state, showGuide: false };

    case 'OPEN_SUPABASE_CONFIG':
      return { ...state, showSupabaseConfig: true };

    case 'CLOSE_SUPABASE_CONFIG':
      return { ...state, showSupabaseConfig: false };

    case 'SET_MAXIMIZED_CARD':
      return { ...state, maximizedCardData: action.cardData };

    case 'RETURN_TO_TITLE':
      return {
        ...state,
        currentScreen: 'title',
        maximizedCardData: null,
        showGuide: false,
        showSupabaseConfig: false
      };

    default:
      return state;
  }
}
