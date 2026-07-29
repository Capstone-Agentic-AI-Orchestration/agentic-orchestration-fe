"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, registerGsapPlugins } from "@/lib/gsap";
import {
  CINEMA_PROGRESS_EVENT,
  MARKETING_INTERACTION_EVENT,
  type CinemaProgressDetail,
  type CinemaSceneName,
  type MarketingInteractionDetail,
  clamp01,
} from "./cinema-progress";

interface MarketingInteractionDirectorProps {
  rootRef: RefObject<HTMLElement | null>;
}

const DEFAULT_DETAIL: MarketingInteractionDetail = {
  pointerX: 0.5,
  pointerY: 0.5,
  velocity: 0,
  activeScene: "hero",
  hoveredAgent: null,
  liveAgent: "Planner",
  livePulse: 0,
  focusedControl: null,
  typingIntensity: 0,
  interactionIntensity: 0,
  reducedMotion: false,
};

const AGENT_SEQUENCES: Record<CinemaSceneName, string[]> = {
  hero: ["Planner", "Architect", "Frontend", "Backend", "Database", "Reviewer"],
  anatomy: ["Orchestrator", "Planner", "Architect", "Engineer", "Reviewer", "QA Agent", "Deployer"],
  how: ["Analyst", "Architect", "Researcher", "Planner"],
  faq: ["Reviewer", "Planner", "Architect"],
  cta: ["Planner", "Architect", "Frontend", "Reviewer"],
};

function normalizeAgent(agent: string | null) {
  return agent?.trim().toLowerCase() ?? "";
}

function getFocusableName(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return null;
  if (target.matches("input, textarea, button, a")) {
    return target.id || target.getAttribute("aria-label") || target.textContent?.trim().slice(0, 32) || target.tagName.toLowerCase();
  }
  return null;
}

export function MarketingInteractionDirector({ rootRef }: MarketingInteractionDirectorProps) {
  const detailRef = useRef<MarketingInteractionDetail>(DEFAULT_DETAIL);
  const targetPointerRef = useRef({ x: 0.5, y: 0.5 });
  const smoothPointerRef = useRef({ x: 0.5, y: 0.5 });
  const lastScrollRef = useRef({ y: 0, t: 0 });
  const velocityRef = useRef(0);
  const burstRef = useRef(0);
  const typingRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    registerGsapPlugins();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || window.innerWidth < 820) {
      root.style.setProperty("--interaction-intensity", "0");
      return;
    }

    const publish = () => {
      const pointer = smoothPointerRef.current;
      const velocity = clamp01(velocityRef.current);
      const typingIntensity = clamp01(typingRef.current);
      const sceneAgents = AGENT_SEQUENCES[detailRef.current.activeScene] ?? AGENT_SEQUENCES.hero;
      const phase = (performance.now() / 1180) % sceneAgents.length;
      const liveAgent = sceneAgents[Math.floor(phase)] ?? sceneAgents[0] ?? "Planner";
      const livePulse = 0.5 + Math.sin(phase * Math.PI * 2) * 0.5;
      const interactionIntensity = clamp01(
        Math.max(
          Math.abs(pointer.x - 0.5) * 0.72,
          Math.abs(pointer.y - 0.5) * 0.72,
          velocity,
          typingIntensity,
          burstRef.current,
          livePulse * 0.18,
        ),
      );

      const next: MarketingInteractionDetail = {
        ...detailRef.current,
        pointerX: pointer.x,
        pointerY: pointer.y,
        velocity,
        liveAgent,
        livePulse,
        typingIntensity,
        interactionIntensity,
        reducedMotion,
      };
      detailRef.current = next;

      root.style.setProperty("--pointer-x", pointer.x.toFixed(4));
      root.style.setProperty("--pointer-y", pointer.y.toFixed(4));
      root.style.setProperty("--scroll-velocity", velocity.toFixed(4));
      root.style.setProperty("--typing-intensity", typingIntensity.toFixed(4));
      root.style.setProperty("--interaction-intensity", interactionIntensity.toFixed(4));
      root.style.setProperty("--agent-live-pulse", livePulse.toFixed(4));
      root.dataset.liveAgent = normalizeAgent(next.hoveredAgent ?? liveAgent);
      if (next.hoveredAgent) root.dataset.hoveredAgent = normalizeAgent(next.hoveredAgent);
      else delete root.dataset.hoveredAgent;
      if (next.focusedControl) root.dataset.focusedControl = next.focusedControl;
      else delete root.dataset.focusedControl;

      window.dispatchEvent(new CustomEvent<MarketingInteractionDetail>(MARKETING_INTERACTION_EVENT, { detail: next }));
    };

    const tick = () => {
      const pointer = smoothPointerRef.current;
      const target = targetPointerRef.current;
      pointer.x += (target.x - pointer.x) * 0.12;
      pointer.y += (target.y - pointer.y) * 0.12;
      velocityRef.current *= 0.9;
      burstRef.current *= 0.88;
      typingRef.current *= 0.9;
      publish();
    };

    const onPointerMove = (event: PointerEvent) => {
      targetPointerRef.current = {
        x: clamp01(event.clientX / Math.max(1, window.innerWidth)),
        y: clamp01(event.clientY / Math.max(1, window.innerHeight)),
      };
      burstRef.current = Math.max(burstRef.current, 0.18);
    };

    const onScroll = () => {
      const now = performance.now();
      const prev = lastScrollRef.current;
      const dt = Math.max(16, now - prev.t);
      velocityRef.current = Math.max(velocityRef.current, Math.min(1, Math.abs(window.scrollY - prev.y) / dt / 3.2));
      lastScrollRef.current = { y: window.scrollY, t: now };
    };

    const onCinemaProgress = (event: Event) => {
      const detail = (event as CustomEvent<CinemaProgressDetail>).detail;
      detailRef.current = {
        ...detailRef.current,
        activeScene: detail.activeScene,
        reducedMotion: detail.reducedMotion,
      };
    };

    const onAgentHover = (event: Event) => {
      const detail = (event as CustomEvent<{ agent: string | null; scene?: CinemaSceneName }>).detail;
      detailRef.current = {
        ...detailRef.current,
        hoveredAgent: detail.agent,
        activeScene: detail.scene ?? detailRef.current.activeScene,
      };
      burstRef.current = detail.agent ? 0.72 : Math.max(burstRef.current, 0.18);
      publish();
    };

    const onBurst = (event: Event) => {
      const detail = (event as CustomEvent<{ intensity?: number; scene?: CinemaSceneName }>).detail;
      if (detail.scene) {
        detailRef.current = { ...detailRef.current, activeScene: detail.scene };
      }
      burstRef.current = Math.max(burstRef.current, detail.intensity ?? 0.65);
      publish();
    };

    const onFocusIn = (event: FocusEvent) => {
      const focused = getFocusableName(event.target);
      if (!focused) return;
      detailRef.current = { ...detailRef.current, focusedControl: focused };
      burstRef.current = 0.45;
      publish();
    };

    const onFocusOut = () => {
      detailRef.current = { ...detailRef.current, focusedControl: null };
      publish();
    };

    const onInput = () => {
      typingRef.current = 1;
      burstRef.current = Math.max(burstRef.current, 0.55);
      publish();
    };

    lastScrollRef.current = { y: window.scrollY, t: performance.now() };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(CINEMA_PROGRESS_EVENT, onCinemaProgress);
    window.addEventListener("marketing-agent-hover", onAgentHover);
    window.addEventListener("marketing-interaction-burst", onBurst);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    root.addEventListener("input", onInput);
    gsap.ticker.add(tick);
    publish();

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(CINEMA_PROGRESS_EVENT, onCinemaProgress);
      window.removeEventListener("marketing-agent-hover", onAgentHover);
      window.removeEventListener("marketing-interaction-burst", onBurst);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      root.removeEventListener("input", onInput);
    };
  }, [rootRef]);

  return null;
}
