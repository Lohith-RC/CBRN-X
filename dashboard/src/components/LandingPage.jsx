import React, { useState, useEffect, useRef } from 'react';
import { Shield, ArrowRight, Play, Radio, Lock, Users } from 'lucide-react';

export default function LandingPage({ onEnterDashboard, onLaunchSim }) {
  const buttonRef = useRef(null);
  const canvasRef = useRef(null);

  // Magnetic Button State
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 });
  const [btnHovered, setBtnHovered] = useState(false);

  // Portal Transition State
  const [isInitializing, setIsInitializing] = useState(false);

  // Deep Space Ambient Particle Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const starCount = 70;
    const stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.4 + 0.4,
        alpha: Math.random() * 0.6 + 0.15,
        speed: Math.random() * 0.012 + 0.004,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle ambient radial glow in the center
      const centerX = width / 2;
      const centerY = height / 2;
      const glow = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, Math.min(width, height) * 0.55);
      glow.addColorStop(0, 'rgba(6, 182, 212, 0.035)');
      glow.addColorStop(0.5, 'rgba(16, 185, 129, 0.015)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Render drifting stars
      for (let i = 0; i < starCount; i++) {
        const s = stars[i];
        s.phase += s.speed;
        const currentAlpha = s.alpha + Math.sin(s.phase) * 0.25;
        const boundedAlpha = Math.max(0.06, Math.min(0.8, currentAlpha));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${boundedAlpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Magnetic Button Hover Mechanics
  const handleButtonMouseMove = (e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setBtnOffset({ x: x * 0.26, y: y * 0.26 });
  };

  const handleButtonMouseLeave = () => {
    setBtnHovered(false);
    setBtnOffset({ x: 0, y: 0 });
  };

  const handlePortalInit = () => {
    setIsInitializing(true);
    setTimeout(() => {
      onEnterDashboard();
    }, 600);
  };

  const teamMembers = [
    { name: 'Lohith R C', role: 'Team Lead, Unity Dev, Designer, DBA, Frontend Verifier, Backend Dev, Version Control Mgr' },
    { name: 'Monica K S', role: 'Backend Dev & DBA' },
    { name: 'Chandana M P', role: 'Admin Dashboard Dev (Frontend & Backend) & Workflow Mgr' },
    { name: 'Chandana M N', role: 'Frontend Dev, Designer & Unity Physics Dev' },
    { name: 'Harshini R B', role: 'Unity Environment Artist & 3D Asset Dev' },
    { name: 'Pavitra J H', role: 'UI/UX Designer, Tester, Doc Mgr & Progress Tracker' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#04060c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        color: '#f8fafc',
        fontFamily: "'Chillax', 'Syne', 'Outfit', sans-serif",
        boxSizing: 'border-box',
        padding: '24px 20px',
      }}
    >
      {/* Background Starfield Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Subtle Micro-Grid Layer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.1,
          backgroundImage: `
            radial-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Portal Flash Overlay */}
      {isInitializing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'radial-gradient(circle, rgba(6,182,212,0.95) 0%, rgba(4,6,12,1) 85%)',
            opacity: 0.95,
            transition: 'opacity 0.6s ease-out',
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          THE STEADY MINIMALIST ACCESS CARD (NO HOVER TILT)
      ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '520px',
          width: '100%',
          borderRadius: '28px',
          background: 'linear-gradient(145deg, rgba(12, 18, 34, 0.8) 0%, rgba(6, 10, 20, 0.9) 100%)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(56, 189, 248, 0.18)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.08), inset 0 0 15px rgba(56, 189, 248, 0.03)',
          padding: '48px 40px 44px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Specular Top Ambient Highlight */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            right: '20%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.7), rgba(52, 211, 153, 0.7), transparent)',
            borderRadius: '999px',
          }}
        />

        {/* ─────────────────────────────────────────────────────────────
            CUSTOM INTRICATE GEOMETRIC HAZARD / TACTICAL NETWORK LOGO
        ───────────────────────────────────────────────────────────── */}
        <div
          style={{
            marginBottom: '26px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Ambient Glow behind Logo */}
          <div
            style={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,130,32,0.4) 0%, rgba(6,182,212,0.2) 50%, transparent 80%)',
              filter: 'blur(16px)',
              pointerEvents: 'none',
            }}
          />

          <img
            src="/cbrn_x_logo.jpg"
            alt="CBRN-X Project Logo"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '24px',
              border: '1px solid rgba(245, 130, 32, 0.6)',
              boxShadow: '0 0 30px rgba(245, 130, 32, 0.4), 0 0 10px rgba(6, 182, 212, 0.3)',
              objectFit: 'cover',
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>

        {/* Security Classification Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '9999px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            marginBottom: '18px',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: '#67e8f9',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 8px #34d399',
            }}
          />
          <span>CBRS-X // ENCRYPTED GATEWAY</span>
        </div>

        {/* Main Title (Chillax / Syne Display) */}
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 2.5rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 14px 0',
            background: 'linear-gradient(135deg, #ffffff 30%, #cbd5e1 70%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Protocol Initiated.
        </h1>

        {/* Atmospheric Subtext (Technical Monospace) */}
        <p
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '0.86rem',
            lineHeight: 1.6,
            color: '#94a3b8',
            maxWidth: '380px',
            margin: '0 0 34px 0',
            fontWeight: 400,
            letterSpacing: '-0.01em',
          }}
        >
          The simulation is ready. Secure your visor and step into the hazard zone.
        </p>

        {/* ─────────────────────────────────────────────────────────────
            PRIMARY MAGNETIC OVAL PILL BUTTON
        ───────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
          onMouseMove={handleButtonMouseMove}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={handleButtonMouseLeave}
        >
          <button
            ref={buttonRef}
            onClick={handlePortalInit}
            disabled={isInitializing}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '320px',
              padding: '17px 36px',
              borderRadius: '9999px', // STRICTLY OVAL PILL SHAPE
              background: btnHovered
                ? 'linear-gradient(135deg, #0ea5e9, #06b6d4, #10b981)'
                : 'linear-gradient(135deg, #0284c7, #06b6d4, #059669)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#ffffff',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: isInitializing ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: btnHovered
                ? '0 0 35px rgba(6, 182, 212, 0.55), 0 0 70px rgba(16, 185, 129, 0.3)'
                : '0 10px 25px rgba(6, 182, 212, 0.22)',
              transform: `translate(${btnOffset.x}px, ${btnOffset.y}px) scale(${btnHovered ? 1.025 : 1})`,
              transition: 'transform 0.16s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease, background 0.3s ease',
              outline: 'none',
            }}
          >
            <span>{isInitializing ? 'Decrypting Feed…' : 'Initialize Portal'}</span>
            <ArrowRight
              size={15}
              style={{
                transition: 'transform 0.2s ease',
                transform: btnHovered ? 'translateX(4px)' : 'translateX(0)',
              }}
            />
          </button>
        </div>

        {/* Secondary Quick-Launch Pill */}
        <div style={{ marginTop: '18px' }}>
          <a
            href="/unity-sim/index.html"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '9999px', // STRICTLY OVAL PILL
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              color: '#67e8f9',
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '11px',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = '0 0 18px rgba(6, 182, 212, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.6)';
              e.currentTarget.style.color = '#67e8f9';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Play size={11} style={{ fill: '#06b6d4', color: '#06b6d4' }} />
            Direct 3D Simulation Viewport
          </a>
        </div>
      </div>
    </div>
  );
}
