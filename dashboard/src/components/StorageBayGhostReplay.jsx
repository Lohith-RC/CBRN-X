import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Box, Radio } from 'lucide-react';

/**
 * StorageBayGhostReplay.jsx
 * 3D Spatial Ghost Replay & Telemetry System
 * Digital Twin rendering system for "Storage Bay 03" featuring semi-transparent
 * holographic trainee ghost avatars driven in real-time by telemetry streams.
 */
export default function StorageBayGhostReplay({
  telemetryData = null,
  currentTimeSec = 0,
  playbackSpeed = 1,
  showGhostTrajectory = true,
  ghostCount = 2,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const ghostAvatarsRef = useRef([]);

  const [ghostTelemetry, setGhostTelemetry] = useState([
    { id: 'Trainee-01 (Alpha)', x: -2.5, y: 0, z: 1.5, rotY: 0.4, ppm: 0.85, status: 'Active Recon' },
    { id: 'Trainee-02 (Ghost)', x: 1.8, y: 0, z: 5.2, rotY: -1.2, ppm: 4.2, status: 'Hot-Zone Donning' },
  ]);

  // Compute interpolated spatial coordinates for current timestamp
  const currentCoordinates = useMemo(() => {
    // Spatial path calculation based on timeline playhead
    const t = currentTimeSec;
    const progress = (t % 145) / 145;

    // Trainee 1 trajectory: Cold Zone (-8, 0, -5) -> Bay 03 Center (1.5, 0, 7.4) -> Decon (4.8, 0, 7.6)
    const t1X = -8.0 + progress * 16.5 + Math.sin(progress * Math.PI * 3) * 2.2;
    const t1Z = -6.0 + Math.cos(progress * Math.PI * 2) * 4.0 + progress * 14.0;
    const t1Rot = Math.atan2(Math.cos(progress * Math.PI * 3), 1) + progress * Math.PI;

    // Trainee 2 (Ghost Trainee) path delay offset
    const prog2 = Math.max(0, (progress - 0.15 + 1) % 1);
    const t2X = -6.0 + prog2 * 14.0 - Math.cos(prog2 * Math.PI * 2) * 1.8;
    const t2Z = -4.0 + prog2 * 12.5;
    const t2Rot = Math.sin(prog2 * Math.PI * 4);

    return [
      { id: 'TRAINEE #1 (LEAD)', x: parseFloat(t1X.toFixed(2)), y: 0, z: parseFloat(t1Z.toFixed(2)), rotY: t1Rot, color: 0x06b6d4, status: 'ACTIVE RECON' },
      { id: 'TRAINEE #2 (GHOST TWIN)', x: parseFloat(t2X.toFixed(2)), y: 0, z: parseFloat(t2Z.toFixed(2)), rotY: t2Rot, color: 0x10b981, status: 'GHOST REPLAY' },
    ];
  }, [currentTimeSec]);

  // Update telemetry stats UI state
  useEffect(() => {
    setGhostTelemetry(currentCoordinates);
  }, [currentCoordinates]);

  // Three.js Digital Twin Setup
  useEffect(() => {
    if (!mountRef.current) return undefined;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x040812);
    scene.fog = new THREE.FogExp2(0x040812, 0.035);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 10, 16);
    camera.lookAt(0, 1, 4);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 35;

    // 5. Lighting System for Storage Bay 03 Digital Twin
    const ambientLight = new THREE.AmbientLight(0x0a2540, 0.8);
    scene.add(ambientLight);

    const cyanGridLight = new THREE.DirectionalLight(0x06b6d4, 1.5);
    cyanGridLight.position.set(10, 15, 10);
    scene.add(cyanGridLight);

    const amberLeakLight = new THREE.PointLight(0xf59e0b, 2.5, 12);
    amberLeakLight.position.set(1.9, 1.5, 7.8);
    scene.add(amberLeakLight);

    // 6. Holographic Storage Bay 03 Environment
    const bayGroup = new THREE.Group();
    bayGroup.name = 'STORAGE_BAY_03_DIGITAL_TWIN';
    scene.add(bayGroup);

    // Holographic Floor Grid
    const gridHelper = new THREE.GridHelper(30, 30, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.01;
    bayGroup.add(gridHelper);

    // Floor Base Surface
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070d1a,
      roughness: 0.2,
      metalness: 0.8,
    });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    bayGroup.add(floorMesh);

    // Bay Boundaries (Holographic Wireframe Walls)
    const wallMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wallGeo = new THREE.BoxGeometry(24, 8, 24);
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 4, 4);
    bayGroup.add(wallMesh);

    // Storage Bay 03 Label / Marker Pillars
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.2,
      roughness: 0.3,
    });
    [-10, 10].forEach((x) => {
      [-6, 12].forEach((z) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 8, 0.6), pillarMat);
        pillar.position.set(x, 4, z);
        bayGroup.add(pillar);
      });
    });

    // Chemical Sump & Storage Drums in Bay 03
    const sumpMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const sumpMesh = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 3), sumpMat);
    sumpMesh.position.set(1.9, 0.08, 7.8);
    bayGroup.add(sumpMesh);

    // Leaking Chemical Drum Model
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x1d63b8, roughness: 0.5, metalness: 0.3 });
    [
      [1.4, 0.6, 7.4],
      [2.4, 0.6, 7.4],
      [1.4, 0.6, 8.2],
      [2.4, 0.6, 8.2], // Leaking Drum #3
    ].forEach(([x, y, z]) => {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16), drumMat);
      drum.position.set(x, y, z);
      bayGroup.add(drum);
    });

    // 7. Holographic Trainee Ghost Avatar Construction
    const createGhostAvatar = (colorHex) => {
      const ghostGroup = new THREE.Group();

      // Semi-transparent Holographic Body Outer Shell
      const ghostMat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.65,
        roughness: 0.1,
        metalness: 0.1,
        clearcoat: 1.0,
        wireframe: false,
      });

      // Internal Wireframe Mesh for Cyber Ghost Effect
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });

      // Body Parts: Torso, Head, Backpack SCBA Tank, Limbs
      const torsoGeo = new THREE.CylinderGeometry(0.35, 0.25, 1.1, 12);
      const torso = new THREE.Mesh(torsoGeo, ghostMat);
      torso.position.y = 0.85;
      ghostGroup.add(torso);

      const torsoWire = new THREE.Mesh(torsoGeo, wireMat);
      torsoWire.position.y = 0.85;
      ghostGroup.add(torsoWire);

      // Head / Helmet
      const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const head = new THREE.Mesh(headGeo, ghostMat);
      head.position.y = 1.55;
      ghostGroup.add(head);

      // Visor Glow Ring
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.1), visorMat);
      visor.position.set(0, 1.55, 0.18);
      ghostGroup.add(visor);

      // SCBA Air Cylinder Unit on back
      const tankGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 10);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.3 });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.position.set(0, 0.95, -0.28);
      ghostGroup.add(tank);

      // Ground Position Target Pulsing Ring
      const ringGeo = new THREE.RingGeometry(0.4, 0.6, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.02;
      ghostGroup.add(ring);

      scene.add(ghostGroup);
      return { ghostGroup, ringMat };
    };

    // Instantiate 2 Trainee Ghost Avatars (Lead Trainee cyan, Ghost Replay emerald)
    const ghost1 = createGhostAvatar(0x06b6d4);
    const ghost2 = createGhostAvatar(0x10b981);
    ghostAvatarsRef.current = [ghost1, ghost2];

    // 8. Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      controls.update();

      // Pulsing pulse effect for ground target rings
      const pulseOpacity = 0.4 + Math.sin(performance.now() * 0.005) * 0.3;
      ghostAvatarsRef.current.forEach((g) => {
        if (g && g.ringMat) g.ringMat.opacity = pulseOpacity;
      });

      // Flicker amber hazard light near leaking drum
      amberLeakLight.intensity = 2.0 + Math.sin(performance.now() * 0.008) * 0.8;

      renderer.render(scene, camera);
    };
    animate();

    // Handle Viewport Resize
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
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Holographic Ghost Avatars 3D Positions driven by incoming telemetry stream
  useEffect(() => {
    if (ghostAvatarsRef.current.length < 2) return;

    currentCoordinates.forEach((coord, idx) => {
      const ghostObj = ghostAvatarsRef.current[idx];
      if (ghostObj && ghostObj.ghostGroup) {
        // Smooth positional interpolation (LERP)
        ghostObj.ghostGroup.position.x = THREE.MathUtils.lerp(ghostObj.ghostGroup.position.x, coord.x, 0.2);
        ghostObj.ghostGroup.position.z = THREE.MathUtils.lerp(ghostObj.ghostGroup.position.z, coord.z, 0.2);
        ghostObj.ghostGroup.position.y = coord.y;
        ghostObj.ghostGroup.rotation.y = coord.rotY;
      }
    });
  }, [currentCoordinates]);

  return (
    <div
      className="glass-card-deep animate-fade-in"
      style={{
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        background: 'linear-gradient(145deg, rgba(6, 10, 20, 0.95) 0%, rgba(10, 16, 30, 0.98) 100%)',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 25px rgba(6, 182, 212, 0.12)',
        marginBottom: '24px',
      }}
    >
      {/* 3D Viewport Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
            <Box size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '0.02em' }}>
              STORAGE BAY 03 — 3D HOLOGRAPHIC DIGITAL TWIN
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Spatial Telemetry Replay • Semi-Transparent Trainee Ghost Avatars • Real-time (X, Y, Z) Coordinate Streaming
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', padding: '4px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Radio size={12} className="animate-pulse" /> SPATIAL STREAM SYNCED
          </span>
        </div>
      </div>

      {/* Main 3D WebGL Canvas Window */}
      <div style={{ position: 'relative', width: '100%', height: '380px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

        {/* Holographic HUD Controls Overlay */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(11, 15, 23, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#06b6d4', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
            GRID: STORAGE BAY 03 (30m x 30m)
          </div>
          <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(11, 15, 23, 0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#eab308', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
            HAZARD: DRUM #3 (CHLORINE SPILL)
          </div>
        </div>

        {/* Orbit Instructions */}
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 10, padding: '4px 10px', borderRadius: '6px', background: 'rgba(0, 0, 0, 0.7)', color: '#94a3b8', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
          Left-Click + Drag: Rotate Twin • Scroll: Zoom
        </div>
      </div>

      {/* Trainee Ghost Telemetry Coordinates Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '14px' }}>
        {ghostTelemetry.map((ghost, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: `1px solid ${idx === 0 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: idx === 0 ? '#06b6d4' : '#10b981',
                  boxShadow: `0 0 10px ${idx === 0 ? '#06b6d4' : '#10b981'}`,
                }}
              />
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {ghost.id}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  X: <strong style={{ color: '#fff' }}>{ghost.x}m</strong> | Z: <strong style={{ color: '#fff' }}>{ghost.z}m</strong> | RotY: <strong style={{ color: '#fff' }}>{ghost.rotY.toFixed(2)} rad</strong>
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '6px',
                background: idx === 0 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: idx === 0 ? '#06b6d4' : '#10b981',
              }}
            >
              {ghost.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
