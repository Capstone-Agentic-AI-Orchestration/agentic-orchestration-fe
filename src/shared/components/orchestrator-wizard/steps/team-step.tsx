"use client";

import {
  avatarInitial,
  canRemoveMember,
  memberDisplayName,
  memberRoleTone,
  profileDisplayName,
  useTeamStepViewModel,
} from "@/features/orchestration";
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
  const vm = useTeamStepViewModel(ctx);

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

      {vm.error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{vm.error}</span>
        </div>
      )}

      <div className="wizard-step-section">
        <h4 style={{ margin: "0 0 10px", fontSize: "0.8125rem", fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Current Members ({vm.memberCount})
        </h4>
        {!vm.hasMembers ? (
          <div className="wizard-info-banner info">
            <IconUser size={16} />
            <span>No members assigned yet. Search and add team members below.</span>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {vm.members.map((member) => (
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
                    {avatarInitial(member.profile?.fullName) || <IconUser size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                      {memberDisplayName(member)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                      {member.profile?.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge tone={memberRoleTone(member.role)}>
                    {member.role}
                  </Badge>
                  {canRemoveMember(member) && (
                    <button
                      type="button"
                      onClick={() => vm.actions.remove(member.userId)}
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
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Search by name or email">
              <Input
                value={vm.query}
                onChange={vm.actions.onQueryChange}
                onKeyDown={vm.actions.onSearchKeyDown}
                placeholder="e.g. dev@example.com"
              />
            </Field>
          </div>
          <Field label="Role">
            <select
              className="select"
              value={vm.selectedRole}
              onChange={vm.actions.onRoleChange}
              style={{ width: "auto" }}
            >
              <option value="DEV">Developer</option>
              <option value="CLIENT">Client</option>
            </select>
          </Field>
          <Button variant="primary" size="sm" onClick={vm.actions.search} disabled={vm.searching || !vm.canSearch}>
            <IconSearch size={14} />
            {vm.searching ? "Searching…" : "Search"}
          </Button>
        </div>

        {vm.visibleResults.length > 0 && (
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {vm.visibleResults.map((profile) => (
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
                      {avatarInitial(profile.fullName) || <IconUser size={14} />}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)" }}>
                        {profileDisplayName(profile)}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>{profile.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => vm.actions.add(profile.userId)}
                    disabled={vm.adding}
                  >
                    <IconPlus size={14} />
                    Add as {vm.selectedRole}
                  </Button>
                </div>
              ))}
          </div>
        )}
      </div>

      <OrchestratorStepNav
        projectId={vm.projectId}
        currentStep="review"
        nextDisabled={false}
      />
    </div>
  );
}
