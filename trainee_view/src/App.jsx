import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, AlertTriangle, CheckCircle, Crosshair, Radio, Play, RotateCcw, Send, Activity, Eye } from 'lucide-react';

export default function App() {
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hudMessage, setHudMessage] = useState('DON COMPLETE PPE BEFORE STEPPING INTO HAZARD PERIMETER');
  const [ppmReading, setPpmReading] = useState(0);
  const [ppeState, setPpeState] = useState({ mask: false, suit: false, gloves: false });
  const [sessionId, setSessionId] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [leakingDrumFound, setLeakingDrumFound] = useState(false);
  const [civiliansEvacuated, setCiviliansEvacuated] = useState(0);
  const [contained, setContained] = useState(false);
  const [deconComplete, setDeconComplete] = useState(false);
  const [traineeName, setTraineeName] = useState('NDRF Constable Vikram');
  const [batchUnit, setBatchUnit] = useState('10th NDRF Battalion');

  const stateRef = useRef({
    hasPpe: false,
    inHazardZone: false,
    sessionId: null
  });

  const startSession = async () => {
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
      setSessionId(data.sessionId);
      stateRef.current.sessionId = data.sessionId;
      setTelemetryLogs([`Session initialized: ${data.sessionId} [Port 5000 -> Port 8080]`]);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Backend API on Port 8080 unreachable, using offline fallback simulation.');
      const demoId = 'sess-sim-5000';
      setSessionId(demoId);
      stateRef.current.sessionId = demoId;
      setIsPlaying(true);
    }
  };

  const logEvent = async (eventType, eventData = '{}') => {
    const currentSess = stateRef.current.sessionId || sessionId;
    setTelemetryLogs(prev => [`[${new Date().toLocaleTimeString()}] HTTP POST /api/events/log -> ${eventType}`, ...prev.slice(0, 5)]);
    if (!currentSess) return;
    try {
      await fetch('/api/events/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSess, eventType, eventData })
      });
    } catch (ignored) {}
  };

  const equipPpeItem = (item) => {
    setPpeState(prev => {
      const updated = { ...prev, [item]: true };
      const allDone = updated.mask && updated.suit && updated.gloves;
      if (allDone) {
        stateRef.current.hasPpe = true;
        setHudMessage('PPE DONNED. PROCEED TO STORAGE BAY 3 WITH PID GAS DETECTOR');
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
      setHudMessage('LEAK SOURCE CONFIRMED: DRUM #3 (CHLORINE GAS). ESCORT CIVILIANS TO SAFE ZONE');
      logEvent('leak_source_identified', '{"correct":true,"drumId":"DRUM-03"}');
    } else {
      setHudMessage(`INCORRECT DRUM SCAN: DRUM #${drumIndex} IS INTACT (-5 PENALTY)`);
      logEvent('leak_source_identified', `{"correct":false,"drumId":"DRUM-0${drumIndex}"}`);
    }
  };

  const evacuateCivilian = () => {
    if (civiliansEvacuated < 2) {
      const nextCount = civiliansEvacuated + 1;
      setCiviliansEvacuated(nextCount);
      logEvent('civilian_evacuated', `{"civilianId":"CIV-0${nextCount}"}`);
      if (nextCount === 2) {
        setHudMessage('ALL CIVILIANS ESCORTED TO SAFE ZONE. APPLY CONTAINMENT SEALANT KIT');
      }
    }
  };

  const applyContainment = () => {
    if (!leakingDrumFound) {
      setHudMessage('CONFIRM LEAK SOURCE BEFORE APPLYING CONTAINMENT');
      return;
    }
    setContained(true);
    setHudMessage('CHEMICAL LEAK CONTAINED! PROCEED TO DECONTAMINATION ARCHWAY');
    logEvent('containment_completed', '{"drumId":"DRUM-03"}');
  };

  const passDecon = () => {
    setDeconComplete(true);
    setHudMessage('DECONTAMINATION COMPLETE. MISSION ACCOMPLISHED!');
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
    alert('Mission completed! Telemetry sent to Backend (Port 8080) & visible on Admin Dashboard (Port 3000).');
  };

  // 3D Three.js VR Simulation View
  useEffect(() => {
    if (!mountRef.current || !isPlaying) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a0f);
    scene.fog = new THREE.FogExp2(0x070a0f, 0.03);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.7, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf58220, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Floor & Grid
    const grid = new THREE.GridHelper(40, 40, 0xf58220, 0x1e293b);
    scene.add(grid);

    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Chemical Storage Drums
    const drumGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16);
    const drums = [];
    const drumPositions = [{ x: -3, z: -2 }, { x: 3, z: -2 }, { x: 0, z: -4 }, { x: 4, z: -5 }];

    drumPositions.forEach((pos, idx) => {
      const isLeak = idx === 2;
      const mat = new THREE.MeshStandardMaterial({
        color: isLeak ? 0xeab308 : 0x475569,
        metalness: 0.6,
        roughness: 0.3
      });
      const drum = new THREE.Mesh(drumGeo, mat);
      drum.position.set(pos.x, 0.6, pos.z);
      scene.add(drum);
      drums.push(drum);
    });

    // Yellow Chlorine Gas Cloud Particles
    const particleCount = 200;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 3;
      positions[i + 1] = Math.random() * 2.5;
      positions[i + 2] = -4 + (Math.random() - 0.5) * 3;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({ color: 0xef4444, size: 0.2, transparent: true, opacity: 0.6 });
    const gasCloud = new THREE.Points(particlesGeo, particlesMat);
    scene.add(gasCloud);

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      gasCloud.rotation.y += 0.004;

      const dist = camera.position.distanceTo(drums[2].position);
      const ppm = Math.max(0, Math.round(500 - dist * 75));
      setPpmReading(ppm);

      if (dist < 4 && !stateRef.current.hasPpe && !stateRef.current.inHazardZone) {
        stateRef.current.inHazardZone = true;
        setHudMessage('⚠️ PROTOCOL VIOLATION: ENTERED HAZARD PERIMETER WITHOUT PPE (-15 DEDUCTION)');
        logEvent('entered_hazard_zone_without_ppe', '{"warning":"Entered without PPE"}');
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [isPlaying]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#070a0f' }}>
      {/* Top Navigation Header */}
      <header className="glass-hud" style={{ padding: '12px 24px', borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', background: 'rgba(245,130,32,0.2)', borderRadius: '8px', border: '1px solid rgba(245,130,32,0.4)', color: 'var(--accent-ndrf-orange)' }}>
            <Shield size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>
              CBRS-X Trainee VR Simulation Interface
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              PORT 5000 • CONNECTED TO BACKEND PORT 8080
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isPlaying ? (
            <button className="btn-hud" style={{ background: 'var(--accent-ndrf-orange)' }} onClick={startSession}>
              <Play size={16} /> Start Trainee VR Mission
            </button>
          ) : (
            <button className="btn-hud" style={{ background: 'var(--accent-green)' }} onClick={finishMission}>
              <CheckCircle size={16} /> Complete & Send Telemetry
            </button>
          )}
        </div>
      </header>

      {/* Main Content Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!isPlaying ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
            <Shield size={64} color="var(--accent-ndrf-orange)" />
            <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '700' }}>Trainee Simulation Viewport (Port 5000)</h2>
            <p style={{ maxWidth: '500px', textAlign: 'center', fontSize: '0.9rem' }}>
              Physical VR Hardware Simulation Interface. Simulates first-person controls, chemical gas leak detection, PPE donning, and civilian evacuation, streaming telemetry directly to Backend Port 8080.
            </p>
            <button className="btn-hud" style={{ background: 'var(--accent-ndrf-orange)', padding: '12px 24px', fontSize: '0.95rem' }} onClick={startSession}>
              <Play size={18} /> Launch Simulation
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

            {/* VR HUD Overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '2px solid rgba(0,242,254,0.3)', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.85)' }}>
              
              {/* Top Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ background: 'rgba(11, 15, 23, 0.9)', border: '1px solid rgba(245, 130, 32, 0.5)', padding: '10px 18px', borderRadius: '8px', color: 'var(--accent-ndrf-orange)', fontWeight: '700', fontSize: '0.85rem' }}>
                  🎯 OBJECTIVE: {hudMessage}
                </div>
                <div style={{ background: 'rgba(11, 15, 23, 0.9)', border: '1px solid rgba(0, 242, 254, 0.5)', padding: '10px 18px', borderRadius: '8px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.88rem' }}>
                  📟 PID DETECTOR: {ppmReading} PPM
                </div>
              </div>

              {/* Crosshair */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255, 255, 255, 0.7)' }}>
                <Crosshair size={32} />
              </div>

              {/* Bottom Interactive HUD */}
              <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
                {/* PPE Donning Controls */}
                <div className="glass-hud" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>PPE LOCKER:</span>
                  <button className="btn-hud" style={{ background: ppeState.mask ? 'var(--accent-green)' : '' }} onClick={() => equipPpeItem('mask')}>
                    {ppeState.mask ? '✅ Mask' : '😷 Don Mask'}
                  </button>
                  <button className="btn-hud" style={{ background: ppeState.suit ? 'var(--accent-green)' : '' }} onClick={() => equipPpeItem('suit')}>
                    {ppeState.suit ? '✅ Suit' : '🥼 Don Suit'}
                  </button>
                  <button className="btn-hud" style={{ background: ppeState.gloves ? 'var(--accent-green)' : '' }} onClick={() => equipPpeItem('gloves')}>
                    {ppeState.gloves ? '✅ Gloves' : '🧤 Don Gloves'}
                  </button>
                </div>

                {/* Tactical Actions */}
                <div className="glass-hud" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button className="btn-hud" onClick={() => handleDrumClick(3)}>🔍 Scan Drum #3 (Leaking)</button>
                  <button className="btn-hud" onClick={() => handleDrumClick(1)}>❌ Scan Drum #1 (Wrong)</button>
                  <button className="btn-hud" onClick={evacuateCivilian}>🏃 Evacuate Civilian ({civiliansEvacuated}/2)</button>
                  <button className="btn-hud" onClick={applyContainment}>🛠️ Apply Sealant</button>
                  <button className="btn-hud" onClick={passDecon}>Shower Decon</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Telemetry Stream Footer */}
      <footer style={{ padding: '8px 24px', background: '#0b0f17', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>📡 LIVE HTTP TELEMETRY STREAM (PORT 5000 ➔ PORT 8080): {telemetryLogs[0] || 'Idle'}</div>
        <div>ADMIN VIEW AVAILABLE ON PORT 3000</div>
      </footer>
    </div>
  );
}
