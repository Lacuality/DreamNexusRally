import * as THREE from "three";

// Phones (and other low-power devices) get a lighter renderer. Many phone browsers,
// especially in-app web views, run out of graphics memory on the full settings:
// the 3D context is lost, and after a few losses the browser refuses to create a
// new one ("Error creating WebGL context").
function detectLowPower() {
  if (typeof window === "undefined") return false;
  try {
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const small = Math.min(window.innerWidth, window.innerHeight) < 820;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowMemory = (nav.deviceMemory ?? 8) <= 4;
    const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
    return (coarse && small) || lowMemory || fewCores;
  } catch {
    return false;
  }
}

export const LOW_POWER = detectLowPower();

export const QUALITY = {
  /** Device pixel ratio range for the canvas. */
  dpr: (LOW_POWER ? [1, 1] : [1, 1.75]) as [number, number],
  antialias: !LOW_POWER,
  shadows: LOW_POWER ? false : ({ type: THREE.PCFSoftShadowMap } as const),
  /** Multiplier on roadside plant counts. */
  vegetation: LOW_POWER ? 0.55 : 1,
};

/** Shared WebGL settings for both canvases (menu and race). */
export const GL_OPTIONS = {
  antialias: QUALITY.antialias,
  powerPreference: "default" as const,
  toneMapping: THREE.ACESFilmicToneMapping,
};

/**
 * If the browser drops the 3D context (memory pressure, app switching), ask it to
 * give the context back instead of leaving a dead canvas.
 */
export function keepContextAlive(canvas: HTMLCanvasElement) {
  canvas.addEventListener("webglcontextlost", (event) => {
    console.warn("[WebGL] context lost; waiting for the browser to restore it");
    event.preventDefault();
  });
  canvas.addEventListener("webglcontextrestored", () => {
    console.info("[WebGL] context restored");
  });
}
