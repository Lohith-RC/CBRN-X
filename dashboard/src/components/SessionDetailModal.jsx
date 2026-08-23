import React from 'react';
import { X, CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';

/* Animated SVG Score Ring */
function ScoreRing({ score, color = '#10b981', size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="8"
      />
      {/* Score arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="score-ring"
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
          filter: `drop-shadow(0 0 8px ${color}60)`,
        }}
      />
      {/* Score text */}
      <text
        x={size / 2}
        y={size / 2 - 4}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '1.6rem', fontWeight: '900', fill: '#fff', fontFamily: 'Inter, sans-serif' }}
      >
        {score}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 16}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '0.6rem', fontWeight: '500', fill: '#64748b', fontFamily: 'Inter, sans-serif' }}
      >
        / 100
      </text>
    </svg>
  );
}

export default function SessionDetailModal({ session, onClose }) {
  if (!session) return null;

  const breakdown = session.breakdown || {};
  const mistakes = session.mistakes || [];
  const recommendations = session.recommendations || [];

  const stages = [
    { label: 'PPE Donning', value: breakdown.ppeScore || 0, max: 10, icon: '🛡️' },
    { label: 'Detection', value: breakdown.detectionScore || 0, max: 10, icon: '🔍' },
    { label: 'Evacuation', value: breakdown.evacuationScore || 0, max: 15, icon: '🏃' },
    { label: 'Containment', value: breakdown.containmentScore || 0, max: 15, icon: '🛠️' },
    { label: 'Decontamination', value: breakdown.decontaminationScore || 0, max: 10, icon: '🚿' },
    { label: 'Time Bonus', value: breakdown.timeBonusScore || 0, max: 20, icon: '⚡' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            transition: 'all 0.2s ease',
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '18px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>
              NDRF Mission Evaluation Report
            </h2>
            <span className={`badge badge-${(session.passStatus || 'pending').toLowerCase()}`}>
              {session.passStatus === 'PASSED' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {session.passStatus}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Responder: <strong style={{ color: '#fff' }}>{session.traineeName}</strong> ({session.batchUnit}) • Scenario: {session.scenarioTitle}
          </p>
        </div>

        {/* Score + Stages */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '24px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Animated Score Ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ScoreRing
              score={session.finalScore || 0}
              color={session.finalScore >= 70 ? '#10b981' : '#ef4444'}
            />
            <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Pass Mark: 70
            </div>
          </div>

          {/* Protocol Stage Breakdown */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Protocol Stage Scores
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {stages.map((stage, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                  <span>{stage.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{stage.label}</span>
                      <span style={{ fontWeight: '700', color: '#fff' }}>{stage.value}/{stage.max}</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(stage.value / stage.max) * 100}%`,
                          borderRadius: '2px',
                          background: stage.value / stage.max >= 0.7 ? 'var(--accent-green)' : stage.value / stage.max >= 0.4 ? 'var(--accent-ndrf-orange)' : 'var(--accent-red)',
                          transition: 'width 1s ease-out',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mistakes */}
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShieldAlert size={18} color="var(--accent-red)" />
            Protocol Compliance Mistakes ({mistakes.length})
          </h3>
          {mistakes.length === 0 ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '12px 16px',
                borderRadius: '10px',
                color: 'var(--accent-green)',
                fontSize: '0.85rem',
              }}
            >
              ✅ Perfect protocol adherence! Zero protocol errors committed during this mission.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mistakes.map((m, idx) => (
                <div
                  key={idx}
                  className="glass-card-deep"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: 'var(--accent-red)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      [{m.severity}] STAGE: {m.stage}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '3px' }}>
                      {m.description}
                    </div>
                  </div>
                  <span
                    style={{
                      fontWeight: '700',
                      color: 'var(--accent-red)',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                    }}
                  >
                    -{m.deductionPoints} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Lightbulb size={18} color="var(--accent-ndrf-orange)" />
            NDRF Trainer Tactical Recommendations
          </h3>
          <ul
            style={{
              paddingLeft: '20px',
              fontSize: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {recommendations.map((rec, idx) => (
              <li
                key={idx}
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  paddingLeft: '4px',
                }}
              >
                <span style={{ color: '#fff' }}>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
