import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header.jsx';
import MetricCards from './components/MetricCards.jsx';
import SessionsTable from './components/SessionsTable.jsx';
import EmergencyCommandBar from './components/EmergencyCommandBar.jsx';
import TraineeMetadataCard from './components/TraineeMetadataCard.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import useLiveTelemetry from './hooks/useLiveTelemetry.js';
import { WifiOff, AlertTriangle } from 'lucide-react';

const DashboardBackground = lazy(() => import('./components/DashboardBackground.jsx'));
const LandingPage = lazy(() => import('./components/LandingPage.jsx'));
const Login = lazy(() => import('./components/Login.jsx'));
const PersonnelSafetyMatrix = lazy(() => import('./components/PersonnelSafetyMatrix.jsx'));
const MultiplayerCoopManager = lazy(() => import('./components/MultiplayerCoopManager.jsx'));
const SessionDetailModal = lazy(() => import('./components/SessionDetailModal.jsx'));
const EventSimulator = lazy(() => import('./components/EventSimulator.jsx'));
const TraineeVrScreen = lazy(() => import('./components/TraineeVrScreen.jsx'));
const TacticalCommandCenter = lazy(() => import('./components/TacticalCommandCenter.jsx'));
const StorageBayGhostReplay = lazy(() => import('./components/StorageBayGhostReplay.jsx'));

const ComponentLoaderFallback = () => (
  <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
    Loading tactical component module…
  </div>
);

const FALLBACK_STATS = {
  totalTrainees: 12,
  totalSessionsCompleted: 8,
  overallPassRate: 87.5,
  averageScore: 84.2,
  recentSessions: [
    {
      sessionId: 'sess-demo-01',
      traineeName: 'Inspector NDRF',
      batchUnit: 'NDRF Battalion',
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
      ],
    },
  ],
};

function CommandDashboard({ onReturnHome }) {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeMode, setActiveMode] = useState('singlepane'); // 'singlepane' | 'tactical' | 'analytics' | 'test'
  const [activeTeamId, setActiveTeamId] = useState('alpha');
  const [showDrillModal, setShowDrillModal] = useState(false);

  const handleMissionCompleted = (sessionData) => {
    fetchDashboardStats();
    const sessionToOpen = sessionData || stats?.recentSessions?.[0] || FALLBACK_STATS.recentSessions[0];
    setSelectedSession(sessionToOpen);
  };

  const { liveConnected, connectionState, liveEvents } = useLiveTelemetry({
    onScenarioCompleted: handleMissionCompleted,
  });

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
    window.scrollTo(0, 0);
    fetchDashboardStats();
  }, []);

  // Global Tactical Keybindings (Alt+1: Tactical, Alt+2: Single-pane, Alt+R: Refresh, Esc: Close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in form inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if ((e.altKey && e.key === '1') || e.key === 'F1') {
        e.preventDefault();
        setActiveMode('tactical');
      } else if ((e.altKey && e.key === '2') || e.key === 'F2') {
        e.preventDefault();
        setActiveMode('singlepane');
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        fetchDashboardStats();
      } else if (e.key === 'Escape') {
        setSelectedSession(null);
        setShowDrillModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Full-page animated 3D background layer */}
      <Suspense fallback={null}>
        <DashboardBackground />
      </Suspense>

      {/* Main Content Container (Task 4: High-density 1080p and 4K presentation layout scaling) */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1920px', width: '100%', margin: '0 auto', padding: '24px 32px' }}>
        <Header
          onRefresh={fetchDashboardStats}
          loading={loading}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          onTriggerEmergency={() => setShowDrillModal(true)}
          onReturnHome={onReturnHome}
          liveConnected={liveConnected}
          connectionState={connectionState}
        />

        {/* Emergency Command Override Interface */}
        <EmergencyCommandBar onTriggerEmergency={() => setShowDrillModal(true)} />

        {apiError && (
          <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.45)', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', color: '#fca5a5', fontSize: '0.85rem', backdropFilter: 'blur(8px)' }}>
            <WifiOff size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>
              <strong style={{ color: '#ef4444' }}>OFFLINE / DEMO MODE.</strong> {apiError}
            </span>
          </div>
        )}

        {/* SINGLE-PANE CONSOLE (DEFAULT): Zero-Click Battalion View */}
        {(activeMode === 'singlepane' || activeMode === 'all') && (
          <main style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            {/* Top KPI Metrics Bar */}
            <MetricCards stats={stats} />

            {/* Operational Split View: 7-col Interactive Viewport & Radar | 5-col Trainee & Safety Console */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px', alignItems: 'start' }}>
              {/* Left Column: Interactive VR Viewport, Ghost Twin & Radar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Suspense fallback={<ComponentLoaderFallback />}>
                  <TraineeVrScreen activeTeamId={activeTeamId} onSessionComplete={handleMissionCompleted} />
                </Suspense>

                <Suspense fallback={<ComponentLoaderFallback />}>
                  <StorageBayGhostReplay currentTimeSec={145} />
                </Suspense>

                <Suspense fallback={<ComponentLoaderFallback />}>
                  <TacticalCommandCenter
                    onTriggerEmergency={() => setShowDrillModal(true)}
                    onRefresh={fetchDashboardStats}
                    liveEvents={liveEvents}
                  />
                </Suspense>
              </div>

              {/* Right Column: Trainee Operator Card, Co-Op Telemetry & SCBA Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <TraineeMetadataCard
                  traineeName={stats?.recentSessions?.[0]?.traineeName || 'Inspector Lohith R C'}
                  sessionId={stats?.recentSessions?.[0]?.sessionId || 'SESS-CBRN-2026-088'}
                  missionStage="Stage 2: Donning Level-A Suit & Hot-Zone Recon"
                  unit={stats?.recentSessions?.[0]?.batchUnit || '10th NDRF Battalion'}
                  status="IN MISSION"
                  onOpenReplay={() => setSelectedSession(stats?.recentSessions?.[0] || FALLBACK_STATS.recentSessions[0])}
                />

                <Suspense fallback={<ComponentLoaderFallback />}>
                  <MultiplayerCoopManager activeTeamId={activeTeamId} onSelectActiveTeam={setActiveTeamId} />
                </Suspense>

                <Suspense fallback={<ComponentLoaderFallback />}>
                  <PersonnelSafetyMatrix />
                </Suspense>
              </div>
            </div>

            {/* Sessions Telemetry Data Table */}
            <SessionsTable
              sessions={stats?.recentSessions || []}
              onSelectSession={(session) => setSelectedSession(session)}
            />
          </main>
        )}

        {/* VIEW MODE: Dedicated Radar Focus */}
        {activeMode === 'tactical' && (
          <Suspense fallback={<ComponentLoaderFallback />}>
            <TacticalCommandCenter
              onTriggerEmergency={() => setShowDrillModal(true)}
              onRefresh={fetchDashboardStats}
              liveEvents={liveEvents}
            />
          </Suspense>
        )}

        {/* VIEW MODE: Dev Telemetry Simulator */}
        {activeMode === 'test' && (
          <div>
            <Suspense fallback={<ComponentLoaderFallback />}>
              <EventSimulator onSessionCreated={fetchDashboardStats} />
            </Suspense>
          </div>
        )}

        {/* Mission Evaluation Detail Modal */}
        <Suspense fallback={null}>
          <SessionDetailModal
            sessionSummary={selectedSession}
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        </Suspense>

        {/* Emergency Drill Overlay Modal */}
        {showDrillModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '480px', padding: '32px', border: '2px solid rgba(239, 68, 68, 0.6)', borderRadius: '16px', textAlign: 'center', boxShadow: '0 0 60px rgba(239, 68, 68, 0.35)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#ef4444' }}>
                <AlertTriangle size={32} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: '8px' }}>
                ⚠ CRITICAL EMERGENCY DRILL
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                Emergency drill protocol activated across all NDRF Battalion trainee terminals. Sector Delta radiation &amp; chemical simulation locked to level-4 high hazard parameters.
              </p>
              <button className="btn-glow" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderColor: 'rgba(239, 68, 68, 0.6)', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)' }} onClick={() => setShowDrillModal(false)}>
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', background: '#04060c', fontFamily: 'monospace' }}>
        Establishing secure NDRF connection…
      </div>
    );
  }

  // 1. Landing Page Flow
  if (view === 'landing') {
    return (
      <Suspense fallback={<ComponentLoaderFallback />}>
        <LandingPage
          onEnterDashboard={() => setView('login')}
          onLaunchSim={() => window.open('/unity-sim/index.html', '_blank')}
        />
      </Suspense>
    );
  }

  // 2. Sign In / Authentication Flow
  if (!user || (view === 'login' && !user)) {
    return (
      <div style={{ minHeight: '100vh', background: '#04060c', position: 'relative' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', paddingTop: '32px', paddingLeft: '16px', paddingRight: '16px' }}>
          <button onClick={() => setView('landing')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#93c5fd', fontSize: '0.85rem', fontFamily: 'monospace', cursor: 'pointer', marginBottom: '16px' }}>
            &larr; Back to Landing Page
          </button>
          <Suspense fallback={<ComponentLoaderFallback />}>
            <Login onSuccess={() => setView('dashboard')} />
          </Suspense>
        </div>
      </div>
    );
  }

  // 3. Chandana M P Admin Dashboard (Frontend & Backend Integration Flow)
  return <CommandDashboard onReturnHome={() => setView('landing')} />;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CBRS-X ErrorBoundary caught exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#04060c', color: '#fff', padding: '24px', fontFamily: 'monospace' }}>
          <div className="glass-card-deep" style={{ maxWidth: '540px', padding: '32px', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '16px', textAlign: 'center' }}>
            <h2 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '1.2rem' }}>⚠ TACTICAL DASHBOARD VIEW EXCEPTION</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred inside the dashboard.'}
            </p>
            <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }} onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/?view=dashboard'; }}>
              Reload Command Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainView />
      </AuthProvider>
    </ErrorBoundary>
  );
}
