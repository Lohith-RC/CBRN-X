import { useEffect, useRef, useCallback } from 'react';

/**
 * CursorParallax — Tracks mouse position and applies real-time
 * parallax transforms to child layers based on cursor offset from
 * viewport center. Simulates head-tracking depth illusion.
 *
 * Returns: { cursorPos, parallaxStyle, vignetteCenterShift }
 */
export function useCursorParallax(isActive, parallaxIntensity = 15) {
  const cursorPos = useRef({ x: 0, y: 0 });
  const parallaxOffset = useRef({ x: 0, y: 0 });
  const targetOffset = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const listenersRef = useRef([]);

  // Smooth interpolation loop (lerp toward target)
  const animate = useCallback(() => {
    const lerpFactor = 0.08;
    parallaxOffset.current.x += (targetOffset.current.x - parallaxOffset.current.x) * lerpFactor;
    parallaxOffset.current.y += (targetOffset.current.y - parallaxOffset.current.y) * lerpFactor;

    // Notify all subscribers
    listenersRef.current.forEach(fn => fn({
      x: parallaxOffset.current.x,
      y: parallaxOffset.current.y,
      cursorX: cursorPos.current.x,
      cursorY: cursorPos.current.y
    }));

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      cursorPos.current.x = e.clientX;
      cursorPos.current.y = e.clientY;

      // Calculate offset from center, normalized to ±1 range, scaled by intensity
      targetOffset.current.x = ((e.clientX - centerX) / centerX) * parallaxIntensity;
      targetOffset.current.y = ((e.clientY - centerY) / centerY) * (parallaxIntensity * 0.6);
    };

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, parallaxIntensity, animate]);

  const subscribe = useCallback((fn) => {
    listenersRef.current.push(fn);
    return () => {
      listenersRef.current = listenersRef.current.filter(f => f !== fn);
    };
  }, []);

  return {
    cursorPos: cursorPos.current,
    subscribe,
    getParallaxCSS: (depth = 1) => ({
      transform: `translate(${parallaxOffset.current.x * depth}px, ${parallaxOffset.current.y * depth}px)`,
      transition: 'transform 0.05s linear'
    }),
    getVignetteCenterShift: () => ({
      backgroundPosition: `${50 + (parallaxOffset.current.x * 0.3)}% ${50 + (parallaxOffset.current.y * 0.3)}%`
    })
  };
}

/**
 * CursorParallaxLayer — Wrapper component that applies parallax
 * transform to its children based on mouse position.
 * depth: 0 = no movement, 1 = full movement, -1 = inverse
 */
export function CursorParallaxLayer({ children, depth = 1, subscribe, style = {} }) {
  const layerRef = useRef(null);

  useEffect(() => {
    if (!subscribe) return;

    const unsubscribe = subscribe(({ x, y }) => {
      if (layerRef.current) {
        layerRef.current.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
      }
    });

    return unsubscribe;
  }, [subscribe, depth]);

  return (
    <div ref={layerRef} style={{ willChange: 'transform', ...style }}>
      {children}
    </div>
  );
}
