"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/shared/components/ui";
import {
  IconArrowLeft,
  IconGitHub,
  IconRefresh,
  IconUsers,
} from "@/shared/components/icons";
import {
  listDevFlowGroups,
  listDevFlowProjects,
  listDevFlowRepositories,
  type DevFlowGroup,
  type DevFlowProjectSummary,
  type DevFlowRepository,
} from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";

const POLL_INTERVAL_MS = 20_000;
type TeamTab = "overview" | "members" | "projects" | "repositories";

const TEAM_TABS: Array<{ id: TeamTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "projects", label: "Projects" },
  { id: "repositories", label: "Repositories" },
];

export function DevTeamView({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TeamTab>("overview");
  const [group, setGroup] = useState<DevFlowGroup | null>(null);
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [projects, setProjects] = useState<DevFlowProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [groups, allRepositories, allProjects] = await Promise.all([
        listDevFlowGroups(),
        listDevFlowRepositories(),
        listDevFlowProjects(),
      ]);
      setGroup(groups.find((item) => item.id === groupId) ?? null);
      setRepositories(
        allRepositories.filter((repository) => repository.groupId === groupId),
      );
      setProjects(allProjects.filter((project) => project.groupId === groupId));
      setError("");
    } catch (requestError) {
      setError(compactDevFlowError(requestError));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [groupId]);

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

  return (
    <div className="dev-workspace-page dev-team-detail" data-screen-label="Developer - Team">
      <button
        type="button"
        className="dev-back-link"
        onClick={() => router.push("/dev/groups?view=teams")}
      >
        <IconArrowLeft size={14} /> Back to teams
      </button>

      <header className="dev-team-detail-header">
        <div>
          <span className="dev-section-kicker">Delivery team</span>
          <h1>{group?.name ?? (loading ? "Loading team…" : "Team unavailable")}</h1>
          <p>{group?.description || "The internal delivery team you work with."}</p>
        </div>
        <div className="dev-row-actions">
          {group ? (
            <Badge tone={group.status === "ACTIVE" ? "green" : "gray"}>
              {group.status}
            </Badge>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            icon={<IconRefresh size={14} />}
            disabled={loading}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        </div>
      </header>

      {error ? <Card className="dev-error-state">{error}</Card> : null}

      <nav className="dev-detail-tabs" aria-label="Team details">
        {TEAM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "is-active" : ""}
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {loading && !group ? (
        <Card className="dev-muted-state">Loading team workspace…</Card>
      ) : !group ? (
        <Card className="dev-muted-state">
          This team is not available to your account.
        </Card>
      ) : activeTab === "overview" ? (
        <TeamOverview group={group} projects={projects} repositories={repositories} />
      ) : activeTab === "members" ? (
        <TeamMembers group={group} />
      ) : activeTab === "projects" ? (
        <TeamProjects projects={projects} onOpen={(id) => router.push(`/dev/project/${id}`)} />
      ) : (
        <TeamRepositories repositories={repositories} />
      )}
    </div>
  );
}

function TeamOverview({
  group,
  projects,
  repositories,
}: {
  group: DevFlowGroup;
  projects: DevFlowProjectSummary[];
  repositories: DevFlowRepository[];
}) {
  return (
    <div className="dev-team-overview-grid">
      <Card className="dev-overview-card">
        <span className="dev-section-kicker">At a glance</span>
        <h2>Your team workspace</h2>
        <p>
          Project managers control membership and repository access. This view shows
          only resources assigned to your account.
        </p>
        <div className="dev-team-stat-grid">
          <div><strong>{group.members.length}</strong><span>Members</span></div>
          <div><strong>{projects.length}</strong><span>Projects</span></div>
          <div><strong>{repositories.length}</strong><span>Repositories</span></div>
        </div>
      </Card>
      <Card className="dev-overview-card">
        <span className="dev-section-kicker">Team owner</span>
        <h2>{group.owner.fullName || group.owner.email || "Project manager"}</h2>
        <p>{group.businessUnit || "Internal delivery organization"}</p>
        <div className="dev-team-owner-icon"><IconUsers size={20} /></div>
      </Card>
    </div>
  );
}

function TeamMembers({ group }: { group: DevFlowGroup }) {
  return (
    <Card className="dev-list-card">
      <div className="dev-list-card-header">
        <div><span className="dev-section-kicker">People</span><h2>Members</h2></div>
        <Badge tone="gray">{group.members.length}</Badge>
      </div>
      <div className="dev-team-list">
        {group.members.map((member) => (
          <div key={member.id} className="dev-team-row">
            <div className="dev-member-avatar">
              {(member.user.fullName || member.user.email || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="dev-team-primary">
              <strong>{member.user.fullName || member.user.email}</strong>
              <span>{member.user.email}</span>
            </div>
            <Badge tone={member.role === "LEAD" ? "purple" : "gray"}>
              {member.role.replaceAll("_", " ")}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TeamProjects({
  projects,
  onOpen,
}: {
  projects: DevFlowProjectSummary[];
  onOpen: (id: string) => void;
}) {
  return (
    <Card className="dev-list-card">
      <div className="dev-list-card-header">
        <div><span className="dev-section-kicker">Assignments</span><h2>Projects</h2></div>
        <Badge tone="gray">{projects.length}</Badge>
      </div>
      {projects.length === 0 ? (
        <div className="dev-muted-state">No visible projects in this team.</div>
      ) : (
        <div className="dev-team-list">
          {projects.map((project) => (
            <div key={project.id} className="dev-team-row">
              <div className="dev-team-primary">
                <strong>{project.companyName}</strong>
                <span>{project.lifecycle.nextAction}</span>
              </div>
              <Badge tone={project.lifecycle.tone}>{project.lifecycle.label}</Badge>
              <Button variant="secondary" size="sm" onClick={() => onOpen(project.id)}>
                Open
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TeamRepositories({
  repositories,
}: {
  repositories: DevFlowRepository[];
}) {
  return (
    <Card className="dev-list-card">
      <div className="dev-list-card-header">
        <div><span className="dev-section-kicker">GitHub access</span><h2>Repositories</h2></div>
        <Badge tone="gray">{repositories.length}</Badge>
      </div>
      {repositories.length === 0 ? (
        <div className="dev-muted-state">No repositories assigned in this team.</div>
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
                  <span>{repository.project.companyName} · {repository.defaultBranch}</span>
                </div>
                <Badge tone={assignment?.effectiveState === "ACTIVE" ? "green" : "amber"}>
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
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
