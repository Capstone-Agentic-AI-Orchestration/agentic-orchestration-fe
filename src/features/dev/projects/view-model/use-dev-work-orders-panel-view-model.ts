"use client";

import { useMemo } from "react";
import {
  buildDevWorkOrdersPanelModel,
  type DevWorkOrdersPanelInput,
  type DevWorkOrdersPanelModel,
} from "../model/dev-work-orders-panel";

export type DevWorkOrdersPanelViewModel = DevWorkOrdersPanelModel;

export function useDevWorkOrdersPanelViewModel(input: DevWorkOrdersPanelInput): DevWorkOrdersPanelViewModel {
  return useMemo(
    () => buildDevWorkOrdersPanelModel(input),
    [input.workOrders, input.loading, input.error],
  );
}
