import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Roadside Dream Nexus billboards, repeating all along the road.
const SPACING = 90;          // metres between billboards (alternating sides)
const VISIBLE = 4;           // billboards kept around the car at once
const FIRST_Z = 25;
const SIDE_X = 7.6;
const PANEL_W = 4.4;
const PANEL_H = 1.7;
const POST_H = 3.4;
const TOE_IN = 0.45;         // radians the panel turns toward the oncoming car

function makeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 396;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#14303f");
    g.addColorStop(1, "#0e1b24");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#24a0ce";
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 112px Inter, Arial, sans-serif";
    ctx.fillText("DREAM NEXUS", canvas.width / 2, 160);
    ctx.fillStyle = "#fdc6b5";
    ctx.font = "bold 60px Inter, Arial, sans-serif";
    ctx.fillText("RALLY  ·  COLOMBIA", canvas.width / 2, 290);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function SponsorBanners({ carPositionRef }: { carPositionRef?: React.MutableRefObject<THREE.Vector3> }) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const texture = useMemo(makeTexture, []);

  useFrame(() => {
    const carZ = carPositionRef?.current.z ?? 0;
    // First billboard slot that is still ahead of (or just beside) the car.
    const firstSlot = Math.max(0, Math.floor((carZ - FIRST_Z + 15) / SPACING));
    for (let i = 0; i < VISIBLE; i++) {
      const group = groupRefs.current[i];
      if (!group) continue;
      const slot = firstSlot + i;
      const side = slot % 2 === 0 ? 1 : -1;
      group.position.set(side * SIDE_X, 0, FIRST_Z + slot * SPACING);
      // Face back down the road (towards the car), turned in a little towards the road.
      group.rotation.y = Math.PI + side * TOE_IN;
    }
  });

  return (
    <group>
      {Array.from({ length: VISIBLE }, (_, i) => (
        <group key={i} ref={(g) => (groupRefs.current[i] = g)}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (PANEL_W / 2 - 0.3), POST_H / 2, 0.05]} castShadow>
              <cylinderGeometry args={[0.07, 0.09, POST_H, 8]} />
              <meshLambertMaterial color="#f2f2ee" />
            </mesh>
          ))}
          {/* Front face with the branding, plain navy back */}
          <mesh position={[0, POST_H - PANEL_H / 2 + 0.4, -0.02]}>
            <planeGeometry args={[PANEL_W, PANEL_H]} />
            <meshLambertMaterial map={texture} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.35} />
          </mesh>
          <mesh position={[0, POST_H - PANEL_H / 2 + 0.4, 0.03]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[PANEL_W, PANEL_H]} />
            <meshLambertMaterial color="#0e1b24" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
