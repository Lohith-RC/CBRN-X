import React, { useState, useEffect } from 'react';
import { Shield, Radio, RefreshCw, LayoutDashboard, Compass, Eye, Cpu, AlertTriangle, Award, Wifi, WifiOff } from 'lucide-react';

/* Shared style builder for mode switcher buttons — eliminates inline repetition */
function modeBtnStyle(isActive, gradient, shadowColor) {
  return {
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
    background: isActive ? gradient : 'transparent',
    color: isActive ? (gradient.includes('#f59e0b') ? '#000' : '#fff') : 'var(--text-secondary)',
    boxShadow: isActive ? `0 2px 12px ${shadowColor}` : 'none',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  };
}

const MODE_TABS = [
  { key: 'singlepane', label: 'Judges Evaluation View', Icon: Award, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.4)', alsoActive: ['judges'] },
  { key: 'tactical', label: 'Tactical Operations', Icon: Compass, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245, 130, 32, 0.4)', alsoActive: [] },
  { key: 'analytics', label: 'Analytics & Logs', Icon: LayoutDashboard, gradient: 'linear-gradient(135deg, #06b6d4, #0284c7)', shadow: 'rgba(6, 182, 212, 0.4)', alsoActive: [] },
  { key: 'test', label: 'Dev Simulator', Icon: Cpu, gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', shadow: 'rgba(139, 92, 246, 0.4)', alsoActive: [] },
  { key: 'all', label: 'Full View', Icon: Eye, gradient: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.4)', alsoActive: [] },
];

export default function Header({ onRefresh, loading, activeMode, setActiveMode, onTriggerEmergency, onReturnHome, liveConnected = true, connectionState = 'CONNECTED' }) {
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

  // Status Indicator Badge configuration (Task 4: Live, Connected, Reconnecting, Disconnected)
  const isConnected = connectionState === 'CONNECTED' || liveConnected;
  const isReconnecting = connectionState === 'RECONNECTING';

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
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(245,130,32,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(245, 130, 32, 0.4)',
            position: 'relative',
            background: '#000',
          }}
        >
          <img
            src="/cbrn_x_logo.jpg"
            alt="CBRN-X Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '-1px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 130, 32, 0.35)',
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

            {/* DYNAMIC TELEMETRY STATUS INDICATORS (Task 4: Live, Connected, Reconnecting) */}
            {isConnected ? (
              <span
                className="badge badge-success animate-pulse-glow"
                style={{ fontSize: '0.68rem', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span className="pulse-beacon" /> LIVE • CONNECTED
              </span>
            ) : isReconnecting ? (
              <span
                className="badge badge-warning"
                style={{ fontSize: '0.68rem', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={11} className="animate-spin" /> RECONNECTING...
              </span>
            ) : (
              <span
                className="badge badge-failed"
                style={{ fontSize: '0.68rem', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <WifiOff size={11} /> DISCONNECTED
              </span>
            )}
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
            flexWrap: 'wrap',
          }}
        >
          {MODE_TABS.map(({ key, label, Icon, gradient, shadow, alsoActive }) => {
            const isActive = activeMode === key || alsoActive.includes(activeMode);
            return (
              <button
                key={key}
                onClick={() => setActiveMode(key)}
                aria-current={isActive ? 'page' : undefined}
                style={modeBtnStyle(isActive, gradient, shadow)}
              >
                <Icon size={14} /> {label}
              </button>
            );
          })}
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
            className="btn-outline"
            style={{
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: '700',
              fontFamily: 'var(--font-mono)',
              borderColor: 'rgba(59, 130, 246, 0.35)',
              background: 'rgba(15, 23, 42, 0.7)',
              color: '#93c5fd',
            }}
          >
            Landing Page
          </button>
        )}
      </div>
    </header>
  );
}
