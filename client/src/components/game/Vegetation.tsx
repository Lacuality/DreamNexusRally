import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { groundY, seededRandom, zoneBlendAt, type ZoneType } from "@/lib/scenery";
import { QUALITY } from "@/lib/quality";

/**
 * Colombian roadside and hillside plants: Quindío wax palms, jungle trees,
 * banana plants, guadua bamboo, coffee bushes, undergrowth and flowers.
 *
 * Every plant type is one InstancedMesh (one draw call) built from simple shapes.
 * Plants are placed per 20 m stretch of road from a seeded random generator, so a
 * stretch always looks the same, and they are re-laid only when the car enters a
 * new stretch (not every frame).
 */

type PlantType = "palm" | "tree" | "banana" | "bamboo" | "bush" | "coffee" | "flower";

const CHUNK = 20;
const BEHIND = 40;
const AHEAD = 240;
const CHUNKS_IN_VIEW = Math.ceil((BEHIND + AHEAD) / CHUNK) + 1;

// Plants per 20 m stretch (both sides together), per zone.
const DENSITY: Record<ZoneType, Record<PlantType, number>> = {
  coffee_hills: { palm: 2, tree: 3, banana: 6, bamboo: 1, bush: 8, coffee: 36, flower: 3 },
  jungle:       { palm: 1, tree: 16, banana: 5, bamboo: 4, bush: 16, coffee: 0, flower: 5 },
  cocora:       { palm: 12, tree: 2, banana: 1, bamboo: 0, bush: 5, coffee: 0, flower: 1 },
  pueblo:       { palm: 2, tree: 2, banana: 7, bamboo: 1, bush: 6, coffee: 8, flower: 6 },
};

// Distance from the road centre (metres) where each plant may grow.
const X_RANGE: Record<PlantType, [number, number]> = {
  palm: [11, 110],
  tree: [8, 120],
  banana: [7.5, 30],
  bamboo: [8.5, 40],
  bush: [6.8, 16],
  coffee: [15, 60],
  flower: [9, 18],
};

const SCALE_RANGE: Record<PlantType, [number, number]> = {
  palm: [0.8, 1.3],
  tree: [0.8, 1.9],
  banana: [0.9, 1.5],
  bamboo: [0.8, 1.3],
  bush: [0.6, 1.4],
  coffee: [0.8, 1.15],
  flower: [0.6, 1.1],
};

const MAX_PER_CHUNK: Record<PlantType, number> = {
  palm: 12, tree: 16, banana: 7, bamboo: 4, bush: 16, coffee: 36, flower: 6,
};

const TYPES = Object.keys(MAX_PER_CHUNK) as PlantType[];

// Colour variety for the plants tinted per instance.
const TINTS: Partial<Record<PlantType, string[]>> = {
  bush: ["#3f8a35", "#4f9a3a", "#2f7a32", "#5aa545", "#376f2c"],
  coffee: ["#2f6a2a", "#2a5f27", "#356f2e", "#3d7a33"],
  flower: ["#e2263b", "#d1307a", "#f08a24", "#f2c230", "#ff5a36"],
};

/* ---------- Geometry helpers ---------- */

function colored(geo: THREE.BufferGeometry, hex: string) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute("uv");
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

function merge(geos: THREE.BufferGeometry[]) {
  let count = 0;
  geos.forEach((g) => (count += g.attributes.position.count));
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  let o = 0;
  geos.forEach((g) => {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    col.set(g.attributes.color.array as Float32Array, o * 3);
    o += g.attributes.position.count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return out;
}

/** A leaf/frond strip pointing out along +x from the origin, rising then drooping. */
function frond(length: number, width: number, rise: number, droop: number, angle: number, hex: string) {
  const g = new THREE.PlaneGeometry(length, width, 4, 1);
  g.rotateX(-Math.PI / 2);
  g.translate(length / 2, 0, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const t = x / length;
    // Taper the tip and bend: up first, then down under its own weight.
    p.setZ(i, p.getZ(i) * (1 - t * 0.7));
    p.setY(i, rise * x - droop * t * t * length);
  }
  g.computeVertexNormals();
  g.rotateY(angle);
  return colored(g, hex);
}

function cylinder(rTop: number, rBottom: number, h: number, sides: number, hex: string) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, sides, 1, true);
  g.translate(0, h / 2, 0);
  return colored(g, hex);
}

function blob(r: number, x: number, y: number, z: number, hex: string, sy = 1) {
  const g = new THREE.IcosahedronGeometry(r, 0);
  g.scale(1, sy, 1);
  g.translate(x, y, z);
  return colored(g, hex);
}

/** Quindío wax palm: very tall pale trunk with a small crown, Colombia's national tree. */
function waxPalmGeometry() {
  const h = 20;
  const parts = [cylinder(0.2, 0.32, h, 6, "#d9d3c4"), blob(0.55, 0, h + 0.2, 0, "#55733a")];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const f = frond(4.6, 0.9, 0.55, 1.1, a, i % 2 ? "#3f7d3a" : "#5c9a45");
    f.translate(0, h, 0);
    parts.push(f);
  }
  return merge(parts);
}

function jungleTreeGeometry() {
  return merge([
    cylinder(0.25, 0.45, 7, 6, "#5b4632"),
    blob(3.2, 0, 7.6, 0, "#2f6e2e", 0.8),
    blob(2.4, 1.9, 6.9, 0.6, "#3c8034", 0.85),
    blob(2.6, -1.7, 7.1, -0.5, "#28602a", 0.85),
    blob(2.2, 0.3, 9.1, -0.4, "#4a8c3a", 0.8),
  ]);
}

function bananaGeometry() {
  const parts = [cylinder(0.12, 0.18, 1.8, 5, "#7a9a3c")];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const f = frond(2.5, 0.85, 1.0, 1.4, a, i % 2 ? "#69b23e" : "#4f9a35");
    f.translate(0, 1.7, 0);
    parts.push(f);
  }
  return merge(parts);
}

/** Guadua bamboo clump: a fan of tall leaning canes with leafy tops. */
function bambooGeometry() {
  const rand = seededRandom(99);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 8; i++) {
    const lean = 0.08 + rand() * 0.2;
    const dir = rand() * Math.PI * 2;
    const h = 8 + rand() * 3;
    const cane = new THREE.CylinderGeometry(0.08, 0.1, h, 5, 1, true);
    cane.translate(0, h / 2, 0);
    cane.rotateZ(lean);
    cane.rotateY(dir);
    cane.translate(Math.cos(dir) * 0.4, 0, Math.sin(dir) * 0.4);
    parts.push(colored(cane, "#8aa84a"));
    // Leafy tuft where the cane tip ends up.
    const tipX = -Math.sin(lean) * h;
    const tip = new THREE.Vector3(tipX, Math.cos(lean) * h, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), dir);
    parts.push(blob(1.1, tip.x + Math.cos(dir) * 0.4, tip.y - 0.3, tip.z + Math.sin(dir) * 0.4, "#6d9a3a", 0.55));
  }
  return merge(parts);
}

function tintableGeometry(type: PlantType) {
  // Smooth low-res spheres read as soft foliage (faceted icosahedrons looked like gems).
  if (type === "bush") {
    const g = new THREE.SphereGeometry(1, 8, 5);
    g.scale(1.3, 0.7, 1.3);
    g.translate(0, 0.35, 0);
    return g;
  }
  if (type === "coffee") {
    const g = new THREE.SphereGeometry(0.75, 7, 5);
    g.scale(1, 1.15, 1);
    g.translate(0, 0.7, 0);
    return g;
  }
  // Flowers: a small cluster of blossoms on a low shrub.
  return mergeGeometries([
    sphereAt(0.17, 0, 0.75, 0),
    sphereAt(0.14, 0.22, 0.62, 0.1),
    sphereAt(0.13, -0.18, 0.66, -0.12),
  ]);
}

function sphereAt(r: number, x: number, y: number, z: number) {
  const g = new THREE.SphereGeometry(r, 6, 4);
  g.translate(x, y, z);
  return g;
}

function buildMesh(type: PlantType) {
  const max = MAX_PER_CHUNK[type] * CHUNKS_IN_VIEW;
  let mesh: THREE.InstancedMesh;
  if (type === "bush" || type === "coffee" || type === "flower") {
    mesh = new THREE.InstancedMesh(
      tintableGeometry(type),
      new THREE.MeshLambertMaterial({ color: "#ffffff" }),
      max,
    );
    const white = new THREE.Color("#ffffff");
    for (let i = 0; i < max; i++) mesh.setColorAt(i, white);
  } else {
    const geo =
      type === "palm" ? waxPalmGeometry()
      : type === "tree" ? jungleTreeGeometry()
      : type === "banana" ? bananaGeometry()
      : bambooGeometry();
    mesh = new THREE.InstancedMesh(
      geo,
      new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }),
      max,
    );
  }
  mesh.count = 0;
  // Instances move with the car, so the mesh's own bounds would be wrong for culling.
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
}

/* ---------- Placement ---------- */

const TYPE_SEED: Record<PlantType, number> = {
  palm: 11, tree: 23, banana: 37, bamboo: 41, bush: 53, coffee: 67, flower: 79,
};

function layOut(meshes: Record<PlantType, THREE.InstancedMesh>, firstChunk: number) {
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (const type of TYPES) {
    const mesh = meshes[type];
    const [xMin, xMax] = X_RANGE[type];
    const [sMin, sMax] = SCALE_RANGE[type];
    const tints = TINTS[type];
    let n = 0;

    for (let c = 0; c < CHUNKS_IN_VIEW; c++) {
      const chunk = firstChunk + c;
      const z0 = chunk * CHUNK;
      if (z0 + CHUNK < -20) continue;
      const rand = seededRandom(chunk * 7919 + TYPE_SEED[type] * 104729 + 12345);
      const { zone, next, t } = zoneBlendAt(z0 + CHUNK / 2);
      // Near zone borders, mix plant counts from both zones.
      const count = Math.round((DENSITY[zone][type] * (1 - t) + DENSITY[next][type] * t) * QUALITY.vegetation);

      for (let i = 0; i < count && n < mesh.instanceMatrix.count; i++) {
        const side = rand() < 0.5 ? -1 : 1;
        const z = z0 + rand() * CHUNK;
        // Keep the start-line area clear for the grandstands and barriers.
        const minX = z < 30 ? Math.max(xMin, 18) : z < 70 ? Math.max(xMin, 13) : xMin;
        // Bias towards the road so more plants are actually seen.
        let d = minX + Math.pow(rand(), 1.6) * (xMax - minX);

        // Coffee grows in rows across the slopes (matching the striped ground).
        if (type === "coffee") {
          let tries = 0;
          while (Math.sin(z * 0.55 + d * 0.12) < 0.45 && tries++ < 6) d = minX + rand() * (xMax - minX);
        }

        const x = side * d;
        const s = sMin + rand() * (sMax - sMin);
        dummy.position.set(x, groundY(x, z) - 0.05, z);
        dummy.rotation.set((rand() - 0.5) * 0.08, rand() * Math.PI * 2, (rand() - 0.5) * 0.08);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.setMatrixAt(n, dummy.matrix);
        if (tints) mesh.setColorAt(n, color.set(tints[Math.floor(rand() * tints.length)]));
        n++;
      }
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
}

export function Vegetation({ carPositionRef }: { carPositionRef: React.MutableRefObject<THREE.Vector3> }) {
  const meshes = useMemo(
    () => Object.fromEntries(TYPES.map((t) => [t, buildMesh(t)])) as Record<PlantType, THREE.InstancedMesh>,
    [],
  );
  const firstChunkRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      Object.values(meshes).forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
    },
    [meshes],
  );

  useFrame(() => {
    const first = Math.floor((carPositionRef.current.z - BEHIND) / CHUNK);
    if (first !== firstChunkRef.current) {
      firstChunkRef.current = first;
      layOut(meshes, first);
    }
  });

  return (
    <group>
      {TYPES.map((t) => (
        <primitive key={t} object={meshes[t]} />
      ))}
    </group>
  );
}
