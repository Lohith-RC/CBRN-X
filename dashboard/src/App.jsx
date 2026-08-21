import React, { useState, useEffect } from 'react';
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
    recentSessions: []
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
    } catch (err) {
      console.warn('Backend API offline or unreachable, using local telemetry fallback.');
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
      
      <main>
        {/* Trainee VR Vision First-Person Screen */}
        <TraineeVrScreen onSessionComplete={fetchDashboardStats} />

        <MetricCards stats={stats} />
        
        <SessionsTable 
          sessions={stats?.recentSessions} 
          onSelectSession={session => setSelectedSession(session)} 
        />

        <EventSimulator onSessionCreated={fetchDashboardStats} />
      </main>

      <SessionDetailModal 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)} 
      />
    </div>
  );
}
