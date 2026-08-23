import React, { useState } from 'react';
import { Eye, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function SessionsTable({ sessions, onSelectSession }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredSessions = (sessions || []).filter(session => {
    const matchesSearch =
      (session.traineeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.batchUnit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              style={{ ...inputStyle, paddingLeft: '38px', width: '210px' }}
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
                  No mission session records match your search query. Run a simulation using the test panel below.
                </td>
              </tr>
            ) : (
              filteredSessions.map((session, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{session.traineeName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {session.batchUnit}
                    </div>
                  </td>
                  <td>
                    <div style={{ color: 'var(--text-secondary)' }}>{session.scenarioTitle}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-ndrf-orange)', fontFamily: 'var(--font-mono)' }}>
                      {session.scenarioCode}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: session.finalScore >= 70 ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}
                    >
                      {session.finalScore}{' '}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 100</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${(session.passStatus || 'pending').toLowerCase()}`}>
                      {session.passStatus === 'PASSED' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {session.passStatus}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      {Math.floor((session.totalDurationSeconds || 0) / 60)}m{' '}
                      {(session.totalDurationSeconds || 0) % 60}s
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => onSelectSession(session)}
                    >
                      <Eye size={14} /> Report Card
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
