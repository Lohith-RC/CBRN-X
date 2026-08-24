import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert, Loader, Cpu, Award, Zap, Activity, Clock, FileText, Printer, Compass, ShieldCheck, MapPin, Download, TrendingUp } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('scorecard'); // 'scorecard' | 'debrief' | 'map' | 'certificate' | 'growth'
  const [report, setReport] = useState(null);
  const [debrief, setDebrief] = useState(null);
  const [progression, setProgression] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingDebrief, setLoadingDebrief] = useState(false);
  const closeButtonRef = useRef(null);

  const open = Boolean(activeSession);

  useEffect(() => {
    if (!open || !activeSession?.sessionId) {
      setReport(null);
      setDebrief(null);
      setProgression(null);
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

    // 3. Fetch Longitudinal Trainee Progression
    if (activeSession.traineeId) {
      fetch(`/api/trainees/${activeSession.traineeId}/progress`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data) setProgression(data);
        })
        .catch((err) => console.debug('Progression API unavailable:', err.message));
    }

    return () => {
      cancelled = true;
    };
  }, [open, activeSession?.sessionId, activeSession?.traineeId]);

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

  const handleDownloadPdf = () => {
    const finalVal = report?.finalScore ?? activeSession?.finalScore ?? 0;
    if (finalVal < 70) {
      alert(`Official PDF Certificate is only available for passed simulations (Score >= 70%). Current Score: ${finalVal}/100.`);
      return;
    }
    window.open(`/api/sessions/${activeSession.sessionId}/certificate`, '_blank');
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
          maxWidth: '880px',
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
            onClick={() => setActiveTab('growth')}
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
              background: activeTab === 'growth' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'growth' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
          >
            <TrendingUp size={15} />
            Trainee Growth
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '130px' }}>
                <ScoreRing
                  score={finalScore}
                  color={finalScore >= 70 ? '#10b981' : '#ef4444'}
                />
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Threshold
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: finalScore >= 70 ? '#10b981' : '#ef4444' }}>
                    {finalScore >= 70 ? 'Pass (≥70%)' : 'Fail (<70%)'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {stages.map((stage) => {
                  const pct = Math.round((stage.value / stage.max) * 100);
                  const isPerfect = stage.value === stage.max;
                  const isZero = stage.value === 0;

                  return (
                    <div
                      key={stage.label}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{stage.icon}</span>
                          {stage.label}
                        </span>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: isPerfect ? '#10b981' : isZero ? '#ef4444' : '#f59e0b',
                          }}
                        >
                          {stage.value} / {stage.max}
                        </span>
                      </div>
                      <div className="progress-bar-bg" style={{ height: '6px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: isPerfect
                              ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : isZero
                              ? '#ef4444'
                              : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {mistakes.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <AlertTriangle size={16} />
                  Operational Infractions & Protocol Violations ({mistakes.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mistakes.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', color: '#fca5a5' }}>[{m.stage}]</span>
                        <span style={{ color: '#e2e8f0' }}>{m.description}</span>
                      </div>
                      <span
                        style={{
                          fontWeight: '800',
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}
                      >
                        -{m.deductionPoints} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <Lightbulb size={16} />
                NDRF Tactical SOP Recommendations
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(6, 182, 212, 0.06)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      color: '#cffafe',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI TACTICAL DEBRIEF (AAR) */}
        {activeTab === 'debrief' && (
          <div>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.12))',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>
                  TACTICAL AFTER-ACTION REVIEW (AAR)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', marginTop: '2px' }}>
                  {tacticalRating}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>MISSION RESULT</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: passStatus === 'PASSED' ? '#10b981' : '#ef4444' }}>
                  {passStatus}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="var(--accent-cyan)" />
                Executive Mission Summary
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                {debrief?.executiveSummary || `Trainee ${activeSession.traineeName || 'Responder'} executed mission ${activeSession.scenarioCode || 'CBRN-CHEM-01'} with a final score of ${finalScore}/100.`}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: '700' }}>
                  <Clock size={16} />
                  Response Velocity Assessment
                </div>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {debrief?.responseVelocityAssessment || `Mission completed in ${currentData.totalDurationSeconds || 140}s.`}
                </p>
              </div>

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
          </div>
        )}

        {/* TAB 3: TACTICAL INCIDENT MAP */}
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

              <div style={{ position: 'relative', width: '100%', height: '280px', background: '#090d16', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <svg width="100%" height="100%" viewBox="0 0 500 280">
                  <defs>
                    <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  <rect x="10" y="10" width="480" height="260" rx="8" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="2" strokeDasharray="4 4" />
                  <text x="25" y="30" fill="#10b981" fontSize="10" fontWeight="700">COLD ZONE (COMMAND & DECON)</text>

                  <circle cx="250" cy="140" r="100" fill="rgba(245, 158, 11, 0.06)" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="2" />
                  <text x="160" y="70" fill="#f59e0b" fontSize="9" fontWeight="700">WARM ZONE (DECON BUFFER)</text>

                  <circle cx="250" cy="140" r="50" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="250" cy="140" r="20" fill="rgba(239, 68, 68, 0.35)" />
                  <circle cx="250" cy="140" r="6" fill="#ef4444" />
                  <text x="215" y="144" fill="#fff" fontSize="8" fontWeight="800">EPICENTER</text>

                  <polyline
                    points="40,240 100,210 160,180 230,140 270,130 320,110 420,70"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />

                  <circle cx="40" cy="240" r="5" fill="#10b981" />
                  <text x="20" y="260" fill="#38bdf8" fontSize="8" fontWeight="700">ENTRY [T+0s]</text>

                  <circle cx="160" cy="180" r="5" fill="#f59e0b" />
                  <text x="110" y="170" fill="#f59e0b" fontSize="8" fontWeight="700">DETECTION PINPOINT</text>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LONGITUDINAL TRAINEE GROWTH ANALYTICS */}
        {activeTab === 'growth' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#c4b5fd', textTransform: 'uppercase', fontWeight: '700' }}>TOTAL ATTEMPTS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', marginTop: '4px' }}>
                    {progression?.totalAttempts || 1}
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: '700' }}>PASS RATE</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                    {progression?.passRatePercentage != null ? `${progression.passRatePercentage}%` : '100%'}
                  </div>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#bfdbfe', textTransform: 'uppercase', fontWeight: '700' }}>AVG SCORE</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>
                    {progression?.averageScore != null ? progression.averageScore : finalScore}
                  </div>
                </div>

                <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#fef08a', textTransform: 'uppercase', fontWeight: '700' }}>SKILL GROWTH</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#eab308', marginTop: '4px' }}>
                    {progression?.growthPercentage != null && progression.growthPercentage > 0 ? `+${progression.growthPercentage}%` : (progression?.growthPercentage != null ? `${progression.growthPercentage}%` : '0%')}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.88rem', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} color="#a855f7" />
                  Longitudinal Performance Curve Across Simulation Runs
                </h4>
                {progression?.attemptHistory && progression.attemptHistory.length > 0 ? (
                  <div style={{ position: 'relative', width: '100%', height: '140px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 500 120">
                      <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
                      <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(255,255,255,0.05)" />
                      <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.05)" />
                      <text x="5" y="24" fill="#64748b" fontSize="8">100</text>
                      <text x="5" y="64" fill="#64748b" fontSize="8">70</text>
                      <text x="5" y="104" fill="#64748b" fontSize="8">0</text>

                      <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="4 4" strokeWidth="1.5" />

                      <polyline
                        points={progression.attemptHistory.map((a, i) => {
                          const x = 50 + (i * 400) / Math.max(1, progression.attemptHistory.length - 1);
                          const y = 100 - (a.finalScore / 100) * 80;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="3"
                      />

                      {progression.attemptHistory.map((a, i) => {
                        const x = 50 + (i * 400) / Math.max(1, progression.attemptHistory.length - 1);
                        const y = 100 - (a.finalScore / 100) * 80;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="5" fill={a.finalScore >= 70 ? '#10b981' : '#ef4444'} stroke="#fff" strokeWidth="1.5" />
                            <text x={x - 6} y={y - 8} fill="#fff" fontSize="8" fontWeight="700">
                              {a.finalScore}
                            </text>
                            <text x={x - 10} y="115" fill="#94a3b8" fontSize="8">
                              Run {a.attemptNumber}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', margin: '20px 0' }}>
                    Single session recorded. Additional simulation runs will populate the longitudinal learning curve.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: OFFICIAL NDRF CERTIFICATE */}
        {activeTab === 'certificate' && (
          <div>
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
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '24px 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>OPERATIONAL SCORE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: finalScore >= 70 ? '#10b981' : '#ef4444' }}>
                    {finalScore} / 100
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '30px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>STATUS</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: passStatus === 'PASSED' ? '#10b981' : '#ef4444', marginTop: '6px' }}>
                    {passStatus}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Download PDF & Print */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={handleDownloadPdf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 22px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Download size={18} />
                Download Official PDF (Server Engine)
              </button>

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
                  padding: '12px 22px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Printer size={18} />
                Print Certificate View
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
