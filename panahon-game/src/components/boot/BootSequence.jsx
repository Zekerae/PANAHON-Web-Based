import React, { useState, useEffect, useRef } from "react";
import sounds from "../../sound.js";
import AnimatedLogo from "../common/AnimatedLogo.jsx";

export default function BootSequence({ onComplete, forceVideo = false }) {
  const [stage, setStage] = useState(() => {
    if (forceVideo) return "video";
    try {
      // 1. Navigation Timing API: check if this load was triggered by browser refresh/reload
      const navEntry = typeof performance !== "undefined" && performance.getEntriesByType
        ? performance.getEntriesByType("navigation")?.[0]
        : null;
      const isReload = navEntry
        ? navEntry.type === "reload"
        : (typeof performance !== "undefined" && performance.navigation?.type === 1);

      // 2. Storage checks: has the intro video already been seen in this session or browser?
      const seenInSession = typeof sessionStorage !== "undefined" && sessionStorage.getItem("panahon_intro_seen") === "true";
      const seenGlobal = typeof localStorage !== "undefined" && localStorage.getItem("panahon_intro_seen") === "true";

      if (isReload || seenInSession || seenGlobal) {
        return "loading";
      }
    } catch (_) {}
    return "video";
  });
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing Chrono Core...");
  const [isMuted, setIsMuted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef(null);

  // Mark intro as seen so subsequent browser refreshes skip directly to loading screen
  useEffect(() => {
    try {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("panahon_intro_seen", "true");
      }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("panahon_intro_seen", "true");
      }
    } catch (_) {}
  }, []);

  // 1. INTRO VIDEO LOGIC: Prioritize unmuted sound at page visit
  useEffect(() => {
    if (stage !== "video") return;

    const video = videoRef.current;
    if (!video) return;

    // Explicitly configure unmuted audio with full volume
    video.muted = false;
    const vol = typeof sounds.sfxVolume === "number" && sounds.sfxVolume > 0 ? sounds.sfxVolume : 1.0;
    video.volume = vol;

    // Attempt unmuted autoplay directly
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Autoplay with sound succeeded on page visit!
          setIsMuted(false);
        })
        .catch(() => {
          // Browser autoplay policy blocked unmuted sound on cold load.
          // Fall back to playing visually, but unmute as soon as any interaction occurs.
          video.muted = true;
          setIsMuted(true);
          video.play().catch((err) => {
            console.warn("Autoplay blocked, proceeding to loading:", err);
            handleSkipVideo();
          });
        });
    }

    // Global listener: as soon as the user touches, clicks, or presses a key anywhere, unmute immediately
    const handleFirstInteraction = () => {
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1.0;
        setIsMuted(false);
      }
      try {
        sounds.init();
      } catch (_) {}
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSkipVideo();
      } else {
        handleFirstInteraction();
      }
    };

    window.addEventListener("pointerdown", handleFirstInteraction, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [stage]);

  const handleSkipVideo = () => {
    try {
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem("panahon_intro_seen", "true");
      if (typeof localStorage !== "undefined") localStorage.setItem("panahon_intro_seen", "true");
    } catch (_) {}
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setStage("loading");
  };

  const handleUnmute = (e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      setIsMuted(false);
    }
  };

  // 2. LOADING SCREEN LOGIC: Automatic transition to Main Menu (No Button)
  useEffect(() => {
    if (stage !== "loading") return;

    try {
      sounds.init();
    } catch (_) {}

    const messages = [
      { at: 10, msg: "Initializing Chrono Core & Temporal Relays..." },
      { at: 30, msg: "Synchronizing 4 Eras: Spanish, American, Japanese, Myth..." },
      { at: 55, msg: "Decrypting 104 Historical Cards & Relic Coordinates..." },
      { at: 80, msg: "Calibrating Operative Dossiers & Map Cartography..." },
      { at: 95, msg: "Stabilizing Timeline Resonance..." },
      { at: 100, msg: "Historical Continuum Ready." }
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 5;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        setStatusMessage("Historical Continuum Ready.");
        clearInterval(interval);

        // AUTOMATICALLY ENTER MAIN MENU:
        // Brief pause so 100% is cleanly perceived, then initiate fade-out & audio
        setTimeout(() => {
          try {
            sounds.startBgMusic();
          } catch (_) {}
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 450);
        }, 350);
      } else {
        setProgress(current);
        const match = messages.slice().reverse().find((m) => current >= m.at);
        if (match) setStatusMessage(match.msg);
      }
    }, 75);

    return () => clearInterval(interval);
  }, [stage, onComplete]);

  // STAGE 1: INTRO VIDEO
  if (stage === "video") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}
        onClick={isMuted ? handleUnmute : undefined}
      >
        <video
          ref={videoRef}
          src="/assets/PixelCrewIntro.mp4"
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            maxWidth: "100vw",
            maxHeight: "100vh"
          }}
          onEnded={handleSkipVideo}
          onError={handleSkipVideo}
        />

        {/* Ambient Unmute Prompt if blocked by browser autoplay policy */}
        {isMuted && (
          <div
            onClick={handleUnmute}
            style={{
              position: "absolute",
              bottom: "40px",
              background: "rgba(15, 23, 42, 0.85)",
              border: "1.5px solid rgba(56, 189, 248, 0.6)",
              boxShadow: "0 0 25px rgba(56, 189, 248, 0.4), 0 8px 24px rgba(0, 0, 0, 0.6)",
              borderRadius: "28px",
              padding: "10px 24px",
              color: "#38BDF8",
              fontFamily: "var(--font-display)",
              fontSize: "0.86rem",
              fontWeight: 800,
              letterSpacing: "2px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              animation: "pulseAudioPrompt 2s ease-in-out infinite",
              zIndex: 20
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>🔊</span>
            <span>TAP ANYWHERE FOR SOUND</span>
          </div>
        )}

        {/* Top-Right Controls */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 30
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSkipVideo();
            }}
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "20px",
              color: "#FFF",
              padding: "6px 18px",
              fontSize: "0.78rem",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              letterSpacing: "1px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)"
            }}
          >
            SKIP [ESC] ➔
          </button>
        </div>

        {/* Bottom studio branding hint */}
        <div
          style={{
            position: "absolute",
            bottom: isMuted ? "12px" : "20px",
            color: "rgba(255, 255, 255, 0.35)",
            fontSize: "0.7rem",
            letterSpacing: "2px",
            fontFamily: "var(--font-display)",
            pointerEvents: "none"
          }}
        >
          PIXEL CREW PRESENTS
        </div>

        <style>{`
          @keyframes pulseAudioPrompt {
            0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(56, 189, 248, 0.4); }
            50% { transform: scale(1.05); box-shadow: 0 0 35px rgba(56, 189, 248, 0.75); }
          }
        `}</style>
      </div>
    );
  }

  // STAGE 2: DUELYST THEMED LOADING SCREEN (Automatically enters Main Menu)
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(circle at 50% 38%, #0B192C 0%, #060D17 65%, #020617 100%)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
        opacity: isFadingOut ? 0 : 1,
        transition: "opacity 0.45s ease-in-out"
      }}
    >
      {/* Central Animated Chrono Logo (Hardware-accelerated transparent canvas) */}
      <div className="splash-logo-container">
        <AnimatedLogo className="splash-logo-video" alt="PANAHON: Chrono Shift" />
      </div>
      <div
        style={{
          fontSize: "0.72rem",
          color: "#64748B",
          letterSpacing: "1.5px",
          marginBottom: "32px",
          textAlign: "center"
        }}
      >
        Portal Anomaly Navigation and Historical Origin Network
      </div>

      {/* Loading Progress Bar Container */}
      <div style={{ width: "100%", maxWidth: "380px" }}>
        {/* Track */}
        <div
          style={{
            width: "100%",
            height: "12px",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1.5px solid rgba(56, 189, 248, 0.35)",
            borderRadius: "20px",
            padding: "2px",
            boxSizing: "border-box",
            boxShadow: "0 0 15px rgba(0, 0, 0, 0.6)",
            marginBottom: "10px"
          }}
        >
          {/* Animated Fill Bar */}
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: "10px",
              background: "linear-gradient(90deg, #0284C7 0%, #38BDF8 50%, #818CF8 100%)",
              boxShadow: "0 0 14px rgba(56, 189, 248, 0.75)",
              transition: "width 0.12s ease-out"
            }}
          />
        </div>

        {/* Telemetry Status Line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.72rem",
            color: "#94A3B8"
          }}
        >
          <span style={{ color: progress >= 100 ? "#34D399" : "#38BDF8", fontWeight: 700 }}>
            {statusMessage}
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#F8FAFC" }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulseGlyph {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px #38BDF8); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 15px #38BDF8); }
        }
      `}</style>
    </div>
  );
}
