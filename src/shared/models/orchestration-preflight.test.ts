import type {
  DevFlowGatewayModelCatalog,
  DevFlowOrchestrationModelSelection,
} from "@/shared/api/devflow-api";
import {
  controlsForPreset,
  estimateOrchestrationCost,
  formatCostEstimate,
  formatTokenBudget,
  presetForControls,
} from "./orchestration-preflight";

const catalog: DevFlowGatewayModelCatalog = {
  defaultModel: "provider/standard",
  source: "live",
  fetchedAt: "2026-07-27T00:00:00.000Z",
  warning: null,
  models: [
    {
      id: "provider/standard",
      name: "Standard",
      provider: "Provider",
      description: "",
      contextWindow: 128_000,
      maxTokens: 16_000,
      pricing: { input: "0.000001", output: "0.000003" },
      free: false,
    },
    {
      id: "provider/free",
      name: "Free",
      provider: "Provider",
      description: "",
      contextWindow: 64_000,
      maxTokens: 8_000,
      pricing: { input: null, output: null },
      free: true,
    },
  ],
};

describe("orchestration preflight model", () => {
  it("resolves preset controls and detects custom changes", () => {
    expect(controlsForPreset("fast")).toEqual({ tokenBudget: 80_000, maxRetries: 1 });
    expect(presetForControls({ tokenBudget: 200_000, maxRetries: 2 })).toBe("balanced");
    expect(presetForControls({ tokenBudget: 210_000, maxRetries: 2 })).toBe("custom");
  });

  it("estimates the budget ceiling from gateway prices", () => {
    const selection: DevFlowOrchestrationModelSelection = {
      defaultModel: "provider/standard",
    };
    const estimate = estimateOrchestrationCost(selection, catalog, 200_000);

    expect(estimate.pricedModels).toBe(10);
    expect(estimate.totalModels).toBe(10);
    expect(estimate.amount).toBeCloseTo(0.32, 6);
    expect(formatCostEstimate(estimate.amount)).toBe("$0.32");
  });

  it("keeps a conservative ceiling when one specialist uses a free model", () => {
    const estimate = estimateOrchestrationCost(
      {
        defaultModel: "provider/standard",
        overrides: { frontend: "provider/free" },
      },
      catalog,
      200_000,
    );

    expect(estimate.amount).toBeCloseTo(0.32, 6);
  });

  it("returns a zero ceiling when every assignment uses a free model", () => {
    const estimate = estimateOrchestrationCost(
      { defaultModel: "provider/free" },
      catalog,
      200_000,
    );

    expect(estimate.amount).toBe(0);
  });

  it("formats token budgets and unavailable pricing", () => {
    expect(formatTokenBudget(80_000)).toBe("80k");
    expect(formatTokenBudget(1_000_000)).toBe("1M");
    expect(formatCostEstimate(null)).toBe("Pricing unavailable");
  });
});
