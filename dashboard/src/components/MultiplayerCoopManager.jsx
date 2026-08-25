import React, { useState, useEffect } from 'react';
import { Users, Radio, Compass, Shield, Activity } from 'lucide-react';

const COOP_TEAMS = [
  { id: 'alpha', name: 'Alpha Team', responder: 'Inspector Lohith R C', unit: '10th NDRF Bn', color: '#10b981', initialPos: { x: 1.5, y: 1.7, z: 7.4 } },
  { id: 'bravo', name: 'Bravo Team', responder: 'Sub-Inspector Rajesh Kumar', unit: '10th NDRF Bn', color: '#8b5cf6', initialPos: { x: -1.8, y: 1.7, z: 7.4 } },
  { id: 'charlie', name: 'Charlie Team', responder: 'Constable Vikram Singh', unit: '10th NDRF Bn', color: '#06b6d4', initialPos: { x: 0.0, y: 1.7, z: 3.2 } },
];

export default function MultiplayerCoopManager({ onSelectActiveTeam, activeTeamId }) {
  const [livePositions, setLivePositions] = useState({
    alpha: { x: 1.5, z: 7.4, scba: 2450 },
    bravo: { x: -1.8, z: 7.4, scba: 1820 },
    charlie: { x: 0.0, z: 3.2, scba: 850 },
  });

  useEffect(() => {
    // Simulate real-time WebSocket position jitter broadcast for multi-responders
    const interval = setInterval(() => {
      setLivePositions((prev) => ({
        alpha: {
          x: +(1.5 + Math.sin(Date.now() * 0.001) * 0.4).toFixed(2),
          z: +(7.4 + Math.cos(Date.now() * 0.001) * 0.3).toFixed(2),
          scba: 2450,
        },
        bravo: {
          x: +(-1.8 + Math.cos(Date.now() * 0.0012) * 0.3).toFixed(2),
          z: +(7.4 + Math.sin(Date.now() * 0.0012) * 0.4).toFixed(2),
          scba: 1820,
        },
        charlie: {
          x: +(0.0 + Math.sin(Date.now() * 0.0008) * 0.5).toFixed(2),
          z: +(3.2 + Math.cos(Date.now() * 0.0008) * 0.3).toFixed(2),
          scba: 850,
        },
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '20px', marginBottom: '24px' }}>
      <div className="section-header-tactical" style={{ marginBottom: '14px' }}>
        <h2 className="section-title-glow">
          <Users size={18} color="var(--accent-purple)" />
          Multi-Responder Co-Op Live Telemetry Stream
        </h2>
        <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
          <Radio size={12} className="animate-spin" /> WebSocket Sync Active
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {COOP_TEAMS.map((team) => {
          const pos = livePositions[team.id] || team.initialPos;
          const isSelected = activeTeamId === team.id;

          return (
            <div
              key={team.id}
              onClick={() => onSelectActiveTeam && onSelectActiveTeam(team.id)}
              style={{
                background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0, 0, 0, 0.35)',
                border: `1px solid ${isSelected ? team.color : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '12px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: isSelected ? `0 0 18px ${team.color}35` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: team.color, boxShadow: `0 0 8px ${team.color}` }} />
                  <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>{team.name}</span>
                </div>
                {isSelected && (
                  <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', background: team.color, color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    ACTIVE CONTROL
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{team.responder}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{team.unit}</div>

              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>
                  📍 X: {pos.x} | Z: {pos.z}
                </span>
                <span style={{ color: pos.scba < 1000 ? '#ef4444' : '#10b981' }}>
                  📟 {pos.scba} PSI
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
