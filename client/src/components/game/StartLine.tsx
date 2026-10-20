import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useRally } from "@/lib/stores/useRally";
import { GAME_CONFIG } from "@/lib/constants";
import { seededRandom } from "@/lib/scenery";

/**
 * Rally stage start: checkered line across the road, a steel gantry with a
 * Dream Nexus banner and countdown lights (red 3-2-1, green on GO), waving
 * Colombian flags, barriers, tyre stacks, spectators and a small paddock,
 * plus a confetti burst when the race starts.
 */

const LINE_Z = 12;                                 // the car starts in a grid box behind this
const ROAD_HALF = (GAME_CONFIG.LANE_WIDTH + 0.6) / 2;
const GANTRY_HALF_SPAN = ROAD_HALF + 1.6;
// Bottom of the gantry; must stay above the chase camera (~4.5 m) so it never clips through.
const GANTRY_H = 5.6;

/* ---------- Canvas textures ---------- */

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function checkerTexture() {
  // 16 x 2 squares across the road.
  return canvasTexture(512, 64, (ctx) => {
    const s = 32;
    for (let y = 0; y < 2; y++)
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#f4f4f0" : "#111111";
        ctx.fillRect(x * s, y * s, s, s);
      }
  });
}

function bannerTexture() {
  return canvasTexture(1024, 160, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 160);
    g.addColorStop(0, "#163a4c");
    g.addColorStop(1, "#0e1b24");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 160);
    // Checkered ends.
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 3; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#111" : "#f4f4f0";
        ctx.fillRect(x * 40, y * 40, 40, 40);
        ctx.fillRect(1024 - 120 + x * 40, y * 40, 40, 40);
      }
    ctx.fillStyle = "#24a0ce";
    ctx.fillRect(120, 0, 784, 8);
    ctx.fillRect(120, 152, 784, 8);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Inter, Arial, sans-serif";
    ctx.fillText("DREAM NEXUS RALLY", 512, 62);
    ctx.fillStyle = "#fdc6b5";
    ctx.font = "bold 36px Inter, Arial, sans-serif";
    ctx.fillText("SALIDA  ·  START", 512, 122);
  });
}

function asphaltTextTexture(text: string) {
  return canvasTexture(512, 128, (ctx) => {
    ctx.clearRect(0, 0, 512, 128);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "italic bold 96px Inter, Arial, sans-serif";
    ctx.fillText(text, 256, 68);
  });
}

function colombiaFlagTexture() {
  // Yellow takes the top half, blue and red a quarter each.
  return canvasTexture(96, 64, (ctx) => {
    ctx.fillStyle = "#fcd116";
    ctx.fillRect(0, 0, 96, 32);
    ctx.fillStyle = "#003893";
    ctx.fillRect(0, 32, 96, 16);
    ctx.fillStyle = "#ce1126";
    ctx.fillRect(0, 48, 96, 16);
  });
}

function nexusFlagTexture() {
  return canvasTexture(96, 64, (ctx) => {
    ctx.fillStyle = "#0e1b24";
    ctx.fillRect(0, 0, 96, 64);
    ctx.fillStyle = "#24a0ce";
    ctx.fillRect(0, 0, 10, 64);
    ctx.fillStyle = "#fdc6b5";
    ctx.font = "bold 20px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DN", 52, 33);
  });
}

/* ---------- Gantry with countdown lights ---------- */

const LIGHT_OFF = new THREE.Color("#2a0a0a");
const LIGHT_RED = new THREE.Color("#ff2a1f");
const LIGHT_GREEN = new THREE.Color("#27ff6a");

function Gantry() {
  const banner = useMemo(bannerTexture, []);
  const lightMats = useMemo(
    () => [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: LIGHT_OFF.clone(), toneMapped: false })),
    [],
  );
  const haloMats = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.MeshBasicMaterial({
            color: LIGHT_RED.clone(),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
    [],
  );
  const phase = useRally((s) => s.phase);
  const countdown = useRally((s) => s.countdown);
  const isCountingDown = useRally((s) => s.isCountingDown);

  // 3 -> one red, 2 -> two red, 1 -> three red, GO and racing -> all green.
  const green = (phase === "playing" && !isCountingDown) || (isCountingDown && countdown === 0);
  const lit = green ? 3 : isCountingDown ? 4 - countdown : 0;

  useFrame((state) => {
    const pulse = 0.75 + Math.sin(state.clock.elapsedTime * 10) * 0.25;
    lightMats.forEach((m, i) => {
      const on = i < lit;
      m.color.copy(on ? (green ? LIGHT_GREEN : LIGHT_RED) : LIGHT_OFF);
      haloMats[i].color.copy(green ? LIGHT_GREEN : LIGHT_RED);
      haloMats[i].opacity = on ? (green ? 0.55 : 0.45 * pulse) : 0;
    });
  });

  const steel = "#2b3038";
  const trussY = GANTRY_H;
  return (
    <group position={[0, 0, LINE_Z]}>
      {/* Pillars with cyan accent stripes */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * GANTRY_HALF_SPAN, 0, 0]}>
          <mesh position={[0, trussY / 2, 0]} castShadow>
            <boxGeometry args={[0.6, trussY, 0.6]} />
            <meshLambertMaterial color={steel} />
          </mesh>
          {[1.2, 2.4, 3.6, 4.8].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[0.64, 0.12, 0.64]} />
              <meshBasicMaterial color="#24a0ce" toneMapped={false} />
            </mesh>
          ))}
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[1.1, 0.5, 1.1]} />
            <meshLambertMaterial color="#1b1f24" />
          </mesh>
        </group>
      ))}

      {/* Truss beam: top and bottom chords with diagonal bracing */}
      {[trussY - 0.1, trussY + 0.9].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <boxGeometry args={[GANTRY_HALF_SPAN * 2 + 0.6, 0.18, 0.5]} />
          <meshLambertMaterial color={steel} />
        </mesh>
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const x = -GANTRY_HALF_SPAN + 0.5 + i * ((GANTRY_HALF_SPAN * 2 - 1) / 13);
        return (
          <mesh key={i} position={[x, trussY + 0.4, 0]} rotation={[0, 0, i % 2 ? 0.75 : -0.75]}>
            <boxGeometry args={[0.08, 1.3, 0.08]} />
            <meshLambertMaterial color="#454c56" />
          </mesh>
        );
      })}

      {/* Banner facing the car */}
      <mesh position={[0, trussY + 1.75, -0.05]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[GANTRY_HALF_SPAN * 2 - 0.4, 1.55]} />
        <meshBasicMaterial map={banner} toneMapped={false} />
      </mesh>
      <mesh position={[0, trussY + 1.75, 0.02]}>
        <planeGeometry args={[GANTRY_HALF_SPAN * 2 - 0.4, 1.55]} />
        <meshLambertMaterial color="#0e1b24" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (GANTRY_HALF_SPAN - 0.6), trussY + 1.0, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshLambertMaterial color={steel} />
        </mesh>
      ))}

      {/* Countdown light pod mounted on the front of the truss */}
      <mesh position={[0, trussY + 0.4, -0.35]}>
        <boxGeometry args={[3.4, 1.0, 0.3]} />
        <meshLambertMaterial color="#121418" />
      </mesh>
      {[-1, 0, 1].map((x, i) => (
        <group key={i} position={[x * 1.05, trussY + 0.4, -0.52]} rotation={[0, Math.PI, 0]}>
          <mesh material={lightMats[i]}>
            <circleGeometry args={[0.34, 24]} />
          </mesh>
          <mesh material={haloMats[i]} position={[0, 0, 0.02]}>
            <circleGeometry args={[0.6, 24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- Waving flags ---------- */

const FLAGS: { x: number; z: number; colombia: boolean }[] = [
  { x: -7.4, z: -4, colombia: true },
  { x: 7.4, z: -4, colombia: false },
  { x: -7.8, z: 12, colombia: false },
  { x: 7.8, z: 12, colombia: true },
  { x: -8.6, z: 22, colombia: true },
  { x: 8.6, z: 22, colombia: true },
];

function Flags() {
  const colombia = useMemo(colombiaFlagTexture, []);
  const nexus = useMemo(nexusFlagTexture, []);
  const geos = useMemo(
    () =>
      FLAGS.map(() => {
        const g = new THREE.PlaneGeometry(1.8, 1.2, 10, 4);
        g.translate(0.9, 0, 0);
        return g;
      }),
    [],
  );
  const base = useMemo(() => Float32Array.from(geos[0].attributes.position.array as Float32Array), [geos]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    geos.forEach((g, f) => {
      const p = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3];
        // Ripple grows towards the free edge of the flag.
        p.setZ(i, Math.sin(x * 3.2 - t * 6 - f) * 0.16 * (x / 1.8));
      }
      p.needsUpdate = true;
      g.computeVertexNormals();
    });
  });

  return (
    <>
      {FLAGS.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 6, 6]} />
            <meshLambertMaterial color="#e9e9e4" />
          </mesh>
          {/* Flags fly away from the road, facing the oncoming car */}
          <mesh geometry={geos[i]} position={[0, 5.2, 0]} rotation={[0, f.x < 0 ? Math.PI : 0, 0]}>
            <meshLambertMaterial map={f.colombia ? colombia : nexus} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ---------- Confetti burst on GO ---------- */

const CONFETTI = 260;
const CONFETTI_COLORS = ["#fcd116", "#003893", "#ce1126", "#24a0ce", "#fdc6b5", "#ffffff"];

function Confetti() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const startRef = useRef<number | null>(null);
  const countdown = useRally((s) => s.countdown);
  const isCountingDown = useRally((s) => s.isCountingDown);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pieces = useMemo(() => {
    const rand = seededRandom(2026);
    return Array.from({ length: CONFETTI }, () => ({
      x: (rand() - 0.5) * GANTRY_HALF_SPAN * 2,
      vx: (rand() - 0.5) * 3,
      vy: 2 + rand() * 4,
      vz: -1 - rand() * 4,
      spin: (rand() - 0.5) * 12,
      phase: rand() * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const color = new THREE.Color();
    for (let i = 0; i < CONFETTI; i++) mesh.setColorAt(i, color.set(CONFETTI_COLORS[i % CONFETTI_COLORS.length]));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.count = 0;
  }, []);

  // Fire on GO from the countdown itself, so a slow frame rate can't miss the moment.
  const pendingRef = useRef(false);
  useEffect(() => {
    if (isCountingDown && countdown === 0 && startRef.current === null) pendingRef.current = true;
  }, [isCountingDown, countdown]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (pendingRef.current) {
      pendingRef.current = false;
      startRef.current = state.clock.elapsedTime;
    }
    if (startRef.current === null) return;
    const t = state.clock.elapsedTime - startRef.current;
    if (t > 5) {
      mesh.count = 0;
      return;
    }
    mesh.count = CONFETTI;
    pieces.forEach((p, i) => {
      // Burst up out of the gantry, then flutter down with drag.
      const fall = Math.max(0, t - 0.4);
      dummy.position.set(
        p.x + p.vx * t + Math.sin(t * 3 + p.phase) * 0.3,
        GANTRY_H + p.vy * Math.min(t, 0.4) - 1.6 * fall * fall * 0.5 - fall * 0.8,
        LINE_Z + p.vz * Math.min(t, 1.5),
      );
      dummy.rotation.set(t * p.spin, t * p.spin * 0.7, p.phase);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFETTI]} frustumCulled={false}>
      <planeGeometry args={[0.16, 0.24]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}

/* ---------- Trackside: barriers, tyre stacks, spectators, paddock ---------- */

function firstMesh(scene: THREE.Object3D) {
  let found: THREE.Mesh | null = null;
  scene.traverse((o) => {
    if (!found && (o as THREE.Mesh).isMesh) found = o as THREE.Mesh;
  });
  return found as THREE.Mesh | null;
}

function Trackside() {
  const { scene: barrier } = useGLTF("/models/safety-barrier.glb");
  const { scene: spectators } = useGLTF("/models/spectators.glb");
  const { scene: tent } = useGLTF("/models/control-tent.glb");
  const { scene: van } = useGLTF("/models/service-van.glb");
  const { scene: timing } = useGLTF("/models/timing-display.glb");

  const barrierMesh = useMemo(() => firstMesh(barrier), [barrier]);
  const crowdMesh = useMemo(() => firstMesh(spectators), [spectators]);
  const tentClone = useMemo(() => tent.clone(true), [tent]);
  const vanClone = useMemo(() => van.clone(true), [van]);
  const timingClone = useMemo(() => timing.clone(true), [timing]);

  const barrierRef = useRef<THREE.InstancedMesh>(null);
  const crowdRef = useRef<THREE.InstancedMesh>(null);
  const tyreRef = useRef<THREE.InstancedMesh>(null);

  // Barriers line both sides of the start straight, just off the asphalt.
  const barrierSpots = useMemo(() => {
    const spots: { x: number; z: number; ry: number }[] = [];
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) spots.push({ x: s * (ROAD_HALF + 0.9), z: -12 + i * 3.4, ry: 0 });
    return spots;
  }, []);

  // Crowds behind the barriers, facing the road.
  const crowdSpots = useMemo(() => {
    const rand = seededRandom(31);
    const spots: { x: number; z: number; ry: number; s: number }[] = [];
    for (const s of [-1, 1])
      for (let i = 0; i < 5; i++)
        spots.push({ x: s * (ROAD_HALF + 3 + rand() * 1.5), z: -10 + i * 5.5 + rand() * 2, ry: s < 0 ? Math.PI / 4 : (3 * Math.PI) / 4, s: 1.7 + rand() * 0.3 });
    return spots;
  }, []);

  // Tyre stacks at the gantry feet and barrier ends.
  const tyreSpots = useMemo(() => {
    const spots: { x: number; y: number; z: number }[] = [];
    for (const s of [-1, 1])
      for (const z of [LINE_Z - 1.2, LINE_Z + 1.2, -13.5, 18.5])
        for (let k = 0; k < 3; k++) spots.push({ x: s * (GANTRY_HALF_SPAN + 0.1), y: 0.18 + k * 0.34, z });
    return spots;
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const fill = (mesh: THREE.InstancedMesh | null, n: number, set: (i: number) => void) => {
      if (!mesh) return;
      for (let i = 0; i < n; i++) {
        dummy.position.set(0, 0, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        set(i);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
    fill(barrierRef.current, barrierSpots.length, (i) => {
      const b = barrierSpots[i];
      dummy.position.set(b.x, 0, b.z);
      dummy.rotation.y = b.ry;
      dummy.scale.setScalar(1.3);
    });
    fill(crowdRef.current, crowdSpots.length, (i) => {
      const c = crowdSpots[i];
      dummy.position.set(c.x, -0.1, c.z);
      dummy.rotation.y = c.ry;
      dummy.scale.setScalar(c.s);
    });
    const tyreColor = new THREE.Color();
    fill(tyreRef.current, tyreSpots.length, (i) => {
      const t = tyreSpots[i];
      dummy.position.set(t.x, t.y, t.z);
      tyreRef.current?.setColorAt(i, tyreColor.set(i % 3 === 1 ? "#d23a2f" : "#1d1d1f"));
    });
    if (tyreRef.current?.instanceColor) tyreRef.current.instanceColor.needsUpdate = true;
  }, [barrierSpots, crowdSpots, tyreSpots]);

  return (
    <>
      {barrierMesh && (
        <instancedMesh ref={barrierRef} args={[barrierMesh.geometry, barrierMesh.material, barrierSpots.length]} castShadow />
      )}
      {crowdMesh && <instancedMesh ref={crowdRef} args={[crowdMesh.geometry, crowdMesh.material, crowdSpots.length]} />}
      <instancedMesh ref={tyreRef} args={[undefined, undefined, tyreSpots.length]}>
        <torusGeometry args={[0.38, 0.17, 6, 12]} />
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      {/* Paddock: race control tent, service van and the timing board */}
      <primitive object={tentClone} position={[-(ROAD_HALF + 8), -0.1, 3]} rotation={[0, Math.PI / 2, 0]} scale={3.2} />
      <primitive object={vanClone} position={[ROAD_HALF + 9, -0.1, 1]} rotation={[0, -Math.PI / 2 + 0.3, 0]} scale={3} />
      <primitive object={timingClone} position={[-(ROAD_HALF + 2.6), 0, LINE_Z + 3]} rotation={[0, Math.PI - 0.5, 0]} scale={2} />
    </>
  );
}

/* ---------- Road paint ---------- */

function RoadPaint() {
  const checker = useMemo(checkerTexture, []);
  const vamos = useMemo(() => asphaltTextTexture("¡VAMOS!"), []);
  const roadW = ROAD_HALF * 2;
  return (
    <>
      <mesh position={[0, 0.014, LINE_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roadW, 1.2]} />
        <meshLambertMaterial map={checker} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh position={[0, 0.014, LINE_Z + 9]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <planeGeometry args={[6, 1.5]} />
        <meshBasicMaterial map={vamos} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      {/* Grid box around the car's start position */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.6, 0.013, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.15, 4.2]} />
          <meshBasicMaterial color="#f4f4f0" polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      ))}
      <mesh position={[0, 0.013, -2.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.35, 0.15]} />
        <meshBasicMaterial color="#f4f4f0" polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </>
  );
}

export function StartLine() {
  return (
    <group>
      <RoadPaint />
      <Gantry />
      <Flags />
      <Confetti />
      <Trackside />
    </group>
  );
}
