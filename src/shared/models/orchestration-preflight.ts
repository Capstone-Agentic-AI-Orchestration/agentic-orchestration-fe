import type {
  DevFlowGatewayModel,
  DevFlowGatewayModelCatalog,
  DevFlowOrchestrationModelSelection,
  DevFlowOrchestrationModelTarget,
  DevFlowOrchestrationRunControls,
} from "@/shared/api/devflow-api";
import { ORCHESTRATION_MODEL_TARGETS } from "@/shared/models/orchestration-model-selection";

export type OrchestrationPresetId = "fast" | "balanced" | "deep" | "custom";

export interface OrchestrationPreset {
  id: Exclude<OrchestrationPresetId, "custom">;
  label: string;
  description: string;
  tokenBudget: number;
  maxRetries: number;
}

export const ORCHESTRATION_PRESETS: readonly OrchestrationPreset[] = [
  {
    id: "fast",
    label: "Fast",
    description: "A focused pass for small, well-defined changes.",
    tokenBudget: 80_000,
    maxRetries: 1,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Recommended for most product work.",
    tokenBudget: 200_000,
    maxRetries: 2,
  },
  {
    id: "deep",
    label: "Deep review",
    description: "More room for complex builds and cross-agent review.",
    tokenBudget: 350_000,
    maxRetries: 2,
  },
] as const;

export interface OrchestrationCostEstimate {
  amount: number | null;
  pricedModels: number;
  totalModels: number;
}

export function controlsForPreset(
  presetId: Exclude<OrchestrationPresetId, "custom">,
): DevFlowOrchestrationRunControls {
  const preset = ORCHESTRATION_PRESETS.find((candidate) => candidate.id === presetId)
    ?? ORCHESTRATION_PRESETS[1];
  return {
    tokenBudget: preset.tokenBudget,
    maxRetries: preset.maxRetries,
  };
}

export function presetForControls(
  controls: DevFlowOrchestrationRunControls,
): OrchestrationPresetId {
  return ORCHESTRATION_PRESETS.find(
    (preset) =>
      preset.tokenBudget === controls.tokenBudget
      && preset.maxRetries === controls.maxRetries,
  )?.id ?? "custom";
}

export function estimateOrchestrationCost(
  selection: DevFlowOrchestrationModelSelection | null,
  catalog: DevFlowGatewayModelCatalog | null,
  tokenBudget: number,
): OrchestrationCostEstimate {
  if (!selection || !catalog || tokenBudget <= 0) {
    return { amount: null, pricedModels: 0, totalModels: 0 };
  }

  const modelsById = new Map(catalog.models.map((model) => [model.id, model]));
  const effectiveModels = ORCHESTRATION_MODEL_TARGETS.map((target) =>
    modelsById.get(modelForTarget(selection, target.id)),
  );
  const priced = effectiveModels
    .map(weightedPricePerToken)
    .filter((price): price is number => price !== null);

  if (priced.length === 0) {
    return {
      amount: null,
      pricedModels: 0,
      totalModels: effectiveModels.length,
    };
  }

  const maximumPricePerToken = Math.max(...priced);
  return {
    amount: maximumPricePerToken * tokenBudget,
    pricedModels: priced.length,
    totalModels: effectiveModels.length,
  };
}

export function formatTokenBudget(tokenBudget: number): string {
  if (tokenBudget >= 1_000_000) {
    return `${(tokenBudget / 1_000_000).toFixed(tokenBudget % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  return `${Math.round(tokenBudget / 1_000)}k`;
}

export function formatCostEstimate(amount: number | null): string {
  if (amount === null) return "Pricing unavailable";
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return "<$0.01";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: amount >= 100 ? 0 : 2,
  }).format(amount);
}

function modelForTarget(
  selection: DevFlowOrchestrationModelSelection,
  target: DevFlowOrchestrationModelTarget,
): string {
  return selection.overrides?.[target] ?? selection.defaultModel;
}

function weightedPricePerToken(model: DevFlowGatewayModel | undefined): number | null {
  if (!model) return null;
  if (model.free) return 0;
  const input = parsePrice(model.pricing.input);
  const output = parsePrice(model.pricing.output);
  if (input === null || output === null) return null;

  // Budget counts input and output tokens together. The estimate uses a disclosed
  // 70/30 input/output mix. The caller uses the most expensive assigned model so
  // the result stays conservative even when agents receive different models.
  return input * 0.7 + output * 0.3;
}

function parsePrice(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
