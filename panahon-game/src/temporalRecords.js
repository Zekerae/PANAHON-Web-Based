/**
 * Temporal Records System for Panahon: Chrono Shift
 * Tracks persistent player statistics, mission outcomes, relics recovered, and operative rank.
 */

const RECORDS_STORAGE_KEY = 'panahon_temporal_records';

/**
 * Retrieves temporal records from localStorage.
 */
export function getTemporalRecords() {
  try {
    const raw = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' ? window.localStorage.getItem(RECORDS_STORAGE_KEY) : null;
    if (!raw) {
      return {
        missionsLogged: 0,
        missionsWon: 0,
        relicsRecovered: 0,
        cluesDecoded: 0,
        paradoxAverted: 0,
        missionHistory: []
      };
    }
    const parsed = JSON.parse(raw);
    return {
      missionsLogged: Number(parsed.missionsLogged) || 0,
      missionsWon: Number(parsed.missionsWon) || 0,
      relicsRecovered: Number(parsed.relicsRecovered) || 0,
      cluesDecoded: Number(parsed.cluesDecoded) || 0,
      paradoxAverted: Number(parsed.paradoxAverted) || 0,
      missionHistory: Array.isArray(parsed.missionHistory) ? parsed.missionHistory : []
    };
  } catch (err) {
    console.warn('[TemporalRecords] Failed to read records:', err);
    return {
      missionsLogged: 0,
      missionsWon: 0,
      relicsRecovered: 0,
      cluesDecoded: 0,
      paradoxAverted: 0,
      missionHistory: []
    };
  }
}

/**
 * Saves temporal records to localStorage and dispatches an update event.
 */
export function saveTemporalRecords(records) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('panahon_records_updated', { detail: records }));
    }
  } catch (err) {
    console.warn('[TemporalRecords] Failed to save records:', err);
  }
}

let lastRecordedMatchId = null;

/**
 * Records the outcome of a completed match.
 */
export function recordMatchCompletion(gameState, humanPlayerName) {
  if (!gameState || !Array.isArray(gameState.players)) return null;

  // Prevent double logging the same match instance
  const matchId = `${gameState.turnNumber || 0}_${gameState.endReason || 'end'}_${gameState.timelineMeter || 0}`;
  if (lastRecordedMatchId === matchId) return getTemporalRecords();
  lastRecordedMatchId = matchId;

  const currentRecords = getTemporalRecords();

  // Identify the local human player
  const humanPlayer = gameState.players.find(p => 
    (humanPlayerName && p.name === humanPlayerName) ||
    (!p.isAi && p.type !== 'ai')
  ) || gameState.players[0];

  if (!humanPlayer) return currentRecords;

  const isCollapse = gameState.endReason === 'collapse' || (gameState.timelineMeter >= 10);
  const isWinner = !isCollapse && Boolean(gameState.winner) && (
    gameState.winner.id === humanPlayer.id || gameState.winner.name === humanPlayer.name
  );

  const relicsCount = Array.isArray(humanPlayer.artifactCards) 
    ? humanPlayer.artifactCards.length 
    : (humanPlayer.missionComplete ? 1 : 0);

  const cluesCount = Array.isArray(humanPlayer.clueCards)
    ? humanPlayer.clueCards.filter(c => c && !c.isDecoy).length
    : 0;

  const newRecords = {
    ...currentRecords,
    missionsLogged: currentRecords.missionsLogged + 1,
    missionsWon: currentRecords.missionsWon + (isWinner ? 1 : 0),
    relicsRecovered: currentRecords.relicsRecovered + relicsCount,
    cluesDecoded: currentRecords.cluesDecoded + cluesCount,
    missionHistory: [
      {
        id: 'msn_' + Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        roleKey: humanPlayer.roleKey || 'HISTORIAN',
        roleName: humanPlayer.role?.name || humanPlayer.roleKey || 'Historian',
        outcome: isWinner ? 'VICTORY' : (isCollapse ? 'COLLAPSE' : 'DEFEAT'),
        rank: humanPlayer.placementRank ? `#${humanPlayer.placementRank}` : (isWinner ? "1st" : "Unfinished"),
        relics: relicsCount,
        clues: cluesCount,
        era: humanPlayer.currentEra || 'spanish',
        turns: gameState.turnNumber || 1
      },
      ...currentRecords.missionHistory
    ].slice(0, 15)
  };

  saveTemporalRecords(newRecords);
  return newRecords;
}

/**
 * Simulates a training drill or sample mission for quick testing or calibration.
 */
export function logSimulationMission(outcome = 'VICTORY') {
  const currentRecords = getTemporalRecords();
  const isWin = outcome === 'VICTORY';
  const newRecords = {
    ...currentRecords,
    missionsLogged: currentRecords.missionsLogged + 1,
    missionsWon: currentRecords.missionsWon + (isWin ? 1 : 0),
    relicsRecovered: currentRecords.relicsRecovered + (isWin ? 1 : 0),
    cluesDecoded: currentRecords.cluesDecoded + Math.floor(Math.random() * 3 + 1),
    missionHistory: [
      {
        id: 'sim_' + Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        roleKey: 'HISTORIAN',
        roleName: 'Historian',
        outcome: outcome,
        rank: isWin ? "1st" : "Defeat",
        relics: isWin ? 1 : 0,
        clues: 2,
        era: 'spanish',
        turns: 12,
        isSimulated: true
      },
      ...currentRecords.missionHistory
    ].slice(0, 15)
  };
  saveTemporalRecords(newRecords);
  return newRecords;
}

/**
 * Resets temporal service records.
 */
export function resetTemporalRecords() {
  const empty = {
    missionsLogged: 0,
    missionsWon: 0,
    relicsRecovered: 0,
    cluesDecoded: 0,
    paradoxAverted: 0,
    missionHistory: []
  };
  saveTemporalRecords(empty);
  return empty;
}

/**
 * Calculates Operative Rank & standing based on temporal service.
 */
export function getOperativeRank(records) {
  const missions = records?.missionsLogged || 0;
  const wins = records?.missionsWon || 0;
  const score = missions + (wins * 2);

  if (score >= 30) return { rank: 'Rank V', title: 'Chrono Archon', insignia: '🌟🌟🌟🌟🌟', color: '#FFD700' };
  if (score >= 18) return { rank: 'Rank IV', title: 'Master Operative', insignia: '⭐⭐⭐⭐', color: '#F5C442' };
  if (score >= 10) return { rank: 'Rank III', title: 'Temporal Sentinel', insignia: '⭐⭐⭐', color: '#E5C58A' };
  if (score >= 4) return { rank: 'Rank II', title: 'Timeline Pathfinder', insignia: '⭐⭐', color: '#A69279' };
  return { rank: 'Rank I', title: 'Novice Chrono Scout', insignia: '⭐', color: '#8C7764' };
}
