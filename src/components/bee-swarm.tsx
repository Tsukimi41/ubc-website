"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";

type BeeState = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  route: "cross" | "corner";
  duration: number;
  pause: number;
  offset: number;
  phase: number;
  scale: number;
};

export function BeeSwarm() {
  const [mode, setMode] = useState<"css" | "still" | "webgl">("css");
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced) setMode("still");
    else if ((nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || coarse) setMode("css");
    else setMode("webgl");
  }, []);
  if (mode !== "webgl") return <CssBees animated={mode === "css"} />;
  return <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true"><CanvasErrorBoundary fallback={<CssBees animated />}><Canvas camera={{ position: [0, 0, 8], fov: 48 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}><ambientLight intensity={2.2} /><directionalLight position={[4, 6, 5]} intensity={3} /><Swarm /></Canvas></CanvasErrorBoundary></div>;
}

function Swarm() {
  const { viewport } = useThree();
  const bees = useMemo<BeeState[]>(() => [
    { position: new THREE.Vector3(), velocity: new THREE.Vector3(), route: "cross", duration: 9, pause: 5, offset: 0, phase: .4, scale: .95 },
    { position: new THREE.Vector3(), velocity: new THREE.Vector3(), route: "corner", duration: 7, pause: 8, offset: 5, phase: 2.1, scale: .78 },
  ], []);
  useFrame(({ clock }) => {
    bees.forEach((bee) => moveAlongRoute(bee, clock.elapsedTime, viewport.width, viewport.height));
  });
  return <>{bees.map((bee, index) => <Bee key={index} state={bee} />)}</>;
}

function moveAlongRoute(bee: BeeState, elapsed: number, width: number, height: number) {
  const previous = bee.position.clone();
  const localTime = (elapsed + bee.offset) % (bee.duration + bee.pause);
  if (localTime > bee.duration) {
    bee.position.set(width, height, 0);
    bee.velocity.set(1, 0, 0);
    return;
  }

  const progress = localTime / bee.duration;
  if (bee.route === "cross") {
    bee.position.set(
      -width / 2 - .7 + progress * (width + 1.4),
      height * .16 + Math.sin(progress * Math.PI * 5 + bee.phase) * .18 + Math.sin(progress * Math.PI * 11) * .05,
      .2,
    );
  } else {
    const inverse = 1 - progress;
    const startX = width / 2 + .65;
    const startY = height / 2 + .35;
    const controlX = width * .12;
    const controlY = height * .02;
    const endX = width / 2 + .75;
    const endY = -height * .42;
    bee.position.set(
      inverse * inverse * startX + 2 * inverse * progress * controlX + progress * progress * endX + Math.sin(progress * Math.PI * 8) * .08,
      inverse * inverse * startY + 2 * inverse * progress * controlY + progress * progress * endY + Math.sin(progress * Math.PI * 7 + bee.phase) * .12,
      -.15,
    );
  }
  bee.velocity.copy(bee.position).sub(previous);
}

function Bee({ state }: { state: BeeState }) {
  const group = useRef<Group>(null);
  const leftWing = useRef<Group>(null);
  const rightWing = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.position.copy(state.position);
    group.current.rotation.z = Math.atan2(state.velocity.y, state.velocity.x) - Math.PI / 2;
    const flap = Math.sin(clock.elapsedTime * 35 + state.phase) * .65;
    if (leftWing.current) leftWing.current.rotation.y = flap;
    if (rightWing.current) rightWing.current.rotation.y = -flap;
  });
  return <group ref={group} scale={state.scale * .22}><mesh><sphereGeometry args={[.42, 12, 10]} /><meshStandardMaterial color="#f3b31e" roughness={.6} /></mesh><mesh position={[0, -.35, 0]}><sphereGeometry args={[.34, 12, 10]} /><meshStandardMaterial color="#422308" /></mesh><mesh position={[0, -.62, 0]}><torusGeometry args={[.22, .06, 8, 16]} /><meshStandardMaterial color="#f3b31e" /></mesh><group ref={leftWing} position={[-.35, .05, 0]} rotation={[.3, 0, -.5]}><mesh><sphereGeometry args={[.42, 12, 8]} /><meshPhysicalMaterial color="#eefcff" transparent opacity={.6} roughness={.1} /></mesh></group><group ref={rightWing} position={[.35, .05, 0]} rotation={[.3, 0, .5]}><mesh><sphereGeometry args={[.42, 12, 8]} /><meshPhysicalMaterial color="#eefcff" transparent opacity={.6} roughness={.1} /></mesh></group></group>;
}

function CssBees({ animated }: { animated: boolean }) {
  if (!animated) return <div className="pointer-events-none absolute right-[8%] top-[18%] z-10 text-4xl drop-shadow-lg" aria-hidden="true">🐝</div>;
  return <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
    <span className="bee-flight-cross absolute text-4xl drop-shadow-lg">🐝</span>
    <span className="bee-flight-corner absolute text-3xl drop-shadow-lg">🐝</span>
  </div>;
}

class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.warn("WebGL unavailable; using lightweight bee", error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
