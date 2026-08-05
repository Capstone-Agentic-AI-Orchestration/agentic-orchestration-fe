"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Select } from "@/shared/components/ui";
import { IconGitHub, IconPlus, IconRefresh } from "@/shared/components/icons";
import { PMPageHeader } from "@/features/pm/shared/components/pm-page-header";
import { useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";
import {
  assignDevFlowRepository,
  createDevFlowRepository,
  listDevFlowGroupEligibleUsers,
  listDevFlowProjects,
  listDevFlowRepositories,
  revokeDevFlowRepositoryAssignment,
  type DevFlowProjectSummary,
  type DevFlowRepository,
} from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

const POLL_INTERVAL_MS = 20_000;

/**
 * Repository provisioning, which is the PM's half of the delivery split.
 *
 * The developer owns prompting and the build; the PM decides where a client's code lives and
 * who may push to it. That is why POST /repositories and every assignment route are
 * @Roles(PM, ADMIN) — this page is the surface for them. Developers keep /dev/repositories,
 * which lists only what they have been granted and can no longer create or archive.
 *
 * Provisioning is asynchronous (GitHub is called out-of-band), so a new repository appears
 * as PENDING and this page polls until it settles to ACTIVE or FAILED.
 */
export function PMRepositoriesView() {
  const router = useRouter();
  const { selectedTeamId } = useSelectedTeamWorkspace();
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [projects, setProjects] = useState<DevFlowProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [nextRepositories, nextProjects] = await Promise.all([
        listDevFlowRepositories(),
        listDevFlowProjects(),
      ]);
      setRepositories(nextRepositories);
      setProjects(nextProjects);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Only poll while something is mid-provision. A settled list does not need the traffic,
  // and a PM watching a PENDING repo is the one case where waiting for a manual refresh is
  // actively unhelpful.
  const hasPending = useMemo(
    () => repositories.some((repository) => repository.status === "PENDING"),
    [repositories],
  );

  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => void refresh(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasPending, refresh]);

  const visibleRepositories = selectedTeamId
    ? repositories.filter((repository) => repository.groupId === selectedTeamId)
    : repositories;

  return (
    <div data-screen-label="PM - Repositories">
      <PMPageHeader
        title="Repositories"
        subtitle="Provision the GitHub repository a project is built in, and grant developers access to it."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<IconRefresh size={14} />}
            disabled={loading}
            onClick={() => void refresh()}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      {error && (
        <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 14 }}>
          {compactDevFlowError(error)}
        </Card>
      )}

      <CreateRepositoryCard
        groupId={selectedTeamId}
        projects={projects}
        existing={repositories}
        onCreated={() => void refresh()}
      />

      {loading && repositories.length === 0 && (
        <Card style={{ padding: 24, color: "var(--text-2)" }}>Loading repositories...</Card>
      )}

      {!loading && visibleRepositories.length === 0 && (
        <Card style={{ padding: 24 }}>
          <strong>No repositories yet</strong>
          <p style={{ color: "var(--text-3)", marginTop: 6 }}>
            Create one for a project above. A developer cannot start a build run until the
            project has a repository to deliver into.
          </p>
        </Card>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {visibleRepositories.map((repository) => (
          <RepositoryCard
            key={repository.id}
            repository={repository}
            onOpenProject={() => router.push(`/pm/project/${repository.projectId}`)}
            onChanged={() => void refresh(true)}
          />
        ))}
      </div>
    </div>
  );
}

function CreateRepositoryCard({
  groupId,
  projects,
  existing,
  onCreated,
}: {
  groupId: string | null;
  projects: DevFlowProjectSummary[];
  existing: DevFlowRepository[];
  onCreated: () => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // A project that already has a repository is not offered again: the backend rejects a
  // second one of the same kind, and listing it would invite an error the PM cannot act on.
  const provisionedProjectIds = new Set(existing.map((repository) => repository.projectId));
  const options = projects.filter((project) => !provisionedProjectIds.has(project.id));

  const submit = async () => {
    if (!groupId) {
      setError("Select a team workspace first — a repository belongs to a team.");
      return;
    }
    if (!projectId || !name.trim()) return;

    setSaving(true);
    setError("");
    try {
      await createDevFlowRepository({ groupId, projectId, name: name.trim() });
      setProjectId("");
      setName("");
      onCreated();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ padding: 20, marginBottom: 18 }}>
      <div className="row gap-2" style={{ alignItems: "center", marginBottom: 14 }}>
        <IconGitHub size={16} />
        <strong>Create a project repository</strong>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr auto", alignItems: "end" }}>
        <Field label="Project">
          <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">Select a project</option>
            {options.map((project) => (
              <option key={project.id} value={project.id}>{project.companyName}</option>
            ))}
          </Select>
        </Field>
        <Field label="Repository name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="acme-logistics-platform"
          />
        </Field>
        <Button
          variant="primary"
          size="sm"
          icon={<IconPlus size={13} />}
          onClick={submit}
          disabled={saving || !projectId || !name.trim()}
        >
          {saving ? "Creating..." : "Create repository"}
        </Button>
      </div>

      {error && <div style={{ color: "#FCA5A5", fontSize: 13, marginTop: 12 }}>{compactDevFlowError(error)}</div>}
      {!options.length && projects.length > 0 && (
        <div style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 12 }}>
          Every project in this workspace already has a repository.
        </div>
      )}
    </Card>
  );
}

const STATUS_TONE: Record<string, "green" | "red" | "yellow" | "gray"> = {
  ACTIVE: "green",
  FAILED: "red",
  PENDING: "yellow",
  ARCHIVED: "gray",
};

function RepositoryCard({
  repository,
  onOpenProject,
  onChanged,
}: {
  repository: DevFlowRepository;
  onOpenProject: () => void;
  onChanged: () => void;
}) {
  const [candidates, setCandidates] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const active = repository.assignments.filter((item) => item.desiredState === "ASSIGNED");

  useEffect(() => {
    let cancelled = false;
    listDevFlowGroupEligibleUsers(repository.groupId)
      .then((people) => {
        if (cancelled) return;
        setCandidates(
          people
            .filter((person) => person.role === "DEV" && person.onSystem)
            .map((person) => ({ id: person.id ?? "", name: person.fullName || person.githubLogin || person.email || "Unknown" }))
            .filter((person) => person.id),
        );
      })
      .catch(() => setCandidates([]));
    return () => {
      cancelled = true;
    };
  }, [repository.groupId]);

  const assign = async () => {
    if (!selectedUserId) return;
    setBusy(selectedUserId);
    setError("");
    try {
      await assignDevFlowRepository(repository.id, selectedUserId);
      setSelectedUserId("");
      onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusy("");
    }
  };

  const revoke = async (userId: string) => {
    setBusy(userId);
    setError("");
    try {
      await revokeDevFlowRepositoryAssignment(repository.id, userId);
      onChanged();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusy("");
    }
  };

  const unassigned = candidates.filter(
    (person) => !active.some((assignment) => assignment.userId === person.id),
  );

  return (
    <Card style={{ padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <strong>{repository.fullName || repository.name}</strong>
          <p style={{ color: "var(--text-2)", margin: "6px 0 0", fontSize: 13 }}>
            {repository.project.companyName} · {repository.group.name} · {repository.defaultBranch}
          </p>
        </div>
        <Badge tone={STATUS_TONE[repository.status] ?? "gray"}>{repository.status}</Badge>
      </div>

      {repository.lastError && (
        <p style={{ color: "#FCA5A5", marginTop: 10, fontSize: 13 }}>{repository.lastError}</p>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ color: "var(--text-3)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Developer access
        </div>
        {active.length === 0 ? (
          <p style={{ color: "var(--text-3)", fontSize: 13, marginTop: 8 }}>
            Nobody has access yet. A developer needs access before they can push a build here.
          </p>
        ) : (
          <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
            {active.map((assignment) => (
              <span key={assignment.id} className="row gap-2" style={{ alignItems: "center" }}>
                <Badge tone={assignment.effectiveState === "ACTIVE" ? "green" : assignment.effectiveState === "FAILED" ? "red" : "yellow"}>
                  {assignment.user.fullName || assignment.user.githubLogin} · {assignment.effectiveState}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy === assignment.userId}
                  onClick={() => revoke(assignment.userId)}
                >
                  {busy === assignment.userId ? "Revoking..." : "Revoke"}
                </Button>
              </span>
            ))}
          </div>
        )}

        <div className="row gap-2" style={{ marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Select
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            style={{ width: 240 }}
          >
            <option value="">Grant access to a developer</option>
            {unassigned.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </Select>
          <Button variant="secondary" size="sm" onClick={assign} disabled={!selectedUserId || Boolean(busy)}>
            Grant access
          </Button>
        </div>
      </div>

      {error && <div style={{ color: "#FCA5A5", fontSize: 13, marginTop: 12 }}>{compactDevFlowError(error)}</div>}

      <div className="row gap-2" style={{ marginTop: 16, flexWrap: "wrap" }}>
        <Button variant="primary" size="sm" onClick={onOpenProject}>Open project</Button>
        {repository.htmlUrl && (
          <a className="btn btn-secondary btn-sm" href={repository.htmlUrl} target="_blank" rel="noreferrer">
            <IconGitHub size={14} /> GitHub
          </a>
        )}
      </div>
    </Card>
  );
}
