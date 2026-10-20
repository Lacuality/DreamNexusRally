// Rally car physics: a "bicycle model" with real forces, tuned for arcade fun.
//
// Longitudinal: engine power (traction-limited at low speed, power-limited at
// high speed), aerodynamic drag, rolling resistance, engine braking and brakes.
// Top speed comes out of the balance of power and drag, not a hard cap.
//
// Lateral: the front wheels steer; the car's heading turns at the rate the
// steering geometry asks for, but the direction the car actually travels can
// only follow the heading as fast as the tyres' grip allows. When the turn
// asks for more sideways force than the tyres have, the car slides (drifts)
// and the slide scrubs off speed. The handbrake cuts rear grip for rally drifts.
//
// Pure functions only, so this can be unit-tested and stepped at any rate.

export interface CarState {
  x: number;          // metres sideways (+x is the driver's left)
  z: number;          // metres along the road
  speed: number;      // m/s along the travel direction (never negative)
  heading: number;    // radians the car's nose points away from straight ahead (+ = left)
  travel: number;     // radians the car is actually moving (differs from heading when sliding)
  steer: number;      // current steering input after smoothing, -1..1
  lateralAccel: number;      // m/s², for body roll
  longitudinalAccel: number; // m/s², for squat/dive
  slip: number;       // radians between heading and travel direction
  onGrass: boolean;
  hitWall: boolean;   // scraped the edge this step
}

export interface CarInput {
  throttle: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
}

export interface CarEnv {
  nitro: boolean;
  puddle: boolean;
  frozen: boolean;   // countdown: wheels locked, nothing moves
}

export const CAR = {
  mass: 1250,              // kg
  power: 125_000,          // W at the wheels (~170 hp)
  maxTraction: 8200,       // N, launch force limited by tyre grip
  dragCoef: 0.9,           // N per (m/s)²; with power this sets top speed ≈ 180 km/h
  rollingResistance: 190,  // N
  engineBraking: 450,      // N when off the throttle
  brakeForce: 12500,       // N (~1 g)
  wheelbase: 2.55,         // m
  maxSteerAngle: 0.55,     // rad at a standstill
  steerSpeedFalloff: 20,   // m/s; steering angle halves at this speed
  steerRate: 3.2,          // how fast the steering input moves (per second)
  steerReturnRate: 6,      // how fast it re-centres when released
  grip: 10.5,              // m/s² of sideways grip on asphalt (~1.07 g)
  grassGrip: 6,
  puddleGrip: 4,
  handbrakeGripScale: 0.45,
  slideScrub: 2.2,         // how much sliding sideways bleeds speed
  grassDrag: 7000,         // extra N on grass (bumpy, soft ground)
  puddleDrag: 3000,        // extra N in a puddle
  nitroPower: 1.6,         // power multiplier with nitro
  headingAssist: 0.9,      // driver keeps the car pointed down the road when not steering
  maxHeading: 1.05,        // rad; you can't spin the car around on this road
  roadHalf: 4.8,           // asphalt half-width
  edgeHalf: 6.2,           // grass verge ends here (barrier line)
};

/** Latest car state for visual effects (skid marks, smoke) that live outside the car. */
export const carTelemetry = {
  x: 0,
  z: 0,
  heading: 0,
  speed: 0,
  slip: 0,
  hardBraking: false,
  handbrake: false,
  onGrass: false,
};

export function createCarState(): CarState {
  return {
    x: 0, z: 0, speed: 0, heading: 0, travel: 0, steer: 0,
    lateralAccel: 0, longitudinalAccel: 0, slip: 0, onGrass: false, hitWall: false,
  };
}

/** Advance the car by dt seconds (internally sub-stepped for stability). */
export function stepCar(s: CarState, input: CarInput, env: CarEnv, dt: number): CarState {
  if (env.frozen) {
    return { ...s, speed: 0, steer: approach(s.steer, steerTarget(input), CAR.steerRate * dt), lateralAccel: 0, longitudinalAccel: 0, slip: 0 };
  }
  // Big frames (tab switch, slow phone) are split so the integration stays stable.
  const total = Math.min(dt, 0.1);
  const steps = Math.max(1, Math.ceil(total / (1 / 120)));
  const h = total / steps;
  let out = { ...s, hitWall: false };
  for (let i = 0; i < steps; i++) out = substep(out, input, env, h);
  return out;
}

function steerTarget(input: CarInput) {
  return (input.left ? 1 : 0) - (input.right ? 1 : 0);
}

function approach(value: number, target: number, maxStep: number) {
  if (value < target) return Math.min(target, value + maxStep);
  return Math.max(target, value - maxStep);
}

function substep(s: CarState, input: CarInput, env: CarEnv, h: number): CarState {
  const target = steerTarget(input);
  const rate = target === 0 || Math.sign(target) !== Math.sign(s.steer) ? CAR.steerReturnRate : CAR.steerRate;
  const steer = approach(s.steer, target, rate * h);

  const onGrass = Math.abs(s.x) > CAR.roadHalf;
  const v = s.speed;

  /* ---- Longitudinal forces ---- */
  const power = CAR.power * (env.nitro ? CAR.nitroPower : 1);
  const drive = input.throttle ? Math.min(CAR.maxTraction, power / Math.max(v, 1)) : 0;
  let resist = CAR.dragCoef * v * v + CAR.rollingResistance;
  if (!input.throttle) resist += CAR.engineBraking;
  if (input.brake) resist += CAR.brakeForce;
  if (onGrass) resist += CAR.grassDrag;
  if (env.puddle) resist += CAR.puddleDrag;
  // Locked rear wheels drag too.
  if (input.handbrake) resist += 3500;
  const accel = (drive - resist) / CAR.mass;
  let speed = Math.max(0, v + accel * h);

  /* ---- Grip available ---- */
  let grip = onGrass ? CAR.grassGrip : CAR.grip;
  if (env.puddle) grip = Math.min(grip, CAR.puddleGrip);
  const rearGrip = input.handbrake ? grip * CAR.handbrakeGripScale : grip;

  /* ---- Steering: heading turns by the steering geometry ---- */
  const steerAngle = (CAR.maxSteerAngle * steer) / (1 + v / CAR.steerSpeedFalloff);
  let yawRate = (v * Math.tan(steerAngle)) / CAR.wheelbase;
  // Front tyres can't turn the car harder than their grip allows (understeer)...
  const maxYaw = v > 0.5 ? (grip * 1.15) / v : Infinity;
  yawRate = clamp(yawRate, -maxYaw, maxYaw);
  // ...but with the handbrake the rear steps out and the nose swings further.
  if (input.handbrake && v > 6) yawRate *= 1.6;
  // When the driver isn't steering, they keep the car pointed down the road.
  if (target === 0) yawRate += -s.heading * CAR.headingAssist;
  let heading = clamp(s.heading + yawRate * h, -CAR.maxHeading, CAR.maxHeading);

  /* ---- Travel direction follows the heading as fast as rear grip allows ---- */
  const maxTurn = v > 0.5 ? rearGrip / v : 50; // rad/s the velocity can rotate
  const want = heading - s.travel;
  const turn = clamp(want * 12, -maxTurn, maxTurn);
  const travel = s.travel + turn * h;
  const slip = heading - travel;

  // Sliding sideways scrubs speed (tyres doing work instead of moving the car).
  speed = Math.max(0, speed - Math.abs(Math.sin(slip)) * CAR.slideScrub * speed * h);

  /* ---- Move ---- */
  let x = s.x + Math.sin(travel) * speed * h;
  const z = s.z + Math.cos(travel) * speed * h;

  // The barrier line at the edge of the verge: scrape along it and lose speed.
  let hitWall = s.hitWall;
  let finalTravel = travel;
  let finalHeading = heading;
  if (Math.abs(x) > CAR.edgeHalf) {
    x = Math.sign(x) * CAR.edgeHalf;
    if (Math.sign(travel) === Math.sign(x)) {
      // Lose the part of the speed that was going into the barrier, then slide along it.
      speed *= 1 - Math.min(0.45, Math.abs(Math.sin(travel)) * 0.9);
      finalTravel = 0;
      finalHeading = heading * 0.5;
      hitWall = true;
    }
  }

  return {
    x, z, speed,
    heading: finalHeading,
    travel: finalTravel,
    steer,
    slip,
    lateralAccel: speed * turn,
    longitudinalAccel: accel,
    onGrass,
    hitWall,
  };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/** Top speed (m/s) where engine power balances drag, for reference/tests. */
export function theoreticalTopSpeed(nitro = false) {
  const p = CAR.power * (nitro ? CAR.nitroPower : 1);
  let v = 30;
  for (let i = 0; i < 60; i++) v = Math.cbrt(Math.max(0, (p - CAR.rollingResistance * v) / CAR.dragCoef));
  return v;
}
