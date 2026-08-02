"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getDevFlowClient,
  getDevFlowClientContacts,
  getDevFlowClientDocuments,
  getDevFlowClientProjects,
  getDevFlowClients,
  getDevFlowUnassignedProjects,
  type DevFlowClient,
  type DevFlowClientContact,
  type DevFlowClientDocuments,
  type DevFlowClientListResponse,
  type DevFlowClientProject,
} from "@/shared/api/devflow-api";

const EMPTY_LIST: DevFlowClientListResponse = { clients: [], unassignedProjectCount: 0 };
const EMPTY_DOCUMENTS: DevFlowClientDocuments = {
  groups: [],
  totals: { documents: 0, readable: 0, files: 0 },
};

export function useDevFlowClients(search?: string) {
  const [data, setData] = useState<DevFlowClientListResponse>(EMPTY_LIST);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getDevFlowClients(search));
    } catch (nextError) {
      setData(EMPTY_LIST);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getDevFlowClients(search)
      .then((result) => { if (active) setData(result); })
      .catch((nextError) => {
        if (!active) return;
        setData(EMPTY_LIST);
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search]);

  return {
    clients: data.clients,
    unassignedProjectCount: data.unassignedProjectCount,
    loading,
    error,
    refresh: load,
  };
}

/**
 * Everything one client page needs, loaded together.
 *
 * A single hook rather than four keeps the tabs from each firing their own request and lets one
 * refresh (after linking a project, say) update every tab consistently.
 */
export function useDevFlowClientWorkspace(clientId?: string | null) {
  const [client, setClient] = useState<DevFlowClient | null>(null);
  const [projects, setProjects] = useState<DevFlowClientProject[]>([]);
  const [documents, setDocuments] = useState<DevFlowClientDocuments>(EMPTY_DOCUMENTS);
  const [contacts, setContacts] = useState<DevFlowClientContact[]>([]);
  const [unassignedProjects, setUnassignedProjects] = useState<DevFlowClientProject[]>([]);
  const [loading, setLoading] = useState(Boolean(clientId));
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!clientId) {
      setClient(null);
      setProjects([]);
      setDocuments(EMPTY_DOCUMENTS);
      setContacts([]);
      setUnassignedProjects([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [nextClient, nextProjects, nextDocuments, nextContacts, nextUnassigned] =
        await Promise.all([
          getDevFlowClient(clientId),
          getDevFlowClientProjects(clientId),
          getDevFlowClientDocuments(clientId),
          getDevFlowClientContacts(clientId),
          getDevFlowUnassignedProjects(),
        ]);
      setClient(nextClient);
      setProjects(nextProjects);
      setDocuments(nextDocuments);
      setContacts(nextContacts);
      setUnassignedProjects(nextUnassigned);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { client, projects, documents, contacts, unassignedProjects, loading, error, refresh: load };
}
