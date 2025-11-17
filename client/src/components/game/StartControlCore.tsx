import { useGLTF, Text } from "@react-three/drei";
import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function StartControlCore() {
  console.log("[StartControlCore] Component mounting");
  
  const { scene: startArch } = useGLTF("/models/start-arch.glb");
  const { scene: timingDisplay } = useGLTF("/models/timing-display.glb");
  
  useEffect(() => {
    console.log("[StartControlCore] Models loaded - startArch:", !!startArch, "timingDisplay:", !!timingDisplay);
  }, [startArch, timingDisplay]);
  
  const startArchClone = useMemo(() => {
    console.log("[StartControlCore] Creating startArch clone");
    return startArch.clone();
  }, [startArch]);
  
  const timingDisplay1 = useMemo(() => {
    console.log("[StartControlCore] Creating timingDisplay clone 1");
    return timingDisplay.clone();
  }, [timingDisplay]);
  
  const timingDisplay2 = useMemo(() => {
    console.log("[StartControlCore] Creating timingDisplay clone 2");
    return timingDisplay.clone();
  }, [timingDisplay]);
  
  const startSignRef = useRef<THREE.Mesh>(null);
  const lightBeamRefs = useRef<THREE.Mesh[]>([]);

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
        object={startArchClone} 
        position={[0, 0, startLineZ]} 
        scale={3.5}
      />

      <primitive 
        object={timingDisplay1} 
        position={[-laneWidth / 2 - 1.5, 0, startLineZ - 1]} 
        scale={1.2}
        rotation={[0, Math.PI / 4, 0]}
      />
      
      <primitive 
        object={timingDisplay2} 
        position={[laneWidth / 2 + 1.5, 0, startLineZ - 1]} 
        scale={1.2}
        rotation={[0, -Math.PI / 4, 0]}
      />

      <mesh position={[0, 0.01, startLineZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[laneWidth, 0.3]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      <pointLight position={[-3, 5, startLineZ]} intensity={200} distance={15} color="#FFFFFF" castShadow />
      <pointLight position={[3, 5, startLineZ]} intensity={200} distance={15} color="#FFFFFF" castShadow />
      <pointLight position={[0, 4, startLineZ + 5]} intensity={150} distance={12} color="#FFEECC" />
      
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
    </group>
  );
}
