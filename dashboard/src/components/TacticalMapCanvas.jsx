import React, { useEffect, useRef, useState } from 'react';
import { Radio, Compass, Layers, ShieldAlert, Eye, Target, RefreshCw } from 'lucide-react';

const DEFAULT_TEAMS = [
  { id: 'trn-alpha', label: 'Inspector Lohith (Alpha)', x: 0.38, y: 0.32, vx: 0.0002, vy: 0.0001, color: '#10b981', status: 'IN_HOTZONE', ppe: 'Level-A' },
  { id: 'trn-bravo', label: 'SI Ananya (Bravo)', x: 0.58, y: 0.28, vx: -0.00015, vy: 0.00018, color: '#8b5cf6', status: 'DONNING_PPE', ppe: 'PAPR' },
  { id: 'trn-charlie', label: 'Constable Rahul (Charlie)', x: 0.68, y: 0.48, vx: 0.00012, vy: -0.0001, color: '#06b6d4', status: 'DECONTAMINATING', ppe: 'Level-A' },
  { id: 'trn-delta', label: 'Tech Vikram (Delta)', x: 0.42, y: 0.64, vx: -0.00018, vy: -0.00012, color: '#7c3aed', status: 'SEARCH_RESCUE', ppe: 'Level-B' },
  { id: 'trn-echo', label: 'Constable Amit (Echo)', x: 0.28, y: 0.58, vx: 0.00015, vy: 0.00014, color: '#059669', status: 'STAGING', ppe: 'Standard' },
];

const HAZARD_ZONES = [
  { id: 'haz-chem', x: 0.5, y: 0.42, r: 0.12, label: 'Chemical Spill (Chlorine)', color: '#8b5cf6', code: 'CBRN-CHEM-01' },
  { id: 'haz-rad', x: 0.38, y: 0.48, r: 0.07, label: 'Cs-137 Isotope Source', color: '#ef4444', code: 'CBRN-RAD-02' },
  { id: 'haz-bio', x: 0.62, y: 0.35, r: 0.06, label: 'Pathogen Airborne Breach', color: '#10b981', code: 'CBRN-BIO-03' },
];

const BUILDINGS = [
  { x: 0.2, y: 0.15, w: 0.12, h: 0.08, label: 'HQ Command' },
  { x: 0.65, y: 0.12, w: 0.15, h: 0.1, label: 'Warehouse B' },
  { x: 0.15, y: 0.7, w: 0.1, h: 0.12, label: 'Decon Station' },
  { x: 0.75, y: 0.65, w: 0.1, h: 0.08, label: 'Med Triage' },
  { x: 0.42, y: 0.72, w: 0.18, h: 0.06, label: 'Rail Transfer Spur' },
];

export default function TacticalMapCanvas({ liveTelemetry, activeSessionId }) {
  const canvasRef = useRef(null);
  const [radarMode, setRadarMode] = useState('LIVE_STREAM'); // 'LIVE_STREAM' | 'SIMULATED'
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [selectedOperatorId, setSelectedOperatorId] = useState(null);
  const [spatialEventsCount, setSpatialEventsCount] = useState(0);

  // Store live operator states and historical breadcrumb positions
  const operatorsRef = useRef({});
  const breadcrumbsRef = useRef({});

  // Initialize operator states
  useEffect(() => {
    DEFAULT_TEAMS.forEach((t) => {
      if (!operatorsRef.current[t.id]) {
        operatorsRef.current[t.id] = { ...t, trail: [] };
        breadcrumbsRef.current[t.id] = [
          { x: t.x - 0.04, y: t.y - 0.02 },
          { x: t.x - 0.02, y: t.y - 0.01 },
          { x: t.x, y: t.y },
        ];
      }
    });
  }, []);

  // Process incoming live spatial telemetry events
  useEffect(() => {
    if (!liveTelemetry) return;

    try {
      const isSpatial =
        liveTelemetry.eventType === 'spatial_telemetry' ||
        liveTelemetry.eventType === 'trainee_heartbeat' ||
        liveTelemetry.eventType === 'spatial_position';

      if (isSpatial && liveTelemetry.eventData) {
        let parsedData = {};
        try {
          parsedData = typeof liveTelemetry.eventData === 'string' ? JSON.parse(liveTelemetry.eventData) : liveTelemetry.eventData;
        } catch (e) {
          parsedData = {};
        }

        const opId = liveTelemetry.sessionId || activeSessionId || 'trn-alpha';
        const label = liveTelemetry.traineeName || 'Active Responder';

        // Map world 3D or normalized coordinates
        let normX = 0.5;
        let normY = 0.5;

        if (typeof parsedData.x === 'number' && typeof parsedData.z === 'number') {
          // Convert typical Unity world coords (-50 to +50) to (0.1 to 0.9)
          normX = Math.min(Math.max((parsedData.x + 50) / 100, 0.1), 0.9);
          normY = Math.min(Math.max((parsedData.z + 50) / 100, 0.1), 0.9);
        } else if (typeof parsedData.posX === 'number' && typeof parsedData.posZ === 'number') {
          normX = Math.min(Math.max((parsedData.posX + 50) / 100, 0.1), 0.9);
          normY = Math.min(Math.max((parsedData.posZ + 50) / 100, 0.1), 0.9);
        } else if (typeof parsedData.normX === 'number' && typeof parsedData.normY === 'number') {
          normX = parsedData.normX;
          normY = parsedData.normY;
        }

        // Update active operator
        const currentOp = operatorsRef.current[opId] || {
          id: opId,
          label: label,
          color: '#10b981',
          vx: 0,
          vy: 0,
          status: 'LIVE_ACTIVE',
          ppe: 'Level-A',
        };

        currentOp.x = normX;
        currentOp.y = normY;
        currentOp.lastUpdated = Date.now();
        operatorsRef.current[opId] = currentOp;

        // Append to breadcrumb history (keep max 30 points)
        if (!breadcrumbsRef.current[opId]) {
          breadcrumbsRef.current[opId] = [];
        }
        breadcrumbsRef.current[opId].push({ x: normX, y: normY, timestamp: Date.now() });
        if (breadcrumbsRef.current[opId].length > 30) {
          breadcrumbsRef.current[opId].shift();
        }

        setSpatialEventsCount((prev) => prev + 1);
      }
    } catch (err) {
      console.warn('Error parsing spatial telemetry payload:', err);
    }
  }, [liveTelemetry, activeSessionId]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animFrameId;
    let mapTime = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      mapTime += 0.016;

      ctx.clearRect(0, 0, W, H);

      // Dark Tactical Radar Radial Background
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.7);
      bg.addColorStop(0, '#0a101d');
      bg.addColorStop(0.65, '#05080e');
      bg.addColorStop(1, '#020408');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Tactical Grid Lines & Distance Rings
      ctx.strokeStyle = 'rgba(30, 48, 77, 0.35)';
      ctx.lineWidth = 0.5;
      const gs = 40;
      for (let x = 0; x < W; x += gs) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gs) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Radar Concentric Sweeping Ring
      const centerMx = W * 0.5;
      const centerMy = H * 0.45;
      const maxR = Math.max(W, H) * 0.5;
      const sweepAngle = (mapTime * 1.2) % (Math.PI * 2);

      // Rotating Radar Sector Arc
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerMx, centerMy);
      ctx.arc(centerMx, centerMy, maxR, sweepAngle - 0.4, sweepAngle);
      ctx.closePath();
      const sweepGrad = ctx.createRadialGradient(centerMx, centerMy, 0, centerMx, centerMy, maxR);
      sweepGrad.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
      sweepGrad.addColorStop(1, 'rgba(16, 185, 129, 0.01)');
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.restore();

      // Tactical Road Corridors
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.lineTo(W, H * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.5, 0); ctx.lineTo(W * 0.5, H); ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
      ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.lineTo(W, H * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.5, 0); ctx.lineTo(W * 0.5, H); ctx.stroke();
      ctx.setLineDash([]);

      // Safe Perimeter Zone Polyline (Emerald Dash)
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const perimPts = [
        [0.18, 0.15], [0.5, 0.08], [0.82, 0.18], [0.88, 0.5],
        [0.8, 0.82], [0.5, 0.88], [0.15, 0.8], [0.1, 0.45],
      ];
      perimPts.forEach((p, i) => {
        const px = p[0] * W;
        const py = p[1] * H;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Structures & Tactical Facilities
      BUILDINGS.forEach((b) => {
        const bx = b.x * W;
        const by = b.y * H;
        const bw = b.w * W;
        const bh = b.h * H;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(30, 58, 100, 0.8)';
        ctx.lineWidth = 1;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.label, bx + bw / 2, by + bh / 2 + 3);
      });

      // Animated Hazard Containment Plumes
      HAZARD_ZONES.forEach((hz) => {
        const cx = hz.x * W;
        const cy = hz.y * H;
        const r = hz.r * Math.min(W, H);
        const pulse = 1 + Math.sin(mapTime * 2.2) * 0.09;

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * pulse * 1.5);
        g.addColorStop(0, `${hz.color}33`);
        g.addColorStop(0.5, `${hz.color}15`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r * pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `${hz.color}80`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hazard Center Tri-Icon
        const ts = 7;
        ctx.fillStyle = `${hz.color}ee`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - ts);
        ctx.lineTo(cx - ts * 0.86, cy + ts * 0.5);
        ctx.lineTo(cx + ts * 0.86, cy + ts * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = `${hz.color}ff`;
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hz.label, cx, cy + r * pulse + 14);
      });

      // Update Operator Simulated Trajectory Drift (when in SIMULATED or default drift mode)
      Object.values(operatorsRef.current).forEach((op) => {
        if (radarMode === 'SIMULATED' || !op.lastUpdated || Date.now() - op.lastUpdated > 4000) {
          op.x += op.vx || 0.0001;
          op.y += op.vy || 0.0001;
          if (op.x < 0.12 || op.x > 0.88) op.vx *= -1;
          if (op.y < 0.12 || op.y > 0.88) op.vy *= -1;

          // Record breadcrumb point
          if (!breadcrumbsRef.current[op.id]) breadcrumbsRef.current[op.id] = [];
          const bList = breadcrumbsRef.current[op.id];
          const lastB = bList[bList.length - 1];
          if (!lastB || Math.hypot(op.x - lastB.x, op.y - lastB.y) > 0.015) {
            bList.push({ x: op.x, y: op.y, timestamp: Date.now() });
            if (bList.length > 25) bList.shift();
          }
        }
      });

      // Render Trajectory Breadcrumb Trails
      if (showBreadcrumbs) {
        Object.entries(breadcrumbsRef.current).forEach(([opId, pts]) => {
          if (!pts || pts.length < 2) return;
          const op = operatorsRef.current[opId];
          const color = op?.color || '#10b981';

          ctx.beginPath();
          pts.forEach((p, idx) => {
            const px = p.x * W;
            const py = p.y * H;
            if (idx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });

          ctx.strokeStyle = `${color}45`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw small trail breadcrumb dots
          pts.forEach((p, idx) => {
            const px = p.x * W;
            const py = p.y * H;
            const alpha = (idx + 1) / pts.length;
            ctx.fillStyle = `${color}${Math.round(alpha * 180).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
          });
        });
      }

      // Render Operator Markers & Live Badges
      Object.values(operatorsRef.current).forEach((m, idx) => {
        const mx = m.x * W;
        const my = m.y * H;
        const isSelected = selectedOperatorId === m.id;

        // Check distance to hazard zones to compute proximity alarm
        let inHazardProximity = false;
        HAZARD_ZONES.forEach((hz) => {
          const dist = Math.hypot(m.x - hz.x, m.y - hz.y);
          if (dist < hz.r + 0.04) inHazardProximity = true;
        });

        // Pulsing Ping Ring
        const pingAlpha = (Math.sin(mapTime * 3 + idx) + 1) / 2;
        const pingR = isSelected ? 18 + pingAlpha * 8 : 12 + pingAlpha * 6;
        const pingColor = inHazardProximity ? '#ef4444' : m.color;

        ctx.strokeStyle = `${pingColor}${Math.round(pingAlpha * 90).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.arc(mx, my, pingR, 0, Math.PI * 2);
        ctx.stroke();

        // Operator Core Icon Dot
        ctx.fillStyle = inHazardProximity ? '#ef4444' : m.color;
        ctx.beginPath();
        ctx.arc(mx, my, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        // Inner Specular Spot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mx - 1.5, my - 1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Label & Coordinate Pill Badge
        const lbl = m.label;
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        const tw = ctx.measureText(lbl).width;
        const lx = mx - tw / 2 - 5;
        const ly = my - 20;

        ctx.fillStyle = inHazardProximity ? 'rgba(239, 68, 68, 0.9)' : 'rgba(11, 17, 32, 0.9)';
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(lx, ly, tw + 10, 15, 3) : ctx.fillRect(lx, ly, tw + 10, 15);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, mx, my - 9);

        // Sub-text Coordinates Badge
        const coordText = `X:${(m.x * 100).toFixed(0)} Y:${(m.y * 100).toFixed(0)}`;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
        ctx.font = '7.5px "JetBrains Mono", monospace';
        ctx.fillText(coordText, mx, my + 14);
      });

      // Compass Rose (Top Right)
      const compX = W - 35;
      const compY = 35;
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(compX, compY, 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(compX, compY - 12);
      ctx.lineTo(compX - 3.5, compY);
      ctx.lineTo(compX + 3.5, compY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(compX, compY + 12);
      ctx.lineTo(compX - 3.5, compY);
      ctx.lineTo(compX + 3.5, compY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('N', compX, compY - 18);

      // Distance Scale Bar (Bottom Right)
      const sbx = W - 110;
      const sby = H - 18;
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sbx, sby); ctx.lineTo(sbx + 70, sby); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sbx, sby - 3); ctx.lineTo(sbx, sby + 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sbx + 70, sby - 3); ctx.lineTo(sbx + 70, sby + 3); ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('200m (GRID 1:2500)', sbx + 35, sby - 5);

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [radarMode, showBreadcrumbs, selectedOperatorId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#05080e', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Top Left Radar Overlay & Status Bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(11, 17, 32, 0.88)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          color: '#fff',
          zIndex: 10,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)', fontWeight: '700' }}>
          <Target size={14} />
          SECTOR DELTA-7
        </span>
        <span style={{ height: '12px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />

        <button
          onClick={() => setRadarMode((prev) => (prev === 'LIVE_STREAM' ? 'SIMULATED' : 'LIVE_STREAM'))}
          style={{
            background: radarMode === 'LIVE_STREAM' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
            border: `1px solid ${radarMode === 'LIVE_STREAM' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(139, 92, 246, 0.5)'}`,
            borderRadius: '4px',
            padding: '2px 8px',
            color: radarMode === 'LIVE_STREAM' ? '#10b981' : '#a78bfa',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Radio size={12} className={radarMode === 'LIVE_STREAM' ? 'animate-pulse' : ''} />
          {radarMode === 'LIVE_STREAM' ? `LIVE STOMP TELEMETRY (${spatialEventsCount})` : 'SIMULATED RADAR'}
        </button>

        <span style={{ height: '12px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />

        <button
          onClick={() => setShowBreadcrumbs(!showBreadcrumbs)}
          style={{
            background: showBreadcrumbs ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '4px',
            padding: '2px 8px',
            color: '#06b6d4',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Layers size={12} />
          {showBreadcrumbs ? 'BREADCRUMBS: ON' : 'BREADCRUMBS: OFF'}
        </button>
      </div>

      {/* Bottom Left Legend & Active Unit Selector */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(11, 17, 32, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '170px',
          zIndex: 10,
        }}
      >
        <div style={{ color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>RADAR LEGEND</span>
          <span style={{ color: 'var(--accent-green)', fontSize: '0.65rem' }}>● 100% ONLINE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          Operator (Live Telemetry)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }} />
          Hazard Plume Perimeter
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
          Cs-137 Radiation Peak
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06b6d4' }} />
          Pathogen Breach Zone
        </div>
      </div>
    </div>
  );
}

