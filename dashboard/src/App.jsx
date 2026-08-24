import React, { useState, useEffect } from 'react';
import DashboardBackground from './components/DashboardBackground.jsx';
import Hero3DScene from './components/Hero3DScene.jsx';
import Header from './components/Header.jsx';
import MetricCards from './components/MetricCards.jsx';
import SessionsTable from './components/SessionsTable.jsx';
import SessionDetailModal from './components/SessionDetailModal.jsx';
import EventSimulator from './components/EventSimulator.jsx';
import TraineeVrScreen from './components/TraineeVrScreen.jsx';
import { WifiOff } from 'lucide-react';

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

export default function App() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

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

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1320px', margin: '0 auto', padding: '24px 20px' }}>
        <Header onRefresh={fetchDashboardStats} loading={loading} />

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
              <strong style={{ color: '#ef4444' }}>OFFLINE / DEMO MODE.</strong> {apiError}
            </span>
          </div>
        )}

        {/* 3D Hero Scene */}
        <Hero3DScene />

        <main>
          {/* Metric Cards */}
          <MetricCards stats={stats} />

          {/* VR First-Person Screen */}
          <TraineeVrScreen onSessionComplete={fetchDashboardStats} />

          {/* Sessions Data Table */}
          <SessionsTable
            sessions={stats?.recentSessions || []}
            onSelectSession={(session) => setSelectedSession(session)}
          />

          {/* Event Simulator */}
          <EventSimulator onSessionCreated={fetchDashboardStats} />
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
