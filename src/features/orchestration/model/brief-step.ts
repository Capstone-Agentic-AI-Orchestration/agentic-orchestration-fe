import type {
  DevFlowAutoAnalyzeResult,
  DevFlowDesignGuidance,
} from "@/shared/api/devflow-api";

export interface BriefStackOption {
  value: string;
  label: string;
}

export interface BriefAnalyzeInput {
  companyName: string;
  brief: string;
  stackKey: string;
  designGuidance: DevFlowDesignGuidance;
}

export interface BriefStepState {
  canSave: boolean;
  canAnalyze: boolean;
  showAnalyzeSkeleton: boolean;
  analyzeButtonMarginTop: string;
}

export const BRIEF_STACK_OPTIONS: BriefStackOption[] = [
  { value: "nextjs-nestjs-supabase", label: "Next.js + NestJS + Supabase" },
  { value: "nextjs-nestjs-postgres", label: "Next.js + NestJS + PostgreSQL" },
  { value: "react-express-mongo", label: "React + Express + MongoDB" },
  { value: "nextjs-supabase", label: "Next.js + Supabase (serverless)" },
  { value: "react-native-nestjs", label: "React Native + NestJS" },
];

export const DEFAULT_BRIEF_STACK_KEY = "nextjs-nestjs-supabase";

export function buildBriefStepState(input: {
  companyName: string;
  brief: string;
  analyzing: boolean;
  analyzeResult: DevFlowAutoAnalyzeResult | null;
}): BriefStepState {
  return {
    canSave: input.companyName.trim().length > 0 && input.brief.trim().length >= 10,
    canAnalyze: input.brief.trim().length >= 3,
    showAnalyzeSkeleton: input.analyzing && !input.analyzeResult,
    analyzeButtonMarginTop: input.analyzeResult || input.analyzing ? "14px" : "0",
  };
}

export function buildBriefAnalyzeInput(input: {
  companyName: string;
  brief: string;
  stackKey: string;
  designGuidance: DevFlowDesignGuidance;
}): BriefAnalyzeInput {
  return {
    companyName: input.companyName.trim() || "Unknown company",
    brief: input.brief.trim(),
    stackKey: input.stackKey,
    designGuidance: input.designGuidance,
  };
}

export function normalizeBriefAnalyzeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const details = typeof error === "object" && error !== null && "details" in error
    ? String((error as { details?: unknown }).details ?? "")
    : "";
  const combined = `${message} ${details}`;
  return combined.includes("API key") || combined.includes("not configured") || combined.includes("not available")
    ? "Auto-analyze requires an LLM API key. Ask an admin to configure a provider (Admin &gt; Providers) with an API key, then try again."
    : message;
}
