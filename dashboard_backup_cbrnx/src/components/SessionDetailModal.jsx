import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Lightbulb, Loader, Cpu, Award, FileText, Printer, ShieldCheck, Download, TrendingUp, List } from 'lucide-react';

const SEVERITY_COLORS = {
  VIOLATION: '#ef4444',
  WARNING: '#f59e0b',
  SUCCESS: '#22c55e',
  INFO: '#94a3b8',
};

function formatClock(instant) {
  if (!instant) return '--:--';
  try {
    return new Date(instant).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return instant;
  }
}

/* Animated SVG Score Ring */
function ScoreRing({ score, color = '#10b981', size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
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
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '1.6rem', fontWeight: '900', fill: '#fff' }}>
        {score}
      </text>
      <text x={size / 2} y={size / 2 + 16} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '0.6rem', fontWeight: '500', fill: '#64748b' }}>
        / 100
      </text>
    </svg>
  );
}

export default function SessionDetailModal({ sessionSummary, session, onClose }) {
  const activeSession = sessionSummary || session;
  const [activeTab, setActiveTab] = useState('scorecard');
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [debrief, setDebrief] = useState(null);
  const [events, setEvents] = useState(null);
  const [eventsError, setEventsError] = useState(null);
  const [progression, setProgression] = useState(null);
  const [loading, setLoading] = useState(false);
  const closeButtonRef = useRef(null);

  const open = Boolean(activeSession);

  useEffect(() => {
    if (!open || !activeSession?.sessionId) {
      setReport(null);
      setDebrief(null);
      setEvents(null);
      setProgression(null);
      setReportError(null);
      setEventsError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // Score report — the only source of stage scores and infractions.
    fetch(`/api/sessions/${activeSession.sessionId}/report`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded with status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setReport(data);
          setReportError(null);
        }
      })
      .catch((err) => {
        console.warn('Score report unavailable:', err.message);
        if (!cancelled) setReportError('The scoring engine could not produce a report for this session.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Real logged event timeline.
    fetch(`/api/sessions/${activeSession.sessionId}/events`)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded with status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
          setEventsError(null);
        }
      })
      .catch((err) => {
        console.warn('Event timeline unavailable:', err.message);
        if (!cancelled) setEventsError('Event log could not be retrieved for this session.');
      });

    // Structured AAR (built server-side from the same real events).
    fetch(`/api/sessions/${activeSession.sessionId}/debrief`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setDebrief(data);
      })
      .catch(() => {});

    if (activeSession.traineeId) {
      fetch(`/api/trainees/${activeSession.traineeId}/progress`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data) setProgression(data);
        })
        .catch(() => {});
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

  // Print isolation: only the certificate is printed while its tab is open
  useEffect(() => {
    if (open && activeTab === 'certificate') {
      document.body.classList.add('printing-certificate');
      return () => document.body.classList.remove('printing-certificate');
    }
    document.body.classList.remove('printing-certificate');
    return undefined;
  }, [open, activeTab]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleDownloadPdf = () => {
    const finalVal = report?.finalScore ?? activeSession?.finalScore ?? 0;
    if (finalVal < 70) {
      alert(`Official PDF Certificate is only available for passed simulations (Score >= 70%). Current Score: ${finalVal}/100.`);
      return;
    }
    window.open(`/api/sessions/${activeSession.sessionId}/certificate`, '_blank');
  };

  if (!open || !activeSession) return null;

  const finalScore = report?.finalScore ?? activeSession.finalScore ?? null;
  const passStatus = report?.passStatus || activeSession.passStatus || 'UNKNOWN';
  const notScoredYet = passStatus === 'IN_PROGRESS';

  const breakdown = report?.breakdown;
  const stages = breakdown
    ? [
        { label: 'PPE Donning', value: breakdown.ppeScore ?? 0, max: 10 },
        { label: 'Detection', value: breakdown.detectionScore ?? 0, max: 10 },
        { label: 'Evacuation', value: breakdown.evacuationScore ?? 0, max: 15 },
        { label: 'Containment', value: breakdown.containmentScore ?? 0, max: 15 },
        { label: 'Decontamination', value: breakdown.decontaminationScore ?? 0, max: 10 },
        { label: 'Time Bonus', value: breakdown.timeBonusScore ?? 0, max: 20 },
      ]
    : [];

  const mistakes = report?.mistakes || [];
  const recommendations = report?.recommendations || [];
  const tacticalRating = debrief?.tacticalRating;

  const tabStyle = (activeBg, isActive, textColor) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.82rem',
    background: isActive ? activeBg : 'rgba(255,255,255,0.05)',
    color: isActive ? textColor : 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  });

  const firstEventTs = events && events.length > 0 ? events[0].timestamp : null;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>Mission Evaluation Report</h2>
            <span className={`badge badge-${String(passStatus).toLowerCase()}`}>{passStatus}</span>
            {loading && <Loader size={14} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Responder: <strong style={{ color: '#fff' }}>{activeSession.traineeName || 'Responder'}</strong>{' '}
            ({activeSession.batchUnit || 'NDRF Unit'}) • Scenario:{' '}
            {report?.scenarioTitle || activeSession.scenarioTitle || activeSession.scenarioCode || 'CBRN Response'}
          </p>
          {notScoredYet && (
            <p style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '6px' }}>
              This mission is still in progress — figures below are a live preview of the current score state.
            </p>
          )}
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
          <button onClick={() => setActiveTab('scorecard')} style={tabStyle('var(--accent-ndrf-orange)', activeTab === 'scorecard', '#000')}>
            <FileText size={15} /> Scorecard
          </button>
          <button onClick={() => setActiveTab('timeline')} style={tabStyle('linear-gradient(135deg, #06b6d4, #3b82f6)', activeTab === 'timeline', '#fff')}>
            <List size={15} /> Event Timeline
          </button>
          <button onClick={() => setActiveTab('growth')} style={tabStyle('linear-gradient(135deg, #8b5cf6, #6366f1)', activeTab === 'growth', '#fff')}>
            <TrendingUp size={15} /> Trainee Growth
          </button>
          <button onClick={() => setActiveTab('certificate')} style={tabStyle('linear-gradient(135deg, #eab308, #ca8a04)', activeTab === 'certificate', '#000')}>
            <Award size={15} /> Official Certificate
          </button>
        </div>

        {/* TAB 1: SCORECARD */}
        {activeTab === 'scorecard' && (
          <div>
            {reportError ? (
              <div
                role="alert"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  marginBottom: '20px',
                }}
              >
                <AlertTriangle size={26} color="#ef4444" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fca5a5' }}>{reportError}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  No scores are displayed rather than estimated values. Retry from the telemetry table.
                </div>
              </div>
            ) : (
              <>
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
                    <ScoreRing score={finalScore ?? 0} color={(finalScore ?? 0) >= 70 ? '#10b981' : '#ef4444'} />
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Threshold
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: (finalScore ?? 0) >= 70 ? '#10b981' : '#ef4444' }}>
                        {(finalScore ?? 0) >= 70 ? 'Pass (≥70%)' : 'Fail (<70%)'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {stages.map((stage) => {
                      const pct = Math.round((stage.value / stage.max) * 100);
                      const isPerfect = stage.value === stage.max;
                      const isZero = stage.value === 0;

                      return (
                        <div key={stage.label} style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stage.label}</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isPerfect ? '#10b981' : isZero ? '#ef4444' : '#f59e0b' }}>
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
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <AlertTriangle size={16} />
                      Operational Infractions & Protocol Violations ({mistakes.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {mistakes.map((m, idx) => (
                        <div
                          key={`${m.stage}-${idx}`}
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
                          <span style={{ fontWeight: '800', color: '#ef4444', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            -{m.deductionPoints} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mistakes.length === 0 && !loading && (
                  <div style={{ marginBottom: '24px', padding: '14px 18px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', fontSize: '0.84rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} /> No protocol violations were recorded during this mission.
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Lightbulb size={16} />
                      NDRF Tactical SOP Recommendations
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {recommendations.map((rec, idx) => (
                        <div key={idx} style={{ padding: '10px 14px', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px', fontSize: '0.82rem', color: '#cffafe', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: REAL EVENT TIMELINE */}
        {activeTab === 'timeline' && (
          <div>
            {debrief?.executiveSummary && (
              <div style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.12))', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>
                    AFTER-ACTION REVIEW SUMMARY
                  </div>
                  {tacticalRating && (
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>{tacticalRating}</div>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, marginTop: '8px' }}>{debrief.executiveSummary}</p>
              </div>
            )}

            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Cpu size={16} color="var(--accent-cyan)" />
              Logged Telemetry Events ({events ? events.length : '…'})
            </h3>

            {eventsError ? (
              <div role="alert" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '16px', fontSize: '0.84rem', color: '#fca5a5' }}>
                {eventsError}
              </div>
            ) : events == null ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Loading event log…</p>
            ) : events.length === 0 ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                No events have been logged for this session yet.
              </p>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '18px' }}>
                <div style={{ position: 'absolute', left: '5px', top: '6px', bottom: '6px', width: '2px', background: 'rgba(255,255,255,0.08)' }} />
                {events.map((ev, idx) => {
                  const color = SEVERITY_COLORS[ev.severity] || SEVERITY_COLORS.INFO;
                  const elapsed = firstEventTs && ev.timestamp
                    ? `${Math.max(0, Math.round((Date.parse(ev.timestamp) - Date.parse(firstEventTs)) / 1000))}s`
                    : '';
                  return (
                    <div key={idx} style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '12px', padding: '7px 0 7px 8px' }}>
                      <span style={{ position: 'absolute', left: '-17px', top: '13px', width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}80` }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '64px' }}>
                        {formatClock(ev.timestamp)}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', minWidth: '42px' }}>+{elapsed}</span>
                      <span style={{ fontSize: '0.82rem', color: ev.severity === 'VIOLATION' ? '#fca5a5' : '#e2e8f0' }}>
                        {ev.eventType.replaceAll('_', ' ')}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.62rem', fontWeight: '800', letterSpacing: '0.08em', color }}>
                        {ev.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRAINEE GROWTH */}
        {activeTab === 'growth' && (
          <div>
            {!progression ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', margin: '30px 0' }}>
                Longitudinal progression data is unavailable for this trainee right now. It will appear once their
                completed missions are indexed.
              </p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: '#c4b5fd', textTransform: 'uppercase', fontWeight: '700' }}>TOTAL ATTEMPTS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#fff', marginTop: '4px' }}>{progression.totalAttempts ?? '—'}</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', fontWeight: '700' }}>PASS RATE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>
                      {progression.passRatePercentage != null ? `${progression.passRatePercentage}%` : '—'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: '#bfdbfe', textTransform: 'uppercase', fontWeight: '700' }}>AVG SCORE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>
                      {progression.averageScore != null ? progression.averageScore : '—'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: '#fef08a', textTransform: 'uppercase', fontWeight: '700' }}>SKILL GROWTH</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#eab308', marginTop: '4px' }}>
                      {progression.growthPercentage != null ? `${progression.growthPercentage > 0 ? '+' : ''}${progression.growthPercentage}%` : '—'}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' }}>
                  <h4 style={{ fontSize: '0.88rem', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} color="#a855f7" />
                    Longitudinal Performance Curve
                  </h4>
                  {progression.attemptHistory && progression.attemptHistory.length > 0 ? (
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
                            const y = 100 - ((a.finalScore ?? 0) / 100) * 80;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="3"
                        />
                        {progression.attemptHistory.map((a, i) => {
                          const x = 50 + (i * 400) / Math.max(1, progression.attemptHistory.length - 1);
                          const y = 100 - ((a.finalScore ?? 0) / 100) * 80;
                          return (
                            <g key={i}>
                              <circle cx={x} cy={y} r="5" fill={(a.finalScore ?? 0) >= 70 ? '#10b981' : '#ef4444'} stroke="#fff" strokeWidth="1.5" />
                              <text x={x - 6} y={y - 8} fill="#fff" fontSize="8" fontWeight="700">{a.finalScore}</text>
                              <text x={x - 10} y="115" fill="#94a3b8" fontSize="8">Run {a.attemptNumber}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center', margin: '20px 0' }}>
                      Single scored run recorded. Additional simulation runs will populate this curve.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 4: OFFICIAL CERTIFICATE PREVIEW */}
        {activeTab === 'certificate' && (
          <div>
            {notScoredYet && (
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.82rem', color: '#fcd34d' }}>
                This mission has not been finalized yet. The certificate below is a preview using live values.
              </div>
            )}
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
                of unit <strong style={{ color: '#fff' }}>{activeSession.batchUnit || 'NDRF Unit'}</strong> has successfully undergone tactical evaluation in scenario{' '}
                <strong style={{ color: '#38bdf8' }}>{report?.scenarioTitle || activeSession.scenarioTitle || activeSession.scenarioCode || 'CBRN Incident'}</strong>.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '24px 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 0' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>OPERATIONAL SCORE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: (finalScore ?? 0) >= 70 ? '#10b981' : '#ef4444' }}>
                    {finalScore ?? '—'} / 100
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
                }}
              >
                <Download size={18} />
                Download Official PDF (Server Engine)
              </button>

              <button
                onClick={() => window.print()}
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
