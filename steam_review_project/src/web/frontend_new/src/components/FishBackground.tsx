import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FishBoid {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  offset: number;
  meshRef: React.RefObject<THREE.Group | null>;
  tailRef: React.RefObject<THREE.Mesh | null>;
}

interface FishBackgroundProps {
  gestureCoords?: { x: number; y: number };
  isGestureActive?: boolean;
}

function BoidsSchool({ gestureCoords = { x: 0, y: 0 }, isGestureActive = false }: FishBackgroundProps) {
  const count = 12;

  // Initialize boids state once
  const boids = useMemo(() => {
    const arr: FishBoid[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 1.5
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 0.5
        ),
        acceleration: new THREE.Vector3(),
        offset: Math.random() * Math.PI * 2,
        meshRef: React.createRef<THREE.Group>(),
        tailRef: React.createRef<THREE.Mesh>()
      });
    }
    return arr;
  }, []);

  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const { viewport } = state;

    // Use gesture coordinates if active, otherwise mouse coordinates
    const px = isGestureActive ? gestureCoords.x * 2.0 : pointerRef.current.x;
    const py = isGestureActive ? gestureCoords.y * 2.0 : pointerRef.current.y;

    // Project target to world space
    const targetX = (px * viewport.width) / 2;
    const targetY = (py * viewport.height) / 2;
    const mouseTarget = new THREE.Vector3(targetX, targetY, 0);

    // Camera parallax rotation and position shift
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, px * 2.0, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, py * 1.5, 0.05);
    state.camera.lookAt(0, 0, 0);

    const LIMIT_X = viewport.width / 2 + 1.2;
    const LIMIT_Y = viewport.height / 2 + 1.2;

    boids.forEach((boid) => {
      boid.acceleration.set(0, 0, 0);

      // 1. Mouse attraction (Seek) with smooth distance-based scaling
      const toMouse = new THREE.Vector3().subVectors(mouseTarget, boid.position);
      const distToMouse = toMouse.length();
      if (distToMouse > 0.1) {
        toMouse.normalize().multiplyScalar(1.2);
        boid.acceleration.add(toMouse);
      }

      // 2. Separation, Alignment, Cohesion forces
      const sep = new THREE.Vector3();
      const align = new THREE.Vector3();
      const coh = new THREE.Vector3();
      let neighborCount = 0;

      boids.forEach((other) => {
        if (other === boid) return;
        const dist = boid.position.distanceTo(other.position);

        // Separation
        if (dist < 1.0 && dist > 0) {
          const diff = new THREE.Vector3()
            .subVectors(boid.position, other.position)
            .normalize()
            .divideScalar(dist);
          sep.add(diff);
        }

        // Alignment & Cohesion neighbors
        if (dist < 3.0) {
          align.add(other.velocity);
          coh.add(other.position);
          neighborCount++;
        }
      });

      if (neighborCount > 0) {
        align.divideScalar(neighborCount).normalize().multiplyScalar(0.7);
        boid.acceleration.add(align);

        coh.divideScalar(neighborCount).sub(boid.position).normalize().multiplyScalar(0.5);
        boid.acceleration.add(coh);
      }

      sep.multiplyScalar(2.0);
      boid.acceleration.add(sep);

      // 3. Wander / Noise
      const wander = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.1
      );
      boid.acceleration.add(wander);

      // 4. Boundary steering (steer back if out of bounds)
      if (Math.abs(boid.position.x) > LIMIT_X || Math.abs(boid.position.y) > LIMIT_Y) {
        const center = new THREE.Vector3(0, 0, 0);
        const steerBack = center.sub(boid.position).normalize().multiplyScalar(2.0);
        boid.acceleration.add(steerBack);
      }

      // 5. Update physics
      boid.velocity.add(boid.acceleration.multiplyScalar(dt));
      boid.velocity.clampLength(1.5, 3.5); // Min/Max Speed bounds
      boid.position.add(boid.velocity.clone().multiplyScalar(dt));

      // 6. Update mesh position and orientation
      const mesh = boid.meshRef.current;
      if (mesh) {
        mesh.position.copy(boid.position);

        // Point mesh in direction of velocity
        const targetDir = boid.position.clone().add(boid.velocity);
        mesh.lookAt(targetDir);
      }

      // 7. Wiggle tail based on current speed
      const tail = boid.tailRef.current;
      if (tail) {
        const speed = boid.velocity.length();
        tail.rotation.y = Math.sin(state.clock.getElapsedTime() * (speed * 4) + boid.offset) * 0.35;
      }
    });
  });

  return (
    <>
      {boids.map((boid, idx) => (
        <group key={idx} ref={boid.meshRef as any}>
          {/* Main Body (Stretched diamond/4-sided cone) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.7, 4]} />
            <meshBasicMaterial 
              color="#a78bfa" // Theme purple
              wireframe 
              transparent 
              opacity={0.12} 
            />
          </mesh>
          
          {/* Small tail connector/fin */}
          <group position={[0, 0, -0.4]}>
            <mesh ref={boid.tailRef as any} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.08, 0.25, 4]} />
              <meshBasicMaterial 
                color="#818cf8" // Indigo/blue
                wireframe 
                transparent 
                opacity={0.1} 
              />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}

export function FishBackground({ gestureCoords = { x: 0, y: 0 }, isGestureActive = false }: FishBackgroundProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-black/40">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <BoidsSchool gestureCoords={gestureCoords} isGestureActive={isGestureActive} />
      </Canvas>
    </div>
  );
}
