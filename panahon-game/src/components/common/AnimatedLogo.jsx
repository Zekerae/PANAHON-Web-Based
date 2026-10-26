import React, { useEffect, useRef, useState } from "react";

/**
 * AnimatedLogo
 * 
 * Hardware-accelerated canvas renderer for the Panahon Chrono Shift animated logo.
 * Eliminates the solid black background in real-time using a WebGL fragment shader,
 * rendering crisp, glowing logo graphics with genuine alpha transparency over the
 * panning background map or loading screen.
 */
export default function AnimatedLogo({
  className = "main-menu-logo-video",
  style = {},
  alt = "PANAHON: Chrono Shift"
}) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    let isDestroyed = false;
    let gl = null;
    let program = null;
    let texture = null;
    let positionBuffer = null;
    let texCoordBuffer = null;
    let ctx2d = null;

    canvas.width = 1280;
    canvas.height = 720;

    // 1. Initialize WebGL Shader Pipeline
    try {
      gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: true
      }) || canvas.getContext("experimental-webgl", {
        alpha: true,
        premultipliedAlpha: false
      });
    } catch {
      gl = null;
    }

    if (gl) {
      const vsSource = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `;

      const fsSource = `
        precision mediump float;
        uniform sampler2D u_image;
        varying vec2 v_texCoord;
        void main() {
          vec4 color = texture2D(u_image, v_texCoord);
          float brightness = max(color.r, max(color.g, color.b));
          // Key out black background smoothly:
          // Brightness <= 0.04 -> completely transparent (alpha = 0.0)
          // Brightness >= 0.16 -> completely opaque
          float alpha = smoothstep(0.04, 0.16, brightness);
          gl_FragColor = vec4(color.rgb, color.a * alpha);
        }
      `;

      const createShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = createShader(gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

      if (vs && fs) {
        program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          program = null;
        }
      }

      if (program) {
        gl.useProgram(program);

        const positions = new Float32Array([
          -1.0,  1.0,
           1.0,  1.0,
          -1.0, -1.0,
           1.0, -1.0
        ]);
        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const aPositionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(aPositionLocation);
        gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

        const texCoords = new Float32Array([
          0.0, 0.0,
          1.0, 0.0,
          0.0, 1.0,
          1.0, 1.0
        ]);
        texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

        const aTexCoordLocation = gl.getAttribLocation(program, "a_texCoord");
        gl.enableVertexAttribArray(aTexCoordLocation);
        gl.vertexAttribPointer(aTexCoordLocation, 2, gl.FLOAT, false, 0, 0);

        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
      } else {
        gl = null;
      }
    }

    if (!gl) {
      ctx2d = canvas.getContext("2d", { willReadFrequently: true });
    }

    // 2. Continuous Render Loop
    let hasTriggeredPlaying = false;

    const render = () => {
      if (isDestroyed) return;

      if (video.readyState >= 2 && !video.paused) {
        if (!hasTriggeredPlaying) {
          hasTriggeredPlaying = true;
          setIsVideoPlaying(true);
        }

        if (gl && program && texture) {
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        } else if (ctx2d) {
          ctx2d.clearRect(0, 0, canvas.width, canvas.height);
          ctx2d.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
          const data = frame.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const maxVal = r > g ? (r > b ? r : b) : (g > b ? g : b);
            if (maxVal < 14) {
              data[i + 3] = 0;
            } else if (maxVal < 36) {
              data[i + 3] = Math.round(((maxVal - 14) / 22) * 255);
            }
          }
          ctx2d.putImageData(frame, 0, 0);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    const startPlay = () => {
      video.play().catch(() => {});
    };

    video.addEventListener("loadeddata", startPlay);
    video.addEventListener("canplay", startPlay);
    startPlay();

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isDestroyed = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      video.removeEventListener("loadeddata", startPlay);
      video.removeEventListener("canplay", startPlay);
      video.pause();
      if (gl) {
        if (texture) gl.deleteTexture(texture);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer);
        if (program) gl.deleteProgram(program);
      }
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "block",
        lineHeight: 0,
        ...style
      }}
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay
        loop
        muted
        crossOrigin="anonymous"
        style={{ display: "none" }}
        poster="/assets/panahon_chrono_shift_logo.png"
      >
        <source src="/assets/panahon_chrono_shift_logo_anim.webm" type="video/webm" />
        <source src="/assets/panahon_chrono_shift_logo_anim.mp4" type="video/mp4" />
        <source src="/assets/panahon-logo.mp4" type="video/mp4" />
      </video>

      {/* Instant static poster before video stream starts */}
      <img
        src="/assets/panahon_chrono_shift_logo.png"
        alt={alt}
        style={{
          width: "100%",
          height: "auto",
          display: isVideoPlaying ? "none" : "block",
          pointerEvents: "none",
          userSelect: "none"
        }}
      />

      {/* Real-time hardware-keyed transparent canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "auto",
          display: isVideoPlaying ? "block" : "none",
          pointerEvents: "none",
          userSelect: "none"
        }}
        aria-label={alt}
      />
    </div>
  );
}
