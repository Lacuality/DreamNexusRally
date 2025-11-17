import { useEffect, useRef, useState, Suspense } from "react";
import * as THREE from "three";
import { Environment } from "./Environment";
import { StartControlCore } from "./StartControlCore";
import { StartControlDecor } from "./StartControlDecor";
import { SponsorBanners } from "./SponsorBanners";
import { Road } from "./Road";
import { BiomePropsScene } from "./BiomeProps";
import { Car } from "./Car";
import { Obstacles } from "./Obstacles";
import { Collectibles } from "./Collectibles";
import { NitroParticles, DustTrail, ExhaustSmoke, CollisionSparks } from "./ParticleEffects";
import { AtmosphericParticles } from "./AtmosphericParticles";
import { Camera } from "./Camera";
import { useRally } from "@/lib/stores/useRally";

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
  const [shouldLoadDecor, setShouldLoadDecor] = useState(false);
  const phase = useRally((state) => state.phase);

  useEffect(() => {
    console.log("SceneContents mounted, phase:", phase);
  }, []);

  useEffect(() => {
    if (phase === "playing" && !shouldLoadDecor) {
      console.log("Phase changed to playing, loading decorative assets");
      setShouldLoadDecor(true);
    }
  }, [phase, shouldLoadDecor]);

  return (
    <>
      <Environment />
      <StartControlCore />
      {shouldLoadDecor && (
        <Suspense fallback={null}>
          <StartControlDecor />
        </Suspense>
      )}
      <SponsorBanners />
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
