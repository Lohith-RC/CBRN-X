import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, AlertTriangle, CheckCircle, Crosshair, Radio, Play, RotateCcw, Send, Activity, Eye, Compass, Flame, Volume2, Cpu, Video, FastForward, SkipForward } from 'lucide-react';

// Video Playlist Mapping for Protocol Stages
const VIDEO_STAGES = {
  0: { src: '/videos/1.mp4', label: 'EXPLOSION CUTSCENE // BAY 03 ALARM', autoNext: false },
  1: { src: '/videos/2.mp4', label: 'STAGE 1: INITIAL ASSESSMENT & HAZARD PERIMETER', autoNext: false },
  2: { src: '/videos/5.mp4', label: 'STAGE 2: PPE DONNING — RESPIRATOR & GLOVES', autoNext: false },
  3: { src: '/videos/6.mp4', label: 'STAGE 2: PPE DONNING — HAZMAT SUIT ZIPPER', autoNext: false },
  4: { src: '/videos/7.mp4', label: 'STAGE 2: PPE COMPLETE // PROTOCOL LEVEL 2 AUTHORIZED', autoNext: false },
  5: { src: '/videos/8.mp4', label: 'STAGE 3: ENTRY TO BAY 03 & PID DETECTOR PICKUP', autoNext: false },
  6: { src: '/videos/9.mp4', label: 'STAGE 4: PID DETECTOR DRUM SCAN (CHLORINE AGENT)', autoNext: false },
  7: { src: '/videos/3.mp4', label: 'STAGE 5: CONTROL TERMINAL SENSOR (412.5 PPM)', autoNext: false }
};

export default function App() {
  const videoRef = useRef(null);
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [hudMessage, setHudMessage] = useState('PRESS [E] TO DON PPE MASK, SUIT, AND GLOVES');
  const [ppmReading, setPpmReading] = useState(12.4);
  const [ppeState, setPpeState] = useState({ mask: false, suit: false, gloves: false });
  const [sessionId, setSessionId] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [leakingDrumFound, setLeakingDrumFound] = useState(false);
  const [civiliansEvacuated, setCiviliansEvacuated] = useState(0);
  const [contained, setContained] = useState(false);
  const [deconComplete, setDeconComplete] = useState(false);
  const [compassHeading, setCompassHeading] = useState(150);

  const stateRef = useRef({
    hasPpe: false,
    inHazardZone: false,
    sessionId: null
  });

  // Start new backend session
  const startSession = async () => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: 'NDRF Inspector Lohith R C',
          batchUnit: '10th NDRF Battalion',
          scenarioCode: 'CBRN-CHEM-01'
        })
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      stateRef.current.sessionId = data.sessionId;
      setTelemetryLogs([`Session started: ${data.sessionId} [Port 5000 -> Port 8080]`]);
      setIsPlaying(true);
      setCurrentStageIdx(0);
    } catch (err) {
      const demoId = 'sess-video-5000';
      setSessionId(demoId);
      stateRef.current.sessionId = demoId;
      setIsPlaying(true);
      setCurrentStageIdx(0);
    }
  };

  const logEvent = async (eventType, eventData = '{}') => {
    const currentSess = stateRef.current.sessionId || sessionId;
    setTelemetryLogs(prev => [`[${new Date().toLocaleTimeString()}] ${eventType}`, ...prev.slice(0, 4)]);
    if (!currentSess) return;
    try {
      await fetch('/api/events/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSess, eventType, eventData })
      });
    } catch (ignored) {}
  };

  const advanceVideoStage = (targetIdx) => {
    const nextIdx = targetIdx !== undefined ? targetIdx : (currentStageIdx + 1) % Object.keys(VIDEO_STAGES).length;
    setCurrentStageIdx(nextIdx);
    if (videoRef.current) {
      videoRef.current.src = VIDEO_STAGES[nextIdx].src;
      videoRef.current.play().catch(() => {});
    }
  };

  const equipPpeItem = (item) => {
    setPpeState(prev => {
      const updated = { ...prev, [item]: true };
      const allDone = updated.mask && updated.suit && updated.gloves;

      if (item === 'mask') advanceVideoStage(2);
      else if (item === 'suit') advanceVideoStage(3);
      else if (item === 'gloves') advanceVideoStage(4);

      if (allDone) {
        stateRef.current.hasPpe = true;
        setHudMessage('PPE DONNING COMPLETE. PROTOCOL LEVEL 2 AUTHORIZED');
        logEvent('ppe_donning_completed', '{"status":"complete"}');
      } else {
        logEvent('ppe_item_equipped', `{"item":"${item}"}`);
      }
      return updated;
    });
  };

  const handleDrumClick = (drumIndex) => {
    if (drumIndex === 3) {
      setLeakingDrumFound(true);
      advanceVideoStage(6); // Play PID Detector Scan Video (9.mp4)
      setPpmReading(412.5);
      setHudMessage('LEAK SOURCE CONFIRMED: DRUM #3 (CHLORINE AGENT). PRESS [R] TO ESCORT CIVILIANS');
      logEvent('leak_source_identified', '{"correct":true,"drumId":"DRUM-03"}');
    } else {
      setHudMessage(`INCORRECT SCAN: DRUM #${drumIndex} IS INTACT (-5 PENALTY)`);
      logEvent('leak_source_identified', `{"correct":false,"drumId":"DRUM-0${drumIndex}"}`);
    }
  };

  const evacuateCivilian = () => {
    if (civiliansEvacuated < 2) {
      const nextCount = civiliansEvacuated + 1;
      setCiviliansEvacuated(nextCount);
      logEvent('civilian_evacuated', `{"civilianId":"CIV-0${nextCount}"}`);
      if (nextCount === 2) {
        setHudMessage('CIVILIANS ESCORTED TO SAFE ZONE. PRESS [F] TO APPLY CONTAINMENT SEALANT');
      }
    }
  };

  const applyContainment = () => {
    if (!leakingDrumFound) {
      setHudMessage('CONFIRM LEAK SOURCE BEFORE APPLYING CONTAINMENT');
      return;
    }
    setContained(true);
    setHudMessage('HAZARD SEALED! PRESS [SPACE] TO ENTER DECONTAMINATION ARCHWAY');
    logEvent('containment_completed', '{"drumId":"DRUM-03"}');
  };

  const passDecon = () => {
    setDeconComplete(true);
    setHudMessage('DECONTAMINATION SHOWER COMPLETE. MISSION ACCOMPLISHED!');
    logEvent('decontamination_completed', '{"archway":true}');
  };

  const finishMission = async () => {
    const currentSess = stateRef.current.sessionId || sessionId;
    if (currentSess) {
      try {
        await fetch(`/api/sessions/${currentSess}/complete`, { method: 'POST' });
      } catch (ignored) {}
    }
    setIsPlaying(false);
    alert('Mission Complete! Telemetry logged to Port 8080 and visible on Admin Dashboard (Port 3000).');
  };

  // Keyboard Command Handlers (WASD + E, F, R, Space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
        case 's':
        case 'arrowdown':
          advanceVideoStage(5); // Bay 03 Entry Video (8.mp4)
          break;
        case 'a':
        case 'arrowleft':
          setCompassHeading(h => (h - 5 + 360) % 360);
          break;
        case 'd':
        case 'arrowright':
          setCompassHeading(h => (h + 5) % 360);
          break;
        case 'e':
          if (!ppeState.mask) equipPpeItem('mask');
          else if (!ppeState.suit) equipPpeItem('suit');
          else if (!ppeState.gloves) equipPpeItem('gloves');
          break;
        case 'f':
          applyContainment();
          break;
        case 'r':
          evacuateCivilian();
          break;
        case ' ':
          passDecon();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, ppeState, civiliansEvacuated, leakingDrumFound]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#05080c', position: 'relative' }}>
      {/* Handheld Mobile Video / Bodycam Scanline Overlay */}
      <div className="bodycam-overlay" />

      {/* Top Header Watermark (Extracted from MP4 CCTV Header) */}
      <header style={{ padding: '10px 24px', background: 'rgba(7, 10, 15, 0.95)', borderBottom: '1px solid rgba(245, 130, 32, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Shield size={22} color="var(--accent-ndrf-orange)" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                CAM_BAY03_EXT // 21-AUG-2026 // 10:03:13 UTC
              </span>
              <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>
                <Radio size={12} className="warning-led" /> VIDEO CINEMATIC SIMULATOR [PORT 5000]
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              CBRS-X Trainee VR First-Person Simulation Interface (SIH260088)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
            ID VALIDATED: [cite: TRN-4089]
          </div>
          {!isPlaying ? (
            <button className="btn-tactical" onClick={startSession}>
              <Play size={14} /> INITIATE DEPLOYMENT
            </button>
          ) : (
            <button className="btn-tactical" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }} onClick={finishMission}>
              <CheckCircle size={14} /> COMPLETE MISSION
            </button>
          )}
        </div>
      </header>

      {/* Main Simulation Viewport (Synchronized Video Player + Canvas HUD) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!isPlaying ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-secondary)', zIndex: 20 }}>
            <Flame size={56} color="var(--accent-ndrf-orange)" className="handheld-motion" />
            <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800' }}>Trainee First-Person VR Viewport (Port 5000)</h2>
            <p style={{ maxWidth: '540px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Cinematic Video Asset Integration & VR Simulation Interface. Plays synchronized footage clips (`1.mp4` – `9.mp4`) based on user protocol actions, streaming live REST telemetry to Port 8080.
            </p>
            <button className="btn-tactical" style={{ padding: '12px 28px', fontSize: '0.9rem' }} onClick={startSession}>
              <Play size={16} /> INITIATE DEPLOYMENT
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            
            {/* HTML5 Video Player Background (Synchronized MP4 Video Assets) */}
            <video
              ref={videoRef}
              src={VIDEO_STAGES[currentStageIdx].src}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                inset: 0,
                zIndex: 1
              }}
            />

            {/* Visor Frame Overlay */}
            {ppeState.mask && (
              <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                border: '32px solid rgba(15, 23, 42, 0.85)',
                borderRadius: '120px',
                boxShadow: 'inset 0 0 70px rgba(0, 0, 0, 0.95)',
                zIndex: 15
              }} />
            )}

            {/* Interactive VR HUD Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              zIndex: 20
            }}>
              {/* Top Objective, Stage Banner & Compass Heading Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ background: 'rgba(7, 10, 15, 0.9)', border: '1px solid rgba(245, 130, 32, 0.5)', padding: '10px 18px', borderRadius: '8px', color: 'var(--accent-ndrf-orange)', fontWeight: '700', fontSize: '0.85rem' }}>
                  🎯 OBJECTIVE: {hudMessage}
                </div>

                {/* Video Scene Track Indicator */}
                <div style={{ background: 'rgba(7, 10, 15, 0.9)', border: '1px solid var(--accent-cyan)', padding: '6px 14px', borderRadius: '8px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Video size={14} /> {VIDEO_STAGES[currentStageIdx].label}
                </div>

                {/* PID Gas Detector Reading Widget */}
                <div style={{ background: 'rgba(7, 10, 15, 0.9)', border: '1px solid rgba(0, 242, 254, 0.5)', padding: '10px 18px', borderRadius: '8px', color: ppmReading > 200 ? 'var(--accent-red)' : 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.9rem' }}>
                  📟 PID DETECTOR: {ppmReading} PPM
                </div>
              </div>

              {/* Reticle Crosshair */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(0, 242, 254, 0.8)' }}>
                <Crosshair size={32} />
              </div>

              {/* Bottom Interactive Tactical Controls */}
              <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                
                {/* PPE Donning Controls */}
                <div className="glass-hud" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>[E] PPE LOCKER:</span>
                  <button className="btn-tactical" style={{ background: ppeState.mask ? 'rgba(16, 185, 129, 0.25)' : '' }} onClick={() => equipPpeItem('mask')}>
                    {ppeState.mask ? '✅ Mask' : '😷 Don Mask [E]'}
                  </button>
                  <button className="btn-tactical" style={{ background: ppeState.suit ? 'rgba(16, 185, 129, 0.25)' : '' }} onClick={() => equipPpeItem('suit')}>
                    {ppeState.suit ? '✅ Suit' : '🥼 Don Suit [E]'}
                  </button>
                  <button className="btn-tactical" style={{ background: ppeState.gloves ? 'rgba(16, 185, 129, 0.25)' : '' }} onClick={() => equipPpeItem('gloves')}>
                    {ppeState.gloves ? '✅ Gloves' : '🧤 Don Gloves [E]'}
                  </button>
                </div>

                {/* Scene Sequence Selectors */}
                <div className="glass-hud" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button className="btn-tactical" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => advanceVideoStage(0)}>🎬 Intro</button>
                  <button className="btn-tactical" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => advanceVideoStage(5)}>🏃 Entry</button>
                  <button className="btn-tactical" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => advanceVideoStage(6)}>📟 PID Scan</button>
                  <button className="btn-tactical" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => advanceVideoStage(7)}>💻 Console</button>
                </div>

                {/* Tactical Actions */}
                <div className="glass-hud" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="btn-tactical" onClick={() => handleDrumClick(3)}>🔍 Scan Drum #3 (Leaking)</button>
                  <button className="btn-tactical" onClick={() => handleDrumClick(1)}>❌ Scan Drum #1 (Wrong)</button>
                  <button className="btn-tactical" onClick={evacuateCivilian}>🏃 Evacuate Civilian ({civiliansEvacuated}/2) [R]</button>
                  <button className="btn-tactical" onClick={applyContainment}>🛠️ Apply Sealant [F]</button>
                  <button className="btn-tactical" onClick={passDecon}>Shower Decon [SPACE]</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Telemetry Footer Bar */}
      <footer style={{ padding: '8px 24px', background: '#05080c', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 }}>
        <div>📡 LIVE HTTP TELEMETRY STREAM (PORT 5000 ➔ PORT 8080): {telemetryLogs[0] || 'Idle'}</div>
        <div>ADMIN VIEW ON PORT 3000</div>
      </footer>
    </div>
  );
}
