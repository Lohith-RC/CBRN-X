import React, { useState, useEffect, useCallback } from 'react';
import DashboardBackground from './components/DashboardBackground.jsx';
import Hero3DScene from './components/Hero3DScene.jsx';
import Header from './components/Header.jsx';
import MetricCards from './components/MetricCards.jsx';
import SessionsTable from './components/SessionsTable.jsx';
import SessionDetailModal from './components/SessionDetailModal.jsx';
import useLiveTelemetry from './hooks/useLiveTelemetry.js';
import { WifiOff } from 'lucide-react';

export default function App() {
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

        {/* 3D Hero Scene */}
        <Hero3DScene />

        <main>
          {/* Metric Cards */}
          <MetricCards stats={stats} />

          {/* Sessions Data Table */}
          <SessionsTable
            sessions={stats?.recentSessions || []}
            onSelectSession={(session) => setSelectedSession(session)}
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
