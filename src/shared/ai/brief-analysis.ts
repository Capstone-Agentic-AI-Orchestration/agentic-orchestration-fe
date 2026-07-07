import {
  autoAnalyzeDevFlowBrief,
  type DevFlowAutoAnalyzeResult,
  type DevFlowDesignGuidance,
} from "@/shared/api/devflow-api";

export type BriefAnalysisInput = {
  companyName: string;
  brief: string;
  stackKey: string;
  designGuidance?: DevFlowDesignGuidance;
};

type BriefAnalysisCacheEntry =
  | { expiresAt: number; result: DevFlowAutoAnalyzeResult }
  | { expiresAt: number; pending: Promise<DevFlowAutoAnalyzeResult> };

const CACHE_TTL_MS = 5 * 60 * 1000;
const PENDING_TTL_MS = 30 * 1000;

const analysisCache = new Map<string, BriefAnalysisCacheEntry>();

export function requestFastBriefAnalysis(input: BriefAnalysisInput): Promise<DevFlowAutoAnalyzeResult> {
  const key = briefAnalysisCacheKey(input);
  const now = Date.now();
  const cached = analysisCache.get(key);

  if (cached && cached.expiresAt > now) {
    return "result" in cached ? Promise.resolve(cached.result) : cached.pending;
  }

  if (cached) {
    analysisCache.delete(key);
  }

  const pending = autoAnalyzeDevFlowBrief({
    ...input,
    companyName: input.companyName.trim() || "Unknown company",
    brief: input.brief.trim(),
    stackKey: input.stackKey || "nextjs-nestjs-supabase",
    mode: "fast",
  })
    .then((result) => {
      analysisCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, result });
      return result;
    })
    .catch((error) => {
      analysisCache.delete(key);
      throw error;
    });

  analysisCache.set(key, { expiresAt: now + PENDING_TTL_MS, pending });
  return pending;
}

export function resetBriefAnalysisCacheForTests(): void {
  analysisCache.clear();
}

function briefAnalysisCacheKey(input: BriefAnalysisInput): string {
  return JSON.stringify({
    companyName: normalizeKey(input.companyName || "Unknown company"),
    brief: normalizeKey(input.brief),
    stackKey: normalizeKey(input.stackKey || "nextjs-nestjs-supabase"),
    designGuidance: {
      theme: input.designGuidance?.theme,
      productFeel: input.designGuidance?.productFeel,
      layoutDensity: input.designGuidance?.layoutDensity,
      accessibilityLevel: input.designGuidance?.accessibilityLevel,
      forbiddenPatterns: [...(input.designGuidance?.forbiddenPatterns ?? [])].sort(),
      presetId: input.designGuidance?.designSystem?.presetId,
      antiPatterns: [...(input.designGuidance?.designSystem?.antiPatterns ?? [])].sort(),
      notes: normalizeKey(input.designGuidance?.notes ?? ""),
    },
  });
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
