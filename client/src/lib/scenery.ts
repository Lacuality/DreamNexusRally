// Shared scenery rules: which Colombian zone you're in, the valley-shaped ground,
// and the colour palettes. Everything is a pure function of world position, so
// the terrain, plants and sky all agree and stay put as the car drives.

import * as THREE from "three";

export type ZoneType = "coffee_hills" | "jungle" | "cocora" | "pueblo";

// Each zone lasts this many metres, then the next one starts.
export const ZONE_LENGTH = 500;
// Distance over which neighbouring zones blend into each other.
const ZONE_BLEND = 80;
export const ZONE_SEQUENCE: ZoneType[] = ["coffee_hills", "jungle", "cocora", "pueblo"];

/** Zone at a world z (the road runs along +z from 0). */
export function zoneAt(z: number): ZoneType {
  const i = Math.floor(Math.max(0, z) / ZONE_LENGTH) % ZONE_SEQUENCE.length;
  return ZONE_SEQUENCE[i];
}

/** Zone at z, the next zone, and how far (0..1) we are blended into the next one. */
export function zoneBlendAt(z: number): { zone: ZoneType; next: ZoneType; t: number } {
  const zz = Math.max(0, z);
  const local = zz % ZONE_LENGTH;
  const zone = zoneAt(zz);
  const next = zoneAt(zz + ZONE_LENGTH);
  const start = ZONE_LENGTH - ZONE_BLEND / 2;
  const t = local > start ? smoothstep((local - start) / ZONE_BLEND) : 0;
  return { zone, next, t };
}

export function smoothstep(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/* ---------- Deterministic noise ---------- */

function hash2(x: number, y: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x: number, y: number) {
  const iX = Math.floor(x), iY = Math.floor(y);
  const fx = x - iX, fy = y - iY;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const n00 = hash2(iX, iY), n10 = hash2(iX + 1, iY);
  const n01 = hash2(iX, iY + 1), n11 = hash2(iX + 1, iY + 1);
  const nx0 = n00 + (n10 - n00) * ux;
  const nx1 = n01 + (n11 - n01) * ux;
  return nx0 + (nx1 - nx0) * uy;
}

/** Fractal noise in 0..1. */
export function fbm(x: number, y: number, octaves = 4, falloff = 0.5) {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * smoothNoise(x * freq, y * freq);
    norm += amp;
    amp *= falloff;
    freq *= 2;
  }
  return sum / norm;
}

/** Small seeded random generator, so each stretch of road always looks the same. */
export function seededRandom(seed: number) {
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ---------- Ground shape ---------- */

// The terrain mesh sits this far below the road surface (road is at y = 0).
export const TERRAIN_Y = -0.6;
// Flat verge beside the road, just under the asphalt so grass never pokes through.
const VERGE = 0.45;
const VERGE_HALF_WIDTH = 7;
const VALLEY_FLOOR_HALF_WIDTH = 13;

// How tall the valley walls get, per zone.
const MOUNTAIN_SCALE: Record<ZoneType, number> = {
  coffee_hills: 1.0,
  jungle: 0.75,
  cocora: 1.25,
  pueblo: 0.55,
};

/** Terrain height (relative to TERRAIN_Y) at a world position. */
export function terrainHeight(x: number, z: number) {
  const d = Math.abs(x);
  if (d < VERGE_HALF_WIDTH) return VERGE;

  const { zone, next, t } = zoneBlendAt(z);
  const scale = MOUNTAIN_SCALE[zone] + (MOUNTAIN_SCALE[next] - MOUNTAIN_SCALE[zone]) * t;

  // Valley walls rise away from the road and level off towards the ridgeline.
  const wall = d > VALLEY_FLOOR_HALF_WIDTH ? 34 * (1 - Math.exp(-(d - VALLEY_FLOOR_HALF_WIDTH) / 45)) : 0;
  // Ridges and spurs: noise that grows with distance from the road.
  const ridges = (fbm((x + 1000) * 0.018, (z + 1000) * 0.012, 4, 0.55) - 0.35) * (2.5 + d * 0.16);
  const rolling = (fbm((x - 300) * 0.06, (z + 50) * 0.05, 2, 0.5) - 0.5) * 1.6;
  const hills = Math.max(VERGE - 0.4, wall * scale + ridges * scale + rolling);

  // Blend from the flat verge into the slopes.
  const k = smoothstep((d - VERGE_HALF_WIDTH) / 9);
  return VERGE + (hills - VERGE) * k;
}

/** World y of the ground surface at (x, z). */
export function groundY(x: number, z: number) {
  return TERRAIN_Y + terrainHeight(x, z);
}

/* ---------- Colours ---------- */

interface ZonePalette {
  low: THREE.Color;   // valley floor / pasture
  mid: THREE.Color;   // slopes
  high: THREE.Color;  // forested ridges
  accent: THREE.Color; // coffee rows, earth patches, etc.
}

const c = (hex: string) => new THREE.Color(hex);

export const ZONE_PALETTES: Record<ZoneType, ZonePalette> = {
  coffee_hills: { low: c("#7fb54a"), mid: c("#4f913a"), high: c("#2e6b34"), accent: c("#2f5a26") },
  jungle:       { low: c("#4a9a3c"), mid: c("#2f7a33"), high: c("#1d5a2a"), accent: c("#3f8a2e") },
  cocora:       { low: c("#93c75a"), mid: c("#62a043"), high: c("#3a7a3f"), accent: c("#7db650") },
  pueblo:       { low: c("#9bba55"), mid: c("#6f9a40"), high: c("#47783a"), accent: c("#a77b4f") },
};

export interface ZoneAtmosphere {
  skyTop: string;
  skyHorizon: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  sun: number;
  ambient: number;
}

export const ZONE_ATMOSPHERE: Record<ZoneType, ZoneAtmosphere> = {
  // Clear Eje Cafetero morning
  coffee_hills: { skyTop: "#3a8ad6", skyHorizon: "#cfe6ee", fog: "#c9dfe2", fogNear: 70, fogFar: 215, sun: 1.7, ambient: 0.6 },
  // Humid, greener haze under the canopy
  jungle:       { skyTop: "#4c93c4", skyHorizon: "#d2e6da", fog: "#b9d3c3", fogNear: 45, fogFar: 185, sun: 1.45, ambient: 0.62 },
  // Cloud forest: soft, misty light around the wax palms
  cocora:       { skyTop: "#7aa5c8", skyHorizon: "#e2eaec", fog: "#d6e2e3", fogNear: 40, fogFar: 175, sun: 1.35, ambient: 0.7 },
  // Warm late-afternoon light over the pueblo
  pueblo:       { skyTop: "#3a82cc", skyHorizon: "#f2dec2", fog: "#e6d8c4", fogNear: 70, fogFar: 215, sun: 1.75, ambient: 0.6 },
};

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

/** Ground colour for a vertex at (x, z) with terrain height h. */
export function groundColor(x: number, z: number, h: number, out: THREE.Color) {
  const { zone, next, t } = zoneBlendAt(z);
  paletteColor(zone, x, z, h, tmpA);
  if (t > 0) {
    paletteColor(next, x, z, h, tmpB);
    tmpA.lerp(tmpB, t);
  }
  return out.copy(tmpA);
}

function paletteColor(zone: ZoneType, x: number, z: number, h: number, out: THREE.Color) {
  const p = ZONE_PALETTES[zone];
  const d = Math.abs(x);
  // Higher ground gets darker forest colours.
  const heightT = smoothstep((h - 1) / 22);
  if (heightT < 0.5) out.copy(p.low).lerp(p.mid, heightT * 2);
  else out.copy(p.mid).lerp(p.high, (heightT - 0.5) * 2);

  // Patchy variation so slopes don't look like flat paint.
  const patch = fbm(x * 0.05 + 77, z * 0.05 - 31, 3, 0.5);
  out.multiplyScalar(0.82 + patch * 0.36);

  // Coffee rows striping the slopes in coffee country.
  if (zone === "coffee_hills" && d > 15 && d < 70) {
    const rows = Math.sin(z * 0.55 + x * 0.12);
    if (rows > 0.35) out.lerp(p.accent, 0.55);
  }
  // Bare earth patches around the pueblo.
  if (zone === "pueblo" && d > 10 && patch > 0.62) out.lerp(p.accent, 0.5);
  return out;
}
