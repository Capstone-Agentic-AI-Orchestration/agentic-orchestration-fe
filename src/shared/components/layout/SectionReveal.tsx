"use client";

/**
 * SectionReveal — useGSAP scroll-trigger wrapper.
 * Reveals children on scroll with a simple fade-up.
 * Respects prefers-reduced-motion.
 *
 * Usage:
 *   <SectionReveal as="section">
 *     <h2>Title</h2>
 *   </SectionReveal>
 */

import { useGSAP } from "@gsap/react";
import { useRef, type ReactNode, type ElementType } from "react";
import { gsap, ScrollTrigger, registerGsapPlugins } from "@/lib/gsap";

interface SectionRevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  id?: string;
  delay?: number;
  y?: number;
  duration?: number;
}

export function SectionReveal({
  children,
  as: Tag = "div",
  className = "",
  id,
  delay = 0,
  y = 24,
  duration = 0.8,
}: SectionRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsapPlugins();

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        gsap.set(ref.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.from(ref.current, {
        opacity: 0,
        y,
        duration,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref as never} className={className} id={id}>
      {children}
    </Tag>
  );
}
