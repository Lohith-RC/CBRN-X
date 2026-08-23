import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

/* ── Procedural Glass Vehicle (armored SUV / response truck) ── */
function GlassVehicle({ position = [0, 0, 0] }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.08;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3, 0.8, 1.6]} />
        <meshPhysicalMaterial
          color="#1a3a5c"
          metalness={0.7}
          roughness={0.15}
          transmission={0.4}
          thickness={1.2}
          ior={1.5}
          transparent
          opacity={0.85}
          envMapIntensity={2}
        />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.3, 1.15, 0]} castShadow>
        <boxGeometry args={[1.8, 0.7, 1.5]} />
        <meshPhysicalMaterial
          color="#0ea5e9"
          metalness={0.1}
          roughness={0.05}
          transmission={0.75}
          thickness={0.8}
          ior={1.45}
          transparent
          opacity={0.6}
          envMapIntensity={3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Wheels */}
      {[[-1, 0, 0.85], [-1, 0, -0.85], [1, 0, 0.85], [1, 0, -0.85]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.2, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[1.52, 0.5, 0.5]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#f58220" emissive="#f58220" emissiveIntensity={3} />
      </mesh>
      <mesh position={[1.52, 0.5, -0.5]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#f58220" emissive="#f58220" emissiveIntensity={3} />
      </mesh>
      {/* Roof light bar */}
      <mesh position={[0.3, 1.52, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.3]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
      </mesh>
      {/* Front bumper / armor */}
      <mesh position={[1.55, 0.35, 0]}>
        <boxGeometry args={[0.12, 0.3, 1.8]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ── Laboratory Flask / Beaker with glowing liquid ── */
function LabFlask({ position = [0, 0, 0], color = '#00f2fe', scale = 1 }) {
  const liquidRef = useRef();

  useFrame((state) => {
    if (!liquidRef.current) return;
    liquidRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    liquidRef.current.material.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.5;
  });

  return (
    <group position={position} scale={scale}>
      {/* Flask body (glass) */}
      <mesh castShadow>
        <cylinderGeometry args={[0.35, 0.25, 0.9, 16, 1, true]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0}
          roughness={0.02}
          transmission={0.9}
          thickness={0.5}
          ior={1.52}
          transparent
          opacity={0.5}
          envMapIntensity={2}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Flask neck */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.4, 12, 1, true]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0}
          roughness={0.02}
          transmission={0.85}
          thickness={0.3}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Glowing liquid inside */}
      <mesh ref={liquidRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.28, 0.2, 0.4, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0.82, 0]}>
        <torusGeometry args={[0.12, 0.02, 8, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

/* ── Gas / Smoke Cloud Particle System ── */
function GasCloud({ position = [0, 0, 0], count = 120, color = '#f58220', radius = 2 }) {
  const meshRef = useRef();
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.random() * 2;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      vel[i * 3] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 1] = Math.random() * 0.015 + 0.005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.008;
    }
    return { positions: pos, velocities: vel };
  }, [count, radius]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.getAttribute('position');
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] += velocities[i * 3] * 60 * delta;
      posAttr.array[i * 3 + 1] += velocities[i * 3 + 1] * 60 * delta;
      posAttr.array[i * 3 + 2] += velocities[i * 3 + 2] * 60 * delta;
      if (posAttr.array[i * 3 + 1] > 3) {
        posAttr.array[i * 3 + 1] = 0;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef} position={position}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.12}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Chemical Drum with hazard markings ── */
function HazardDrum({ position = [0, 0, 0], leaking = false, onClick }) {
  const groupRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    if (!glowRef.current) return;
    const t = state.clock.elapsedTime;
    glowRef.current.material.emissiveIntensity = 2 + Math.sin(t * 4) * 1;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Drum body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.4, 1.0, 20]} />
        <meshStandardMaterial
          color={leaking ? '#eab308' : '#475569'}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 20]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Hazard band */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.41, 0.41, 0.15, 20, 1, true]} />
        <meshStandardMaterial color={leaking ? '#ef4444' : '#f59e0b'} emissive={leaking ? '#ef4444' : '#000'} emissiveIntensity={leaking ? 1.5 : 0} />
      </mesh>
      {/* Leak glow */}
      {leaking && (
        <mesh ref={glowRef} position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
}

/* ── Rotating 3D Shield Emblem ── */
function ShieldEmblem({ position = [0, 0, 0] }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7) * 0.1;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Shield shape - layered octagons */}
      <mesh castShadow>
        <octahedronGeometry args={[0.7, 0]} />
        <meshPhysicalMaterial
          color="#f58220"
          metalness={0.9}
          roughness={0.1}
          transmission={0.3}
          thickness={1}
          ior={1.8}
          transparent
          opacity={0.9}
          envMapIntensity={3}
        />
      </mesh>
      <mesh scale={0.85}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshPhysicalMaterial
          color="#00f2fe"
          metalness={0.2}
          roughness={0.05}
          transmission={0.6}
          thickness={0.5}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Core light */}
      <pointLight color="#f58220" intensity={3} distance={5} />
    </group>
  );
}

/* ── Scene Composition ── */
function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[8, 12, 8]} intensity={1.5} color="#f58220" castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={0.8} color="#00f2fe" />
      <pointLight position={[0, 3, 0]} intensity={2} color="#f58220" distance={15} />
      <pointLight position={[-4, 2, 4]} intensity={1.5} color="#00f2fe" distance={10} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0b0f17" roughness={0.9} metalness={0.1} />
      </mesh>
      <gridHelper args={[50, 50, '#1e293b', '#0f172a']} position={[0, -0.49, 0]} />

      {/* Main elements */}
      <GlassVehicle position={[2, -0.2, 2]} />
      <ShieldEmblem position={[-2, 2.5, 1]} />

      {/* Lab Equipment Cluster */}
      <LabFlask position={[-3.5, 0.1, -1]} color="#00f2fe" scale={1.1} />
      <LabFlask position={[-2.8, 0.1, -1.5]} color="#10b981" scale={0.9} />
      <LabFlask position={[-4.2, 0.1, -0.5]} color="#8b5cf6" scale={0.8} />

      {/* Chemical Drums */}
      <HazardDrum position={[0, 0, -2]} leaking={false} />
      <HazardDrum position={[1.2, 0, -2.5]} leaking={true} />
      <HazardDrum position={[-1, 0, -1.8]} leaking={false} />

      {/* Gas Effects */}
      <GasCloud position={[1.2, 0.5, -2.5]} count={100} color="#f58220" radius={1.5} />
      <GasCloud position={[-3.5, 1.0, -1]} count={50} color="#00f2fe" radius={0.8} />

      <fog attach="fog" args={['#0b0f17', 8, 35]} />
    </>
  );
}

/* ── Exported Hero Component ── */
export default function Hero3DScene() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '420px',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '28px',
      border: '1px solid rgba(245, 130, 32, 0.25)',
      boxShadow: '0 12px 48px rgba(245, 130, 32, 0.12), 0 0 80px rgba(0, 242, 254, 0.06)',
    }}>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 50 }}
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'linear-gradient(180deg, #0b0f17 0%, #0f1729 100%)' }}
      >
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </Canvas>

      {/* Overlay HUD */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '32px 28px 24px',
        background: 'linear-gradient(transparent, rgba(11, 15, 23, 0.95))',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <div>
          <div style={{
            fontSize: '0.7rem',
            fontWeight: '700',
            color: '#f58220',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            Immersive 3D Environment
          </div>
          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: '900',
            color: '#fff',
            lineHeight: 1.2,
            textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          }}>
            CBRS-X Command Center
          </h2>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.7)',
            marginTop: '4px',
            maxWidth: '500px',
          }}>
            High-fidelity 3D assets — glass response vehicle, laboratory equipment, and real-time hazard gas simulation
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          pointerEvents: 'auto',
        }}>
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(245, 130, 32, 0.15)',
            border: '1px solid rgba(245, 130, 32, 0.3)',
            color: '#f58220',
            fontSize: '0.72rem',
            fontWeight: '600',
          }}>
            WebGL Rendered
          </div>
          <div style={{
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            color: '#00f2fe',
            fontSize: '0.72rem',
            fontWeight: '600',
          }}>
            60 FPS
          </div>
        </div>
      </div>
    </div>
  );
}
