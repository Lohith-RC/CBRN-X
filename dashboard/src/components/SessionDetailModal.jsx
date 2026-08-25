import React, { useEffect, useRef, useState } from 'react';
import {
  X, CheckCircle2, AlertTriangle, Lightbulb, Loader, Cpu, Award, Activity,
  Clock, FileText, Printer, Compass, ShieldCheck, Download, TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, Tooltip as RechartsTooltip,
} from 'recharts';

const FONT = 'Inter, sans-serif';
const STAGES = [
  ['PPE Donning', 'ppeScore', 10, '🛡️'],
  ['Detection', 'detectionScore', 10, '🔍'],
  ['Evacuation', 'evacuationScore', 15, '🏃'],
  ['Containment', 'containmentScore', 15, '🛠️'],
  ['Decontamination', 'decontaminationScore', 10, '🚿'],
  ['Time Bonus', 'timeBonusScore', 20, '⚡'],
];
const RADAR_META = [
  ['PPE Donning', 85], ['Detection', 90], ['Evacuation', 85],
  ['Containment', 80], ['Decon SOP', 85], ['Velocity / Time', 75],
];
// [key, label, icon, activeBackground, activeForeground]
const TABS = [
  ['scorecard', 'Scorecard & Radar', FileText, 'var(--accent-ndrf-orange)', '#000'],
  ['debrief', 'AI Debrief (AAR)', Cpu, 'linear-gradient(135deg, #06b6d4, #3b82f6)', '#fff'],
  ['map', 'Tactical Map', Compass, 'linear-gradient(135deg, #10b981, #059669)', '#fff'],
  ['growth', 'Trainee Growth', TrendingUp, 'linear-gradient(135deg, #8b5cf6, #6366f1)', '#fff'],
  ['certificate', 'Official Certificate', Award, 'linear-gradient(135deg, #eab308, #ca8a04)', '#000'],
];
const TAB_STYLE = { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s ease' };
const CARD = { background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' };
const ROW = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' };

/* Animated SVG Score Ring */
function ScoreRing({ score, color = '#10b981', size = 120 }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const s = Math.min(Math.max(Number.isFinite(score) ? score : 0, 0), 100);
  const label = (y, fontSize, fontWeight, fill, children) => (
    <text x={size / 2} y={y} textAnchor="middle" dominantBaseline="central" style={{ fontSize, fontWeight, fill, fontFamily: FONT }}>{children}</text>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (s / 100) * c} className="score-ring"
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: `drop-shadow(0 0 8px ${color}60)`, transition: 'stroke-dashoffset 1s ease-out' }} />
      {label(size / 2 - 4, '1.6rem', '900', '#fff', s)}
      {label(size / 2 + 16, '0.6rem', '500', '#64748b', '/ 100')}
    </svg>
  );
}

export default function SessionDetailModal({ sessionSummary, session, onClose }) {
  const activeSession = sessionSummary || session;
  const open = Boolean(activeSession);
  const [activeTab, setActiveTab] = useState('scorecard');
  const [report, setReport] = useState(null);
  const [debrief, setDebrief] = useState(null);
  const [progression, setProgression] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingDebrief, setLoadingDebrief] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open || !activeSession?.sessionId) {
      setReport(null); setDebrief(null); setProgression(null);
      setLoadingReport(false); setLoadingDebrief(false);
      return;
    }
    let cancelled = false;
    const live = (fn) => (v) => { if (!cancelled) fn(v); };
    setLoadingReport(true);
    setLoadingDebrief(true);

    fetch(`/api/sessions/${activeSession.sessionId}/report`)
      .then((res) => { if (!res.ok) throw new Error(`Backend responded with status ${res.status}`); return res.json(); })
      .then(live(setReport))
      .catch((err) => console.warn('Using local session data for report modal:', err.message))
      .finally(() => { if (!cancelled) setLoadingReport(false); });

    fetch(`/api/sessions/${activeSession.sessionId}/debrief`)
      .then((res) => { if (!res.ok) throw new Error(`Debrief API status ${res.status}`); return res.json(); })
      .then(live(setDebrief))
      .catch((err) => console.warn('AI Debrief API unavailable, generating local summary:', err.message))
      .finally(() => { if (!cancelled) setLoadingDebrief(false); });

    if (activeSession.traineeId) {
      fetch(`/api/trainees/${activeSession.traineeId}/progress`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (!cancelled && data) setProgression(data); })
        .catch((err) => console.debug('Progression API unavailable:', err.message));
    }
    return () => { cancelled = true; };
  }, [open, activeSession?.sessionId, activeSession?.traineeId]);

  useEffect(() => {
    if (!open) return undefined;
    closeButtonRef.current?.focus();
    const handleKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const downloadPdf = async () => {
    const finalVal = report?.finalScore ?? activeSession?.finalScore ?? 0;
    if (finalVal < 70) {
      alert(`Official PDF Certificate is only available for passed simulations (Score >= 70%). Current Score: ${finalVal}/100.`);
      return;
    }
    setDownloadingCert(true);
    try {
      const res = await fetch(`/api/sessions/${activeSession.sessionId}/certificate`);
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const url = window.URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement('a'), { href: url, download: `NDRF-Certificate-${activeSession.sessionId}.pdf` });
      document.body.appendChild(a).click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Failed to download PDF blob directly, launching direct tab window:', err.message);
      window.open(`/api/sessions/${activeSession.sessionId}/certificate`, '_blank');
    } finally {
      setDownloadingCert(false);
    }
  };

  if (!activeSession) return null;

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
  const finalScore = currentData.finalScore ?? activeSession.finalScore ?? 0;
  const passStatus = currentData.passStatus || activeSession.passStatus || (finalScore >= 70 ? 'PASSED' : 'FAILED');
  const tacticalRating = debrief?.tacticalRating || (finalScore >= 90 ? 'ALPHA (Elite HAZMAT Specialist)' : finalScore >= 75 ? 'BRAVO (Combat Effective Responder)' : 'CHARLIE (Marginal Pass)');
  /* 6-Dimension Radar Dataset Normalized vs NDRF Benchmark */
  const radarData = RADAR_META.map(([subject, Benchmark], i) => ({
    subject,
    Benchmark,
    Trainee: Math.round(((breakdown[STAGES[i][1]] ?? 0) / STAGES[i][2]) * 100),
  }));
  const growthStats = [
    ['TOTAL ATTEMPTS', '#c4b5fd', 'rgba(139, 92, 246', '#fff', progression?.totalAttempts || 1],
    ['PASS RATE', '#a7f3d0', 'rgba(16, 185, 129', '#10b981', progression?.passRatePercentage != null ? `${progression.passRatePercentage}%` : '100%'],
    ['AVG SCORE', '#bfdbfe', 'rgba(59, 130, 246', '#38bdf8', progression?.averageScore != null ? progression.averageScore : finalScore],
    ['SKILL GROWTH', '#fef08a', 'rgba(234, 179, 8', '#eab308', progression?.growthPercentage != null && progression.growthPercentage > 0 ? `+${progression.growthPercentage}%` : progression?.growthPercentage != null ? `${progression.growthPercentage}%` : '0%'],
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label="Mission evaluation report" onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '920px', maxHeight: '92vh', overflowY: 'auto', padding: '24px', position: 'relative', background: '#0f172a', border: '1px solid rgba(245, 130, 32, 0.45)', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 130, 32, 0.15)' }}>
        <button ref={closeButtonRef} onClick={onClose} aria-label="Close report"
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', display: 'flex', transition: 'all 0.2s ease' }}>
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fff' }}>NDRF Mission Evaluation &amp; Tactical Intelligence</h2>
            <span className={`badge badge-${passStatus.toLowerCase()}`}>
              {passStatus === 'PASSED' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {passStatus}
            </span>
            {(loadingReport || loadingDebrief) && <Loader size={14} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Responder: <strong style={{ color: '#fff' }}>{activeSession.traineeName || 'Responder'}</strong>{' '}
            ({activeSession.batchUnit || '10th NDRF Battalion'}) • Scenario: {activeSession.scenarioTitle || activeSession.scenarioCode || 'CBRN Tactical Incident'}
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', flexWrap: 'wrap' }}>
          {TABS.map(([key, lbl, Icon, bg, fg]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ ...TAB_STYLE, background: activeTab === key ? bg : 'rgba(255,255,255,0.05)', color: activeTab === key ? fg : 'var(--text-secondary)' }}>
              <Icon size={15} />
              {lbl}
            </button>
          ))}
        </div>

        {/* TAB 1: STANDARD SCORECARD + 6-DIMENSION RADAR CHART */}
        {activeTab === 'scorecard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1fr)', gap: '20px', marginBottom: '24px' }}>
              {/* Left Column: Ring Score & Stages */}
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '110px' }}>
                    <ScoreRing score={finalScore} color={finalScore >= 70 ? '#10b981' : '#ef4444'} />
                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pass Mark: 70</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: finalScore >= 70 ? '#10b981' : '#ef4444' }}>
                        {finalScore >= 70 ? 'Pass (≥70%)' : 'Fail (<70%)'}
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>Overall Mission Proficiency</h3>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      {finalScore >= 70
                        ? 'Operational standards satisfied under CBRN HAZMAT guidelines.'
                        : 'Protocol infractions detected. Retraining in decon procedure advised.'}
                    </p>
                  </div>
                </div>

                {/* Stage Progress Bars */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  {STAGES.map(([stageLabel, key, max, icon]) => {
                    const value = breakdown[key] ?? 0;
                    const pct = Math.round((value / max) * 100);
                    const perfect = value === max;
                    const zero = value === 0;
                    return (
                      <div key={stageLabel} style={CARD}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{icon}</span>
                            {stageLabel}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: perfect ? '#10b981' : zero ? '#ef4444' : '#f59e0b' }}>{value} / {max}</span>
                        </div>
                        <div className="progress-bar-bg" style={{ height: '5px' }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: perfect ? 'linear-gradient(90deg, #10b981, #34d399)' : zero ? '#ef4444' : 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: 6-Dimension Interactive Radar Chart */}
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={16} />
                    6-Dimension Protocol Radar &amp; Benchmark
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px' }}>
                    Interactive overlay comparing Trainee performance vs NDRF Standard Benchmark (85%).
                  </p>
                </div>
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.2)" tick={{ fill: '#64748b', fontSize: 9 }} />
                      <Radar name="Trainee (%)" dataKey="Trainee" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                      <Radar name="NDRF Benchmark (%)" dataKey="Benchmark" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeDasharray="3 3" />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Infractions Section with Zero-Data Guard */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: mistakes.length > 0 ? '#f87171' : '#34d399', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                {mistakes.length > 0 ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
                Operational Infractions &amp; Protocol Violations ({mistakes.length})
              </h3>
              {mistakes.length === 0 ? (
                <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', color: '#34d399', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} />
                  Zero Protocol Infractions Recorded — 100% SOP Compliance Maintained.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mistakes.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', color: '#fca5a5' }}>[{m.stage || 'GENERAL'}]</span>
                        <span style={{ color: '#e2e8f0' }}>{m.description}</span>
                      </div>
                      <span style={{ fontWeight: '800', color: '#ef4444', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        -{m.deductionPoints ?? 5} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SOP Recommendations */}
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
          </div>
        )}

        {/* TAB 2: AI TACTICAL DEBRIEF (AAR) */}
        {activeTab === 'debrief' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(59, 130, 246, 0.12))', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800' }}>TACTICAL AFTER-ACTION REVIEW (AAR)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', marginTop: '2px' }}>{tacticalRating}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>MISSION RESULT</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: passStatus === 'PASSED' ? '#10b981' : '#ef4444' }}>{passStatus}</div>
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: '700' }}>
                  <Clock size={16} />
                  Response Velocity Assessment
                </div>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {debrief?.responseVelocityAssessment || `Mission completed in ${currentData.totalDurationSeconds || 140}s.`}
                </p>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '16px' }}>
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
            <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '800', fontSize: '0.95rem' }}>
                  <Compass size={18} />
                  Tactical Spatial Sector &amp; Incident Triangulation
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
                  <polyline points="40,240 100,210 160,180 230,140 270,130 320,110 420,70" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" />
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {growthStats.map(([lbl, lblColor, tone, valColor, val]) => (
                  <div key={lbl} style={{ background: `${tone}, 0.08)`, border: `1px solid ${tone}, 0.3)`, padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: lblColor, textTransform: 'uppercase', fontWeight: '700' }}>{lbl}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: valColor, marginTop: '4px' }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.88rem', color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} color="#a855f7" />
                  Longitudinal Performance Curve Across Simulation Runs
                </h4>
                {progression?.attemptHistory && progression.attemptHistory.length > 0 ? (
                  <div style={{ position: 'relative', width: '100%', height: '140px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 500 120">
                      {[20, 60, 100].map((y) => <line key={y} x1="40" y1={y} x2="480" y2={y} stroke="rgba(255,255,255,0.05)" />)}
                      <text x="5" y="24" fill="#64748b" fontSize="8">100</text>
                      <text x="5" y="64" fill="#64748b" fontSize="8">70</text>
                      <text x="5" y="104" fill="#64748b" fontSize="8">0</text>
                      <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="4 4" strokeWidth="1.5" />
                      {(() => {
                        const h = progression.attemptHistory;
                        const pt = (a, i) => {
                          const x = 50 + (i * 400) / Math.max(1, h.length - 1);
                          const y = 100 - (a.finalScore / 100) * 80;
                          return `${x},${y}`;
                        };
                        return (
                          <>
                            <polyline points={h.map(pt).join(' ')} fill="none" stroke="#a855f7" strokeWidth="3" />
                            {h.map((a, i) => {
                              const [x, y] = pt(a, i).split(',').map(Number);
                              return (
                                <g key={i}>
                                  <circle cx={x} cy={y} r="5" fill={a.finalScore >= 70 ? '#10b981' : '#ef4444'} stroke="#fff" strokeWidth="1.5" />
                                  <text x={x - 6} y={y - 8} fill="#fff" fontSize="8" fontWeight="700">{a.finalScore}</text>
                                  <text x={x - 10} y="115" fill="#94a3b8" fontSize="8">Run {a.attemptNumber}</text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
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

        {/* TAB 5: OFFICIAL NDRF CERTIFICATE WITH ONE-CLICK DOWNLOAD */}
        {activeTab === 'certificate' && (
          <div>
            <div id="printable-certificate" style={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', border: '3px solid #eab308', borderRadius: '16px', padding: '32px 24px', textAlign: 'center', position: 'relative', color: '#fff', boxShadow: '0 0 35px rgba(234, 179, 8, 0.15)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <ShieldCheck size={52} color="#eab308" />
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '2px', color: '#eab308', textTransform: 'uppercase' }}>
                NATIONAL DISASTER RESPONSE FORCE (NDRF)
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '18px' }}>
                MINISTRY OF HOME AFFAIRS • CBRN TACTICAL SIMULATION WING
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '1px' }}>
                Certificate of Operational CBRN Readiness
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', maxWidth: '580px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                This is to officially certify that responder{' '}
                <strong style={{ color: '#eab308', textDecoration: 'underline' }}>{activeSession.traineeName || 'Officer'}</strong>{' '}
                of unit <strong style={{ color: '#fff' }}>{activeSession.batchUnit || '10th NDRF Battalion'}</strong> has successfully undergone tactical evaluation in scenario{' '}
                <strong style={{ color: '#38bdf8' }}>{activeSession.scenarioTitle || activeSession.scenarioCode || 'CBRN Incident'}</strong>.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '24px 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 0', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>OPERATIONAL SCORE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: finalScore >= 70 ? '#10b981' : '#ef4444' }}>{finalScore} / 100</div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '30px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>STATUS</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: passStatus === 'PASSED' ? '#10b981' : '#ef4444', marginTop: '6px' }}>{passStatus}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button onClick={downloadPdf} disabled={downloadingCert}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: downloadingCert ? 'rgba(16, 185, 129, 0.4)' : 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 22px', fontWeight: '800', fontSize: '0.88rem', cursor: downloadingCert ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s ease' }}>
                {downloadingCert ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                {downloadingCert ? 'Generating PDF Engine...' : 'Download Official PDF (Server Engine)'}
              </button>
              <button onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #eab308, #ca8a04)', color: '#000', border: 'none', borderRadius: '10px', padding: '12px 22px', fontWeight: '800', fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)', transition: 'all 0.2s ease' }}>
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
