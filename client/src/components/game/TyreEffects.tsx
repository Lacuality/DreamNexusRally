import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { carTelemetry } from "@/lib/carPhysics";

// Rear wheel positions relative to the car's centre (metres, car space: +x left, +z forward).
const REAR_WHEELS: [number, number][] = [[0.7, -0.8], [-0.7, -0.8]];

function isScrubbing() {
  const t = carTelemetry;
  return t.speed > 6 && !t.onGrass && (Math.abs(t.slip) > 0.09 || t.hardBraking || (t.handbrake && t.speed > 8));
}

function rearWheelWorld(i: number, out: THREE.Vector3) {
  const [lx, lz] = REAR_WHEELS[i];
  const c = Math.cos(carTelemetry.heading);
  const s = Math.sin(carTelemetry.heading);
  return out.set(carTelemetry.x + lx * c + lz * s, 0, carTelemetry.z - lx * s + lz * c);
}

/** Black rubber marks left on the asphalt while the tyres slide or lock up. */
const MARKS = 500;
export function SkidMarks() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const next = useRef(0);
  const last = useRef([new THREE.Vector3(1e9, 0, 0), new THREE.Vector3(1e9, 0, 0)]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const p = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (let i = 0; i < MARKS; i++) mesh.setMatrixAt(i, dummy.matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!isScrubbing()) {
      last.current.forEach((v) => v.set(1e9, 0, 0));
      return;
    }
    let changed = false;
    for (let w = 0; w < 2; w++) {
      rearWheelWorld(w, p);
      const prev = last.current[w];
      const d = prev.x > 1e8 ? 0.5 : p.distanceTo(prev);
      if (d < 0.45) continue;
      // Each mark is a strip from the previous point to this one, so marks join up.
      const from = prev.x > 1e8 ? p.clone().setZ(p.z - 0.45) : prev;
      dummy.position.set((p.x + from.x) / 2, 0.016, (p.z + from.z) / 2);
      dummy.rotation.set(-Math.PI / 2, 0, Math.atan2(p.x - from.x, p.z - from.z));
      dummy.scale.set(1, Math.max(d, 0.45), 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(next.current, dummy.matrix);
      next.current = (next.current + 1) % MARKS;
      prev.copy(p);
      changed = true;
    }
    if (changed) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MARKS]} frustumCulled={false} renderOrder={1}>
      <planeGeometry args={[0.24, 1]} />
      <meshBasicMaterial color="#111111" transparent opacity={0.5} depthWrite={false} polygonOffset polygonOffsetFactor={-3} />
    </instancedMesh>
  );
}

/** Puffs of tyre smoke from the rear wheels while sliding. */
const PUFFS = 36;
export function TyreSmoke() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const puffs = useMemo(
    () => Array.from({ length: PUFFS }, () => ({ pos: new THREE.Vector3(), age: 99, life: 1, drift: new THREE.Vector3() })),
    [],
  );
  const next = useRef(0);
  const spawnTimer = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const p = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const delta = Math.min(rawDelta, 0.1);

    if (isScrubbing()) {
      spawnTimer.current -= delta;
      if (spawnTimer.current <= 0) {
        spawnTimer.current = 0.09;
        for (let w = 0; w < 2; w++) {
          const puff = puffs[next.current];
          next.current = (next.current + 1) % PUFFS;
          rearWheelWorld(w, p);
          puff.pos.set(p.x, 0.35, p.z);
          puff.age = 0;
          puff.life = 0.9 + Math.random() * 0.5;
          puff.drift.set((Math.random() - 0.5) * 1.2, 0.8 + Math.random() * 0.6, -carTelemetry.speed * 0.15);
        }
      }
    }

    puffs.forEach((puff, i) => {
      puff.age += delta;
      const t = puff.age / puff.life;
      if (t >= 1) {
        dummy.scale.setScalar(0);
      } else {
        puff.pos.addScaledVector(puff.drift, delta);
        dummy.position.copy(puff.pos);
        // Grow as it rises, then shrink away so it fades out without per-puff transparency.
        dummy.scale.setScalar(0.4 + t * 1.3 * (1 - t * 0.7));
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PUFFS]} frustumCulled={false}>
      <icosahedronGeometry args={[0.42, 1]} />
      <meshLambertMaterial color="#e9ecec" transparent opacity={0.28} depthWrite={false} />
    </instancedMesh>
  );
}
