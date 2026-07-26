import type {
  DevFlowGatewayModel,
  DevFlowGatewayModelCatalog,
  DevFlowOrchestrationModelSelection,
  DevFlowOrchestrationModelTarget,
} from "@/shared/api/devflow-api";

export const ORCHESTRATION_MODEL_TARGETS: ReadonlyArray<{
  id: DevFlowOrchestrationModelTarget;
  label: string;
  description: string;
}> = [
  { id: "requirements", label: "Requirements", description: "Turns the brief into a build plan." },
  { id: "contract", label: "Contract", description: "Aligns frontend, backend, and data boundaries." },
  { id: "frontend", label: "Frontend", description: "Builds the interface and interactions." },
  { id: "backend", label: "Backend", description: "Builds APIs and server behavior." },
  { id: "database", label: "Database", description: "Designs schema and data access." },
  { id: "architecture", label: "Architecture", description: "Reviews system structure and tradeoffs." },
  { id: "mobile", label: "Mobile", description: "Joins only when the project has a mobile repository." },
  { id: "critique", label: "Review", description: "Checks the combined result before delivery." },
];

export function reconcileModelSelection(
  selection: DevFlowOrchestrationModelSelection | null | undefined,
  catalog: DevFlowGatewayModelCatalog,
): DevFlowOrchestrationModelSelection {
  const available = new Set(catalog.models.map((model) => model.id));
  const defaultModel = selection?.defaultModel && available.has(selection.defaultModel)
    ? selection.defaultModel
    : catalog.defaultModel;
  const overrides: Partial<Record<DevFlowOrchestrationModelTarget, string>> = {};

  for (const target of ORCHESTRATION_MODEL_TARGETS) {
    const model = selection?.overrides?.[target.id];
    if (model && model !== defaultModel && available.has(model)) {
      overrides[target.id] = model;
    }
  }

  return Object.keys(overrides).length > 0
    ? { defaultModel, overrides }
    : { defaultModel };
}

export function resolveInitialModelSelection(
  stored: DevFlowOrchestrationModelSelection | null | undefined,
  defaults: DevFlowOrchestrationModelSelection | null | undefined,
  catalog: DevFlowGatewayModelCatalog,
): DevFlowOrchestrationModelSelection {
  return reconcileModelSelection(stored ?? defaults, catalog);
}

export function changeDefaultModel(
  selection: DevFlowOrchestrationModelSelection | null,
  model: string,
  catalog: DevFlowGatewayModelCatalog | null,
): DevFlowOrchestrationModelSelection {
  return reconcileModelSelection(
    selection ? { ...selection, defaultModel: model } : { defaultModel: model },
    catalog ?? {
      models: [],
      defaultModel: model,
      source: "fallback",
      fetchedAt: "",
      warning: null,
    },
  );
}

export function changeModelOverride(
  selection: DevFlowOrchestrationModelSelection | null,
  target: DevFlowOrchestrationModelTarget,
  model: string,
): DevFlowOrchestrationModelSelection | null {
  if (!selection) return selection;
  const overrides = { ...(selection.overrides ?? {}) };
  if (!model || model === selection.defaultModel) delete overrides[target];
  else overrides[target] = model;
  return Object.keys(overrides).length > 0
    ? { ...selection, overrides }
    : { defaultModel: selection.defaultModel };
}

export function parseStoredModelSelection(
  raw: string | null,
): DevFlowOrchestrationModelSelection | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.defaultModel !== "string") return null;
    const overrides = candidate.overrides;
    return {
      defaultModel: candidate.defaultModel,
      ...(overrides && typeof overrides === "object" && !Array.isArray(overrides)
        ? { overrides: overrides as Partial<Record<DevFlowOrchestrationModelTarget, string>> }
        : {}),
    };
  } catch {
    return null;
  }
}

export function modelSelectionStorageKey(projectId: string): string {
  return `devflow:model-selection:${projectId}`;
}

export function filterGatewayModels(
  models: DevFlowGatewayModel[],
  query: string,
  freeOnly: boolean,
): DevFlowGatewayModel[] {
  const normalizedQuery = query.trim().toLowerCase();
  return models.filter((model) => {
    if (freeOnly && !model.free) return false;
    if (!normalizedQuery) return true;
    return [model.id, model.name, model.provider]
      .some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

export function modelPriceLabel(model: DevFlowGatewayModel): string {
  if (model.free) return "Free";
  const input = perMillion(model.pricing.input);
  const output = perMillion(model.pricing.output);
  if (input === null || output === null) return "Pricing varies";
  return `$${input.toFixed(input < 1 ? 2 : 1)} in / $${output.toFixed(output < 1 ? 2 : 1)} out per 1M`;
}

function perMillion(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed * 1_000_000 : null;
}
