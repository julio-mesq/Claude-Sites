"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Representação abstrata de energia e evolução física: núcleo pulsante, anéis orbitais
 * e uma hélice ascendente de partículas. Geometria procedural leve (sem modelos externos).
 */
function Core() {
  const mesh = useRef<THREE.Mesh>(null);
  const wire = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1.15, 4), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position!.array), [geo]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = geo.attributes.position!;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3]!, y = base[i * 3 + 1]!, z = base[i * 3 + 2]!;
      const n = 1 + 0.06 * Math.sin(x * 3 + t * 1.6) * Math.cos(y * 3 + t * 1.2) + 0.03 * Math.sin(z * 5 + t * 2);
      pos.setXYZ(i, x * n, y * n, z * n);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    if (mesh.current) mesh.current.rotation.y = t * 0.15;
    if (wire.current) {
      wire.current.rotation.y = -t * 0.1;
      wire.current.rotation.x = t * 0.05;
    }
  });
  return (
    <group>
      <mesh ref={mesh} geometry={geo}>
        <meshPhysicalMaterial color="#0d1410" emissive="#2b4a0e" emissiveIntensity={0.6} metalness={0.6} roughness={0.25} clearcoat={1} clearcoatRoughness={0.2} />
      </mesh>
      <mesh ref={wire} scale={1.32}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#B6FF3B" wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function Rings() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!g.current) return;
    g.current.children.forEach((c, i) => {
      c.rotation.z = t * (0.2 + i * 0.12) * (i % 2 ? -1 : 1);
    });
  });
  return (
    <group ref={g}>
      {[1.9, 2.3, 2.75].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2 + (i - 1) * 0.35, i * 0.4, 0]}>
          <torusGeometry args={[r, i === 1 ? 0.012 : 0.006, 8, 160]} />
          <meshBasicMaterial color={i === 1 ? "#B6FF3B" : "#77D63B"} transparent opacity={i === 1 ? 0.7 : 0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Helix({ count = 900 }) {
  const pts = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const k = i / count;
      const strand = i % 2 ? Math.PI : 0;
      const a = k * Math.PI * 10 + strand;
      const r = 2.1 + Math.sin(k * 20) * 0.08 + (Math.random() - 0.5) * 0.15;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = (k - 0.5) * 6;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [count]);
  useFrame(({ clock }) => {
    if (pts.current) pts.current.rotation.y = clock.getElapsedTime() * 0.25;
  });
  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#B6FF3B" transparent opacity={0.75} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Rig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.03;
    camera.position.y += (pointer.y * 0.4 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function EnergyCore() {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} aria-hidden>
      <ambientLight intensity={0.25} />
      <pointLight position={[4, 3, 5]} intensity={40} color="#B6FF3B" />
      <pointLight position={[-5, -2, -3]} intensity={25} color="#3BC8FF" />
      <directionalLight position={[0, 5, 2]} intensity={0.8} />
      <Core />
      <Rings />
      <Helix />
      <Rig />
    </Canvas>
  );
}
