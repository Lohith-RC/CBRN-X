import React from 'react';
import { Users, Award, Percent, AlertTriangle } from 'lucide-react';

export default function MetricCards({ stats }) {
  const cards = [
    {
      title: 'Total Responders',
      value: stats?.totalTrainees || 0,
      subtext: 'Registered NDRF Trainees',
      icon: Users,
      color: '#00f2fe',
      bgGlow: 'rgba(0, 242, 254, 0.15)'
    },
    {
      title: 'Sessions Completed',
      value: stats?.totalSessionsCompleted || 0,
      subtext: 'Chemical Hazard Simulations',
      icon: Award,
      color: '#f58220',
      bgGlow: 'rgba(245, 130, 32, 0.15)'
    },
    {
      title: 'Protocol Pass Rate',
      value: `${stats?.overallPassRate || 0}%`,
      subtext: 'Pass threshold ≥ 70%',
      icon: Percent,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)'
    },
    {
      title: 'Average Score',
      value: `${stats?.averageScore || 0} / 100`,
      subtext: 'Combined Protocol Metric',
      icon: AlertTriangle,
      color: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.15)'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: '20px',
      marginBottom: '28px'
    }}>
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div key={idx} className="glass-panel" style={{ padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              top: '-15px',
              right: '-15px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: card.bgGlow,
              filter: 'blur(20px)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {card.title}
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: card.bgGlow,
                border: `1px solid ${card.color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color
              }}>
                <IconComponent size={20} />
              </div>
            </div>

            <div style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.03em', color: '#fff', marginBottom: '4px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}
