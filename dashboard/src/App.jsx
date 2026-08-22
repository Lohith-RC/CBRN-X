import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import MetricCards from './components/MetricCards.jsx';
import SessionsTable from './components/SessionsTable.jsx';
import SessionDetailModal from './components/SessionDetailModal.jsx';
import EventSimulator from './components/EventSimulator.jsx';
import TraineeVrScreen from './components/TraineeVrScreen.jsx';
import { WifiOff } from 'lucide-react';

const EMPTY_STATS = {
  totalTrainees: 0,
  totalSessionsCompleted: 0,
  overallPassRate: 0,
  averageScore: 0,
  recentSessions: [],
};

export default function App() {
  const [stats, setStats] = useState(EMPTY_STATS);
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
      setApiError('Cannot reach the CBRS-X backend. Metrics below reflect the last successful sync - live data is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      <Header onRefresh={fetchDashboardStats} loading={loading} />

      {apiError && (
        <div role="alert" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '24px',
          color: '#fca5a5',
          fontSize: '0.85rem',
        }}>
          <WifiOff size={20} style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: '#ef4444' }}>BACKEND OFFLINE.</strong> {apiError}
          </span>
        </div>
      )}

      <main>
        <TraineeVrScreen onSessionComplete={fetchDashboardStats} />

        <MetricCards stats={stats} />

        <SessionsTable
          sessions={stats?.recentSessions || []}
          onSelectSession={session => setSelectedSession(session)}
        />

        <EventSimulator onSessionCreated={fetchDashboardStats} />
      </main>

      <SessionDetailModal
        sessionSummary={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
}
