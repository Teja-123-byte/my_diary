import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial, Sparkles, RoundedBox, Icosahedron, Torus } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";

/**
 * Warm pastel 3D scene for the login page.
 * Floating squishy diary, pencil, heart, ribbon — playful and inviting.
 */

function SquishyBlob({ position, color, speed = 1, distort = 0.4 }: { position: [number, number, number]; color: string; speed?: number; distort?: number }) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.getElapsedTime() * 0.15 * speed;
    ref.current.rotation.y = state.clock.getElapsedTime() * 0.2 * speed;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={ref} position={position} castShadow>
        <sphereGeometry args={[0.9, 64, 64]} />
        <MeshDistortMaterial color={color} distort={distort} speed={2} roughness={0.25} metalness={0.05} />
      </mesh>
    </Float>
  );
}

function DiaryBook() {
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.8}>
      <group position={[0, 0.1, 0]} rotation={[0.3, -0.4, 0.1]}>
        {/* Book body */}
        <RoundedBox args={[1.6, 2, 0.35]} radius={0.08} smoothness={6} castShadow>
          <meshStandardMaterial color="#f08a6e" roughness={0.55} />
        </RoundedBox>
        {/* Pages */}
        <RoundedBox args={[1.55, 1.95, 0.25]} radius={0.04} smoothness={4} position={[0.02, 0, 0.06]}>
          <meshStandardMaterial color="#fdf6e3" roughness={0.9} />
        </RoundedBox>
        {/* Spine accent */}
        <mesh position={[-0.78, 0, 0.05]}>
          <boxGeometry args={[0.06, 1.95, 0.36]} />
          <meshStandardMaterial color="#c9583f" roughness={0.5} />
        </mesh>
        {/* Bookmark ribbon */}
        <mesh position={[0.45, -0.6, 0.2]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[0.12, 1.6, 0.02]} />
          <meshStandardMaterial color="#b388eb" roughness={0.4} />
        </mesh>
      </group>
    </Float>
  );
}

function FloatingPencil({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={2} rotationIntensity={1.2} floatIntensity={1.5}>
      <group position={position} rotation={[0.4, 0.6, 0.8]}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 1.6, 24]} />
          <meshStandardMaterial color="#fcd29f" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <coneGeometry args={[0.12, 0.25, 24]} />
          <meshStandardMaterial color="#3a2a20" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.85, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.18, 24]} />
          <meshStandardMaterial color="#f08a6e" roughness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

export default function FloatingScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.1} castShadow />
        <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#b388eb" />

        <DiaryBook />
        <SquishyBlob position={[-2.6, 1.4, -0.5]} color="#ffb3a7" speed={0.8} distort={0.45} />
        <SquishyBlob position={[2.7, 1.1, -1]} color="#b9e8c8" speed={1} distort={0.35} />
        <SquishyBlob position={[2.2, -1.5, 0.3]} color="#fcd29f" speed={1.2} distort={0.5} />
        <SquishyBlob position={[-2.4, -1.2, 0.2]} color="#d4b8ff" speed={0.9} distort={0.4} />

        <FloatingPencil position={[-1.9, -0.2, 1.2]} />

        <Float speed={1.6} rotationIntensity={1} floatIntensity={1}>
          <Torus args={[0.45, 0.14, 24, 64]} position={[2.4, -0.2, 1.3]} rotation={[0.5, 0.3, 0]}>
            <meshStandardMaterial color="#ff8fa3" roughness={0.35} metalness={0.1} />
          </Torus>
        </Float>

        <Float speed={2.2} rotationIntensity={1.4} floatIntensity={1.4}>
          <Icosahedron args={[0.35, 0]} position={[-3, 0.4, 1.6]}>
            <meshStandardMaterial color="#a0e7e5" roughness={0.3} flatShading />
          </Icosahedron>
        </Float>

        <Sparkles count={60} scale={[10, 6, 4]} size={2.5} speed={0.4} color="#ffd6a5" />

        <Environment preset="apartment" />
      </Suspense>
    </Canvas>
  );
}
