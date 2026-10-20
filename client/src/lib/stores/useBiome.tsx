import { create } from "zustand";

import { ZONE_ATMOSPHERE, ZONE_SEQUENCE, zoneAt, type ZoneType } from "@/lib/scenery";

export type BiomeType = ZoneType;

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = parseInt(color1.replace("#", ""), 16);
  const c2 = parseInt(color2.replace("#", ""), 16);

  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;

  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function lerpNumber(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export interface BiomeConfig {
  name: string;
  skyColor: string; // horizon colour, also the background behind everything
  skyTop: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  sunIntensity: number;
  ambientIntensity: number;
}

const ZONE_NAMES: Record<BiomeType, string> = {
  coffee_hills: "Eje Cafetero",
  jungle: "Selva",
  cocora: "Valle de Cocora",
  pueblo: "Pueblo",
};

export const BIOME_CONFIGS = Object.fromEntries(
  ZONE_SEQUENCE.map((zone) => {
    const a = ZONE_ATMOSPHERE[zone];
    return [zone, {
      name: ZONE_NAMES[zone],
      skyColor: a.skyHorizon,
      skyTop: a.skyTop,
      fogColor: a.fog,
      fogNear: a.fogNear,
      fogFar: a.fogFar,
      sunIntensity: a.sun,
      ambientIntensity: a.ambient,
    }];
  }),
) as Record<BiomeType, BiomeConfig>;

interface BiomeState {
  currentBiome: BiomeType;
  previousBiome: BiomeType | null;
  currentDistance: number;
  transitionProgress: number;
  isTransitioning: boolean;

  updateDistance: (distance: number) => void;
  updateTransition: (delta: number) => void;
  getCurrentConfig: () => BiomeConfig;
  getPreviousConfig: () => BiomeConfig | null;
}

// Sky, fog and light colours ease between zones over this many seconds.
const TRANSITION_DURATION = 3;

export const useBiome = create<BiomeState>((set, get) => ({
  currentBiome: "coffee_hills",
  previousBiome: null,
  currentDistance: 0,
  transitionProgress: 1.0,
  isTransitioning: false,

  updateDistance: (distance: number) => {
    const state = get();
    set({ currentDistance: distance });

    const newBiome = zoneAt(distance);

    if (newBiome !== state.currentBiome) {
      console.log(
        `Biome transition: ${state.currentBiome} → ${newBiome} at ${distance.toFixed(0)}m`,
      );
      set({
        previousBiome: state.currentBiome,
        currentBiome: newBiome,
        transitionProgress: 0.0,
        isTransitioning: true,
      });
    }
  },

  updateTransition: (delta: number) => {
    const state = get();
    if (state.isTransitioning) {
      const newProgress = Math.min(
        1.0,
        state.transitionProgress + delta / TRANSITION_DURATION,
      );
      set({ transitionProgress: newProgress });

      if (newProgress >= 1.0) {
        set({ isTransitioning: false, previousBiome: null });
      }
    }
  },

  getCurrentConfig: () => {
    const state = get();
    return BIOME_CONFIGS[state.currentBiome];
  },

  getPreviousConfig: () => {
    const state = get();
    return state.previousBiome ? BIOME_CONFIGS[state.previousBiome] : null;
  },
}));
