"use client";

import { useMemo } from "react";
import {
  buildDevEventsPanelModel,
  type DevEventsPanelInput,
  type DevEventsPanelModel,
} from "../model/dev-events-panel";

export type DevEventsPanelViewModel = DevEventsPanelModel;

export function useDevEventsPanelViewModel(input: DevEventsPanelInput): DevEventsPanelViewModel {
  return useMemo(
    () => buildDevEventsPanelModel(input),
    [input.events, input.loading, input.error],
  );
}
