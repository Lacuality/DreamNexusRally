import { useState, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GAME_CONFIG } from "@/lib/constants";
import { useSettings } from "@/lib/stores/useSettings";
import { useRally } from "@/lib/stores/useRally";

interface Obstacle {
  id: number;
  type: "cone" | "rock" | "puddle" | "coffee_sack";
  position: THREE.Vector3;
}

interface ObstaclesProps {
  carPositionRef: React.MutableRefObject<THREE.Vector3>;
  carSpeedRef: React.MutableRefObject<number>;
  onCollision: (obstacle: Obstacle) => void;
  onNearMiss?: (obstacle: Obstacle) => void;
}

// Passing an obstacle this close (sideways, in metres) at speed counts as a near miss.
const NEAR_MISS_DISTANCE = 2.2;
const NEAR_MISS_MIN_SPEED_KMH = 80;

export function Obstacles({ carPositionRef, carSpeedRef, onCollision, onNearMiss }: ObstaclesProps) {
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  // Per-frame counters live in refs so they don't re-render React every frame.
  const nextIdRef = useRef(0);
  const lastSpawnZRef = useRef(0);
  const elapsedRef = useRef(0);
  const passedRef = useRef(new Set<number>());
  const showPhotoMode = useSettings((state) => state.showPhotoMode);
  const phase = useRally((state) => state.phase);
  const isCountingDown = useRally((state) => state.isCountingDown);

  // Fresh road for every run.
  useEffect(() => {
    if (phase === "loading" || phase === "menu") {
      setObstacles([]);
      lastSpawnZRef.current = 0;
      elapsedRef.current = 0;
      passedRef.current.clear();
    }
  }, [phase]);

  useFrame((state, delta) => {
    if (showPhotoMode || phase !== "playing" || isCountingDown) return;

    elapsedRef.current += delta * 1000;
    const car = carPositionRef.current;
    const distance = car.z;
    const difficultyLevel = Math.floor(elapsedRef.current / GAME_CONFIG.DIFFICULTY_RAMP_INTERVAL);
    const baseSpawnChance = GAME_CONFIG.OBSTACLE_DENSITY_BASE +
      (difficultyLevel * GAME_CONFIG.OBSTACLE_DENSITY_INCREASE);

    const distanceFactor = Math.min(distance / 3000, 1.0);
    const spawnChance = baseSpawnChance + (distanceFactor * 0.25);
    const minSpacing = Math.max(10 - distanceFactor * 4, 6);

    let next = obstacles;
    let changed = false;

    if (car.z > lastSpawnZRef.current + minSpacing) {
      if (Math.random() < spawnChance) {
        const laneOffset = (Math.random() - 0.5) * (GAME_CONFIG.LANE_WIDTH - 2);
        const obstacleTypes: Array<Obstacle["type"]> = ["cone", "rock", "puddle", "coffee_sack"];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        next = [...next, {
          id: nextIdRef.current++,
          type,
          position: new THREE.Vector3(laneOffset, 0, car.z + 50),
        }];
        changed = true;
      }
      lastSpawnZRef.current = car.z;
    }

    const kept = next.filter((obstacle) => {
      if (car.distanceTo(obstacle.position) < GAME_CONFIG.HIT_RADIUS) {
        passedRef.current.delete(obstacle.id);
        onCollision(obstacle);
        return false;
      }

      // Reward threading the needle past a solid obstacle at speed.
      if (
        onNearMiss &&
        obstacle.type !== "puddle" &&
        obstacle.position.z < car.z - 1 &&
        !passedRef.current.has(obstacle.id)
      ) {
        passedRef.current.add(obstacle.id);
        if (
          Math.abs(obstacle.position.x - car.x) < NEAR_MISS_DISTANCE &&
          carSpeedRef.current > NEAR_MISS_MIN_SPEED_KMH
        ) {
          onNearMiss(obstacle);
        }
      }

      const keep = obstacle.position.z > car.z - 20;
      if (!keep) passedRef.current.delete(obstacle.id);
      return keep;
    });

    if (changed || kept.length !== next.length) {
      setObstacles(kept);
    }
  });

  return (
    <group>
      {obstacles.map((obstacle) => (
        <ObstacleModel key={obstacle.id} obstacle={obstacle} />
      ))}
    </group>
  );
}

function ObstacleModel({ obstacle }: { obstacle: Obstacle }) {
  const { scene: coffeeSack } = useGLTF("./models/coffee-sack.glb");
  
  const position: [number, number, number] = [
    obstacle.position.x,
    obstacle.position.y,
    obstacle.position.z
  ];
  
  if (obstacle.type === "cone") {
    return (
      <mesh position={position} castShadow>
        <coneGeometry args={[0.3, 0.8, 8]} />
        <meshStandardMaterial color="#ff6b00" />
      </mesh>
    );
  }
  
  if (obstacle.type === "rock") {
    return (
      <mesh position={position} castShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#666666" roughness={0.9} />
      </mesh>
    );
  }
  
  if (obstacle.type === "coffee_sack") {
    return (
      <group position={position} scale={0.8}>
        <primitive object={coffeeSack.clone()} />
      </group>
    );
  }
  
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.8, 16]} />
      <meshStandardMaterial color="#1a4a6a" transparent opacity={0.6} />
    </mesh>
  );
}
