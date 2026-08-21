import React from 'react';
import { Shield, Radio, Activity, RefreshCw } from 'lucide-react';

export default function Header({ onRefresh, loading }) {
  return (
    <header className="glass-panel" style={{ padding: '16px 28px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(245,130,32,0.2) 0%, rgba(255,82,0,0.3) 100%)',
          border: '1px solid rgba(245,130,32,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-ndrf-orange)'
        }}>
          <Shield size={28} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CBRS-X
            </h1>
            <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>
              <Radio size={12} className="animate-pulse" /> LIVE TELEMETRY
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            NDRF Virtual Reality CBRN Disaster Response Training Platform (SIH260088)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ textAlign: 'right', display: 'none', mdDisplay: 'block' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>COMMAND CENTER</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>10th NDRF Battalion</span>
        </div>
        <button className="btn-secondary" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Telemetry'}
        </button>
      </div>
    </header>
  );
}
