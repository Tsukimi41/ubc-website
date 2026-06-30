"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";

type BeeState = { position: THREE.Vector3; velocity: THREE.Vector3; phase: number; scale: number };

export function BeeSwarm() {
  const [lightweight, setLightweight] = useState(true);
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setLightweight(reduced || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || coarse);
  }, []);
  if (lightweight) return <CssBee />;
  return <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true"><CanvasErrorBoundary fallback={<CssBee />}><Canvas camera={{ position: [0, 0, 8], fov: 48 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}><ambientLight intensity={2.2} /><directionalLight position={[4, 6, 5]} intensity={3} /><Swarm /></Canvas></CanvasErrorBoundary></div>;
}

function Swarm() {
  const { viewport, pointer } = useThree();
  const bees = useMemo<BeeState[]>(() => Array.from({ length: 7 }, (_, index) => ({
    position: new THREE.Vector3((Math.random() - .5) * viewport.width, (Math.random() - .5) * viewport.height, (Math.random() - .5) * 2),
    velocity: new THREE.Vector3((Math.random() - .5) * .018, (Math.random() - .5) * .018, 0), phase: index * .9, scale: .7 + Math.random() * .45,
  })), [viewport.height, viewport.width]);
  useFrame(({ clock }) => {
    const cursor = new THREE.Vector3(pointer.x * viewport.width / 2, pointer.y * viewport.height / 2, 0);
    bees.forEach((bee, index) => {
      const centerPull = bee.position.clone().multiplyScalar(-.0003);
      const cursorDistance = bee.position.distanceTo(cursor);
      if (cursorDistance < 1.7) bee.velocity.add(bee.position.clone().sub(cursor).normalize().multiplyScalar(.0025));
      const neighbor = bees[(index + 1) % bees.length];
      if (neighbor && bee.position.distanceTo(neighbor.position) < .65) bee.velocity.add(bee.position.clone().sub(neighbor.position).normalize().multiplyScalar(.001));
      bee.velocity.add(centerPull).multiplyScalar(.995).clampLength(.004, .026);
      bee.position.add(bee.velocity);
      bee.position.y += Math.sin(clock.elapsedTime * 2.1 + bee.phase) * .0015;
      if (Math.abs(bee.position.x) > viewport.width / 2 + .5) bee.velocity.x *= -1;
      if (Math.abs(bee.position.y) > viewport.height / 2 + .5) bee.velocity.y *= -1;
    });
  });
  return <>{bees.map((bee, index) => <Bee key={index} state={bee} />)}</>;
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

function CssBee() { return <div className="pointer-events-none absolute right-[8%] top-[18%] z-10 animate-float text-4xl drop-shadow-lg" aria-hidden="true">🐝</div>; }

class CanvasErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.warn("WebGL unavailable; using lightweight bee", error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
