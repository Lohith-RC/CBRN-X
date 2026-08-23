import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function DashboardBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 5, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // ── Grid Mesh ──
    const gridHelper = new THREE.GridHelper(60, 40, 0xf58220, 0x1e293b);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // ── Floating Gas Particles ──
    const count = 180;
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 15 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      velocities.push({
        x: (Math.random() - 0.5) * 0.01,
        y: Math.random() * 0.008 + 0.003,
        z: (Math.random() - 0.5) * 0.01
      });
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMat = new THREE.PointsMaterial({
      color: 0xf58220,
      size: 0.18,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // ── Subtle Floating Hazmat Polyhedra ──
    const shapes = [];
    const shapeGeo = new THREE.OctahedronGeometry(0.6, 0);
    const shapeMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true, transparent: true, opacity: 0.25 });

    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(shapeGeo, shapeMat);
      mesh.position.set((Math.random() - 0.5) * 30, Math.random() * 8, (Math.random() - 0.5) * 20);
      scene.add(mesh);
      shapes.push(mesh);
    }

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      // Animate particles
      const posAttr = particlesGeo.getAttribute('position');
      for (let i = 0; i < count; i++) {
        posAttr.array[i * 3] += velocities[i].x;
        posAttr.array[i * 3 + 1] += velocities[i].y;
        posAttr.array[i * 3 + 2] += velocities[i].z;

        if (posAttr.array[i * 3 + 1] > 12) {
          posAttr.array[i * 3 + 1] = -2;
        }
      }
      posAttr.needsUpdate = true;

      // Animate shapes
      shapes.forEach((s, idx) => {
        s.rotation.x += 0.005 * (idx % 2 === 0 ? 1 : -1);
        s.rotation.y += 0.008;
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      particlesGeo.dispose();
      particlesMat.dispose();
      shapeGeo.dispose();
      shapeMat.dispose();
      renderer.dispose();
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.75,
      }}
    />
  );
}
