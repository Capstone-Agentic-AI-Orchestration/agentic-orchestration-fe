"use client";

import {
  type BackendOrchestrationPanelInput,
  useBackendOrchestrationPanelViewModel,
} from "../view-model/use-orchestration-panel-view-model";
import { BackendOrchestrationPanelView } from "../view/backend-orchestration-panel-view";

export function BackendOrchestrationPanel(props: BackendOrchestrationPanelInput) {
  const vm = useBackendOrchestrationPanelViewModel(props);
  return <BackendOrchestrationPanelView vm={vm} />;
}
