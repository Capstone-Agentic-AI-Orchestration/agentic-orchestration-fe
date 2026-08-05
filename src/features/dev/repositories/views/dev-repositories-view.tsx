"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/shared/components/ui";
import { IconGitHub, IconRefresh } from "@/shared/components/icons";
import { listDevFlowRepositories, type DevFlowRepository } from "@/shared/api/devflow-api";

const POLL_INTERVAL_MS = 20_000;

export function DevRepositoriesView() {
  const router = useRouter();
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // `silent` refreshes (polling / focus) don't flip the loading state, so the
  // list never flickers while it already has content.
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setRepositories(await listDevFlowRepositories());
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load + polling + refresh on tab focus, so a repo a PM grants while
  // the developer is on this page shows up without a manual reload.
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(true), POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return (
    <div data-screen-label="Developer - Repositories">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <span className="eyebrow"><IconGitHub size={14} /> GitHub access</span>
          <h1 style={{ marginTop: 8 }}>Assigned repositories</h1>
          <p style={{ color: "var(--text-2)" }}>Only repositories explicitly assigned to you are shown. They start without CI/CD.</p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {error && <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 14 }}>{error}</Card>}
      {loading && repositories.length === 0 && (
        <Card style={{ padding: 24, color: "var(--text-2)" }}>Loading your assigned repositories…</Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {repositories.map((repository) => {
          const assignment = repository.assignments.find((item) => item.desiredState === "ASSIGNED");
          return (
            <Card key={repository.id} style={{ padding: 20 }}>
              <div className="row" style={{ justifyContent: "space-between" }}><strong>{repository.fullName || repository.name}</strong><Badge tone={assignment?.effectiveState === "ACTIVE" ? "green" : assignment?.effectiveState === "FAILED" ? "red" : "yellow"}>{assignment?.effectiveState || repository.status}</Badge></div>
              <p style={{ color: "var(--text-2)", margin: "10px 0" }}>{repository.project.companyName} · {repository.group.name}</p>
              <small style={{ color: "var(--text-3)" }}>Default branch: {repository.defaultBranch} · Plain repository</small>
              {assignment?.lastError && <p style={{ color: "#FCA5A5", marginTop: 10 }}>{assignment.lastError}</p>}
              <div className="row gap-2" style={{ marginTop: 16, flexWrap: "wrap" }}>
                <Button variant="primary" size="sm" onClick={() => router.push(`/dev/project/${repository.projectId}`)}>Open project</Button>
                {repository.htmlUrl && <a className="btn btn-secondary btn-sm" href={repository.htmlUrl} target="_blank" rel="noreferrer"><IconGitHub size={14} /> GitHub</a>}
              </div>
            </Card>
          );
        })}
        {!loading && repositories.length === 0 && <Card style={{ padding: 24 }}><strong>No repository assignments</strong><p style={{ color: "var(--text-3)", marginTop: 6 }}>Repositories are provisioned by a project manager. Ask yours to create one for the project and grant you access from PM &rsaquo; Repositories.</p></Card>}
      </div>
    </div>
  );
}
