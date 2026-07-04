"use client";

/**
 * MarketingFrame — Owns the loading screen + scroll lock + smooth scroll
 * for marketing routes. Renders children underneath the cover so the
 * hand-off is seamless (no flash).
 *
 * Scroll lock: while the cover is active, both `html` and `body` get
 * overflow:hidden. The body lock alone is enough — there's nothing to
 * scroll since the cover is on top.
 */

import { useState, useEffect, type ReactNode } from "react";
import { SmoothScroll } from "@/shared/components/layout/SmoothScroll";
import { ScrollIndicator } from "@/shared/components/layout/ScrollIndicator";
import { LoadingScreen } from "@/features/marketing/loading/LoadingScreen";
import { ScrollTrigger } from "@/lib/gsap";

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

  useEffect(() => {
    if (coverDone) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      // ScrollTriggers (pins, scrubs) were created while the page was
      // scroll-locked under the cover, so their start/end were measured
      // against a zero-scroll document. Recompute now that the real page
      // height is live. A few passes cover Lenis/layout settling.
      const refresh = () => ScrollTrigger.refresh();
      const r1 = requestAnimationFrame(refresh);
      const t1 = setTimeout(refresh, 120);
      const t2 = setTimeout(refresh, 360);
      return () => {
        cancelAnimationFrame(r1);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [coverDone]);

  return (
    <>
      <SmoothScroll>
        {children}
        <ScrollIndicator />
      </SmoothScroll>
      {!coverDone && <LoadingScreen onComplete={() => setCoverDone(true)} />}
    </>
  );
}
