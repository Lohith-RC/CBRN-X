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

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL renderer unavailable:', e);
      return;
    }

    // ── Grid Mesh ──
    const gridHelper = new THREE.GridHelper(60, 40, 0x10b981, 0x1e293b);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // ── Floating Emerald & Purple Particles ──
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = [];

    const emeraldColor = new THREE.Color(0x10b981);
    const purpleColor = new THREE.Color(0x8b5cf6);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 15 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      const mixed = Math.random() > 0.5 ? emeraldColor : purpleColor;
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;

      velocities.push({
        x: (Math.random() - 0.5) * 0.008,
        y: Math.random() * 0.007 + 0.003,
        z: (Math.random() - 0.5) * 0.008,
      });
    }

    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // ── Floating Wireframe Shapes ──
    const shapes = [];
    const shapeGeo = new THREE.OctahedronGeometry(0.65, 0);

    for (let i = 0; i < 8; i++) {
      const matColor = i % 2 === 0 ? 0x10b981 : 0x8b5cf6;
      const shapeMat = new THREE.MeshBasicMaterial({
        color: matColor,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });
      const mesh = new THREE.Mesh(shapeGeo, shapeMat);
      mesh.position.set((Math.random() - 0.5) * 32, Math.random() * 9, (Math.random() - 0.5) * 22);
      scene.add(mesh);
      shapes.push(mesh);
    }

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      const posAttr = particlesGeo.getAttribute('position');
      for (let i = 0; i < count; i++) {
        posAttr.array[i * 3] += velocities[i].x;
        posAttr.array[i * 3 + 1] += velocities[i].y;
        posAttr.array[i * 3 + 2] += velocities[i].z;

        if (posAttr.array[i * 3 + 1] > 13) {
          posAttr.array[i * 3 + 1] = -2;
        }
      }
      posAttr.needsUpdate = true;

      shapes.forEach((s, idx) => {
        s.rotation.x += 0.006 * (idx % 2 === 0 ? 1 : -1);
        s.rotation.y += 0.009;
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
