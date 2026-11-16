import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

class WebGLBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return this.props.fallback || null;
    return this.props.children;
  }
}

function StructuralGridMesh({ isDark }) {
  const groupRef = useRef(null);
  const ringsRef = useRef(null);

  const primaryColor = isDark ? '#34d399' : '#248b63';
  const secondaryColor = isDark ? '#60a5fa' : '#3b82f6';
  const lineColor = isDark ? '#334155' : '#cbd5e1';

  const pillars = useMemo(
    () => [
      [-1.4, 0, -1.4],
      [1.4, 0, -1.4],
      [-1.4, 0, 1.4],
      [1.4, 0, 1.4]
    ],
    []
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.22;
      const targetX = state.pointer.y * 0.22;
      const targetZ = -state.pointer.x * 0.14;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.28 + targetX, dt * 3.5);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetZ, dt * 3.5);
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z -= dt * 0.3;
    }
  });

  return (
    <group>
      <group ref={groupRef} position={[0, -0.1, 0]}>
        {[-0.9, -0.3, 0.3, 0.9].map((y, idx) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[2.9 - idx * 0.22, 0.08, 2.9 - idx * 0.22]} />
            <meshBasicMaterial
              color={idx === 3 ? primaryColor : lineColor}
              wireframe
              transparent
              opacity={isDark ? 0.42 : 0.55}
            />
          </mesh>
        ))}
        {pillars.map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <cylinderGeometry args={[0.03, 0.03, 2.2, 8]} />
            <meshBasicMaterial color={secondaryColor} transparent opacity={0.45} />
          </mesh>
        ))}
        <mesh position={[0, 0.05, 0]}>
          <octahedronGeometry args={[0.62, 1]} />
          <meshBasicMaterial color={primaryColor} wireframe transparent opacity={0.65} />
        </mesh>
      </group>
      <group ref={ringsRef} rotation={[Math.PI / 2.4, 0, 0]}>
        <mesh>
          <torusGeometry args={[3.1, 0.015, 8, 72]} />
          <meshBasicMaterial color={primaryColor} transparent opacity={0.25} />
        </mesh>
      </group>
    </group>
  );
}

export function LoginBackground3D({ isDark }) {
  return (
    <div className="auth-canvas-bg" aria-hidden="true">
      <WebGLBoundary fallback={null}>
        <Canvas camera={{ position: [0, 0.8, 6.2], fov: 44 }} dpr={[1, 1.75]}>
          <StructuralGridMesh isDark={isDark} />
        </Canvas>
      </WebGLBoundary>
    </div>
  );
}

function PreloaderBuilding3D({ progress, isDark }) {
  const rootRef = useRef(null);
  const accent = isDark ? '#34d399' : '#248b63';
  const accentBlue = isDark ? '#60a5fa' : '#3b82f6';
  const frameCol = isDark ? '#475569' : '#94a3b8';

  const floors = [-1.1, -0.45, 0.2, 0.85];

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (rootRef.current) {
      rootRef.current.rotation.y += dt * 0.95;
      rootRef.current.rotation.x = 0.28 + Math.sin(performance.now() * 0.002) * 0.05;
    }
  });

  return (
    <group ref={rootRef}>
      {floors.map((y, idx) => {
        const threshold = (idx + 1) * 20;
        const active = progress >= threshold - 12;
        const scale = active ? Math.min(1, Math.max(0.2, (progress - threshold + 20) / 22)) : 0.01;
        const size = 2.1 - idx * 0.2;
        return (
          <group key={y} position={[0, y * scale, 0]} scale={[scale, scale, scale]}>
            <mesh>
              <boxGeometry args={[size, 0.14, size]} />
              <meshBasicMaterial color={idx === 3 ? accent : frameCol} wireframe transparent opacity={0.85} />
            </mesh>
            <mesh>
              <boxGeometry args={[size * 0.92, 0.1, size * 0.92]} />
              <meshBasicMaterial color={idx % 2 === 0 ? accent : accentBlue} transparent opacity={0.14} />
            </mesh>
          </group>
        );
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.0, 0.025, 10, 64]} />
        <meshBasicMaterial color={accent} transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 3, Math.PI / 5, 0]}>
        <torusGeometry args={[2.35, 0.015, 8, 64]} />
        <meshBasicMaterial color={accentBlue} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export function Preloader3D({ onDone, isDark, logo }) {
  const [pct, setPct] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 320 : 1450;
    const start = performance.now();
    let rafId = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setPct(Math.round(eased * 100));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setExiting(true);
        setTimeout(() => onDone(), reduced ? 120 : 420);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onDone]);

  const stageLabel =
    pct < 35
      ? 'Carregando carteira de obras...'
      : pct < 75
        ? 'Sincronizando telemetria & CRM...'
        : 'Finalizando Cockpit LR Engenharia...';

  return (
    <div className={`preloader-overlay ${exiting ? 'exiting' : ''}`} aria-label="Carregando painel">
      <div style={{ width: 240, height: 220, marginBottom: 8 }}>
        <WebGLBoundary fallback={<div style={{ height: 220, display: 'grid', placeItems: 'center', fontSize: 42 }}>📐</div>}>
          <Canvas camera={{ position: [0, 0.6, 5.1], fov: 42 }} dpr={[1, 2]}>
            <PreloaderBuilding3D progress={pct} isDark={isDark} />
          </Canvas>
        </WebGLBoundary>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {logo && <img src={logo} alt="LR Engenharia" className="brand-logo" style={{ width: 32, height: 32 }} />}
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>LR Engenharia</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--ac)' }}>{pct}%</span>
      </div>

      <progress
        className="sky-progress"
        value={pct}
        max="100"
        aria-labelledby="preloader-status-label"
      />
      <div
        id="preloader-status-label"
        role="status"
        aria-live="polite"
        style={{ marginTop: 10, fontSize: 12.5, color: 'var(--mu)', fontWeight: 500 }}
      >
        {stageLabel}
      </div>
    </div>
  );
}
