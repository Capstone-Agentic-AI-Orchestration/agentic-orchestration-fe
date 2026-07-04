// @ts-nocheck
"use client";

import { useState } from "react";
import {
  addDevFlowProjectMember,
  removeDevFlowProjectMember,
  searchDevFlowProfiles,
} from "@/shared/api/devflow-api";
import { Button, Field, Input, Badge } from "@/shared/components/ui";
import {
  IconUsers,
  IconUser,
  IconSearch,
  IconPlus,
  IconAlertTriangle,
  IconCheck,
  IconClose,
} from "@/shared/components/icons";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function TeamStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const { project, projectId, refresh } = ctx;
  const members = project?.members ?? [];
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState("DEV");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    try {
      const profiles = await searchDevFlowProfiles({ q: query.trim() });
      setResults(profiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (userId: string) => {
    setAdding(true);
    setError("");
    try {
      await addDevFlowProjectMember(projectId, { userId, role: selectedRole });
      setResults((prev) => prev.filter((p) => p.userId !== userId));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeDevFlowProjectMember(projectId, userId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const memberIds = new Set(members.map((m: any) => m.userId));

  return (
    <div>
      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">
          <IconUsers size={16} />
          Team Members
        </h3>
        <p className="wizard-step-section-desc">
          Assign developers and client members to this project. At least one team member is recommended.
        </p>
      </div>

      {error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="wizard-step-section">
        <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Current Members ({members.length})
        </h4>
        {members.length === 0 ? (
          <div className="wizard-info-banner info">
            <IconUser size={16} />
            <span>No members assigned yet. Search and add team members below.</span>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {members.map((member: any) => (
              <div
                key={member.userId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="avatar" style={{ width: 32, height: 32 }}>
                    {member.profile?.fullName?.[0]?.toUpperCase() ?? <IconUser size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                      {member.profile?.fullName ?? member.profile?.email ?? "Unknown"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                      {member.profile?.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge tone={member.role === "DEV" ? "blue" : member.role === "PM" ? "purple" : "gray"}>
                    {member.role}
                  </Badge>
                  {member.role !== "PM" && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member.userId)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-4)",
                        padding: 4,
                      }}
                      title="Remove member"
                    >
                      <IconClose size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="wizard-step-section">
        <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Add Member
        </h4>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Search by name or email" style={{ flex: 1, minWidth: 200 }}>
            <Input
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. dev@example.com"
            />
          </Field>
          <Field label="Role">
            <select
              className="select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="DEV">Developer</option>
              <option value="CLIENT">Client</option>
            </select>
          </Field>
          <Button variant="primary" size="sm" onClick={handleSearch} disabled={searching || !query.trim()}>
            <IconSearch size={14} />
            {searching ? "Searching…" : "Search"}
          </Button>
        </div>

        {results.length > 0 && (
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {results
              .filter((p) => !memberIds.has(p.userId))
              .map((profile) => (
                <div
                  key={profile.userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="avatar" style={{ width: 28, height: 28 }}>
                      {profile.fullName?.[0]?.toUpperCase() ?? <IconUser size={14} />}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)" }}>
                        {profile.fullName ?? "Unknown"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{profile.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAdd(profile.userId)}
                    disabled={adding}
                  >
                    <IconPlus size={14} />
                    Add as {selectedRole}
                  </Button>
                </div>
              ))}
          </div>
        )}
      </div>

      <OrchestratorStepNav
        projectId={projectId}
        currentStep="team"
        nextDisabled={false}
      />
    </div>
  );
}
