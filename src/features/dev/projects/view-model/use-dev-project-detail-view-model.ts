"use client";

import {
  type DevFlowProjectDetail,
} from "@/shared/api/devflow-api";
import { useDevFlowProjectOutputs } from "@/shared/hooks/use-devflow-projects";
import {
  buildDevProjectDetailModel,
  type DevProjectDetailModel,
} from "../model/dev-project-detail";

export interface DevProjectDetailViewModel extends DevProjectDetailModel {
  project: DevFlowProjectDetail;
  outputs: ReturnType<typeof useDevFlowProjectOutputs>;
  actions: {
    back: () => void;
    openOrchestrator: () => void;
  };
}

export function useDevProjectDetailViewModel(input: {
  project: DevFlowProjectDetail;
  onBack: () => void;
  onOpenOrchestrator: () => void;
}): DevProjectDetailViewModel {
  const outputs = useDevFlowProjectOutputs(input.project.id, {
    includeTasks: true,
    includeTimeline: true,
    includeWorkOrders: true,
  });
  return {
    ...buildDevProjectDetailModel(input.project),
    project: input.project,
    outputs,
    actions: {
      back: input.onBack,
      openOrchestrator: input.onOpenOrchestrator,
    },
  };
}
