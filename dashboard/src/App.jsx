import React, { useState, useEffect } from 'react';
import DashboardBackground from './components/DashboardBackground.jsx';
import Hero3DScene from './components/Hero3DScene.jsx';
import Header from './components/Header.jsx';
import MetricCards from './components/MetricCards.jsx';
import SessionsTable from './components/SessionsTable.jsx';
import SessionDetailModal from './components/SessionDetailModal.jsx';
import EventSimulator from './components/EventSimulator.jsx';
import TraineeVrScreen from './components/TraineeVrScreen.jsx';

export default function App() {
  const [stats, setStats] = useState({
    totalTrainees: 12,
    totalSessionsCompleted: 8,
    overallPassRate: 87.5,
    averageScore: 84.2,
    recentSessions: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // Backend offline, using local fallback
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

        {/* 3D Hero Scene */}
        <Hero3DScene />

        <main>
          {/* Metric Cards */}
          <MetricCards stats={stats} />

          {/* VR First-Person Screen */}
          <TraineeVrScreen onSessionComplete={fetchDashboardStats} />

          {/* Sessions Data Table */}
          <SessionsTable
            sessions={stats?.recentSessions}
            onSelectSession={(session) => setSelectedSession(session)}
          />

          {/* Event Simulator */}
          <EventSimulator onSessionCreated={fetchDashboardStats} />
        </main>

        {/* Session Detail Modal */}
        <SessionDetailModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      </div>
    </>
  );
}
