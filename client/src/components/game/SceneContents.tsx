import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Environment } from "./Environment";
import { StartControl } from "./StartControl";
import { SponsorBanners } from "./SponsorBanners";
import { Road } from "./Road";
import { BiomePropsScene } from "./BiomeProps";
import { Car } from "./Car";
import { Obstacles } from "./Obstacles";
import { Collectibles } from "./Collectibles";
import { NitroParticles, DustTrail, ExhaustSmoke, CollisionSparks } from "./ParticleEffects";
import { AtmosphericParticles } from "./AtmosphericParticles";
import { Camera } from "./Camera";

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
  onReady?: () => void;
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
  onReady,
}: SceneContentsProps) {
  const readyCalledRef = useRef(false);

  useEffect(() => {
    if (onReady && !readyCalledRef.current) {
      requestAnimationFrame(() => {
        if (!readyCalledRef.current) {
          readyCalledRef.current = true;
          console.log("Scene assets loaded and rendered, triggering onReady");
          onReady();
        }
      });
    }
  }, [onReady]);

  return (
    <>
      <Environment />
      <StartControl />
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
