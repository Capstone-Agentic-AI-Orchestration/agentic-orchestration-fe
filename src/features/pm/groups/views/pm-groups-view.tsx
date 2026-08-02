"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Select, useToast } from "@/shared/components/ui";
import { IconRefresh, IconUsers } from "@/shared/components/icons";
import {
  inviteDevFlowGroupMember,
  listDevFlowGroupEligibleUsers,
  removeDevFlowGroupMember,
  updateDevFlowGroupMemberRole,
  type DevFlowGroupPerson,
  type DevFlowGroupRole,
} from "@/shared/api/devflow-api";
import { useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";

const MANAGED_ROLES: Exclude<DevFlowGroupRole, "LEAD">[] = ["DELEGATED_LEAD", "MEMBER", "VIEWER"];

export function PMGroupsView() {
  const { selectedTeam, teamsError, teamsLoading, refreshTeams } = useSelectedTeamWorkspace();
  const [eligible, setEligible] = useState<DevFlowGroupPerson[]>([]);
  const [invite, setInvite] = useState({ userId: "", role: "MEMBER" as Exclude<DevFlowGroupRole, "LEAD"> });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    setInvite({ userId: "", role: "MEMBER" });
    if (!selectedTeam?.id || selectedTeam.status === "ARCHIVED") {
      setEligible([]);
      return;
    }
    listDevFlowGroupEligibleUsers(selectedTeam.id).then(setEligible).catch(() => setEligible([]));
  }, [selectedTeam?.id, selectedTeam?.status, selectedTeam?.updatedAt]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await refreshTeams();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pm-command-screen" data-screen-label="PM - Team members">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div>
          <span className="eyebrow"><IconUsers size={14} /> {selectedTeam?.name || "Team workspace"}</span>
          <h1 style={{ marginTop: 8 }}>Members</h1>
          <p style={{ color: "var(--text-2)", maxWidth: 720 }}>
            Manage the people inside the workspace selected in the header.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} onClick={() => void refreshTeams()} disabled={busy || teamsLoading}>
          Refresh
        </Button>
      </div>

      {(error || teamsError) && <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 16 }}>{error || teamsError}</Card>}

      {teamsLoading && !selectedTeam ? (
        <Card style={{ padding: 24, color: "var(--text-3)" }}>Loading workspace members…</Card>
      ) : !selectedTeam ? (
        <Card style={{ padding: 24, color: "var(--text-3)" }}>No team workspace is available.</Card>
      ) : (
        <Card style={{ padding: 20 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <strong>Workspace members</strong>
              <p style={{ color: "var(--text-3)", marginTop: 4 }}>Only PM and developer personas can be added.</p>
            </div>
            <Badge tone="blue">{selectedTeam.members.length}</Badge>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {selectedTeam.members.map((member) => (
              <div key={member.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div>
                  <strong>{member.user.fullName || member.user.email || member.userId}</strong>
                  <small style={{ display: "block", color: "var(--text-3)" }}>{member.user.githubLogin ? `@${member.user.githubLogin}` : "GitHub login not captured yet"}</small>
                </div>
                <div className="row gap-2">
                  {member.role === "LEAD" ? (
                    <Badge tone="purple">LEAD</Badge>
                  ) : (
                    <Select
                      value={member.role}
                      disabled={busy || selectedTeam.status === "ARCHIVED"}
                      onChange={(event) => void run(() => updateDevFlowGroupMemberRole(selectedTeam.id, member.userId, event.target.value as Exclude<DevFlowGroupRole, "LEAD">))}
                    >
                      {MANAGED_ROLES.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
                    </Select>
                  )}
                  {member.role !== "LEAD" && (
                    <Button variant="ghost" size="sm" disabled={busy || selectedTeam.status === "ARCHIVED"} onClick={() => void run(() => removeDevFlowGroupMember(selectedTeam.id, member.userId))}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedTeam.status === "ACTIVE" && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 180px auto", gap: 10, marginTop: 18 }}>
              <Select value={invite.userId} onChange={(event) => setInvite({ ...invite, userId: event.target.value })}>
                <option value="">Select a PM or developer</option>
                {eligible.map((person) => {
                  const notOnSystem = person.onSystem === false || !person.id;
                  return (
                    <option key={person.id ?? person.githubLogin ?? person.email} value={person.id ?? ""} disabled={notOnSystem}>
                      {notOnSystem
                        ? `${person.githubLogin ?? person.email} · ${person.role} — not on DevFlow yet`
                        : `${person.fullName || person.email || person.githubLogin} · ${person.role}`}
                    </option>
                  );
                })}
              </Select>
              <Select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value as Exclude<DevFlowGroupRole, "LEAD"> })}>
                {MANAGED_ROLES.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
              </Select>
              <Button variant="primary" disabled={busy || !invite.userId} onClick={() => void run(async () => {
                const invitee = eligible.find((person) => person.id === invite.userId);
                await inviteDevFlowGroupMember(selectedTeam.id, invite);
                setInvite({ userId: "", role: "MEMBER" });
                toast.success("Invitation sent", `${invitee?.fullName || invitee?.email || invitee?.githubLogin || "The member"} was invited to ${selectedTeam.name}.`);
              })}>
                Invite
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
