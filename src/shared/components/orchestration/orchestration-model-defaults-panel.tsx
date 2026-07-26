"use client";

import { Button } from "@/shared/components/ui";
import { IconCheckCircle, IconRefresh } from "@/shared/components/icons";
import { useOrchestrationModelDefaults } from "@/shared/hooks/use-orchestration-model-defaults";
import { ModelSelectionPanel } from "./model-selection-panel";

export function OrchestrationModelDefaultsPanel() {
  const controller = useOrchestrationModelDefaults();

  return (
    <div className="orchestration-model-defaults">
      <ModelSelectionPanel
        controller={controller}
        disabled={controller.saving}
        scope="defaults"
      />

      {controller.warning ? (
        <div className="orchestration-model-defaults__notice" role="status">
          {controller.warning}
        </div>
      ) : null}
      {controller.saveError ? (
        <div className="orchestration-model-defaults__error" role="alert">
          Could not save agent model defaults. {controller.saveError}
        </div>
      ) : null}
      {controller.saved ? (
        <div className="orchestration-model-defaults__saved" role="status">
          <IconCheckCircle size={14} />
          Model defaults saved. New runs will use this configuration unless you override it.
        </div>
      ) : null}

      <div className="orchestration-model-defaults__actions">
        <div>
          <strong>Applies to new runs</strong>
          <span>
            {controller.updatedAt
              ? `Last saved ${new Date(controller.updatedAt).toLocaleString()}`
              : "Using the current Gateway recommendation until you save."}
          </span>
        </div>
        <div className="orchestration-model-defaults__buttons">
          <Button
            variant="secondary"
            icon={<IconRefresh size={13} />}
            onClick={controller.restoreRecommended}
            disabled={controller.loading || controller.saving || !controller.catalog}
          >
            Restore recommended
          </Button>
          <Button
            variant="primary"
            icon={<IconCheckCircle size={14} />}
            onClick={() => void controller.save()}
            disabled={controller.loading || controller.saving || !controller.selection}
          >
            {controller.saving ? "Saving defaults…" : "Save model defaults"}
          </Button>
        </div>
      </div>
    </div>
  );
}
