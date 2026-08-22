import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Shield, AlertTriangle, CheckCircle, Crosshair, Radio, Play, MousePointer2 } from 'lucide-react';

const LEAKING_DRUM_INDEX = 2;
const HAZARD_ZONE_RADIUS = 4;
const PPM_UPDATE_DELTA = 5;

export default function TraineeVrScreen({ onSessionComplete }) {
  const mountRef = useRef(null);
  const controlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [hudMessage, setHudMessage] = useState('DON PPE BEFORE ENTERING HAZARD ZONE');
  const [ppmReading, setPpmReading] = useState(0);
  const [ppeState, setPpeState] = useState({ mask: false, suit: false, gloves: false });
  const [sessionId, setSessionId] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [leakingDrumFound, setLeakingDrumFound] = useState(false);
  const [civiliansEvacuated, setCiviliansEvacuated] = useState(0);
  const [contained, setContained] = useState(false);
  const [deconComplete, setDeconComplete] = useState(false);

  const hasPpeRef = useRef(false);
  const hazardWarnedRef = useRef(false);

  const resetMissionState = useCallback(() => {
    setPpeState({ mask: false, suit: false, gloves: false });
    setPpmReading(0);
    setHudMessage('DON PPE BEFORE ENTERING HAZARD ZONE');
    setLeakingDrumFound(false);
    setCiviliansEvacuated(0);
    setContained(false);
    setDeconComplete(false);
    setTelemetryLogs([]);
    hasPpeRef.current = false;
    hazardWarnedRef.current = false;
  }, []);

  const startSession = async () => {
    resetMissionState();
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
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setSessionId(data.sessionId);
      setTelemetryLogs([`Session started: ${data.sessionId}`]);
      setIsPlaying(true);
    } catch (err) {
      console.warn('Backend offline, running local VR simulation.');
      setSessionId(null);
      setIsPlaying(true);
    }
  };

  const logEvent = useCallback(async (eventType, eventData = '{}') => {
    setTelemetryLogs(prev => [`[${new Date().toLocaleTimeString()}] ${eventType}`, ...prev.slice(0, 4)]);
    if (!sessionId) return;
    try {
      await fetch('/api/events/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, eventType, eventData })
      });
    } catch (ignored) {}
  }, [sessionId]);

  const equipPpeItem = useCallback((item) => {
    if (ppeState[item]) return;
    const updated = { ...ppeState, [item]: true };
    const allDone = updated.mask && updated.suit && updated.gloves;
    setPpeState(updated);
    if (allDone) {
      hasPpeRef.current = true;
      setHudMessage('PPE DONNED. PROCEED TO HAZARD ZONE WITH DETECTOR');
      logEvent('ppe_donning_completed', '{"status":"complete"}');
    } else {
      logEvent('ppe_item_equipped', JSON.stringify({ item }));
    }
  }, [ppeState, logEvent]);

  const handleDrumClick = useCallback((drumIndex) => {
    if (!hasPpeRef.current && !hazardWarnedRef.current) {
      setHudMessage('SCAN REJECTED: DON FULL PPE FIRST');
      return;
    }
    if (drumIndex === LEAKING_DRUM_INDEX) {
      if (leakingDrumFound) return;
      setLeakingDrumFound(true);
      setHudMessage('LEAK SOURCE CONFIRMED: DRUM #3 (CHLORINE GAS). ESCORT CIVILIANS.');
      logEvent('leak_source_identified', '{"correct":true,"drumId":"DRUM-03"}');
    } else {
      setHudMessage(`INCORRECT SCAN: DRUM #${drumIndex + 1} IS INTACT (-5 PENALTY)`);
      logEvent('leak_source_identified', `{"correct":false,"drumId":"DRUM-0${drumIndex + 1}"}`);
    }
  }, [leakingDrumFound, logEvent]);

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
    if (controlsRef.current) {
      controlsRef.current.unlock();
    }
    if (sessionId) {
      try {
        await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' });
      } catch (ignored) {}
    }
    setIsPlaying(false);
    setIsLocked(false);
    if (onSessionComplete) onSessionComplete();
  };

  useEffect(() => {
    if (!isPlaying || !mountRef.current) return undefined;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);
    scene.fog = new THREE.FogExp2(0x0b0f17, 0.035);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1.7, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const disposables = [];
    const trackDispose = (obj) => { disposables.push(obj); return obj; };

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf58220, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const warningLight = new THREE.PointLight(0xff0000, 2, 15);
    warningLight.position.set(0, 4, 0);
    scene.add(warningLight);

    const grid = new THREE.GridHelper(40, 40, 0xf58220, 0x1e293b);
    scene.add(grid);

    const floorGeo = trackDispose(new THREE.PlaneGeometry(40, 40));
    const floorMat = trackDispose(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }));
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const drumGeo = trackDispose(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16));
    const drums = [];
    const drumPositions = [
      { x: -3, z: -2 },
      { x: 3, z: -2 },
      { x: 0, z: -4 },
      { x: 4, z: -5 }
    ];

    drumPositions.forEach((pos, idx) => {
      const isLeak = idx === LEAKING_DRUM_INDEX;
      const mat = trackDispose(new THREE.MeshStandardMaterial({
        color: isLeak ? 0xeab308 : 0x475569,
        metalness: 0.6,
        roughness: 0.3
      }));
      const drum = new THREE.Mesh(drumGeo, mat);
      drum.position.set(pos.x, 0.6, pos.z);
      drum.castShadow = true;
      drum.userData.drumIndex = idx;
      scene.add(drum);
      drums.push(drum);
    });

    const particleCount = 150;
    const particlesGeo = trackDispose(new THREE.BufferGeometry());
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 3;
      positions[i + 1] = Math.random() * 2;
      positions[i + 2] = -4 + (Math.random() - 0.5) * 3;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = trackDispose(new THREE.PointsMaterial({
      color: 0xef4444,
      size: 0.25,
      transparent: true,
      opacity: 0.6
    }));
    const gasCloud = new THREE.Points(particlesGeo, particlesMat);
    scene.add(gasCloud);

    const archGeo = trackDispose(new THREE.BoxGeometry(0.3, 3, 0.3));
    const archMat = trackDispose(new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.5 }));
    const pillar1 = new THREE.Mesh(archGeo, archMat);
    pillar1.position.set(-6, 1.5, 3);
    const pillar2 = new THREE.Mesh(archGeo, archMat);
    pillar2.position.set(-4, 1.5, 3);
    scene.add(pillar1);
    scene.add(pillar2);

    const controls = new PointerLockControls(camera, renderer.domElement);
    controlsRef.current = controls;
    const handleLockChange = () => setIsLocked(controls.isLocked);
    controls.addEventListener('lock', handleLockChange);
    controls.addEventListener('unlock', handleLockChange);

    const keys = { w: false, a: false, s: false, d: false };
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.w = true; break;
        case 'KeyA': case 'ArrowLeft': keys.a = true; break;
        case 'KeyS': case 'ArrowDown': keys.s = true; break;
        case 'KeyD': case 'ArrowRight': keys.d = true; break;
        default: break;
      }
    };
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.w = false; break;
        case 'KeyA': case 'ArrowLeft': keys.a = false; break;
        case 'KeyS': case 'ArrowDown': keys.s = false; break;
        case 'KeyD': case 'ArrowRight': keys.d = false; break;
        default: break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const raycaster = new THREE.Raycaster();
    const centerNdc = new THREE.Vector2(0, 0);
    const handleClick = () => {
      if (!controls.isLocked) {
        controls.lock();
        return;
      }
      raycaster.setFromCamera(centerNdc, camera);
      const hits = raycaster.intersectObjects(drums, false);
      if (hits.length > 0 && hits[0].distance < 6) {
        handleDrumClickRef.current(hits[0].object.userData.drumIndex);
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const velocity = new THREE.Vector3();
    let lastPpm = null;
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      gasCloud.rotation.y += 0.005;

      if (controls.isLocked) {
        const damping = Math.max(0, 1 - 8 * delta);
        velocity.x -= velocity.x * 8 * delta;
        velocity.z -= velocity.z * 8 * delta;
        const accel = 24 * delta;
        if (keys.w) velocity.z -= accel * 60 * delta;
        if (keys.s) velocity.z += accel * 60 * delta;
        if (keys.a) velocity.x -= accel * 60 * delta;
        if (keys.d) velocity.x += accel * 60 * delta;
        velocity.multiplyScalar(damping);

        controls.moveRight(velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -18, 18);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -16, 10);
        camera.position.y = 1.7;

        const dist = camera.position.distanceTo(drums[LEAKING_DRUM_INDEX].position);
        const ppm = THREE.MathUtils.clamp(Math.round(500 - dist * 80), 0, 500);
        if (lastPpm === null || Math.abs(ppm - lastPpm) >= PPM_UPDATE_DELTA || ppm === 0 !== (lastPpm === 0)) {
          lastPpm = ppm;
          setPpmReading(ppm);
        }

        if (dist < HAZARD_ZONE_RADIUS && !hasPpeRef.current && !hazardWarnedRef.current) {
          hazardWarnedRef.current = true;
          setHudMessage('⚠️ WARNING: ENTERED HAZARD ZONE WITHOUT PPE (-15 PENALTY)!');
          logEvent('entered_hazard_zone_without_ppe', '{"warning":"Entered hazard zone without PPE"}');
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.removeEventListener('lock', handleLockChange);
      controls.removeEventListener('unlock', handleLockChange);
      controls.disconnect();
      controlsRef.current = null;
      disposables.forEach(obj => obj.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isPlaying]);

  const handleDrumClickRef = useRef(handleDrumClick);
  handleDrumClickRef.current = handleDrumClick;

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
              Trainee VR First-Person Screen
            </h2>
            <span className="badge badge-pending">
              <Radio size={12} className="animate-pulse" /> 3D WebGL VR Simulator
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            WASD to move • Click scene to look around • Aim crosshair at drums to scan
          </p>
        </div>

        {!isPlaying ? (
          <button className="btn-primary" onClick={startSession}>
            <Play size={16} /> Launch Trainee VR Screen
          </button>
        ) : (
          <button className="btn-secondary" style={{ color: 'var(--accent-green)', borderColor: 'var(--accent-green)' }} onClick={finishMission}>
            <CheckCircle size={16} /> Finish Mission &amp; Generate Report
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
            <p style={{ fontSize: '0.85rem' }}>Click &quot;Launch Trainee VR Screen&quot; to begin the first-person simulation</p>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '480px', borderRadius: '12px', overflow: 'hidden' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

          {!isLocked && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 30,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '10px', background: 'rgba(5, 8, 12, 0.72)', cursor: 'pointer',
            }} onClick={() => controlsRef.current?.lock()}>
              <MousePointer2 size={32} color="var(--accent-cyan)" />
              <div style={{ color: '#fff', fontWeight: '700' }}>CLICK TO ENTER SIMULATION</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Mouse = look around · W/A/S/D = walk · Esc = release cursor
              </div>
            </div>
          )}

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div role="status" aria-live="polite" style={{
                background: 'rgba(11, 15, 23, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(245, 130, 32, 0.4)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'var(--accent-ndrf-orange)',
                fontSize: '0.82rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
                maxWidth: '70%'
              }}>
                🎯 OBJECTIVE: {hudMessage}
              </div>

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

            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255, 255, 255, 0.6)' }}>
              <Crosshair size={28} />
            </div>

            <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
                {[
                  ['mask', 'Mask'],
                  ['suit', 'Suit'],
                  ['gloves', 'Gloves'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => equipPpeItem(key)}
                    aria-pressed={ppeState[key]}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      background: ppeState[key] ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)',
                      color: '#fff'
                    }}
                  >
                    {ppeState[key] ? `✅ ${label}` : label}
                  </button>
                ))}
              </div>

              <div style={{
                background: 'rgba(11, 15, 23, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
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

      {telemetryLogs.length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
          📡 Live Telemetry Event Stream: {telemetryLogs[0]}
        </div>
      )}
    </div>
  );
}
