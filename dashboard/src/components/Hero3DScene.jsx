import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Radio, ShieldAlert, Cpu, Activity, Zap } from 'lucide-react';

export default function Hero3DScene() {
  const mountRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 1280;
    const height = mount.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.018);

    // Camera perspective
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 10);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.8);
    scene.add(ambientLight);

    const cyanSpot = new THREE.PointLight(0x06b6d4, 3.5, 20);
    cyanSpot.position.set(-5, 6, 4);
    scene.add(cyanSpot);

    const orangeSpot = new THREE.PointLight(0xf97316, 2.5, 18);
    orangeSpot.position.set(5, 5, 4);
    scene.add(orangeSpot);

    const topDirectional = new THREE.DirectionalLight(0x38bdf8, 1.5);
    topDirectional.position.set(0, 10, 5);
    topDirectional.castShadow = true;
    scene.add(topDirectional);

    // ── Isometric Grid & Holographic Floor ──
    const grid = new THREE.GridHelper(32, 28, 0x06b6d4, 0x1e293b);
    grid.position.y = -0.5;
    scene.add(grid);

    // ── Central Scene Group ──
    const mainGroup = new THREE.Group();

    // Chlorine Drum
    const drumGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.6, 32);
    const drumMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.2,
    });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.set(-1.4, 0.3, 0);
    drum.castShadow = true;
    mainGroup.add(drum);

    // Hazardous Gas Cloud Particles
    const particleCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pPositions[i] = -1.4 + (Math.random() - 0.5) * 1.5;
      pPositions[i + 1] = 0.8 + Math.random() * 1.2;
      pPositions[i + 2] = (Math.random() - 0.5) * 1.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
    });
    const gasParticles = new THREE.Points(pGeo, pMat);
    mainGroup.add(gasParticles);

    // Response Vehicle / Rover Chassis
    const vehicleMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.7, 1.6), vehicleMat);
    chassis.position.set(1.2, 0.45, 0);
    chassis.castShadow = true;
    mainGroup.add(chassis);

    // Glass Canopy
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 0.6,
      transparent: true,
      opacity: 0.6,
    });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.4), glassMat);
    canopy.position.set(1.2, 1.05, 0);
    mainGroup.add(canopy);

    // Headlights
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 4.0,
    });
    const lightL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), lightMat);
    lightL.position.set(2.72, 0.45, 0.5);
    const lightR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), lightMat);
    lightR.position.set(2.72, 0.45, -0.5);
    mainGroup.add(lightL, lightR);

    // Floating Telemetry Rings
    const ringGeo = new THREE.TorusGeometry(3.5, 0.03, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    mainGroup.add(ring);

    scene.add(mainGroup);

    // ── Mouse Parallax Interactivity ──
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    const handleMouseMove = (e) => {
      const rect = mount.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.25;
      targetRotationX = y * 0.15;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // ── Animation Loop ──
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      // Smooth camera / group parallax dampening
      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      mainGroup.rotation.y = currentRotationY + Math.sin(t * 0.3) * 0.08;
      mainGroup.rotation.x = currentRotationX;
      mainGroup.position.y = Math.sin(t * 0.7) * 0.05;

      ring.rotation.z += 0.003;

      // Animate gas particles
      const positions = gasParticles.geometry.attributes.position.array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] += 0.005;
        if (positions[i] > 2.0) positions[i] = 0.8;
      }
      gasParticles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="depth-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '420px',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        background: 'radial-gradient(circle at 50% 30%, rgba(15, 23, 42, 0.9) 0%, rgba(11, 15, 25, 0.98) 100%)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        marginBottom: '32px',
      }}
    >
      {/* 3D WebGL Canvas Layer */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }} />

      {/* FLOATING HUD PANEL (TOP LEFT) */}
      <div
        className="hud-panel-floating"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          zIndex: 10,
          padding: '16px 20px',
          borderRadius: '14px',
          maxWidth: '340px',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#38bdf8', letterSpacing: '0.08em', fontWeight: '700' }}>
            ISOMETRIC 3D SCENE OVERVIEW
          </span>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
          CBRN Chemical Hazard <span style={{ color: '#06b6d4' }}>Bay 03</span>
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
          Chlorine drum containment area & 10th NDRF automated Level-A response unit.
        </p>
      </div>

      {/* FLOATING HUD METRIC CARD (TOP RIGHT) */}
      <div
        className="hud-panel-floating"
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 10,
          padding: '14px 18px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          pointerEvents: 'auto',
        }}
      >
        <div style={{
          padding: '10px',
          borderRadius: '10px',
          background: 'rgba(6, 182, 212, 0.15)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          color: '#22d3ee',
        }}>
          <Zap size={20} />
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
            PID Sensor Readout
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#f8fafc' }}>
            42.8 PPM <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: '700' }}>HIGH</span>
          </div>
        </div>
      </div>

      {/* FLOATING HUD TELEMETRY BADGE (BOTTOM RIGHT) */}
      <div
        className="hud-panel-floating"
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '24px',
          zIndex: 10,
          padding: '10px 16px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.78rem',
          color: '#cbd5e1',
        }}
      >
        <Activity size={14} style={{ color: '#10b981' }} />
        <span>FPS: <strong>60</strong> | Physics Depth: <strong>3D Poly</strong></span>
      </div>
    </div>
  );
}
