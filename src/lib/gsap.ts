"use client";

/**
 * GSAP plugin registration — call once at app startup.
 * Centralizes plugin registration so we don't double-register or miss plugins.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerGsapPlugins(): void {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export { gsap, ScrollTrigger };
