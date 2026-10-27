// ===== PANAHON: CHRONO SHIFT - COMPREHENSIVE DEBUG LOGGER =====
// Provides structured, timestamped in-memory ring-buffer logging,
// formatted browser console output, live subscriptions for UI,
// export/copy tools, and turn/network diagnostics.

export const LOG_CATEGORIES = {
  ENGINE: 'ENGINE',
  TURN: 'TURN',
  ACTION: 'ACTION',
  PHASE: 'PHASE',
  DICE: 'DICE',
  CARDS: 'CARDS',
  NETWORK: 'NETWORK',
  AI: 'AI',
  UI: 'UI',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

const CATEGORY_STYLES = {
  ENGINE: 'background: #0284C7; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  TURN: 'background: #D97706; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  ACTION: 'background: #059669; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  PHASE: 'background: #4F46E5; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  DICE: 'background: #7C3AED; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  CARDS: 'background: #0D9488; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  NETWORK: 'background: #DB2777; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  AI: 'background: #475569; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  UI: 'background: #52525B; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  WARN: 'background: #CA8A04; color: #18181B; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
  ERROR: 'background: #DC2626; color: #FFFFFF; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
};

const MAX_LOG_ENTRIES = 1200;

class GameLogger {
  constructor() {
    this.logs = [];
    this.listeners = new Set();
    this.idCounter = 0;
  }

  _formatTime(date = new Date()) {
    const pad = (n, s = 2) => String(n).padStart(s, '0');
    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    const sec = pad(date.getSeconds());
    const ms = pad(date.getMilliseconds(), 3);
    return `${h}:${m}:${sec}.${ms}`;
  }

  log(category, message, data = null, level = 'info') {
    const now = new Date();
    const entry = {
      id: ++this.idCounter,
      time: this._formatTime(now),
      timestamp: now.getTime(),
      category: (category || 'ENGINE').toUpperCase(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
      data: data ? (typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data) : null,
      level: level.toLowerCase() // 'info' | 'warn' | 'error'
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs.shift();
    }

    // Console output with rich visual styling
    const style = CATEGORY_STYLES[entry.category] || CATEGORY_STYLES.ENGINE;
    const prefix = `%c[${entry.category}]`;
    const timeStr = `[${entry.time}]`;

    if (entry.level === 'error') {
      console.error(prefix, style, timeStr, entry.message, entry.data || '');
    } else if (entry.level === 'warn') {
      console.warn(prefix, style, timeStr, entry.message, entry.data || '');
    } else {
      console.log(prefix, style, timeStr, entry.message, entry.data || '');
    }

    // Notify listeners
    this._notify(entry);
    return entry;
  }

  // --- Convenience Shortcuts ---
  engine(msg, data) {
    return this.log(LOG_CATEGORIES.ENGINE, msg, data, 'info');
  }

  turn(msg, data) {
    return this.log(LOG_CATEGORIES.TURN, msg, data, 'info');
  }

  phase(fromPhase, toPhase, details) {
    const msg = `Phase Shift: ${fromPhase || 'none'} ➔ ${toPhase}`;
    return this.log(LOG_CATEGORIES.PHASE, msg, details, 'info');
  }

  action(actionName, player, details) {
    const pName = typeof player === 'string' ? player : (player?.name || 'Player');
    const msg = `${pName} did: ${actionName}`;
    return this.log(LOG_CATEGORIES.ACTION, msg, details, 'info');
  }

  dice(type, player, result, details) {
    const pName = typeof player === 'string' ? player : (player?.name || 'Player');
    const msg = `${pName} rolled ${type}: [ ${result} ]`;
    return this.log(LOG_CATEGORIES.DICE, msg, details, 'info');
  }

  card(cardType, player, cardName, details) {
    const pName = typeof player === 'string' ? player : (player?.name || 'Player');
    const msg = `${pName} drew ${cardType}: "${cardName}"`;
    return this.log(LOG_CATEGORIES.CARDS, msg, details, 'info');
  }

  netSend(type, payload) {
    const msg = `SEND Action ➔ ${type}`;
    return this.log(LOG_CATEGORIES.NETWORK, msg, payload, 'info');
  }

  netRecv(type, payload) {
    const msg = `RECV Action ⬅️ ${type}`;
    return this.log(LOG_CATEGORIES.NETWORK, msg, payload, 'info');
  }

  ai(msg, details) {
    return this.log(LOG_CATEGORIES.AI, `🤖 ${msg}`, details, 'info');
  }

  ui(msg, details) {
    return this.log(LOG_CATEGORIES.UI, msg, details, 'info');
  }

  warn(msg, details) {
    return this.log(LOG_CATEGORIES.WARN, `⚠️ ${msg}`, details, 'warn');
  }

  error(msg, err) {
    const errDetails = err instanceof Error ? { message: err.message, stack: err.stack } : err;
    return this.log(LOG_CATEGORIES.ERROR, `❌ ${msg}`, errDetails, 'error');
  }

  // --- Subscription Pattern ---
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  _notify(newEntry) {
    this.listeners.forEach((cb) => {
      try {
        cb(newEntry, this.logs);
      } catch (err) {
        console.error('[GameLogger] Subscriber error:', err);
      }
    });
  }

  // --- Retrieval & Export ---
  getLogs() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.log(LOG_CATEGORIES.ENGINE, 'Log chronicle wiped clean.');
  }

  getFormattedText() {
    const lines = [
      '=====================================================================',
      `PANAHON: CHRONO SHIFT - DEBUG LOG EXPORT (${new Date().toISOString()})`,
      `Total Log Entries: ${this.logs.length}`,
      '=====================================================================',
      ''
    ];

    this.logs.forEach((l) => {
      let dataStr = '';
      if (l.data) {
        try {
          dataStr = ' | ' + JSON.stringify(l.data);
        } catch (_) {}
      }
      lines.push(`[${l.time}] [${l.category.padEnd(8)}] ${l.message}${dataStr}`);
    });

    lines.push('');
    lines.push('============================ END OF LOG ============================');
    return lines.join('\n');
  }

  async copyToClipboard() {
    const text = this.getFormattedText();
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }

  downloadLogs(filename) {
    const text = this.getFormattedText();
    const fname = filename || `panahon-debug-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const gameLogger = new GameLogger();

// Attach globally for instant devtools access
if (typeof window !== 'undefined') {
  window.__PANAHON_LOGGER__ = gameLogger;
  window.getGameLogs = () => gameLogger.getLogs();
  window.copyGameLogs = () => gameLogger.copyToClipboard();
  window.downloadGameLogs = (name) => gameLogger.downloadLogs(name);
}

export default gameLogger;
