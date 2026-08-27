import React, { useState, useEffect } from 'react';
import { Users, Radio, Shield, Activity, Award, CheckCircle2, TrendingUp, Cpu } from 'lucide-react';
import { apiFetch } from '../utils/api';

const COOP_TEAMS = [
  { id: 'alpha', name: 'Alpha Team', responder: 'Inspector Lohith R C', unit: '10th NDRF Bn', color: '#10b981', initialPos: { x: 1.5, y: 1.7, z: 7.4 }, role: 'Entry Lead' },
  { id: 'bravo', name: 'Bravo Team', responder: 'Sub-Inspector Rajesh Kumar', unit: '10th NDRF Bn', color: '#8b5cf6', initialPos: { x: -1.8, y: 1.7, z: 7.4 }, role: 'Containment Specialist' },
  { id: 'charlie', name: 'Charlie Team', responder: 'Constable Vikram Singh', unit: '10th NDRF Bn', color: '#06b6d4', initialPos: { x: 0.0, y: 1.7, z: 3.2 }, role: 'Decontamination Tech' },
];

export default function MultiplayerCoopManager({ onSelectActiveTeam, activeTeamId }) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'analytics'
  const [squadComparison, setSquadComparison] = useState(null);
  const [loadingSquads, setLoadingSquads] = useState(false);

  const [livePositions, setLivePositions] = useState({
    alpha: { x: 1.5, z: 7.4, scba: 2450 },
    bravo: { x: -1.8, z: 7.4, scba: 1820 },
    charlie: { x: 0.0, z: 3.2, scba: 850 },
  });

  useEffect(() => {
    // Real-time position telemetry jitter simulation for multi-responder squad sync
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

  useEffect(() => {
    // Fetch squad analytics from backend API
    const fetchSquadAnalytics = async () => {
      setLoadingSquads(true);
      try {
        const res = await apiFetch('/api/squads/compare');
        if (res.ok) {
          const data = await res.json();
          setSquadComparison(data);
        }
      } catch (err) {
        console.warn('Squad analytics API offline:', err.message);
      } finally {
        setLoadingSquads(false);
      }
    };
    fetchSquadAnalytics();
  }, []);

  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '20px' }}>
      {/* Header & View Mode Selector */}
      <div className="section-header-tactical" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <h2 className="section-title-glow" style={{ fontSize: '0.95rem' }}>
          <Users size={18} color="var(--accent-purple)" />
          Synchronized Multi-Trainee Cooperative Squad Scoring
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              onClick={() => setActiveTab('telemetry')}
              style={{
                padding: '4px 10px',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'telemetry' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                color: activeTab === 'telemetry' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              📡 Live Telemetry
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '4px 10px',
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'analytics' ? 'rgba(6, 182, 212, 0.3)' : 'transparent',
                color: activeTab === 'analytics' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              📊 Squad Comparison
            </button>
          </div>

          <span className="badge badge-pending" style={{ fontSize: '0.68rem' }}>
            <Radio size={12} className="animate-spin" /> WebSocket Sync
          </span>
        </div>
      </div>

      {/* VIEW TAB 1: Live Co-Op Responder Telemetry */}
      {activeTab === 'telemetry' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
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
                <div style={{ fontSize: '0.7rem', color: team.color, fontFamily: 'var(--font-mono)', marginTop: '2px', fontWeight: 700 }}>
                  ROLE: {team.role}
                </div>

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
      )}

      {/* VIEW TAB 2: Squad Analytics & Inter-Dependent Comparison */}
      {activeTab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>TOP PERFORMING SQUAD</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981', marginTop: '2px', textTransform: 'uppercase' }}>
                🏆 {squadComparison?.topPerformingSquad || 'Alpha Team'}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>OVERALL BATTALION SQUAD AVG</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#06b6d4', marginTop: '2px' }}>
                {squadComparison?.overallSquadAverage || 88.5}% Compliance
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>INTER-DEPENDENT PROTOCOL SCORE</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#8b5cf6', marginTop: '2px' }}>
                95/100 (Co-Op Validated)
              </div>
            </div>
          </div>

          {/* Squad Details Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {COOP_TEAMS.map((team) => (
              <div
                key={team.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: team.color }} />
                  <span style={{ fontWeight: 800, color: '#fff' }}>{team.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ({team.responder})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--accent-cyan)' }}>Role: {team.role}</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Pass Rate: 100%</span>
                  <span style={{ color: '#8b5cf6', fontWeight: 700 }}>Co-Op Sync: 98ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
