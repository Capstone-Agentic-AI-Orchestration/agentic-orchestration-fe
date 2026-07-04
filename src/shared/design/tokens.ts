/**
 * DevFlow Design Tokens
 * Single source of truth for color, spacing, typography, motion, radius, shadow, z-index.
 * All values are referenced as CSS custom properties in globals.css.
 * Never hardcode these in components — import from the CSS vars instead.
 */

// =============================================================================
// COLOR
// =============================================================================
// Black canvas, white foreground. No tints, no gradients. One accent.

export const color = {
  // Background
  bg: {
    base: "#0A0A0A",        // page canvas
    elevated: "#111111",   // cards, panels
    sunken: "#050505",     // inputs, code blocks
    overlay: "rgba(0,0,0,0.6)", // modal backdrop
  },
  // Foreground
  fg: {
    primary: "#FAFAFA",    // headings, primary text
    secondary: "#A1A1A1",  // body text
    tertiary: "#666666",   // hints, labels
    muted: "#404040",      // dividers, placeholders
  },
  // Borders
  border: {
    subtle: "rgba(255,255,255,0.06)",
    default: "rgba(255,255,255,0.10)",
    strong: "rgba(255,255,255,0.20)",
  },
  // Accent — single, sparingly used
  accent: {
    primary: "#FAFAFA",   // white accent (CTAs)
    attention: "#FF6B35", // warm orange for warnings
  },
  // Status
  status: {
    success: "#10B981",
    danger: "#EF4444",
  },
} as const;

// =============================================================================
// SPACING (4-pt base)
// =============================================================================

export const space = {
  0: "0",
  px: "1px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
  40: "160px",
} as const;

// =============================================================================
// RADIUS
// =============================================================================

export const radius = {
  none: "0",
  sm: "2px",
  md: "4px",
  lg: "6px",
  full: "9999px",
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const fontFamily = {
  sans: '"Geist", system-ui, -apple-system, sans-serif',
  mono: '"Geist Mono", ui-monospace, "SFMono-Regular", "Menlo", monospace',
} as const;

export const fontSize = {
  xs: "11px",
  sm: "13px",
  base: "14px",
  md: "15px",
  lg: "16px",
  xl: "20px",
  "2xl": "28px",
  "3xl": "40px",
  "4xl": "56px",
  "5xl": "80px",
  "6xl": "120px",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.0,
  snug: 1.2,
  normal: 1.55,
  relaxed: 1.7,
} as const;

export const letterSpacing = {
  tight: "-0.04em",
  snug: "-0.02em",
  normal: "0",
  wide: "0.08em",
  wider: "0.14em",
} as const;

// =============================================================================
// MOTION
// =============================================================================

export const motion = {
  duration: {
    instant: "100ms",
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms",
    page: "700ms",
  },
  easing: {
    smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
    snappy: "cubic-bezier(0.87, 0, 0.13, 1)",
    dramatic: "cubic-bezier(0.76, 0, 0.24, 1)",
    out: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
  },
  spring: {
    smooth: { stiffness: 200, damping: 25 },
    snappy: { stiffness: 300, damping: 20 },
    gentle: { stiffness: 100, damping: 20 },
  },
} as const;

// =============================================================================
// SHADOW (minimal — use borders instead)
// =============================================================================

export const shadow = {
  none: "none",
  ring: "0 0 0 1px rgba(255,255,255,0.06)",
  focus: "0 0 0 2px rgba(255,255,255,0.40)",
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  base: "0",
  raised: "10",
  sticky: "100",
  dropdown: "200",
  overlay: "900",
  modal: "1000",
  toast: "2000",
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoint = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// =============================================================================
// CONTAINER WIDTHS
// =============================================================================

export const containerWidth = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1200px",
  "2xl": "1400px",
} as const;
