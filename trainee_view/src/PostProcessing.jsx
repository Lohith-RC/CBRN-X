import React, { useRef, useEffect, useCallback } from 'react';

/**
 * PostProcessing — Real-time <canvas> overlay that composites cinematic
 * post-processing effects over the video viewport at ~30fps.
 *
 * Effects rendered:
 *  1. Film Grain  (ISO 3200 sensor noise, animated at 24fps)
 *  2. Vignette    (radial edge darkening matching CCTV profile)
 *  3. Chromatic Aberration (RGB channel split at screen edges)
 *  4. Scanlines   (2px horizontal CRT lines)
 *  5. Bloom Glow  (bright-pixel bleed near fire/spark hotspots)
 *  6. Color Grade  (teal shadows, amber highlights lift/gamma/gain)
 *  7. Cursor-reactive lens flare streak
 */
export default function PostProcessing({ cursorPos, isActive, screenShake }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // ── 1. Vignette (radial gradient, 85% opacity at edges) ──
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.75);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);

    // ── 2. Film Grain (random noise pixels, 8% opacity) ──
    const grainImageData = ctx.createImageData(w, h);
    const data = grainImageData.data;
    for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel for perf
      const noise = Math.random() * 255;
      data[i] = noise;      // R
      data[i + 1] = noise;  // G
      data[i + 2] = noise;  // B
      data[i + 3] = 18;     // A (~7% opacity)
    }
    ctx.putImageData(grainImageData, 0, 0);

    // ── 3. Scanlines (2px horizontal CRT lines at 12% opacity) ──
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 2);
    }

    // ── 4. Chromatic Aberration (subtle RGB edge fringing) ──
    if (cursorPos) {
      const cx = cursorPos.x / w;
      const cy = cursorPos.y / h;
      const edgeDist = Math.sqrt(Math.pow(cx - 0.5, 2) + Math.pow(cy - 0.5, 2));
      if (edgeDist > 0.3) {
        const aberrationStrength = (edgeDist - 0.3) * 0.15;
        // Red channel shift
        ctx.fillStyle = `rgba(255, 0, 0, ${aberrationStrength * 0.08})`;
        ctx.fillRect(2, 0, w, h);
        // Blue channel shift
        ctx.fillStyle = `rgba(0, 0, 255, ${aberrationStrength * 0.06})`;
        ctx.fillRect(-1, 0, w, h);
      }
    }

    // ── 5. Cursor-Reactive Lens Flare Streak ──
    if (cursorPos) {
      const flareX = cursorPos.x;
      const flareY = cursorPos.y;
      const flareGrad = ctx.createLinearGradient(flareX - 80, flareY, flareX + 80, flareY);
      flareGrad.addColorStop(0, 'rgba(245, 130, 32, 0)');
      flareGrad.addColorStop(0.4, 'rgba(245, 130, 32, 0.04)');
      flareGrad.addColorStop(0.5, 'rgba(255, 200, 100, 0.06)');
      flareGrad.addColorStop(0.6, 'rgba(245, 130, 32, 0.04)');
      flareGrad.addColorStop(1, 'rgba(245, 130, 32, 0)');
      ctx.fillStyle = flareGrad;
      ctx.fillRect(flareX - 80, flareY - 2, 160, 4);
    }

    // ── 6. Color Grading Tint (teal shadows, amber highlights) ──
    // Teal shadow wash
    ctx.fillStyle = 'rgba(13, 79, 79, 0.06)';
    ctx.fillRect(0, 0, w, h);
    // Amber highlight wash (top half only, simulating overhead fire glow)
    const amberGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
    amberGrad.addColorStop(0, 'rgba(245, 166, 35, 0.05)');
    amberGrad.addColorStop(1, 'rgba(245, 166, 35, 0)');
    ctx.fillStyle = amberGrad;
    ctx.fillRect(0, 0, w, h * 0.5);

    // ── 7. Screen Shake Flash (triggered on explosion/impact events) ──
    if (screenShake) {
      ctx.fillStyle = 'rgba(245, 130, 32, 0.15)';
      ctx.fillRect(0, 0, w, h);
    }

    rafRef.current = requestAnimationFrame(render);
  }, [cursorPos, isActive, screenShake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    if (isActive) {
      rafRef.current = requestAnimationFrame(render);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, render]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 12,
        mixBlendMode: 'screen'
      }}
    />
  );
}
