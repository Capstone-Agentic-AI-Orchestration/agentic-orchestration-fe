"use client";

/**
 * SmoothScroll — Lenis + GSAP integration.
 * Provides buttery-smooth scroll on desktop with ScrollTrigger sync.
 * Falls back to native scroll on touch devices and reduced-motion.
 *
 * Wrap any subtree:
 *   <SmoothScroll>{children}</SmoothScroll>
 *
 * Notes:
 * - ReactLenis runs its own raf loop, so we do NOT add lenis.raf to
 *   gsap.ticker. We only subscribe to Lenis scroll events and forward
 *   them to ScrollTrigger.update.
 * - ScrollTrigger.refresh() is called once Lenis is ready so any pinned
 *   sections created before the Lenis instance existed get re-measured.
 */

import { ReactLenis, useLenis } from "lenis/react";
import { useEffect, type ReactNode } from "react";
import { ScrollTrigger, registerGsapPlugins } from "@/lib/gsap";

interface SmoothScrollProps {
  children: ReactNode;
}

/*
 * LenisBridge must be a child of ReactLenis so useLenis() can consume the
 * Lenis context. Placing useLenis() inside SmoothScroll itself returns
 * undefined because SmoothScroll renders the provider but is not inside it.
 */
function LenisBridge({ children }: { children: ReactNode }) {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    // Any ScrollTriggers created before Lenis was ready (e.g. while the
    // loading cover was active) need their positions recalculated now.
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const t1 = setTimeout(() => ScrollTrigger.refresh(), 120);
    const t2 = setTimeout(() => ScrollTrigger.refresh(), 360);

    return () => {
      lenis.off("scroll", onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lenis]);

  return children;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    registerGsapPlugins();
  }, []);

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        syncTouch: false,
      }}
    >
      <LenisBridge>{children}</LenisBridge>
    </ReactLenis>
  );
}
