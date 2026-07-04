"use client";

import { useEffect, useState } from "react";
import {
  getDevFlowProject,
  getDevFlowProjectArtifacts,
  getDevFlowProjectEvents,
  getDevFlowOrchestrationProviderStatus,
  getDevFlowOrchestrationStatus,
  getDevFlowProjectTasks,
  getDevFlowProjectTimeline,
  getDevFlowProjectWorkOrders,
  getDevFlowCollaborationDocuments,
  listDevFlowProjectDetails,
  listDevFlowProjects,
  type DevFlowAgentProviderStatus,
  type DevFlowArtifact,
  type DevFlowCollaborationDocument,
  type DevFlowEventLog,
  type DevFlowProjectDetail,
  type DevFlowOrchestrationStatus,
  type DevFlowProjectSummary,
  type DevFlowProjectTask,
  type DevFlowProjectTimelineEvent,
  type DevFlowWorkOrder,
} from "@/shared/api/devflow-api";

export function useDevFlowProjects() {
  const [projects, setProjects] = useState<DevFlowProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setProjects(await listDevFlowProjects());
    } catch (nextError) {
      setProjects([]);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listDevFlowProjects()
      .then((result) => { if (active) setProjects(result); })
      .catch((nextError) => { if (active) { setProjects([]); setError(nextError instanceof Error ? nextError.message : String(nextError)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { projects, loading, error, refresh };
}

export function useDevFlowOrchestrationStatus(projectId?: string | null) {
  const [status, setStatus] = useState<DevFlowOrchestrationStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [error, setError] = useState("");

  const refresh = async () => {
    if (!projectId) {
      setStatus(null);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setStatus(await getDevFlowOrchestrationStatus(projectId));
    } catch (nextError) {
      setStatus(null);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!projectId) {
      if (active) { setStatus(null); setLoading(false); setError(""); }
      return;
    }
    setLoading(true);
    setError("");
    getDevFlowOrchestrationStatus(projectId)
      .then((result) => { if (active) setStatus(result); })
      .catch((nextError) => { if (active) { setStatus(null); setError(nextError instanceof Error ? nextError.message : String(nextError)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  return { status, loading, error, refresh };
}

export function useDevFlowOrchestrationProviderStatus(projectId?: string | null) {
  const [status, setStatus] = useState<DevFlowAgentProviderStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [error, setError] = useState("");

  const refresh = async () => {
    if (!projectId) {
      setStatus(null);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setStatus(await getDevFlowOrchestrationProviderStatus(projectId));
    } catch (nextError) {
      setStatus(null);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!projectId) {
      if (active) { setStatus(null); setLoading(false); setError(""); }
      return;
    }
    setLoading(true);
    setError("");
    getDevFlowOrchestrationProviderStatus(projectId)
      .then((result) => { if (active) setStatus(result); })
      .catch((nextError) => { if (active) { setStatus(null); setError(nextError instanceof Error ? nextError.message : String(nextError)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  return { status, loading, error, refresh };
}

export function useDevFlowProject(projectId?: string | null) {
  const [project, setProject] = useState<DevFlowProjectDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [error, setError] = useState("");

  const refresh = async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setProject(await getDevFlowProject(projectId));
    } catch (nextError) {
      setProject(null);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!projectId) {
      if (active) { setProject(null); setLoading(false); setError(""); }
      return;
    }
    setLoading(true);
    setError("");
    getDevFlowProject(projectId)
      .then((result) => { if (active) setProject(result); })
      .catch((nextError) => { if (active) { setProject(null); setError(nextError instanceof Error ? nextError.message : String(nextError)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId]);

  return { project, loading, error, refresh };
}

export function usePrimaryDevFlowProject() {
  const list = useDevFlowProjects();
  const primaryId = list.projects[0]?.id ?? null;
  const detail = useDevFlowProject(primaryId);

  return {
    ...list,
    primaryProject: detail.project,
    primaryProjectLoading: list.loading || detail.loading,
    primaryProjectError: list.error || detail.error,
  };
}

export function useDevFlowProjectDirectory() {
  const [projects, setProjects] = useState<DevFlowProjectDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const details = await listDevFlowProjectDetails();
      setProjects(details);
    } catch {
      try {
        const summaries = await listDevFlowProjects();
        const results = await Promise.allSettled(summaries.map((project) => getDevFlowProject(project.id)));
        const details: DevFlowProjectDetail[] = [];
        const errors: string[] = [];
        for (const result of results) {
          if (result.status === "fulfilled") {
            details.push(result.value);
          } else {
            errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
          }
        }
        setProjects(details);
        if (details.length === 0 && summaries.length > 0) {
          setError(errors[0] || "All project detail requests failed");
        }
      } catch (nextError) {
        setProjects([]);
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listDevFlowProjectDetails()
      .then((details) => { if (active) setProjects(details); })
      .catch(() => {
        if (!active) return;
        return listDevFlowProjects()
          .then((summaries) => {
            if (!active) return;
            if (summaries.length === 0) {
              setProjects([]);
              return;
            }
            return Promise.allSettled(summaries.map((project) => getDevFlowProject(project.id)))
              .then((results) => {
                if (!active) return;
                const details: DevFlowProjectDetail[] = [];
                const errors: string[] = [];
                for (const result of results) {
                  if (result.status === "fulfilled") {
                    details.push(result.value);
                  } else {
                    errors.push(result.reason instanceof Error ? result.reason.message : String(result.reason));
                  }
                }
                setProjects(details);
                if (details.length === 0 && summaries.length > 0) {
                  setError(errors[0] || "All project detail requests failed");
                }
              });
          });
      })
      .catch((nextError) => { if (active) { setProjects([]); setError(nextError instanceof Error ? nextError.message : String(nextError)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { projects, loading, error, refresh };
}

export function useDevFlowProjectOutputs(projectId?: string | null, options?: { includeEvents?: boolean; includeTasks?: boolean; includeTimeline?: boolean; includeWorkOrders?: boolean; includeDocuments?: boolean }) {
  const [artifacts, setArtifacts] = useState<DevFlowArtifact[]>([]);
  const [documents, setDocuments] = useState<DevFlowCollaborationDocument[]>([]);
  const [events, setEvents] = useState<DevFlowEventLog[]>([]);
  const [tasks, setTasks] = useState<DevFlowProjectTask[]>([]);
  const [timeline, setTimeline] = useState<DevFlowProjectTimelineEvent[]>([]);
  const [workOrders, setWorkOrders] = useState<DevFlowWorkOrder[]>([]);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [error, setError] = useState("");
  const includeTasks = Boolean(options?.includeTasks);
  const includeTimeline = Boolean(options?.includeTimeline);
  const includeWorkOrders = Boolean(options?.includeWorkOrders);
  const includeDocuments = Boolean(options?.includeDocuments);
  const includeEvents = options?.includeEvents ?? true;

  const refresh = async () => {
    if (!projectId) {
      setArtifacts([]);
      setDocuments([]);
      setEvents([]);
      setTasks([]);
      setTimeline([]);
      setWorkOrders([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [nextArtifacts, nextDocuments, nextEvents, nextTasks, nextTimeline, nextWorkOrders] = await Promise.all([
        getDevFlowProjectArtifacts(projectId),
        includeDocuments ? getDevFlowCollaborationDocuments(projectId) : Promise.resolve([]),
        includeEvents ? getDevFlowProjectEvents(projectId) : Promise.resolve([]),
        includeTasks ? getDevFlowProjectTasks(projectId) : Promise.resolve([]),
        includeTimeline ? getDevFlowProjectTimeline(projectId) : Promise.resolve([]),
        includeWorkOrders ? getDevFlowProjectWorkOrders(projectId) : Promise.resolve([]),
      ]);
      setArtifacts(nextArtifacts);
      setDocuments(nextDocuments);
      setEvents(nextEvents);
      setTasks(nextTasks);
      setTimeline(nextTimeline);
      setWorkOrders(nextWorkOrders);
    } catch (nextError) {
      setArtifacts([]);
      setDocuments([]);
      setEvents([]);
      setTasks([]);
      setTimeline([]);
      setWorkOrders([]);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!projectId) {
      if (active) { setArtifacts([]); setDocuments([]); setEvents([]); setTasks([]); setTimeline([]); setWorkOrders([]); setLoading(false); setError(""); }
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([
      getDevFlowProjectArtifacts(projectId),
      includeDocuments ? getDevFlowCollaborationDocuments(projectId) : Promise.resolve([]),
      includeEvents ? getDevFlowProjectEvents(projectId) : Promise.resolve([]),
      includeTasks ? getDevFlowProjectTasks(projectId) : Promise.resolve([]),
      includeTimeline ? getDevFlowProjectTimeline(projectId) : Promise.resolve([]),
      includeWorkOrders ? getDevFlowProjectWorkOrders(projectId) : Promise.resolve([]),
    ])
      .then(([nextArtifacts, nextDocuments, nextEvents, nextTasks, nextTimeline, nextWorkOrders]) => {
        if (!active) return;
        setArtifacts(nextArtifacts);
        setDocuments(nextDocuments);
        setEvents(nextEvents);
        setTasks(nextTasks);
        setTimeline(nextTimeline);
        setWorkOrders(nextWorkOrders);
      })
      .catch((nextError) => { if (active) { setArtifacts([]); setDocuments([]); setEvents([]); setTasks([]); setTimeline([]); setWorkOrders([]); setError(nextError instanceof Error ? nextError.message : String(nextError)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId, includeDocuments, includeEvents, includeTasks, includeTimeline, includeWorkOrders]);

  return { artifacts, documents, events, tasks, timeline, workOrders, loading, error, refresh };
}
