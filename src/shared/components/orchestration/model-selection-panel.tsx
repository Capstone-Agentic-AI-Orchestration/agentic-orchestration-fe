"use client";

import { useMemo, useState } from "react";
import { Button, Field, Input, Select } from "@/shared/components/ui";
import { IconCpu, IconRefresh, IconSettings } from "@/shared/components/icons";
import type { DevFlowGatewayModel } from "@/shared/api/devflow-api";
import type { OrchestrationModelSelectionController } from "@/shared/hooks/use-orchestration-model-selection";
import {
  filterGatewayModels,
  modelPriceLabel,
  ORCHESTRATION_MODEL_TARGETS,
} from "@/shared/models/orchestration-model-selection";

export function ModelSelectionPanel({
  controller,
  disabled = false,
  scope = "run",
}: {
  controller: OrchestrationModelSelectionController;
  disabled?: boolean;
  scope?: "run" | "defaults";
}) {
  const [query, setQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const filteredModels = useMemo(
    () => filterGatewayModels(controller.catalog?.models ?? [], query, freeOnly),
    [controller.catalog?.models, freeOnly, query],
  );
  const selection = controller.selection;
  const selectedModelIds = new Set([
    selection?.defaultModel,
    ...Object.values(selection?.overrides ?? {}),
  ].filter((model): model is string => Boolean(model)));
  const selectedModels = controller.catalog?.models.filter(
    (model) => selectedModelIds.has(model.id),
  ) ?? [];
  const selectedModel = selectedModels.find((model) => model.id === selection?.defaultModel);
  const modelOptions = withSelectedModels(filteredModels, selectedModels);

  return (
    <section className="orchestration-model-picker" aria-labelledby="orchestration-model-picker-title">
      <div className="orchestration-model-picker__header">
        <div>
          <span className="orchestration-model-picker__kicker"><IconCpu size={13} /> AI Gateway</span>
          <h3 id="orchestration-model-picker-title">
            {scope === "defaults" ? "Set the default models for your agents" : "Choose how the agents think"}
          </h3>
          <p>
            {scope === "defaults"
              ? "New orchestration runs will start with these choices. You can still override them before an individual run begins."
              : "Pick one model for the whole run, or give individual specialists their own model. Your choice is locked when the run starts."}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<IconRefresh size={12} />}
          onClick={() => void controller.refresh()}
          disabled={controller.loading || disabled}
        >
          Refresh models
        </Button>
      </div>

      {controller.catalog?.warning ? (
        <div className="orchestration-model-picker__notice" role="status">
          {controller.catalog.warning}
        </div>
      ) : null}
      {controller.error ? (
        <div className="orchestration-model-picker__error" role="alert">
          Could not load the agent model configuration. {controller.error}
        </div>
      ) : null}

      <div className="orchestration-model-picker__tools">
        <Field label="Find a model" helper={`${controller.catalog?.models.length ?? 0} text models available`}>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by model or provider"
            disabled={controller.loading || disabled}
          />
        </Field>
        <label className="orchestration-model-picker__check">
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(event) => setFreeOnly(event.target.checked)}
            disabled={controller.loading || disabled}
          />
          Show free models only
        </label>
      </div>

      <Field
        label="Model for all agents"
        helper={selectedModel ? modelSummary(selectedModel) : "Loading the current Gateway catalog…"}
        error={!controller.loading && !controller.selection
          ? scope === "defaults"
            ? "Choose a default model before saving."
            : "Choose a model before starting the run."
          : undefined}
      >
        <Select
          value={controller.selection?.defaultModel ?? ""}
          onChange={(event) => controller.setDefaultModel(event.target.value)}
          disabled={controller.loading || disabled || modelOptions.length === 0}
        >
          {!selection ? <option value="">Loading models…</option> : null}
          {modelOptions.map((model) => (
            <option key={model.id} value={model.id}>
              {model.free ? "FREE · " : ""}{model.name} · {model.provider}
            </option>
          ))}
        </Select>
      </Field>

      <div className="orchestration-model-picker__mode">
        <div>
          <strong>Specialist models</strong>
          <span>Optional. Override only the agents that need a different model.</span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<IconSettings size={12} />}
          aria-pressed={controller.advanced}
          onClick={() => controller.setAdvanced(!controller.advanced)}
          disabled={controller.loading || disabled || !selection}
        >
          {controller.advanced ? "Use one model" : "Customize agents"}
        </Button>
      </div>

      {controller.advanced && selection ? (
        <div className="orchestration-model-picker__agents">
          {ORCHESTRATION_MODEL_TARGETS.map((target) => (
            <Field key={target.id} label={target.label} helper={target.description}>
              <Select
                value={selection.overrides?.[target.id] ?? selection.defaultModel}
                onChange={(event) => controller.setOverride(target.id, event.target.value)}
                disabled={disabled}
              >
                {modelOptions.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.id === selection.defaultModel ? "Default · " : ""}
                    {model.free ? "FREE · " : ""}{model.name}
                  </option>
                ))}
              </Select>
            </Field>
          ))}
        </div>
      ) : null}

      <div className="orchestration-model-picker__footnote">
        {scope === "defaults"
          ? "Prices come from Vercel AI Gateway and can change. Only model IDs are saved to your DevFlow profile; provider credentials remain on the server."
          : "Prices come from Vercel AI Gateway and can change. Provider credentials stay on the server; the browser stores only your model IDs for this project."}
      </div>
    </section>
  );
}

function withSelectedModels(
  models: DevFlowGatewayModel[],
  selected: DevFlowGatewayModel[],
): DevFlowGatewayModel[] {
  const visible = new Set(models.map((model) => model.id));
  const missing = selected.filter((model) => !visible.has(model.id));
  return [...missing, ...models];
}

function modelSummary(model: DevFlowGatewayModel): string {
  const context = model.contextWindow
    ? `${Math.round(model.contextWindow / 1_000)}k context`
    : "Context varies";
  return `${modelPriceLabel(model)} · ${context} · ${model.id}`;
}
