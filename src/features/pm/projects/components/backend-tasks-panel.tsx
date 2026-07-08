"use client";

import {
  type BackendTasksPanelInput,
  useBackendTasksPanelViewModel,
} from "../view-model/use-tasks-panel-view-model";
import { BackendTasksPanelView } from "../view/backend-tasks-panel-view";

export function BackendTasksPanel(props: BackendTasksPanelInput) {
  const vm = useBackendTasksPanelViewModel(props);
  return <BackendTasksPanelView vm={vm} />;
}
