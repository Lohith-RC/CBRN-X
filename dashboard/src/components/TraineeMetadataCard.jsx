import React from 'react';
import { User, Shield, Compass, Activity, Hash, Layers } from 'lucide-react';

export default function TraineeMetadataCard({
  traineeName = 'Inspector Lohith R C',
  sessionId = 'SESS-CBRN-2026-088',
  missionStage = 'Stage 2: Donning Level-A Suit & Hot-Zone Recon',
  unit = '10th NDRF Battalion',
  status = 'IN MISSION',
  onOpenReplay,
}) {
  const STAGES = [
    { label: 'Stage 1: Briefing', done: true },
    { label: 'Stage 2: Hot-Zone Recon', active: true },
    { label: 'Stage 3: Containment', done: false },
    { label: 'Stage 4: Decontamination', done: false },
  ];

  return (
    <div
      className="glass-card-deep animate-fade-in glow-ring"
      style={{
        padding: '20px 24px',
        marginBottom: '24px',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Accent Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.12)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header Tag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="var(--accent-purple)" />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
            }}
          >
            ACTIVE TRAINEE METADATA CONSOLE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenReplay && (
            <button
              onClick={onOpenReplay}
              style={{
                padding: '5px 12px',
                fontSize: '0.72rem',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                borderRadius: '8px',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(2, 132, 199, 0.3))',
                color: '#38bdf8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 12px rgba(6, 182, 212, 0.25)',
              }}
            >
              🎛️ Launch Mission DVR Replay
            </button>
          )}

          <span className="badge badge-pending animate-pulse-glow" style={{ fontSize: '0.7rem', padding: '3px 10px' }}>
            <span className="pulse-beacon" /> {status}
          </span>
        </div>
      </div>

      {/* Main Metadata Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        {/* Card 1: Trainee Name */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              flexShrink: 0,
            }}
          >
            <User size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>
              TRAINEE OPERATOR
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
              {traineeName}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 600, marginTop: '1px' }}>
              {unit}
            </div>
          </div>
        </div>

        {/* Card 2: Session ID */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
              flexShrink: 0,
            }}
          >
            <Hash size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>
              SESSION IDENTIFIER
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#06b6d4', marginTop: '2px' }}>
              {sessionId}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
              PROTOCOL: CBRN-CHEM-01
            </div>
          </div>
        </div>

        {/* Card 3: Active Mission Stage */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0,
            }}
          >
            <Compass size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>
              ACTIVE MISSION STAGE
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#f59e0b', marginTop: '2px', lineHeight: 1.2 }}>
              {missionStage}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Progression Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>
            MISSION STAGE PROGRESSION
          </span>
          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
            STAGE 2 OF 4 ACTIVE
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {STAGES.map((stg, i) => (
            <div
              key={i}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                background: stg.active
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.1))'
                  : stg.done
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${
                  stg.active ? '#f59e0b' : stg.done ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.06)'
                }`,
                textAlign: 'center',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: stg.active ? '#f59e0b' : stg.done ? '#10b981' : 'var(--text-muted)',
              }}
            >
              {stg.done ? '✓ ' : stg.active ? '▶ ' : ''}
              {stg.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
