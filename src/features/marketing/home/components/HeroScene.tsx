"use client";

/**
 * HeroScene — raw three.js agent-orchestration graph.
 * Nodes (brief → agents → contract → deploy) joined by faint edges, with
 * bright pulses travelling along them (the data the app moves between agents).
 * Monochrome, transparent background.
 *
 * Interaction: the graph subtly tilts toward the cursor (bounded, so it never
 * leaves frame) and drifts slowly on its own. Static single frame under
 * prefers-reduced-motion.
 *
 * Robustness: retries sizing until the container has layout, survives WebGL
 * context loss, and fully disposes (incl. forceContextLoss) on unmount so dev
 * HMR / StrictMode remounts don't exhaust GL contexts and blank the canvas.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

const NODES: [number, number, number][] = [
  [0, 2.3, 0], // 0 brief
  [-2.2, 0.85, 0.65], // 1 frontend
  [-0.85, 0.65, -0.85], // 2 backend
  [0.85, 0.75, 0.75], // 3 database
  [2.2, 0.95, -0.55], // 4 architecture
  [0, -0.35, 0], // 5 contract
  [0, -2.3, 0], // 6 deploy
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 5], [2, 5], [3, 5], [4, 5],
  [0, 5],
  [5, 6],
];

const PULSE_COUNT = 12;

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5.6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    container.appendChild(canvas);

    const onContextLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onContextLost, false);

    const group = new THREE.Group();
    group.rotation.x = 0.12;
    scene.add(group);

    const nodeVecs = NODES.map((n) => new THREE.Vector3(...n));
    const disposables: { dispose: () => void }[] = [];
    const rings: THREE.Mesh[] = [];

    // Nodes
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xfafafa });
    const sphereGeo = new THREE.SphereGeometry(0.07, 18, 18);
    disposables.push(nodeMat, sphereGeo);
    nodeVecs.forEach((v, i) => {
      const isHub = i === 0 || i === 6;
      const mesh = new THREE.Mesh(sphereGeo, nodeMat);
      mesh.position.copy(v);
      mesh.scale.setScalar(isHub ? 1.6 : 1);
      group.add(mesh);

      const ringGeo = new THREE.RingGeometry(isHub ? 0.18 : 0.13, isHub ? 0.195 : 0.145, 40);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: isHub ? 0.35 : 0.18,
        side: THREE.DoubleSide,
      });
      disposables.push(ringGeo, ringMat);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(v);
      ring.lookAt(camera.position);
      group.add(ring);
      rings.push(ring);
    });

    // Edges
    const edgePositions: number[] = [];
    EDGES.forEach(([a, b]) => {
      edgePositions.push(nodeVecs[a].x, nodeVecs[a].y, nodeVecs[a].z, nodeVecs[b].x, nodeVecs[b].y, nodeVecs[b].z);
    });
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
    disposables.push(edgeGeo, edgeMat);
    group.add(new THREE.LineSegments(edgeGeo, edgeMat));

    // Pulses
    const pulses = Array.from({ length: PULSE_COUNT }, (_, i) => ({
      edge: i % EDGES.length,
      t: Math.random(),
      speed: 0.12 + Math.random() * 0.22,
    }));
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(PULSE_COUNT * 3), 3));
    const pulseMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.075,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    disposables.push(pulseGeo, pulseMat);
    group.add(new THREE.Points(pulseGeo, pulseMat));

    const tmp = new THREE.Vector3();
    const updatePulses = (dt: number) => {
      const arr = pulseGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i];
        p.t += p.speed * dt;
        if (p.t > 1) {
          p.t -= 1;
          p.edge = Math.floor(Math.random() * EDGES.length);
        }
        const [a, b] = EDGES[p.edge];
        tmp.copy(nodeVecs[a]).lerp(nodeVecs[b], p.t);
        arr[i * 3] = tmp.x;
        arr[i * 3 + 1] = tmp.y;
        arr[i * 3 + 2] = tmp.z;
      }
      pulseGeo.attributes.position.needsUpdate = true;
    };
    updatePulses(0);

    const render = () => renderer.render(scene, camera);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return false;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // Scale the graph down on narrow viewports so it stays composed.
      const aspect = w / h;
      const baseScale = aspect < 0.85 ? 0.72 : aspect < 1.1 ? 0.88 : 1;
      group.scale.setScalar(baseScale);

      rings.forEach((ring) => ring.lookAt(camera.position));
      render();
      return true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Pointer parallax (rotation only → always stays in frame).
    const target = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Very slow idle drift so the graph feels alive without being swimmy.
      group.rotation.y += dt * 0.05;
      group.rotation.x += (0.12 - target.y * 0.18 - group.rotation.x) * 0.04;
      group.rotation.z += (target.x * 0.08 - group.rotation.z) * 0.04;

      rings.forEach((ring) => ring.lookAt(camera.position));
      updatePulses(dt);
      render();
      raf = requestAnimationFrame(loop);
    };

    // Wait for layout, then start.
    let started = false;
    const start = () => {
      if (started) return;
      if (!resize()) {
        raf = requestAnimationFrame(start);
        return;
      }
      started = true;
      if (reduced) render();
      else {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode === container) container.removeChild(canvas);
    };
  }, []);

  return <div ref={containerRef} className="hero-scene" aria-hidden="true" />;
}

export default HeroScene;
