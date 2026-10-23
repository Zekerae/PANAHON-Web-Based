import { useState, useEffect, useCallback } from 'react';
import sounds from '../sound.js';

export function useAudio() {
  const [soundMuted, setSoundMuted] = useState(sounds.muted || false);

  useEffect(() => {
    let initialized = false;

    const handleFirstGesture = () => {
      if (initialized) return;
      initialized = true;
      sounds.init();
      sounds.startBgMusic();
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { once: true, passive: true });

    return () => {
      cleanupListeners();
    };
  }, []);

  const toggleSound = useCallback(() => {
    const nextMuted = sounds.toggleMute();
    setSoundMuted(nextMuted);
    return nextMuted;
  }, []);

  return {
    sounds,
    soundMuted,
    toggleSound
  };
}
