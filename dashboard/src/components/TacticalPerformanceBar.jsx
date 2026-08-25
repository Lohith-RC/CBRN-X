import React from 'react';
import { AlertTriangle, BarChart3 } from 'lucide-react';

const TEAMS_PERF = [
  { label: 'Alpha', pct: 92, color: '#10b981' },
  { label: 'Bravo', pct: 78, color: '#8b5cf6' },
  { label: 'Charlie', pct: 65, color: '#06b6d4' },
  { label: 'Delta', pct: 88, color: '#7c3aed' },
  { label: 'Echo', pct: 51, color: '#ef4444' },
];

export default function TacticalPerformanceBar({ onTriggerEmergency, onRefresh }) {
  return (
    <div
      className="glass-card-deep"
      style={{
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 2fr 1fr',
        gap: '20px',
        alignItems: 'center',
        borderRadius: '14px',
        marginBottom: '28px',
      }}
    >
      {/* Search & Rescue Metric (Emerald Green) */}
      <div>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          SEARCH & RESCUE PROTOCOL
        </div>
        <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-green)', margin: '2px 0 6px 0' }}>
          87% COMPLETED
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: '87%',
              borderRadius: '3px',
              background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
              transition: 'width 1s ease',
            }}
          />
        </div>
      </div>

      {/* CBRN Response Metric (Royal Purple) */}
      <div>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          CBRN HAZARD CONTAINMENT
        </div>
        <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--accent-purple)', margin: '2px 0 6px 0' }}>
          72% COMPLETED
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: '72%',
              borderRadius: '3px',
              background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
              transition: 'width 1s ease',
            }}
          />
        </div>
      </div>

      {/* Team Performance Histogram */}
      <div>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '8px' }}>
          TEAM PERFORMANCE COMPARATIVE ANALYTICS
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '40px' }}>
          {TEAMS_PERF.map((p, idx) => (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div
                style={{
                  width: '100%',
                  height: `${p.pct}%`,
                  borderRadius: '3px 3px 0 0',
                  background: p.color,
                  transition: 'height 0.8s ease-out',
                }}
                title={`${p.label}: ${p.pct}%`}
              />
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Triggers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <button
          className="btn-primary"
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            fontSize: '0.72rem',
            padding: '6px 12px',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
          }}
          onClick={onTriggerEmergency}
        >
          <AlertTriangle size={14} /> TRIGGER DRILL
        </button>
        <button
          className="btn-secondary"
          style={{ fontSize: '0.72rem', padding: '6px 12px', justifyContent: 'center' }}
          onClick={onRefresh}
        >
          <BarChart3 size={14} /> REFRESH METRICS
        </button>
      </div>
    </div>
  );
}
