// GUI Scaling Management System for PANAHON: Chrono Shift
import { useState, useEffect, useCallback } from 'react';
import sounds from './sound.js';

const STORAGE_KEY = 'panahon_gui_scale';
const DEFAULT_SCALE = 1.0;

export function getGuiScale() {
  if (typeof window === 'undefined') return DEFAULT_SCALE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.7 && parsed <= 1.6) {
        return parsed;
      }
    }
  } catch (_) {}
  return DEFAULT_SCALE;
}

export function setGuiScale(scale) {
  if (typeof window === 'undefined') return;
  const clamped = Math.min(1.5, Math.max(0.75, Number(scale) || DEFAULT_SCALE));
  try {
    localStorage.setItem(STORAGE_KEY, String(clamped));
  } catch (_) {}

  // Apply directly to root document element for 1-to-1 native zoom equivalent
  if (document && document.documentElement) {
    document.documentElement.style.zoom = clamped;
  }

  // Dispatch event for reactive React components across screens
  window.dispatchEvent(new CustomEvent('panahon_gui_scale_change', {
    detail: clamped
  }));

  return clamped;
}

export function resetGuiScale() {
  const res = setGuiScale(DEFAULT_SCALE);
  try {
    sounds.btnClick?.();
  } catch (_) {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('panahon_gui_scale_reset', {
      detail: { scale: DEFAULT_SCALE, message: 'GUI Scaling reset to 100% (Default).' }
    }));
  }
  return res;
}

export function initGuiScale() {
  if (typeof window === 'undefined') return;
  const current = getGuiScale();
  if (document && document.documentElement) {
    document.documentElement.style.zoom = current;
  }

  // Register emergency reset shortcut key: Alt+0, Ctrl+Alt+0, Alt+R, or Ctrl+0
  if (!window.__panahonGuiScaleListenerAttached) {
    window.__panahonGuiScaleListenerAttached = true;
    window.addEventListener('keydown', (e) => {
      const isZero = e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0';
      const isR = e.key === 'r' || e.key === 'R' || e.code === 'KeyR';

      // Alt+0, Alt+R, Ctrl+Alt+0, Cmd+Option+0, or Ctrl+0
      const isAltZero = e.altKey && isZero;
      const isAltR = e.altKey && isR;
      const isCtrlAltZero = (e.ctrlKey || e.metaKey) && e.altKey && isZero;
      const isCtrlZero = (e.ctrlKey || e.metaKey) && isZero;

      if (isAltZero || isAltR || isCtrlAltZero || isCtrlZero) {
        // Only prevent default on in-game combos so we don't interfere with typing in inputs
        const targetTag = e.target?.tagName?.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea' || e.target?.isContentEditable) {
          return;
        }

        if (isAltZero || isAltR || isCtrlAltZero) {
          e.preventDefault();
        }

        resetGuiScale();
      }
    });
  }
}

export function useGuiScale() {
  const [scale, setScale] = useState(() => getGuiScale());

  useEffect(() => {
    const handler = (e) => {
      setScale(e.detail || getGuiScale());
    };
    window.addEventListener('panahon_gui_scale_change', handler);
    return () => window.removeEventListener('panahon_gui_scale_change', handler);
  }, []);

  const updateScale = useCallback((newVal) => {
    setGuiScale(newVal);
  }, []);

  return [scale, updateScale];
}
