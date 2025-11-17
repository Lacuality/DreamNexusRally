import { useEffect, Suspense } from "react";
import { Environment } from "./Environment";
import { StartControlCore } from "./StartControlCore";
import { Road } from "./Road";
import { BiomePropsScene } from "./BiomeProps";
import { Car } from "./Car";
import { Obstacles } from "./Obstacles";
import { Collectibles } from "./Collectibles";
import { NitroParticles, DustTrail, ExhaustSmoke, CollisionSparks } from "./ParticleEffects";
import { AtmosphericParticles } from "./AtmosphericParticles";
import { Camera } from "./Camera";
import { useRally } from "@/lib/stores/useRally";
import * as THREE from "three";

interface Obstacle {
  id: number;
  type: "cone" | "rock" | "puddle" | "coffee_sack";
  position: THREE.Vector3;
}

interface SceneContentsProps {
  carPositionRef: React.MutableRefObject<THREE.Vector3>;
  carSpeedRef: React.MutableRefObject<number>;
  onCrash: () => void;
  onCollision: (obstacle: Obstacle) => void;
  onCollect: (collectible: { type: string }) => void;
  boostCounter: number;
  nitroActive: boolean;
  puddleSlowdownActive: boolean;
  collisionSparkPosition: THREE.Vector3;
  showCollisionSparks: boolean;
  cameraShakeIntensity: number;
}

export function SceneContents({
  carPositionRef,
  carSpeedRef,
  onCrash,
  onCollision,
  onCollect,
  boostCounter,
  nitroActive,
  puddleSlowdownActive,
  collisionSparkPosition,
  showCollisionSparks,
  cameraShakeIntensity,
}: SceneContentsProps) {
  const phase = useRally((state) => state.phase);

  useEffect(() => {
    console.log("[SceneContents] MOUNTED! Phase:", phase);
  }, [phase]);

  return (
    <>
      <Environment />
      <Suspense fallback={null}>
        <StartControlCore />
      </Suspense>
      <Road carPositionRef={carPositionRef} />
      <BiomePropsScene carPositionRef={carPositionRef} />
      <Car
        carPositionRef={carPositionRef}
        carSpeedRef={carSpeedRef}
        onCrash={onCrash}
        boostCounter={boostCounter}
        nitroActive={nitroActive}
        puddleSlowdown={puddleSlowdownActive}
      />
      <Obstacles
        carPositionRef={carPositionRef}
        carSpeedRef={carSpeedRef}
        onCollision={onCollision}
      />
      <Collectibles
        carPositionRef={carPositionRef}
        onCollect={onCollect}
      />
      <NitroParticles
        active={nitroActive}
        carPositionRef={carPositionRef}
      />
      <DustTrail carPositionRef={carPositionRef} speedRef={carSpeedRef} />
      <ExhaustSmoke carPositionRef={carPositionRef} speedRef={carSpeedRef} />
      <CollisionSparks position={collisionSparkPosition} active={showCollisionSparks} />
      <AtmosphericParticles carPositionRef={carPositionRef} />
      <Camera carPositionRef={carPositionRef} shakeIntensity={cameraShakeIntensity} />
    </>
  );
}
