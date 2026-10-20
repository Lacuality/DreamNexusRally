import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSettings } from "@/lib/stores/useSettings";
import { useBiome, lerpColor, lerpNumber } from "@/lib/stores/useBiome";
import {
  fbm,
  groundColor,
  seededRandom,
  terrainHeight,
  TERRAIN_Y,
  zoneBlendAt,
} from "@/lib/scenery";

type CarRef = React.MutableRefObject<THREE.Vector3>;

export function Environment({ carPositionRef }: { carPositionRef?: CarRef } = {}) {
  const updateTransition = useBiome((s) => s.updateTransition);
  useFrame((_, delta) => updateTransition(delta));

  return (
    <>
      <SkyAndFog />
      <SkyDome />
      <Clouds carPositionRef={carPositionRef} />
      <MountainRanges carPositionRef={carPositionRef} />
      <Lights carPositionRef={carPositionRef} />
      <Terrain carPositionRef={carPositionRef} />
      <ValleyMist carPositionRef={carPositionRef} />
    </>
  );
}

/** Current zone colours, eased while switching zones. */
function useAtmosphere() {
  const weather = useSettings((s) => s.weather);
  const current = useBiome((s) => s.getCurrentConfig());
  const prev = useBiome((s) => s.getPreviousConfig());
  const t = useBiome((s) => s.transitionProgress);
  const isX = useBiome((s) => s.isTransitioning);

  let horizon = current.skyColor;
  let top = current.skyTop;
  let fog = current.fogColor;
  let near = current.fogNear;
  let far = current.fogFar;
  if (isX && prev) {
    horizon = lerpColor(prev.skyColor, current.skyColor, t);
    top = lerpColor(prev.skyTop, current.skyTop, t);
    fog = lerpColor(prev.fogColor, current.fogColor, t);
    near = lerpNumber(prev.fogNear, current.fogNear, t);
    far = lerpNumber(prev.fogFar, current.fogFar, t);
  }
  if (weather === "overcast") {
    horizon = "#c9d2d6";
    top = "#9aa8b1";
    fog = "#c3ccd0";
    near = 30;
    far = 140;
  }
  return { horizon, top, fog, near, far };
}

/** ---------- Background + fog (light, humid haze instead of a dark night sky) */
function SkyAndFog() {
  const { horizon, fog, near, far } = useAtmosphere();
  return (
    <>
      <color attach="background" args={[horizon]} />
      <fog attach="fog" args={[fog, near, far]} />
    </>
  );
}

/** ---------- Sky dome: blue overhead fading to a bright haze at the horizon, with a sun glow.
 *  It follows the camera and sits inside the camera's far plane, so it is always drawn. */
const SKY_RADIUS = 185;
const SUN_DIRECTION = new THREE.Vector3(0.45, 0.55, 0.7).normalize();

function SkyDome() {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const { horizon, top } = useAtmosphere();

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(top) },
          horizonColor: { value: new THREE.Color(horizon) },
          sunDir: { value: SUN_DIRECTION },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 topColor;
          uniform vec3 horizonColor;
          uniform vec3 sunDir;
          varying vec3 vDir;
          void main() {
            float h = max(vDir.y, 0.0);
            // Three stops (horizon -> pale sky blue -> zenith) so warm horizons
            // don't blend into a grey band on the way to the blue.
            vec3 mid = mix(topColor, vec3(0.86, 0.93, 1.0), 0.55);
            vec3 col = h < 0.25
              ? mix(horizonColor, mid, smoothstep(0.0, 0.25, h))
              : mix(mid, topColor, smoothstep(0.25, 0.9, h));
            float sun = max(dot(normalize(vDir), sunDir), 0.0);
            col += vec3(1.0, 0.9, 0.7) * (pow(sun, 64.0) * 0.6 + pow(sun, 8.0) * 0.12);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );

  useFrame(() => {
    (material.uniforms.topColor.value as THREE.Color).set(top);
    (material.uniforms.horizonColor.value as THREE.Color).set(horizon);
    meshRef.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={meshRef} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[SKY_RADIUS, 24, 12]} />
    </mesh>
  );
}

/** ---------- Puffy white clouds drifting high above the valley */
const CLOUD_COUNT = 14;

function Clouds({ carPositionRef }: { carPositionRef?: CarRef }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const geometry = useMemo(() => {
    // One cloud = a few squashed blobs; merged by hand into one geometry.
    const parts = [
      [0, 0, 0, 1.0], [1.3, 0.2, 0.3, 0.8], [-1.2, 0.1, -0.2, 0.75], [0.5, 0.55, -0.4, 0.7], [-0.4, 0.45, 0.5, 0.6],
    ];
    const geos = parts.map(([x, y, z, r]) => {
      const g = new THREE.IcosahedronGeometry(r, 1);
      g.translate(x, y, z);
      return g;
    });
    const merged = mergeSimple(geos);
    merged.scale(9, 4, 7);
    return merged;
  }, []);

  const clouds = useMemo(() => {
    const rand = seededRandom(4242);
    return Array.from({ length: CLOUD_COUNT }, () => ({
      angle: rand() * Math.PI * 2,
      radius: 110 + rand() * 55,
      height: 42 + rand() * 26,
      scale: 0.7 + rand() * 0.8,
      drift: 0.6 + rand() * 0.8,
    }));
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const car = carPositionRef?.current;
    const cx = car?.x ?? 0;
    const cz = car?.z ?? 0;
    const time = state.clock.elapsedTime;
    clouds.forEach((c, i) => {
      const a = c.angle + time * 0.004 * c.drift;
      dummy.position.set(cx + Math.sin(a) * c.radius, c.height, cz + Math.cos(a) * c.radius);
      dummy.scale.setScalar(c.scale);
      dummy.rotation.set(0, a, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, CLOUD_COUNT]} frustumCulled={false}>
      <meshLambertMaterial color="#ffffff" emissive="#eef3f6" emissiveIntensity={0.85} fog={false} />
    </instancedMesh>
  );
}

/** ---------- Andes ranges on the horizon: three layers that get paler with distance.
 *  They travel with the car, like real far-off mountains, and open up where the road runs. */
const RANGES = [
  { radius: 205, min: 38, max: 92, seed: 11, base: "#b3cbd2", peak: "#8fadbd" },
  { radius: 182, min: 24, max: 62, seed: 27, base: "#93b6a8", peak: "#6b9584" },
  { radius: 160, min: 14, max: 40, seed: 53, base: "#78a582", peak: "#4d8058" },
];

function makeRange(radius: number, minH: number, maxH: number, seed: number, base: string, peak: string) {
  const segments = 180;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const cBase = new THREE.Color(base);
  const cPeak = new THREE.Color(peak);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.sin(a) * radius;
    const z = Math.cos(a) * radius;
    // Jagged ridgeline from layered noise around the circle.
    const n = fbm(Math.cos(a) * 3 + seed, Math.sin(a) * 3 - seed, 5, 0.55);
    let h = minH + (maxH - minH) * Math.pow(n, 1.4) * 1.6;
    // Lower the ridges straight ahead and behind, where the valley carries the road.
    const ahead = Math.min(Math.abs(a), Math.abs(a - Math.PI * 2));
    const behind = Math.abs(a - Math.PI);
    const gap = Math.max(Math.exp(-((ahead / 0.32) ** 2)), Math.exp(-((behind / 0.32) ** 2)));
    h *= 1 - 0.55 * gap;
    positions.push(x, -12, z, x, h, z);
    colors.push(cBase.r, cBase.g, cBase.b, cPeak.r, cPeak.g, cPeak.b);
    if (i < segments) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  return g;
}

function MountainRanges({ carPositionRef }: { carPositionRef?: CarRef }) {
  const groupRef = useRef<THREE.Group>(null);
  const geometries = useMemo(
    () => RANGES.map((r) => makeRange(r.radius, r.min, r.max, r.seed, r.base, r.peak)),
    [],
  );

  useFrame(() => {
    const car = carPositionRef?.current;
    if (groupRef.current && car) groupRef.current.position.set(car.x, 0, car.z);
  });

  return (
    <group ref={groupRef}>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} renderOrder={-9 + i} frustumCulled={false}>
          <meshBasicMaterial vertexColors side={THREE.DoubleSide} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

/** ---------- Low mist banks drifting over the valley slopes (strongest in cloud forest) */
const MIST_COUNT = 10;
const MIST_OPACITY: Record<string, number> = { coffee_hills: 0.16, jungle: 0.26, cocora: 0.38, pueblo: 0.1 };

function ValleyMist({ carPositionRef }: { carPositionRef?: CarRef }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const banks = useMemo(() => {
    const rand = seededRandom(777);
    return Array.from({ length: MIST_COUNT }, (_, i) => ({
      side: i % 2 === 0 ? -1 : 1,
      x: 30 + rand() * 60,
      y: 9 + rand() * 9,
      offset: rand() * 260,
      w: 50 + rand() * 40,
      d: 18 + rand() * 16,
    }));
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    const car = carPositionRef?.current;
    if (!mesh || !car) return;
    banks.forEach((b, i) => {
      // Each bank loops through a 260 m window ahead of the car, drifting slowly sideways.
      const z = car.z - 30 + ((b.offset - car.z) % 260 + 260) % 260;
      const x = b.side * (b.x + Math.sin(state.clock.elapsedTime * 0.05 + i) * 6);
      dummy.position.set(x, b.y, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(b.w, b.d, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (materialRef.current) {
      const { zone, next, t } = zoneBlendAt(car.z);
      materialRef.current.opacity = MIST_OPACITY[zone] + (MIST_OPACITY[next] - MIST_OPACITY[zone]) * t;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MIST_COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#f4f8f8"
        transparent
        opacity={0.2}
        depthWrite={false}
        side={THREE.DoubleSide}
        alphaMap={MIST_ALPHA}
      />
    </instancedMesh>
  );
}

// Soft round alpha mask so mist banks have no hard edges.
const MIST_ALPHA = (() => {
  if (typeof document === "undefined") return null;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
})();

/** Merge non-indexed copies of simple geometries (position + normal only). */
export function mergeSimple(geos: THREE.BufferGeometry[]) {
  const flat = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let count = 0;
  flat.forEach((g) => (count += g.attributes.position.count));
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  let o = 0;
  flat.forEach((g) => {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    o += g.attributes.position.count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  return out;
}

/** ---------- Lights (sun + fill + rim), biome-aware intensities */
// Phones get a smaller shadow map; it is one of the most expensive parts of a frame.
const SHADOW_MAP_SIZE = typeof window !== "undefined" && window.innerWidth < 768 ? 1024 : 2048;
const SUN_OFFSET = new THREE.Vector3(12, 18, 8);

function Lights({ carPositionRef }: { carPositionRef?: React.MutableRefObject<THREE.Vector3> }) {
  const sunRef = useRef<THREE.DirectionalLight>(null);

  // Keep the sun (and its shadow box) centred on the car, or shadows stop after the start line.
  useFrame(() => {
    const light = sunRef.current;
    const car = carPositionRef?.current;
    if (!light || !car) return;
    light.position.set(car.x + SUN_OFFSET.x, SUN_OFFSET.y, car.z + SUN_OFFSET.z);
    light.target.position.set(car.x, 0, car.z);
    light.target.updateMatrixWorld();
  });

  const weather = useSettings((s) => s.weather);
  const current = useBiome((s) => s.getCurrentConfig());
  const prev = useBiome((s) => s.getPreviousConfig());
  const t = useBiome((s) => s.transitionProgress);
  const isX = useBiome((s) => s.isTransitioning);

  let sun = current.sunIntensity;
  let amb = current.ambientIntensity;

  if (isX && prev) {
    sun = lerpNumber(prev.sunIntensity, current.sunIntensity, t);
    amb = lerpNumber(prev.ambientIntensity, current.ambientIntensity, t);
  }
  if (weather === "overcast") {
    sun = 0.9;
    amb = 0.55;
  }

  return (
    <>
      {/* Sky-blue from above, grass-green bounce from below: daylight in a green valley */}
      <hemisphereLight intensity={0.55} color={"#cfe8ff"} groundColor={"#4f7f3a"} />
      <ambientLight intensity={amb * 0.6} />
      <directionalLight
        ref={sunRef}
        position={[12, 18, 8]}
        intensity={sun}
        color="#fff1d6"
        castShadow
        shadow-mapSize-width={SHADOW_MAP_SIZE}
        shadow-mapSize-height={SHADOW_MAP_SIZE}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      {/* subtle back rim so silhouettes read against the sky */}
      <directionalLight position={[-10, 8, -12]} intensity={0.25} />
    </>
  );
}

/** ---------- Terrain: a valley with steep green walls, coloured per zone.
 *  It follows the car in steps; heights and colours come from world position, so hills stay put. */
const TERRAIN_W = 320;
const TERRAIN_L = 520;
const TERRAIN_STEP = 40;
const TERRAIN_AHEAD = 150;

function Terrain({ carPositionRef }: { carPositionRef?: CarRef }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const centerRef = useRef<number | null>(null);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(TERRAIN_W, TERRAIN_L, 110, 170);
    g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
    return g;
  }, []);

  const rebuild = (centerZ: number) => {
    const p = geo.attributes.position as THREE.BufferAttribute;
    const col = geo.attributes.color as THREE.BufferAttribute;
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      // The sheet is rotated -90 degrees about X: local y maps to world -z.
      const z = centerZ - p.getY(i);
      const h = terrainHeight(x, z);
      p.setZ(i, h);
      groundColor(x, z, h, c);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    p.needsUpdate = true;
    col.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  };

  useFrame(() => {
    const carZ = carPositionRef?.current.z ?? 0;
    const center = Math.round((carZ + TERRAIN_AHEAD) / TERRAIN_STEP) * TERRAIN_STEP;
    if (center !== centerRef.current) {
      centerRef.current = center;
      rebuild(center);
      if (meshRef.current) meshRef.current.position.z = center;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, TERRAIN_Y, TERRAIN_AHEAD]} receiveShadow>
      <primitive object={geo} />
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}
