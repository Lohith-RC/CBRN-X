import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, ShieldAlert, Radio } from 'lucide-react';

export default function IncidentLogFeed({ events = [] }) {
  const containerRef = useRef(null);

  // Auto-scroll internal log container only (does NOT scroll the browser window)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [events]);

  const criticalCount = events.filter(
    (e) => e.severity === 'CRITICAL' || e.severity === 'VIOLATION' || e.isViolation
  ).length;

  return (
    <div
      className="glass-card-deep"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={14} className="animate-spin" color="var(--accent-cyan)" />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
            }}
          >
            REAL-TIME TELEMETRY FEED
          </span>
        </div>
        <span
          className={criticalCount > 0 ? 'badge badge-failed' : 'badge badge-success'}
          style={{ fontSize: '0.65rem', padding: '2px 8px' }}
        >
          {criticalCount} VIOLATIONS / ALERTS
        </span>
      </div>

      {/* Feed List Container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {events.map((item, idx) => {
          const isViolation = item.severity === 'VIOLATION' || item.isViolation;
          const isCritical = item.severity === 'CRITICAL';
          const isWarning = item.severity === 'WARNING';
          const isSuccess = item.severity === 'SUCCESS';

          const cardBg = isViolation
            ? 'rgba(239, 68, 68, 0.15)'
            : isCritical
            ? 'rgba(239, 68, 68, 0.08)'
            : isWarning
            ? 'rgba(245, 158, 11, 0.08)'
            : isSuccess
            ? 'rgba(16, 185, 129, 0.08)'
            : 'rgba(6, 182, 212, 0.06)';

          const cardBorder = isViolation
            ? '#ef4444'
            : isCritical
            ? 'rgba(239, 68, 68, 0.4)'
            : isWarning
            ? 'rgba(245, 158, 11, 0.4)'
            : isSuccess
            ? 'rgba(16, 185, 129, 0.3)'
            : 'rgba(6, 182, 212, 0.2)';

          const badgeColor = isViolation || isCritical ? '#ef4444' : isWarning ? '#f59e0b' : isSuccess ? '#10b981' : '#06b6d4';

          return (
            <div
              key={item.id || idx}
              className="animate-fade-in"
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.2s ease',
                boxShadow: isViolation ? '0 0 12px rgba(239, 68, 68, 0.25)' : 'none',
              }}
            >
              {/* Top Row: Severity Tag + Team + Timestamp */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: badgeColor }}>
                  {isViolation ? (
                    <ShieldAlert size={14} color="#ef4444" />
                  ) : isCritical ? (
                    <AlertOctagon size={14} />
                  ) : isWarning ? (
                    <AlertTriangle size={14} />
                  ) : isSuccess ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Radio size={13} />
                  )}

                  <span>
                    [{item.team}]: {item.msg}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isViolation && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: '#000',
                        fontSize: '0.6rem',
                        fontWeight: '900',
                        padding: '1px 5px',
                        borderRadius: '3px',
                      }}
                    >
                      VIOLATION
                    </span>
                  )}
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.time}</span>
                </div>
              </div>

              {/* Event Detail */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                {item.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
