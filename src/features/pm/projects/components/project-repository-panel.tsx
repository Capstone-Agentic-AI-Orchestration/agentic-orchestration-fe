"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Field, Input } from "@/shared/components/ui";
import { IconGitHub, IconPlus } from "@/shared/components/icons";
import {
  createDevFlowRepository,
  listDevFlowRepositories,
  type DevFlowRepository,
} from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

const POLL_INTERVAL_MS = 20_000;

/**
 * This project's repositories. Nothing else.
 *
 * It used to carry a per-repository "grant access to a developer" control, and that is gone rather
 * than moved. Access to a project's code follows project membership: a developer added on the
 * Members tab can push to every repository the project has. Two places to grant the same thing meant
 * projects with a team, a repository, and nobody able to push — because the second step was easy to
 * forget and nothing pointed out that it had been.
 *
 * One consequence worth knowing: with the per-repository controls gone, a GitHub invite that fails
 * (no linked GitHub login, an API outage) is no longer visible on this page. It is recorded on the
 * assignment and reachable through the reconcile route, but the console does not surface it here.
 *
 * Provisioning is asynchronous, so a new repository appears as PENDING and this polls until it
 * settles to ACTIVE or FAILED.
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
      {error && (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">
          {compactDevFlowError(error)}
        </Card>
      )}

      {loading && repositories.length === 0 && (
        <Card className="pm-tab-panel pm-tab-empty">Loading repositories...</Card>
      )}

      {repositories.map((repository) => (
        <RepositoryCard key={repository.id} repository={repository} />
      ))}

      {/* The empty state stays: without it a project with no repository has no way to get one, and
          a developer cannot start a build until it exists. */}
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

function RepositoryCard({ repository }: { repository: DevFlowRepository }) {
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

      {/* Provisioning failures stay. This is the repository's own state, not other content — and a
          PM who cannot see it has no way to know why nothing can be delivered. */}
      {repository.lastError && (
        <p style={{ color: "#FCA5A5", marginTop: 10, fontSize: 13 }}>{repository.lastError}</p>
      )}

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
