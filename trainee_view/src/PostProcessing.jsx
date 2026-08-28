import React, { useRef, useEffect, useCallback } from 'react';

/**
 * PostProcessing — Real-time <canvas> overlay compositing cinematic
 * post-processing effects with per-beat color grading awareness.
 *
 * Effects: Film Grain, Vignette, Chromatic Aberration, Scanlines,
 * Color Grading, Cursor Lens Flare, Breathing Fog (visor), Screen Shake.
 */
export default function PostProcessing({ cursorPos, isActive, screenShake, visorActive, beatIndex }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const timeRef = useRef(0);

  const render = useCallback((timestamp) => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    timeRef.current = timestamp * 0.001; // seconds

    ctx.clearRect(0, 0, w, h);

    // ── 1. Vignette (radial, 85% edge opacity) ──
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.22, w / 2, h / 2, w * 0.72);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.2)');
    vigGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.55)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    // ── 2. Film Grain (ISO 3200, animated at ~24fps) ──
    const grainData = ctx.createImageData(w, h);
    const d = grainData.data;
    for (let i = 0; i < d.length; i += 20) {
      const noise = Math.random() * 255;
      d[i] = noise;
      d[i + 1] = noise;
      d[i + 2] = noise;
      d[i + 3] = 16; // ~6% opacity
    }
    ctx.putImageData(grainData, 0, 0);

    // ── 3. Scanlines (2px CRT lines, 10% opacity) ──
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // ── 4. Chromatic Aberration (edge-dependent RGB split) ──
    if (cursorPos) {
      const cx = cursorPos.x / w;
      const cy = cursorPos.y / h;
      const edgeDist = Math.sqrt((cx - 0.5) ** 2 + (cy - 0.5) ** 2);
      if (edgeDist > 0.3) {
        const strength = (edgeDist - 0.3) * 0.12;
        ctx.fillStyle = `rgba(255, 0, 0, ${strength * 0.06})`;
        ctx.fillRect(2, 0, w, h);
        ctx.fillStyle = `rgba(0, 0, 255, ${strength * 0.04})`;
        ctx.fillRect(-1, 0, w, h);
      }
    }

    // ── 5. Cursor Lens Flare Streak ──
    if (cursorPos) {
      const fx = cursorPos.x;
      const fy = cursorPos.y;
      const flare = ctx.createLinearGradient(fx - 100, fy, fx + 100, fy);
      flare.addColorStop(0, 'rgba(245, 130, 32, 0)');
      flare.addColorStop(0.35, 'rgba(245, 130, 32, 0.03)');
      flare.addColorStop(0.5, 'rgba(255, 200, 100, 0.05)');
      flare.addColorStop(0.65, 'rgba(245, 130, 32, 0.03)');
      flare.addColorStop(1, 'rgba(245, 130, 32, 0)');
      ctx.fillStyle = flare;
      ctx.fillRect(fx - 100, fy - 2, 200, 4);
    }

    // ── 6. Per-Beat Color Tint ──
    if (beatIndex === 0) {
      // Beat 1 CCTV: green surveillance tint
      ctx.fillStyle = 'rgba(0, 80, 40, 0.04)';
      ctx.fillRect(0, 0, w, h);
    } else if (beatIndex === 2) {
      // Beat 3 Console: cool blue-white arc tint
      ctx.fillStyle = 'rgba(20, 60, 120, 0.05)';
      ctx.fillRect(0, 0, w, h);
    } else {
      // Default: teal shadow + amber highlight
      ctx.fillStyle = 'rgba(13, 79, 79, 0.04)';
      ctx.fillRect(0, 0, w, h);
      const amber = ctx.createLinearGradient(0, 0, 0, h * 0.45);
      amber.addColorStop(0, 'rgba(245, 166, 35, 0.04)');
      amber.addColorStop(1, 'rgba(245, 166, 35, 0)');
      ctx.fillStyle = amber;
      ctx.fillRect(0, 0, w, h * 0.45);
    }

    // ── 7. Breathing Fog (visor only, 4s sine cycle) ──
    if (visorActive) {
      const fogPhase = Math.sin(timeRef.current * Math.PI * 0.5); // 4s period (0.5 Hz * PI)
      const fogOpacity = Math.max(0, fogPhase * 0.12);
      if (fogOpacity > 0.01) {
        // Bottom-left corner fog blob
        const fogL = ctx.createRadialGradient(w * 0.15, h * 0.92, 0, w * 0.15, h * 0.92, w * 0.2);
        fogL.addColorStop(0, `rgba(180, 200, 210, ${fogOpacity})`);
        fogL.addColorStop(1, 'rgba(180, 200, 210, 0)');
        ctx.fillStyle = fogL;
        ctx.fillRect(0, h * 0.7, w * 0.4, h * 0.3);

        // Bottom-right corner fog blob
        const fogR = ctx.createRadialGradient(w * 0.85, h * 0.92, 0, w * 0.85, h * 0.92, w * 0.2);
        fogR.addColorStop(0, `rgba(180, 200, 210, ${fogOpacity * 0.8})`);
        fogR.addColorStop(1, 'rgba(180, 200, 210, 0)');
        ctx.fillStyle = fogR;
        ctx.fillRect(w * 0.6, h * 0.7, w * 0.4, h * 0.3);
      }
    }

    // ── 8. Screen Shake Flash ──
    if (screenShake) {
      ctx.fillStyle = 'rgba(245, 130, 32, 0.12)';
      ctx.fillRect(0, 0, w, h);
    }

    rafRef.current = requestAnimationFrame(render);
  }, [cursorPos, isActive, screenShake, visorActive, beatIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    if (isActive) rafRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, render]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12, mixBlendMode: 'screen' }}
    />
  );
}
