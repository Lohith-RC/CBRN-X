import React, { useState } from 'react';
import { Eye, Search, CheckCircle2, XCircle, Clock, Loader, Ban } from 'lucide-react';

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

export default function SessionsTable({ sessions, onSelectSession, onDataChanged }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [voidingId, setVoidingId] = useState(null);

  const handleVoidSession = async (session) => {
    const confirmed = window.confirm(
      `Void session record for ${session.traineeName || 'Unknown Trainee'} (${session.sessionId})?\n\n` +
        'Voided sessions are permanently excluded from all statistics and disappear from this list. An audit event is written to the database.'
    );
    if (!confirmed) return;

    setVoidingId(session.sessionId);
    try {
      const res = await fetch(`/api/sessions/${session.sessionId}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Voided by instructor from command center' }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Backend responded with status ${res.status}`);
      }
      if (onDataChanged) onDataChanged();
    } catch (err) {
      console.error('Failed to void session:', err);
      window.alert(`Failed to void session: ${err.message}`);
    } finally {
      setVoidingId(null);
    }
  };

  const statusBadge = (passStatus) => {
    switch (passStatus) {
      case 'PASSED': return { cls: 'badge-passed', Icon: CheckCircle2 };
      case 'IN_PROGRESS': return { cls: 'badge-pending', Icon: Loader };
      case 'VOIDED': return { cls: 'badge-voided', Icon: Ban };
      default: return { cls: 'badge-failed', Icon: XCircle };
    }
  };

  const filteredSessions = (sessions || []).filter((session) => {
    const matchesSearch =
      (session.traineeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.batchUnit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.scenarioTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.sessionId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || session.passStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '9px 14px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    backdropFilter: 'blur(8px)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '24px', marginBottom: '28px', animationDelay: '0.3s' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff' }}>
            Trainee Mission Telemetry Logs
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Real-time evaluation logs streamed from VR Desktop Simulation Sessions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
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
              placeholder="Search trainee, unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search sessions"
              style={{ ...inputStyle, paddingLeft: '38px', width: '220px' }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(245, 130, 32, 0.4)';
                e.target.style.boxShadow = '0 0 12px rgba(245, 130, 32, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            style={{ ...inputStyle, cursor: 'pointer' }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(245, 130, 32, 0.4)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <option value="ALL" style={{ background: '#0b0f17' }}>All Statuses</option>
            <option value="PASSED" style={{ background: '#0b0f17' }}>Passed</option>
            <option value="FAILED" style={{ background: '#0b0f17' }}>Failed</option>
            <option value="IN_PROGRESS" style={{ background: '#0b0f17' }}>In Progress</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Trainee / Unit</th>
              <th>Scenario</th>
              <th>Score</th>
              <th>Status</th>
              <th>Duration</th>
              <th style={{ textAlign: 'right' }}>Action</th>
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
                  }}
                >
                  No mission session records found. Sessions appear here automatically when trainees complete simulations on their VR or WebGL stations.
                </td>
              </tr>
            ) : (
              filteredSessions.map((session, idx) => {
                const inProgress = session.passStatus === 'IN_PROGRESS';
                return (
                  <tr key={session.sessionId || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{session.traineeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {session.batchUnit}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{session.scenarioTitle || 'Chemical Spill Response'}</div>
                      {session.scenarioCode && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-ndrf-orange)', fontFamily: 'var(--font-mono)' }}>
                          {session.scenarioCode}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {inProgress ? (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      ) : (
                        <div
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: (session.finalScore ?? 0) >= 70 ? 'var(--accent-green)' : 'var(--accent-red)',
                          }}
                        >
                          {session.finalScore ?? 0}{' '}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {(() => {
                        const { cls, Icon } = statusBadge(session.passStatus);
                        return (
                          <span className={`badge ${cls}`}>
                            <Icon size={12} className={inProgress ? 'animate-spin' : ''} />
                            {session.passStatus}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="var(--text-muted)" />
                        {formatDuration(session)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          onClick={() => onSelectSession(session)}
                        >
                          <Eye size={14} /> Report Card
                        </button>
                        <button
                          className="btn-secondary"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            color: 'var(--accent-red)',
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                          }}
                          onClick={() => handleVoidSession(session)}
                          disabled={voidingId === session.sessionId}
                          title="Exclude this session from all statistics (audit event retained)"
                        >
                          <Ban size={14} />
                          {voidingId === session.sessionId ? 'Voiding…' : 'Void'}
                        </button>
                      </div>
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
