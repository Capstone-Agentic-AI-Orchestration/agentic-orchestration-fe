"use client";

import { usePathname, useRouter } from "next/navigation";
import { IconCheck } from "@/shared/components/icons";
import { useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";

/**
 * Switching the active team workspace, and the navigation that has to follow it.
 *
 * Extracted from the old topbar dropdown so the same behaviour can be rendered flat inside the
 * account menu: a workspace is something you *are* in, not a control the current page owns.
 */
export function useTeamWorkspaceSelection() {
  const pathname = usePathname();
  const router = useRouter();
  const { teams, teamsLoading, teamsError, selectedTeamId, selectedTeam, setSelectedTeamId } = useSelectedTeamWorkspace();

  const selectWorkspace = (teamId: string) => {
    setSelectedTeamId(teamId);

    if (pathname.startsWith("/pm/team/")) {
      const tab = new URLSearchParams(window.location.search).get("tab");
      router.push(`/pm/team/${teamId}${tab === "projects" ? "?tab=projects" : ""}`);
      return;
    }

    // Switching workspace leaves any project-scoped page, because the project belongs to the
    // team you just switched away from. /pm/orchestrate no longer exists — the wizard is
    // /dev/orchestrate now — so only the project workspace needs escaping here.
    if (pathname.startsWith("/pm/project/")) {
      router.push("/pm/projects");
    }

    if (pathname.startsWith("/dev/project/") || pathname.startsWith("/dev/orchestrate/")) {
      router.push("/dev/projects");
    }
  };

  return { teams, teamsLoading, teamsError, selectedTeamId, selectedTeam, selectWorkspace };
}

/**
 * The team list as flat menu rows, for use inside an already-open dropdown. A nested dropdown
 * would be the obvious translation of the old topbar trigger and the wrong one — two layers of
 * popover to change one value.
 */
export function TeamWorkspaceMenuSection({ onSelected }: { onSelected?: () => void }) {
  const { teams, teamsLoading, teamsError, selectedTeamId, selectWorkspace } = useTeamWorkspaceSelection();

  let body;
  if (teamsError) {
    body = <div className="cs-menu-note is-error">Team load failed</div>;
  } else if (teamsLoading) {
    body = <div className="cs-menu-note">Loading teams...</div>;
  } else if (teams.length === 0) {
    body = <div className="cs-menu-note">No teams</div>;
  } else {
    body = teams.map((team) => (
      <button
        key={team.id}
        type="button"
        role="radio"
        aria-checked={team.id === selectedTeamId}
        className={`cs-menu-item cs-menu-item--choice${team.id === selectedTeamId ? " is-selected" : ""}`}
        onClick={() => {
          selectWorkspace(team.id);
          onSelected?.();
        }}
      >
        <span className="cs-menu-item-text">
          {team.name}{team.status === "ARCHIVED" ? " (Archived)" : ""}
        </span>
        {team.id === selectedTeamId && <IconCheck size={14} />}
      </button>
    ));
  }

  return (
    <div className="cs-menu-section" role="radiogroup" aria-label="Team workspace">
      <span className="cs-menu-label">Workspace</span>
      {body}
    </div>
  );
}
