"use client";

import {
  type BackendArtifactsPanelInput,
  useBackendArtifactsPanelViewModel,
} from "../view-model/use-artifacts-panel-view-model";
import { BackendArtifactsPanelView } from "../view/backend-artifacts-panel-view";

export function BackendArtifactsPanel(props: BackendArtifactsPanelInput) {
  const vm = useBackendArtifactsPanelViewModel(props);
  return <BackendArtifactsPanelView vm={vm} />;
}
