import type {
  DevFlowGatewayModel,
  DevFlowGatewayModelCatalog,
} from "@/shared/api/devflow-api";
import {
  changeDefaultModel,
  changeModelOverride,
  filterGatewayModels,
  modelPriceLabel,
  parseStoredModelSelection,
  reconcileModelSelection,
  resolveInitialModelSelection,
} from "./orchestration-model-selection";

const models: DevFlowGatewayModel[] = [
  {
    id: "free/fast",
    name: "Fast",
    provider: "free",
    description: "",
    contextWindow: 64_000,
    maxTokens: null,
    pricing: { input: "0", output: "0" },
    free: true,
  },
  {
    id: "paid/strong",
    name: "Strong",
    provider: "paid",
    description: "",
    contextWindow: 128_000,
    maxTokens: 16_000,
    pricing: { input: "0.000001", output: "0.000002" },
    free: false,
  },
];

const catalog: DevFlowGatewayModelCatalog = {
  models,
  defaultModel: "free/fast",
  source: "live",
  fetchedAt: "2026-07-26T00:00:00.000Z",
  warning: null,
};

describe("orchestration model selection", () => {
  it("keeps valid choices and removes stale or redundant overrides", () => {
    expect(reconcileModelSelection({
      defaultModel: "free/fast",
      overrides: {
        backend: "paid/strong",
        frontend: "free/fast",
        database: "removed/model",
      },
    }, catalog)).toEqual({
      defaultModel: "free/fast",
      overrides: { backend: "paid/strong" },
    });
  });

  it("falls back to the current catalog default when a saved model disappeared", () => {
    expect(reconcileModelSelection({
      defaultModel: "removed/model",
    }, catalog)).toEqual({ defaultModel: "free/fast" });
  });

  it("prefers a project choice over personal defaults and otherwise inherits the defaults", () => {
    const defaults = {
      defaultModel: "free/fast",
      overrides: { backend: "paid/strong" as const },
    };

    expect(resolveInitialModelSelection(
      { defaultModel: "paid/strong" },
      defaults,
      catalog,
    )).toEqual({ defaultModel: "paid/strong" });
    expect(resolveInitialModelSelection(null, defaults, catalog)).toEqual(defaults);
  });

  it("updates the default and specialist overrides without keeping redundant choices", () => {
    const changed = changeDefaultModel({ defaultModel: "free/fast" }, "paid/strong", catalog);
    expect(changed).toEqual({ defaultModel: "paid/strong" });
    expect(changeModelOverride(changed, "backend", "free/fast")).toEqual({
      defaultModel: "paid/strong",
      overrides: { backend: "free/fast" },
    });
    expect(changeModelOverride(changed, "backend", "paid/strong")).toEqual(changed);
  });

  it("filters by provider and free status", () => {
    expect(filterGatewayModels(models, "paid", false).map((model) => model.id))
      .toEqual(["paid/strong"]);
    expect(filterGatewayModels(models, "", true).map((model) => model.id))
      .toEqual(["free/fast"]);
  });

  it("formats per-token Gateway prices as per-million prices", () => {
    expect(modelPriceLabel(models[0])).toBe("Free");
    expect(modelPriceLabel(models[1])).toBe("$1.0 in / $2.0 out per 1M");
  });

  it("ignores invalid saved JSON", () => {
    expect(parseStoredModelSelection("{bad")).toBeNull();
    expect(parseStoredModelSelection(JSON.stringify({ defaultModel: "free/fast" })))
      .toEqual({ defaultModel: "free/fast" });
  });
});
