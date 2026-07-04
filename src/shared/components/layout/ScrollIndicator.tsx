"use client";

/**
 * ScrollIndicator — Lusion-style draggable right-edge scroll bar.
 *
 * A thin fixed bar on the right side of the viewport that fills with scroll
 * progress. Users can drag the thumb or click the track to scroll, and wheel
 * / touch / trackpad scrolling still works as usual.
 *
 * Reads progress directly from Lenis and uses Lenis for smooth animated
 * jumps. Hidden on mobile.
 */

import { useRef, useCallback, useEffect } from "react";
import { useLenis } from "lenis/react";
import { gsap } from "@/lib/gsap";
import "./ScrollIndicator.css";

export function ScrollIndicator() {
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lenisRef = useRef<ReturnType<typeof useLenis> | null>(null);

  const lenis = useLenis();

  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  useEffect(() => {
    if (!lenis || !fillRef.current) return;

    const onScroll = ({ scroll, limit }: { scroll: number; limit: number }) => {
      if (!fillRef.current || limit <= 0) return;
      const progress = Math.max(0, Math.min(1, scroll / limit));
      gsap.set(fillRef.current, { scaleY: progress });
    };

    lenis.on("scroll", onScroll);
    return () => {
      lenis.off("scroll", onScroll);
    };
  }, [lenis]);

  const scrollToProgress = useCallback((progress: number) => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    const target = progress * lenis.limit;
    lenis.scrollTo(target, { immediate: true });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const fill = fillRef.current;
    if (!track || !fill) return;

    const trackRect = () => track.getBoundingClientRect();

    const progressFromEvent = (clientY: number) => {
      const rect = trackRect();
      const relative = clientY - rect.top;
      return Math.max(0, Math.min(1, relative / rect.height));
    };

    const onTrackClick = (e: MouseEvent) => {
      if (e.target === fill) return; // let thumb drag handle it
      scrollToProgress(progressFromEvent(e.clientY));
    };

    const onThumbMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      fill.classList.add("is-dragging");
      document.body.style.userSelect = "none";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      scrollToProgress(progressFromEvent(e.clientY));
    };

    const onMouseUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      fill.classList.remove("is-dragging");
      document.body.style.userSelect = "";
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.target !== fill) return;
      e.preventDefault();
      draggingRef.current = true;
      fill.classList.add("is-dragging");
      document.body.style.userSelect = "none";
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      const touch = e.touches[0];
      if (touch) scrollToProgress(progressFromEvent(touch.clientY));
    };

    const onTouchEnd = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      fill.classList.remove("is-dragging");
      document.body.style.userSelect = "";
    };

    track.addEventListener("click", onTrackClick);
    fill.addEventListener("mousedown", onThumbMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    track.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      track.removeEventListener("click", onTrackClick);
      fill.removeEventListener("mousedown", onThumbMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      track.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [scrollToProgress]);

  return (
    <div ref={trackRef} className="scroll-indicator" aria-hidden="true">
      <div ref={fillRef} className="scroll-indicator-fill" />
    </div>
  );
}
