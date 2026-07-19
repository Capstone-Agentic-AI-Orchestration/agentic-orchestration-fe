"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/shared/components/ui";
import { IconArrowLeft, IconGitHub, IconRefresh, IconUsers } from "@/shared/components/icons";
import {
  listDevFlowGroups,
  listDevFlowProjects,
  listDevFlowRepositories,
  type DevFlowGroup,
  type DevFlowProjectSummary,
  type DevFlowRepository,
} from "@/shared/api/devflow-api";

const POLL_INTERVAL_MS = 20_000;

export function DevTeamView({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [group, setGroup] = useState<DevFlowGroup | null>(null);
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [projects, setProjects] = useState<DevFlowProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Each of these is already access-scoped for a developer server-side:
      // groups they belong to, repositories assigned to them, projects they can see.
      const [groups, allRepos, allProjects] = await Promise.all([
        listDevFlowGroups(),
        listDevFlowRepositories(),
        listDevFlowProjects(),
      ]);
      setGroup(groups.find((g) => g.id === groupId) ?? null);
      setRepositories(allRepos.filter((r) => r.groupId === groupId));
      setProjects(allProjects.filter((p) => p.groupId === groupId));
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [groupId]);

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
    <div data-screen-label="Developer - Team">
      <button type="button" className="auth-link auth-link-btn" onClick={() => router.push("/dev/groups")} style={{ marginBottom: 14, color: "var(--text-2)", fontSize: 13 }}>
        <IconArrowLeft size={14} /> Back to groups
      </button>

      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow"><IconUsers size={14} /> Team overview</span>
          <h1 style={{ marginTop: 8 }}>{group?.name ?? (loading ? "Loading team…" : "Team")}</h1>
          <p style={{ color: "var(--text-2)" }}>{group?.description || "The internal delivery team you work with."}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error && <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 14 }}>{error}</Card>}

      {group && (
        <Card style={{ padding: 20, marginBottom: 16 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <strong>Members</strong>
            <Badge tone={group.status === "ACTIVE" ? "green" : "gray"}>{group.status}</Badge>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {group.members.map((member) => (
              <Badge key={member.id} tone="gray">{member.user.fullName || member.user.email} · {member.role.replaceAll("_", " ")}</Badge>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
        {/* Repositories assigned to this developer in this team */}
        <Card style={{ padding: 20 }}>
          <div className="row gap-2" style={{ marginBottom: 12 }}><IconGitHub size={16} /><strong>Your repositories</strong><Badge tone="gray">{repositories.length}</Badge></div>
          {loading && repositories.length === 0 && <p style={{ color: "var(--text-3)" }}>Loading…</p>}
          {!loading && repositories.length === 0 && <p style={{ color: "var(--text-3)" }}>No repositories assigned to you in this team yet. Your PM grants access from the group workspace.</p>}
          {repositories.map((repository) => {
            const assignment = repository.assignments.find((item) => item.desiredState === "ASSIGNED");
            return (
              <div key={repository.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div><strong>{repository.fullName || repository.name}</strong><small style={{ display: "block", color: "var(--text-3)" }}>{repository.project.companyName} · {repository.defaultBranch}</small></div>
                <div className="row gap-2">
                  <Badge tone={assignment?.effectiveState === "ACTIVE" ? "green" : assignment?.effectiveState === "FAILED" ? "red" : "yellow"}>{assignment?.effectiveState || repository.status}</Badge>
                  {repository.htmlUrl && <a className="btn btn-secondary btn-sm" href={repository.htmlUrl} target="_blank" rel="noreferrer">Open GitHub</a>}
                </div>
              </div>
            );
          })}
        </Card>

        {/* Projects in this team the developer can see */}
        <Card style={{ padding: 20 }}>
          <div className="row gap-2" style={{ marginBottom: 12 }}><strong>Projects</strong><Badge tone="gray">{projects.length}</Badge></div>
          {loading && projects.length === 0 && <p style={{ color: "var(--text-3)" }}>Loading…</p>}
          {!loading && projects.length === 0 && <p style={{ color: "var(--text-3)" }}>No projects in this team yet.</p>}
          {projects.map((project) => (
            <div key={project.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
              <div><strong>{project.companyName}</strong><small style={{ display: "block", color: "var(--text-3)" }}>{project.lifecycle.label}</small></div>
              <div className="row gap-2">
                <Badge tone={project.lifecycle.tone}>{project.status.replaceAll("_", " ")}</Badge>
                <Button variant="secondary" size="sm" onClick={() => router.push(`/dev/project/${project.id}`)}>Open</Button>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
