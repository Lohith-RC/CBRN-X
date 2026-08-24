import React from 'react';
import { Shield, Radio, RefreshCw, Home, Monitor, Glasses, Cpu } from 'lucide-react';

export default function Header({ activeView, onNavigate, onRefresh, loading }) {
  return (
    <header
      className="glass-panel scan-line animate-fade-in"
      style={{
        padding: '16px 28px',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px',
        gap: '16px',
      }}
    >
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          onClick={() => onNavigate('landing')}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(14, 165, 233, 0.35) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#22d3ee',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
            cursor: 'pointer',
          }}
        >
          <Shield size={26} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              onClick={() => onNavigate('landing')}
              style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                letterSpacing: '-0.02em',
                color: '#ffffff',
                cursor: 'pointer',
                margin: 0,
              }}
            >
              CBRN-X
            </h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '0.72rem',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '9999px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              Services Online
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px', margin: 0 }}>
            SIH260088 — NDRF Disaster Response Training Platform
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onNavigate('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '600',
            border: activeView === 'landing' ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid transparent',
            background: activeView === 'landing' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeView === 'landing' ? '#22d3ee' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Home size={16} />
          <span>Landing Page</span>
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '600',
            border: activeView === 'dashboard' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
            background: activeView === 'dashboard' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeView === 'dashboard' ? '#38bdf8' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Monitor size={16} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => onNavigate('vr_view')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '600',
            border: activeView === 'vr_view' ? '1px solid rgba(45, 212, 191, 0.5)' : '1px solid transparent',
            background: activeView === 'vr_view' ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
            color: activeView === 'vr_view' ? '#2dd4bf' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Glasses size={16} />
          <span>3D WebVR</span>
        </button>

        <button
          onClick={() => onNavigate('simulator')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: '600',
            border: activeView === 'simulator' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent',
            background: activeView === 'simulator' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
            color: activeView === 'simulator' ? '#c084fc' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Cpu size={16} />
          <span>Simulator</span>
        </button>
      </nav>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button className="btn-secondary" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Telemetry'}
        </button>
      </div>
    </header>
  );
}

