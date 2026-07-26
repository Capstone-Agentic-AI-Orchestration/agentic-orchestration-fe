"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Button, Field, Input, Modal, Select } from "@/shared/components/ui";
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconCpu,
  IconRocket,
  IconShield,
} from "@/shared/components/icons";
import type { DevFlowOrchestrationRunControls } from "@/shared/api/devflow-api";
import type { OrchestrationModelSelectionController } from "@/shared/hooks/use-orchestration-model-selection";
import {
  controlsForPreset,
  estimateOrchestrationCost,
  formatCostEstimate,
  formatTokenBudget,
  ORCHESTRATION_PRESETS,
  presetForControls,
} from "@/shared/models/orchestration-preflight";
import { ModelSelectionPanel } from "./model-selection-panel";

interface RequiredRunControls {
  tokenBudget: number;
  maxRetries: number;
}

export function OrchestrationPreflight({
  open,
  projectName,
  controller,
  blockers,
  providerReason,
  activeRunId,
  starting,
  initialTokenBudget = 200_000,
  initialMaxRetries = 2,
  onOpen,
  onClose,
  onLaunch,
}: {
  open: boolean;
  projectName: string;
  controller: OrchestrationModelSelectionController;
  blockers: string[];
  providerReason?: string | null;
  activeRunId?: string | null;
  starting: boolean;
  initialTokenBudget?: number;
  initialMaxRetries?: number;
  onOpen: () => void;
  onClose: () => void;
  onLaunch: (controls: DevFlowOrchestrationRunControls) => Promise<void>;
}) {
  const [controls, setControls] = useState<RequiredRunControls>({
    tokenBudget: validTokenBudget(initialTokenBudget) ? initialTokenBudget : 200_000,
    maxRetries: validRetryCount(initialMaxRetries) ? initialMaxRetries : 2,
  });
  const activePreset = presetForControls(controls);
  const estimate = useMemo(
    () => estimateOrchestrationCost(
      controller.selection,
      controller.catalog,
      controls.tokenBudget,
    ),
    [controller.catalog, controller.selection, controls.tokenBudget],
  );
  const overrides = Object.keys(controller.selection?.overrides ?? {}).length;
  const tokenBudgetError = controls.tokenBudget < 25_000 || controls.tokenBudget > 1_000_000
    ? "Set a token budget between 25,000 and 1,000,000."
    : "";
  const retryError = controls.maxRetries < 0 || controls.maxRetries > 5
    ? "Choose between zero and five automatic retries."
    : "";
  const validationError = tokenBudgetError || retryError;
  const launchBlocker = (activeRunId ? "This project already has an active orchestration run." : "")
    || blockers[0]
    || providerReason
    || validationError
    || (controller.loading ? "Wait for the model list to finish loading." : "")
    || (!controller.selection ? controller.error || "Choose an agent model before launching." : "");

  const selectPreset = (presetId: "fast" | "balanced" | "deep") => {
    const next = controlsForPreset(presetId);
    setControls({
      tokenBudget: next.tokenBudget ?? 200_000,
      maxRetries: next.maxRetries ?? 2,
    });
  };

  return (
    <>
      <section className="orchestration-preflight-entry" aria-labelledby="orchestration-preflight-entry-title">
        <div className="orchestration-preflight-entry__mark" aria-hidden="true">
          <IconRocket size={18} />
        </div>
        <div className="orchestration-preflight-entry__copy">
          <span>Launch control</span>
          <h3 id="orchestration-preflight-entry-title">Review the run before agents begin</h3>
          <p>
            Confirm the model assignments, spending ceiling, and recovery policy for this project.
          </p>
        </div>
        <div className="orchestration-preflight-entry__facts">
          <PreflightFact
            label="Model"
            value={controller.selection?.defaultModel ?? "Loading"}
          />
          <PreflightFact
            label="Budget"
            value={`${formatTokenBudget(controls.tokenBudget)} tokens`}
          />
          <PreflightFact
            label="Estimated ceiling"
            value={formatCostEstimate(estimate.amount)}
          />
        </div>
        <Button
          variant="primary"
          icon={<IconRocket size={14} />}
          onClick={onOpen}
          disabled={starting || Boolean(activeRunId)}
        >
          {activeRunId ? "Run in progress" : "Review and launch"}
        </Button>
      </section>

      <Modal
        open={open}
        onClose={() => !starting && onClose()}
        title="Review orchestration launch"
        width={980}
        bodyStyle={{ padding: 0 }}
        footerStyle={{ justifyContent: "space-between", alignItems: "center" }}
        footer={(
          <>
            <div className="orchestration-preflight__footer-status" aria-live="polite">
              {launchBlocker ? (
                <><IconAlertTriangle size={13} /> {launchBlocker}</>
              ) : (
                <><IconCheckCircle size={13} /> Ready to launch {projectName}</>
              )}
            </div>
            <div className="orchestration-preflight__footer-actions">
              <Button variant="ghost" onClick={onClose} disabled={starting}>Cancel</Button>
              <Button
                variant="primary"
                icon={<IconRocket size={14} />}
                disabled={Boolean(launchBlocker) || starting}
                onClick={() => void onLaunch(controls)}
              >
                {starting ? "Starting agents…" : "Launch orchestration"}
              </Button>
            </div>
          </>
        )}
      >
        <div className="orchestration-preflight">
          <header className="orchestration-preflight__intro">
            <span>Final review</span>
            <h2>Know what will run—and its limit—before you approve it.</h2>
            <p>
              The model assignment is locked when the run starts. The token ceiling is enforced
              by the run supervisor, which escalates the run when that ceiling is reached.
            </p>
          </header>

          {blockers.length > 0 || providerReason ? (
            <div className="orchestration-preflight__blockers" role="alert">
              <IconAlertTriangle size={16} />
              <div>
                <strong>Resolve before launch</strong>
                {[...blockers, ...(providerReason ? [providerReason] : [])].map((blocker) => (
                  <span key={blocker}>{blocker}</span>
                ))}
              </div>
            </div>
          ) : null}

          <section className="orchestration-preflight__section" aria-labelledby="run-depth-title">
            <div className="orchestration-preflight__section-heading">
              <div>
                <span>01 / Run depth</span>
                <h3 id="run-depth-title">Choose how much room the agents have</h3>
              </div>
              <span className="orchestration-preflight__selection-label">
                {activePreset === "custom" ? "Custom" : ORCHESTRATION_PRESETS.find((preset) => preset.id === activePreset)?.label}
              </span>
            </div>

            <div className="orchestration-preflight__presets">
              {ORCHESTRATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="orchestration-preflight__preset"
                  data-selected={activePreset === preset.id}
                  aria-pressed={activePreset === preset.id}
                  onClick={() => selectPreset(preset.id)}
                  disabled={starting}
                >
                  <span>{preset.label}</span>
                  <strong>{formatTokenBudget(preset.tokenBudget)} tokens</strong>
                  <p>{preset.description}</p>
                  <small>{preset.maxRetries} automatic {preset.maxRetries === 1 ? "retry" : "retries"}</small>
                </button>
              ))}
            </div>

            <div className="orchestration-preflight__controls">
              <Field
                label="Maximum token budget"
                helper="A hard ceiling across all agent calls in this run."
                error={tokenBudgetError || undefined}
              >
                <Input
                  type="number"
                  min={25_000}
                  max={1_000_000}
                  step={10_000}
                  value={controls.tokenBudget}
                  disabled={starting}
                  onChange={(event) => setControls((current) => ({
                    ...current,
                    tokenBudget: Number(event.target.value),
                  }))}
                />
              </Field>
              <Field
                label="Automatic recovery attempts"
                helper="How many times DevFlow may retry a stuck run before asking for help."
              >
                <Select
                  value={controls.maxRetries}
                  disabled={starting}
                  onChange={(event) => setControls((current) => ({
                    ...current,
                    maxRetries: Number(event.target.value),
                  }))}
                >
                  {[0, 1, 2, 3, 4, 5].map((count) => (
                    <option key={count} value={count}>
                      {count === 0 ? "Do not retry automatically" : `${count} ${count === 1 ? "retry" : "retries"}`}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </section>

          <section className="orchestration-preflight__section" aria-labelledby="agent-assignment-title">
            <div className="orchestration-preflight__section-heading">
              <div>
                <span>02 / Agent assignment</span>
                <h3 id="agent-assignment-title">Confirm which models will do the work</h3>
              </div>
              <span className="orchestration-preflight__selection-label">
                {overrides === 0 ? "One model" : `${overrides} specialist ${overrides === 1 ? "override" : "overrides"}`}
              </span>
            </div>
            <ModelSelectionPanel controller={controller} disabled={starting} />
          </section>

          <section className="orchestration-preflight__review" aria-labelledby="launch-summary-title">
            <div>
              <span>03 / Launch summary</span>
              <h3 id="launch-summary-title">{projectName}</h3>
              <p>The estimate is an upper-bound guide using a 70/30 input-to-output token mix.</p>
            </div>
            <div className="orchestration-preflight__review-grid">
              <ReviewStat icon={<IconCpu size={15} />} label="Default model" value={controller.selection?.defaultModel ?? "Not selected"} />
              <ReviewStat icon={<IconShield size={15} />} label="Hard token ceiling" value={formatTokenBudget(controls.tokenBudget)} />
              <ReviewStat icon={<IconRocket size={15} />} label="Estimated ceiling" value={formatCostEstimate(estimate.amount)} />
              <ReviewStat icon={<IconCheckCircle size={15} />} label="Recovery policy" value={`${controls.maxRetries} automatic ${controls.maxRetries === 1 ? "retry" : "retries"}`} />
            </div>
            {estimate.pricedModels < estimate.totalModels ? (
              <p className="orchestration-preflight__pricing-note">
                Pricing is available for {estimate.pricedModels} of {estimate.totalModels} agent assignments.
                The final provider charge may differ.
              </p>
            ) : null}
          </section>
        </div>
      </Modal>
    </>
  );
}

function PreflightFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong title={value}>{value}</strong>
    </div>
  );
}

function ReviewStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <span>{icon}{label}</span>
      <strong title={value}>{value}</strong>
    </div>
  );
}

function validTokenBudget(value: number): boolean {
  return Number.isInteger(value) && value >= 25_000 && value <= 1_000_000;
}

function validRetryCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 5;
}
