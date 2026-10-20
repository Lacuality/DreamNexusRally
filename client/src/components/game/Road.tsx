// client/src/components/game/Road.tsx
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { GAME_CONFIG, DREAM_NEXUS_COLORS } from "@/lib/constants";

interface RoadProps {
  carPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/* --------- Tunables --------- */
const ROAD_LENGTH = 220;
// How far the road reaches behind the car; the rest is ahead of it.
const ROAD_BEHIND = 30;
// Dash spacing; the road moves in whole steps of this so dashes stay fixed on the ground.
const DASH_PERIOD = 6;
const ROAD_WIDTH  = GAME_CONFIG.LANE_WIDTH + 0.6;

const EDGE_WIDTH  = 0.28;
const EDGE_OFFSET = 0.02;     // small inset so edges sit inside the road
const EDGE_LIFT   = 0.012;    // just enough to avoid z-fighting

const DASH_LEN    = 2;
const DASH_GAP    = 4;
const DASH_WIDTH  = 0.16;
const DASH_LIFT   = 0.011;    // slightly below edges so ordering is stable

/* --------- One single source of truth for road shape --------- */
// The road is straight and flat. Bends and hills used to be baked into this
// strip, but the strip follows the car, so they travelled with it and dipped
// the road under the grass right below the car. Gameplay is lane-based, so a
// straight road matches what the car actually does.
function sampleCurveAndElev(_z: number) {
  return { curve: 0, elev: 0 };
}

/** World z for the road strip's centre, snapped so the dashes don't slide. */
export function roadCenterZ(carZ: number) {
  const snapped = Math.floor(carZ / DASH_PERIOD) * DASH_PERIOD;
  return snapped - ROAD_BEHIND + ROAD_LENGTH / 2;
}

/** Create a plane already deformed by the road function. */
function makeDeformedPlane(
  width: number,
  length: number,
  widthSegs: number,
  lengthSegs: number,
  lateralOffset: number,
  lift: number
) {
  const geo = new THREE.PlaneGeometry(width, length, widthSegs, lengthSegs);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); // lateral (-width/2..+width/2)
    const y = pos.getY(i); // forward  (-length/2..+length/2)
    const { curve, elev } = sampleCurveAndElev(y);

    // deform in local (before rotation) space
    pos.setX(i, x + lateralOffset + curve);  // move with curve
    pos.setZ(i, elev + lift);                // lift off terrain a touch
  }

  geo.computeVertexNormals();
  return geo;
}

export function Road({ carPositionRef }: RoadProps) {
  const roadRef = useRef<THREE.Mesh>(null);
  // TEMPORARILY DISABLED: const asphaltTexture = useTexture("./textures/asphalt.png");
  const scrollOffset = useRef(0);


  // TEMPORARILY DISABLED texture config
  // useEffect(() => {
  //   console.log("[Road] Asphalt texture loaded, configuring...");
  //   if (asphaltTexture) {
  //     asphaltTexture.wrapS = asphaltTexture.wrapT = THREE.RepeatWrapping;
  //     asphaltTexture.repeat.set(4, ROAD_LENGTH / 8);
  //     asphaltTexture.anisotropy = 8;
  //     console.log("[Road] Texture configured successfully");
  //   }
  // }, [asphaltTexture]);

  // road surface
  const roadGeometry = useMemo(
    () => makeDeformedPlane(ROAD_WIDTH, ROAD_LENGTH, 20, 200, 0, 0),
    []
  );

  useFrame(() => {
    if (roadRef.current) {
      roadRef.current.position.z = roadCenterZ(carPositionRef.current.z);
      
      // TEMPORARILY DISABLED: scrollOffset.current = carPositionRef.current.z * 0.125;
      // TEMPORARILY DISABLED: asphaltTexture.offset.y = scrollOffset.current;
    }
  });

  return (
    <group>
      <mesh ref={roadRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <primitive object={roadGeometry} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.95} metalness={0.05} />
      </mesh>

      <RoadEdges carPositionRef={carPositionRef} />
      <CenterLine carPositionRef={carPositionRef} />
    </group>
  );
}

/* --------- Edges (deformed planes so they always hug the road) --------- */
function RoadEdges({
  carPositionRef,
}: {
  carPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const leftEdgeRef = useRef<THREE.Mesh>(null);
  const rightEdgeRef = useRef<THREE.Mesh>(null);

  const leftEdgeGeometry = useMemo(() => {
    const xOffset = -(ROAD_WIDTH / 2) + EDGE_WIDTH / 2 - EDGE_OFFSET;
    return makeDeformedPlane(EDGE_WIDTH, ROAD_LENGTH, 1, 200, xOffset, EDGE_LIFT);
  }, []);

  const rightEdgeGeometry = useMemo(() => {
    const xOffset = ROAD_WIDTH / 2 - EDGE_WIDTH / 2 + EDGE_OFFSET;
    return makeDeformedPlane(EDGE_WIDTH, ROAD_LENGTH, 1, 200, xOffset, EDGE_LIFT);
  }, []);

  useFrame(() => {
    const z = roadCenterZ(carPositionRef.current.z);
    if (leftEdgeRef.current) leftEdgeRef.current.position.z = z;
    if (rightEdgeRef.current) rightEdgeRef.current.position.z = z;
  });

  const edgeMat = (
    <meshStandardMaterial
      color="#ffcc00"
      emissive="#ffcc00"
      emissiveIntensity={0.35}
      roughness={0.4}
      metalness={0}
      polygonOffset
      polygonOffsetFactor={-1}
      polygonOffsetUnits={-1}
    />
  );

  return (
    <>
      <mesh ref={leftEdgeRef} rotation={[-Math.PI / 2, 0, 0]} geometry={leftEdgeGeometry}>
        {edgeMat}
      </mesh>
      <mesh ref={rightEdgeRef} rotation={[-Math.PI / 2, 0, 0]} geometry={rightEdgeGeometry}>
        {edgeMat}
      </mesh>
    </>
  );
}

/* --------- Center dashed line (instanced, locked to exact road center) --------- */
function CenterLine({
  carPositionRef,
}: {
  carPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const dashGeometry = useMemo(
    () => new THREE.BoxGeometry(DASH_WIDTH, 0.05, DASH_LEN),
    []
  );

  const dashCount = useMemo(
    () => Math.floor(ROAD_LENGTH / DASH_PERIOD) + 1,
    []
  );

  // Precompute matrices so every dash is exactly centered on the deformed road
  const matrices = useMemo(() => {
    const arr: THREE.Matrix4[] = [];
    const temp = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const pos = new THREE.Vector3();

    for (let i = 0; i < dashCount; i++) {
      const zLocal = -ROAD_LENGTH / 2 + i * DASH_PERIOD;
      const { curve, elev } = sampleCurveAndElev(zLocal);

      // Center line: lateral = curve (no offset), height = elev + DASH_LIFT
      pos.set(curve, elev + DASH_LIFT, zLocal);
      temp.compose(pos, quat, scale);
      arr.push(temp.clone());
    }
    return arr;
  }, [dashCount]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.z = roadCenterZ(carPositionRef.current.z);
    }
  });

  const meshCallbackRef = (meshRef: THREE.InstancedMesh | null) => {
    if (!meshRef) return;
    for (let i = 0; i < dashCount; i++) {
      meshRef.setMatrixAt(i, matrices[i]);
    }
    meshRef.instanceMatrix.needsUpdate = true;
  };

  return (
    // Not rotated: dashes are laid out directly in world space along +z, flat on the road.
    <group ref={groupRef}>
      <instancedMesh ref={meshCallbackRef} args={[dashGeometry, undefined as any, dashCount]}>
        <meshStandardMaterial
          color={DREAM_NEXUS_COLORS.roadLine}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </instancedMesh>
    </group>
  );
}
