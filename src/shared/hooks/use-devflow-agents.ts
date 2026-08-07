"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDevFlowAgent,
  listDevFlowAgents,
  listDevFlowAgentSkills,
  type DevFlowAgentDetail,
  type DevFlowAgentListResponse,
  type DevFlowAgentListScope,
  type DevFlowAgentSkill,
} from "@/shared/api/devflow-api";

const EMPTY_LIST: DevFlowAgentListResponse = {
  agents: [],
  counts: { mine: 0, all: 0, archived: 0 },
};

export function useDevFlowAgents(
  groupId: string | null | undefined,
  scope: DevFlowAgentListScope,
  search?: string,
) {
  const [data, setData] = useState<DevFlowAgentListResponse>(EMPTY_LIST);
  const [loading, setLoading] = useState(Boolean(groupId));
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!groupId) {
      setData(EMPTY_LIST);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setData(await listDevFlowAgents(groupId, scope, search));
    } catch (nextError) {
      setData(EMPTY_LIST);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, [groupId, scope, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...data, loading, error, refresh: load };
}

export function useDevFlowAgent(agentId: string | null | undefined) {
  const [agent, setAgent] = useState<DevFlowAgentDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(agentId));
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!agentId) {
      setAgent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setAgent(await getDevFlowAgent(agentId));
    } catch (nextError) {
      setAgent(null);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Lets a mutation put its own response straight into state without a second round trip. */
  return { agent, loading, error, refresh: load, setAgent };
}

/** Skills are workspace-global, so the picker and the library read the same list. */
export function useDevFlowAgentSkills(groupId: string | null | undefined) {
  const [skills, setSkills] = useState<DevFlowAgentSkill[]>([]);
  const [loading, setLoading] = useState(Boolean(groupId));
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!groupId) {
      setSkills([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setSkills((await listDevFlowAgentSkills(groupId)).skills);
    } catch (nextError) {
      setSkills([]);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { skills, loading, error, refresh: load };
}
