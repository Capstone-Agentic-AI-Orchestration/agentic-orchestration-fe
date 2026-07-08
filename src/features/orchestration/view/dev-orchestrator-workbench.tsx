"use client";

import { useDevOrchestratorViewModel } from "../view-model/use-dev-orchestrator-view-model";
import { DevOrchestratorWorkbenchView } from "./dev-orchestrator-workbench-view";

export function DevOrchestratorWorkbench() {
  const viewModel = useDevOrchestratorViewModel();
  return <DevOrchestratorWorkbenchView vm={viewModel} />;
}

