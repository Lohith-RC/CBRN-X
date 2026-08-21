import React, { useState, useEffect, useRef } from 'react';

/**
 * Hotspot definitions for each game stage.
 * Coordinates are percentage-based (0-100) relative to the video viewport.
 * Each hotspot triggers a specific action and state transition on click.
 */
const STAGE_HOTSPOTS = {
  BRIEFING: [
    { id: 'ppe-table', x: 55, y: 55, w: 22, h: 25, label: 'APPROACH PPE DONNING STATION', icon: '🧤', action: 'GO_PPE_STATION' },
    { id: 'bay-overview', x: 10, y: 30, w: 20, h: 30, label: 'SURVEY BAY 03 EXTERIOR', icon: '👁️', action: 'SURVEY_BAY' },
  ],
  PPE_STATION: [
    { id: 'mask', x: 30, y: 40, w: 18, h: 22, label: 'PICK UP RESPIRATOR MASK', icon: '😷', action: 'DON_MASK' },
    { id: 'suit', x: 50, y: 45, w: 18, h: 25, label: 'GRAB HAZMAT SUIT', icon: '🥼', action: 'DON_SUIT' },
    { id: 'gloves', x: 70, y: 50, w: 16, h: 20, label: 'TAKE TACTICAL GLOVES', icon: '🧤', action: 'DON_GLOVES' },
  ],
  DONNING_MASK: [
    { id: 'mask-visor', x: 35, y: 30, w: 30, h: 40, label: 'SECURE VISOR SEAL', icon: '🔒', action: 'SEAL_MASK' },
  ],
  DONNING_SUIT: [
    { id: 'suit-zip', x: 40, y: 35, w: 20, h: 35, label: 'ZIP HAZMAT SUIT', icon: '🔒', action: 'ZIP_SUIT' },
  ],
  DONNING_GLOVES: [
    { id: 'glove-snap', x: 45, y: 55, w: 20, h: 20, label: 'SNAP GLOVE SEAL', icon: '✅', action: 'SNAP_GLOVES' },
  ],
  PPE_COMPLETE: [
    { id: 'entry-door', x: 35, y: 30, w: 30, h: 45, label: 'ENTER STORAGE BAY 03', icon: '🚪', action: 'ENTER_BAY' },
  ],
  BAY_ENTRY: [
    { id: 'drum-3', x: 30, y: 40, w: 18, h: 25, label: 'SCAN DRUM #3 (SUSPICIOUS)', icon: '🔍', action: 'SCAN_DRUM_3' },
    { id: 'drum-1', x: 12, y: 45, w: 15, h: 22, label: 'SCAN DRUM #1', icon: '🔍', action: 'SCAN_DRUM_1' },
    { id: 'console', x: 70, y: 35, w: 18, h: 30, label: 'CHECK CONTROL TERMINAL', icon: '💻', action: 'CHECK_CONSOLE' },
  ],
  DRUM_SCAN: [
    { id: 'sealant', x: 35, y: 50, w: 22, h: 20, label: 'APPLY CONTAINMENT SEALANT', icon: '🛠️', action: 'APPLY_SEALANT' },
    { id: 'civilian-1', x: 75, y: 40, w: 15, h: 25, label: 'ESCORT CIVILIAN TO SAFETY', icon: '🏃', action: 'EVACUATE_CIV' },
  ],
  CONSOLE_CHECK: [
    { id: 'ppm-reading', x: 30, y: 30, w: 40, h: 35, label: 'READ PPM CONCENTRATION', icon: '📟', action: 'READ_PPM' },
  ],
  CONTAINMENT: [
    { id: 'civilian-2', x: 65, y: 40, w: 18, h: 25, label: 'ESCORT REMAINING CIVILIAN', icon: '🏃', action: 'EVACUATE_CIV' },
    { id: 'decon-arch', x: 30, y: 25, w: 30, h: 50, label: 'PROCEED TO DECON SHOWER', icon: '🚿', action: 'DECON_SHOWER' },
  ],
  DECON: [
    { id: 'shower-complete', x: 35, y: 35, w: 30, h: 35, label: 'COMPLETE DECONTAMINATION', icon: '✅', action: 'COMPLETE_DECON' },
  ],
};

/**
 * Hotspots — Renders invisible clickable regions over the video frame.
 * On hover: pulsing orange glow border + floating tooltip label.
 * On click: fires onAction callback with the hotspot's action string.
 */
export default function Hotspots({ stage, onAction, cursorPos }) {
  const [hoveredId, setHoveredId] = useState(null);
  const hotspots = STAGE_HOTSPOTS[stage] || [];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'auto' }}>
      {hotspots.map((hs) => (
        <div
          key={hs.id}
          onMouseEnter={() => setHoveredId(hs.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => onAction(hs.action)}
          style={{
            position: 'absolute',
            left: `${hs.x}%`,
            top: `${hs.y}%`,
            width: `${hs.w}%`,
            height: `${hs.h}%`,
            cursor: 'pointer',
            border: hoveredId === hs.id
              ? '2px solid rgba(245, 130, 32, 0.9)'
              : '2px solid transparent',
            borderRadius: '8px',
            background: hoveredId === hs.id
              ? 'rgba(245, 130, 32, 0.08)'
              : 'transparent',
            boxShadow: hoveredId === hs.id
              ? '0 0 20px rgba(245, 130, 32, 0.35), inset 0 0 15px rgba(245, 130, 32, 0.1)'
              : 'none',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Pulsing corner markers (visible on hover) */}
          {hoveredId === hs.id && (
            <>
              <div style={{ position: 'absolute', top: -1, left: -1, width: 12, height: 12, borderTop: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)' }} />
              <div style={{ position: 'absolute', top: -1, right: -1, width: 12, height: 12, borderTop: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)' }} />
              <div style={{ position: 'absolute', bottom: -1, left: -1, width: 12, height: 12, borderBottom: '2px solid var(--accent-cyan)', borderLeft: '2px solid var(--accent-cyan)' }} />
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderBottom: '2px solid var(--accent-cyan)', borderRight: '2px solid var(--accent-cyan)' }} />
            </>
          )}

          {/* Floating Tooltip Label */}
          {hoveredId === hs.id && (
            <div className="hotspot-tooltip" style={{
              position: 'absolute',
              bottom: '105%',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              background: 'rgba(7, 10, 15, 0.95)',
              border: '1px solid rgba(245, 130, 32, 0.6)',
              borderRadius: '6px',
              padding: '6px 14px',
              color: '#fff',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'tooltipFadeIn 0.2s ease',
            }}>
              <span style={{ fontSize: '1rem' }}>{hs.icon}</span>
              <span style={{ color: 'var(--accent-ndrf-orange)' }}>CLICK:</span> {hs.label}
            </div>
          )}

          {/* Subtle pulsing reticle dot (always visible) */}
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: hoveredId === hs.id ? 'var(--accent-ndrf-orange)' : 'rgba(245, 130, 32, 0.3)',
            boxShadow: hoveredId === hs.id ? '0 0 12px rgba(245, 130, 32, 0.6)' : 'none',
            animation: 'pulseRed 1.5s infinite ease-in-out',
            transition: 'all 0.2s ease',
          }} />
        </div>
      ))}
    </div>
  );
}

export { STAGE_HOTSPOTS };
