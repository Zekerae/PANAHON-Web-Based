import React, { useState, useEffect, useRef } from "react";
import sounds from "../../sound.js";

export default function BootSequence({ onComplete }) {
  const [stage, setStage] = useState("video"); // "video" | "loading" | "ready"
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing Chrono Core...");
  const [isMuted, setIsMuted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef(null);

  // 1. INTRO VIDEO LOGIC
  useEffect(() => {
    if (stage !== "video") return;

    const video = videoRef.current;
    if (video) {
      // Attempt unmuted play first; fallback to muted if browser blocks autoplay
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch((err) => {
          console.warn("Autoplay blocked entirely, proceeding to loading:", err);
          handleSkipVideo();
        });
      });
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleSkipVideo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage]);

  const handleSkipVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setStage("loading");
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // 2. LOADING SCREEN PROGRESS SIMULATION & PRELOAD
  useEffect(() => {
    if (stage !== "loading") return;

    // Preload audio and essential imagery
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
      current += Math.floor(Math.random() * 8) + 4;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        setStatusMessage("Historical Continuum Ready.");
        clearInterval(interval);
        setTimeout(() => {
          setStage("ready");
        }, 300);
      } else {
        setProgress(current);
        const match = messages.slice().reverse().find(m => current >= m.at);
        if (match) setStatusMessage(match.msg);
      }
    }, 85);

    return () => clearInterval(interval);
  }, [stage]);

  // Handle final transition into the Main Menu
  const handleEnterGame = () => {
    if (isFadingOut) return;
    sounds.btnClick();
    try {
      sounds.startBgMusic();
    } catch (_) {}
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 450);
  };

  useEffect(() => {
    if (stage !== "ready") return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        handleEnterGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, isFadingOut]);

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
          overflow: "hidden",
          cursor: "pointer"
        }}
        onClick={handleSkipVideo}
      >
        <video
          ref={videoRef}
          src="/assets/PixelCrewIntro.mp4"
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

        {/* Top-Right Controls */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            zIndex: 10
          }}
        >
          {isMuted && (
            <button
              onClick={handleToggleMute}
              style={{
                background: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "20px",
                color: "#FCD34D",
                padding: "6px 14px",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>🔇</span>
              <span>Click to Unmute</span>
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); handleSkipVideo(); }}
            style={{
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "20px",
              color: "#FFF",
              padding: "6px 16px",
              fontSize: "0.76rem",
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
            bottom: "20px",
            color: "rgba(255, 255, 255, 0.35)",
            fontSize: "0.7rem",
            letterSpacing: "2px",
            fontFamily: "var(--font-display)"
          }}
        >
          PIXEL CREW PRESENTS
        </div>
      </div>
    );
  }

  // STAGE 2: DUELYST THEMED LOADING SCREEN
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
        transition: "opacity 0.45s ease-in-out",
        cursor: stage === "ready" ? "pointer" : "default"
      }}
      onClick={stage === "ready" ? handleEnterGame : undefined}
    >
      {/* Central Chrono Core Anomaly Orb */}
      <div style={{ position: "relative", width: "130px", height: "130px", marginBottom: "28px" }}>
        {/* Outer Ring */}
        <div
          style={{
            position: "absolute",
            inset: "-12px",
            border: "1.5px dashed rgba(56, 189, 248, 0.35)",
            borderRadius: "50%",
            animation: "spinSlow 18s linear infinite"
          }}
        />

        {/* Middle Ring */}
        <div
          style={{
            position: "absolute",
            inset: "-2px",
            border: "1.5px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "50%",
            animation: "spinReverse 12s linear infinite"
          }}
        />

        {/* Core Sphere */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "radial-gradient(circle, #0284C7 0%, #0B192C 75%, #020617 100%)",
            border: "2px solid #38BDF8",
            boxShadow: "0 0 35px rgba(56, 189, 248, 0.5), inset 0 0 20px rgba(56, 189, 248, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.8rem"
          }}
        >
          <span style={{ animation: "pulseGlyph 2s ease-in-out infinite", display: "inline-block" }}>
            {stage === "ready" ? "⚡" : "⏳"}
          </span>
        </div>
      </div>

      {/* Brand Title */}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2.6rem",
          letterSpacing: "4px",
          color: "#F8FAFC",
          margin: "0 0 4px",
          textAlign: "center",
          textShadow: "0 0 25px rgba(56, 189, 248, 0.6)"
        }}
      >
        PANAHON
      </h1>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1rem",
          letterSpacing: "6px",
          color: "#E2E8F0",
          textTransform: "uppercase",
          fontWeight: 800,
          marginBottom: "6px"
        }}
      >
        CHRONO SHIFT
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
          <span style={{ color: stage === "ready" ? "#34D399" : "#38BDF8", fontWeight: 700 }}>
            {statusMessage}
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, color: "#F8FAFC" }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Enter Prompt when Ready */}
      {stage === "ready" && (
        <div style={{ marginTop: "28px", animation: "fadeIn 0.3s ease" }}>
          <button
            onClick={handleEnterGame}
            style={{
              background: "linear-gradient(135deg, #0284C7, #38BDF8)",
              border: "1.5px solid #7DD3FC",
              borderRadius: "8px",
              color: "#FFF",
              padding: "12px 32px",
              fontSize: "0.92rem",
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              letterSpacing: "2px",
              cursor: "pointer",
              boxShadow: "0 0 25px rgba(56, 189, 248, 0.6), 0 8px 20px rgba(0, 0, 0, 0.5)",
              animation: "pulseGlow 1.8s ease-in-out infinite"
            }}
          >
            ENTER TIMELINE ➔
          </button>
          <div
            style={{
              fontSize: "0.68rem",
              color: "#64748B",
              textAlign: "center",
              marginTop: "8px",
              letterSpacing: "1px"
            }}
          >
            CLICK ANYWHERE OR PRESS ANY KEY TO INITIALIZE
          </div>
        </div>
      )}

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
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(56, 189, 248, 0.5); }
          50% { transform: scale(1.03); box-shadow: 0 0 32px rgba(56, 189, 248, 0.85); }
        }
      `}</style>
    </div>
  );
}
