"use client";

import { useLayoutEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import { gsap, ScrollTrigger, registerGsapPlugins } from "@/lib/gsap";
import { AnatomyOfRun } from "./AnatomyOfRun";
import { CTASection } from "./CTASection";
import { FAQ } from "./FAQ";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { MarketingInteractionDirector } from "./MarketingInteractionDirector";
import {
  CINEMA_PROGRESS_EVENT,
  CINEMA_SCENES,
  CINEMA_SCENE_WEIGHTS,
  type CinemaProgressDetail,
  type CinemaSceneName,
  clamp01,
  getActiveSceneFromProgress,
  getCinemaDuration,
  getSceneProgress,
  getSceneStart,
} from "./cinema-progress";
import "./MarketingCinema.css";

const sceneLabels: Record<CinemaSceneName, string> = {
  hero: "Hero",
  anatomy: "Run anatomy",
  how: "Workflow",
  faq: "FAQ",
  cta: "Start",
};

function buildProgressDetail(globalProgress: number, activeScene: CinemaSceneName, reducedMotion = false): CinemaProgressDetail {
  return {
    activeScene,
    globalProgress,
    reducedMotion,
    progressByScene: {
      hero: getSceneProgress(globalProgress, 0),
      anatomy: getSceneProgress(globalProgress, 1),
      how: getSceneProgress(globalProgress, 2),
      faq: getSceneProgress(globalProgress, 3),
      cta: getSceneProgress(globalProgress, 4),
    },
  };
}

export function MarketingCinema() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    registerGsapPlugins();

    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const mm = gsap.matchMedia();

    const publish = (globalProgress: number, forceScene?: CinemaSceneName, reducedMotion = false) => {
      const progress = clamp01(globalProgress);
      const activeScene = forceScene ?? getActiveSceneFromProgress(progress);
      const detail = buildProgressDetail(progress, activeScene, reducedMotion);

      root.style.setProperty("--cinema-progress", progress.toFixed(4));
      root.dataset.cinemaActive = activeScene;

      CINEMA_SCENES.forEach((sceneName) => {
        const scene = root.querySelector<HTMLElement>(`[data-cinema-scene="${sceneName}"]`);
        const localProgress = detail.progressByScene[sceneName];
        scene?.style.setProperty("--scene-progress", localProgress.toFixed(4));
        if (sceneName === "anatomy") {
          scene?.style.setProperty("--anatomy-rail-progress", clamp01((localProgress - 0.35) / 0.3).toFixed(4));
          scene?.style.setProperty("--anatomy-push-progress", clamp01(localProgress / 0.18).toFixed(4));
          scene?.style.setProperty("--anatomy-exit-progress", clamp01((localProgress - 0.82) / 0.18).toFixed(4));
          scene?.setAttribute("data-anatomy-phase", localProgress < 0.15 ? "push" : localProgress < 0.35 ? "boot" : localProgress < 0.65 ? "type" : localProgress < 0.82 ? "success" : "handoff");
        }
        if (scene) scene.style.pointerEvents = sceneName === activeScene ? "auto" : "none";
      });

      window.dispatchEvent(new CustomEvent<CinemaProgressDetail>(CINEMA_PROGRESS_EVENT, { detail }));
    };

    const scrollToScene = (sceneName: CinemaSceneName) => {
      const trigger = ScrollTrigger.getById("marketing-cinema");
      if (!trigger) {
        const fallbackId = sceneName === "how" ? "how-it-works" : sceneName;
        document.getElementById(fallbackId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const index = CINEMA_SCENES.indexOf(sceneName);
      const sceneProgress = getSceneStart(CINEMA_SCENES[index] ?? "hero") / getCinemaDuration();
      const top = trigger.start + (trigger.end - trigger.start) * sceneProgress;
      if (lenis) lenis.scrollTo(top);
      else window.scrollTo({ top, behavior: "smooth" });
    };

    const onScrollTo = (event: Event) => {
      const scene = (event as CustomEvent<{ scene: CinemaSceneName }>).detail.scene;
      scrollToScene(scene);
    };
    const onScrollCta = () => scrollToScene("cta");

    window.addEventListener("marketing-cinema-scroll-cta", onScrollCta);
    window.addEventListener("marketing-cinema-scroll-to", onScrollTo);

    mm.add("(min-width: 820px) and (prefers-reduced-motion: no-preference)", () => {
      const scenes = CINEMA_SCENES.map((sceneName) => root.querySelector<HTMLElement>(`[data-cinema-scene="${sceneName}"]`)).filter(Boolean) as HTMLElement[];

      root.dataset.cinemaMode = "reel";
      gsap.set(scenes, { autoAlpha: 0, scale: 1.045, y: 34 });
      gsap.set(scenes[0], { autoAlpha: 1, scale: 1, y: 0 });
      gsap.set(".cinema-scene [data-cinema-reveal]", { opacity: 0, y: 24 });
      gsap.set('[data-cinema-scene="hero"] [data-cinema-reveal]', { opacity: 1, y: 0 });
      gsap.set(".cinema-scene .anatomy-log", { opacity: 0.08, y: 14 });
      gsap.set(".cinema-scene .anatomy-rail-step", { opacity: 0.28, scale: 0.92 });
      gsap.set(".cinema-scene .anatomy-rail-fill", { scaleX: 0 });
      publish(0, "hero");

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "marketing-cinema",
          trigger: root,
          start: "top top",
          end: "+=650%",
          pin: stage,
          pinSpacing: true,
          scrub: 0.78,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => publish(self.progress),
        },
      });

      let cumulativeStart = 0;
      scenes.forEach((scene, i) => {
        const sceneName = scene.dataset.cinemaScene as CinemaSceneName;
        const sceneWeight = CINEMA_SCENE_WEIGHTS[sceneName] ?? 1;
        const at = cumulativeStart;
        const beat = (position: number) => at + sceneWeight * position;

        if (i > 0) {
          tl.to(scene, { autoAlpha: 1, scale: 1, y: 0, duration: 0.22, ease: "power2.out" }, beat(0));
        }

        tl.to(scene, { scale: 0.982, y: -30, duration: sceneWeight * 0.68 }, beat(0.18));

        if (i < scenes.length - 1) {
          tl.to(scene, { autoAlpha: 0, duration: 0.18, ease: "power1.in" }, beat(0.88));
        }

        tl.fromTo(
          scene.querySelectorAll("[data-cinema-reveal]"),
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.28, stagger: 0.035, ease: "power2.out", immediateRender: false },
          beat(0.06),
        );

        if (sceneName === "hero") {
          const heroGraph = scene.querySelector(".hero-agent-graph");
          const heroScene = scene.querySelector(".hero-scene");
          const heroInner = scene.querySelector(".hero-inner");
          if (heroGraph) {
            tl.fromTo(heroGraph, { opacity: 0.2, x: 80, scale: 0.92 }, { opacity: 0.94, x: -28, scale: 1.04, duration: 0.72 }, beat(0.02));
          }
          if (heroScene) {
            tl.to(heroScene, { opacity: 0.86, scale: 1.18, duration: 0.9 }, beat(0.04));
          }
          if (heroInner) {
            tl.to(heroInner, { xPercent: -4, opacity: 0.48, duration: 0.35 }, beat(0.62));
          }
        }

        if (sceneName === "anatomy") {
          const logs = scene.querySelectorAll(".anatomy-log");
          const steps = scene.querySelectorAll(".anatomy-rail-step");
          tl.fromTo(scene.querySelector(".anatomy-layout"), { y: 46, scale: 0.9 }, { y: 0, scale: 1.04, duration: sceneWeight * 0.15, ease: "power3.out" }, beat(0))
            .fromTo(scene.querySelector(".anatomy-console"), { opacity: 0, y: 64, scale: 0.88 }, { opacity: 1, y: 0, scale: 1, duration: sceneWeight * 0.16, ease: "power3.out" }, beat(0.03))
            .fromTo(scene.querySelectorAll(".anatomy-panel-ghost"), { opacity: 0, x: -54 }, { opacity: 1, x: 0, duration: sceneWeight * 0.16, stagger: 0.05 }, beat(0.14))
            .fromTo(scene.querySelector(".anatomy-live i"), { scale: 0.4, opacity: 0.4 }, { scale: 3.2, opacity: 0.12, duration: 0.2, repeat: 2, yoyo: true, ease: "power2.out" }, beat(0.2))
            .to(logs, { opacity: 1, y: 0, duration: 0.06, stagger: 0.065, ease: "steps(1)" }, beat(0.35))
            .to(scene.querySelector(".anatomy-rail-fill"), { scaleX: 1, duration: sceneWeight * 0.3, ease: "none" }, beat(0.35))
            .to(steps, { opacity: 1, scale: 1, duration: 0.06, stagger: 0.09 }, beat(0.37))
            .to(scene.querySelector(".anatomy-console"), { boxShadow: "0 0 0 1px rgba(72, 229, 106, 0.38), 0 34px 110px rgba(72, 229, 106, 0.12)", duration: sceneWeight * 0.08, ease: "power2.out" }, beat(0.65))
            .fromTo(scene.querySelector(".anatomy-live i"), { scale: 1, opacity: 1 }, { scale: 4.2, opacity: 0.08, duration: 0.2, repeat: 3, yoyo: true, ease: "power2.out" }, beat(0.68))
            .to(scene.querySelector(".anatomy-layout"), { y: -22, scale: 0.97, duration: sceneWeight * 0.16, ease: "power2.inOut" }, beat(0.84));
        }

        if (sceneName === "how") {
          tl.fromTo(scene.querySelectorAll(".how-step"), { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 0.36, stagger: 0.075, ease: "power3.out" }, beat(0.08))
            .fromTo(scene.querySelector(".how-agent-graph"), { opacity: 0, scale: 0.88, x: 70 }, { opacity: 1, scale: 1, x: 0, duration: 0.5, ease: "power2.out" }, beat(0.28));
        }

        if (sceneName === "faq") {
          tl.fromTo(scene.querySelector(".faq-title"), { xPercent: -18, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.34, ease: "power3.out" }, beat(0.05))
            .fromTo(scene.querySelector(".faq-list"), { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.44, ease: "power3.out" }, beat(0.15))
            .fromTo(scene.querySelector(".faq-active"), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32 }, beat(0.34));
        }

        if (sceneName === "cta") {
          tl.fromTo(scene.querySelector(".cta-head"), { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: "power3.out" }, beat(0.03))
            .fromTo(scene.querySelector(".cta-terminal"), { x: -80, opacity: 0, scale: 0.95 }, { x: 0, opacity: 1, scale: 1, duration: 0.38, ease: "power3.out" }, beat(0.18))
            .fromTo(scene.querySelector(".cta-form"), { x: 80, opacity: 0, scale: 0.95 }, { x: 0, opacity: 1, scale: 1, duration: 0.38, ease: "power3.out" }, beat(0.25))
            .fromTo(scene.querySelectorAll(".cta-terminal-lines p"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.05, stagger: 0.065, ease: "steps(1)" }, beat(0.38))
            .fromTo(scene.querySelector(".cta-trust"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28 }, beat(0.68));
        }

        cumulativeStart += sceneWeight;
      });

      const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        cancelAnimationFrame(refreshFrame);
        tl.kill();
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        root.dataset.cinemaMode = "static";
      };
    });

    mm.add("(max-width: 819px), (prefers-reduced-motion: reduce)", () => {
      root.dataset.cinemaMode = "static";
      publish(1, "cta", true);
      gsap.set(root.querySelectorAll(".cinema-scene"), { clearProps: "all", autoAlpha: 1, scale: 1, y: 0 });
    });

    return () => {
      window.removeEventListener("marketing-cinema-scroll-cta", onScrollCta);
      window.removeEventListener("marketing-cinema-scroll-to", onScrollTo);
      mm.revert();
    };
  }, [lenis]);

  return (
    <div ref={rootRef} className="marketing-cinema" data-cinema-mode="static">
      <MarketingInteractionDirector rootRef={rootRef} />
      <div ref={stageRef} className="marketing-cinema-stage">
        <div className="cinema-progress" aria-hidden="true">
          {CINEMA_SCENES.map((scene, index) => (
            <span key={scene}>
              <i>{String(index + 1).padStart(2, "0")}</i>
              {sceneLabels[scene]}
            </span>
          ))}
        </div>

        <div className="cinema-scene" data-cinema-scene="hero">
          <Hero cinematic sceneName="hero" />
        </div>
        <div className="cinema-scene" data-cinema-scene="anatomy">
          <AnatomyOfRun cinematic sceneName="anatomy" />
        </div>
        <div className="cinema-scene" data-cinema-scene="how">
          <HowItWorks cinematic sceneName="how" />
        </div>
        <div className="cinema-scene" data-cinema-scene="faq">
          <FAQ cinematic sceneName="faq" />
        </div>
        <div className="cinema-scene" data-cinema-scene="cta" id="cta">
          <CTASection cinematic sceneName="cta" />
        </div>
      </div>
    </div>
  );
}
