import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

const INCIDENTS = [
  { severity: 'HIGH', team: 'BRAVO', msg: 'STRUCTURAL BREACH', detail: 'Load-bearing wall compromised, Section C-2', time: '12:58' },
  { severity: 'HIGH', team: 'BRAVO', msg: 'SECONDARY FRACTURE', detail: 'Secondary fracture detected near egress route', time: '12:56' },
  { severity: 'MED', team: 'TEAM', msg: 'CONTAINMENT FAILED', detail: 'Chemical drum seal integrity <40%', time: '12:54' },
  { severity: 'MED', team: 'BRAVO', msg: 'SEALANT DEPLOYED', detail: 'Backup neutralizer spray applied to drum', time: '12:51' },
  { severity: 'LOW', team: 'DELTA', msg: 'CONTAINMENT WARNING', detail: 'Drill container 7A pressure high', time: '12:48' },
  { severity: 'MED', team: 'ECHO', msg: 'PPE O2 LOW', detail: 'Respirator O2 reserve at 35%', time: '12:45' },
  { severity: 'LOW', team: 'ALPHA', msg: 'PERIMETER SECURED', detail: 'Sector B-4 isolated successfully', time: '12:42' },
];

export default function IncidentLogFeed() {
  return (
    <div
      className="glass-card-deep"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          INCIDENT LOG & ALERTS
        </span>
        <span className="badge badge-failed" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
          3 CRITICAL
        </span>
      </div>

      {/* Feed List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {INCIDENTS.map((item, idx) => {
          const isHigh = item.severity === 'HIGH';
          const isMed = item.severity === 'MED';

          const cardBg = isHigh
            ? 'rgba(239, 68, 68, 0.08)'
            : isMed
            ? 'rgba(139, 92, 246, 0.08)'
            : 'rgba(16, 185, 129, 0.06)';

          const cardBorder = isHigh
            ? 'rgba(239, 68, 68, 0.3)'
            : isMed
            ? 'rgba(139, 92, 246, 0.3)'
            : 'rgba(16, 185, 129, 0.2)';

          const badgeColor = isHigh ? '#ef4444' : isMed ? '#8b5cf6' : '#10b981';

          return (
            <div
              key={idx}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                transition: 'transform 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: badgeColor }}>
                  {isHigh ? <AlertOctagon size={13} /> : isMed ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                  <span>{item.team}: {item.msg}</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.time}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {item.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
