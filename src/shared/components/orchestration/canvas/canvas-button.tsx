"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface CanvasButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/**
 * Minimal, fully-typed button for the canvas controls. Reuses the global `btn`
 * CSS classes (same look as the shared UI Button) without that component's
 * awkward required-prop inference.
 */
export function CanvasButton({ variant = "secondary", className = "", ...rest }: CanvasButtonProps) {
  const cls = ["btn", `btn-${variant}`, "btn-sm", className].filter(Boolean).join(" ");
  return <button type="button" className={cls} {...rest} />;
}
