import React, { useEffect, useState, useRef } from 'react';
import { Users, Clock, Percent, Activity, TrendingUp, ShieldCheck, Flame, Gauge } from 'lucide-react';

/* Animated counter that counts up smoothly to the target value */
function AnimatedCounter({ target, suffix = '', duration = 1200 }) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const numTarget = parseFloat(target) || 0;
    const startTime = performance.now();
    const isFloat = String(target).includes('.');

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * numTarget;
      setValue(isFloat ? current.toFixed(1) : Math.round(current));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return (
    <>
      {value}
      {suffix}
    </>
  );
}

export default function MetricCards({ stats }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(862); // 14m 22s initial baseline

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const cards = [
    {
      title: 'Current Mission Score',
      value: stats?.averageScore || 88,
      suffix: ' / 100',
      subtext: 'Live Protocol Adherence',
      trend: 'TARGET PASS',
      icon: ShieldCheck,
      color: '#10b981', // Emerald Green
      bgGlow: 'rgba(16, 185, 129, 0.15)',
    },
    {
      title: 'Elapsed Mission Time',
      customValue: formatTimer(elapsedSeconds),
      subtext: 'Max Exposure Limit: 45m',
      trend: 'SCBA Air Nominal',
      icon: Clock,
      color: '#8b5cf6', // Royal Purple
      bgGlow: 'rgba(139, 92, 246, 0.15)',
    },
    {
      title: 'Incident Status',
      customValue: 'HOT ZONE ACTIVE',
      subtext: 'Level 4 Chlorine Contaminant',
      trend: 'PERIMETER LOCKED',
      icon: Flame,
      color: '#ef4444', // Alert Red
      bgGlow: 'rgba(239, 68, 68, 0.15)',
    },
    {
      title: 'Atmospheric Toxicity Level',
      customValue: '0.02 ppm',
      subtext: 'Chlorine Gas Sensor Array',
      trend: 'SAFE Baseline',
      icon: Gauge,
      color: '#f59e0b', // NDRF Orange
      bgGlow: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '28px',
      }}
    >
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="glass-card-deep animate-fade-in glow-ring"
            style={{
              padding: '22px 24px',
              animationDelay: `${idx * 0.1}s`,
              border: `1px solid ${card.color}25`,
            }}
          >
            {/* Background glow orb */}
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                background: card.bgGlow,
                filter: 'blur(32px)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* Top row: title + icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '800',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {card.title}
              </span>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: card.bgGlow,
                  border: `1px solid ${card.color}45`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                  boxShadow: `0 4px 16px ${card.color}30`,
                }}
              >
                <IconComponent size={20} />
              </div>
            </div>

            {/* Value with custom string or animated counter */}
            <div
              style={{
                fontSize: card.customValue ? '1.85rem' : '2.1rem',
                fontWeight: '900',
                letterSpacing: '-0.03em',
                color: '#ffffff',
                marginBottom: '6px',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'baseline',
                gap: '6px',
              }}
            >
              {card.customValue ? (
                <span>{card.customValue}</span>
              ) : (
                <AnimatedCounter target={card.value} suffix={card.suffix} />
              )}
            </div>

            {/* Subtext with trend pill */}
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: '600',
              }}
            >
              <span>{card.subtext}</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  color: card.color,
                  background: `${card.color}15`,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${card.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <TrendingUp size={10} /> {card.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
