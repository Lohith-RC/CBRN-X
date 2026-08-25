import React, { useState, useEffect } from 'react';
import { Shield, Radio, RefreshCw, LayoutDashboard, Compass, Eye, Cpu, AlertTriangle } from 'lucide-react';

export default function Header({ onRefresh, loading, activeMode, setActiveMode, onTriggerEmergency, onReturnHome }) {
  const [utcClock, setUtcClock] = useState('00:00:00 UTC');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcClock(`${h}:${m}:${s} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="glass-panel scan-line animate-fade-in"
      style={{
        padding: '16px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '16px',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {/* Branding & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          className="animate-float"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(245,130,32,0.3) 0%, rgba(255,82,0,0.45) 100%)',
            border: '1px solid rgba(245,130,32,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-ndrf-orange)',
            boxShadow: '0 0 25px rgba(245, 130, 32, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            position: 'relative',
          }}
        >
          <Shield size={28} />
          <div
            style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 130, 32, 0.25)',
              animation: 'border-glow-pulse 3s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: '900',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 50%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CBRS-X
            </h1>
            <span className="badge badge-pending animate-pulse-glow" style={{ fontSize: '0.68rem', padding: '3px 10px' }}>
              <span className="pulse-beacon" /> LIVE TELEMETRY
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>
            NDRF Tactical Command &amp; VR CBRN Disaster Training Platform (SIH260088)
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs & Command Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {/* Mode Switcher Pills */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '4px',
            borderRadius: '12px',
            display: 'flex',
            gap: '4px',
          }}
        >
          <button
            onClick={() => setActiveMode('tactical')}
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeMode === 'tactical' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
              color: activeMode === 'tactical' ? '#000' : 'var(--text-secondary)',
              boxShadow: activeMode === 'tactical' ? '0 2px 12px rgba(245, 130, 32, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Compass size={14} /> Tactical Operations
          </button>

          <button
            onClick={() => setActiveMode('analytics')}
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeMode === 'analytics' ? 'linear-gradient(135deg, #06b6d4, #0284c7)' : 'transparent',
              color: activeMode === 'analytics' ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeMode === 'analytics' ? '0 2px 12px rgba(6, 182, 212, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <LayoutDashboard size={14} /> Analytics &amp; Logs
          </button>

          <button
            onClick={() => setActiveMode('test')}
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeMode === 'test' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'transparent',
              color: activeMode === 'test' ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeMode === 'test' ? '0 2px 12px rgba(139, 92, 246, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Cpu size={14} /> Dev Simulator
          </button>

          <button
            onClick={() => setActiveMode('all')}
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeMode === 'all' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeMode === 'all' ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeMode === 'all' ? '0 2px 12px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Eye size={14} /> Full View
          </button>
        </div>

        {/* Live Clock */}
        <div style={{ textAlign: 'right', minWidth: '95px' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
            SIM CLOCK
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {utcClock}
          </span>
        </div>

        {/* Emergency Drill Trigger */}
        <button
          className="btn-tactical"
          onClick={onTriggerEmergency}
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.4))',
            borderColor: 'rgba(239, 68, 68, 0.6)',
            color: '#fca5a5',
            padding: '8px 14px',
          }}
        >
          <AlertTriangle size={15} color="#ef4444" /> Trigger Drill
        </button>

        {/* Refresh Telemetry Button */}
        <button className="btn-glow" onClick={onRefresh} disabled={loading} style={{ padding: '8px 16px' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Syncing...' : 'Sync Telemetry'}
        </button>

        {/* Return to Public Landing Page */}
        {onReturnHome && (
          <button
            onClick={onReturnHome}
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              background: 'rgba(15, 23, 42, 0.7)',
              color: '#93c5fd',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            Landing Page
          </button>
        )}
      </div>
    </header>
  );
}
