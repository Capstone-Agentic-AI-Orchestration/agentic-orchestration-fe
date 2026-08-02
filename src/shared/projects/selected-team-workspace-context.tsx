"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { listDevFlowGroups, type DevFlowGroup } from "@/shared/api/devflow-api";

interface SelectedTeamWorkspaceContextValue {
  teams: DevFlowGroup[];
  teamsLoading: boolean;
  teamsError: string;
  refreshTeams: () => Promise<void>;
  selectedTeamId: string | null;
  selectedTeam: DevFlowGroup | null;
  setSelectedTeamId: (teamId: string | null) => void;
}

const SelectedTeamWorkspaceContext = createContext<SelectedTeamWorkspaceContextValue | null>(null);

export function SelectedTeamWorkspaceProvider({
  storageKey = "devflow.selectedTeamWorkspaceId",
  children,
}: {
  storageKey?: string;
  children: ReactNode;
}) {
  const [teams, setTeams] = useState<DevFlowGroup[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");
  const [selectedTeamId, setSelectedTeamIdState] = useState<string | null>(null);

  const refreshTeams = useCallback(async () => {
    setTeamsLoading(true);
    setTeamsError("");
    try {
      setTeams(await listDevFlowGroups());
    } catch (error) {
      setTeams([]);
      setTeamsError(error instanceof Error ? error.message : String(error));
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setSelectedTeamIdState(saved);
    } catch {
      // Local storage is optional; selection still works in memory.
    }
  }, [storageKey]);

  useEffect(() => { void refreshTeams(); }, [refreshTeams]);

  const setSelectedTeamId = useCallback((teamId: string | null) => {
    setSelectedTeamIdState(teamId);
    try {
      if (teamId) window.localStorage.setItem(storageKey, teamId);
      else window.localStorage.removeItem(storageKey);
    } catch {
      // Local storage is optional; selection still works in memory.
    }
  }, [storageKey]);

  useEffect(() => {
    if (teamsLoading) return;
    if (teams.length === 0) {
      setSelectedTeamId(null);
      return;
    }
    if (!selectedTeamId || !teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams.find((team) => team.status === "ACTIVE")?.id ?? teams[0].id);
    }
  }, [selectedTeamId, setSelectedTeamId, teams, teamsLoading]);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? null,
    [selectedTeamId, teams],
  );

  const value = useMemo<SelectedTeamWorkspaceContextValue>(() => ({
    teams,
    teamsLoading,
    teamsError,
    refreshTeams,
    selectedTeamId,
    selectedTeam,
    setSelectedTeamId,
  }), [refreshTeams, selectedTeam, selectedTeamId, setSelectedTeamId, teams, teamsError, teamsLoading]);

  return <SelectedTeamWorkspaceContext.Provider value={value}>{children}</SelectedTeamWorkspaceContext.Provider>;
}

export function useSelectedTeamWorkspace() {
  const context = useContext(SelectedTeamWorkspaceContext);
  if (!context) {
    throw new Error("useSelectedTeamWorkspace must be used inside SelectedTeamWorkspaceProvider");
  }
  return context;
}
