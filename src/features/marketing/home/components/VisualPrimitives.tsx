"use client";

import { useEffect, useId, useRef } from "react";
import {
  CINEMA_PROGRESS_EVENT,
  MARKETING_INTERACTION_EVENT,
  type CinemaProgressDetail,
  type CinemaSceneName,
  type MarketingInteractionDetail,
  type SceneProgressProps,
} from "./cinema-progress";
import "./VisualPrimitives.css";

type ParticleVariant = "hero" | "wave" | "beam" | "subtle";

interface ParticleFieldCanvasProps extends SceneProgressProps {
  variant?: ParticleVariant;
  className?: string;
}

interface AgentNode {
  label: string;
  x: number;
  y: number;
}

interface AgentNetworkGraphProps extends Pick<SceneProgressProps, "sceneName" | "interactive"> {
  className?: string;
  nodes?: AgentNode[];
  mode?: "network" | "branch";
}

const DEFAULT_NODES: AgentNode[] = [
  { label: "Planner", x: 20, y: 58 },
  { label: "Architect", x: 39, y: 32 },
  { label: "Frontend", x: 56, y: 48 },
  { label: "Backend", x: 72, y: 28 },
  { label: "Database", x: 75, y: 68 },
  { label: "Reviewer", x: 90, y: 50 },
];

const BRANCH_NODES: AgentNode[] = [
  { label: "Analyst", x: 79, y: 22 },
  { label: "Architect", x: 84, y: 42 },
  { label: "Researcher", x: 81, y: 62 },
  { label: "Planner", x: 88, y: 80 },
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function seeded(index: number) {
  let value = (index * 2654435761) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967295;
}

function agentKey(agent: string) {
  return agent.trim().toLowerCase();
}

export function ParticleFieldCanvas({
  variant = "subtle",
  className = "",
  sceneName,
  progress,
  globalProgress,
  reducedMotion,
}: ParticleFieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(typeof progress === "number" ? progress : null);
  const globalProgressRef = useRef(typeof globalProgress === "number" ? globalProgress : 0);
  const interactionRef = useRef<MarketingInteractionDetail | null>(null);

  useEffect(() => {
    progressRef.current = typeof progress === "number" ? progress : progressRef.current;
    globalProgressRef.current = typeof globalProgress === "number" ? globalProgress : globalProgressRef.current;
  }, [progress, globalProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = reducedMotion ?? prefersReducedMotion();
    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let tick = 0;

    const density = variant === "hero" ? 620 : variant === "beam" ? 360 : 300;
    const particles = Array.from({ length: density }, (_, i) => ({
      x: seeded(i + 1),
      y: seeded(i + 1400),
      z: 0.25 + seeded(i + 2800) * 0.95,
      phase: seeded(i + 4200) * Math.PI * 2,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawGrid = () => {
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 1;
      const gap = variant === "hero" ? 96 : 84;
      for (let x = 0; x < width; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const draw = () => {
      tick += reduced ? 0 : 0.009;
      const sceneProgress = progressRef.current;
      const drive = sceneProgress ?? tick;
      const gather = sceneProgress ?? 0.5;
      const globalDrive = globalProgressRef.current;
      const interaction = interactionRef.current;
      const pointerX = interaction?.pointerX ?? 0.5;
      const pointerY = interaction?.pointerY ?? 0.5;
      const velocity = interaction?.velocity ?? 0;
      const typing = interaction?.typingIntensity ?? 0;
      const pulse = interaction?.interactionIntensity ?? 0;
      const livePulse = interaction?.livePulse ?? 0;
      ctx.clearRect(0, 0, width, height);
      drawGrid();

      const grd = ctx.createRadialGradient(width * 0.5, height * 0.44, 0, width * 0.5, height * 0.44, Math.max(width, height) * 0.8);
      grd.addColorStop(0, "rgba(255,255,255,0.06)");
      grd.addColorStop(0.48, "rgba(255,255,255,0.015)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        const pull = variant === "hero" ? (gather - 0.5) * width * 0.12 : 0;
        const px = p.x * width;
        const py = p.y * height;
        const dx = px - pointerX * width;
        const dy = py - pointerY * height;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const influence = Math.max(0, 1 - dist / Math.max(width, height) * 1.65);
        const polarity = variant === "beam" ? -1 : 1;
        const bend = (pulse * 30 + livePulse * 12 + velocity * 48 + typing * 18) * influence * polarity;
        const x = px + pull * (p.z - 0.55) + (dx / dist) * bend;
        let y = p.y * height;

        if (variant === "hero") {
          y = height * (0.42 + Math.sin(p.x * 9 + drive * 3.2 + p.phase + livePulse * 0.8) * (0.15 - gather * 0.05 + velocity * 0.05 + livePulse * 0.012) + Math.sin(p.x * 23 + drive + velocity * 2) * 0.035) + (p.y - 0.5) * height * (0.3 - gather * 0.1) + (dy / dist) * bend;
        } else if (variant === "wave") {
          y = height * (0.58 + Math.sin(p.x * 8 + drive * 2.8 + p.phase + pulse * 1.2 + livePulse) * (0.07 + gather * 0.08 + pulse * 0.04 + livePulse * 0.018)) + (p.y - 0.5) * height * 0.22 + (dy / dist) * bend * 0.65;
        } else if (variant === "beam") {
          const beamHead = Math.max(0.08, Math.min(1, gather + typing * 0.16));
          const spread = Math.max(0.03, Math.abs(p.x - beamHead) * 0.42);
          y = height * 0.52 + (p.y - 0.5) * height * spread + Math.sin(p.x * 10 + drive * 2 + p.phase + typing * 2) * (12 + typing * 12) + (dy / dist) * bend * 0.42;
        }

        const alpha = (variant === "subtle" ? 0.11 + pulse * 0.06 + livePulse * 0.02 : 0.16 + gather * 0.1 + velocity * 0.08 + typing * 0.08 + livePulse * 0.035) * p.z;
        ctx.fillStyle = `rgba(250,250,250,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.45, p.z * 1.25), 0, Math.PI * 2);
        ctx.fill();
      });

      if (variant === "beam") {
        const head = Math.max(width * 0.12, width * Math.min(1, (sceneProgress ?? ((Math.sin(tick + globalDrive) + 1) / 2)) + typing * 0.12));
        const beam = ctx.createLinearGradient(Math.max(0, head - width * 0.36), height * 0.52, Math.min(width, head + width * 0.14), height * 0.52);
        beam.addColorStop(0, "rgba(255,255,255,0)");
        beam.addColorStop(0.34, "rgba(255,255,255,0.48)");
        beam.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = beam;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.52);
        ctx.bezierCurveTo(width * 0.28, height * 0.5, width * 0.52, height * 0.52, head, height * 0.34);
        ctx.stroke();
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
        resize();
        if (reduced) draw();
      })
      : null;
    const onProgress = (event: Event) => {
      if (!sceneName) return;
      const detail = (event as CustomEvent<CinemaProgressDetail>).detail;
      progressRef.current = detail.progressByScene[sceneName as CinemaSceneName] ?? progressRef.current;
      globalProgressRef.current = detail.globalProgress;
      if (detail.reducedMotion) draw();
    };

    const onInteraction = (event: Event) => {
      interactionRef.current = (event as CustomEvent<MarketingInteractionDetail>).detail;
    };

    resizeObserver?.observe(canvas);
    window.addEventListener(CINEMA_PROGRESS_EVENT, onProgress);
    window.addEventListener(MARKETING_INTERACTION_EVENT, onInteraction);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      window.removeEventListener(CINEMA_PROGRESS_EVENT, onProgress);
      window.removeEventListener(MARKETING_INTERACTION_EVENT, onInteraction);
      window.removeEventListener("resize", resize);
    };
  }, [variant, sceneName, reducedMotion]);

  return <canvas ref={canvasRef} className={`particle-field ${className}`} aria-hidden="true" />;
}

export function AgentNetworkGraph({ className = "", nodes, mode = "network", sceneName = "hero", interactive = false }: AgentNetworkGraphProps) {
  const id = useId().replace(/:/g, "");
  const points = nodes ?? (mode === "branch" ? BRANCH_NODES : DEFAULT_NODES);
  const origin = mode === "branch" ? { x: 39, y: 52 } : null;
  const dispatchAgent = (agent: string | null) => {
    if (!interactive) return;
    window.dispatchEvent(new CustomEvent("marketing-agent-hover", { detail: { agent, scene: sceneName } }));
  };

  return (
    <div className={`agent-graph agent-graph--${mode} ${interactive ? "is-interactive" : ""} ${className}`} aria-hidden={!interactive}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id={`agentGlow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {mode === "branch" && origin ? (
          points.map((node) => (
            <path
              key={node.label}
              className="agent-graph-line agent-graph-line--active"
              d={`M ${origin.x} ${origin.y} C 54 ${origin.y}, 58 ${node.y}, ${node.x - 5} ${node.y}`}
              filter={`url(#agentGlow-${id})`}
            />
          ))
        ) : (
          points.flatMap((node, i) =>
            points.slice(i + 1).map((next, j) => {
              if ((i + j) % 2 === 1 && Math.abs(next.x - node.x) > 24) return null;
              return (
                <line
                  key={`${node.label}-${next.label}`}
                  className="agent-graph-line"
                  x1={node.x}
                  y1={node.y}
                  x2={next.x}
                  y2={next.y}
                />
              );
            }),
          )
        )}
        {origin && <circle className="agent-graph-origin" cx={origin.x} cy={origin.y} r="1.2" />}
        {points.map((node) => (
          <g key={node.label}>
            <circle className="agent-graph-node" data-agent={agentKey(node.label)} cx={node.x} cy={node.y} r="1.15" filter={`url(#agentGlow-${id})`} />
          </g>
        ))}
      </svg>
      {points.map((node) => {
        const style = { left: `${node.x}%`, top: `${node.y}%` };
        if (interactive) {
          return (
            <button
              key={node.label}
              type="button"
              className="agent-graph-label"
              data-agent={agentKey(node.label)}
              style={style}
              aria-label={`${node.label} agent status`}
              onPointerEnter={() => dispatchAgent(node.label)}
              onPointerLeave={() => dispatchAgent(null)}
              onFocus={() => dispatchAgent(node.label)}
              onBlur={() => dispatchAgent(null)}
            >
              {node.label}
              <small>{mode === "branch" ? "Routing" : "Live agent"}</small>
              <em>{mode === "branch" ? "Route live" : "Running checks"}</em>
            </button>
          );
        }

        return (
          <span
            key={node.label}
            className="agent-graph-label"
            data-agent={agentKey(node.label)}
            style={style}
          >
            {node.label}
            <small>Agent</small>
          </span>
        );
      })}
    </div>
  );
}
