import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface CameraProps {
  carPositionRef: React.MutableRefObject<THREE.Vector3>;
  carSpeedRef?: React.MutableRefObject<number>;
  shakeIntensity?: number;
}

// Follow stiffness: higher = tighter. Frame-rate independent (same feel at 30 or 60 fps).
const FOLLOW_RATE = 6.3;
// Trauma lost per second; shake strength is trauma squared, so small knocks stay subtle.
const TRAUMA_DECAY = 1.6;
const MAX_SHAKE = new THREE.Vector3(0.35, 0.3, 0.15);
// Field of view widens with speed so going fast reads as fast.
const BASE_FOV = 60;
const MAX_EXTRA_FOV = 10;
const FOV_TOP_SPEED_KMH = 200;

export function Camera({ carPositionRef, carSpeedRef, shakeIntensity = 0 }: CameraProps) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3(0, 4, -8));
  const shakeOffset = useRef(new THREE.Vector3());
  const trauma = useRef(0);
  const shakeTime = useRef(0);
  const previousIntensity = useRef(0);

  useFrame((_, rawDelta) => {
    // Clamp so a slow frame (tab switch, hitch) doesn't snap the camera.
    const delta = Math.min(rawDelta, 0.1);
    const car = carPositionRef.current;

    targetPosition.current.set(car.x * 0.5, car.y + 4, car.z - 8);
    currentPosition.current.lerp(targetPosition.current, 1 - Math.exp(-FOLLOW_RATE * delta));

    // A new hit adds trauma (hits stack instead of resetting).
    if (shakeIntensity > 0 && shakeIntensity !== previousIntensity.current) {
      trauma.current = Math.min(1, trauma.current + shakeIntensity / 2);
    }
    previousIntensity.current = shakeIntensity;

    if (trauma.current > 0) {
      trauma.current = Math.max(0, trauma.current - TRAUMA_DECAY * delta);
      shakeTime.current += delta * 30;
      const shake = trauma.current * trauma.current;
      const t = shakeTime.current;
      // Smooth wobble from layered sines instead of per-frame random noise (which buzzes).
      shakeOffset.current.set(
        MAX_SHAKE.x * shake * Math.sin(t * 1.7),
        MAX_SHAKE.y * shake * Math.sin(t * 2.3 + 1),
        MAX_SHAKE.z * shake * Math.sin(t * 1.1 + 2),
      );
    } else {
      shakeOffset.current.set(0, 0, 0);
    }

    camera.position.copy(currentPosition.current).add(shakeOffset.current);
    camera.lookAt(car.x, car.y + 0.5, car.z + 2);

    if (carSpeedRef && camera instanceof THREE.PerspectiveCamera) {
      const speedRatio = Math.min(carSpeedRef.current / FOV_TOP_SPEED_KMH, 1);
      const targetFov = BASE_FOV + MAX_EXTRA_FOV * speedRatio * speedRatio;
      const fov = camera.fov + (targetFov - camera.fov) * (1 - Math.exp(-3 * delta));
      if (Math.abs(fov - camera.fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return null;
}
