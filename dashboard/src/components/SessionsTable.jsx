import React, { useEffect, useState, useCallback } from 'react';
import { Eye, Search, CheckCircle2, XCircle, Clock, Loader, Ban, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const STATUS_OPTIONS = ['ALL', 'PASSED', 'FAILED', 'IN_PROGRESS', 'TIMED_OUT', 'VOIDED'];
const PAGE_SIZE_OPTIONS = [10, 25, 50];

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

function buildQueryParams({ page, size, statusFilter, searchTerm, fromDate, toDate }) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  params.set('status', statusFilter);
  if (searchTerm) params.set('q', searchTerm);
  if (fromDate) params.set('from', fromDate);
  if (toDate) params.set('to', toDate);
  return params;
}

export default function SessionsTable({ onSelectSession, onDataChanged }) {
  const [rows, setRows] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [voidingId, setVoidingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, fromDate, toDate, pageSize]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = buildQueryParams({ page, size: pageSize, statusFilter, searchTerm, fromDate, toDate });
      const res = await fetch(`/api/sessions?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Backend responded with status ${res.status}`);
      }
      const data = await res.json();
      setRows(data.content || []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
      console.warn('Failed to load sessions:', err.message);
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
      setFetchError('Cannot reach the CBRS-X scoring engine. No session records are shown.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchTerm, fromDate, toDate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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
      fetchSessions();
    } catch (err) {
      console.error('Failed to void session:', err);
      window.alert(`Failed to void session: ${err.message}`);
    } finally {
      setVoidingId(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = buildQueryParams({
        page: 0,
        size: 5000,
        statusFilter,
        searchTerm,
        fromDate,
        toDate,
      });
      const res = await fetch(`/api/sessions?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Backend responded with status ${res.status}`);
      }
      const data = await res.json();

      const escapeCell = (value) => {
        const s = value == null ? '' : String(value);
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = ['Session ID', 'Trainee', 'Batch/Unit', 'Scenario', 'Score', 'Status', 'Started At', 'Completed At'];
      const lines = [header.join(',')].concat(
        (data.content || []).map((r) =>
          [
            r.sessionId,
            r.traineeName,
            r.batchUnit,
            r.scenarioTitle,
            r.finalScore != null ? r.finalScore : '',
            r.passStatus,
            r.startedAt || '',
            r.completedAt || '',
          ]
            .map(escapeCell)
            .join(',')
        )
      );

      const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cbrsx-session-records-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
      window.alert(`CSV export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const statusBadge = (passStatus) => {
    switch (passStatus) {
      case 'PASSED': return { cls: 'badge-passed', Icon: CheckCircle2 };
      case 'IN_PROGRESS': return { cls: 'badge-pending', Icon: Loader };
      case 'TIMED_OUT':
      case 'VOIDED': return { cls: 'badge-voided', Icon: Ban };
      default: return { cls: 'badge-failed', Icon: XCircle };
    }
  };

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

  const focusHandlers = {
    onFocus: (e) => {
      e.target.style.borderColor = 'rgba(245, 130, 32, 0.4)';
      e.target.style.boxShadow = '0 0 12px rgba(245, 130, 32, 0.1)';
    },
    onBlur: (e) => {
      e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      e.target.style.boxShadow = 'none';
    },
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
            Evaluation records streamed from VR and WebGL simulation stations
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
              placeholder="Search trainee, unit, scenario, ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search sessions"
              style={{ ...inputStyle, paddingLeft: '38px', width: '250px' }}
              {...focusHandlers}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            style={{ ...inputStyle, cursor: 'pointer' }}
            {...focusHandlers}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt} style={{ background: '#0b0f17' }}>
                {opt === 'ALL' ? 'All Statuses' : opt.replace('_', ' ')}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="From date"
            style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark', width: '145px' }}
            {...focusHandlers}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="To date"
            style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark', width: '145px' }}
            {...focusHandlers}
          />

          <button className="btn-secondary" onClick={handleExportCsv} disabled={exporting} title="Export current filtered result set as CSV">
            <Download size={16} />
            {exporting ? 'Exporting…' : 'CSV'}
          </button>
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
            {fetchError ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: '#fca5a5' }}>
                  {fetchError}
                </td>
              </tr>
            ) : loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                  Loading mission records…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                  No mission session records match these filters.
                </td>
              </tr>
            ) : (
              rows.map((session) => {
                const inProgress = session.passStatus === 'IN_PROGRESS';
                const { cls, Icon } = statusBadge(session.passStatus);
                return (
                  <tr key={session.sessionId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{session.traineeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {session.batchUnit}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{session.scenarioTitle || 'Chemical Spill Response'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-ndrf-orange)', fontFamily: 'var(--font-mono)' }}>
                        {session.sessionId}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {inProgress || session.finalScore == null ? (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      ) : (
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
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${cls}`}>
                        <Icon size={12} className={inProgress ? 'animate-spin' : ''} />
                        {session.passStatus}
                      </span>
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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '18px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>
            Page {totalPages === 0 ? 0 : page + 1} of {totalPages} — {totalElements} total record{totalElements === 1 ? '' : 's'}
          </span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Rows per page"
            style={{ ...inputStyle, cursor: 'pointer', padding: '5px 10px', fontSize: '0.78rem' }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n} style={{ background: '#0b0f17' }}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
