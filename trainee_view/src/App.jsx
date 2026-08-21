import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, AlertTriangle, CheckCircle, Crosshair, Radio, Play, RotateCcw, Send, Activity, Eye, Compass, Flame, Volume2, Cpu } from 'lucide-react';

export default function App() {
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hudMessage, setHudMessage] = useState('DON COMPLETE PPE BEFORE ENTERING STORAGE BAY 03');
  const [ppmReading, setPpmReading] = useState(12.4);
  const [ppeState, setPpeState] = useState({ mask: false, suit: false, gloves: false });
  const [sessionId, setSessionId] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [leakingDrumFound, setLeakingDrumFound] = useState(false);
  const [civiliansEvacuated, setCiviliansEvacuated] = useState(0);
  const [contained, setContained] = useState(false);
  const [deconComplete, setDeconComplete] = useState(false);
  const [compassHeading, setCompassHeading] = useState(150);

  // Position and Movement Reference for WASD controls
  const posRef = useRef({ x: 0, z: 8, rotY: 0 });

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
    } catch (err) {
      const demoId = 'sess-bodycam-5000';
      setSessionId(demoId);
      stateRef.current.sessionId = demoId;
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

  // Keyboard Listeners (WASD + Action Keys E, F, R, Space)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying) return;
      const step = 0.4;
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          posRef.current.z -= step * Math.cos(posRef.current.rotY);
          posRef.current.x -= step * Math.sin(posRef.current.rotY);
          break;
        case 's':
        case 'arrowdown':
          posRef.current.z += step * Math.cos(posRef.current.rotY);
          posRef.current.x += step * Math.sin(posRef.current.rotY);
          break;
        case 'a':
        case 'arrowleft':
          posRef.current.rotY += 0.08;
          setCompassHeading(h => (h - 5 + 360) % 360);
          break;
        case 'd':
        case 'arrowright':
          posRef.current.rotY -= 0.08;
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

  // 3D Three.js Handheld Bodycam Scene Setup
  useEffect(() => {
    if (!mountRef.current || !isPlaying) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05080c);
    scene.fog = new THREE.FogExp2(0x05080c, 0.035);

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.set(posRef.current.x, 1.7, posRef.current.z);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Industrial Lights (Orange Fire Flicker & Red Emergency Flasher)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const fireLight = new THREE.PointLight(0xf58220, 3, 20);
    fireLight.position.set(0, 2, -4);
    scene.add(fireLight);

    const redWarningLight = new THREE.PointLight(0xef4444, 2.5, 12);
    redWarningLight.position.set(-5, 3, 0);
    scene.add(redWarningLight);

    // Concrete Asphalt Floor with Puddle Reflections
    const grid = new THREE.GridHelper(50, 50, 0xf58220, 0x1e293b);
    scene.add(grid);

    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // STORAGE BAY 03 Industrial Building Structure
    const wallGeo = new THREE.BoxGeometry(14, 6, 0.5);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 3, -8);
    scene.add(backWall);

    // PPE Donning Table (Steel workbench)
    const tableGeo = new THREE.BoxGeometry(2.5, 0.9, 1.2);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(4, 0.45, 4);
    scene.add(table);

    // Forklift on Fire inside BAY 03
    const forkliftGeo = new THREE.BoxGeometry(2, 2.2, 3);
    const forkliftMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.5 });
    const forklift = new THREE.Mesh(forkliftGeo, forkliftMat);
    forklift.position.set(0, 1.1, -4);
    scene.add(forklift);

    // 4 Chemical Storage Drums (Drum #3 Leaking)
    const drumGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.2, 16);
    const drums = [];
    const drumPositions = [
      { x: -3, z: -2 },
      { x: 3, z: -2 },
      { x: -1, z: -5 }, // Leaking Drum #3
      { x: 4, z: -4 }
    ];

    drumPositions.forEach((pos, idx) => {
      const isLeak = idx === 2;
      const mat = new THREE.MeshStandardMaterial({
        color: isLeak ? 0xd97706 : 0x475569,
        metalness: 0.7,
        roughness: 0.3
      });
      const drum = new THREE.Mesh(drumGeo, mat);
      drum.position.set(pos.x, 0.6, pos.z);
      scene.add(drum);
      drums.push(drum);
    });

    // Yellow Toxic Gas Particles (Chlorine Agent Leak)
    const particleCount = 250;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = -1 + (Math.random() - 0.5) * 3.5;
      particlePositions[i + 1] = Math.random() * 2.5;
      particlePositions[i + 2] = -5 + (Math.random() - 0.5) * 3.5;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0xef4444,
      size: 0.25,
      transparent: true,
      opacity: 0.65
    });
    const gasCloud = new THREE.Points(particlesGeo, particlesMat);
    scene.add(gasCloud);

    // Control Terminal with Sparking Screen (3D Object)
    const termGeo = new THREE.BoxGeometry(1.2, 1.8, 0.8);
    const termMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
    const terminal = new THREE.Mesh(termGeo, termMat);
    terminal.position.set(-6, 0.9, 2);
    scene.add(terminal);

    // Animation Loop (Handheld Camera Shake + Dynamic PPM Calculation)
    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Fire flicker effect
      fireLight.intensity = 2.5 + Math.sin(time * 12) * 0.8;
      gasCloud.rotation.y += 0.003;

      // Update Camera Position & Rotation from WASD Controls
      camera.position.x = posRef.current.x;
      camera.position.z = posRef.current.z;
      camera.rotation.y = posRef.current.rotY;

      // Handheld mobile camera bobbing motion
      camera.position.y = 1.7 + Math.sin(time * 6) * 0.03;

      // Calculate PID Gas Detector distance reading to Leaking Drum #3 (-1, 0.6, -5)
      const dist = camera.position.distanceTo(drums[2].position);
      const ppm = Math.max(12.4, Math.round(480 - dist * 70));
      setPpmReading(ppm);

      // Hazard Zone Boundary Check without PPE
      if (dist < 4.5 && !stateRef.current.hasPpe && !stateRef.current.inHazardZone) {
        stateRef.current.inHazardZone = true;
        setHudMessage('⚠️ WARNING: ENTERED HAZARD ZONE WITHOUT PPE (-15 PENALTY)');
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
                <Radio size={12} className="warning-led" /> LIVE BODYCAM [PORT 5000]
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

      {/* Main 3D VR Simulation Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {!isPlaying ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-secondary)', zIndex: 20 }}>
            <Flame size={56} color="var(--accent-ndrf-orange)" className="handheld-motion" />
            <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '800' }}>Trainee First-Person VR Viewport (Port 5000)</h2>
            <p style={{ maxWidth: '540px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Extracted High-Fidelity Handheld Video Aesthetic & VR Simulation Interface. Incorporates WASD/Cursor controls, chemical gas cloud particle effects, PID detector scanning, and live REST telemetry streaming to Port 8080.
            </p>
            <button className="btn-tactical" style={{ padding: '12px 28px', fontSize: '0.9rem' }} onClick={startSession}>
              <Play size={16} /> INITIATE DEPLOYMENT
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* 3D WebGL Canvas View */}
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

            {/* Handheld Visor & CBRN Mask Visor Frame Overlay */}
            {ppeState.mask && (
              <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                border: '30px solid rgba(15, 23, 42, 0.85)',
                borderRadius: '120px',
                boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.9)',
                zIndex: 15
              }} />
            )}

            {/* VR HUD Overlay */}
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
              {/* Top Objective & Compass Heading Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ background: 'rgba(7, 10, 15, 0.9)', border: '1px solid rgba(245, 130, 32, 0.5)', padding: '10px 18px', borderRadius: '8px', color: 'var(--accent-ndrf-orange)', fontWeight: '700', fontSize: '0.85rem' }}>
                  🎯 OBJECTIVE: {hudMessage}
                </div>

                {/* Compass Heading Indicator */}
                <div style={{ background: 'rgba(7, 10, 15, 0.9)', border: '1px solid var(--border-subtle)', padding: '6px 16px', borderRadius: '8px', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={16} color="var(--accent-cyan)" />
                  HEADING: N {compassHeading}°
                </div>

                {/* PID Gas Detector Reading Widget (Extracted from MP4 #9) */}
                <div style={{ background: 'rgba(7, 10, 15, 0.9)', border: '1px solid rgba(0, 242, 254, 0.5)', padding: '10px 18px', borderRadius: '8px', color: ppmReading > 200 ? 'var(--accent-red)' : 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.9rem' }}>
                  📟 PID DETECTOR: {ppmReading} PPM
                </div>
              </div>

              {/* Reticle Crosshair with Target Hotspot Marker */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(0, 242, 254, 0.8)' }}>
                <Crosshair size={32} />
              </div>

              {/* Bottom Interactive HUD (Keyboard Commands + Cursor Buttons) */}
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

                {/* Keyboard Control Instructions */}
                <div className="glass-hud" style={{ padding: '8px 14px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  🎮 CONTROLS: <strong>WASD / ARROWS</strong> = Move | <strong>E</strong> = PPE | <strong>F</strong> = Sealant | <strong>R</strong> = Evacuate | <strong>SPACE</strong> = Decon
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
