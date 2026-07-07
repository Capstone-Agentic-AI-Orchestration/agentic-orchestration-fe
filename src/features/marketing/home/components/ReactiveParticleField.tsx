"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "./ReactiveParticleField.css";

const PARTICLE_COUNT = 980;
const LOOSE_PARTICLES = 180;

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function ParticleSwarm({ reduced }: { reduced: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const initializedRef = useRef(false);
  const { pointer, viewport } = useThree();

  const { base, colors } = useMemo(() => {
    const random = seededRandom(73921);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3);
    const colorValues = new Float32Array(PARTICLE_COUNT * 3);
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const offset = i * 3;
      const loose = i > PARTICLE_COUNT - LOOSE_PARTICLES;
      const lane = i % 5;
      const x = random() * 2.28 - 1.14;
      const sweep = Math.sin(x * 4.1 + lane * 0.92) * 0.18;
      const cluster = Math.sin(x * 8.4 + lane) * 0.05;
      const y = loose
        ? random() * 1.42 - 0.71
        : sweep + cluster + (random() - 0.5) * (0.16 + lane * 0.018);

      basePositions[offset] = x;
      basePositions[offset + 1] = y + (lane - 2) * 0.025;
      basePositions[offset + 2] = (random() - 0.5) * 0.3;

      const accent = random();
      if (accent > 0.91) {
        color.setRGB(0.25, 0.95, 0.68);
      } else if (accent > 0.74) {
        color.setRGB(0.2, 0.72, 1);
      } else {
        const value = 0.54 + random() * 0.42;
        color.setRGB(value, value, value);
      }

      colorValues[offset] = color.r;
      colorValues[offset + 1] = color.g;
      colorValues[offset + 2] = color.b;
    }

    return { base: basePositions, colors: colorValues };
  }, []);

  const geometry = useMemo(() => {
    const geometryValue = new THREE.BufferGeometry();
    geometryValue.setAttribute("position", new THREE.BufferAttribute(new Float32Array(PARTICLE_COUNT * 3), 3));
    geometryValue.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometryValue;
  }, [colors]);

  useFrame(({ clock }) => {
    const positionAttribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    const positions = positionAttribute.array as Float32Array;
    const width = viewport.width;
    const height = viewport.height;
    const mouseX = pointer.x * width * 0.5;
    const mouseY = pointer.y * height * 0.5;
    const t = reduced ? 0 : clock.getElapsedTime();
    const radius = Math.max(1.25, Math.min(width, height) * 0.42);
    const hasPointer = Math.abs(pointer.x) > 0.002 || Math.abs(pointer.y) > 0.002;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const offset = i * 3;
      const bx = base[offset] * width * 0.52;
      const by = base[offset + 1] * height * 0.7;
      const bz = base[offset + 2];
      const dx = mouseX - bx;
      const dy = mouseY - by;
      const distance = Math.sqrt(dx * dx + dy * dy) + 0.0001;
      const force = reduced || !hasPointer ? 0 : Math.max(0, 1 - distance / radius);
      const magnet = force * force;
      const wave = reduced ? 0 : Math.sin(distance * 4.2 - t * 4.8 + i * 0.025) * magnet;
      const driftX = reduced ? 0 : Math.sin(t * 0.32 + i * 0.13) * 0.018;
      const driftY = reduced ? 0 : Math.cos(t * 0.28 + i * 0.11) * 0.018;
      const tangentX = (-dy / distance) * magnet * 0.2;
      const tangentY = (dx / distance) * magnet * 0.2;

      positions[offset] = bx + dx * magnet * 0.38 + tangentX + driftX;
      positions[offset + 1] = by + dy * magnet * 0.38 + tangentY + wave * 0.18 + driftY;
      positions[offset + 2] = bz + magnet * 0.32;
    }

    positionAttribute.needsUpdate = true;
    initializedRef.current = true;

    if (materialRef.current) {
      materialRef.current.opacity = reduced ? 0.52 : hasPointer ? 0.88 : 0.72;
    }
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={0.024}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.72}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function ReactiveParticleField() {
  const reduced = usePrefersReducedMotion();
  const fieldRef = useRef<HTMLDivElement>(null);

  const moveAura = (clientX: number, clientY: number) => {
    const field = fieldRef.current;
    if (!field) return;

    const rect = field.getBoundingClientRect();
    field.style.setProperty("--cursor-x", `${clientX - rect.left}px`);
    field.style.setProperty("--cursor-y", `${clientY - rect.top}px`);
    field.dataset.pointer = "active";
  };

  return (
    <div
      ref={fieldRef}
      className="reactive-particle-field"
      aria-hidden="true"
      onPointerMove={(event) => moveAura(event.clientX, event.clientY)}
      onPointerLeave={() => {
        if (fieldRef.current) fieldRef.current.dataset.pointer = "idle";
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
        frameloop={reduced ? "demand" : "always"}
      >
        <ParticleSwarm reduced={reduced} />
      </Canvas>
      <div className="reactive-cursor-aura" />
      <div className="reactive-signal-rings" />
    </div>
  );
}

export default ReactiveParticleField;
