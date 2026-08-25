import React, { useEffect, useState, useRef } from 'react';
import { Users, Award, Percent, Gauge } from 'lucide-react';

/* Animated counter that counts up to the target value */
function AnimatedCounter({ target, suffix = '', duration = 1200 }) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const numTarget = parseFloat(target) || 0;
    const isFloat = String(target).includes('.');
    const formatValue = (n) => (isFloat ? n.toFixed(1) : String(Math.round(n)));

    if (hasAnimatedRef.current) {
      setValue(formatValue(numTarget));
      return undefined;
    }

    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(formatValue(eased * numTarget));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    hasAnimatedRef.current = true;
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return <>{value}{suffix}</>;
}

export default function MetricCards({ stats }) {
  const offline = !stats;

  const cards = [
    {
      title: 'Total Responders',
      value: stats?.totalTrainees ?? null,
      suffix: '',
      subtext: 'Registered NDRF Trainees',
      icon: Users,
      color: '#00f2fe',
      bgGlow: 'rgba(0, 242, 244, 0.15)',
      ringColor: '#00f2fe',
    },
    {
      title: 'Sessions Completed',
      value: stats?.totalSessionsCompleted ?? null,
      suffix: '',
      subtext: 'Chemical Hazard Simulations',
      icon: Award,
      color: '#f58220',
      bgGlow: 'rgba(245, 130, 32, 0.15)',
      ringColor: '#f58220',
    },
    {
      title: 'Protocol Pass Rate',
      value: stats?.overallPassRate ?? null,
      suffix: '%',
      subtext: 'Pass threshold ≥ 70%',
      icon: Percent,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      ringColor: '#10b981',
    },
    {
      title: 'Average Score',
      value: stats?.averageScore ?? null,
      suffix: '',
      subtext: 'Combined Protocol Metric',
      icon: Gauge,
      color: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      ringColor: '#8b5cf6',
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
            className="glass-card-deep animate-fade-in"
            style={{
              padding: '24px',
              animationDelay: `${idx * 0.1}s`,
            }}
          >
            {/* Background glow orb */}
            <div
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: card.bgGlow,
                filter: 'blur(30px)',
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
                marginBottom: '16px',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {card.title}
              </span>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: card.bgGlow,
                  border: `1px solid ${card.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                  boxShadow: `0 0 16px ${card.color}20`,
                }}
              >
                <IconComponent size={20} />
              </div>
            </div>

            {/* Value with animated counter */}
            <div
              style={{
                fontSize: '2rem',
                fontWeight: '900',
                letterSpacing: '-0.03em',
                color: '#fff',
                marginBottom: '4px',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {offline ? (
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  NO DATA
                </span>
              ) : (
                <>
                  {card.suffix === '%' ? (
                    <><AnimatedCounter target={card.value} suffix="%" /> </>
                  ) : (
                    <AnimatedCounter target={card.value} />
                  )}
                  {card.title === 'Average Score' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {' '}/ 100
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Subtext with subtle underline accent */}
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '2px',
                  borderRadius: '1px',
                  background: `linear-gradient(90deg, ${card.color}, transparent)`,
                }}
              />
              {offline ? 'Waiting for scoring engine' : card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
