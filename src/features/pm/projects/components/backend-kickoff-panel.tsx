"use client";

import {
  type BackendKickoffPanelInput,
  useBackendKickoffPanelViewModel,
} from "../view-model/use-kickoff-panel-view-model";
import { BackendKickoffPanelView } from "../view/backend-kickoff-panel-view";

export function BackendKickoffPanel(props: BackendKickoffPanelInput) {
  const vm = useBackendKickoffPanelViewModel(props);
  return <BackendKickoffPanelView vm={vm} />;
}
