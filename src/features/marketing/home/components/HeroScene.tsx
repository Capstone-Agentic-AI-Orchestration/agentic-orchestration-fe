"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  CINEMA_PROGRESS_EVENT,
  MARKETING_INTERACTION_EVENT,
  type CinemaProgressDetail,
  type MarketingInteractionDetail,
  type SceneProgressProps,
} from "./cinema-progress";

const PARTICLES = 5200;

interface ParticleMeta {
  x: number;
  z: number;
  drift: number;
  phase: number;
  amp: number;
}

function seeded(index: number) {
  const x = Math.sin(index * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function HeroScene({ cinematic = false, sceneName = "hero" }: SceneProgressProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<number | null>(null);
  const globalProgressRef = useRef(0);
  const interactionRef = useRef<MarketingInteractionDetail | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.1, 6.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    container.appendChild(canvas);

    const positions = new Float32Array(PARTICLES * 3);
    const metas: ParticleMeta[] = [];

    for (let i = 0; i < PARTICLES; i++) {
      const rx = seeded(i + 1);
      const rz = seeded(i + 2000);
      const x = (rx - 0.5) * 8.4;
      const z = (rz - 0.5) * 2.5;
      const phase = seeded(i + 4000) * Math.PI * 2;
      const amp = 0.18 + seeded(i + 7000) * 0.42;
      const drift = (seeded(i + 9000) - 0.5) * 0.35;
      metas.push({ x, z, phase, amp, drift });
      positions[i * 3] = x;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = z;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xfafafa,
      size: 0.017,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    points.rotation.x = -0.18;
    points.rotation.z = -0.035;
    scene.add(points);

    const mouse = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const onCinemaProgress = (event: Event) => {
      const detail = (event as CustomEvent<CinemaProgressDetail>).detail;
      progressRef.current = detail.progressByScene[sceneName] ?? progressRef.current;
      globalProgressRef.current = detail.globalProgress;
      if (detail.reducedMotion) render(performance.now(), false);
    };
    if (cinematic) window.addEventListener(CINEMA_PROGRESS_EVENT, onCinemaProgress);

    const onInteraction = (event: Event) => {
      interactionRef.current = (event as CustomEvent<MarketingInteractionDetail>).detail;
    };
    if (cinematic) window.addEventListener(MARKETING_INTERACTION_EVENT, onInteraction);

    const onContextLost = (event: Event) => event.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost, false);

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const scale = width < 720 ? 0.72 : width < 980 ? 0.86 : 1;
      points.scale.set(scale, scale, scale);
      renderer.render(scene, camera);
      return true;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = 0;
    let last = performance.now();
    const render = (now: number, schedule = true) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const time = now * 0.001;
      const sceneProgress = progressRef.current;
      const interaction = interactionRef.current;
      const velocity = interaction?.velocity ?? 0;
      const intensity = interaction?.interactionIntensity ?? 0;
      const typing = interaction?.typingIntensity ?? 0;
      const drive = sceneProgress ?? time;
      const gather = sceneProgress ?? 0.35 + Math.sin(time * 0.2) * 0.08;
      const push = cinematic ? gather : 0;

      for (let i = 0; i < PARTICLES; i++) {
        const meta = metas[i];
        const i3 = i * 3;
        const waveA = Math.sin(meta.x * 1.45 + drive * (1.8 + velocity * 2.4) + meta.phase) * meta.amp * (1 - gather * 0.2 + intensity * 0.16);
        const waveB = Math.cos(meta.x * 3.2 - drive * (1.2 + velocity) + meta.phase * 0.6) * meta.amp * (0.28 + gather * 0.2 + intensity * 0.12);
        const focus = 1 - gather * 0.1 - intensity * 0.025;
        positions[i3] = meta.x * focus + Math.sin(drive * 0.42 + meta.phase) * meta.drift * (1 - gather * 0.35 + intensity * 0.6);
        positions[i3 + 1] = waveA + waveB + meta.z * (0.12 + gather * 0.08 + intensity * 0.05);
        positions[i3 + 2] = meta.z + Math.sin(drive * 0.64 + meta.phase) * (0.08 + velocity * 0.1) - push * (0.35 + typing * 0.12);
      }
      geometry.attributes.position.needsUpdate = true;

      camera.position.z += (6.2 - push * 0.58 - velocity * 0.28 - camera.position.z) * 0.06;
      points.rotation.y += (mouse.x * (0.11 + intensity * 0.07) + push * 0.18 - points.rotation.y) * 0.035;
      points.rotation.x += (-0.18 - mouse.y * (0.055 + intensity * 0.04) + push * 0.08 - velocity * 0.04 - points.rotation.x) * 0.035;
      points.rotation.z += (-0.035 - push * 0.025 - points.rotation.z) * 0.035;
      points.position.x += (-mouse.x * (0.08 + intensity * 0.05) - push * 0.16 - points.position.x) * 0.035;

      renderer.render(scene, camera);
      if (schedule && !reduced) raf = requestAnimationFrame(render);
    };

    resize();
    if (reduced) renderer.render(scene, camera);
    else raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener(CINEMA_PROGRESS_EVENT, onCinemaProgress);
      window.removeEventListener(MARKETING_INTERACTION_EVENT, onInteraction);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, [cinematic, sceneName]);

  return <div ref={containerRef} className="hero-scene" aria-hidden="true" />;
}

export default HeroScene;
