import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Shield, AlertTriangle, CheckCircle, Crosshair, Radio, Play, MousePointer2 } from 'lucide-react';

const LEAKING_DRUM_INDEX = 2; // Drum #3
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
  const stateRef = useRef({
    hasPpe: false,
    inHazardZone: false,
    sessionId: null,
  });

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
    stateRef.current.hasPpe = false;
    stateRef.current.inHazardZone = false;
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
          scenarioCode: 'CBRN-CHEM-01',
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      setSessionId(data.sessionId);
      stateRef.current.sessionId = data.sessionId;
      setTelemetryLogs([`Session started: ${data.sessionId}`]);
      setIsPlaying(true);
    } catch {
      const localId = `sess-local-${Date.now().toString().slice(-4)}`;
      setSessionId(localId);
      stateRef.current.sessionId = localId;
      setTelemetryLogs([`Local simulation started: ${localId}`]);
      setIsPlaying(true);
    }
  };

  const logEvent = useCallback(
    async (eventType, eventData = '{}') => {
      const activeSess = stateRef.current.sessionId || sessionId;
      setTelemetryLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${eventType}`, ...prev.slice(0, 4)]);
      if (!activeSess || activeSess.startsWith('sess-local')) return;
      try {
        await fetch('/api/events/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: activeSess, eventType, eventData }),
        });
      } catch (ignored) {}
    },
    [sessionId]
  );

  const equipPpeItem = useCallback(
    (item) => {
      if (ppeState[item]) return;
      const updated = { ...ppeState, [item]: true };
      const allDone = updated.mask && updated.suit && updated.gloves;
      setPpeState(updated);
      if (allDone) {
        hasPpeRef.current = true;
        stateRef.current.hasPpe = true;
        setHudMessage('PPE DONNED. PROCEED TO HAZARD ZONE WITH PID DETECTOR');
        logEvent('ppe_donning_completed', '{"status":"complete"}');
      } else {
        logEvent('ppe_item_equipped', JSON.stringify({ item }));
      }
    },
    [ppeState, logEvent]
  );

  const handleDrumClick = useCallback(
    (drumIndex) => {
      if (!hasPpeRef.current && !hazardWarnedRef.current) {
        setHudMessage('SCAN REJECTED: DON FULL PPE BEFORE APPROACHING HAZARD');
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
    },
    [leakingDrumFound, logEvent]
  );

  const handleDrumClickRef = useRef(handleDrumClick);
  handleDrumClickRef.current = handleDrumClick;

  const evacuateCivilian = () => {
    if (civiliansEvacuated < 2) {
      const nextCount = civiliansEvacuated + 1;
      setCiviliansEvacuated(nextCount);
      logEvent('civilian_evacuated', `{"civilianId":"CIV-0${nextCount}"}`);
      if (nextCount === 2) {
        setHudMessage('ALL CIVILIANS ESCORTED TO SAFE ZONE. APPLY CONTAINMENT SEALANT.');
      } else {
        setHudMessage(`CIVILIAN #1 ESCORTED TO SAFE ZONE. 1 REMAINING.`);
      }
    }
  };

  const applyContainment = () => {
    if (!leakingDrumFound) {
      setHudMessage('CONFIRM LEAK SOURCE BEFORE APPLYING SEALANT');
      return;
    }
    setContained(true);
    setHudMessage('HAZARD SEALED! PROCEED TO DECONTAMINATION SHOWER.');
    logEvent('containment_completed', '{"drumId":"DRUM-03"}');
  };

  const passDecon = () => {
    setDeconComplete(true);
    setHudMessage('DECONTAMINATION COMPLETE. MISSION OBJECTIVES ACCOMPLISHED!');
    logEvent('decontamination_completed', '{"archway":true}');
  };

  const finishMission = async () => {
    if (controlsRef.current) {
      controlsRef.current.unlock();
    }
    const activeSess = stateRef.current.sessionId || sessionId;
    if (activeSess && !activeSess.startsWith('sess-local')) {
      try {
        await fetch(`/api/sessions/${activeSess}/complete`, { method: 'POST' });
      } catch (ignored) {}
    }
    setIsPlaying(false);
    setIsLocked(false);
    if (onSessionComplete) onSessionComplete();
  };

  // ── Three.js Scene Setup ──
  useEffect(() => {
    if (!isPlaying || !mountRef.current) return undefined;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);
    scene.fog = new THREE.FogExp2(0x0b0f17, 0.025);

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.set(0, 1.7, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    const disposables = [];
    const trackDispose = (obj) => {
      disposables.push(obj);
      return obj;
    };

    // ── Lighting ──
    const ambient = trackDispose(new THREE.AmbientLight(0xffffff, 0.4));
    scene.add(ambient);

    const dirLight = trackDispose(new THREE.DirectionalLight(0xf58220, 1.5));
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    const cyanFill = trackDispose(new THREE.DirectionalLight(0x00f2fe, 0.4));
    cyanFill.position.set(-8, 6, -5);
    scene.add(cyanFill);

    const warningLight = trackDispose(new THREE.PointLight(0xff0000, 2.5, 20));
    warningLight.position.set(0, 5, 0);
    scene.add(warningLight);

    const hazardGlow = trackDispose(new THREE.PointLight(0xf58220, 1.5, 12));
    hazardGlow.position.set(0, 3, -4);
    scene.add(hazardGlow);

    // ── Ground ──
    const grid = trackDispose(new THREE.GridHelper(50, 50, 0xf58220, 0x1e293b));
    scene.add(grid);

    const floorGeo = trackDispose(new THREE.PlaneGeometry(50, 50));
    const floorMat = trackDispose(
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.05 })
    );
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // ── High-Fidelity Chemical Drums ──
    const drums = [];
    const drumPositions = [
      { x: -3, z: -2 },
      { x: 3, z: -2 },
      { x: 0, z: -4 },
      { x: 4, z: -5 },
    ];

    drumPositions.forEach((pos, idx) => {
      const isLeak = idx === LEAKING_DRUM_INDEX;
      const group = new THREE.Group();

      // Drum body
      const bodyGeo = trackDispose(new THREE.CylinderGeometry(0.5, 0.5, 1.3, 24));
      const bodyMat = trackDispose(
        new THREE.MeshStandardMaterial({
          color: isLeak ? 0xd97706 : 0x475569,
          metalness: 0.75,
          roughness: 0.22,
        })
      );
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.position.y = 0.65;
      body.userData.drumIndex = idx;
      group.add(body);

      // Top cap
      const capGeo = trackDispose(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 24));
      const capMat = trackDispose(new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.15 }));
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 1.32;
      group.add(cap);

      // Hazard band
      const bandGeo = trackDispose(new THREE.CylinderGeometry(0.51, 0.51, 0.12, 24, 1, true));
      const bandMat = trackDispose(
        new THREE.MeshStandardMaterial({
          color: isLeak ? 0xef4444 : 0xf59e0b,
          emissive: isLeak ? 0xef4444 : 0x000000,
          emissiveIntensity: isLeak ? 2 : 0,
          side: THREE.DoubleSide,
        })
      );
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.9;
      group.add(band);

      // Leak glow sphere
      if (isLeak) {
        const glowGeo = trackDispose(new THREE.SphereGeometry(0.7, 16, 16));
        const glowMat = trackDispose(
          new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xef4444,
            emissiveIntensity: 3,
            transparent: true,
            opacity: 0.12,
          })
        );
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 0.6;
        glow.userData.isLeakGlow = true;
        group.add(glow);
      }

      group.position.set(pos.x, 0, pos.z);
      scene.add(group);
      drums.push(body); // For raycasting
    });

    // ── Volumetric Gas / Smoke Particles ──
    const particleCount = 180;
    const particlesGeo = trackDispose(new THREE.BufferGeometry());
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 2;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = -4 + Math.sin(angle) * r;

      colors[i * 3] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0;

      velocities.push({
        x: (Math.random() - 0.5) * 0.008,
        y: Math.random() * 0.015 + 0.005,
        z: (Math.random() - 0.5) * 0.008,
      });
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particlesMat = trackDispose(
      new THREE.PointsMaterial({
        size: 0.18,
        transparent: true,
        opacity: 0.65,
        vertexColors: true,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    const gasCloud = new THREE.Points(particlesGeo, particlesMat);
    scene.add(gasCloud);

    // ── Decon Archway ──
    const archGroup = new THREE.Group();
    const colGeo = trackDispose(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 12));
    const colMat = trackDispose(
      new THREE.MeshPhysicalMaterial({
        color: 0x00f2fe,
        emissive: 0x00f2fe,
        emissiveIntensity: 0.8,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.6,
        thickness: 0.5,
        transparent: true,
        opacity: 0.8,
      })
    );
    const col1 = new THREE.Mesh(colGeo, colMat);
    col1.position.set(-6, 1.75, 3);
    const col2 = new THREE.Mesh(colGeo, colMat);
    col2.position.set(-4, 1.75, 3);
    const beamGeo = trackDispose(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8));
    const beam = new THREE.Mesh(beamGeo, colMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(-5, 3.6, 3);
    archGroup.add(col1, col2, beam);
    scene.add(archGroup);

    // ── PointerLockControls & Movement ──
    const controls = new PointerLockControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const handleLockChange = () => setIsLocked(controls.isLocked);
    controls.addEventListener('lock', handleLockChange);
    controls.addEventListener('unlock', handleLockChange);

    const keys = { w: false, a: false, s: false, d: false };
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.w = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.a = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.s = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.d = true;
          break;
        default:
          break;
      }
    };
    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.w = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          keys.a = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          keys.s = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          keys.d = false;
          break;
        default:
          break;
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
      const t = performance.now() * 0.001;

      // Animate gas cloud
      const posAttr = gasCloud.geometry.getAttribute('position');
      for (let i = 0; i < particleCount; i++) {
        posAttr.array[i * 3] += velocities[i].x * 0.5;
        posAttr.array[i * 3 + 1] += velocities[i].y * 0.5;
        posAttr.array[i * 3 + 2] += velocities[i].z * 0.5;
        if (posAttr.array[i * 3 + 1] > 3.5) {
          posAttr.array[i * 3 + 1] = 0;
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 2;
          posAttr.array[i * 3] = Math.cos(a) * r;
          posAttr.array[i * 3 + 2] = -4 + Math.sin(a) * r;
        }
      }
      posAttr.needsUpdate = true;
      gasCloud.rotation.y += 0.003;

      // Pulse decon archway
      colMat.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.3;

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

        const leakPos = new THREE.Vector3(0, 0, -4);
        const dist = camera.position.distanceTo(leakPos);
        const ppm = THREE.MathUtils.clamp(Math.round(500 - dist * 80), 0, 500);

        if (lastPpm === null || Math.abs(ppm - lastPpm) >= PPM_UPDATE_DELTA || (ppm === 0) !== (lastPpm === 0)) {
          lastPpm = ppm;
          setPpmReading(ppm);
        }

        if (dist < HAZARD_ZONE_RADIUS && !hasPpeRef.current && !hazardWarnedRef.current) {
          hazardWarnedRef.current = true;
          stateRef.current.inHazardZone = true;
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
      disposables.forEach((obj) => obj.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isPlaying, logEvent]);

  const hudBox = {
    background: 'rgba(11, 15, 23, 0.85)',
    backdropFilter: 'blur(12px)',
    borderRadius: '10px',
    padding: '8px 16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  };

  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '24px', marginBottom: '28px', animationDelay: '0.15s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
              Trainee VR First-Person Screen
            </h2>
            <span className="badge badge-pending animate-pulse-glow">
              <Radio size={12} /> 3D WebGL VR Simulator
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            WASD to move • Click viewport to lock mouse look • Aim crosshair at drums to scan
          </p>
        </div>
        {!isPlaying ? (
          <button className="btn-primary" onClick={startSession}>
            <Play size={16} /> Launch Trainee VR Screen
          </button>
        ) : (
          <button
            className="btn-secondary"
            style={{ color: 'var(--accent-green)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
            onClick={finishMission}
          >
            <CheckCircle size={16} /> Finish Mission &amp; Generate Report
          </button>
        )}
      </div>

      {!isPlaying ? (
        <div
          style={{
            height: '420px',
            background: 'linear-gradient(145deg, rgba(0,0,0,0.5) 0%, rgba(11,15,23,0.8) 100%)',
            border: '1px dashed rgba(245, 130, 32, 0.2)',
            borderRadius: '14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            color: 'var(--text-secondary)',
          }}
        >
          <Shield size={52} color="var(--accent-ndrf-orange)" style={{ filter: 'drop-shadow(0 0 12px rgba(245,130,32,0.3))' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '4px' }}>Trainee First-Person VR View Standby</h3>
            <p style={{ fontSize: '0.85rem' }}>Click &quot;Launch Trainee VR Screen&quot; to begin the interactive 3D tactical simulation</p>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '480px', borderRadius: '14px', overflow: 'hidden' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

          {!isLocked && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 30,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: 'rgba(5, 8, 12, 0.72)',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => controlsRef.current?.lock()}
            >
              <MousePointer2 size={32} color="var(--accent-cyan)" />
              <div style={{ color: '#fff', fontWeight: '700' }}>CLICK TO ENTER FIRST-PERSON SIMULATION</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Mouse = look around · W/A/S/D = walk · Esc = release cursor
              </div>
            </div>
          )}

          {/* VR HUD Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              border: '2px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '14px',
              boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 242, 254, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
            }}
          >
            {/* Top HUD */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div
                role="status"
                aria-live="polite"
                style={{
                  ...hudBox,
                  color: 'var(--accent-ndrf-orange)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  letterSpacing: '0.04em',
                  border: '1px solid rgba(245, 130, 32, 0.4)',
                  maxWidth: '70%',
                }}
              >
                🎯 OBJECTIVE: {hudMessage}
              </div>
              <div
                style={{
                  ...hudBox,
                  color: ppmReading > 250 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  border: ppmReading > 250 ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(0,242,254,0.3)',
                }}
              >
                📟 PID GAS DETECTOR: {ppmReading} PPM
              </div>
            </div>

            {/* Crosshair */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(255, 255, 255, 0.6)',
                filter: 'drop-shadow(0 0 4px rgba(0,242,254,0.4))',
              }}
            >
              <Crosshair size={30} />
            </div>

            {/* Bottom Controls */}
            <div
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              {/* PPE Locker */}
              <div style={{ ...hudBox, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  PPE Locker:
                </span>
                {[
                  { key: 'mask', label: 'Mask', icon: '😷' },
                  { key: 'suit', label: 'Suit', icon: '🥼' },
                  { key: 'gloves', label: 'Gloves', icon: '🧤' },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => equipPpeItem(key)}
                    aria-pressed={ppeState[key]}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      border: 'none',
                      cursor: 'pointer',
                      background: ppeState[key] ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)',
                      color: ppeState[key] ? 'var(--accent-green)' : '#fff',
                      transition: 'all 0.2s ease',
                      fontWeight: '600',
                    }}
                  >
                    {ppeState[key] ? `✅ ${label}` : `${icon} Equip ${label}`}
                  </button>
                ))}
              </div>

              {/* Mission Actions */}
              <div style={{ ...hudBox, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                  onClick={() => handleDrumClick(2)}
                >
                  🔍 Scan Drum #3
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                  onClick={() => handleDrumClick(0)}
                >
                  ❌ Scan Drum #1
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                  onClick={evacuateCivilian}
                >
                  🏃 Evacuate ({civiliansEvacuated}/2)
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                  onClick={applyContainment}
                >
                  🛠️ Apply Sealant
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                  onClick={passDecon}
                >
                  🚿 Decon Archway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Footer */}
      {telemetryLogs.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            fontSize: '0.75rem',
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)',
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(0,242,254,0.1)',
          }}
        >
          📡 Live Telemetry: {telemetryLogs[0]}
        </div>
      )}
    </div>
  );
}
