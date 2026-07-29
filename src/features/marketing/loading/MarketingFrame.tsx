"use client";

/**
 * MarketingFrame — Owns the loading screen + scroll lock + smooth scroll
 * for marketing routes. Renders children underneath the cover so the
 * hand-off is seamless (no flash).
 */

import { useState, useEffect, type ReactNode } from "react";
import { useLenis } from "lenis/react";
import { SmoothScroll } from "@/shared/components/layout/SmoothScroll";
import { ScrollIndicator } from "@/shared/components/layout/ScrollIndicator";
import { LoadingScreen } from "@/features/marketing/loading/LoadingScreen";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * CoverScrollLock — locks scroll while the loading cover is up and owns the
 * hand-off when it finishes. Must render inside <SmoothScroll> so useLenis()
 * resolves.
 *
 * The explicit lenis.resize() on unlock is load-bearing: Lenis measures its
 * scroll limit when it mounts, which happens while the cover holds html/body
 * at overflow:hidden. The document then reports viewport height, the limit
 * lands at 0, and every wheel scroll clamps back to the top ("page won't
 * scroll"). Restoring overflow doesn't change any element's own size, so no
 * ResizeObserver fires — the limit stays 0 until we re-measure here.
 */
function CoverScrollLock({ locked }: { locked: boolean }) {
  const lenis = useLenis();

  useEffect(() => {
    if (locked) {
      const prevHtml = document.documentElement.style.overflow;
      const prevBody = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      lenis?.stop();
      return () => {
        document.documentElement.style.overflow = prevHtml;
        document.body.style.overflow = prevBody;
      };
    }

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    lenis?.start();
    const settle = () => {
      lenis?.resize();
      ScrollTrigger.refresh();
    };
    settle();
    // Layout/Lenis settle over a few frames — measure again to be safe.
    const r1 = requestAnimationFrame(settle);
    const t1 = setTimeout(settle, 120);
    const t2 = setTimeout(settle, 360);
    return () => {
      cancelAnimationFrame(r1);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [locked, lenis]);

  return null;
}

export function MarketingFrame({ children }: { children: ReactNode }) {
  const [coverDone, setCoverDone] = useState(false);

  useEffect(() => {
    // Apply the marketing scrollbar style (hidden native bar + custom indicator)
    // only while a marketing route is mounted.
    document.documentElement.classList.add("marketing-scrollbar");
    return () => {
      document.documentElement.classList.remove("marketing-scrollbar");
    };
  }, []);

  // Safety net: if the cover never calls onComplete, force the hand-off so
  // the unlock/resize path still runs.
  useEffect(() => {
    if (coverDone) return;
    const id = setTimeout(() => setCoverDone(true), 5000);
    return () => clearTimeout(id);
  }, [coverDone]);

  return (
    <>
      <SmoothScroll>
        <CoverScrollLock locked={!coverDone} />
        {children}
        <ScrollIndicator />
      </SmoothScroll>
      {!coverDone && <LoadingScreen onComplete={() => setCoverDone(true)} />}
    </>
  );
}
