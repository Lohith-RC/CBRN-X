import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero3DScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 1280;
    const height = mount.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f17, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 9.5);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ── Lighting ──
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xf58220, 2.2);
    keyLight.position.set(6, 10, 8);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x00f2fe, 1.8);
    cyanRim.position.set(-6, 4, -4);
    scene.add(cyanRim);

    // ── Grid Floor ──
    const grid = new THREE.GridHelper(30, 24, 0xf58220, 0x1e293b);
    grid.position.y = -0.5;
    scene.add(grid);

    // ── Hero Glass Hazmat Response Vehicle ──
    const carGroup = new THREE.Group();
    carGroup.position.set(0, 0, 0);

    // Chassis
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a3a5c,
      metalness: 0.8,
      roughness: 0.15,
      transmission: 0.4,
      thickness: 1.0,
      transparent: true,
      opacity: 0.85
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.75, 1.6), bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    carGroup.add(body);

    // Cabin Glass
    const cabinMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.8,
      thickness: 0.8,
      transparent: true,
      opacity: 0.65
    });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 1.45), cabinMat);
    cabin.position.set(0.2, 1.15, 0);
    carGroup.add(cabin);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const wheelPositions = [[-1.1, 0.25, 0.85], [-1.1, 0.25, -0.85], [1.1, 0.25, 0.85], [1.1, 0.25, -0.85]];
    wheelPositions.forEach((p) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 16), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(p[0], p[1], p[2]);
      carGroup.add(wheel);
    });

    // Headlights
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xf58220, emissive: 0xf58220, emissiveIntensity: 3.5 });
    const headlightL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
    headlightL.position.set(1.62, 0.5, 0.5);
    const headlightR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
    headlightR.position.set(1.62, 0.5, -0.5);
    carGroup.add(headlightL, headlightR);

    scene.add(carGroup);

    // ── Floating Telemetry Rings ──
    const ringGeo = new THREE.TorusGeometry(2.4, 0.03, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true, transparent: true, opacity: 0.4 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    scene.add(ring);

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = performance.now() * 0.001;

      carGroup.rotation.y = Math.sin(t * 0.4) * 0.25;
      carGroup.position.y = Math.sin(t * 0.8) * 0.06;
      ring.rotation.z += 0.004;

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
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '380px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(245, 130, 32, 0.3)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(11, 15, 23, 0.95) 100%)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        marginBottom: '32px',
      }}
    >
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8', letterSpacing: '0.1em' }}>LIVE SIMULATION TELEMETRY</span>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
          CBRN Chemical Hazard Unit <span style={{ color: '#f58220' }}>Bay 03</span>
        </h2>
      </div>
    </div>
  );
}
