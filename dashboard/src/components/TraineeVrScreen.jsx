import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Shield, AlertTriangle, CheckCircle, Crosshair, Radio, Play } from 'lucide-react';

export default function TraineeVrScreen({ onSessionComplete }) {
  const mountRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hudMessage, setHudMessage] = useState('DON PPE BEFORE ENTERING HAZARD ZONE');
  const [ppmReading, setPpmReading] = useState(0);
  const [ppeState, setPpeState] = useState({ mask: false, suit: false, gloves: false });
  const [sessionId, setSessionId] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [leakingDrumFound, setLeakingDrumFound] = useState(false);
  const [civiliansEvacuated, setCiviliansEvacuated] = useState(0);
  const [contained, setContained] = useState(false);
  const [deconComplete, setDeconComplete] = useState(false);

  const stateRef = useRef({
    hasPpe: false,
    inHazardZone: false,
    leakingDrumId: 3,
    sessionId: null,
  });

  const startSession = async () => {
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
      const data = await res.json();
      setSessionId(data.sessionId);
      stateRef.current.sessionId = data.sessionId;
      setTelemetryLogs([`Session started: ${data.sessionId}`]);
      setIsPlaying(true);
    } catch {
      setSessionId('sess-demo-vr');
      stateRef.current.sessionId = 'sess-demo-vr';
      setIsPlaying(true);
    }
  };

  const logEvent = async (eventType, eventData = '{}') => {
    const currentSess = stateRef.current.sessionId || sessionId;
    setTelemetryLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${eventType}`, ...prev.slice(0, 4)]);
    if (!currentSess) return;
    try {
      await fetch('/api/events/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSess, eventType, eventData }),
      });
    } catch {}
  };

  const equipPpeItem = (item) => {
    setPpeState((prev) => {
      const updated = { ...prev, [item]: true };
      if (updated.mask && updated.suit && updated.gloves) {
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
      try { await fetch(`/api/sessions/${currentSess}/complete`, { method: 'POST' }); } catch {}
    }
    setIsPlaying(false);
    if (onSessionComplete) onSessionComplete();
  };

  // ── Three.js Scene ──
  useEffect(() => {
    if (!mountRef.current || !isPlaying) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

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
    mountRef.current.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xf58220, 1.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    scene.add(dirLight);

    const cyanFill = new THREE.DirectionalLight(0x00f2fe, 0.4);
    cyanFill.position.set(-8, 6, -5);
    scene.add(cyanFill);

    const warningLight = new THREE.PointLight(0xff0000, 2.5, 20);
    warningLight.position.set(0, 5, 0);
    scene.add(warningLight);

    const hazardGlow = new THREE.PointLight(0xf58220, 1.5, 12);
    hazardGlow.position.set(0, 3, -4);
    scene.add(hazardGlow);

    // ── Ground ──
    const grid = new THREE.GridHelper(50, 50, 0xf58220, 0x1e293b);
    scene.add(grid);

    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85, metalness: 0.05 });
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
      const isLeak = idx === 2;
      const group = new THREE.Group();

      // Drum body
      const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.3, 24);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isLeak ? 0xd97706 : 0x475569,
        metalness: 0.75,
        roughness: 0.22,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.position.y = 0.65;
      group.add(body);

      // Top cap
      const capGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.06, 24);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.15 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 1.32;
      group.add(cap);

      // Hazard band
      const bandGeo = new THREE.CylinderGeometry(0.51, 0.51, 0.12, 24, 1, true);
      const bandMat = new THREE.MeshStandardMaterial({
        color: isLeak ? 0xef4444 : 0xf59e0b,
        emissive: isLeak ? 0xef4444 : 0x000000,
        emissiveIntensity: isLeak ? 2 : 0,
        side: THREE.DoubleSide,
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 0.9;
      group.add(band);

      // Base ring
      const ringGeo = new THREE.TorusGeometry(0.52, 0.03, 8, 24);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.1 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.02;
      group.add(ring);

      // Leak glow sphere
      if (isLeak) {
        const glowGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const glowMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xef4444,
          emissiveIntensity: 3,
          transparent: true,
          opacity: 0.1,
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 0.6;
        glow.userData.isLeakGlow = true;
        group.add(glow);
      }

      group.position.set(pos.x, 0, pos.z);
      scene.add(group);
      drums.push(group);
    });

    // ── Volumetric Gas / Smoke Particles ──
    const particleCount = 200;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 2;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * 3;
      positions[i * 3 + 2] = -4 + Math.sin(angle) * r;
      // Color: orange-red gradient
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
    const particlesMat = new THREE.PointsMaterial({
      size: 0.18,
      transparent: true,
      opacity: 0.65,
      vertexColors: true,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const gasCloud = new THREE.Points(particlesGeo, particlesMat);
    gasCloud.position.set(0, 0, -4);
    scene.add(gasCloud);

    // ── Secondary cyan gas near lab area ──
    const cyanCount = 60;
    const cyanGeo = new THREE.BufferGeometry();
    const cyanPos = new Float32Array(cyanCount * 3);
    for (let i = 0; i < cyanCount; i++) {
      cyanPos[i * 3] = -6 + (Math.random() - 0.5) * 2;
      cyanPos[i * 3 + 1] = Math.random() * 2;
      cyanPos[i * 3 + 2] = 2 + (Math.random() - 0.5) * 2;
    }
    cyanGeo.setAttribute('position', new THREE.BufferAttribute(cyanPos, 3));
    const cyanMat = new THREE.PointsMaterial({
      color: 0x00f2fe,
      size: 0.1,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const cyanGas = new THREE.Points(cyanGeo, cyanMat);
    scene.add(cyanGas);

    // ── Decon Archway (glass columns) ──
    const archGroup = new THREE.Group();
    const colGeo = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 12);
    const colMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f2fe,
      emissive: 0x00f2fe,
      emissiveIntensity: 0.8,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.6,
      thickness: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    const col1 = new THREE.Mesh(colGeo, colMat);
    col1.position.set(-6, 1.75, 3);
    col1.castShadow = true;
    const col2 = new THREE.Mesh(colGeo, colMat);
    col2.position.set(-4, 1.75, 3);
    col2.castShadow = true;
    // Top beam
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
    const beam = new THREE.Mesh(beamGeo, colMat);
    beam.rotation.z = Math.PI / 2;
    beam.position.set(-5, 3.6, 3);
    archGroup.add(col1, col2, beam);
    scene.add(archGroup);

    // ── Lab Flask Set (glass vessels with glowing liquid) ──
    const labGroup = new THREE.Group();
    const flaskPositions = [
      { x: -6, z: -1, color: 0x00f2fe },
      { x: -5, z: -1.5, color: 0x10b981 },
      { x: -7, z: -0.5, color: 0x8b5cf6 },
    ];
    flaskPositions.forEach((fp) => {
      const fGroup = new THREE.Group();
      // Flask body
      const flaskBodyGeo = new THREE.CylinderGeometry(0.25, 0.18, 0.7, 12, 1, true);
      const flaskBodyMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.02,
        transmission: 0.9,
        thickness: 0.4,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      const flaskBody = new THREE.Mesh(flaskBodyGeo, flaskBodyMat);
      flaskBody.position.y = 0.35;
      fGroup.add(flaskBody);
      // Liquid
      const liquidGeo = new THREE.CylinderGeometry(0.2, 0.14, 0.3, 12);
      const liquidMat = new THREE.MeshStandardMaterial({
        color: fp.color,
        emissive: fp.color,
        emissiveIntensity: 2.5,
        transparent: true,
        opacity: 0.85,
      });
      const liquid = new THREE.Mesh(liquidGeo, liquidMat);
      liquid.position.y = 0.2;
      fGroup.add(liquid);
      fGroup.position.set(fp.x, 0.3, fp.z);
      labGroup.add(fGroup);
    });
    scene.add(labGroup);

    // ── Glass response vehicle (simplified) ──
    const vehicleGroup = new THREE.Group();
    // Body
    const vBodyGeo = new THREE.BoxGeometry(3, 0.7, 1.5);
    const vBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a3a5c,
      metalness: 0.7,
      roughness: 0.15,
      transmission: 0.35,
      thickness: 1,
      ior: 1.5,
      transparent: true,
      opacity: 0.85,
    });
    const vBody = new THREE.Mesh(vBodyGeo, vBodyMat);
    vBody.position.y = 0.45;
    vBody.castShadow = true;
    vehicleGroup.add(vBody);
    // Cabin
    const vCabGeo = new THREE.BoxGeometry(1.6, 0.6, 1.4);
    const vCabMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.7,
      thickness: 0.6,
      transparent: true,
      opacity: 0.5,
    });
    const vCab = new THREE.Mesh(vCabGeo, vCabMat);
    vCab.position.set(0.2, 1.05, 0);
    vehicleGroup.add(vCab);
    // Headlights
    [[0.5, 0.7], [-0.5, 0.7]].forEach(([z]) => {
      const hlGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const hlMat = new THREE.MeshStandardMaterial({ color: 0xf58220, emissive: 0xf58220, emissiveIntensity: 4 });
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(1.52, 0.45, z);
      vehicleGroup.add(hl);
    });
    // Wheels
    [[-0.9, 0.8], [-0.9, -0.8], [0.9, 0.8], [0.9, -0.8]].forEach(([x, z]) => {
      const wGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.18, 14);
      const wMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.25, z);
      vehicleGroup.add(w);
    });
    // Light bar
    const lbGeo = new THREE.BoxGeometry(1, 0.05, 0.25);
    const lbMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 3 });
    const lb = new THREE.Mesh(lbGeo, lbMat);
    lb.position.set(0.2, 1.38, 0);
    vehicleGroup.add(lb);

    vehicleGroup.position.set(4, 0, 4);
    scene.add(vehicleGroup);

    // ── Animation Loop ──
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
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
          posAttr.array[i * 3 + 2] = Math.sin(a) * r;
        }
      }
      posAttr.needsUpdate = true;

      // Rotate gas cloud slowly
      gasCloud.rotation.y += 0.002;

      // Pulse leak glow
      drums[2]?.children.forEach((child) => {
        if (child.userData.isLeakGlow) {
          child.material.emissiveIntensity = 2 + Math.sin(t * 4) * 1;
          child.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
        }
      });

      // Animate decon archway columns
      [col1, col2].forEach((col) => {
        col.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.3;
      });

      // PPM reading
      const dist = camera.position.distanceTo(drums[2].position);
      const ppm = Math.max(0, Math.round(500 - dist * 80));
      setPpmReading(ppm);

      if (dist < 4 && !stateRef.current.hasPpe && !stateRef.current.inHazardZone) {
        stateRef.current.inHazardZone = true;
        setHudMessage('WARNING: ENTERED HAZARD ZONE WITHOUT PPE (-15 PENALTY)!');
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
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [isPlaying]);

  // ── HUD Styles ──
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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
            Interactive First-Person Responder view rendering in browser, streaming live events to Spring Boot Backend
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
            <CheckCircle size={16} /> Finish Mission
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
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '4px' }}>Trainee First-Person VR View Offline</h3>
            <p style={{ fontSize: '0.85rem' }}>Click "Launch Trainee VR Screen" to open the 3D first-person simulation</p>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '480px', borderRadius: '14px', overflow: 'hidden' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

          {/* VR HUD Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              border: '2px solid rgba(0, 242, 254, 0.2)',
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
              <div style={{ ...hudBox, color: 'var(--accent-ndrf-orange)', fontSize: '0.82rem', fontWeight: '700', letterSpacing: '0.04em' }}>
                OBJECTIVE: {hudMessage}
              </div>
              <div
                style={{
                  ...hudBox,
                  color: ppmReading > 250 ? 'var(--accent-red)' : 'var(--accent-cyan)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  borderColor: ppmReading > 250 ? 'rgba(239,68,68,0.4)' : 'rgba(0,242,254,0.3)',
                }}
              >
                PID GAS DETECTOR: {ppmReading} PPM
              </div>
            </div>

            {/* Crosshair */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'rgba(255, 255, 255, 0.5)',
                filter: 'drop-shadow(0 0 4px rgba(0,242,254,0.3))',
              }}
            >
              <Crosshair size={32} />
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
                {[
                  { label: '🔍 Scan #3', onClick: () => handleDrumClick(3) },
                  { label: '❌ Scan #1', onClick: () => handleDrumClick(1) },
                  { label: `🏃 Evac (${civiliansEvacuated}/2)`, onClick: evacuateCivilian },
                  { label: '🛠️ Seal', onClick: applyContainment },
                  { label: '🚿 Decon', onClick: passDecon },
                ].map((btn, i) => (
                  <button
                    key={i}
                    className="btn-secondary"
                    style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                    onClick={btn.onClick}
                  >
                    {btn.label}
                  </button>
                ))}
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
