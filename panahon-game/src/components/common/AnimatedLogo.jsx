import React, { useEffect, useRef, useState } from "react";

/**
 * AnimatedLogo (Procedural Chrono Shift Engine)
 * 
 * Replaces the AI video with a native, high-performance procedural animation:
 * - 100% genuine RGBA transparency (zero black background, zero compression artifacts)
 * - Boundless temporal particles, solar embers, and cyan binary data streams
 * - Concentric expanding portal shockwaves behind the logo
 * - Rotating solar rays behind the Baybayin sun gear
 * - Smooth 60fps organic levitation preserving authentic pixel art lettering with zero clutter
 */
export default function AnimatedLogo({
  className = "main-menu-logo-video",
  style = {},
  alt = "PANAHON: Chrono Shift"
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isDestroyed = false;

    // High-DPI canvas dimensions
    const BASE_W = 1400;
    const BASE_H = 890;
    canvas.width = BASE_W;
    canvas.height = BASE_H;

    // 1. Preload Logo Image
    const logoImg = new Image();
    logoImg.src = "/assets/panahon_chrono_shift_logo.png";
    logoImg.onload = () => {
      if (!isDestroyed) setIsLogoLoaded(true);
    };

    // 2. Boundless Particle System (Solar Embers + Cyber Binary Bits)
    const PARTICLE_COUNT = 38;
    const particles = [];
    const emberColors = ["#F5C442", "#FFD700", "#F97316", "#FB923C", "#FDE047"];
    const cyanColors = ["#38BDF8", "#0EA5E9", "#7DD3FC", "#A5F3FC", "#E0F2FE"];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const isCyan = i < 18;
      particles.push({
        isCyan,
        isBinary: isCyan && Math.random() > 0.45,
        char: Math.random() > 0.5 ? "1" : "0",
        x: isCyan ? (0.16 + Math.random() * 0.34) : (0.48 + Math.random() * 0.38),
        y: 0.20 + Math.random() * 0.62,
        vx: (Math.random() - 0.5) * (isCyan ? 0.0009 : 0.0015),
        vy: -0.0007 - Math.random() * 0.0016,
        size: Math.random() > 0.6 ? 3 : 2,
        color: isCyan
          ? cyanColors[Math.floor(Math.random() * cyanColors.length)]
          : emberColors[Math.floor(Math.random() * emberColors.length)],
        maxAlpha: 0.35 + Math.random() * 0.55,
        life: Math.floor(Math.random() * 120),
        maxLife: 85 + Math.floor(Math.random() * 95)
      });
    }

    // 3. Shockwave Wavepool (Behind the logo)
    const shockwaves = [
      { progress: 0.0, speed: 0.0055 },
      { progress: 0.35, speed: 0.0055 },
      { progress: 0.70, speed: 0.0055 }
    ];

    let startTime = performance.now();

    // 4. Main Render Loop
    const render = (now) => {
      if (isDestroyed) return;

      const elapsed = (now - startTime) * 0.001; // seconds

      ctx.clearRect(0, 0, BASE_W, BASE_H);

      // Logo layout metrics inside the 1400x890 bounding canvas
      const logoW = 1200;
      const logoH = Math.round(logoW * (1358 / 2128)); // ~765px
      const baseLx = (BASE_W - logoW) / 2;
      const baseLy = (BASE_H - logoH) / 2;

      // Subtle organic breathing float
      const bobY = Math.sin(elapsed * 1.5) * 5.0;
      const breatheScale = 1.0 + Math.sin(elapsed * 1.2) * 0.008;

      const lx = baseLx;
      const ly = baseLy + bobY;

      // Nexus Portal Coordinates (where the cyan loop meets the orange sun gear)
      const ncx = lx + logoW * 0.478;
      const ncy = ly + logoH * 0.474;

      // --- LAYER A: AMBIENT VORTEX NEBULA & ROTATING SOLAR RAYS (BEHIND LOGO) ---
      // A1. Cyan Ambient Glow (Left realm)
      const cyanGlowR = 210 + Math.sin(elapsed * 2.0) * 22;
      const cyanGrad = ctx.createRadialGradient(ncx - 80, ncy, 10, ncx - 80, ncy, cyanGlowR);
      cyanGrad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
      cyanGrad.addColorStop(0.5, "rgba(14, 165, 233, 0.15)");
      cyanGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");
      ctx.fillStyle = cyanGrad;
      ctx.beginPath();
      ctx.arc(ncx - 80, ncy, cyanGlowR, 0, Math.PI * 2);
      ctx.fill();

      // A2. Solar Amber Glow (Right realm)
      const amberGlowR = 230 + Math.cos(elapsed * 2.2) * 25;
      const amberGrad = ctx.createRadialGradient(ncx + 80, ncy, 10, ncx + 80, ncy, amberGlowR);
      amberGrad.addColorStop(0, "rgba(245, 158, 11, 0.32)");
      amberGrad.addColorStop(0.5, "rgba(234, 88, 12, 0.14)");
      amberGrad.addColorStop(1, "rgba(245, 158, 11, 0.0)");
      ctx.fillStyle = amberGrad;
      ctx.beginPath();
      ctx.arc(ncx + 80, ncy, amberGlowR, 0, Math.PI * 2);
      ctx.fill();

      // A3. Rotating Solar Rays behind Baybayin Gear
      const gearCenterX = ncx + logoW * 0.19;
      const gearCenterY = ncy;
      ctx.save();
      ctx.translate(gearCenterX, gearCenterY);
      ctx.rotate(elapsed * 0.08); // slow clockwise rotation
      const rayCount = 14;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i * Math.PI * 2) / rayCount;
        const rayLen = 195 + Math.sin(elapsed * 3 + i) * 18;
        const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
        rayGrad.addColorStop(0, "rgba(254, 240, 138, 0.24)");
        rayGrad.addColorStop(0.65, "rgba(245, 158, 11, 0.10)");
        rayGrad.addColorStop(1, "rgba(245, 158, 11, 0.0)");
        ctx.strokeStyle = rayGrad;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
        ctx.stroke();
      }
      ctx.restore();

      // A4. Expanding Temporal Shockwave Rings from the Nexus
      for (let i = 0; i < shockwaves.length; i++) {
        const sw = shockwaves[i];
        sw.progress += sw.speed;
        if (sw.progress > 1.0) sw.progress = 0.0;

        const maxRadius = 280;
        const radius = 15 + sw.progress * maxRadius;
        const alpha = Math.sin((1.0 - sw.progress) * Math.PI * 0.5) * 0.65;

        ctx.save();
        ctx.beginPath();
        ctx.arc(ncx, ncy, radius, 0, Math.PI * 2);
        const waveGrad = ctx.createLinearGradient(ncx - radius, ncy, ncx + radius, ncy);
        waveGrad.addColorStop(0, `rgba(56, 189, 248, ${alpha * 0.9})`);
        waveGrad.addColorStop(0.48, `rgba(255, 255, 255, ${alpha})`);
        waveGrad.addColorStop(1, `rgba(245, 196, 66, ${alpha * 0.9})`);
        ctx.strokeStyle = waveGrad;
        ctx.lineWidth = Math.max(1, 3.5 * (1.0 - sw.progress));
        ctx.shadowColor = sw.progress < 0.5 ? "#38BDF8" : "#F5C442";
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
      }

      // --- LAYER B: THE CORE LOGO ARTWORK (UNTOUCHED PIXEL ART) ---
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.save();
        ctx.translate(BASE_W / 2, BASE_H / 2 + bobY);
        ctx.scale(breatheScale, breatheScale);
        ctx.translate(-BASE_W / 2, -(BASE_H / 2 + bobY));

        ctx.imageSmoothingEnabled = false; // preserve authentic pixel art sharpness
        ctx.drawImage(logoImg, lx, ly, logoW, logoH);
        ctx.restore();
      }

      // --- LAYER C: BOUNDLESS PARTICLES & BINARY DATA STREAM ---
      ctx.font = "bold 11px monospace";
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life > p.maxLife || p.x < 0.02 || p.x > 0.98 || p.y < 0.02) {
          p.x = p.isCyan ? (0.16 + Math.random() * 0.34) : (0.48 + Math.random() * 0.38);
          p.y = 0.22 + Math.random() * 0.58;
          p.vx = (Math.random() - 0.5) * (p.isCyan ? 0.0010 : 0.0018);
          p.vy = -0.0008 - Math.random() * 0.0016;
          p.life = 0;
          p.maxLife = 85 + Math.floor(Math.random() * 95);
        }

        const progress = p.life / p.maxLife;
        const currentAlpha = Math.sin(progress * Math.PI) * p.maxAlpha;
        const px = Math.round(p.x * BASE_W);
        const py = Math.round(p.y * BASE_H);

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;

        if (p.isBinary) {
          ctx.fillText(p.char, px, py);
        } else {
          ctx.fillRect(px, py, p.size, p.size);
        }
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isDestroyed = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        overflow: "hidden",
        userSelect: "none",
        pointerEvents: "none",
        maxWidth: "100%",
        maxHeight: "100%",
        ...style
      }}
      aria-label={alt}
    >
      {/* Static Fallback shown until canvas is mounted & loaded */}
      {!isLogoLoaded && (
        <img
          src="/assets/panahon_chrono_shift_logo.png"
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            aspectRatio: "1400 / 890",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
            imageRendering: "pixelated"
          }}
        />
      )}

      {/* Main Procedural Chrono Shift Animation Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          width: "100%",
          height: "100%",
          objectFit: "contain",
          aspectRatio: "1400 / 890",
          display: isLogoLoaded ? "block" : "none",
          imageRendering: "auto"
        }}
      />
    </div>
  );
}
