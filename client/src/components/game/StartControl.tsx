import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
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
  const startZ = -5;

  return (
    <group>
      <primitive 
        object={models.startArch} 
        position={[0, 0, startZ]} 
        scale={3.5}
      />

      <primitive 
        object={models.timingDisplay} 
        position={[-laneWidth / 2 - 1.5, 0, startZ + 2]} 
        scale={1.2}
        rotation={[0, Math.PI / 4, 0]}
      />
      
      <primitive 
        object={models.timingDisplay.clone()} 
        position={[laneWidth / 2 + 1.5, 0, startZ + 2]} 
        scale={1.2}
        rotation={[0, -Math.PI / 4, 0]}
      />

      {[-1, 1].map((side, idx) => (
        <group key={`barriers-${side}`}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <primitive
              key={`barrier-${side}-${i}`}
              object={models.safetyBarrier.clone()}
              position={[side * (laneWidth / 2 + 0.8), 0, startZ + 3 - i * 1.5]}
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
              position={[side * (laneWidth / 2 + 0.3), 0, startZ + 4 - i * 1.2]}
              scale={0.8}
            />
          ))}
        </group>
      ))}

      <primitive 
        object={models.controlTent} 
        position={[laneWidth / 2 + 3.5, 0, startZ + 1]} 
        scale={2.0}
      />

      <mesh position={[laneWidth / 2 + 3.5, 0.5, startZ + 1]} receiveShadow>
        <boxGeometry args={[1.2, 0.8, 0.6]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      <mesh position={[laneWidth / 2 + 4.2, 0.3, startZ + 0.5]} receiveShadow>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      <mesh position={[laneWidth / 2 + 4.2, 0.3, startZ + 1.5]} receiveShadow>
        <boxGeometry args={[0.4, 0.5, 0.4]} />
        <meshStandardMaterial color="#654321" />
      </mesh>

      <primitive 
        object={models.marshalClipboard} 
        position={[-laneWidth / 2 - 2, 0, startZ + 1]} 
        scale={1.5}
        rotation={[0, Math.PI / 4, 0]}
      />

      <primitive 
        object={models.marshalRadio} 
        position={[laneWidth / 2 + 2.5, 0, startZ + 0.5]} 
        scale={1.5}
        rotation={[0, -Math.PI / 3, 0]}
      />

      <primitive 
        object={models.spectators} 
        position={[-laneWidth / 2 - 4, 0, startZ - 2]} 
        scale={1.3}
      />

      <primitive 
        object={models.spectators.clone()} 
        position={[laneWidth / 2 + 5, 0, startZ - 3]} 
        scale={1.3}
        rotation={[0, Math.PI, 0]}
      />

      <primitive 
        object={models.serviceVan} 
        position={[-laneWidth / 2 - 6, 0, startZ - 8]} 
        scale={2.2}
        rotation={[0, Math.PI / 6, 0]}
      />

      <mesh position={[0, 0.01, startZ + 3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[laneWidth, 0.3]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {[-2, -1, 0, 1, 2].map((offset) => (
        <mesh 
          key={`skid-${offset}`}
          position={[offset * 0.6, 0.02, startZ + 4.5]} 
          rotation={[-Math.PI / 2, 0, 0.1]} 
          receiveShadow
        >
          <planeGeometry args={[0.15, 1.2]} />
          <meshStandardMaterial color="#1a1a1a" opacity={0.6} transparent />
        </mesh>
      ))}

      <pointLight position={[-3, 5, startZ]} intensity={200} distance={15} color="#FFFFFF" castShadow />
      <pointLight position={[3, 5, startZ]} intensity={200} distance={15} color="#FFFFFF" castShadow />
      <pointLight position={[0, 4, startZ + 5]} intensity={150} distance={12} color="#FFEECC" />
      
      <pointLight position={[laneWidth / 2 + 3.5, 3, startZ + 1]} intensity={80} distance={8} color="#FF6B6B" />
    </group>
  );
}
