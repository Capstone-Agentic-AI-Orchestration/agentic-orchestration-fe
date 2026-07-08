"use client";

import {
  type BackendWorkOrdersPanelInput,
  useBackendWorkOrdersPanelViewModel,
} from "../view-model/use-work-orders-panel-view-model";
import { BackendWorkOrdersPanelView } from "../view/backend-work-orders-panel-view";

export function BackendWorkOrdersPanel(props: BackendWorkOrdersPanelInput) {
  const vm = useBackendWorkOrdersPanelViewModel(props);
  return <BackendWorkOrdersPanelView vm={vm} />;
}
