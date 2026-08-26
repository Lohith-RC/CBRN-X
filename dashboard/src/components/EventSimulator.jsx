import React, { useState } from 'react';
import { Play, CheckCircle, AlertOctagon, Send, Radiation, Biohazard, ShieldAlert, Cpu } from 'lucide-react';

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
          batchUnit: 'NDRF Battalion',
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
          batchUnit: 'NDRF Battalion',
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
    padding: '6px 12px',
  };

  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '26px', animationDelay: '0.45s' }}>
      {/* Section Header */}
      <div className="section-header-tactical" style={{ flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 className="section-title-glow">
            <Cpu size={20} color="var(--accent-purple)" />
            Multi-Hazard Tactical Telemetry Simulator
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Simulate live event streams from VR / WebGL client into Spring Boot scoring and AI debrief engine
          </p>
        </div>

        {/* Scenario Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Scenario Parameters:
          </span>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            disabled={Boolean(activeSessionId) || isSimulating}
            style={{
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none',
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

      {/* Preset Fast Actions */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className="btn-glow" onClick={() => runFullPreset(true)} disabled={isSimulating}>
          <CheckCircle size={16} /> Simulate 100% Perfect Run
        </button>

        <button
          className="btn-tactical"
          style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
          onClick={() => runFullPreset(false)}
          disabled={isSimulating}
        >
          <AlertOctagon size={16} /> Simulate Flawed Mission Run
        </button>
      </div>

      {/* Step Controls Container */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          MANUAL STEP-BY-STEP TELEMETRY INJECTION
        </div>

        {!activeSessionId ? (
          <button className="btn-outline" onClick={startNewSession}>
            <Play size={14} color="#10b981" /> Start Step Session ({selectedScenario})
          </button>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button className="btn-outline" style={simBtnStyle} onClick={() => emitEvent('entered_hazard_zone_without_ppe')}>
              ⚠️ Enter Without PPE (-15)
            </button>
            <button className="btn-outline" style={simBtnStyle} onClick={() => emitEvent('ppe_donning_completed', '{"mask":true,"suit":true,"gloves":true}')}>
              🛡️ Don Full CBRN PPE (+10)
            </button>
            <button className="btn-outline" style={simBtnStyle} onClick={() => emitEvent('detector_equipped', '{"calibrated":true}')}>
              🔍 Equip Detector / Dosimeter
            </button>
            <button className="btn-outline" style={simBtnStyle} onClick={() => emitEvent('leak_source_identified', '{"correct":true}')}>
              🎯 Identify Source (+10)
            </button>
            <button className="btn-outline" style={simBtnStyle} onClick={() => emitEvent('leak_source_identified', '{"correct":false}')}>
              ❌ False Positive Scan (-5)
            </button>
            <button className="btn-outline" style={simBtnStyle} onClick={() => emitEvent('civilian_evacuated', '{"civilianId":"CIV-01"}')}>
              🏃 Evacuate Civilian (+15)
            </button>
            <button className="btn-outline" style={simBtnStyle} onClick={() => emitEvent('containment_completed')}>
              🛠️ Seal Hazard / Shield (+15)
            </button>
            <button className="btn-outline" style={simBtnStyle} onClick={() => emitEvent('decontamination_completed')}>
              🚿 Decon Shower (+10)
            </button>
            <button className="btn-glow" style={{ fontSize: '0.78rem', padding: '6px 14px' }} onClick={completeSimulation}>
              <Send size={14} /> Finalize Session
            </button>
          </div>
        )}
      </div>

      {/* Telemetry Console */}
      {logs.length > 0 && (
        <div
          style={{
            background: '#090d16',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            padding: '14px 18px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--accent-cyan)',
            maxHeight: '160px',
            overflowY: 'auto',
            boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)',
          }}
        >
          {logs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '4px' }}>
              &gt; {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
