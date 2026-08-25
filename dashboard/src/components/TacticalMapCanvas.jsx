import React, { useEffect, useRef } from 'react';

const TEAMS = [
  { id: 'alpha', x: 0.35, y: 0.3, label: 'Alpha', color: '#10b981', vx: 0.0002, vy: 0.0001 },
  { id: 'bravo', x: 0.55, y: 0.25, label: 'Bravo', color: '#8b5cf6', vx: -0.0001, vy: 0.0002 },
  { id: 'charlie', x: 0.7, y: 0.45, label: 'Charlie', color: '#06b6d4', vx: 0.00015, vy: -0.0001 },
  { id: 'delta', x: 0.45, y: 0.6, label: 'Delta', color: '#7c3aed', vx: -0.0002, vy: -0.00015 },
  { id: 'echo', x: 0.25, y: 0.55, label: 'Echo', color: '#059669', vx: 0.0001, vy: 0.00015 },
];

const HAZARD_ZONES = [
  { x: 0.5, y: 0.42, r: 0.12, label: 'Chemical Spill', color: '#8b5cf6' },
  { x: 0.38, y: 0.48, r: 0.06, label: 'Radiation Source', color: '#ef4444' },
  { x: 0.62, y: 0.35, r: 0.05, label: 'Gas Leak', color: '#10b981' },
];

const BUILDINGS = [
  { x: 0.2, y: 0.15, w: 0.12, h: 0.08, label: 'HQ Command' },
  { x: 0.65, y: 0.12, w: 0.15, h: 0.1, label: 'Warehouse B' },
  { x: 0.15, y: 0.7, w: 0.1, h: 0.12, label: 'Decon Unit' },
  { x: 0.75, y: 0.65, w: 0.1, h: 0.08, label: 'Med Station' },
  { x: 0.42, y: 0.72, w: 0.18, h: 0.06, label: 'Rail Spur' },
];

export default function TacticalMapCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animFrameId;
    let mapTime = 0;

    const markers = TEAMS.map((t) => ({ ...t }));

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

      // Dark Canvas Background Gradient
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.65);
      bg.addColorStop(0, '#0d1525');
      bg.addColorStop(1, '#05080e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Grid Lines
      ctx.strokeStyle = 'rgba(27, 42, 68, 0.25)';
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

      // Tactical Roads
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.lineTo(W, H * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * 0.5, 0); ctx.lineTo(W * 0.5, H); ctx.stroke();

      // Safe Perimeter Polyline
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
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

      // Structures & Buildings
      BUILDINGS.forEach((b) => {
        const bx = b.x * W;
        const by = b.y * H;
        const bw = b.w * W;
        const bh = b.h * H;
        ctx.fillStyle = 'rgba(17, 26, 46, 0.85)';
        ctx.strokeStyle = 'rgba(27, 42, 68, 0.7)';
        ctx.lineWidth = 1;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.label, bx + bw / 2, by + bh / 2 + 3);
      });

      // Hazard Zones
      HAZARD_ZONES.forEach((hz) => {
        const cx = hz.x * W;
        const cy = hz.y * H;
        const r = hz.r * Math.min(W, H);
        const pulse = 1 + Math.sin(mapTime * 2) * 0.08;

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * pulse * 1.4);
        g.addColorStop(0, `${hz.color}22`);
        g.addColorStop(0.6, `${hz.color}0a`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r * pulse * 1.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `${hz.color}60`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = `${hz.color}ee`;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(hz.label, cx, cy + r * pulse + 14);
      });

      // Team Markers
      markers.forEach((m, idx) => {
        m.x += m.vx;
        m.y += m.vy;
        if (m.x < 0.1 || m.x > 0.9) m.vx *= -1;
        if (m.y < 0.1 || m.y > 0.9) m.vy *= -1;

        const mx = m.x * W;
        const my = m.y * H;

        const pingAlpha = (Math.sin(mapTime * 2.5 + idx) + 1) / 2;
        const pingR = 12 + pingAlpha * 8;
        ctx.strokeStyle = `${m.color}${Math.round(pingAlpha * 70).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mx, my, pingR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.fill();

        const lbl = m.label;
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        const tw = ctx.measureText(lbl).width;
        const lx = mx - tw / 2 - 4;
        const ly = my - 18;
        ctx.fillStyle = 'rgba(11, 17, 32, 0.85)';
        ctx.beginPath();
        ctx.fillRect(lx, ly, tw + 8, 14);

        ctx.fillStyle = m.color;
        ctx.textAlign = 'center';
        ctx.fillText(lbl, mx, my - 7);
      });

      // Compass Rose
      const compX = W - 35;
      const compY = 35;
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
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

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('N', compX, compY - 18);

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
