"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  buildTeamStepState,
  type TeamAssignableRole,
  type TeamProfileSearchResult,
  type TeamStepState,
} from "@/features/orchestration/model/team-step";
import type { OrchestratorWizardContextValue } from "@/features/orchestration/view-model/use-orchestrator-wizard-view-model";
import {
  addDevFlowProjectMember,
  removeDevFlowProjectMember,
  searchDevFlowProfiles,
} from "@/shared/api/devflow-api";

export interface TeamStepViewModel extends TeamStepState {
  projectId: string;
  query: string;
  selectedRole: TeamAssignableRole;
  searching: boolean;
  adding: boolean;
  error: string;
  canSearch: boolean;
  actions: {
    setQuery: (value: string) => void;
    onQueryChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    setSelectedRole: (value: TeamAssignableRole) => void;
    onRoleChange: (event: ChangeEvent<HTMLSelectElement>) => void;
    search: () => Promise<void>;
    add: (userId: string) => Promise<void>;
    remove: (userId: string) => Promise<void>;
  };
}

export function useTeamStepViewModel(ctx: OrchestratorWizardContextValue): TeamStepViewModel {
  const { project, projectId, refresh } = ctx;
  const members = project?.members ?? [];
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<TeamProfileSearchResult[]>([]);
  const [selectedRole, setSelectedRole] = useState<TeamAssignableRole>("DEV");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const state = buildTeamStepState({ members, results });
  const canSearch = query.trim().length > 0;

  const search = async () => {
    if (!canSearch) return;
    setSearching(true);
    setError("");
    try {
      const profiles = await searchDevFlowProfiles({ q: query.trim() });
      setResults(profiles.map((profile) => ({
        userId: profile.id,
        fullName: profile.fullName,
        email: profile.email,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  };

  const add = async (userId: string) => {
    setAdding(true);
    setError("");
    try {
      await addDevFlowProjectMember(projectId, { userId, role: selectedRole });
      setResults((prev) => prev.filter((profile) => profile.userId !== userId));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  };

  const remove = async (userId: string) => {
    setError("");
    try {
      await removeDevFlowProjectMember(projectId, userId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return {
    ...state,
    projectId,
    query,
    selectedRole,
    searching,
    adding,
    error,
    canSearch,
    actions: {
      setQuery,
      onQueryChange: (event) => setQuery(event.target.value),
      onSearchKeyDown: (event) => {
        if (event.key === "Enter") {
          void search();
        }
      },
      setSelectedRole,
      onRoleChange: (event) => setSelectedRole(event.target.value as TeamAssignableRole),
      search,
      add,
      remove,
    },
  };
}
