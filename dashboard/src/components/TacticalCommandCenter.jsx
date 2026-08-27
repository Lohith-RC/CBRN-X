import React from 'react';
import TacticalMapCanvas from './TacticalMapCanvas.jsx';
import UnitReadinessSidebar from './UnitReadinessSidebar.jsx';
import IncidentLogFeed from './IncidentLogFeed.jsx';
import TraineeOverviewPanel from './TraineeOverviewPanel.jsx';
import TacticalPerformanceBar from './TacticalPerformanceBar.jsx';

export default function TacticalCommandCenter({ onTriggerEmergency, onRefresh, liveEvents }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top 3-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          minHeight: '480px',
        }}
      >
        {/* Left: Unit Readiness Sidebar */}
        <UnitReadinessSidebar />

        {/* Center: Tactical 2D Radar Map Container */}
        <div
          className="glass-card-deep"
          style={{
            position: 'relative',
            borderRadius: '14px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TacticalMapCanvas />
        </div>

        {/* Right Stack: Incident Feed + Trainee Overview */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '16px', height: '100%' }}>
          <IncidentLogFeed events={liveEvents} />
          <TraineeOverviewPanel onTriggerEmergency={onTriggerEmergency} />
        </div>
      </div>

      {/* Bottom Performance Analytics & Action Bar */}
      <TacticalPerformanceBar onTriggerEmergency={onTriggerEmergency} onRefresh={onRefresh} />
    </div>
  );
}
