import React, { useState } from 'react';
import { Play, CheckCircle, AlertOctagon, UserCheck, ShieldAlert, Send } from 'lucide-react';

export default function EventSimulator({ onSessionCreated }) {
  const [traineeName, setTraineeName] = useState('Constable Rahul Kumar');
  const [batchUnit, setBatchUnit] = useState('10th NDRF Battalion');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const startNewSession = async () => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName,
          batchUnit,
          scenarioCode: 'CBRN-CHEM-01'
        })
      });
      const data = await res.json();
      setActiveSessionId(data.sessionId);
      setLogs([`Session started: ${data.sessionId} for ${data.traineeName}`]);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const emitEvent = async (eventType, eventData = '{}') => {
    if (!activeSessionId) return;
    try {
      const res = await fetch('/api/events/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSessionId,
          eventType,
          eventData
        })
      });
      const data = await res.json();
      setLogs(prev => [...prev, `[LOGGED] ${eventType} -> ${eventData}`]);
    } catch (err) {
      console.error('Failed to log event:', err);
    }
  };

  const completeSimulation = async () => {
    if (!activeSessionId) return;
    try {
      const res = await fetch(`/api/sessions/${activeSessionId}/complete`, { method: 'POST' });
      const report = await res.json();
      setLogs(prev => [...prev, `[COMPLETE] Final Score: ${report.finalScore} | Status: ${report.passStatus}`]);
      if (onSessionCreated) onSessionCreated();
      setActiveSessionId(null);
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const runFullPreset = async (isPerfect) => {
    setIsSimulating(true);
    setLogs([]);
    try {
      // 1. Start Session
      const startRes = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: isPerfect ? 'Inspector Vikram Singh' : 'Constable Amit Patel',
          batchUnit: '10th NDRF Battalion',
          scenarioCode: 'CBRN-CHEM-01'
        })
      });
      const session = await startRes.json();
      const sId = session.sessionId;

      if (isPerfect) {
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'ppe_donning_completed', eventData: '{"mask":true,"suit":true,"gloves":true}' }) });
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'detector_equipped', eventData: '{"device":"PID Detector"}' }) });
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'leak_source_identified', eventData: '{"correct":true,"drumId":"DRUM-03"}' }) });
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'civilian_evacuated', eventData: '{"civilianId":"CIV-01"}' }) });
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'civilian_evacuated', eventData: '{"civilianId":"CIV-02"}' }) });
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'containment_completed', eventData: '{"sealant":"applied"}' }) });
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'decontamination_completed', eventData: '{"archway":true}' }) });
      } else {
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'entered_hazard_zone_without_ppe', eventData: '{"warning":true}' }) });
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'leak_source_identified', eventData: '{"correct":false,"drumId":"DRUM-01"}' }) });
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'evacuation_incomplete', eventData: '{"count":1}' }) });
        await fetch('/api/events/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: sId, eventType: 'containment_completed', eventData: '{"sealant":"applied"}' }) });
      }

      const compRes = await fetch(`/api/sessions/${sId}/complete`, { method: 'POST' });
      const report = await compRes.json();
      setLogs([
        `Simulation finished for ${report.traineeName}`,
        `Final Score: ${report.finalScore} / 100 [${report.passStatus}]`,
        `Mistakes logged: ${report.mistakes.length}`
      ]);

      if (onSessionCreated) onSessionCreated();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
        VR Unity Telemetry Simulator & Quick Test Bench
      </h2>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
        Simulate live event streams from Unity desktop client to test Spring Boot backend scoring engine
      </p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => runFullPreset(true)} disabled={isSimulating}>
          <CheckCircle size={16} /> Simulate 100% Perfect Run
        </button>
        <button className="btn-secondary" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--accent-red)' }} onClick={() => runFullPreset(false)} disabled={isSimulating}>
          <AlertOctagon size={16} /> Simulate Flawed Run (Protocol Violations)
        </button>
      </div>

      {/* Manual Step Controls */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          MANUAL STEP-BY-STEP SIMULATION
        </div>

        {!activeSessionId ? (
          <button className="btn-secondary" onClick={startNewSession}>
            <Play size={14} /> Start Manual Session
          </button>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => emitEvent('entered_hazard_zone_without_ppe')}>
              ⚠️ Enter Without PPE (-15)
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => emitEvent('ppe_donning_completed', '{"mask":true,"suit":true,"gloves":true}')}>
              🛡️ Don PPE (+10)
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => emitEvent('leak_source_identified', '{"correct":true}')}>
              🔍 Identify Leak (+10)
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => emitEvent('leak_source_identified', '{"correct":false}')}>
              ❌ Wrong Drum Flag (-5)
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => emitEvent('civilian_evacuated', '{"civilianId":"CIV-01"}')}>
              🏃 Evacuate Civilian (+15)
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => emitEvent('containment_completed')}>
              🛠️ Contain Drum (+15)
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.78rem' }} onClick={() => emitEvent('decontamination_completed')}>
              🚿 Decontamination (+10)
            </button>
            <button className="btn-primary" style={{ fontSize: '0.78rem', padding: '6px 12px' }} onClick={completeSimulation}>
              <Send size={14} /> Finalize Session
            </button>
          </div>
        )}
      </div>

      {/* Log Console Output */}
      {logs.length > 0 && (
        <div style={{
          background: '#070a0f',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          color: 'var(--accent-cyan)'
        }}>
          {logs.map((log, idx) => (
            <div key={idx}>&gt; {log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
