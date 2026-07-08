"use client";

import { useEffect, useState } from "react";
import {
  buildRunMeterViewModel,
  type RunMeterViewModel,
} from "@/features/orchestration/model/run-cockpit";
import { useOrchestrationStore } from "@/shared/store/orchestration-store";

export interface RunMeterHookViewModel extends RunMeterViewModel {
  elapsedMs: number;
}

export function useRunMeterViewModel(input: {
  projectName?: string;
  status?: string;
}): RunMeterHookViewModel {
  const orchestrationState = useOrchestrationStore((state) => state.orchestrationState);
  const nodeStates = useOrchestrationStore((state) => state.nodeStates);
  const connectionStatus = useOrchestrationStore((state) => state.connectionStatus);
  const meter = buildRunMeterViewModel({
    projectName: input.projectName,
    status: input.status,
    orchestrationState,
    nodeStates,
    connectionStatus,
  });
  const elapsedMs = useRunClock(meter.runId, meter.isRunning);

  return {
    ...meter,
    elapsedMs,
  };
}

function useRunClock(runId: string, running: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const raf = requestAnimationFrame(() => setElapsed(0));
    const id = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [runId, running]);

  return elapsed;
}
