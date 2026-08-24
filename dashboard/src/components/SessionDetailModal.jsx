import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert, Loader, Cpu, Award, Zap, Activity, Clock, FileText, Printer, Compass, ShieldCheck, MapPin } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'debrief' | 'map' | 'certificate'
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

  const handlePrintCertificate = () => {
    window.print();
  };

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
  const tacticalRating = debrief?.tacticalRating || (finalScore >= 90 ? 'ALPHA (Elite HAZMAT Specialist)' : (finalScore >= 75 ? 'BRAVO (Combat Effective Responder)' : 'CHARLIE (Marginal Pass)'));

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
          maxWidth: '860px',
          maxHeight: '92vh',
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
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            paddingBottom: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setActiveTab('scorecard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              background: activeTab === 'scorecard' ? 'var(--accent-ndrf-orange)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'scorecard' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <FileText size={15} />
            Scorecard
          </button>
          <button
            onClick={() => setActiveTab('debrief')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              background: activeTab === 'debrief' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'debrief' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Cpu size={15} />
            AI Debrief (AAR)
          </button>
          <button
            onClick={() => setActiveTab('map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              background: activeTab === 'map' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'map' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Compass size={15} />
            Tactical Map
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '0.82rem',
              background: activeTab === 'certificate' ? 'linear-gradient(135deg, #eab308, #ca8a04)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'certificate' ? '#000' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <Award size={15} />
            Official Certificate
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

        {/* TAB 3: TACTICAL INCIDENT MAP & SPATIAL BREADCRUMB */}
        {activeTab === 'map' && (
          <div>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '800', fontSize: '0.95rem' }}>
                  <Compass size={18} />
                  Tactical Spatial Sector & Incident Triangulation
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sector Grid: NDRF-GRID-BAY03</span>
              </div>

              {/* Tactical Radar SVG Map */}
              <div style={{ position: 'relative', width: '100%', height: '280px', background: '#090d16', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <svg width="100%" height="100%" viewBox="0 0 500 280">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Cold Zone (Outer Safe Perimeter) */}
                  <rect x="10" y="10" width="480" height="260" rx="8" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="2" strokeDasharray="4 4" />
                  <text x="25" y="30" fill="#10b981" fontSize="10" fontWeight="700">COLD ZONE (INCIDENT COMMAND & DECON)</text>

                  {/* Warm Zone */}
                  <circle cx="250" cy="140" r="100" fill="rgba(245, 158, 11, 0.06)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="2" />
                  <text x="160" y="70" fill="#f59e0b" fontSize="9" fontWeight="700">WARM ZONE (DECON BUFFER)</text>

                  {/* Hot Zone (Hazard Epicenter) */}
                  <circle cx="250" cy="140" r="50" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="250" cy="140" r="20" fill="rgba(239, 68, 68, 0.35)" />
                  <circle cx="250" cy="140" r="6" fill="#ef4444" />
                  <text x="215" y="144" fill="#fff" fontSize="8" fontWeight="800">EPICENTER</text>

                  {/* Responder Trajectory Breadcrumb Path */}
                  <polyline
                    points="40,240 100,210 160,180 230,140 270,130 320,110 420,70"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />

                  {/* Checkpoints */}
                  <circle cx="40" cy="240" r="5" fill="#10b981" />
                  <text x="20" y="260" fill="#38bdf8" fontSize="8" fontWeight="700">ENTRY [T+0s]</text>

                  <circle cx="160" cy="180" r="5" fill="#f59e0b" />
                  <text x="110" y="170" fill="#f59e0b" fontSize="8" fontWeight="700">DETECTION PINPOINT</text>

                  <circle cx="270" cy="130" r="5" fill="#ef4444" />
                  <text x="280" y="125" fill="#ef4444" fontSize="8" fontWeight="700">CONTAINMENT CLAMP</text>

                  <circle cx="420" cy="70" r="5" fill="#10b981" />
                  <text x="390" y="60" fill="#10b981" fontSize="8" fontWeight="700">DECON EXIT</text>
                </svg>
              </div>

              {/* Spatial Telemetry Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Max Plume Conc.</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ef4444' }}>650 ppm</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Hot Zone Exposure</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b' }}>42 sec</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Casualty Extraction</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#10b981' }}>100% Cleared</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PPE Seal Integrity</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8' }}>VERIFIED</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OFFICIAL NDRF CERTIFICATE OF READINESS */}
        {activeTab === 'certificate' && (
          <div>
            {/* Printable Certificate Frame */}
            <div
              id="printable-certificate"
              style={{
                background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                border: '3px solid #eab308',
                borderRadius: '16px',
                padding: '36px',
                textAlign: 'center',
                position: 'relative',
                color: '#fff',
                boxShadow: '0 0 35px rgba(234, 179, 8, 0.15)',
                marginBottom: '20px',
              }}
            >
              {/* Seal & Watermark */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <ShieldCheck size={52} color="#eab308" />
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '2px', color: '#eab308', textTransform: 'uppercase' }}>
                NATIONAL DISASTER RESPONSE FORCE (NDRF)
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '18px' }}>
                MINISTRY OF HOME AFFAIRS • CBRN TACTICAL SIMULATION WING
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '1px' }}>
                Certificate of Operational CBRN Readiness
              </h2>

              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', maxWidth: '580px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                This is to officially certify that responder{' '}
                <strong style={{ color: '#eab308', textDecoration: 'underline' }}>{activeSession.traineeName || 'Officer'}</strong>{' '}
                of unit <strong style={{ color: '#fff' }}>{activeSession.batchUnit || '10th NDRF Battalion'}</strong> has successfully undergone tactical evaluation in scenario{' '}
                <strong style={{ color: '#38bdf8' }}>{activeSession.scenarioTitle || activeSession.scenarioCode || 'CBRN Incident'}</strong>.
              </p>

              {/* Metrics Grid */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '24px 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>OPERATIONAL SCORE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: finalScore >= 70 ? '#10b981' : '#ef4444' }}>
                    {finalScore} / 100
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '30px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>TACTICAL TIER</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#eab308', marginTop: '6px' }}>
                    {tacticalRating.split(' ')[0]}
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '30px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>STATUS</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: passStatus === 'PASSED' ? '#10b981' : '#ef4444', marginTop: '6px' }}>
                    {passStatus}
                  </div>
                </div>
              </div>

              {/* Signatures & Verification */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px', padding: '0 20px' }}>
                <div style={{ textAlign: 'left', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <div>ISSUE DATE: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div>SESSION ID: {activeSession.sessionId || 'SESS-2026'}</div>
                  <div style={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.68rem', marginTop: '4px' }}>
                    HASH: SHA256-7F8A{Math.abs(finalScore * 1337).toString(16).toUpperCase()}9B1C
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontStyle: 'italic', fontFamily: 'serif', color: '#e2e8f0', fontSize: '1.1rem', borderBottom: '1px dashed #64748b', paddingBottom: '4px', width: '160px' }}>
                    Col. V. Sharma
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Lead Incident Evaluator</div>
                </div>
              </div>
            </div>

            {/* Print Button */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handlePrintCertificate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Printer size={18} />
                Print / Save Official PDF Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
