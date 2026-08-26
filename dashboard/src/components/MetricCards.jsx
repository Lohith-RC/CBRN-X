import React, { useEffect, useState, useRef } from 'react';
import { Users, Clock, Percent, TrendingUp, Gauge } from 'lucide-react';

/* Animated counter that counts up smoothly to the target value */
function AnimatedCounter({ target, suffix = '', duration = 1200 }) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const numTarget = parseFloat(target) || 0;
    const startTime = performance.now();
    const isFloat = String(target).includes('.');
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(isFloat ? (eased * numTarget).toFixed(1) : Math.round(eased * numTarget));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return (
    <>
      {value}
      {suffix}
    </>
  );
}

const GLOW_ORB = { position: 'absolute', top: '-20px', right: '-20px', width: '110px', height: '110px', borderRadius: '50%', filter: 'blur(32px)', pointerEvents: 'none', zIndex: 0 };
const Z2 = { position: 'relative', zIndex: 2 };

export default function MetricCards({ stats }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(862); // 14m 22s initial baseline

  useEffect(() => {
    const interval = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const m = Math.floor(elapsedSeconds / 60);
  const timer = `${m}m ${elapsedSeconds % 60 < 10 ? '0' : ''}${elapsedSeconds % 60}s`;

  // [title, isCounter, valueNode, subtext, trend, Icon, color]
  const cards = [
    ['Hot-Zone Responders', false, <span>4 Deployed</span>, '8 Standby in Cold Zone', 'Level-A PPE Active', Users, '#10b981'],
    ['Active Mission Duration', false, <span>{timer}</span>, 'Max Exposure Limit: 45m', 'SCBA Air Nominal', Clock, '#8b5cf6'],
    ['Protocol Pass Rate', true, <AnimatedCounter target={stats?.overallPassRate || 87.5} suffix="%" />, 'NDRF Benchmark ≥ 70%', 'Target Exceeded', Percent, '#06b6d4'],
    ['Atmospheric Toxicity Level', false, <span>0.02 ppm</span>, 'Chlorine Gas Sensor Array', 'SAFE Baseline', Gauge, '#f59e0b'],
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
      {cards.map(([title, isCounter, valueNode, subtext, trend, Icon, color], idx) => (
        <div key={idx} className="glass-card-deep animate-fade-in glow-ring" style={{ padding: '22px 24px', animationDelay: `${idx * 0.1}s`, border: `1px solid ${color}25` }}>
          {/* Background glow orb */}
          <div style={{ ...GLOW_ORB, background: `${color.slice(0, 7)}26` }} />

          {/* Top row: title + icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', ...Z2 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${color.slice(0, 7)}26`, border: `1px solid ${color}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, boxShadow: `0 4px 16px ${color}30`, ...Z2 }}>
              <Icon size={20} />
            </div>
          </div>

          {/* Value */}
          <div style={{ fontSize: isCounter ? '2.1rem' : '1.85rem', fontWeight: '900', letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '6px', display: 'flex', alignItems: 'baseline', gap: '6px', ...Z2 }}>
            {valueNode}
          </div>

          {/* Subtext with trend pill */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: '600', ...Z2 }}>
            <span>{subtext}</span>
            <span style={{ fontSize: '0.68rem', color, background: `${color}15`, padding: '2px 8px', borderRadius: '12px', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={10} /> {trend}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
