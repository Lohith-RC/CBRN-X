import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Shield, AlertTriangle, CheckCircle, Crosshair, Radio, Play, MousePointer2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const LEAKING_DRUM_INDEX = 2; // Drum #3
const HAZARD_ZONE_RADIUS = 4;
const PPM_UPDATE_DELTA = 5;
const KEY_MAP = { KeyW: 'w', ArrowUp: 'w', KeyA: 'a', ArrowLeft: 'a', KeyS: 's', ArrowDown: 's', KeyD: 'd', ArrowRight: 'd' };
const PPE_ITEMS = [
  { key: 'mask', label: 'Mask', icon: '😷' },
  { key: 'suit', label: 'Suit', icon: '🥼' },
  { key: 'gloves', label: 'Gloves', icon: '🧤' },
];
const hudBox = {
  background: 'rgba(11, 15, 23, 0.85)',
  backdropFilter: 'blur(12px)',
  borderRadius: '10px',
  padding: '8px 16px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};
const ACTION_BTN = { padding: '5px 12px', fontSize: '0.75rem' };

export default function TraineeVrScreen({ onSessionComplete }) {
  const { user } = useAuth();
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
  const stateRef = useRef({ hasPpe: false, inHazardZone: false, sessionId: null });

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
    let id;
    let local = false;
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: user?.displayName || user?.username || 'Inspector Lohith R C',
          batchUnit: user?.unit || '10th NDRF Battalion',
          scenarioCode: 'CBRN-CHEM-01',
        }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      id = (await res.json()).sessionId;
    } catch {
      local = true;
      id = `sess-local-${Date.now().toString().slice(-4)}`;
    }
    setSessionId(id);
    stateRef.current.sessionId = id;
    setTelemetryLogs([`${local ? 'Local simulation' : 'Session'} started: ${id}`]);
    setIsPlaying(true);
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
    if (civiliansEvacuated >= 2) return;
    const nextCount = civiliansEvacuated + 1;
    setCiviliansEvacuated(nextCount);
    logEvent('civilian_evacuated', `{"civilianId":"CIV-0${nextCount}"}`);
    setHudMessage(nextCount === 2 ? 'ALL CIVILIANS ESCORTED TO SAFE ZONE. APPLY CONTAINMENT SEALANT.' : 'CIVILIAN #1 ESCORTED TO SAFE ZONE. 1 REMAINING.');
  };

  const applyContainment = () => {
    if (!leakingDrumFound) return setHudMessage('CONFIRM LEAK SOURCE BEFORE APPLYING SEALANT');
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
    controlsRef.current?.unlock();
    const activeSess = stateRef.current.sessionId || sessionId;
    if (activeSess && !activeSess.startsWith('sess-local')) {
      try {
        await fetch(`/api/sessions/${activeSess}/complete`, { method: 'POST' });
      } catch (ignored) {}
    }
    setIsPlaying(false);
    setIsLocked(false);
    const completedSummary = {
      sessionId: activeSess || `sess-demo-${Date.now().toString().slice(-4)}`,
      traineeName: 'Inspector Lohith R C',
      batchUnit: '10th NDRF Battalion',
      scenarioTitle: 'Chlorine Gas Leak Response',
      scenarioCode: 'CBRN-CHEM-01',
      finalScore: contained ? 94 : 88,
      passStatus: 'PASSED',
      totalDurationSeconds: 145,
      startedAt: new Date(Date.now() - 145000).toISOString(),
      completedAt: new Date().toISOString(),
      mistakes: leakingDrumFound ? [] : ['Delayed identification of primary chemical leak source.'],
      recommendations: [
        'DON PPE: DONNED LEVEL-A CHEMICAL SUIT WITHIN 90s.',
        'CONTAINMENT: SEALED HAZARDOUS DRUM INTEGRITY.',
        'DECONTAMINATION: COMPLETED ARCHWAY WASH DOWN.',
      ],
    };

    onSessionComplete?.(completedSummary);
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

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 150);
    camera.position.set(0, 1.7, -4);
    camera.lookAt(1.5, 1.2, 7.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mount.appendChild(renderer.domElement);

    const disposables = [];
    const trackDispose = (obj) => (disposables.push(obj), obj);
    const M = (opts) => trackDispose(new THREE.MeshStandardMaterial(opts));
    // geo/material/position factory: creates, positions, parents, returns the mesh
    const mesh = (geo, material, x, y, z, parent) => {
      const m = new THREE.Mesh(trackDispose(geo), material);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };

    // ── Exact Scene Hierarchy Groups ──
    const envGroup = new THREE.Group();
    envGroup.name = '--- ENVIRONMENT & ARCHITECTURE ---';
    const stationsGroup = new THREE.Group();
    stationsGroup.name = '--- INTERACTIVE STATIONS ---';
    const actorsGroup = new THREE.Group();
    actorsGroup.name = '--- ACTORS & HAZARDS ---';
    scene.add(envGroup, stationsGroup, actorsGroup);

    // ── High-Fidelity Industrial Lighting ──
    scene.add(trackDispose(new THREE.AmbientLight(0xffffff, 0.45)));

    const highBayLight1 = trackDispose(new THREE.DirectionalLight(0xffffff, 1.2));
    highBayLight1.position.set(0, 15, 0);
    highBayLight1.castShadow = true;
    highBayLight1.shadow.mapSize.set(2048, 2048);
    highBayLight1.shadow.bias = -0.0005;
    scene.add(highBayLight1);

    const taskSpotLight = trackDispose(new THREE.SpotLight(0xffffff, 4.0, 16, Math.PI / 4, 0.3));
    taskSpotLight.position.set(-1.8, 2.2, 5.8);
    taskSpotLight.target.position.set(1.5, 0.5, 7.4);
    taskSpotLight.castShadow = true;
    scene.add(taskSpotLight, taskSpotLight.target);

    const emergencyBeacon = trackDispose(new THREE.PointLight(0xef4444, 3.5, 25));
    emergencyBeacon.position.set(0, 5.8, 7.4);
    scene.add(emergencyBeacon);

    // ── PBR Material Definitions matching Unity Assets ──
    const matEpoxyFloor = M({ color: 0x141619, roughness: 0.45, metalness: 0.05 });
    const matSteel = M({ color: 0x22262d, roughness: 0.35, metalness: 0.85 });
    const matYellowSafety = M({ color: 0xf59e0b, roughness: 0.55, metalness: 0.05 });
    const matBlueDrum = M({ color: 0x1d63b8, roughness: 0.60, metalness: 0.15 });
    const matToxicAmber = M({ color: 0xf58220, roughness: 0.05, metalness: 0.1, emissive: 0xd97706, emissiveIntensity: 0.45, transparent: true, opacity: 0.95 });
    const matRackBlue = M({ color: 0x1e40af, roughness: 0.50, metalness: 0.20 });
    const matRackOrange = M({ color: 0xea580c, roughness: 0.50, metalness: 0.20 });
    const matPipeRed = M({ color: 0xdc2626, roughness: 0.40, metalness: 0.50 });
    const matPipeYellow = M({ color: 0xf59e0b, roughness: 0.40, metalness: 0.50 });
    const matPipeBlue = M({ color: 0x0284c7, roughness: 0.40, metalness: 0.50 });
    const matPipeGreen = M({ color: 0x059669, roughness: 0.40, metalness: 0.50 });
    const matDuct = M({ color: 0x94a3b8, roughness: 0.30, metalness: 0.85 });
    const matWhite = M({ color: 0xf1f5f9, roughness: 0.70 });
    const matSpillKitRed = M({ color: 0xef4444, roughness: 0.50 });

    // ── Sealed Epoxy Flooring & Transit Marking Lines ──
    const floor = mesh(new THREE.PlaneGeometry(36, 48), matEpoxyFloor, 0, 0, 8, envGroup);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;

    const lineMat = trackDispose(new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    const transitLineL = mesh(new THREE.PlaneGeometry(0.15, 36), lineMat, -4.5, 0.01, 8, envGroup);
    transitLineL.rotation.x = -Math.PI / 2;
    const transitLineR = mesh(new THREE.PlaneGeometry(0.15, 36), lineMat, 4.5, 0.01, 8, envGroup);
    transitLineR.rotation.x = -Math.PI / 2;

    // ── Dual Containment Sumps with Recesses ──
    const sumpGeo = trackDispose(new THREE.BoxGeometry(2.6, 0.22, 2.6));
    const recessGeo = trackDispose(new THREE.BoxGeometry(2.3, 0.04, 2.3));
    [[1.5, 7.4], [-1.8, 7.4]].forEach(([sx, sz]) => {
      const sump = new THREE.Mesh(sumpGeo, matYellowSafety);
      sump.position.set(sx, 0.11, sz);
      sump.castShadow = true;
      sump.receiveShadow = true;
      actorsGroup.add(sump);
      mesh(recessGeo, matEpoxyFloor, sx, 0.21, sz, actorsGroup);
    });

    // ── 4 Cobalt Blue Poly Chemical Drums on Sump 1 ──
    const drums = [];
    [
      { x: 1.1, z: 7.0 }, // DRUM-01
      { x: 1.9, z: 7.0 }, // DRUM-02
      { x: 1.1, z: 7.8 }, // DRUM-04
      { x: 1.9, z: 7.8 }, // DRUM-03 (LEAKING)
    ].forEach((pos, idx) => {
      const isLeak = idx === 3;
      const group = new THREE.Group();

      const drumBody = mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.15, 20), matBlueDrum, 0, 0.80, 0, group);
      drumBody.castShadow = true;
      drumBody.userData.drumIndex = isLeak ? LEAKING_DRUM_INDEX : idx;
      drums.push(drumBody);

      for (let r = -0.3; r <= 0.3; r += 0.6) mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.04, 20), matBlueDrum, 0, 0.80 + r, 0, group); // rib rings
      mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.03, 20), matSteel, 0, 1.38, 0, group); // top lid

      if (isLeak) {
        mesh(new THREE.PlaneGeometry(0.28, 0.18), matWhite, 0, 0.95, 0.33, group); // hazardous waste placard
        mesh(new THREE.SphereGeometry(0.06, 8, 8), matSteel, 0.06, 0.70, 0.32, group); // puncture hole
        mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.45, 8), matToxicAmber, 0.06, 0.45, 0.32, group); // drip
        mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.02, 24), matToxicAmber, 1.5, 0.23, 7.5, actorsGroup); // chemical pool in sump
      }

      group.position.set(pos.x, 0, pos.z);
      actorsGroup.add(group);
    });

    // ── Multi-Responder Co-Op 3D Avatars (Bravo & Charlie Team) ──
    [[M({ color: 0x8b5cf6, roughness: 0.3, metalness: 0.2 }), -1.8, 7.4], [M({ color: 0x06b6d4, roughness: 0.3, metalness: 0.2 }), 0.0, 3.2]].forEach(([suitMat, x, z]) => {
      const responder = new THREE.Group();
      mesh(new THREE.CylinderGeometry(0.35, 0.3, 1.4, 16), suitMat, 0, 0.7, 0, responder);
      mesh(new THREE.SphereGeometry(0.22, 16, 16), matYellowSafety, 0, 1.55, 0, responder);
      responder.position.set(x, 0, z);
      actorsGroup.add(responder);
    });

    // ── 4-Line Color-Coded Piping Manifold on Rear Wall ──
    [matPipeRed, matPipeYellow, matPipeBlue, matPipeGreen].forEach((pipeMat, i) => {
      const pipe = mesh(new THREE.CylinderGeometry(0.04, 0.04, 18, 12), pipeMat, 0, 3.8 + i * 0.25, 10.2, envGroup);
      pipe.rotation.z = Math.PI / 2;
    });

    // ── Overhead Air Scrubber Unit & HEPA Filter Bank ──
    mesh(new THREE.BoxGeometry(3.2, 1.4, 2.2), matDuct, 0.65, 4.6, 7.4, envGroup).castShadow = true;
    mesh(new THREE.PlaneGeometry(1.2, 0.8), matSteel, -0.2, 4.6, 6.29, envGroup);
    mesh(new THREE.PlaneGeometry(1.0, 0.8), matWhite, 1.0, 4.6, 6.29, envGroup);
    mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.5, 12), matSteel, 1.5, 3.4, 7.4, envGroup); // drop suction duct

    // ── Gantry Crane System & Motorized Hoists ──
    mesh(new THREE.BoxGeometry(16, 0.35, 0.35), matSteel, 0, 5.6, 7.4, envGroup);
    mesh(new THREE.BoxGeometry(0.6, 0.35, 0.45), matDuct, -1.8, 5.3, 7.4, envGroup);
    mesh(new THREE.BoxGeometry(0.6, 0.35, 0.45), matDuct, 1.8, 5.3, 7.4, envGroup);

    // ── Hazardous Offloading Rail Spur (Right Flank) ──
    mesh(new THREE.BoxGeometry(0.08, 0.10, 30), matSteel, 6.8, 0.08, 8, envGroup);
    mesh(new THREE.BoxGeometry(0.08, 0.10, 30), matSteel, 8.2, 0.08, 8, envGroup);
    for (let a = 0; a < 2; a++) {
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.8, 12), matDuct, 6.2, 0.9, 5 + a * 6, envGroup);
      mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), matYellowSafety, 6.6, 2.2, 5 + a * 6, envGroup).rotation.z = -Math.PI / 4;
    }

    // ── 3-Tier Industrial Pallet Racking with IBC Chemical Totes ──
    for (let bay = 0; bay < 3; bay++) {
      const zPos = 5.5 + bay * 2.8;
      mesh(new THREE.BoxGeometry(0.08, 4.5, 0.08), matRackBlue, -6.5, 2.25, zPos - 1.2, envGroup);
      mesh(new THREE.BoxGeometry(0.08, 4.5, 0.08), matRackBlue, -6.5, 2.25, zPos + 1.2, envGroup);
      for (let t = 1; t <= 3; t++) {
        mesh(new THREE.BoxGeometry(0.06, 0.08, 2.4), matRackOrange, -6.45, t * 1.3, zPos, envGroup);
        mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), matWhite, -6.2, t * 1.3 + 0.45, zPos, envGroup); // IBC tote tank
        mesh(new THREE.BoxGeometry(0.90, 0.90, 0.90), matSteel, -6.2, t * 1.3 + 0.45, zPos, envGroup); // protective cage
      }
    }

    // ── Interactive Stations: Spill Kit, Gas Dock, Eyewash, Inflatable Decon ──
    mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.65, 16), matSpillKitRed, -3.0, 1.45, 5.2, stationsGroup);
    mesh(new THREE.BoxGeometry(0.35, 0.04, 0.55), matSteel, -3.0, 2.45, 5.2, stationsGroup); // detector wall dock shelf
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 8), matSteel, -1.8, 0.9, 5.8, stationsGroup); // tripod LED work light
    mesh(new THREE.BoxGeometry(0.35, 0.25, 0.08), matSteel, -1.8, 1.95, 5.8, stationsGroup).rotation.set(0.3, 0.6, 0);
    mesh(new THREE.TorusGeometry(1.4, 0.18, 12, 24, Math.PI), matSteel, 4.8, 1.6, 7.2, stationsGroup).rotation.y = -Math.PI / 12; // decon frame
    mesh(new THREE.BoxGeometry(2.4, 2.6, 1.2), matYellowSafety, 4.8, 1.4, 7.6, stationsGroup); // decon canopy
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), matPipeGreen, 3.2, 1.1, 9.6, stationsGroup); // eyewash pipe
    mesh(new THREE.CylinderGeometry(0.25, 0.15, 0.08, 12), matSteel, 3.2, 1.05, 9.4, stationsGroup); // eyewash bowl

    // Safety Bollards along transit lane
    [-4.5, -2.0, 0.5, 3.0].forEach((z) => mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 12), matYellowSafety, -3.8, 0.45, z, envGroup));

    // ── PointerLockControls & Movement ──
    const controls = new PointerLockControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const handleLockChange = () => setIsLocked(controls.isLocked);
    controls.addEventListener('lock', handleLockChange);
    controls.addEventListener('unlock', handleLockChange);

    const keys = { w: false, a: false, s: false, d: false };
    const setKey = (v) => (e) => {
      const k = KEY_MAP[e.code];
      if (k) keys[k] = v;
    };
    const handleKeyDown = setKey(true);
    const handleKeyUp = setKey(false);
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
      if (hits.length > 0 && hits[0].distance < 6) handleDrumClickRef.current(hits[0].object.userData.drumIndex);
    };
    renderer.domElement.addEventListener('click', handleClick);

    // ── Toxic Gas Cloud Particles (Amber Vapor at Leak Drum #3) ──
    const particleCount = 150;
    const gasPositions = new Float32Array(particleCount * 3);
    const gasVelocities = [];
    for (let i = 0; i < particleCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.5;
      gasPositions[i * 3] = Math.cos(a) * r;
      gasPositions[i * 3 + 1] = Math.random() * 3;
      gasPositions[i * 3 + 2] = Math.sin(a) * r;
      gasVelocities.push({ x: (Math.random() - 0.5) * 0.01, y: Math.random() * 0.015 + 0.005, z: (Math.random() - 0.5) * 0.01 });
    }
    const gasGeo = trackDispose(new THREE.BufferGeometry());
    gasGeo.setAttribute('position', new THREE.BufferAttribute(gasPositions, 3));
    const gasMat = trackDispose(new THREE.PointsMaterial({ color: 0xf59e0b, size: 0.35, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending }));
    const gasCloud = new THREE.Points(gasGeo, gasMat);
    gasCloud.position.set(1.9, 0.4, 7.8);
    actorsGroup.add(gasCloud);

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const velocity = new THREE.Vector3();
    const leakPos = new THREE.Vector3(1.9, 0, 7.8); // hoisted: constant, was reallocated every frame
    let lastPpm = null;
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      // Animate gas cloud
      const posAttr = gasGeo.getAttribute('position');
      const arr = posAttr.array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3] += gasVelocities[i].x * 0.5;
        arr[i * 3 + 1] += gasVelocities[i].y * 0.5;
        arr[i * 3 + 2] += gasVelocities[i].z * 0.5;
        if (arr[i * 3 + 1] > 3.5) {
          arr[i * 3 + 1] = 0;
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 2;
          arr[i * 3] = Math.cos(a) * r;
          arr[i * 3 + 2] = Math.sin(a) * r;
        }
      }
      posAttr.needsUpdate = true;
      gasCloud.rotation.y += 0.003;

      // Animate emergency beacon
      emergencyBeacon.intensity = 2.5 + Math.sin(performance.now() * 0.008) * 1.5;

      if (controls.isLocked) {
        const damping = Math.max(0, 1 - 8 * delta);
        velocity.x -= velocity.x * 8 * delta;
        velocity.z -= velocity.z * 8 * delta;
        const accel = 24 * delta * 60 * delta;
        if (keys.w) velocity.z -= accel;
        if (keys.s) velocity.z += accel;
        if (keys.a) velocity.x -= accel;
        if (keys.d) velocity.x += accel;
        velocity.multiplyScalar(damping);

        controls.moveRight(velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        camera.position.x = THREE.MathUtils.clamp(camera.position.x, -7.5, 7.5);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, -6.0, 10.0);
        camera.position.y = 1.7;

        const dist = camera.position.distanceTo(leakPos);
        const ppm = THREE.MathUtils.clamp(Math.round(450 - dist * 60), 0, 450);

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
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [isPlaying, logEvent]);

  return (
    <div className="glass-card-deep animate-fade-in" style={{ padding: '24px', marginBottom: '28px', animationDelay: '0.15s' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>Trainee VR First-Person Screen</h2>
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
          <button className="btn-secondary" style={{ color: 'var(--accent-green)', borderColor: 'rgba(16, 185, 129, 0.4)' }} onClick={finishMission}>
            <CheckCircle size={16} /> Finish Mission &amp; Generate Report
          </button>
        )}
      </div>

      {!isPlaying ? (
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(10, 16, 28, 0.95) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}>
              <Shield size={24} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.98rem', fontWeight: '800', margin: 0 }}>Interactive Trainee VR First-Person Simulator</h4>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>3D WebGL tactical environment. Don PPE, scan leaking chemical drums, and log live telemetry.</p>
            </div>
          </div>
          <button className="btn-glow" onClick={startSession} style={{ padding: '9px 20px', fontSize: '0.85rem' }}>
            <Play size={16} /> Launch Interactive 3D VR Simulation
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '480px', borderRadius: '14px', overflow: 'hidden' }}>
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

          {!isLocked && (
            <div onClick={() => controlsRef.current?.lock()}
              style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(5, 8, 12, 0.72)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
              <MousePointer2 size={32} color="var(--accent-cyan)" />
              <div style={{ color: '#fff', fontWeight: '700' }}>CLICK TO ENTER FIRST-PERSON SIMULATION</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Mouse = look around · W/A/S/D = walk · Esc = release cursor</div>
            </div>
          )}

          {/* VR HUD Overlay */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', border: '2px solid rgba(0, 242, 254, 0.25)', borderRadius: '14px', boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 242, 254, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px' }}>
            {/* Top HUD */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div role="status" aria-live="polite"
                style={{ ...hudBox, color: 'var(--accent-ndrf-orange)', fontSize: '0.82rem', fontWeight: '700', letterSpacing: '0.04em', border: '1px solid rgba(245, 130, 32, 0.4)', maxWidth: '70%' }}>
                🎯 OBJECTIVE: {hudMessage}
              </div>
              <div style={{ ...hudBox, color: ppmReading > 250 ? 'var(--accent-red)' : 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: '700', border: ppmReading > 250 ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(0,242,254,0.3)' }}>
                📟 PID GAS DETECTOR: {ppmReading} PPM
              </div>
            </div>

            {/* Crosshair */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'rgba(255, 255, 255, 0.6)', filter: 'drop-shadow(0 0 4px rgba(0,242,254,0.4))' }}>
              <Crosshair size={30} />
            </div>

            {/* Bottom Controls */}
            <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              {/* PPE Locker */}
              <div style={{ ...hudBox, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PPE Locker:</span>
                {PPE_ITEMS.map(({ key, label, icon }) => (
                  <button key={key} onClick={() => equipPpeItem(key)} aria-pressed={ppeState[key]}
                    style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', border: 'none', cursor: 'pointer', background: ppeState[key] ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)', color: ppeState[key] ? 'var(--accent-green)' : '#fff', transition: 'all 0.2s ease', fontWeight: '600' }}>
                    {ppeState[key] ? `✅ ${label}` : `${icon} Equip ${label}`}
                  </button>
                ))}
              </div>

              {/* Mission Actions */}
              <div style={{ ...hudBox, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {[['🔍 Scan Drum #3', () => handleDrumClick(2)], ['❌ Scan Drum #1', () => handleDrumClick(0)]].map(([label, act]) => (
                  <button key={label} className="btn-secondary" style={ACTION_BTN} onClick={act}>{label}</button>
                ))}
                <button className="btn-secondary" style={ACTION_BTN} onClick={evacuateCivilian}>🏃 Evacuate ({civiliansEvacuated}/2)</button>
                {[['🛠️ Apply Sealant', applyContainment], ['🚿 Decon Archway', passDecon]].map(([label, act]) => (
                  <button key={label} className="btn-secondary" style={ACTION_BTN} onClick={act}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry Footer */}
      {telemetryLogs.length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(0,242,254,0.1)' }}>
          📡 Live Telemetry: {telemetryLogs[0]}
        </div>
      )}
    </div>
  );
}
