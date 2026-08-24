import React, { useState } from 'react';
import { Play, CheckCircle, AlertOctagon, Send, Radiation, Biohazard, ShieldAlert } from 'lucide-react';

const SCENARIOS = [
  { code: 'CBRN-CHEM-01', title: 'Chemical Spill Emergency (Bay 03)', icon: '☣️' },
  { code: 'CBRN-RAD-02', title: 'Radiological Isotope Breach (Reactor Vault)', icon: '☢️' },
  { code: 'CBRN-BIO-03', title: 'Biological Pathogen Isolation (Level-4 Lab)', icon: '🧬' },
];

export default function EventSimulator({ onSessionCreated }) {
  const [selectedScenario, setSelectedScenario] = useState('CBRN-CHEM-01');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const startNewSession = async () => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: 'Constable Rahul Kumar',
          batchUnit: '10th NDRF Battalion',
          scenarioCode: selectedScenario,
        }),
      });
      const data = await res.json();
      setActiveSessionId(data.sessionId);
      setLogs([`[INITIALIZED] Session started: ${data.sessionId} (${selectedScenario})`]);
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const emitEvent = async (eventType, eventData = '{}') => {
    if (!activeSessionId) return;
    try {
      await fetch('/api/events/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSessionId, eventType, eventData }),
      });
      setLogs((prev) => [...prev, `[DISPATCHED] ${eventType} -> ${eventData}`]);
    } catch (err) {
      console.error('Failed to log event:', err);
    }
  };

  const completeSimulation = async () => {
    if (!activeSessionId) return;
    try {
      const res = await fetch(`/api/sessions/${activeSessionId}/complete`, { method: 'POST' });
      const report = await res.json();
      setLogs((prev) => [
        ...prev,
        `[FINAL AUDIT] Final Score: ${report.finalScore} / 100 [${report.passStatus}] | Mistakes: ${report.mistakes?.length || 0}`,
      ]);
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
      const startRes = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: isPerfect ? 'Inspector Vikram Singh' : 'Constable Amit Patel',
          batchUnit: '10th NDRF Battalion',
          scenarioCode: selectedScenario,
        }),
      });
      const session = await startRes.json();
      const sId = session.sessionId;

      const logBody = (et, ed) =>
        fetch('/api/events/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sId, eventType: et, eventData: ed }),
        });

      if (isPerfect) {
        await logBody('ppe_donning_completed', '{"mask":true,"suit":true,"gloves":true}');
        await logBody('detector_equipped', '{"device":"PID / Dosimeter / Bio-Sampler"}');
        await logBody('leak_source_identified', '{"correct":true,"sourceId":"HOT-ZONE-01"}');
        await logBody('civilian_evacuated', '{"civilianId":"CIV-01"}');
        await logBody('civilian_evacuated', '{"civilianId":"CIV-02"}');
        await logBody('containment_completed', '{"shielding":"sealed"}');
        await logBody('decontamination_completed', '{"multiStageShower":true}');
      } else {
        await logBody('entered_hazard_zone_without_ppe', '{"warning":true}');
        await logBody('leak_source_identified', '{"correct":false,"sourceId":"INCORRECT-01"}');
        await logBody('evacuation_incomplete', '{"count":1}');
        await logBody('containment_completed', '{"sealant":"partial"}');
      }

      const compRes = await fetch(`/api/sessions/${sId}/complete`, { method: 'POST' });
      const report = await compRes.json();
      setLogs([
        `Simulation finished for ${report.traineeName}`,
        `Final Score: ${report.finalScore} / 100 [${report.passStatus}]`,
        `Mistakes logged: ${report.mistakes.length}`,
      ]);
      if (onSessionCreated) onSessionCreated();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const simBtnStyle = {
    fontSize: '0.78rem',
    padding: '5px 12px',
  };

  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '24px', animationDelay: '0.45s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', margin: 0 }}>
            Multi-Hazard Tactical Telemetry Simulator
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
            Simulate live event streams from VR / WebGL client into Spring Boot scoring and AI debrief engine
          </p>
        </div>

        {/* Scenario Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Active Scenario:</span>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            disabled={Boolean(activeSessionId) || isSimulating}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {SCENARIOS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.icon} {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', marginTop: '14px' }}>
        <button className="btn-primary" onClick={() => runFullPreset(true)} disabled={isSimulating}>
          <CheckCircle size={16} /> Simulate 100% Perfect Run
        </button>
        <button
          className="btn-secondary"
          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--accent-red)' }}
          onClick={() => runFullPreset(false)}
          disabled={isSimulating}
        >
          <AlertOctagon size={16} /> Simulate Flawed Run
        </button>
      </div>

      {/* Manual Step Controls */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          MANUAL STEP-BY-STEP SIMULATION
        </div>

        {!activeSessionId ? (
          <button className="btn-secondary" onClick={startNewSession}>
            <Play size={14} /> Start Manual Session ({selectedScenario})
          </button>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn-secondary" style={simBtnStyle} onClick={() => emitEvent('entered_hazard_zone_without_ppe')}>
              ⚠️ Enter Without PPE (-15)
            </button>
            <button className="btn-secondary" style={simBtnStyle} onClick={() => emitEvent('ppe_donning_completed', '{"mask":true,"suit":true,"gloves":true}')}>
              🛡️ Don Full CBRN PPE (+10)
            </button>
            <button className="btn-secondary" style={simBtnStyle} onClick={() => emitEvent('detector_equipped', '{"calibrated":true}')}>
              🔍 Equip Detector / Dosimeter
            </button>
            <button className="btn-secondary" style={simBtnStyle} onClick={() => emitEvent('leak_source_identified', '{"correct":true}')}>
              🎯 Identify Source (+10)
            </button>
            <button className="btn-secondary" style={simBtnStyle} onClick={() => emitEvent('leak_source_identified', '{"correct":false}')}>
              ❌ False Positive Scan (-5)
            </button>
            <button className="btn-secondary" style={simBtnStyle} onClick={() => emitEvent('civilian_evacuated', '{"civilianId":"CIV-01"}')}>
              🏃 Evacuate Civilian (+15)
            </button>
            <button className="btn-secondary" style={simBtnStyle} onClick={() => emitEvent('containment_completed')}>
              🛠️ Seal Hazard / Shield (+15)
            </button>
            <button className="btn-secondary" style={simBtnStyle} onClick={() => emitEvent('decontamination_completed')}>
              🚿 Decon Shower (+10)
            </button>
            <button className="btn-primary" style={{ fontSize: '0.78rem', padding: '5px 12px' }} onClick={completeSimulation}>
              <Send size={14} /> Finalize Session
            </button>
          </div>
        )}
      </div>

      {/* Log Console */}
      {logs.length > 0 && (
        <div
          style={{
            background: 'rgba(7, 10, 15, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '14px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--accent-cyan)',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
        >
          {logs.map((log, idx) => (
            <div key={idx}>&gt; {log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
