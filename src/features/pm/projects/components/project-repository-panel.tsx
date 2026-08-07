"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Field, Input, Select } from "@/shared/components/ui";
import { IconGitHub, IconPlus, IconRefresh } from "@/shared/components/icons";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";
import {
  assignDevFlowRepository,
  createDevFlowRepository,
  listDevFlowGroupEligibleUsers,
  listDevFlowRepositories,
  revokeDevFlowRepositoryAssignment,
  type DevFlowRepository,
} from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

const POLL_INTERVAL_MS = 20_000;

/**
 * Repository provisioning for one project, which is the PM's half of the delivery split: they
 * decide where a client's code lives and who may push to it, while the developer owns prompting
 * and the build itself. POST /repositories and every assignment route are @Roles(PM, ADMIN);
 * this panel is the surface for them.
 *
 * It used to be a console-wide "Repositories" destination listing every repo in the workspace,
 * which meant picking the project from a dropdown to say something that is only ever true of one
 * project. Now it lives inside the project, where "grant this developer access" needs no prefix.
 *
 * Provisioning is asynchronous (GitHub is called out-of-band), so a new repository appears as
 * PENDING and this panel polls until it settles to ACTIVE or FAILED.
 */
export function ProjectRepositoryPanel({
  projectId,
  groupId,
  fallbackName,
}: {
  projectId: string;
  groupId: string | null;
  /** Seeds the repository name field — the company name is the PM's usual starting point. */
  fallbackName?: string;
}) {
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // There is no per-project repositories route; the list endpoint is already scoped to what
      // this PM may see, so filtering client-side costs one request and no new backend surface.
      const all = await listDevFlowRepositories();
      setRepositories(all.filter((repository) => repository.projectId === projectId));
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Only poll while something is mid-provision. A settled repo does not need the traffic, and a
  // PM watching a PENDING one is the one case where waiting for a manual refresh is unhelpful.
  const hasPending = useMemo(
    () => repositories.some((repository) => repository.status === "PENDING"),
    [repositories],
  );

  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(() => void refresh(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hasPending, refresh]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card className="pm-tab-panel pm-tab-panel--padded">
        <div className="pm-tab-header">
          <SectionTitle
            title="Repository"
            subtitle="The GitHub repository this project is built in, and which developers may push to it."
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<IconRefresh size={14} />}
            disabled={loading}
            onClick={() => void refresh()}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">
          {compactDevFlowError(error)}
        </Card>
      )}

      {loading && repositories.length === 0 && (
        <Card className="pm-tab-panel pm-tab-empty">Loading repository...</Card>
      )}

      {repositories.map((repository) => (
        <RepositoryCard key={repository.id} repository={repository} onChanged={() => void refresh(true)} />
      ))}

      {!loading && repositories.length === 0 && (
        <CreateRepositoryCard
          groupId={groupId}
          projectId={projectId}
          fallbackName={fallbackName}
          onCreated={() => void refresh()}
        />
      )}
    </div>
  );
}

function slugifyRepositoryName(value?: string) {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function CreateRepositoryCard({
  groupId,
  projectId,
  fallbackName,
  onCreated,
}: {
  groupId: string | null;
  projectId: string;
  fallbackName?: string;
  onCreated: () => void;
}) {
  const [name, setName] = useState(() => slugifyRepositoryName(fallbackName));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!groupId) {
      setError("Select a team workspace first — a repository belongs to a team.");
      return;
    }
    if (!name.trim()) return;

    setSaving(true);
    setError("");
    try {
      await createDevFlowRepository({ groupId, projectId, name: name.trim() });
      onCreated();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="pm-tab-panel pm-tab-panel--padded">
      <div className="row gap-2" style={{ alignItems: "center", marginBottom: 6 }}>
        <IconGitHub size={16} />
        <strong>No repository yet</strong>
      </div>
      <p style={{ color: "var(--text-3)", fontSize: 13, margin: "0 0 14px" }}>
        A developer cannot start a build run until this project has a repository to deliver into.
      </p>

      <div className="row gap-2" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
        <Field label="Repository name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="acme-logistics-platform"
            style={{ minWidth: 280 }}
          />
        </Field>
        <Button
          variant="primary"
          size="sm"
          icon={<IconPlus size={13} />}
          onClick={submit}
          disabled={saving || !name.trim()}
        >
          {saving ? "Creating..." : "Create repository"}
        </Button>
      </div>

      {error && <div style={{ color: "#FCA5A5", fontSize: 13, marginTop: 12 }}>{compactDevFlowError(error)}</div>}
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
  onChanged,
}: {
  repository: DevFlowRepository;
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
    <Card className="pm-tab-panel pm-tab-panel--padded">
      <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <strong>{repository.fullName || repository.name}</strong>
          <p style={{ color: "var(--text-2)", margin: "6px 0 0", fontSize: 13 }}>
            {repository.group.name} · {repository.defaultBranch}
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

      {repository.htmlUrl && (
        <div className="row gap-2" style={{ marginTop: 16, flexWrap: "wrap" }}>
          <a className="btn btn-secondary btn-sm" href={repository.htmlUrl} target="_blank" rel="noreferrer">
            <IconGitHub size={14} /> Open on GitHub
          </a>
        </div>
      )}
    </Card>
  );
}
