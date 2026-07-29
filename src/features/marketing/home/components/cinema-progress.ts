"use client";

export type CinemaSceneName = "hero" | "anatomy" | "how" | "faq" | "cta";

export interface CinemaProgressDetail {
  activeScene: CinemaSceneName;
  globalProgress: number;
  progressByScene: Record<CinemaSceneName, number>;
  reducedMotion: boolean;
}

export interface SceneProgressProps {
  cinematic?: boolean;
  interactive?: boolean;
  sceneName?: CinemaSceneName;
  progress?: number;
  globalProgress?: number;
  reducedMotion?: boolean;
  hoveredAgent?: string | null;
}

export const CINEMA_PROGRESS_EVENT = "marketing-cinema-progress";
export const MARKETING_INTERACTION_EVENT = "marketing-interaction-update";

export interface MarketingInteractionDetail {
  pointerX: number;
  pointerY: number;
  velocity: number;
  activeScene: CinemaSceneName;
  hoveredAgent: string | null;
  liveAgent: string | null;
  livePulse: number;
  focusedControl: string | null;
  typingIntensity: number;
  interactionIntensity: number;
  reducedMotion: boolean;
}

export const CINEMA_SCENES: CinemaSceneName[] = ["hero", "anatomy", "how", "faq", "cta"];
export const CINEMA_SCENE_WEIGHTS: Record<CinemaSceneName, number> = {
  hero: 1,
  anatomy: 1.45,
  how: 1,
  faq: 1,
  cta: 1,
};

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function getSceneStart(sceneName: CinemaSceneName) {
  return CINEMA_SCENES.slice(0, CINEMA_SCENES.indexOf(sceneName)).reduce((total, scene) => total + CINEMA_SCENE_WEIGHTS[scene], 0);
}

export function getCinemaDuration() {
  return CINEMA_SCENES.reduce((total, scene) => total + CINEMA_SCENE_WEIGHTS[scene], 0);
}

export function getSceneProgress(globalProgress: number, sceneIndex: number) {
  const sceneName = CINEMA_SCENES[sceneIndex] ?? "hero";
  const duration = getCinemaDuration();
  const playhead = clamp01(globalProgress) * duration;
  return clamp01((playhead - getSceneStart(sceneName)) / CINEMA_SCENE_WEIGHTS[sceneName]);
}

export function getActiveSceneFromProgress(globalProgress: number) {
  const duration = getCinemaDuration();
  const playhead = clamp01(globalProgress) * duration;
  let activeScene: CinemaSceneName = "hero";
  for (const scene of CINEMA_SCENES) {
    if (playhead >= getSceneStart(scene)) activeScene = scene;
  }
  return activeScene;
}
