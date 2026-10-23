import React, { useState, useEffect, useCallback } from "react";
import sounds from "../sound.js";

export default function OrientationPrompt() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkOrientation = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;
    const isMobileSize = width <= 920 || height <= 920;
    const hasTouch = "ontouchstart" in window || (navigator && navigator.maxTouchPoints > 0);

    const shouldShow = isPortrait && (isMobileSize || hasTouch);
    setIsPortraitMobile(shouldShow);

    // If device is rotated to landscape, reset dismissal so next time they rotate to portrait, prompt reappears
    if (!isPortrait) {
      setIsDismissed(false);
    }
  }, []);

  useEffect(() => {
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, [checkOrientation]);

  const handleRequestLandscape = async () => {
    try {
      sounds.btnClick();
    } catch (_) {}

    const el = document.documentElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    } catch (_) {}

    try {
      if (window.screen?.orientation?.lock) {
        await window.screen.orientation.lock("landscape");
      }
    } catch (_) {}
  };

  const handleDismiss = () => {
    try {
      sounds.btnClick();
    } catch (_) {}
    setIsDismissed(true);
  };

  if (!isPortraitMobile || isDismissed) {
    return null;
  }

  return (
    <div className="orientation-prompt-overlay" role="dialog" aria-modal="true">
      <div className="orientation-prompt-card">
        {/* Animated Rotating Phone Graphic */}
        <div className="orientation-animation-wrapper">
          <div className="phone-device-icon">
            <div className="phone-screen-notch" />
            <div className="phone-screen-content">
              <span className="phone-screen-map-icon">🗺️</span>
            </div>
          </div>
          <svg className="rotate-arrow-svg" viewBox="0 0 100 100">
            <path
              d="M 20,50 A 30,30 0 0,1 70,20"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="4"
              strokeDasharray="6 4"
              markerEnd="url(#rotate-arrowhead)"
            />
            <defs>
              <marker id="rotate-arrowhead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#38BDF8" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Temporal HUD Badge */}
        <div className="orientation-badge">
          <span className="pulse-dot" />
          <span>ORIENTATION LOCK • LANDSCAPE</span>
        </div>

        {/* Headline */}
        <h2 className="orientation-title">ROTATE TO LANDSCAPE</h2>
        <div className="orientation-subtitle">IPAIKOT SA LANDSCAPE MODE</div>

        {/* Description */}
        <p className="orientation-desc">
          <strong>Panahon: Chrono Shift</strong> is an interactive tactical board game spanning 4 historical eras. For the optimal strategic experience, please turn your device sideways to landscape mode.
        </p>

        {/* Action Buttons */}
        <div className="orientation-actions">
          <button
            type="button"
            className="btn-rotate-fullscreen"
            onClick={handleRequestLandscape}
          >
            <span>⛶</span>
            <span>ENTER FULLSCREEN & ROTATE</span>
          </button>

          <button
            type="button"
            className="btn-rotate-dismiss"
            onClick={handleDismiss}
          >
            Continue in Portrait anyway →
          </button>
        </div>
      </div>
    </div>
  );
}
