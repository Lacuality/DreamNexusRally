import { useGLTF, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function StartControl() {
  const { scene: startArch } = useGLTF("/models/start-arch.glb");
  const { scene: safetyBarrier } = useGLTF("/models/safety-barrier.glb");
  const { scene: trafficCone } = useGLTF("/models/traffic-cone.glb");
  const { scene: timingDisplay } = useGLTF("/models/timing-display.glb");
  const { scene: controlTent } = useGLTF("/models/control-tent.glb");
  const { scene: marshalClipboard } = useGLTF("/models/marshal-clipboard.glb");
  const { scene: marshalRadio } = useGLTF("/models/marshal-radio.glb");
  const { scene: spectators } = useGLTF("/models/spectators.glb");
  const { scene: serviceVan } = useGLTF("/models/service-van.glb");
  
  const startSignRef = useRef<THREE.Mesh>(null);
  const lightBeamRefs = useRef<THREE.Mesh[]>([]);

  const models = useMemo(() => {
    return {
      startArch: startArch.clone(),
      safetyBarrier: safetyBarrier.clone(),
      trafficCone: trafficCone.clone(),
      timingDisplay: timingDisplay.clone(),
      controlTent: controlTent.clone(),
      marshalClipboard: marshalClipboard.clone(),
      marshalRadio: marshalRadio.clone(),
      spectators: spectators.clone(),
      serviceVan: serviceVan.clone(),
    };
  }, [startArch, safetyBarrier, trafficCone, timingDisplay, controlTent, marshalClipboard, marshalRadio, spectators, serviceVan]);

  const laneWidth = 5;
  const startLineZ = 1;
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (startSignRef.current) {
      const material = startSignRef.current.material as THREE.MeshStandardMaterial;
      if (material && 'emissiveIntensity' in material) {
        material.emissiveIntensity = 0.8 + Math.sin(time * 3) * 0.2;
      }
    }
    
    lightBeamRefs.current.forEach((beam, index) => {
      if (beam) {
        const offset = index * 0.5;
        const material = beam.material as THREE.MeshBasicMaterial;
        if (material && 'opacity' in material) {
          material.opacity = 0.3 + Math.sin(time * 2 + offset) * 0.15;
        }
      }
    });
  });

  return (
    <group>
      <primitive 
        object={models.startArch} 
        position={[0, 0, startLineZ]} 
        scale={3.5}
      />

      <primitive 
        object={models.timingDisplay} 
        position={[-laneWidth / 2 - 1.5, 0, startLineZ - 1]} 
        scale={1.2}
        rotation={[0, Math.PI / 4, 0]}
      />
      
      <primitive 
        object={models.timingDisplay.clone()} 
        position={[laneWidth / 2 + 1.5, 0, startLineZ - 1]} 
        scale={1.2}
        rotation={[0, -Math.PI / 4, 0]}
      />

      {[-1, 1].map((side, idx) => (
        <group key={`barriers-${side}`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <primitive
              key={`barrier-${side}-${i}`}
              object={models.safetyBarrier.clone()}
              position={[side * (laneWidth / 2 + 0.8), 0, startLineZ + 2 - i * 1.5]}
              scale={1.2}
              rotation={[0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            />
          ))}
        </group>
      ))}

      {[-1, 1].map((side, idx) => (
        <group key={`cones-${side}`}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <primitive
              key={`cone-${side}-${i}`}
              object={models.trafficCone.clone()}
              position={[side * (laneWidth / 2 + 0.3), 0, startLineZ + 3 - i * 1.2]}
              scale={0.8}
            />
          ))}
        </group>
      ))}

      <primitive 
        object={models.controlTent} 
        position={[laneWidth / 2 + 3.5, 0, startLineZ - 2]} 
        scale={2.0}
      />

      <mesh position={[laneWidth / 2 + 3.5, 0.5, startLineZ - 2]} receiveShadow>
        <boxGeometry args={[1.2, 0.8, 0.6]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      <mesh position={[laneWidth / 2 + 4.2, 0.3, startLineZ - 2.5]} receiveShadow>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[laneWidth / 2 + 4.2, 0.3, startLineZ - 1.5]} receiveShadow>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshStandardMaterial color="#654321" />
      </mesh>

      <primitive 
        object={models.marshalClipboard} 
        position={[-laneWidth / 2 - 2, 0, startLineZ - 2]} 
        scale={1.5}
        rotation={[0, Math.PI / 4, 0]}
      />

      <primitive 
        object={models.marshalRadio} 
        position={[laneWidth / 2 + 2.5, 0, startLineZ - 2.5]} 
        scale={1.5}
        rotation={[0, -Math.PI / 3, 0]}
      />

      <primitive 
        object={models.spectators} 
        position={[-laneWidth / 2 - 4, 0, startLineZ - 5]} 
        scale={1.3}
      />

      <primitive 
        object={models.spectators.clone()} 
        position={[laneWidth / 2 + 5, 0, startLineZ - 6]} 
        scale={1.3}
        rotation={[0, Math.PI, 0]}
      />

      <primitive 
        object={models.serviceVan} 
        position={[-laneWidth / 2 - 6, 0, startLineZ - 11]} 
        scale={2.2}
        rotation={[0, Math.PI / 6, 0]}
      />

      <mesh position={[0, 0.01, startLineZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[laneWidth, 0.3]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

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

      <pointLight position={[-3, 5, startLineZ]} intensity={200} distance={15} color="#FFFFFF" castShadow />
      <pointLight position={[3, 5, startLineZ]} intensity={200} distance={15} color="#FFFFFF" castShadow />
      <pointLight position={[0, 4, startLineZ + 5]} intensity={150} distance={12} color="#FFEECC" />
      
      <pointLight position={[laneWidth / 2 + 3.5, 3, startLineZ - 2]} intensity={80} distance={8} color="#FF6B6B" />
      
      <Text
        ref={startSignRef}
        position={[0, 4.5, startLineZ + 0.2]}
        fontSize={0.8}
        color="#00FF41"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#003311"
        font="/fonts/inter-bold.woff"
      >
        START
        <meshStandardMaterial 
          color="#00FF41" 
          emissive="#00FF41" 
          emissiveIntensity={1.0}
          toneMapped={false}
        />
      </Text>
      
      {[-2, 2].map((xOffset, idx) => (
        <mesh
          key={`light-beam-${idx}`}
          ref={(el) => { if (el) lightBeamRefs.current[idx] = el; }}
          position={[xOffset, 2.5, startLineZ]}
          rotation={[0, 0, 0]}
        >
          <cylinderGeometry args={[0.4, 0.6, 5, 8, 1, true]} />
          <meshBasicMaterial 
            color="#00FF41" 
            transparent 
            opacity={0.3}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      
      <spotLight 
        position={[-2, 0.5, startLineZ]} 
        angle={0.3}
        penumbra={0.5}
        intensity={100}
        distance={10}
        target-position={[-2, 10, startLineZ]}
        color="#00FF41"
      />
      <spotLight 
        position={[2, 0.5, startLineZ]} 
        angle={0.3}
        penumbra={0.5}
        intensity={100}
        distance={10}
        target-position={[2, 10, startLineZ]}
        color="#00FF41"
      />
      
      <GroundFog startLineZ={startLineZ} laneWidth={laneWidth} />
    </group>
  );
}

function GroundFog({ startLineZ, laneWidth }: { startLineZ: number; laneWidth: number }) {
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
