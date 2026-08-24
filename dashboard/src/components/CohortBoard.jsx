import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, Users, BarChart3 } from 'lucide-react';

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  MAJOR: '#f59e0b',
  MODERATE: '#38bdf8',
};

function TrendChart({ points }) {
  const W = 560;
  const H = 140;
  const PAD_X = 10;
  const PAD_TOP = 14;
  const PAD_BOTTOM = 22;

  if (!points || points.length === 0) return null;

  const xFor = (i) => PAD_X + (i * (W - PAD_X * 2)) / Math.max(1, points.length - 1);
  const yFor = (score) => PAD_TOP + ((100 - score) * (H - PAD_TOP - PAD_BOTTOM)) / 100;

  // Build line segments broken at null days so gaps are visible, not fabricated
  const segments = [];
  let current = [];
  points.forEach((p, i) => {
    if (p.avgScore == null) {
      if (current.length > 1) segments.push(current);
      current = [];
    } else {
      current.push([xFor(i), yFor(p.avgScore)]);
    }
  });
  if (current.length > 1) segments.push(current);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Cohort average score over the last 14 days">
        {[0, 50, 100].map((line) => (
          <g key={line}>
            <line x1={PAD_X} x2={W - PAD_X} y1={yFor(line)} y2={yFor(line)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <text x={PAD_X} y={yFor(line) - 4} fill="rgba(255,255,255,0.35)" fontSize="9">{line}</text>
          </g>
        ))}
        {segments.map((seg, si) => (
          <polyline
            key={si}
            points={seg.map((pt) => pt.join(',')).join(' ')}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ))}
        {points.map((p, i) =>
          p.avgScore != null ? (
            <circle key={i} cx={xFor(i)} cy={yFor(p.avgScore)} r="3" fill="#0ea5e9">
              <title>{`${p.date}: avg ${p.avgScore} (${p.attempts} mission${p.attempts === 1 ? '' : 's'})`}</title>
            </circle>
          ) : null
        )}
        <text x={PAD_X} y={H - 4} fill="rgba(255,255,255,0.35)" fontSize="9">{points[0].date}</text>
        <text x={W - PAD_X} y={H - 4} fill="rgba(255,255,255,0.35)" fontSize="9" textAnchor="end">{points[points.length - 1].date}</text>
      </svg>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
        Gaps mean no missions were completed that day — they are not interpolated.
      </p>
    </div>
  );
}

export default function CohortBoard() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/cohort');
        if (!res.ok) throw new Error(`Backend responded with status ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setAnalytics(data);
          setError(null);
        }
      } catch (err) {
        console.warn('Failed to load cohort analytics:', err.message);
        if (!cancelled) setError('Cohort analytics are unavailable right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-card-deep animate-fade-in" style={{ padding: '24px', marginBottom: '28px', animationDelay: '0.25s' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Computing cohort analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-deep animate-fade-in" style={{ padding: '24px', marginBottom: '28px', animationDelay: '0.25s' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Cohort Analytics</h2>
        <p style={{ fontSize: '0.85rem', color: '#fca5a5' }}>{error}</p>
      </div>
    );
  }

  const hasData =
    analytics &&
    ((analytics.scenarioBreakdown || []).length > 0 ||
      (analytics.weaknessBoard || []).length > 0 ||
      (analytics.atRiskTrainees || []).length > 0);

  const panelStyle = {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
    padding: '18px',
    minWidth: 0,
  };

  const headingStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '14px',
  };

  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '24px', marginBottom: '28px', animationDelay: '0.25s' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff' }}>Cohort Analytics</h2>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 20px' }}>
        Aggregated from completed missions only — voided sessions are excluded.
      </p>

      {!hasData ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
          No completed missions yet. Analytics appear automatically once sessions are finalized.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          {/* Scenario difficulty breakdown */}
          <section style={panelStyle}>
            <h3 style={headingStyle}>
              <BarChart3 size={15} color="var(--accent-ndrf-orange)" /> Scenario Performance
            </h3>
            {(analytics.scenarioBreakdown || []).length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No scenario data.</p>
            ) : (
              analytics.scenarioBreakdown.map((scen) => (
                <div key={scen.scenarioId} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', gap: '8px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scen.title}</span>
                    <span style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{scen.passRatePct}% pass</span>
                  </div>
                  <div style={{ height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, scen.passRatePct)}%`,
                        background: scen.passRatePct >= 70
                          ? 'linear-gradient(90deg, #16a34a, #22c55e)'
                          : scen.passRatePct >= 40
                            ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                            : 'linear-gradient(90deg, #dc2626, #ef4444)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {scen.attempts} attempt{scen.attempts === 1 ? '' : 's'} · avg{' '}
                    {scen.avgScore != null ? `${scen.avgScore}/100` : '— not scored yet'}
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Weakness board */}
          <section style={panelStyle}>
            <h3 style={headingStyle}>
              <AlertTriangle size={15} color="#ef4444" /> Weakness Board
            </h3>
            {(analytics.weaknessBoard || []).length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No recurring violations detected across completed missions.
              </p>
            ) : (
              analytics.weaknessBoard.map((w) => (
                <div
                  key={w.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${SEVERITY_COLORS[w.severity]}33`,
                    background: `${SEVERITY_COLORS[w.severity]}0d`,
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>{w.label}</div>
                    <div style={{ fontSize: '0.68rem', color: SEVERITY_COLORS[w.severity], letterSpacing: '0.05em' }}>{w.severity}</div>
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#fff', whiteSpace: 'nowrap' }}>
                    {w.occurrences}×
                  </span>
                </div>
              ))
            )}
          </section>

          {/* At-risk trainees */}
          <section style={panelStyle}>
            <h3 style={headingStyle}>
              <Users size={15} color="#f59e0b" /> Needs Attention
            </h3>
            {(analytics.atRiskTrainees || []).length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All trainees performing within norms.</p>
            ) : (
              analytics.atRiskTrainees.map((t) => (
                <div key={t.traineeId} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', color: '#e2e8f0', fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {t.batchUnit} · {t.failedAttempts}/{t.attempts} failed
                    </div>
                  </div>
                  <span style={{ fontSize: '0.95rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: (t.avgScore ?? 0) >= 60 ? '#f59e0b' : '#ef4444', whiteSpace: 'nowrap' }}>
                    {t.avgScore != null ? t.avgScore : '—'}
                  </span>
                </div>
              ))
            )}
          </section>

          {/* 14-day trend */}
          <section style={{ ...panelStyle, gridColumn: '1 / -1' }}>
            <h3 style={headingStyle}>
              <TrendingUp size={15} color="var(--accent-cyan)" /> Cohort Score Trend — Last 14 Days
            </h3>
            <TrendChart points={analytics.trend || []} />
          </section>
        </div>
      )}
    </div>
  );
}
