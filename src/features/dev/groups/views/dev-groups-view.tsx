"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, useToast } from "@/shared/components/ui";
import {
  IconArrowRight,
  IconGitHub,
  IconRefresh,
  IconUsers,
} from "@/shared/components/icons";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import {
  listDevFlowGroups,
  listDevFlowRepositories,
  listMyDevFlowGroupInvitations,
  respondToDevFlowGroupInvitation,
  type DevFlowGroup,
  type DevFlowGroupInvitation,
  type DevFlowRepository,
} from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

const POLL_INTERVAL_MS = 20_000;
type TeamsView = "teams" | "repositories";

export function DevGroupsView() {
  const [groups, setGroups] = useState<DevFlowGroup[]>([]);
  const [invitations, setInvitations] = useState<DevFlowGroupInvitation[]>([]);
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prevInviteIds = useRef<Set<string>>(new Set());
  const view: TeamsView = searchParams.get("view") === "repositories" ? "repositories" : "teams";

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [nextGroups, nextInvitations, nextRepositories] = await Promise.all([
        listDevFlowGroups(),
        listMyDevFlowGroupInvitations(),
        listDevFlowRepositories(),
      ]);
      setGroups(nextGroups);
      setInvitations(nextInvitations);
      setRepositories(nextRepositories);
      setError("");

      const nextIds = new Set(nextInvitations.map((invitation) => invitation.id));
      if (prevInviteIds.current.size > 0) {
        const fresh = nextInvitations.filter(
          (invitation) => !prevInviteIds.current.has(invitation.id),
        );
        if (fresh.length > 0) {
          toast.info(
            fresh.length === 1
              ? "New team invitation"
              : `${fresh.length} new team invitations`,
            fresh.length === 1
              ? `You have been invited to ${fresh[0].group?.name ?? "a team"}.`
              : undefined,
          );
        }
      }
      prevInviteIds.current = nextIds;
    } catch (requestError) {
      setError(compactDevFlowError(requestError));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(true), POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const respond = async (invitationId: string, response: "accept" | "decline") => {
    setBusy(true);
    setError("");
    try {
      await respondToDevFlowGroupInvitation(invitationId, response);
      await refresh(true);
      toast.success(response === "accept" ? "Joined the team" : "Invitation declined");
    } catch (requestError) {
      setError(compactDevFlowError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const switchView = (nextView: TeamsView) => {
    router.replace(`/dev/groups?view=${nextView}`);
  };

  return (
    <div className="dev-workspace-page" data-screen-label="Developer - Teams">
      <DevPageHeader
        title="Teams"
        subtitle="See your delivery teams, pending invitations, and repositories assigned by project managers."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<IconRefresh size={14} />}
            disabled={loading}
            onClick={() => void refresh()}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      <div className="dev-view-switcher" role="tablist" aria-label="Teams views">
        <button
          type="button"
          role="tab"
          aria-selected={view === "teams"}
          className={view === "teams" ? "is-active" : ""}
          onClick={() => switchView("teams")}
        >
          <IconUsers size={14} /> Teams
          <span>{groups.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "repositories"}
          className={view === "repositories" ? "is-active" : ""}
          onClick={() => switchView("repositories")}
        >
          <IconGitHub size={14} /> Repositories
          <span>{repositories.length}</span>
        </button>
      </div>

      {error ? <Card className="dev-error-state">{error}</Card> : null}

      {view === "teams" ? (
        <TeamsList
          groups={groups}
          invitations={invitations}
          loading={loading}
          busy={busy}
          onRespond={respond}
          onOpen={(groupId) => router.push(`/dev/team/${groupId}`)}
        />
      ) : (
        <RepositoryList repositories={repositories} loading={loading} />
      )}
    </div>
  );
}

function TeamsList({
  groups,
  invitations,
  loading,
  busy,
  onRespond,
  onOpen,
}: {
  groups: DevFlowGroup[];
  invitations: DevFlowGroupInvitation[];
  loading: boolean;
  busy: boolean;
  onRespond: (id: string, response: "accept" | "decline") => void;
  onOpen: (groupId: string) => void;
}) {
  return (
    <div className="dev-teams-stack">
      <Card className="dev-list-card">
        <div className="dev-list-card-header">
          <div>
            <span className="dev-section-kicker">Access requests</span>
            <h2>Pending invitations</h2>
          </div>
          <Badge tone={invitations.length ? "blue" : "gray"}>
            {invitations.length}
          </Badge>
        </div>
        {invitations.length === 0 ? (
          <div className="dev-muted-state">You have no pending invitations.</div>
        ) : (
          <div className="dev-team-list">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="dev-team-row">
                <div>
                  <strong>{invitation.group?.name || "Delivery team"}</strong>
                  <span>Invited as {invitation.role.replaceAll("_", " ")}</span>
                </div>
                <div className="dev-row-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => onRespond(invitation.id, "decline")}
                  >
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={busy}
                    onClick={() => onRespond(invitation.id, "accept")}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="dev-list-card">
        <div className="dev-list-card-header">
          <div>
            <span className="dev-section-kicker">Membership</span>
            <h2>My teams</h2>
          </div>
          <Badge tone="gray">{groups.length}</Badge>
        </div>
        {loading && groups.length === 0 ? (
          <div className="dev-muted-state">Loading your teams…</div>
        ) : groups.length === 0 ? (
          <div className="dev-muted-state">
            A project manager must invite you before a team appears here.
          </div>
        ) : (
          <div className="dev-team-list">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className="dev-team-row dev-team-row-button"
                onClick={() => onOpen(group.id)}
              >
                <div className="dev-team-primary">
                  <strong>{group.name}</strong>
                  <span>{group.description || "Internal delivery team"}</span>
                </div>
                <span>{group.members.length} members</span>
                <span>{group._count.projects} projects</span>
                <span>{group._count.repositories} repositories</span>
                <Badge tone={group.status === "ACTIVE" ? "green" : "gray"}>
                  {group.status}
                </Badge>
                <IconArrowRight size={15} />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function RepositoryList({
  repositories,
  loading,
}: {
  repositories: DevFlowRepository[];
  loading: boolean;
}) {
  return (
    <Card className="dev-list-card">
      <div className="dev-list-card-header">
        <div>
          <span className="dev-section-kicker">GitHub access</span>
          <h2>Assigned repositories</h2>
          <p>Only repositories granted to this account are shown.</p>
        </div>
        <Badge tone="gray">{repositories.length}</Badge>
      </div>
      {loading && repositories.length === 0 ? (
        <div className="dev-muted-state">Loading assigned repositories…</div>
      ) : repositories.length === 0 ? (
        <div className="dev-muted-state">
          No repositories have been assigned to you yet.
        </div>
      ) : (
        <div className="dev-repository-list">
          {repositories.map((repository) => {
            const assignment = repository.assignments.find(
              (item) => item.desiredState === "ASSIGNED",
            );
            return (
              <div key={repository.id} className="dev-repository-row">
                <div className="dev-repository-icon"><IconGitHub size={16} /></div>
                <div className="dev-repository-primary">
                  <strong>{repository.fullName || repository.name}</strong>
                  <span>
                    {repository.project.companyName} · {repository.group.name} ·{" "}
                    {repository.defaultBranch}
                  </span>
                </div>
                <Badge
                  tone={
                    assignment?.effectiveState === "ACTIVE"
                      ? "green"
                      : assignment?.effectiveState === "FAILED"
                        ? "red"
                        : "amber"
                  }
                >
                  {assignment?.effectiveState || repository.status}
                </Badge>
                {repository.htmlUrl ? (
                  <a
                    className="btn btn-secondary btn-sm"
                    href={repository.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open GitHub
                  </a>
                ) : (
                  <span className="dev-repository-pending">Link pending</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
