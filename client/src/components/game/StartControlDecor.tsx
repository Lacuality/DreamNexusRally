import { useGLTF, Instances, Instance } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function StartControlDecor() {
  console.log("[StartControlDecor] Mounting - LIGHTWEIGHT VERSION");
  
  const { scene: safetyBarrier } = useGLTF("/models/safety-barrier.glb");
  const { scene: trafficCone } = useGLTF("/models/traffic-cone.glb");
  const { scene: spectators } = useGLTF("/models/spectators.glb");
  const { scene: startGate } = useGLTF("/models/start-gate.glb");

  const laneWidth = 5;
  const startLineZ = 1;

  const barrierGeometry = useMemo(() => {
    const mesh = safetyBarrier.children[0] as THREE.Mesh;
    return mesh?.geometry;
  }, [safetyBarrier]);

  const barrierMaterial = useMemo(() => {
    const mesh = safetyBarrier.children[0] as THREE.Mesh;
    return mesh?.material;
  }, [safetyBarrier]);

  const coneGeometry = useMemo(() => {
    const mesh = trafficCone.children[0] as THREE.Mesh;
    return mesh?.geometry;
  }, [trafficCone]);

  const coneMaterial = useMemo(() => {
    const mesh = trafficCone.children[0] as THREE.Mesh;
    return mesh?.material;
  }, [trafficCone]);

  const spectatorsGeometry = useMemo(() => {
    const mesh = spectators.children[0] as THREE.Mesh;
    return mesh?.geometry;
  }, [spectators]);

  const spectatorsMaterial = useMemo(() => {
    const mesh = spectators.children[0] as THREE.Mesh;
    return mesh?.material;
  }, [spectators]);

  const fogParticles = useMemo(() => {
    const particles = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: (Math.random() - 0.5) * (laneWidth + 4),
        y: 0.1 + Math.random() * 0.3,
        z: startLineZ - 3 + Math.random() * 8,
        scale: 0.5 + Math.random() * 1.0,
        speed: 0.1 + Math.random() * 0.2,
      });
    }
    return particles;
  }, [laneWidth, startLineZ]);
  
  const particleRefs = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    particleRefs.current.forEach((particle, index) => {
      if (particle) {
        const data = fogParticles[index];
        particle.position.y = data.y + Math.sin(time * data.speed + index) * 0.1;
        const material = particle.material as THREE.MeshBasicMaterial;
        if (material && 'opacity' in material) {
          material.opacity = 0.15 + Math.sin(time * 0.5 + index * 0.3) * 0.05;
        }
      }
    });
  });

  return (
    <group>
      {barrierGeometry && barrierMaterial && (
        <Instances geometry={barrierGeometry} material={barrierMaterial}>
          {[-1, 1].map((side) => (
            <group key={`barriers-${side}`}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Instance
                  key={`barrier-${side}-${i}`}
                  position={[side * (laneWidth / 2 + 0.8), 0, startLineZ + 2 - i * 1.5]}
                  scale={1.2}
                  rotation={[0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
                />
              ))}
            </group>
          ))}
        </Instances>
      )}

      {coneGeometry && coneMaterial && (
        <Instances geometry={coneGeometry} material={coneMaterial}>
          {[-1, 1].map((side) => (
            <group key={`cones-${side}`}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Instance
                  key={`cone-${side}-${i}`}
                  position={[side * (laneWidth / 2 + 0.3), 0, startLineZ + 3 - i * 1.2]}
                  scale={0.8}
                />
              ))}
            </group>
          ))}
        </Instances>
      )}

      <primitive 
        object={startGate} 
        position={[0, 0, startLineZ]} 
        scale={2.5}
        rotation={[0, 0, 0]}
      />

      {spectatorsGeometry && spectatorsMaterial && (
        <Instances geometry={spectatorsGeometry} material={spectatorsMaterial}>
          <Instance position={[-laneWidth / 2 - 4, 0, startLineZ - 5]} scale={1.3} />
          <Instance position={[laneWidth / 2 + 5, 0, startLineZ - 6]} scale={1.3} rotation={[0, Math.PI, 0]} />
        </Instances>
      )}

      {[-2, -1, 0, 1, 2].map((offset) => (
        <mesh 
          key={`skid-${offset}`}
          position={[offset * 0.6, 0.02, startLineZ - 1.5]} 
          rotation={[-Math.PI / 2, 0, 0.1]} 
          receiveShadow
        >
          <planeGeometry args={[0.15, 1.2]} />
          <meshStandardMaterial color="#1a1a1a" opacity={0.6} transparent />
        </mesh>
      ))}

      {fogParticles.map((particle, index) => (
        <mesh
          key={`fog-${index}`}
          ref={(el) => { if (el) particleRefs.current[index] = el; }}
          position={[particle.x, particle.y, particle.z]}
          rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
        >
          <planeGeometry args={[particle.scale * 2, particle.scale * 2]} />
          <meshBasicMaterial 
            color="#FFFFFF" 
            transparent 
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
