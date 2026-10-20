import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useKeyboardControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GAME_CONFIG } from "@/lib/constants";
import { useRally } from "@/lib/stores/useRally";
import { useMobileControls } from "@/lib/stores/useMobileControls";
import { useSettings } from "@/lib/stores/useSettings";
import { audioManager } from "@/lib/audio";
import { vibrate } from "@/lib/haptics";
import { carTelemetry, createCarState, stepCar, type CarState } from "@/lib/carPhysics";

export enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  handbrake = "handbrake",
}

interface CarProps {
  carPositionRef: React.MutableRefObject<THREE.Vector3>;
  carSpeedRef: React.MutableRefObject<number>;
  onCrash: () => void;
  boostCounter?: number;
  nitroActive?: boolean;
  puddleSlowdown?: boolean;
  impactCounter?: number;
}

export function Car({ carPositionRef, carSpeedRef, onCrash, boostCounter = 0, nitroActive = false, puddleSlowdown = false, impactCounter = 0 }: CarProps) {
  const carRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const carModelRef = useRef<THREE.Group>(null);
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const rearLeftWheelRef = useRef<THREE.Group>(null);
  const rearRightWheelRef = useRef<THREE.Group>(null);
  
  const { scene: carScene } = useGLTF("./models/rally-car.glb");
  const { scene: wheelScene } = useGLTF("./models/rally-wheel.glb");
  
  const carModel = useMemo(() => {
    const clonedScene = carScene.clone();
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clonedScene;
  }, [carScene]);
  
  const wheelModels = useMemo(() => {
    return {
      frontLeft: wheelScene.clone(),
      frontRight: wheelScene.clone(),
      rearLeft: wheelScene.clone(),
      rearRight: wheelScene.clone(),
    };
  }, [wheelScene]);
  
  // Physics state lives in a ref: it changes every frame and must not re-render React.
  const physicsRef = useRef<CarState>(createCarState());
  const lastBoostCounterRef = useRef(0);
  const lastImpactCounterRef = useRef(0);
  const wheelRotationRef = useRef(0);
  const suspensionTimeRef = useRef(0);
  const lastBrakeSoundTimeRef = useRef(0);
  const lastWallHitRef = useRef(0);
  
  const [, getKeys] = useKeyboardControls<Controls>();
  const phase = useRally((state) => state.phase);
  const isCountingDown = useRally((state) => state.isCountingDown);
  const mobileControls = useMobileControls();
  const showPhotoMode = useSettings((state) => state.showPhotoMode);
  
  // Front wheels steer (about Y) and then spin about their steered axle, so apply Y before X.
  useEffect(() => {
    for (const ref of [frontLeftWheelRef, frontRightWheelRef, rearLeftWheelRef, rearRightWheelRef]) {
      if (ref.current) ref.current.rotation.order = "YXZ";
    }
  }, []);

  useEffect(() => {
    const controls = getKeys();
    console.log("Keyboard controls initialized:", {
      forward: controls.forward,
      back: controls.back,
      left: controls.left,
      right: controls.right
    });
  }, [getKeys]);

  useEffect(() => {
    if (phase === "playing") {
      audioManager.updateEngineSound(0);
    }
    return () => {
      audioManager.stopEngineSound();
    };
  }, [phase]);
  
  useFrame((state, delta) => {
    if (!carRef.current || phase !== "playing" || showPhotoMode) return;

    const keys = getKeys();
    const input = {
      throttle: !isCountingDown && (keys.forward || mobileControls.forward),
      brake: !isCountingDown && (keys.back || mobileControls.back),
      left: keys.left || mobileControls.left,
      right: keys.right || mobileControls.right,
      handbrake: !isCountingDown && (!!keys.handbrake || mobileControls.handbrake),
    };

    let car = physicsRef.current;

    // Arequipe jar: a little shove forward.
    if (boostCounter > lastBoostCounterRef.current) {
      car = { ...car, speed: car.speed + GAME_CONFIG.PICKUP_BURST / 3.6 };
      lastBoostCounterRef.current = boostCounter;
    }
    // A low-speed knock costs half your speed.
    if (impactCounter > lastImpactCounterRef.current) {
      car = { ...car, speed: car.speed * 0.5 };
      lastImpactCounterRef.current = impactCounter;
    }

    car = stepCar(car, input, { nitro: nitroActive, puddle: puddleSlowdown, frozen: isCountingDown }, delta);
    physicsRef.current = car;

    const speedKmh = car.speed * 3.6;

    carTelemetry.x = car.x;
    carTelemetry.z = car.z;
    carTelemetry.heading = car.heading;
    carTelemetry.speed = car.speed;
    carTelemetry.slip = car.slip;
    carTelemetry.hardBraking = input.brake && speedKmh > 25;
    carTelemetry.handbrake = input.handbrake;
    carTelemetry.onGrass = car.onGrass;

    // Tyre screech when sliding, braking hard or grinding the barrier.
    const screech =
      (Math.abs(car.slip) > 0.12 && car.speed > 12) ||
      (input.brake && speedKmh > 25) ||
      car.hitWall;
    if (screech && state.clock.elapsedTime - lastBrakeSoundTimeRef.current > 0.22) {
      audioManager.playBrake();
      lastBrakeSoundTimeRef.current = state.clock.elapsedTime;
    }
    if (car.hitWall && state.clock.elapsedTime - lastWallHitRef.current > 0.5) {
      vibrate(40);
      lastWallHitRef.current = state.clock.elapsedTime;
    }

    /* ---- Wheels: spin with speed, front pair steers ---- */
    const wheelRadius = 0.15;
    wheelRotationRef.current += (car.speed / wheelRadius) * Math.min(delta, 0.1);
    const steerAngle = (0.55 * car.steer) / (1 + car.speed / 20);
    for (const ref of [frontLeftWheelRef, frontRightWheelRef]) {
      if (ref.current) {
        ref.current.rotation.y = steerAngle;
        ref.current.rotation.x = wheelRotationRef.current;
      }
    }
    for (const ref of [rearLeftWheelRef, rearRightWheelRef]) {
      if (ref.current) ref.current.rotation.x = wheelRotationRef.current;
    }

    /* ---- Body: roll in corners, squat/dive under throttle/brakes, bumps on grass ---- */
    suspensionTimeRef.current += delta;
    if (bodyRef.current) {
      const k = 1 - Math.exp(-8 * Math.min(delta, 0.1));
      const targetRoll = THREE.MathUtils.clamp(-car.lateralAccel * 0.012, -0.12, 0.12);
      const targetPitch = THREE.MathUtils.clamp(-car.longitudinalAccel * 0.006, -0.06, 0.06);
      bodyRef.current.rotation.z += (targetRoll - bodyRef.current.rotation.z) * k;
      bodyRef.current.rotation.x += (targetPitch - bodyRef.current.rotation.x) * k;
      const roughness = car.onGrass ? 0.06 : 0.015;
      bodyRef.current.position.y =
        Math.sin(suspensionTimeRef.current * (car.onGrass ? 23 : 9) + car.z * 0.7) * roughness * Math.min(car.speed / 20, 1);
    }

    /* ---- Place the car: it points where its nose points, and travels along its velocity ---- */
    carRef.current.position.x = car.x;
    carRef.current.position.z = car.z;
    carRef.current.rotation.y = car.heading;

    carSpeedRef.current = speedKmh;
    carPositionRef.current.copy(carRef.current.position);

    audioManager.updateEngineSound(speedKmh, input.brake);
  });
  
  return (
    <group ref={carRef} position={[0, 0.5, 0]}>
      <group ref={bodyRef}>
        <group ref={carModelRef} scale={2.5}>
          <primitive object={carModel} />
        </group>
      </group>
      
      <group ref={frontLeftWheelRef} position={[-0.7, -0.3, 0.8]} rotation={[0, 0, 0]}>
        <primitive object={wheelModels.frontLeft} scale={0.5} />
      </group>
      <group ref={frontRightWheelRef} position={[0.7, -0.3, 0.8]} rotation={[0, 0, 0]}>
        <primitive object={wheelModels.frontRight} scale={0.5} />
      </group>
      <group ref={rearLeftWheelRef} position={[-0.7, -0.3, -0.8]} rotation={[0, 0, 0]}>
        <primitive object={wheelModels.rearLeft} scale={0.5} />
      </group>
      <group ref={rearRightWheelRef} position={[0.7, -0.3, -0.8]} rotation={[0, 0, 0]}>
        <primitive object={wheelModels.rearRight} scale={0.5} />
      </group>
    </group>
  );
}
