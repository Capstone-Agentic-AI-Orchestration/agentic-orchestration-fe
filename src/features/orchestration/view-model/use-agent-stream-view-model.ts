"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildAgentSnapshots,
  type AgentSnapshot,
} from "@/features/orchestration/model/agent-stream";
import { useOrchestrationStore } from "@/shared/store/orchestration-store";

export interface AgentStreamGridViewModel {
  snapshots: AgentSnapshot[];
  currentNode: string;
  retryCount: number;
}

export function useAgentStreamGridViewModel(): AgentStreamGridViewModel {
  const agentStreams = useOrchestrationStore((state) => state.agentStreams);
  const nodeStates = useOrchestrationStore((state) => state.nodeStates);
  const orchestrationState = useOrchestrationStore((state) => state.orchestrationState);
  const currentNode = orchestrationState?.currentNode ?? "";
  const retryCount = orchestrationState?.retryCount ?? 0;
  const snapshots = useMemo(
    () => buildAgentSnapshots({ agentStreams, nodeStates, currentNode }),
    [agentStreams, currentNode, nodeStates],
  );

  return {
    snapshots,
    currentNode,
    retryCount,
  };
}

export function useAgentStreamSnapshots(): AgentSnapshot[] {
  return useAgentStreamGridViewModel().snapshots;
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
