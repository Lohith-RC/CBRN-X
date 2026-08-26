import React, { useState } from 'react';

/**
 * Phase 1 Script-Accurate Hotspot Definitions (9 Beats)
 * Labels match the exact interaction prompts from the Phase 1 script.
 * Coordinates are percentage-based (0-100) relative to video viewport.
 */
const STAGE_HOTSPOTS = {
  /* Beat 1: CCTV Surveillance — click to begin scenario */
  BEAT_1_BRIEFING: [
    { id: 'begin-btn', x: 38, y: 70, w: 24, h: 12, label: 'BEGIN SCENARIO', icon: '▶️', action: 'BEGIN_SCENARIO' },
    { id: 'trainee-input', x: 35, y: 50, w: 30, h: 10, label: 'ID VALIDATED', icon: '📋', action: 'VALIDATE_ID' },
  ],
  /* Beat 2: FPS Init — survey environment, find PPE station */
  BEAT_2_FPS_INIT: [
    { id: 'warning-sign', x: 10, y: 30, w: 18, h: 25, label: 'DANGER - PPE REQUIRED BEYOND THIS POINT', icon: '⚠️', action: 'READ_SIGN' },
    { id: 'ppe-bench', x: 55, y: 45, w: 25, h: 30, label: 'APPROACH PPE STAGING BENCH', icon: '🏃', action: 'APPROACH_PPE' },
  ],
  /* Beat 3: Console Scan — terminal blowout */
  BEAT_3_CONSOLE: [
    { id: 'console-display', x: 30, y: 25, w: 40, h: 40, label: 'ENVIRONMENTAL TELEMETRY CONSOLE', icon: '💻', action: 'INSPECT_CONSOLE' },
    { id: 'ppm-readout', x: 38, y: 35, w: 24, h: 15, label: 'READ PPM CONCENTRATION: 412.5', icon: '📟', action: 'READ_PPM' },
  ],
  /* Beat 4: PPE Approach — interaction lock-on */
  BEAT_4_APPROACH: [
    { id: 'suit-item', x: 25, y: 40, w: 18, h: 28, label: '[E] EQUIP HAZMAT SUIT', icon: '🥼', action: 'EQUIP_SUIT' },
    { id: 'mask-item', x: 45, y: 38, w: 16, h: 25, label: '[E] EQUIP CBRN RESPIRATOR', icon: '😷', action: 'EQUIP_MASK' },
    { id: 'gloves-item', x: 65, y: 45, w: 16, h: 22, label: '[E] EQUIP CHEMICAL RESISTANT GLOVES', icon: '🧤', action: 'EQUIP_GLOVES' },
  ],
  /* Beat 5: Suit Donning — zipper animation */
  BEAT_5_SUIT: [
    { id: 'zipper', x: 35, y: 30, w: 30, h: 40, label: 'ZIP CENTRAL TORSO SEAL', icon: '🔒', action: 'ZIP_SUIT' },
  ],
  /* Beat 6: Mask Donning — visor seal */
  BEAT_6_MASK: [
    { id: 'visor-seal', x: 30, y: 25, w: 40, h: 45, label: 'SEAL RESPIRATOR VISOR', icon: '🔒', action: 'SEAL_VISOR' },
  ],
  /* Beat 7: Gloves Donning — snap + full clearance */
  BEAT_7_GLOVES: [
    { id: 'glove-snap', x: 35, y: 40, w: 30, h: 30, label: 'SNAP GLOVE SEALS — COMPLETE PPE', icon: '✅', action: 'SNAP_GLOVES' },
  ],
  /* Beat 8: Hazard Sprint — cross boundary, enter Bay 03 */
  BEAT_8_SPRINT: [
    { id: 'gate-entry', x: 30, y: 20, w: 40, h: 50, label: 'ENTER STORAGE BAY 03', icon: '🚪', action: 'ENTER_BAY' },
    { id: 'hazard-line', x: 20, y: 75, w: 60, h: 10, label: 'ATMOSPHERIC SHIELD: PPE ACTIVE', icon: '🛡️', action: 'CROSS_BOUNDARY' },
  ],
  /* Beat 9: Detector Acquisition — PID scanner pickup + drum scan */
  BEAT_9_DETECTOR: [
    { id: 'detector-crate', x: 60, y: 40, w: 22, h: 28, label: '[E] EQUIP MULTI-GAS DETECTOR', icon: '📟', action: 'EQUIP_DETECTOR' },
    { id: 'drum-cluster', x: 20, y: 35, w: 30, h: 35, label: 'SCAN DRUM CLUSTER (4 TARGETS)', icon: '🔍', action: 'APPROACH_DRUMS' },
  ],
};

function playTacticalSound(type = 'click') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'hover') {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.012, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else {
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    }
  } catch (e) {
    // Gracefully handle browser autoplay policies
  }
}

/**
 * Hotspots Component — Renders invisible interactive click regions.
 * Hover: pulsing orange glow + corner brackets + script-accurate tooltip.
 * Click: dispatches action to game state machine.
 */
export default function Hotspots({ stage, onAction }) {
  const [hoveredId, setHoveredId] = useState(null);
  const hotspots = STAGE_HOTSPOTS[stage] || [];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'auto' }}>
      {hotspots.map((hs) => {
        const isHovered = hoveredId === hs.id;
        return (
          <div
            key={hs.id}
            onMouseEnter={() => {
              setHoveredId(hs.id);
              playTacticalSound('hover');
            }}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              playTacticalSound('click');
              onAction(hs.action);
            }}
            style={{
              position: 'absolute',
              left: `${hs.x}%`, top: `${hs.y}%`,
              width: `${hs.w}%`, height: `${hs.h}%`,
              cursor: 'pointer',
              border: isHovered ? '2px solid rgba(245, 130, 32, 0.9)' : '2px solid transparent',
              borderRadius: '6px',
              background: isHovered ? 'rgba(245, 130, 32, 0.06)' : 'transparent',
              boxShadow: isHovered ? '0 0 22px rgba(245, 130, 32, 0.3), inset 0 0 12px rgba(245, 130, 32, 0.08)' : 'none',
              transition: 'all 0.25s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* Corner bracket markers (visible on hover) */}
            {isHovered && <>
              <div style={{ position: 'absolute', top: -1, left: -1, width: 14, height: 14, borderTop: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)' }} />
              <div style={{ position: 'absolute', top: -1, right: -1, width: 14, height: 14, borderTop: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)' }} />
              <div style={{ position: 'absolute', bottom: -1, left: -1, width: 14, height: 14, borderBottom: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)' }} />
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderBottom: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)' }} />
            </>}

            {/* Floating tooltip (script-accurate label) */}
            {isHovered && (
              <div style={{
                position: 'absolute', bottom: '105%', left: '50%',
                transform: 'translateX(-50%)', whiteSpace: 'nowrap',
                background: 'rgba(7, 10, 15, 0.95)',
                border: '1px solid rgba(245, 130, 32, 0.6)',
                borderRadius: '6px', padding: '6px 14px',
                color: '#fff', fontSize: '0.76rem',
                fontFamily: 'var(--font-mono)', fontWeight: '700',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
                display: 'flex', alignItems: 'center', gap: '8px',
                animation: 'tooltipFadeIn 0.2s ease',
              }}>
                <span style={{ fontSize: '1rem' }}>{hs.icon}</span>
                <span style={{ color: 'var(--accent-ndrf-orange)' }}>CLICK:</span> {hs.label}
              </div>
            )}

            {/* Pulsing reticle dot (subtle, always visible) */}
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isHovered ? 'var(--accent-ndrf-orange)' : 'rgba(245, 130, 32, 0.25)',
              boxShadow: isHovered ? '0 0 14px rgba(245, 130, 32, 0.5)' : 'none',
              animation: 'pulseRed 1.8s infinite ease-in-out',
              transition: 'all 0.2s ease',
            }} />
          </div>
        );
      })}
    </div>
  );
}

export { STAGE_HOTSPOTS };
