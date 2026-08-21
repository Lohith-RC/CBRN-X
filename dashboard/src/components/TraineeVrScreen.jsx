import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, AlertTriangle, CheckCircle, Crosshair, Radio, Move, Zap, Play, RotateCcw } from 'lucide-react';

export default function TraineeVrScreen({ onSessionComplete }) {
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hudMessage, setHudMessage] = useState('DON PPE BEFORE ENTERING HAZARD ZONE');
  const [ppmReading, setPpmReading] = useState(0);
  const [ppeState, setPpeState] = useState({ mask: false, suit: false, gloves: false });
  const [sessionId, setSessionId] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [stage, setStage] = useState(1);
  const [leakingDrumFound, setLeakingDrumFound] = useState(false);
  const [civiliansEvacuated, setCiviliansEvacuated] = useState(0);
  const [contained, setContained] = useState(false);
  const [deconComplete, setDeconComplete] = useState(false);

  // References for Three.js state
  const stateRef = useRef({
    hasPpe: false,
    inHazardZone: false,
    leakingDrumId: 3,
    sessionId: null
  });

  // Start new backend session
  const startSession = async () => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: 'Inspector Lohith R C',
          batchUnit: '10th NDRF Battalion',
          scenarioCode: 'CBRN-CHEM-01'
        })
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      stateRef.current.sessionId = data.sessionId;
      setTelemetryLogs([`Session started: ${data.sessionId}`]);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Backend offline, running local VR simulation.');
      setSessionId('sess-demo-vr');
      stateRef.current.sessionId = 'sess-demo-vr';
      setIsPlaying(true);
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

  const equipPpeItem = (item) => {
    setPpeState(prev => {
      const updated = { ...prev, [item]: true };
      const allDone = updated.mask && updated.suit && updated.gloves;
      if (allDone) {
        stateRef.current.hasPpe = true;
        setHudMessage('PPE DONNED. PROCEED TO HAZARD ZONE WITH DETECTOR');
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
      setHudMessage('LEAK SOURCE CONFIRMED: DRUM #3 (CHLORINE GAS). ESCORT CIVILIANS.');
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
        setHudMessage('ALL CIVILIANS ESCORTED TO SAFE ZONE. APPLY CONTAINMENT SEALANT.');
      }
    }
  };

  const applyContainment = () => {
    if (!leakingDrumFound) {
      setHudMessage('CONFIRM LEAK DRUM BEFORE CONTAINMENT');
      return;
    }
    setContained(true);
    setHudMessage('HAZARD SEALED! PROCEED TO DECONTAMINATION SHOWER.');
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
    if (onSessionComplete) onSessionComplete();
  };

  // 3D Scene Initialization
  useEffect(() => {
    if (!mountRef.current || !isPlaying) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);
    scene.fog = new THREE.FogExp2(0x0b0f17, 0.035);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.7, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf58220, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const warningLight = new THREE.PointLight(0xff0000, 2, 15);
    warningLight.position.set(0, 4, 0);
    scene.add(warningLight);

    // Floor / Ground Grid
    const grid = new THREE.GridHelper(40, 40, 0xf58220, 0x1e293b);
    scene.add(grid);

    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Chemical Drums (1 Leaking with gas particles)
    const drumGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16);
    const drums = [];
    const drumPositions = [
      { x: -3, z: -2 },
      { x: 3, z: -2 },
      { x: 0, z: -4 }, // Leaking Drum #3
      { x: 4, z: -5 }
    ];

    drumPositions.forEach((pos, idx) => {
      const isLeak = idx === 2;
      const mat = new THREE.MeshStandardMaterial({
        color: isLeak ? 0xeab308 : 0x475569,
        metalness: 0.6,
        roughness: 0.3
      });
      const drum = new THREE.Mesh(drumGeo, mat);
      drum.position.set(pos.x, 0.6, pos.z);
      drum.castShadow = true;
      scene.add(drum);
      drums.push(drum);
    });

    // Yellow Toxic Gas Particles near Drum #3
    const particleCount = 150;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 3;
      positions[i + 1] = Math.random() * 2;
      positions[i + 2] = -4 + (Math.random() - 0.5) * 3;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0xef4444,
      size: 0.25,
      transparent: true,
      opacity: 0.6
    });
    const gasCloud = new THREE.Points(particlesGeo, particlesMat);
    scene.add(gasCloud);

    // Decon Archway
    const archGeo = new THREE.BoxGeometry(0.3, 3, 0.3);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.5 });
    const pillar1 = new THREE.Mesh(archGeo, archMat);
    pillar1.position.set(-6, 1.5, 3);
    const pillar2 = new THREE.Mesh(archGeo, archMat);
    pillar2.position.set(-4, 1.5, 3);
    scene.add(pillar1);
    scene.add(pillar2);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Animate gas cloud rotation
      gasCloud.rotation.y += 0.005;

      // Update gas detector reading based on camera proximity to Drum #3 (0, 0.6, -4)
      const dist = camera.position.distanceTo(drums[2].position);
      const ppm = Math.max(0, Math.round(500 - dist * 80));
      setPpmReading(ppm);

      // Check Hazard Zone Entry without PPE
      if (dist < 4 && !stateRef.current.hasPpe && !stateRef.current.inHazardZone) {
        stateRef.current.inHazardZone = true;
        setHudMessage('⚠️ WARNING: ENTERED HAZARD ZONE WITHOUT PPE (-15 PENALTY)!');
        logEvent('entered_hazard_zone_without_ppe', '{"warning":"Entered hazard zone without PPE"}');
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [isPlaying]);

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
              Trainee VR First-Person Screen (Localhost Port 3000 View)
            </h2>
            <span className="badge badge-pending">
              <Radio size={12} className="animate-pulse" /> 3D WebGL VR Simulator
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Interactive First-Person Responder view rendering in browser, streaming live events to Spring Boot Backend
          </p>
        </div>

        {!isPlaying ? (
          <button className="btn-primary" onClick={startSession}>
            <Play size={16} /> Launch Trainee VR Screen
          </button>
        ) : (
          <button className="btn-secondary" style={{ color: 'var(--accent-green)', borderColor: 'var(--accent-green)' }} onClick={finishMission}>
            <CheckCircle size={16} /> Finish Mission & Generate Report
          </button>
        )}
      </div>

      {!isPlaying ? (
        <div style={{
          height: '420px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          color: 'var(--text-secondary)'
        }}>
          <Shield size={48} color="var(--accent-ndrf-orange)" />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '4px' }}>Trainee First-Person VR View Offline</h3>
            <p style={{ fontSize: '0.85rem' }}>Click "Launch Trainee VR Screen" to open the 3D first-person simulation on localhost:3000</p>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '480px', borderRadius: '12px', overflow: 'hidden' }}>
          {/* 3D WebGL Canvas View */}
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

          {/* VR HUD Overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            border: '2px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '12px',
            boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px'
          }}>
            {/* Top HUD Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{
                background: 'rgba(11, 15, 23, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(245, 130, 32, 0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'var(--accent-ndrf-orange)',
                fontSize: '0.82rem',
                fontWeight: '700',
                letterSpacing: '0.05em'
              }}>
                🎯 OBJECTIVE: {hudMessage}
              </div>

              {/* PID Gas Detector Reading */}
              <div style={{
                background: 'rgba(11, 15, 23, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0, 242, 254, 0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: ppmReading > 250 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: '700'
              }}>
                📟 PID GAS DETECTOR: {ppmReading} PPM
              </div>
            </div>

            {/* Reticle Crosshair */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255, 255, 255, 0.6)' }}>
              <Crosshair size={28} />
            </div>

            {/* Bottom HUD Controls & Donning Station */}
            <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              {/* PPE Donning Controls */}
              <div style={{
                background: 'rgba(11, 15, 23, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>PPE LOCKER:</span>
                <button
                  onClick={() => equipPpeItem('mask')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    background: ppeState.mask ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                >
                  {ppeState.mask ? '✅ Mask' : '😷 Equip Mask'}
                </button>
                <button
                  onClick={() => equipPpeItem('suit')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    background: ppeState.suit ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                >
                  {ppeState.suit ? '✅ Suit' : '🥼 Equip Suit'}
                </button>
                <button
                  onClick={() => equipPpeItem('gloves')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    border: 'none',
                    cursor: 'pointer',
                    background: ppeState.gloves ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                    color: '#fff'
                  }}
                >
                  {ppeState.gloves ? '✅ Gloves' : '🧤 Equip Gloves'}
                </button>
              </div>

              {/* Mission Actions */}
              <div style={{
                background: 'rgba(11, 15, 23, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleDrumClick(3)}>
                  🔍 Scan Drum #3 (Leaking)
                </button>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => handleDrumClick(1)}>
                  ❌ Scan Drum #1 (Wrong)
                </button>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={evacuateCivilian}>
                  🏃 Evacuate Civilian ({civiliansEvacuated}/2)
                </button>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={applyContainment}>
                  🛠️ Apply Sealant
                </button>
                <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={passDecon}>
                  🚿 Pass Decon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Telemetry Stream Footer */}
      {telemetryLogs.length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
          📡 Live Telemetry Event Stream: {telemetryLogs[0]}
        </div>
      )}
    </div>
  );
}
