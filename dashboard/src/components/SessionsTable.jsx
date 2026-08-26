import React, { useState } from 'react';
import { Eye, Search, CheckCircle2, XCircle, Clock, Loader, Filter, FileText } from 'lucide-react';

function formatDuration(session) {
  if (!session.startedAt) {
    if (session.totalDurationSeconds) {
      return `${Math.floor(session.totalDurationSeconds / 60)}m ${session.totalDurationSeconds % 60}s`;
    }
    return '-';
  }
  const end = session.completedAt ? Date.parse(session.completedAt) : Date.now();
  const seconds = Math.max(0, Math.floor((end - Date.parse(session.startedAt)) / 1000));
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function SessionsTable({ sessions, onSelectSession }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredSessions = (sessions || []).filter((session) => {
    const matchesSearch =
      (session.traineeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.batchUnit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.scenarioTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.sessionId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || session.passStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '26px', marginBottom: '28px', animationDelay: '0.3s' }}>
      {/* Section Header */}
      <div className="section-header-tactical" style={{ flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 className="section-title-glow">
            <FileText size={20} color="var(--accent-cyan)" />
            Trainee Mission Telemetry Logs
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Real-time evaluation logs streamed from VR Desktop Simulation Sessions
          </p>
        </div>

        {/* Filter Controls & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Status Filter Pills */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '3px',
              display: 'flex',
              gap: '4px',
            }}
          >
            {['ALL', 'PASSED', 'FAILED', 'IN_PROGRESS'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  fontFamily: 'var(--font-mono)',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    statusFilter === st
                      ? st === 'PASSED'
                        ? '#10b981'
                        : st === 'FAILED'
                        ? '#ef4444'
                        : 'var(--accent-ndrf-orange)'
                      : 'transparent',
                  color: statusFilter === st ? '#000' : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                }}
              >
                {st === 'IN_PROGRESS' ? 'IN RUN' : st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search responder or scenario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search sessions"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '7px 12px 7px 36px',
                color: '#fff',
                fontSize: '0.82rem',
                outline: 'none',
                width: '210px',
                transition: 'all 0.2s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Responder / Unit</th>
              <th>Scenario Details</th>
              <th>Score Metric</th>
              <th>Status</th>
              <th>Elapsed Time</th>
              <th style={{ textAlign: 'right' }}>Evaluation</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: 'center',
                    padding: '40px 16px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  Zero mission records found matching current query parameters.
                </td>
              </tr>
            ) : (
              filteredSessions.map((session, idx) => {
                const inProgress = session.passStatus === 'IN_PROGRESS';
                const score = session.finalScore ?? 0;

                return (
                  <tr key={session.sessionId || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.88rem' }}>
                        {session.traineeName || 'Inspector NDRF'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        {session.batchUnit || 'NDRF Battalion'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: '#cbd5e1', fontWeight: '500', fontSize: '0.85rem' }}>
                        {session.scenarioTitle || 'Chlorine Gas Leak Response'}
                      </div>
                      {session.scenarioCode && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--accent-ndrf-orange)',
                            fontFamily: 'var(--font-mono)',
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {session.scenarioCode}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {inProgress ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Computing...</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              fontSize: '1.15rem',
                              fontWeight: '900',
                              color: score >= 70 ? '#10b981' : '#ef4444',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {score}
                          </div>
                          <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${score}%`,
                                height: '100%',
                                background: score >= 70 ? 'linear-gradient(90deg, #10b981, #34d399)' : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${(session.passStatus || 'pending').toLowerCase()}`}>
                        {inProgress ? (
                          <Loader size={12} className="animate-spin" />
                        ) : session.passStatus === 'PASSED' ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {session.passStatus}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="var(--text-muted)" />
                        {formatDuration(session)}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        className="btn-tactical"
                        onClick={() => onSelectSession(session)}
                      >
                        <Eye size={14} /> Evaluation Card
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
