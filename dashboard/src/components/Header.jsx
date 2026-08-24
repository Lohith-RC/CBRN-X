import React from 'react';
import { Shield, Radio, RefreshCw, WifiOff } from 'lucide-react';

export default function Header({ onRefresh, loading, liveConnected = false }) {
  return (
    <header
      className="glass-panel scan-line animate-fade-in"
      style={{
        padding: '16px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Animated Shield Icon */}
        <div
          className="animate-float"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(245,130,32,0.25) 0%, rgba(255,82,0,0.35) 100%)',
            border: '1px solid rgba(245,130,32,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-ndrf-orange)',
            boxShadow: '0 0 20px rgba(245, 130, 32, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative',
          }}
        >
          <Shield size={28} />
          <div
            style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: '14px',
              border: '1px solid rgba(245, 130, 32, 0.15)',
              animation: 'border-glow-pulse 3s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #fff 0%, #cbd5e1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CBRS-X
            </h1>
            <span
              className={`badge ${liveConnected ? 'badge-passed animate-pulse-glow' : 'badge-failed'}`}
              style={{ fontSize: '0.65rem' }}
              title={liveConnected ? 'Connected to live STOMP telemetry stream' : 'Not connected to telemetry stream'}
            >
              {liveConnected ? <Radio size={12} /> : <WifiOff size={12} />}
              {liveConnected ? 'LIVE TELEMETRY' : 'TELEMETRY OFFLINE'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            NDRF Virtual Reality CBRN Disaster Response Training Platform (SIH260088)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
            COMMAND CENTER
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-cyan)' }}>
            10th NDRF Battalion
          </span>
        </div>
        <button className="btn-secondary" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Telemetry'}
        </button>
      </div>
    </header>
  );
}
