import React, { useState, useEffect } from 'react';
import DashboardBackground from './components/DashboardBackground.jsx';
import Header from './components/Header.jsx';
import MetricCards from './components/MetricCards.jsx';
import SessionsTable from './components/SessionsTable.jsx';
import SessionDetailModal from './components/SessionDetailModal.jsx';
import EventSimulator from './components/EventSimulator.jsx';
import TraineeVrScreen from './components/TraineeVrScreen.jsx';
import TacticalCommandCenter from './components/TacticalCommandCenter.jsx';
import LandingPage from './components/LandingPage.jsx';
import Login from './components/Login.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { WifiOff, AlertTriangle } from 'lucide-react';

const FALLBACK_STATS = {
  totalTrainees: 12,
  totalSessionsCompleted: 8,
  overallPassRate: 87.5,
  averageScore: 84.2,
  recentSessions: [
    {
      sessionId: 'sess-demo-01',
      traineeName: 'Inspector Lohith R C',
      batchUnit: '10th NDRF Battalion',
      scenarioTitle: 'Chlorine Gas Leak Response',
      scenarioCode: 'CBRN-CHEM-01',
      finalScore: 92,
      passStatus: 'PASSED',
      totalDurationSeconds: 145,
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3455000).toISOString(),
      mistakes: [],
      recommendations: [
        'Excellent response speed in donning level A chemical suit.',
        'Rapid perimeter isolation achieved within 90 seconds.',
        'Maintained proper windward approach to leaking drum.',
      ],
    },
    {
      sessionId: 'sess-demo-02',
      traineeName: 'Sub-Inspector Ananya Rao',
      batchUnit: '4th NDRF Battalion',
      scenarioTitle: 'Chlorine Gas Leak Response',
      scenarioCode: 'CBRN-CHEM-01',
      finalScore: 68,
      passStatus: 'FAILED',
      totalDurationSeconds: 230,
      startedAt: new Date(Date.now() - 7200000).toISOString(),
      completedAt: new Date(Date.now() - 6970000).toISOString(),
      mistakes: [
        {
          stage: 'PPE Donning',
          severity: 'HIGH',
          description: 'Entered hazard perimeter before sealing suit respirator valve.',
          deductionPoints: 15,
        },
        {
          stage: 'Detection',
          severity: 'MEDIUM',
          description: 'Failed to hold PID sensor within 1m of drum seam.',
          deductionPoints: 10,
        },
      ],
      recommendations: [
        'Always complete full cross-check of suit seals before entering hot zone.',
        'Calibrate PID photoionization detector at fresh-air baseline.',
      ],
    },
  ],
};

function CommandDashboard({ onReturnHome }) {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeMode, setActiveMode] = useState('analytics'); // 'tactical' | 'analytics' | 'test' | 'all'
  const [showDrillModal, setShowDrillModal] = useState(false);

  const fetchDashboardStats = async () => {
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
      setApiError('Cannot reach the CBRS-X backend. Metrics below reflect cached demonstration telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <>
      {/* Full-page animated 3D background layer */}
      <DashboardBackground />

      {/* Main Content Container */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
        <Header
          onRefresh={fetchDashboardStats}
          loading={loading}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          onTriggerEmergency={() => setShowDrillModal(true)}
          onReturnHome={onReturnHome}
        />

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
              padding: '12px 18px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              backdropFilter: 'blur(8px)',
            }}
          >
            <WifiOff size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>
              <strong style={{ color: '#ef4444' }}>OFFLINE / DEMO MODE.</strong> {apiError}
            </span>
          </div>
        )}

        {/* VIEW MODE 1: Tactical Radar Operations */}
        {(activeMode === 'tactical' || activeMode === 'all') && (
          <TacticalCommandCenter
            onTriggerEmergency={() => setShowDrillModal(true)}
            onRefresh={fetchDashboardStats}
          />
        )}

        {/* VIEW MODE 2: Instructor Analytics & Logs */}
        {(activeMode === 'analytics' || activeMode === 'all') && (
          <main>
            {/* Streamlined Metrics */}
            <MetricCards stats={stats} />

            {/* Interactive VR Viewport Launcher */}
            <div style={{ marginBottom: '24px' }}>
              <TraineeVrScreen onSessionComplete={fetchDashboardStats} />
            </div>

            {/* Sessions Telemetry Data Table */}
            <SessionsTable
              sessions={stats?.recentSessions || []}
              onSelectSession={(session) => setSelectedSession(session)}
            />
          </main>
        )}

        {/* VIEW MODE 3: Dev Simulator Telemetry Launcher */}
        {(activeMode === 'test' || activeMode === 'all') && (
          <div style={{ marginTop: activeMode === 'all' ? '24px' : '0' }}>
            <EventSimulator onSessionCreated={fetchDashboardStats} />
          </div>
        )}

        {/* Mission Evaluation Detail Modal */}
        <SessionDetailModal
          sessionSummary={selectedSession}
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />

        {/* Emergency Drill Overlay Modal */}
        {showDrillModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div
              className="glass-panel"
              style={{
                width: '90%',
                maxWidth: '480px',
                padding: '32px',
                border: '2px solid rgba(239, 68, 68, 0.6)',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 0 60px rgba(239, 68, 68, 0.35)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#ef4444',
                }}
              >
                <AlertTriangle size={32} />
              </div>

              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: '800',
                  color: '#ef4444',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  marginBottom: '8px',
                }}
              >
                ⚠ CRITICAL EMERGENCY DRILL
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                Emergency drill protocol activated across all 10th NDRF Battalion trainee terminals. Sector Delta radiation &amp; chemical simulation locked to level-4 high hazard parameters.
              </p>

              <button
                className="btn-glow"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  borderColor: 'rgba(239, 68, 68, 0.6)',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                }}
                onClick={() => setShowDrillModal(false)}
              >
                ACKNOWLEDGE &amp; DISMISS DRILL
              </button>
            </div>
          </div>
        )}
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
          background: '#04060c',
          fontFamily: 'monospace'
        }}
      >
        Establishing secure NDRF connection…
      </div>
    );
  }

  // 1. Landing Page Flow
  if (view === 'landing') {
    return (
      <LandingPage
        onEnterDashboard={() => setView('dashboard')}
        onLaunchSim={() => window.open('/unity-sim/index.html', '_blank')}
      />
    );
  }

  // 2. Sign In / Authentication Flow
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#04060c', position: 'relative' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', paddingTop: '32px', paddingLeft: '16px', paddingRight: '16px' }}>
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

  // 3. Newly Committed Chandana M P Admin Dashboard Flow
  return <CommandDashboard onReturnHome={() => setView('landing')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainView />
    </AuthProvider>
  );
}
