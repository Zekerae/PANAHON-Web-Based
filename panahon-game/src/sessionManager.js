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

import { EVENT_CARDS, DANGER_CARDS, ROLES } from './gameData.js';

const SESSION_STORAGE_KEY = 'panahon_active_game_session';
let lastSaveTime = 0;
let pendingSaveTimeout = null;

// Build lookup maps for event and danger card prototypes to rehydrate functions
const eventCardMap = new Map();
Object.values(EVENT_CARDS).forEach(deck => {
  if (Array.isArray(deck)) {
    deck.forEach(c => {
      if (c && c.id) eventCardMap.set(c.id, c);
    });
  }
});

const dangerCardMap = new Map();
Object.values(DANGER_CARDS).forEach(deck => {
  if (Array.isArray(deck)) {
    deck.forEach(c => {
      if (c && c.id) dangerCardMap.set(c.id, c);
    });
  }
});

/**
 * Re-hydrates card function pointers (effect, check, failEffect, rewardEffect)
 * on cards that were serialized to JSON.
 */
export function rehydrateState(state) {
  if (!state || typeof state !== 'object') return state;

  const rehydrateCard = (card) => {
    if (!card || !card.id) return card;
    const orig = eventCardMap.get(card.id) || dangerCardMap.get(card.id);
    if (!orig) return card;

    return {
      ...card,
      effect: orig.effect || card.effect,
      check: orig.check || card.check,
      failEffect: orig.failEffect || card.failEffect,
      rewardEffect: orig.rewardEffect || card.rewardEffect
    };
  };

  // Rehydrate eventDecks
  if (state.eventDecks) {
    Object.keys(state.eventDecks).forEach(era => {
      if (Array.isArray(state.eventDecks[era])) {
        state.eventDecks[era] = state.eventDecks[era].map(rehydrateCard);
      }
    });
  }

  // Rehydrate dangerDecks
  if (state.dangerDecks) {
    Object.keys(state.dangerDecks).forEach(era => {
      if (Array.isArray(state.dangerDecks[era])) {
        state.dangerDecks[era] = state.dangerDecks[era].map(rehydrateCard);
      }
    });
  }

  // Rehydrate pendingModal
  if (state.pendingModal && state.pendingModal.card) {
    state.pendingModal.card = rehydrateCard(state.pendingModal.card);
  }

  // Rehydrate pendingChoice
  if (state.pendingChoice && state.pendingChoice.card) {
    state.pendingChoice.card = rehydrateCard(state.pendingChoice.card);
  }

  // Rehydrate player roles if needed
  if (Array.isArray(state.players)) {
    state.players.forEach(p => {
      if (p && p.roleKey && ROLES[p.roleKey]) {
        p.role = ROLES[p.roleKey];
      }
    });
  }

  return state;
}

/**
 * Saves current active session into getLocalStorage()? with throttling.
 */
export function saveActiveSession(sessionData, immediate = false) {
  if (!sessionData || !sessionData.gameState || sessionData.gameState.gameOver) {
    return;
  }

  const doSave = () => {
    try {
      const payload = {
        version: 1,
        savedAt: Date.now(),
        mode: sessionData.mode || 'local',
        screen: sessionData.screen || 'game',
        playerConfigs: sessionData.playerConfigs || null,
        onlineInfo: sessionData.onlineInfo || null,
        gameState: sessionData.gameState
      };
      getLocalStorage()?.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
      lastSaveTime = Date.now();
    } catch (err) {
      console.warn('[SessionManager] Failed to save session to getLocalStorage()?:', err);
    }
  };

  if (immediate) {
    if (pendingSaveTimeout) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
    }
    doSave();
    return;
  }

  const now = Date.now();
  if (now - lastSaveTime > 1500) {
    if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
    doSave();
  } else if (!pendingSaveTimeout) {
    pendingSaveTimeout = setTimeout(() => {
      pendingSaveTimeout = null;
      doSave();
    }, 1500);
  }
}

/**
 * Retrieves the stored session from getLocalStorage()? if valid.
 */
export function getActiveSession() {
  try {
    const raw = getLocalStorage()?.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.gameState || parsed.gameState.gameOver) {
      clearActiveSession();
      return null;
    }

    // Sessions older than 24 hours are expired
    if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
      clearActiveSession();
      return null;
    }

    // Rehydrate state functions
    parsed.gameState = rehydrateState(parsed.gameState);
    return parsed;
  } catch (err) {
    console.warn('[SessionManager] Failed to read active session:', err);
    clearActiveSession();
    return null;
  }
}

/**
 * Clears the stored session from getLocalStorage()?.
 */
export function clearActiveSession() {
  try {
    if (pendingSaveTimeout) {
      clearTimeout(pendingSaveTimeout);
      pendingSaveTimeout = null;
    }
    getLocalStorage()?.removeItem(SESSION_STORAGE_KEY);
  } catch (_) {}
}

/**
 * Retrieves the stored operative profile name & role from getLocalStorage()?.
 */
export function getSavedProfile() {
  try {
    const name = getLocalStorage()?.getItem('panahon_player_name') || 'Operative One';
    const roleKey = getLocalStorage()?.getItem('panahon_player_role') || 'HISTORIAN';
    return { name: name.trim() || 'Operative One', roleKey };
  } catch {
    return { name: 'Operative One', roleKey: 'HISTORIAN' };
  }
}

/**
 * Saves operative profile to getLocalStorage()? and notifies active listeners.
 */
export function savePlayerProfile(name, roleKey) {
  try {
    const cleanName = (name || '').trim() || 'Operative One';
    getLocalStorage()?.setItem('panahon_player_name', cleanName);
    if (roleKey) getLocalStorage()?.setItem('panahon_player_role', roleKey);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('panahon_profile_updated', {
        detail: { name: cleanName, roleKey }
      }));
    }
    return { name: cleanName, roleKey };
  } catch (err) {
    console.warn('[SessionManager] Failed to save player profile:', err);
    return { name: 'Operative One', roleKey: 'HISTORIAN' };
  }
}
