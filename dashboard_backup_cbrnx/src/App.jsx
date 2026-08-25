import React, { useState, useEffect, useCallback } from 'react';
import DashboardBackground from './components/DashboardBackground.jsx';
import MissionStrip from './components/MissionStrip.jsx';
import Header from './components/Header.jsx';
import MetricCards from './components/MetricCards.jsx';
import CohortBoard from './components/CohortBoard.jsx';
import SessionsTable from './components/SessionsTable.jsx';
import SessionDetailModal from './components/SessionDetailModal.jsx';
import Login from './components/Login.jsx';
import LandingPage from './components/LandingPage.jsx';
import useLiveTelemetry from './hooks/useLiveTelemetry.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { WifiOff, Home } from 'lucide-react';

function Dashboard({ onReturnHome }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) {
        throw new Error(`Backend responded with status ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.warn('Backend API unreachable:', err.message);
      setStats(null);
      setApiError('Cannot reach the CBRS-X scoring engine. Metrics are withheld rather than displaying fabricated values.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const { liveConnected } = useLiveTelemetry({ onScenarioCompleted: fetchDashboardStats });

  return (
    <>
      {/* Full-page animated 3D background layer */}
      <DashboardBackground />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1320px', margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Quick Back to Landing Page Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button
            onClick={onReturnHome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#93c5fd',
              fontSize: '0.78rem',
              fontFamily: 'monospace',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s'
            }}
          >
            <Home size={14} />
            Public Landing Page
          </button>
        </div>

        <Header onRefresh={fetchDashboardStats} loading={loading} liveConnected={liveConnected} />

        {apiError && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '24px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              backdropFilter: 'blur(8px)',
            }}
          >
            <WifiOff size={20} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>
              <strong style={{ color: '#ef4444' }}>OFFLINE — NO DATA SHOWN.</strong> {apiError}
            </span>
          </div>
        )}

        {/* Compact static mission strip */}
        <MissionStrip liveConnected={liveConnected} />

        <main>
          {/* Metric Cards */}
          <MetricCards stats={stats} />

          {/* Cohort Analytics Board */}
          <CohortBoard />

          {/* Sessions Data Table */}
          <SessionsTable
            onSelectSession={(session) => setSelectedSession(session)}
            onDataChanged={fetchDashboardStats}
          />
        </main>

        {/* Session Detail Modal */}
        <SessionDetailModal
          sessionSummary={selectedSession}
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      </div>
    </>
  );
}

function MainView() {
  const { user, booting } = useAuth();
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'dashboard' ? 'dashboard' : 'landing';
  });

  if (booting) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          background: '#060911'
        }}
      >
        Establishing secure connection…
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onEnterDashboard={() => setView('dashboard')}
        onLaunchSim={() => window.open('/unity-sim/index.html', '_blank')}
      />
    );
  }

  return user ? (
    <Dashboard onReturnHome={() => setView('landing')} />
  ) : (
    <div style={{ minHeight: '100vh', background: '#060911' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', paddingTop: '40px' }}>
        <button
          onClick={() => setView('landing')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: '#93c5fd',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          &larr; Back to Landing Page
        </button>
        <Login />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainView />
    </AuthProvider>
  );
}
