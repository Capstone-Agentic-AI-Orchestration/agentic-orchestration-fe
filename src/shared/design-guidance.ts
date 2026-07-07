import type { DevFlowDesignGuidance, DevFlowDesignSystem } from "@/shared/api/devflow-api";

export interface DesignPresetPreview {
  label: string;
  paletteLabel: string;
  colors: string[];
}

export const DESIGN_SYSTEM_PRESETS: DevFlowDesignSystem[] = [
  {
    presetId: "devflow-black-ops",
    palette:
      "Black operational cockpit: near-black canvas, graphite panels, white primary text, muted blue actions, amber warnings, green success states.",
    typography:
      "System sans UI, compact hierarchy, clear labels, tabular numbers for operational data, no decorative display fonts.",
    spacing:
      "Balanced 8px grid with compact controls, generous row hit areas, and stable panel dimensions.",
    layout:
      "Dense dashboard layouts with side navigation, task panels, timelines, tables, and approval surfaces. Avoid marketing hero composition.",
    components:
      "Tables, timelines, cards, tabs, segmented controls, forms, status badges, approval panels, and command/tool buttons.",
    motion:
      "Subtle feedback only: hover, focus, progress, loading, and state transitions. Avoid ornamental motion.",
    voice:
      "Clear PM/operator language with concise labels, explicit states, and no hype copy.",
    brand:
      "DevFlow black theme: technical, reliable, agent-orchestration aware, and built for repeated project delivery.",
    antiPatterns: ["generic marketing hero", "gradient orb", "placeholder UI", "lorem ipsum"],
  },
  {
    presetId: "linear",
    palette:
      "Dark neutral workspace, crisp borders, restrained blue/violet accents, high contrast text, minimal status color.",
    typography:
      "Precise sans typography, compact labels, strong title/body contrast, short line lengths inside panels.",
    spacing:
      "Compact 8px rhythm with tight toolbars, clean gutters, and consistent panel padding.",
    layout:
      "Task-first product layout: left navigation, command surfaces, issue lists, timelines, and focused detail panes.",
    components:
      "Issue rows, keyboard-friendly menus, command bars, status pills, tabs, modals, and clean forms.",
    motion:
      "Fast micro-interactions, tasteful opacity/position transitions, no theatrical animation.",
    voice:
      "Short, direct, product-led copy with confident action labels.",
    brand:
      "Precision SaaS, fast execution, calm focus, and engineering-grade polish.",
    antiPatterns: ["oversized hero", "decorative illustration", "busy gradients"],
  },
  {
    presetId: "vercel",
    palette:
      "Monochrome black and white foundation with hairline borders, subtle gray surfaces, and sparse accent color.",
    typography:
      "Clean geometric sans, strong headings, readable body copy, and code-friendly rhythm.",
    spacing:
      "Balanced whitespace with exact grid alignment and tight component internals.",
    layout:
      "Documentation/product-console hybrid: clear nav, dense cards, code panels, deployment/status views.",
    components:
      "Metric cards, tabs, code blocks, tables, deployment rows, badges, and focused input groups.",
    motion:
      "Minimal hover/focus states and fast loading transitions.",
    voice:
      "Developer-facing, crisp, factual, and low-friction.",
    brand:
      "Modern developer platform with monochrome discipline and deployment confidence.",
    antiPatterns: ["color-heavy gradients", "ornamental cards", "marketing fluff"],
  },
  {
    presetId: "stripe",
    palette:
      "Refined dark base with vivid but disciplined accent gradients, clear success/error states, and luminous charts.",
    typography:
      "Confident SaaS typography with strong section labels, readable paragraphs, and polished number treatment.",
    spacing:
      "Balanced-to-spacious rhythm, layered panels, and generous breathing room around key summaries.",
    layout:
      "Revenue/product platform layout: dashboards, analytics blocks, onboarding panels, and clear forms.",
    components:
      "Charts, metric cards, accordions, checkout-like forms, badges, tables, and alert banners.",
    motion:
      "Smooth but purposeful transitions for state changes, charts, and progressive disclosure.",
    voice:
      "Clear, trustworthy, and outcome-oriented without sounding generic.",
    brand:
      "Polished platform energy, premium infrastructure, and finance-grade trust.",
    antiPatterns: ["random gradients", "toy-like icons", "vague conversion copy"],
  },
  {
    presetId: "notion",
    palette:
      "Soft neutral surface system with black text, low-saturation accents, and calm dividers.",
    typography:
      "Readable editorial UI typography, clear document hierarchy, and comfortable text density.",
    spacing:
      "Balanced document rhythm with airy blocks and compact inline controls.",
    layout:
      "Workspace/document layout: side nav, pages, databases, inline cards, and editable detail surfaces.",
    components:
      "Document blocks, tables, checklists, tags, toggles, empty states, and simple menus.",
    motion:
      "Quiet affordance transitions and unobtrusive disclosure.",
    voice:
      "Plain, helpful, and collaborative.",
    brand:
      "Calm workspace utility with structured documents and approachable operations.",
    antiPatterns: ["heavy chrome", "neon accents", "dashboard overload"],
  },
  {
    presetId: "apple",
    palette:
      "Deep black or clean white base with premium neutrals, soft separators, and restrained system accents.",
    typography:
      "Large-to-medium refined hierarchy, excellent readability, and minimal visual noise.",
    spacing:
      "Spacious rhythm with careful alignment and generous touch/click targets.",
    layout:
      "Product-focused layouts with simple flows, pristine forms, and confident detail views.",
    components:
      "Segmented controls, sheets, cards, toggles, step flows, media/detail panels, and polished buttons.",
    motion:
      "Smooth native-feeling transitions that reinforce continuity and focus.",
    voice:
      "Human, concise, premium, and calm.",
    brand:
      "Elegant product craft, clarity, and high-trust experience.",
    antiPatterns: ["dense clutter", "cheap shadows", "cartoon decoration"],
  },
  {
    presetId: "supabase",
    palette:
      "Dark developer console with graphite surfaces, green accents, neutral borders, and readable code colors.",
    typography:
      "Developer-friendly sans with compact labels, clear docs rhythm, and code-adjacent clarity.",
    spacing:
      "Balanced console spacing, tight tables, and strong separation between nav, editor, and data regions.",
    layout:
      "Admin/developer console layout: sidebar, data tables, auth/storage/API panels, and clear settings forms.",
    components:
      "Tables, SQL/code panels, status chips, settings forms, tabs, logs, and connection cards.",
    motion:
      "Utility-first transitions for loading, saving, and state feedback.",
    voice:
      "Practical, technical, and reassuring.",
    brand:
      "Open developer platform feel with database confidence and green action language.",
    antiPatterns: ["abstract hero art", "overly playful copy", "hidden controls"],
  },
  {
    presetId: "atlassian",
    palette:
      "Enterprise neutral base with blue actions, clear semantic colors, and accessible contrast.",
    typography:
      "Work-management typography with readable tables, clear labels, and consistent heading scale.",
    spacing:
      "Compact-to-balanced density for repeated workflows, issue rows, and admin settings.",
    layout:
      "Enterprise workspace layout: project nav, boards, lists, forms, reports, and permission-aware surfaces.",
    components:
      "Boards, tables, issue cards, avatars, breadcrumbs, menus, dialogs, badges, and audit panels.",
    motion:
      "Clear feedback for drag/drop, status changes, loading, and save confirmation.",
    voice:
      "Operational, team-friendly, and explicit about ownership/status.",
    brand:
      "Enterprise collaboration, process clarity, and reliable team workflows.",
    antiPatterns: ["consumer landing page", "ambiguous status", "decorative noise"],
  },
  {
    presetId: "carbon",
    palette:
      "Industrial enterprise neutrals, black/white contrast, restrained blue action states, and systematic semantic colors.",
    typography:
      "Structured enterprise typography with clear data hierarchy, labels, and accessible scale.",
    spacing:
      "Strict grid-based spacing with predictable modules and dense but readable data regions.",
    layout:
      "System dashboard layout: masthead, side nav, data grids, forms, filters, and operational panels.",
    components:
      "Data tables, filters, toggles, structured forms, modals, notifications, tags, and progress states.",
    motion:
      "Functional state transitions only, optimized for clarity and accessibility.",
    voice:
      "Precise, procedural, and enterprise-safe.",
    brand:
      "Systematic enterprise product, dependable operations, and strong accessibility posture.",
    antiPatterns: ["soft pastel brand wash", "unstructured cards", "unclear labels"],
  },
  {
    presetId: "minimal",
    palette:
      "Monochrome or very low-saturation neutrals, strong text contrast, and one restrained accent.",
    typography:
      "Editorially clean sans typography with generous line height and calm hierarchy.",
    spacing:
      "Balanced whitespace, simple grids, and low visual weight.",
    layout:
      "Focused product utility with simple pages, clear sections, clean forms, and readable lists.",
    components:
      "Flat cards, simple buttons, tables, accordions, forms, empty states, and status labels.",
    motion:
      "Barely-there transitions for affordance and continuity.",
    voice:
      "Plain, calm, and useful.",
    brand:
      "Minimal product clarity with practical elegance.",
    antiPatterns: ["gradient orb", "heavy shadow", "busy dashboard chrome"],
  },
  {
    presetId: "industrial",
    palette:
      "Black, graphite, off-white, warning amber, blueprint cyan, and utilitarian red for critical states.",
    typography:
      "Mechanical UI typography with strong labels, uppercase metadata, and precise data treatment.",
    spacing:
      "Rigid grid, compact controls, strong gutters, and deliberate panel boundaries.",
    layout:
      "Operations-room layout: dense dashboards, inspector panes, timelines, logs, and system maps.",
    components:
      "Log streams, status matrices, gauges, inspector cards, tables, tabs, and command buttons.",
    motion:
      "Instrument-like feedback, progress sweeps, and subtle status pulses only when meaningful.",
    voice:
      "Direct, technical, and command-oriented.",
    brand:
      "Hard-edged operational system for monitoring, control, and delivery assurance.",
    antiPatterns: ["soft lifestyle imagery", "friendly cartoon visuals", "rounded pill overload"],
  },
];

export const DESIGN_PRESET_PREVIEWS: Record<string, DesignPresetPreview> = {
  "devflow-black-ops": {
    label: "DevFlow Black Ops",
    paletteLabel: "Black cockpit, blue action, amber/green status",
    colors: ["#050608", "#111827", "#E5E7EB", "#60A5FA", "#F59E0B", "#34D399"],
  },
  linear: {
    label: "Linear",
    paletteLabel: "Dark neutrals with violet-blue action",
    colors: ["#08090B", "#181A20", "#F4F4F5", "#6C5DD3", "#5E6AD2", "#9CA3AF"],
  },
  vercel: {
    label: "Vercel",
    paletteLabel: "Monochrome console with hairline contrast",
    colors: ["#000000", "#111111", "#FFFFFF", "#A1A1AA", "#FAFAFA", "#3F3F46"],
  },
  stripe: {
    label: "Stripe",
    paletteLabel: "Premium dark base with vivid product accents",
    colors: ["#0A1020", "#172033", "#F6F9FC", "#635BFF", "#00D4FF", "#24B47E"],
  },
  notion: {
    label: "Notion",
    paletteLabel: "Soft workspace neutrals and muted tags",
    colors: ["#F7F6F3", "#FFFFFF", "#2F3437", "#E9E5DF", "#A7C7E7", "#D9BFA9"],
  },
  apple: {
    label: "Apple",
    paletteLabel: "Deep black, premium neutrals, restrained blue",
    colors: ["#050505", "#1D1D1F", "#F5F5F7", "#86868B", "#0071E3", "#D2D2D7"],
  },
  supabase: {
    label: "Supabase",
    paletteLabel: "Developer console graphite with green action",
    colors: ["#0B0F0E", "#1F2937", "#F8FAFC", "#3ECF8E", "#1C8B5F", "#64748B"],
  },
  atlassian: {
    label: "Atlassian",
    paletteLabel: "Enterprise neutrals with accessible blue",
    colors: ["#0C1F3F", "#172B4D", "#FFFFFF", "#0052CC", "#36B37E", "#FFAB00"],
  },
  carbon: {
    label: "Carbon",
    paletteLabel: "Systematic enterprise black, gray, blue",
    colors: ["#161616", "#262626", "#F4F4F4", "#0F62FE", "#42BE65", "#FF832B"],
  },
  minimal: {
    label: "Minimal",
    paletteLabel: "Low-saturation neutrals with one clean accent",
    colors: ["#FAFAF9", "#E7E5E4", "#1C1917", "#78716C", "#0EA5E9", "#A8A29E"],
  },
  industrial: {
    label: "Industrial",
    paletteLabel: "Graphite, warning amber, blueprint cyan",
    colors: ["#050505", "#27272A", "#F5F5F4", "#F59E0B", "#22D3EE", "#EF4444"],
  },
};

export const DEFAULT_DESIGN_GUIDANCE: DevFlowDesignGuidance = {
  theme: "black",
  productFeel: "operational",
  layoutDensity: "balanced",
  accessibilityLevel: "strict",
  forbiddenPatterns: [],
  designSystem: DESIGN_SYSTEM_PRESETS[0],
};

export const DEFAULT_FORBIDDEN_DESIGN_PATTERNS = [
  "lorem ipsum",
  "placeholder UI",
  "generic marketing hero",
  "gradient orb",
];

export function designSystemPresetById(presetId?: string): DevFlowDesignSystem {
  return (
    DESIGN_SYSTEM_PRESETS.find((preset) => preset.presetId === presetId) ??
    DESIGN_SYSTEM_PRESETS[0]
  );
}

export function normalizeDesignSystem(
  designSystem?: Partial<DevFlowDesignSystem> | null,
): DevFlowDesignSystem {
  const base = designSystemPresetById(designSystem?.presetId);
  return {
    ...base,
    ...designSystem,
    presetId: cleanText(designSystem?.presetId) || base.presetId,
    palette: cleanText(designSystem?.palette) || base.palette,
    typography: cleanText(designSystem?.typography) || base.typography,
    spacing: cleanText(designSystem?.spacing) || base.spacing,
    layout: cleanText(designSystem?.layout) || base.layout,
    components: cleanText(designSystem?.components) || base.components,
    motion: cleanText(designSystem?.motion) || base.motion,
    voice: cleanText(designSystem?.voice) || base.voice,
    brand: cleanText(designSystem?.brand) || base.brand,
    antiPatterns: Array.isArray(designSystem?.antiPatterns)
      ? designSystem.antiPatterns.map((pattern) => pattern.trim()).filter(Boolean)
      : [...base.antiPatterns],
  };
}

export function normalizeDesignGuidance(
  guidance?: Partial<DevFlowDesignGuidance> | null,
): DevFlowDesignGuidance {
  const designSystem = normalizeDesignSystem(guidance?.designSystem);
  return {
    ...DEFAULT_DESIGN_GUIDANCE,
    ...guidance,
    forbiddenPatterns: Array.isArray(guidance?.forbiddenPatterns)
      ? guidance.forbiddenPatterns.map((pattern) => pattern.trim()).filter(Boolean)
      : [],
    notes: guidance?.notes?.trim() || undefined,
    designSystem,
  };
}

function storageKey(projectId: string): string {
  return `devflow:design-guidance:${projectId}`;
}

export function loadDesignGuidance(projectId?: string | null): DevFlowDesignGuidance {
  if (!projectId || typeof window === "undefined") return DEFAULT_DESIGN_GUIDANCE;
  const raw = window.localStorage.getItem(storageKey(projectId));
  if (!raw) return DEFAULT_DESIGN_GUIDANCE;
  try {
    return normalizeDesignGuidance(JSON.parse(raw) as Partial<DevFlowDesignGuidance>);
  } catch {
    return DEFAULT_DESIGN_GUIDANCE;
  }
}

export function saveDesignGuidance(
  projectId: string,
  guidance: Partial<DevFlowDesignGuidance>,
): DevFlowDesignGuidance {
  const normalized = normalizeDesignGuidance(guidance);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(projectId), JSON.stringify(normalized));
  }
  return normalized;
}

export function describeDesignGuidance(guidance: DevFlowDesignGuidance): string {
  const normalized = normalizeDesignGuidance(guidance);
  const feel = normalized.productFeel.replace(/^\w/, (char) => char.toUpperCase());
  return `${feel}, ${normalized.theme} theme, ${normalized.layoutDensity} density, ${normalized.accessibilityLevel} accessibility, ${normalized.designSystem?.presetId}`;
}

export function renderDesignMarkdown(guidance: DevFlowDesignGuidance): string {
  const normalized = normalizeDesignGuidance(guidance);
  const designSystem = normalized.designSystem ?? DESIGN_SYSTEM_PRESETS[0];
  const antiPatterns = [
    ...new Set([
      ...designSystem.antiPatterns,
      ...normalized.forbiddenPatterns,
    ].map((pattern) => pattern.trim()).filter(Boolean)),
  ];
  return [
    "# DESIGN.md",
    "",
    `Preset: ${designSystem.presetId}`,
    "",
    "## Color",
    designSystem.palette,
    "",
    "## Typography",
    designSystem.typography,
    "",
    "## Spacing",
    designSystem.spacing,
    "",
    "## Layout",
    designSystem.layout,
    "",
    "## Components",
    designSystem.components,
    "",
    "## Motion",
    designSystem.motion,
    "",
    "## Voice",
    designSystem.voice,
    "",
    "## Brand",
    designSystem.brand,
    "",
    "## Anti-patterns",
    ...antiPatterns.map((pattern) => `- ${pattern}`),
  ].join("\n");
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
