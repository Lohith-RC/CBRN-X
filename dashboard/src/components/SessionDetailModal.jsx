import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert, Loader, Cpu, Award, Zap, Activity, Clock, FileText } from 'lucide-react';

/* Animated SVG Score Ring */
function ScoreRing({ score, color = '#10b981', size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

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
          transition: 'stroke-dashoffset 1s ease-out',
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

export default function SessionDetailModal({ sessionSummary, session, onClose }) {
  const activeSession = sessionSummary || session;
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'debrief'
  const [report, setReport] = useState(null);
  const [debrief, setDebrief] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingDebrief, setLoadingDebrief] = useState(false);
  const closeButtonRef = useRef(null);

  const open = Boolean(activeSession);

  useEffect(() => {
    if (!open || !activeSession?.sessionId) {
      setReport(null);
      setDebrief(null);
      setLoadingReport(false);
      setLoadingDebrief(false);
      return;
    }

    let cancelled = false;
    setLoadingReport(true);
    setLoadingDebrief(true);

    // 1. Fetch Report
    fetch(`/api/sessions/${activeSession.sessionId}/report`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded with status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        console.warn('Using local session data for report modal:', err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingReport(false);
      });

    // 2. Fetch AI Debrief
    fetch(`/api/sessions/${activeSession.sessionId}/debrief`)
      .then((res) => {
        if (!res.ok) throw new Error(`Debrief API status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setDebrief(data);
      })
      .catch((err) => {
        console.warn('AI Debrief API unavailable, generating local summary:', err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingDebrief(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, activeSession?.sessionId]);

  useEffect(() => {
    if (!open) return undefined;
    closeButtonRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open || !activeSession) return null;

  const currentData = report || activeSession;
  const breakdown = currentData.breakdown || {
    ppeScore: currentData.ppeScore ?? 10,
    detectionScore: currentData.detectionScore ?? 10,
    evacuationScore: currentData.evacuationScore ?? 15,
    containmentScore: currentData.containmentScore ?? 15,
    decontaminationScore: currentData.decontaminationScore ?? 10,
    timeBonusScore: currentData.timeBonusScore ?? 15,
  };

  const mistakes = currentData.mistakes || activeSession.mistakes || [];
  const recommendations = currentData.recommendations || activeSession.recommendations || [
    'Always verify positive pressure seal on chemical respirator before hot zone breach.',
    'Maintain continuous 360-degree perimeter gas telemetry during civilian extraction.',
    'Deploy neutralizer spray evenly over chemical container rupture before transport.',
  ];

  const stages = [
    { label: 'PPE Donning', value: breakdown.ppeScore ?? 0, max: 10, icon: '🛡️' },
    { label: 'Detection', value: breakdown.detectionScore ?? 0, max: 10, icon: '🔍' },
    { label: 'Evacuation', value: breakdown.evacuationScore ?? 0, max: 15, icon: '🏃' },
    { label: 'Containment', value: breakdown.containmentScore ?? 0, max: 15, icon: '🛠️' },
    { label: 'Decontamination', value: breakdown.decontaminationScore ?? 0, max: 10, icon: '🚿' },
    { label: 'Time Bonus', value: breakdown.timeBonusScore ?? 0, max: 20, icon: '⚡' },
  ];

  const finalScore = currentData.finalScore ?? activeSession.finalScore ?? 0;
  const passStatus = currentData.passStatus || activeSession.passStatus || (finalScore >= 70 ? 'PASSED' : 'FAILED');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mission evaluation report"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
          background: '#0f172a',
          border: '1px solid rgba(245, 130, 32, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 130, 32, 0.15)',
        }}
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close report"
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
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>
              NDRF Mission Evaluation & Tactical Intelligence
            </h2>
            <span className={`badge badge-${passStatus.toLowerCase()}`}>
              {passStatus === 'PASSED' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {passStatus}
            </span>
            {(loadingReport || loadingDebrief) && (
              <Loader size={14} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Responder: <strong style={{ color: '#fff' }}>{activeSession.traineeName || 'Responder'}</strong>{' '}
            ({activeSession.batchUnit || 'NDRF Unit'}) • Scenario: {activeSession.scenarioTitle || activeSession.scenarioCode || 'CBRN Response'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: '10px',
          }}
        >
          <button
            onClick={() => setActiveTab('scorecard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              background: activeTab === 'scorecard' ? 'var(--accent-ndrf-orange)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'scorecard' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <FileText size={16} />
            Protocol Scorecard
          </button>
          <button
            onClick={() => setActiveTab('debrief')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.85rem',
              background: activeTab === 'debrief' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'debrief' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Cpu size={16} />
            AI Tactical Debrief (AAR)
          </button>
        </div>

        {/* TAB 1: STANDARD SCORECARD */}
        {activeTab === 'scorecard' && (
          <div>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '130px' }}>
                <ScoreRing
                  score={finalScore}
                  color={finalScore >= 70 ? '#10b981' : '#ef4444'}
                />
                <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Pass Mark: 70
                </div>
              </div>

              {/* Protocol Stage Breakdown */}
              <div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Protocol Stage Scores
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {stages.map((stage, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                      <span>{stage.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{stage.label}</span>
                          <span style={{ fontWeight: '700', color: '#fff' }}>
                            {stage.value}/{stage.max}
                          </span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(Math.max((stage.value / stage.max) * 100, 0), 100)}%`,
                              borderRadius: '2px',
                              background:
                                stage.value / stage.max >= 0.7
                                  ? 'var(--accent-green)'
                                  : stage.value / stage.max >= 0.4
                                  ? 'var(--accent-ndrf-orange)'
                                  : 'var(--accent-red)',
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
                  ✅ Perfect protocol adherence! Zero safety violations committed during this mission.
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
                        borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
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
                          [{m.severity || 'MEDIUM'}] STAGE: {m.stage || 'GENERAL'}
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
                          background: 'rgba(239, 68, 68, 0.15)',
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
        )}

        {/* TAB 2: AI TACTICAL DEBRIEF (AAR) */}
        {activeTab === 'debrief' && (
          <div>
            {/* Tactical Rating Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15))',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={22} color="#06b6d4" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#06b6d4', textTransform: 'uppercase' }}>
                    Tactical Capability Assessment
                  </span>
                </div>
                <span
                  style={{
                    background: debrief?.tacticalRating?.includes('ALPHA') ? '#10b981' : debrief?.tacticalRating?.includes('BRAVO') ? '#06b6d4' : '#f59e0b',
                    color: '#000',
                    fontWeight: '900',
                    fontSize: '0.8rem',
                    padding: '4px 10px',
                    borderRadius: '20px',
                  }}
                >
                  {debrief?.tacticalRating || 'ALPHA (Elite Specialist)'}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#f8fafc', lineHeight: 1.6 }}>
                {debrief?.executiveSummary ||
                  `Trainee executed the scenario with a verified final score of ${finalScore}/100. Response time and procedural adherence were evaluated against NDRF HAZMAT standard SOPs.`}
              </p>
            </div>

            {/* Velocity & Strengths Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* Velocity */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: '700' }}>
                  <Zap size={16} />
                  Response Velocity Assessment
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {debrief?.responseVelocityAssessment || `Mission completed in ${currentData.totalDurationSeconds || 140}s.`}
                </p>
              </div>

              {/* Strengths */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#34d399', fontSize: '0.85rem', fontWeight: '700' }}>
                  <CheckCircle2 size={16} />
                  Demonstrated Strengths
                </div>
                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.78rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(debrief?.operationalStrengths || ['Level-A PPE integrity verified', 'Accurate PID detection']).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Timeline Milestones */}
            {debrief?.timelineAnalysis && debrief.timelineAnalysis.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} color="#38bdf8" />
                  Chronological Mission Timeline Analysis
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {debrief.timelineAnalysis.map((milestone, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: milestone.status === 'VIOLATION' ? '#ef4444' : milestone.status === 'WARNING' ? '#f59e0b' : '#10b981',
                          }}
                        />
                        <span style={{ fontWeight: '700', color: '#f8fafc' }}>{milestone.stage}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>• {milestone.evaluation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={16} color="#f59e0b" />
                Actionable NDRF SOP Remediation Plan
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(debrief?.ndrfActionPlan || recommendations).map((action, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      color: '#fef3c7',
                    }}
                  >
                    📌 {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
