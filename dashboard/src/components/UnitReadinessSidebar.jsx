import React from 'react';

const UNITS = [
  { team: 'ALPHA', status: 'DEPLOYED', color: '#10b981', equip: 'FULL', location: 'B-4', readiness: 95 },
  { team: 'BRAVO', status: 'DEPLOYED', color: '#8b5cf6', equip: 'FULL', location: 'C-2', readiness: 88 },
  { team: 'CHARLIE', status: 'STANDBY', color: '#06b6d4', equip: 'PARTIAL', location: 'A-1', readiness: 62 },
  { team: 'DELTA', status: 'DEPLOYED', color: '#7c3aed', equip: 'FULL', location: 'D-3', readiness: 91 },
  { team: 'ECHO', status: 'ALERT', color: '#ef4444', equip: 'FULL', location: 'B-7', readiness: 45 },
];

export default function UnitReadinessSidebar() {
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
      {/* Sidebar Header */}
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
          UNIT READINESS
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
          5 TEAMS ACTIVE
        </span>
      </div>

      {/* Teams Data Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            color: 'var(--text-muted)',
            padding: '8px 14px',
            background: 'rgba(0, 0, 0, 0.2)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span>TEAM</span>
          <span>STATUS</span>
          <span>EQUIP</span>
          <span>LOC</span>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {UNITS.map((u, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                padding: '10px 14px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#fff' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.color }} />
                {u.team}
              </div>
              <span style={{ color: u.color, fontWeight: '700' }}>{u.status}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{u.equip}</span>
              <span style={{ color: 'var(--text-muted)' }}>{u.location}</span>
            </div>
          ))}
        </div>

        {/* Individual Team Progress Bars */}
        <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border-subtle)', marginTop: '8px' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
              color: 'var(--text-muted)',
              marginBottom: '12px',
              letterSpacing: '0.05em',
            }}
          >
            TACTICAL OPERATIONAL CAPACITY
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {UNITS.map((u, i) => (
              <div key={i}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '3px',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>TEAM {u.team}</span>
                  <span style={{ fontWeight: '700', color: u.color }}>{u.readiness}%</span>
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${u.readiness}%`,
                      borderRadius: '3px',
                      background: u.color,
                      transition: 'width 0.8s ease-out',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>NDRF GRID: SECTOR-7</span>
        <span style={{ color: 'var(--accent-green)', fontWeight: '700' }}>● ONLINE</span>
      </div>
    </div>
  );
}
