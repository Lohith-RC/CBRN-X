import React, { useEffect, useState, useRef } from 'react';
import { Users, Award, Percent, AlertTriangle } from 'lucide-react';

/* Animated counter that counts up to the target value */
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
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return <>{value}{suffix}</>;
}

export default function MetricCards({ stats }) {
  const cards = [
    {
      title: 'Total Responders',
      value: stats?.totalTrainees || 0,
      suffix: '',
      subtext: 'Registered NDRF Trainees',
      icon: Users,
      color: '#00f2fe',
      bgGlow: 'rgba(0, 242, 244, 0.15)',
      ringColor: '#00f2fe',
    },
    {
      title: 'Sessions Completed',
      value: stats?.totalSessionsCompleted || 0,
      suffix: '',
      subtext: 'Chemical Hazard Simulations',
      icon: Award,
      color: '#f58220',
      bgGlow: 'rgba(245, 130, 32, 0.15)',
      ringColor: '#f58220',
    },
    {
      title: 'Protocol Pass Rate',
      value: stats?.overallPassRate || 0,
      suffix: '%',
      subtext: 'Pass threshold ≥ 70%',
      icon: Percent,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      ringColor: '#10b981',
    },
    {
      title: 'Average Score',
      value: stats?.averageScore || 0,
      suffix: '',
      subtext: 'Combined Protocol Metric',
      icon: AlertTriangle,
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
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
