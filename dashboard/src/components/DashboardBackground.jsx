import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Ambient floating gas particles ── */
function FloatingParticles({ count = 200, color = '#f58220', radius = 30, speed = 0.15 }) {
  const mesh = useRef();
  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * radius * 2;
      pos[i * 3 + 1] = Math.random() * radius * 0.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = Math.random() * 0.005 + 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      sz[i] = Math.random() * 0.3 + 0.05;
    }
    return { positions: pos, velocities: vel, sizes: sz };
  }, [count, radius]);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const posAttr = mesh.current.geometry.getAttribute('position');
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] += velocities[i * 3] * speed * 60 * delta;
      posAttr.array[i * 3 + 1] += velocities[i * 3 + 1] * speed * 60 * delta;
      posAttr.array[i * 3 + 2] += velocities[i * 3 + 2] * speed * 60 * delta;
      // Wrap around
      if (posAttr.array[i * 3 + 1] > radius * 0.6) {
        posAttr.array[i * 3 + 1] = 0;
        posAttr.array[i * 3] = (Math.random() - 0.5) * radius * 2;
        posAttr.array[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.15}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Slowly rotating glass shards ── */
function GlassShards({ count = 6 }) {
  const groupRef = useRef();
  const shards = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 16,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 16,
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      scale: Math.random() * 0.5 + 0.3,
      speed: (Math.random() - 0.5) * 0.2,
      yOffset: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      child.rotation.y += shards[i].speed * 0.005;
      child.rotation.x = Math.sin(t * 0.3 + shards[i].yOffset) * 0.2;
      child.position.y = shards[i].position[1] + Math.sin(t * 0.5 + shards[i].yOffset) * 0.3;
    });
  });

  return (
    <group ref={groupRef}>
      {shards.map((s, i) => (
        <mesh key={i} position={s.position} rotation={s.rotation} scale={s.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshPhysicalMaterial
            color="#00f2fe"
            metalness={0.1}
            roughness={0.05}
            transmission={0.85}
            thickness={0.5}
            transparent
            opacity={0.3}
            envMapIntensity={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ── Ambient volumetric light beams ── */
function LightBeams() {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(t * 0.2 + i * 1.5) * 0.3;
      child.material.opacity = 0.04 + Math.sin(t * 0.5 + i) * 0.02;
    });
  });

  return (
    <group ref={groupRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 8 - 8, 8, -5]} rotation={[0, 0, -0.3 + i * 0.3]}>
          <planeGeometry args={[0.8, 25]} />
          <meshBasicMaterial
            color={i === 1 ? '#f58220' : '#00f2fe'}
            transparent
            opacity={0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function DashboardBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      opacity: 0.7,
    }}>
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <FloatingParticles count={150} color="#f58220" radius={25} speed={0.1} />
        <FloatingParticles count={80} color="#00f2fe" radius={20} speed={0.08} />
        <GlassShards count={5} />
        <LightBeams />
        <fog attach="fog" args={['#0b0f17', 10, 40]} />
      </Canvas>
    </div>
  );
}
