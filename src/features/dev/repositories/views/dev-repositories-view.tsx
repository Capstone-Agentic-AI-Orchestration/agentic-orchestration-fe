"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/shared/components/ui";
import { IconGitHub, IconRefresh } from "@/shared/components/icons";
import { listDevFlowRepositories, type DevFlowRepository } from "@/shared/api/devflow-api";

export function DevRepositoriesView() {
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [error, setError] = useState("");

  const refresh = async () => {
    setError("");
    try { setRepositories(await listDevFlowRepositories()); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : String(requestError)); }
  };

  useEffect(() => { void refresh(); }, []);

  return (
    <div data-screen-label="Developer - Repositories">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <div><span className="eyebrow"><IconGitHub size={14} /> GitHub access</span><h1 style={{ marginTop: 8 }}>Assigned repositories</h1><p style={{ color: "var(--text-2)" }}>Only repositories explicitly assigned to you are shown. They start without CI/CD.</p></div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} onClick={() => void refresh()}>Refresh</Button>
      </div>
      {error && <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 14 }}>{error}</Card>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {repositories.map((repository) => {
          const assignment = repository.assignments.find((item) => item.desiredState === "ASSIGNED");
          return (
            <Card key={repository.id} style={{ padding: 20 }}>
              <div className="row" style={{ justifyContent: "space-between" }}><strong>{repository.fullName || repository.name}</strong><Badge tone={assignment?.effectiveState === "ACTIVE" ? "green" : assignment?.effectiveState === "FAILED" ? "red" : "yellow"}>{assignment?.effectiveState || repository.status}</Badge></div>
              <p style={{ color: "var(--text-2)", margin: "10px 0" }}>{repository.project.companyName} · {repository.group.name}</p>
              <small style={{ color: "var(--text-3)" }}>Default branch: {repository.defaultBranch} · Plain repository</small>
              {assignment?.lastError && <p style={{ color: "#FCA5A5", marginTop: 10 }}>{assignment.lastError}</p>}
              {repository.htmlUrl && <a className="btn btn-primary btn-sm" style={{ marginTop: 16 }} href={repository.htmlUrl} target="_blank" rel="noreferrer"><IconGitHub size={14} /> Open GitHub</a>}
            </Card>
          );
        })}
        {repositories.length === 0 && <Card style={{ padding: 24 }}><strong>No repository assignments</strong><p style={{ color: "var(--text-3)", marginTop: 6 }}>Your PM can grant access from the group workspace.</p></Card>}
      </div>
    </div>
  );
}
