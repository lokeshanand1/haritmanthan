import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, Sparkles, MeshDistortMaterial, MeshWobbleMaterial, Torus, Sphere, Cylinder, Box, Ring } from '@react-three/drei';

/* ─── Orbiting particles ring component ─── */
function OrbitingParticles({ count = 30, radius = 2, color = '#10b981', speed = 1, size = 0.06 }) {
  const ref = useRef();
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const y = (Math.random() - 0.5) * 1.5;
      arr.push({ angle, y, r: radius + (Math.random() - 0.5) * 0.5, speed: speed * (0.5 + Math.random()) });
    }
    return arr;
  }, [count, radius, speed]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const children = ref.current.children;
    particles.forEach((p, i) => {
      if (children[i]) {
        const a = p.angle + t * p.speed;
        children[i].position.set(Math.cos(a) * p.r, p.y + Math.sin(t * 2 + i) * 0.15, Math.sin(a) * p.r);
      }
    });
  });

  return (
    <group ref={ref}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[size, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Pulsing glow ring ─── */
function PulsingRing({ radius = 2, color = '#10b981', speed = 1 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * speed) * 0.15;
    ref.current.scale.set(s, s, s);
    ref.current.material.opacity = 0.3 + Math.sin(t * speed * 2) * 0.2;
  });
  return (
    <Ring ref={ref} args={[radius - 0.03, radius + 0.03, 64]}>
      <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
    </Ring>
  );
}

/* ═══════════════════════════════════════════
   TREE MODEL — Glowing crystal ecosystem
   ═══════════════════════════════════════════ */
export function TreeModel() {
  const group = useRef();
  const trunk = useRef();
  const canopy = useRef();
  const rings = useRef();
  const [active, setActive] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Trunk sways gently
    if (trunk.current) {
      trunk.current.rotation.z = Math.sin(t * 0.8) * 0.03;
    }

    // Canopy breathes and sways
    if (canopy.current) {
      const breath = 1 + Math.sin(t * 1.5) * 0.04;
      canopy.current.scale.set(breath, breath, breath);
      canopy.current.rotation.y = t * (active ? 0.5 : 0.1);
      canopy.current.rotation.z = Math.sin(t * 0.6) * 0.05;
    }

    // Rings orbit
    if (rings.current) {
      rings.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.7) * 0.25;
      rings.current.rotation.z = Math.cos(t * 0.5) * 0.15;
    }

    // Group float
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.8) * 0.1;
      const ts = active ? 1.3 : 1;
      group.current.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.05);
    }
  });

  return (
    <group ref={group} onClick={() => setActive(!active)} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>

      {/* ── Trunk ── */}
      <group ref={trunk}>
        <Cylinder args={[0.15, 0.25, 2.5, 12]} position={[0, -0.5, 0]}>
          <meshStandardMaterial
            color="#7c3f1e"
            roughness={0.9}
            emissive="#3d1f0d"
            emissiveIntensity={active ? 0.8 : 0.2}
          />
        </Cylinder>
        {/* Roots / base flare */}
        <Cylinder args={[0.3, 0.35, 0.3, 12]} position={[0, -1.6, 0]}>
          <meshStandardMaterial color="#5c2d0e" roughness={1} />
        </Cylinder>
      </group>

      {/* ── Canopy — layered spheres for fullness ── */}
      <group ref={canopy}>
        {/* Main canopy blob */}
        <Sphere args={[1.1, 24, 24]} position={[0, 1.5, 0]}>
          <MeshDistortMaterial
            color={active ? '#22c55e' : '#16a34a'}
            emissive={active ? '#059669' : '#15803d'}
            emissiveIntensity={active ? 3 : 1.2}
            distort={active ? 0.35 : 0.15}
            speed={active ? 5 : 2}
            roughness={0.6}
          />
        </Sphere>
        {/* Upper canopy layer */}
        <Sphere args={[0.8, 20, 20]} position={[0, 2.3, 0]}>
          <MeshDistortMaterial
            color={active ? '#34d399' : '#22c55e'}
            emissive="#047857"
            emissiveIntensity={active ? 2 : 0.8}
            distort={active ? 0.3 : 0.12}
            speed={active ? 4 : 1.5}
            roughness={0.5}
          />
        </Sphere>
        {/* Side canopy */}
        <Sphere args={[0.7, 16, 16]} position={[-0.6, 1.6, 0.3]}>
          <MeshDistortMaterial
            color="#15803d"
            emissive="#047857"
            emissiveIntensity={active ? 1.5 : 0.5}
            distort={0.15}
            speed={2}
            roughness={0.7}
          />
        </Sphere>
        <Sphere args={[0.65, 16, 16]} position={[0.5, 1.4, -0.4]}>
          <MeshDistortMaterial
            color="#16a34a"
            emissive="#047857"
            emissiveIntensity={active ? 1.5 : 0.5}
            distort={0.15}
            speed={2}
            roughness={0.7}
          />
        </Sphere>
      </group>

      {/* ── Holographic rings around the tree ── */}
      <group ref={rings} position={[0, 1, 0]}>
        <PulsingRing radius={2} color="#34d399" speed={1} />
        <group rotation={[0, 0, Math.PI / 6]}>
          <PulsingRing radius={2.4} color="#6ee7b7" speed={1.5} />
        </group>
        <group rotation={[Math.PI / 4, 0, 0]}>
          <PulsingRing radius={2.8} color="#a7f3d0" speed={0.7} />
        </group>
      </group>

      {/* ── Orbiting leaf particles ── */}
      <OrbitingParticles count={35} radius={2.2} color="#34d399" speed={active ? 2 : 0.6} size={active ? 0.07 : 0.04} />

      {/* ── Sparkle leaves / ambient dust ── */}
      <Sparkles count={100} scale={5} size={active ? 6 : 3} speed={active ? 1.5 : 0.5} opacity={0.7} color="#a7f3d0" position={[0, 1, 0]} />
    </group>
  );
}

/* ═══════════════════════════════════════════
   BENCH MODEL — Floating holographic surface
   ═══════════════════════════════════════════ */
export function BenchModel() {
  const group = useRef();
  const slab = useRef();
  const scanner = useRef();
  const [active, setActive] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Slab gentle wobble
    if (slab.current) {
      slab.current.rotation.z = Math.sin(t) * 0.03;
      slab.current.position.y = Math.sin(t * 1.5) * 0.05;
    }

    // Scanner beam sweeps
    if (scanner.current) {
      scanner.current.position.z = Math.sin(t * 2) * 0.6;
      scanner.current.material.opacity = 0.4 + Math.sin(t * 4) * 0.3;
    }

    if (group.current) {
      group.current.rotation.y += active ? 0.02 : 0.005;
      const ts = active ? 1.3 : 1;
      group.current.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.05);
    }
  });

  return (
    <group ref={group} onClick={() => setActive(!active)} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.8}>

        {/* Holographic bench slab */}
        <group ref={slab}>
          <Box args={[3, 0.12, 1.2]}>
            <meshPhysicalMaterial
              color="#3b82f6"
              emissive="#1d4ed8"
              emissiveIntensity={active ? 3 : 1.5}
              transparent
              opacity={0.7}
              clearcoat={1}
              clearcoatRoughness={0}
              metalness={0.9}
              roughness={0.1}
            />
          </Box>

          {/* Leg pillars — glowing */}
          {[[-1.2, -0.5, 0], [1.2, -0.5, 0]].map((pos, i) => (
            <Cylinder key={i} args={[0.06, 0.06, 1, 8]} position={pos}>
              <meshBasicMaterial color={active ? '#60a5fa' : '#93c5fd'} transparent opacity={0.7} />
            </Cylinder>
          ))}

          {/* Scanner beam across the surface */}
          <mesh ref={scanner} position={[0, 0.08, 0]}>
            <boxGeometry args={[3.2, 0.01, 0.02]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
          </mesh>
        </group>

        {/* Base ring */}
        <Torus args={[2, 0.02, 16, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
          <meshBasicMaterial color="#3b82f6" transparent opacity={active ? 0.8 : 0.4} />
        </Torus>

        <OrbitingParticles count={25} radius={2.2} color="#60a5fa" speed={active ? 1.5 : 0.5} size={0.04} />
        <Sparkles count={60} scale={5} size={active ? 5 : 2} speed={active ? 1.5 : 0.5} opacity={0.5} color="#bfdbfe" />

      </Float>
    </group>
  );
}

/* ═══════════════════════════════════════════
   AIR MODEL — Breathing atmosphere sphere
   ═══════════════════════════════════════════ */
export function AirModel() {
  const group = useRef();
  const innerSphere = useRef();
  const outerSphere = useRef();
  const [active, setActive] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Inner sphere breathes
    if (innerSphere.current) {
      const breath = 1 + Math.sin(t * 1.5) * 0.12;
      innerSphere.current.scale.set(breath, breath, breath);
      innerSphere.current.rotation.y = t * 0.3;
    }

    // Outer sphere counter-rotates
    if (outerSphere.current) {
      outerSphere.current.rotation.y = -t * 0.15;
      outerSphere.current.rotation.x = Math.sin(t * 0.4) * 0.2;
    }

    if (group.current) {
      group.current.position.y = Math.sin(t) * 0.1;
      const ts = active ? 1.3 : 1;
      group.current.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.05);
    }
  });

  return (
    <group ref={group} onClick={() => setActive(!active)} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>

      {/* Inner translucent atmosphere */}
      <Sphere ref={innerSphere} args={[0.9, 32, 32]}>
        <MeshDistortMaterial
          color="#94a3b8"
          emissive="#475569"
          emissiveIntensity={active ? 2 : 0.8}
          transparent
          opacity={0.35}
          distort={active ? 0.6 : 0.2}
          speed={active ? 6 : 2}
          roughness={0}
          metalness={0.5}
        />
      </Sphere>

      {/* Outer wireframe atmosphere shell */}
      <Sphere ref={outerSphere} args={[1.4, 16, 16]}>
        <meshBasicMaterial color="#cbd5e1" wireframe transparent opacity={0.15} />
      </Sphere>

      {/* Wind current rings */}
      <group rotation={[Math.PI / 3, 0, 0]}>
        <PulsingRing radius={1.6} color="#94a3b8" speed={2} />
      </group>
      <group rotation={[0, 0, Math.PI / 4]}>
        <PulsingRing radius={1.9} color="#64748b" speed={1.2} />
      </group>

      <OrbitingParticles count={50} radius={1.5} color={active ? '#38bdf8' : '#94a3b8'} speed={active ? 3 : 1} size={0.04} />
      <Sparkles count={120} scale={6} size={active ? 4 : 2} speed={active ? 4 : 1.5} opacity={0.6} color="#e2e8f0" />
    </group>
  );
}

/* ═══════════════════════════════════════════
   POND MODEL — Rippling water disc
   ═══════════════════════════════════════════ */
export function PondModel() {
  const group = useRef();
  const water = useRef();
  const ripple1 = useRef();
  const ripple2 = useRef();
  const [active, setActive] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Water surface wobbles
    if (water.current) {
      water.current.rotation.y = t * 0.1;
    }

    // Expanding ripple rings
    if (ripple1.current) {
      const s1 = 1 + (t % 3) / 3;
      ripple1.current.scale.set(s1, s1, s1);
      ripple1.current.material.opacity = Math.max(0, 0.6 - (t % 3) / 3 * 0.6);
    }
    if (ripple2.current) {
      const s2 = 1 + ((t + 1.5) % 3) / 3;
      ripple2.current.scale.set(s2, s2, s2);
      ripple2.current.material.opacity = Math.max(0, 0.6 - ((t + 1.5) % 3) / 3 * 0.6);
    }

    if (group.current) {
      const ts = active ? 1.2 : 1;
      group.current.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.05);
    }
  });

  return (
    <group ref={group} position={[0, -0.5, 0]} onClick={() => setActive(!active)} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
      <Float speed={1} rotationIntensity={0} floatIntensity={0.3}>

        {/* Water surface */}
        <Cylinder ref={water} args={[2.5, 2.5, 0.15, 64]}>
          <MeshDistortMaterial
            color={active ? '#0284c7' : '#0ea5e9'}
            emissive="#075985"
            emissiveIntensity={active ? 2 : 0.8}
            transparent
            opacity={0.7}
            distort={active ? 0.5 : 0.2}
            speed={active ? 5 : 2}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.8}
            roughness={0}
          />
        </Cylinder>

        {/* Expanding ripple rings */}
        <Torus ref={ripple1} args={[2, 0.02, 8, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.5} />
        </Torus>
        <Torus ref={ripple2} args={[2, 0.02, 8, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <meshBasicMaterial color="#bae6fd" transparent opacity={0.5} />
        </Torus>

        {/* Outer border ring */}
        <Torus args={[2.8, 0.03, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
        </Torus>

        <OrbitingParticles count={30} radius={2.8} color="#7dd3fc" speed={0.6} size={0.04} />
        <Sparkles count={60} scale={5} size={5} speed={1.5} opacity={0.6} color="#bae6fd" position={[0, 1, 0]} />

      </Float>
    </group>
  );
}

/* ═══════════════════════════════════════════
   ENERGY MODEL — Pulsing solar crystal
   ═══════════════════════════════════════════ */
export function EnergyModel() {
  const group = useRef();
  const crystal = useRef();
  const outerCrystal = useRef();
  const [active, setActive] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Crystal spins and pulses
    if (crystal.current) {
      crystal.current.rotation.y = t * (active ? 2 : 0.6);
      crystal.current.rotation.x = t * 0.3;
      const pulse = 1 + Math.sin(t * 3) * 0.06;
      crystal.current.scale.set(pulse, pulse, pulse);
    }

    // Outer shell counter-rotates
    if (outerCrystal.current) {
      outerCrystal.current.rotation.y = -t * 0.3;
      outerCrystal.current.rotation.z = t * 0.2;
    }

    if (group.current) {
      group.current.position.y = Math.sin(t * 1.2) * 0.1;
      const ts = active ? 1.4 : 1;
      group.current.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.05);
    }
  });

  return (
    <group ref={group} onClick={() => setActive(!active)} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>

      {/* Inner glowing crystal */}
      <mesh ref={crystal}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshPhysicalMaterial
          color="#fbbf24"
          emissive="#d97706"
          emissiveIntensity={active ? 5 : 2.5}
          transparent
          opacity={0.85}
          clearcoat={1}
          clearcoatRoughness={0}
          metalness={0.9}
          roughness={0.05}
        />
      </mesh>

      {/* Outer wireframe shell */}
      <mesh ref={outerCrystal}>
        <octahedronGeometry args={[1.3, 0]} />
        <meshBasicMaterial color="#fcd34d" wireframe transparent opacity={active ? 0.5 : 0.25} />
      </mesh>

      {/* Energy rings */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <PulsingRing radius={1.6} color="#f59e0b" speed={3} />
      </group>
      <group rotation={[0, 0, Math.PI / 3]}>
        <PulsingRing radius={1.9} color="#fbbf24" speed={2} />
      </group>
      <group rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <PulsingRing radius={2.2} color="#fcd34d" speed={1.5} />
      </group>

      <OrbitingParticles count={35} radius={1.8} color="#fcd34d" speed={active ? 3 : 1} size={active ? 0.07 : 0.05} />
      <Sparkles count={150} scale={5} size={active ? 8 : 4} speed={active ? 5 : 2} opacity={0.9} color="#fef08a" />
    </group>
  );
}
