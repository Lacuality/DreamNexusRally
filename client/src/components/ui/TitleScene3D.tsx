import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { KeyboardControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Environment } from "../game/Environment";
import { Road } from "../game/Road";
import { Vegetation } from "../game/Vegetation";
import { StartLine } from "../game/StartLine";
import { SponsorBanners } from "../game/SponsorBanners";
import { Car } from "../game/Car";
import { TyreSmoke } from "../game/TyreEffects";
import { useBiome } from "@/lib/stores/useBiome";
import { carTelemetry } from "@/lib/carPhysics";
import { audioManager } from "@/lib/audio";
import { GL_OPTIONS, QUALITY, keepContextAlive } from "@/lib/quality";

/**
 * Menu scene: the real start line in the Colombian valley, the rally car on the
 * grid and Pixel the Bunny waiting beside it. When the player starts a race,
 * Pixel hops onto the roof and drops in through the sunroof, the car revs and
 * spins its wheels, and the camera swings into the race camera position, so the
 * race picks up from exactly this shot.
 */

// The bunny model is 1 unit tall, centred on its origin.
const BUNNY_SCALE = 1.3;
const BUNNY_HALF_H = 0.5 * BUNNY_SCALE;
const BUNNY_HOME = new THREE.Vector3(2.35, 0, 0.4);   // beside the driver's door (+x is the car's left)
const BUNNY_DOOR = new THREE.Vector3(1.45, 0, 0.15);
const ROOF_Y = 1.3;                                  // top of the car's roof
const BUNNY_ROOF = new THREE.Vector3(0.3, ROOF_Y, -0.1);

// Race camera start pose (matches the in-game chase camera at the start line).
const RACE_CAM_POS = new THREE.Vector3(0, 4, -8);
const RACE_CAM_LOOK = new THREE.Vector3(0, 0.5, 2);
const RACE_FOV = 60;

// Boarding timeline (seconds).
const T = {
  turn: 0.35,
  hop1: 0.95,
  settle: 1.15,
  hop2: 1.85,
  dive: 2.25,
  rev: 2.35,
  spinStart: 2.6,
  spinEnd: 3.4,
  camStart: 2.1,
  camEnd: 3.6,
  done: 3.75,
};

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const phaseT = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/** Shared clock for the boarding sequence (null while idling in the menu). */
interface BoardingClock {
  start: number | null;
}

function Bunny({ boarding, clock }: { boarding: boolean; clock: React.MutableRefObject<BoardingClock> }) {
  const { scene } = useGLTF("/pixel-bunny-3d.glb");
  const model = useMemo(() => {
    const m = scene.clone();
    m.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    return m;
  }, [scene]);
  const ref = useRef<THREE.Group>(null);
  const hopSounds = useRef(0);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const now = state.clock.elapsedTime;
    const start = clock.current.start;

    if (!boarding || start === null) {
      // Idle: bounce on the spot, look around, and do a little hop now and then.
      const cycle = now % 4.5;
      const hop = cycle < 0.5 ? Math.sin((cycle / 0.5) * Math.PI) * 0.45 : 0;
      g.position.set(BUNNY_HOME.x, BUNNY_HALF_H + hop + Math.sin(now * 3) * 0.02, BUNNY_HOME.z);
      g.rotation.set(0, -0.9 + Math.sin(now * 0.7) * 0.35, Math.sin(now * 2.2) * 0.04);
      const squash = cycle > 0.5 && cycle < 0.62 ? 0.9 : 1;
      g.scale.set(BUNNY_SCALE / Math.sqrt(squash), BUNNY_SCALE * squash, BUNNY_SCALE / Math.sqrt(squash));
      hopSounds.current = 0;
      return;
    }

    const t = now - start;
    const p = new THREE.Vector3();
    let squash = 1;
    let yaw = -0.9;
    let scale = BUNNY_SCALE;

    if (t < T.turn) {
      // Turn to face the car and crouch.
      const k = ease(phaseT(t, 0, T.turn));
      p.copy(BUNNY_HOME);
      yaw = -0.9 + (-Math.PI / 2 + 0.9) * k;
      squash = 1 - 0.18 * k;
    } else if (t < T.hop1) {
      // Hop to the driver's door.
      const k = phaseT(t, T.turn, T.hop1);
      p.lerpVectors(BUNNY_HOME, BUNNY_DOOR, k);
      p.y += Math.sin(k * Math.PI) * 0.9;
      yaw = -Math.PI / 2;
      squash = 1.1;
      if (hopSounds.current === 0) {
        hopSounds.current = 1;
        audioManager.playPickup();
      }
    } else if (t < T.settle) {
      p.copy(BUNNY_DOOR);
      yaw = -Math.PI / 2;
      squash = 0.8;
    } else if (t < T.hop2) {
      // Big jump up onto the roof.
      const k = phaseT(t, T.settle, T.hop2);
      p.lerpVectors(BUNNY_DOOR, BUNNY_ROOF, k);
      p.y += Math.sin(k * Math.PI) * 1.4;
      yaw = -Math.PI / 2 + k * Math.PI * 0.5;
      squash = 1.12;
      if (hopSounds.current === 1) {
        hopSounds.current = 2;
        audioManager.playPickup();
      }
    } else if (t < T.dive) {
      // Drop in through the sunroof.
      const k = ease(phaseT(t, T.hop2, T.dive));
      p.copy(BUNNY_ROOF);
      p.y -= k * 0.9;
      yaw = Math.PI * 0.0 + k * Math.PI * 1.5;
      scale = BUNNY_SCALE * (1 - k);
    } else {
      g.visible = false;
      return;
    }

    g.visible = true;
    g.position.set(p.x, p.y + BUNNY_HALF_H * squash, p.z);
    g.rotation.set(0, yaw, 0);
    g.scale.set(scale / Math.sqrt(squash), scale * squash, scale / Math.sqrt(squash));
  });

  return (
    <group ref={ref}>
      <primitive object={model} />
    </group>
  );
}

/** The real race car, wrapped so the menu can bounce and shake it during the cinematic. */
function MenuCar({ boarding, clock }: { boarding: boolean; clock: React.MutableRefObject<BoardingClock> }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightMats = useMemo(
    () => ({
      head: new THREE.MeshBasicMaterial({ color: "#fff6d8", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      tail: new THREE.MeshBasicMaterial({ color: "#ff2a1f", transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    }),
    [],
  );
  const posRef = useRef(new THREE.Vector3());
  const speedRef = useRef(0);
  const revved = useRef(false);
  const screeched = useRef(false);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const now = state.clock.elapsedTime;
    const start = clock.current.start;
    const t = boarding && start !== null ? now - start : -1;

    // Settle bounce when the bunny lands inside, then a rumble while it revs.
    let y = 0;
    let rollZ = 0;
    if (t > T.dive - 0.05) {
      const k = t - (T.dive - 0.05);
      y += -0.09 * Math.exp(-k * 5) * Math.cos(k * 18);
    }
    if (t > T.rev) y += Math.sin(now * 55) * 0.012;
    if (t > T.spinStart && t < T.spinEnd) rollZ = Math.sin(now * 40) * 0.012;
    g.position.y = y;
    g.rotation.z = rollZ;

    // Lights: tail lights glow softly; on the rev both flash twice.
    const flash = t > T.rev && t < T.rev + 0.7 ? (Math.sin((t - T.rev) * 18) > 0 ? 1 : 0.2) : t > T.rev ? 0.75 : 0;
    lightMats.head.opacity = flash * 0.9;
    lightMats.tail.opacity = 0.25 + flash * 0.6;

    if (t > T.rev && !revved.current) {
      revved.current = true;
      audioManager.startEngineSound();
      audioManager.updateEngineSound(140);
    }
    if (t > T.spinStart && !screeched.current) {
      screeched.current = true;
      audioManager.playBrake();
    }
    if (t < 0) {
      revved.current = false;
      screeched.current = false;
    }

    // Wheelspin smoke comes from the same tyre-smoke effect the race uses.
    const spinning = t > T.spinStart && t < T.spinEnd;
    carTelemetry.x = 0;
    carTelemetry.z = 0;
    carTelemetry.heading = 0;
    carTelemetry.speed = spinning ? 9 : 0;
    carTelemetry.slip = spinning ? 0.2 : 0;
    carTelemetry.handbrake = spinning;
    carTelemetry.hardBraking = false;
    carTelemetry.onGrass = false;
  });

  return (
    <group ref={groupRef}>
      <KeyboardControls map={[]}>
        <Car carPositionRef={posRef} carSpeedRef={speedRef} onCrash={() => {}} />
      </KeyboardControls>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.68, 0.85, 2.55]} material={lightMats.head}>
            <circleGeometry args={[0.2, 16]} />
          </mesh>
          <mesh position={[s * 0.72, 0.95, -2.5]} rotation={[0, Math.PI, 0]} material={lightMats.tail}>
            <circleGeometry args={[0.15, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Slow cinematic orbit around the car; during boarding it glides into the race camera. */
function MenuCamera({
  boarding,
  clock,
  onBoarded,
}: {
  boarding: boolean;
  clock: React.MutableRefObject<BoardingClock>;
  onBoarded: () => void;
}) {
  const { camera } = useThree();
  const from = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 50 });
  const look = useMemo(() => new THREE.Vector3(), []);
  const done = useRef(false);

  useFrame((state) => {
    const cam = camera as THREE.PerspectiveCamera;
    const now = state.clock.elapsedTime;
    if (boarding && clock.current.start === null) clock.current.start = now;
    const start = clock.current.start;
    const t = boarding && start !== null ? now - start : -1;

    // Idle orbit: from behind-left round to the car's side, so the gantry and Pixel are both in shot.
    const idleTime = boarding && start !== null ? start : now;
    // Swing between behind-left and the car's side, staying inside the crowd barriers.
    const theta = 0.85 + 0.4 * Math.sin(idleTime * 0.12);
    // Pull back and up on tall (portrait) screens so the whole car and Pixel stay in
    // frame, looking over the spectators' heads.
    const portrait = cam.aspect < 1;
    const r = portrait ? 11 : 8.5;
    const idlePos = new THREE.Vector3(
      Math.sin(theta) * r,
      (portrait ? 4.6 : 2.6) + 0.3 * Math.sin(idleTime * 0.09),
      -Math.cos(theta) * r + 1,
    );
    const idleLook = new THREE.Vector3(0.7, 1.0, 1.5);

    if (t < T.camStart) {
      cam.position.copy(idlePos);
      look.copy(idleLook);
      cam.fov = 50;
      from.current.pos.copy(idlePos);
      from.current.look.copy(idleLook);
    } else {
      const k = ease(phaseT(t, T.camStart, T.camEnd));
      cam.position.lerpVectors(from.current.pos, RACE_CAM_POS, k);
      look.lerpVectors(from.current.look, RACE_CAM_LOOK, k);
      cam.fov = 50 + (RACE_FOV - 50) * k;
    }
    cam.lookAt(look);
    cam.updateProjectionMatrix();

    if (t > T.done && !done.current) {
      done.current = true;
      onBoarded();
    }
  });

  return null;
}

const ORIGIN_REF = { current: new THREE.Vector3(0, 0, 0) };

export function TitleScene3D({ boarding = false, onBoarded = () => {} }: { boarding?: boolean; onBoarded?: () => void }) {
  const clock = useRef<BoardingClock>({ start: null });

  // Always open the menu in coffee country, wherever the last race ended.
  useEffect(() => {
    useBiome.getState().updateDistance(0);
  }, []);

  useEffect(() => {
    if (!boarding) clock.current.start = null;
  }, [boarding]);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas
        shadows={QUALITY.shadows}
        dpr={QUALITY.dpr}
        camera={{ position: [6, 2.6, -5], fov: 50, near: 0.1, far: 220 }}
        gl={GL_OPTIONS}
        onCreated={({ gl }) => keepContextAlive(gl.domElement)}
      >
        <Suspense fallback={null}>
          <Environment carPositionRef={ORIGIN_REF} />
          <Road carPositionRef={ORIGIN_REF} />
          <Vegetation carPositionRef={ORIGIN_REF} />
          <SponsorBanners carPositionRef={ORIGIN_REF} />
          <StartLine />
          <MenuCar boarding={boarding} clock={clock} />
          <Bunny boarding={boarding} clock={clock} />
          <TyreSmoke />
          <MenuCamera boarding={boarding} clock={clock} onBoarded={onBoarded} />
        </Suspense>
      </Canvas>
    </div>
  );
}
