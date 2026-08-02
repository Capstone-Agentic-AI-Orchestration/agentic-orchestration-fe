"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Select } from "@/shared/components/ui";
import { IconAlertTriangle, IconArrowLeft } from "@/shared/components/icons";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";
import { compactBackendError, formatBackendDate } from "@/features/pm/projects/utils/pm-project-detail.utils";
import {
  getDevFlowClients,
  getDevFlowUnassignedProjects,
  setDevFlowProjectClient,
  type DevFlowClientListItem,
  type DevFlowClientProject,
} from "@/shared/api/devflow-api";

/**
 * The remedy screen for projects with no client.
 *
 * Deliberately actionable rather than a passive list: every row carries the picker that fixes it,
 * because a warning you cannot act on from where you see it just teaches people to ignore it.
 */
export function PMUnassignedProjectsView() {
  const router = useRouter();
  const [projects, setProjects] = useState<DevFlowClientProject[]>([]);
  const [clients, setClients] = useState<DevFlowClientListItem[]>([]);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextProjects, clientList] = await Promise.all([
        getDevFlowUnassignedProjects(),
        getDevFlowClients(),
      ]);
      setProjects(nextProjects);
      setClients(clientList.clients);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const link = async (projectId: string) => {
    const clientId = choice[projectId];
    if (!clientId) return;
    setBusyId(projectId);
    setError("");
    try {
      await setDevFlowProjectClient(projectId, clientId);
      await load();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="pm-clients-view">
      <div className="pm-tab-header" style={{ marginBottom: 16 }}>
        <div>
          <Button variant="ghost" size="sm" icon={<IconArrowLeft size={13} />} onClick={() => router.push("/pm/clients")}>
            All clients
          </Button>
          <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>Projects without a client</h1>
          <div style={{ color: "var(--text-2)", fontSize: 13 }}>
            These do not appear on any client page. Link each one to the company it belongs to.
          </div>
        </div>
        <Badge tone={projects.length ? "amber" : "green"}>{projects.length} unassigned</Badge>
      </div>

      {error && (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger" style={{ marginBottom: 14 }}>
          {compactBackendError(error)}
        </Card>
      )}

      {loading && projects.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">Loading projects...</Card>
      ) : projects.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">
          Every project belongs to a client. Nothing to fix here.
        </Card>
      ) : (
        <Card className="pm-tab-panel">
          <div className="pm-tab-header" style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            <SectionTitle title="Unassigned" subtitle="Pick the client each project belongs to." />
          </div>
          <div className="pm-tab-list">
            {projects.map((project) => (
              <div key={project.id} className="pm-tab-list-row">
                <span className="pm-unassigned-row-icon" aria-hidden="true"><IconAlertTriangle size={14} /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 650, fontSize: 13.5 }}>{project.companyName}</div>
                  <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>
                    {project.stackKey} · created {formatBackendDate(project.createdAt)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexShrink: 0, flexWrap: "wrap" }}>
                  <Field label="Client">
                    <Select
                      value={choice[project.id] ?? ""}
                      onChange={(event) => setChoice({ ...choice, [project.id]: event.target.value })}
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Button
                    size="sm"
                    disabled={!choice[project.id] || busyId === project.id}
                    onClick={() => void link(project.id)}
                  >
                    {busyId === project.id ? "Linking..." : "Link"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/pm/project/${project.id}`)}>
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {clients.length === 0 && projects.length > 0 && (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--warning" style={{ marginTop: 14 }}>
          There are no clients to link to yet. Create one from the Clients page first.
        </Card>
      )}
    </div>
  );
}
