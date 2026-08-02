"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconCheck, IconChevronDown, IconUsers } from "@/shared/components/icons";
import { useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";

export function TeamWorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { teams, teamsLoading, teamsError, selectedTeamId, selectedTeam, setSelectedTeamId } = useSelectedTeamWorkspace();

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  if (teamsError) {
    return <span className="team-workspace-status is-error">Team load failed</span>;
  }

  if (teamsLoading) {
    return <span className="team-workspace-status">Loading...</span>;
  }

  if (teams.length === 0) {
    return <span className="team-workspace-status">No teams</span>;
  }

  const selectWorkspace = (teamId: string) => {
    setSelectedTeamId(teamId);
    setOpen(false);

    if (pathname.startsWith("/pm/team/")) {
      const tab = new URLSearchParams(window.location.search).get("tab");
      router.push(`/pm/team/${teamId}${tab === "projects" ? "?tab=projects" : ""}`);
      return;
    }

    if (pathname.startsWith("/pm/project/") || pathname.startsWith("/pm/orchestrate/")) {
      router.push("/pm/projects");
    }
  };

  return (
    <div ref={menuRef} className={`team-workspace-switcher${compact ? " is-compact" : ""}`}>
      <button
        type="button"
        className="team-workspace-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <IconUsers size={14} className="team-workspace-icon" />
        <span className="team-workspace-name">{selectedTeam?.name || "Select team"}</span>
        <IconChevronDown size={13} className={`team-workspace-arrow${open ? " is-open" : ""}`} />
      </button>

      {open && (
        <div className="team-workspace-menu" role="listbox" aria-label="Team workspace">
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              role="option"
              aria-selected={team.id === selectedTeamId}
              className={`team-workspace-option${team.id === selectedTeamId ? " is-selected" : ""}`}
              onClick={() => selectWorkspace(team.id)}
            >
              <span>{team.name}{team.status === "ARCHIVED" ? " (Archived)" : ""}</span>
              {team.id === selectedTeamId && <IconCheck size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
