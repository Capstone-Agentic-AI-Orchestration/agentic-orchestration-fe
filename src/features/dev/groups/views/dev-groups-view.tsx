"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/shared/components/ui";
import { IconRefresh, IconUsers } from "@/shared/components/icons";
import {
  listDevFlowGroups,
  listMyDevFlowGroupInvitations,
  respondToDevFlowGroupInvitation,
  type DevFlowGroup,
  type DevFlowGroupInvitation,
} from "@/shared/api/devflow-api";

export function DevGroupsView() {
  const [groups, setGroups] = useState<DevFlowGroup[]>([]);
  const [invitations, setInvitations] = useState<DevFlowGroupInvitation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    setError("");
    try {
      const [nextGroups, nextInvitations] = await Promise.all([listDevFlowGroups(), listMyDevFlowGroupInvitations()]);
      setGroups(nextGroups);
      setInvitations(nextInvitations);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    }
  };

  useEffect(() => { void refresh(); }, []);

  const respond = async (invitationId: string, response: "accept" | "decline") => {
    setBusy(true);
    setError("");
    try {
      await respondToDevFlowGroupInvitation(invitationId, response);
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-screen-label="Developer - Groups">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <div><span className="eyebrow"><IconUsers size={14} /> Internal groups</span><h1 style={{ marginTop: 8 }}>Your delivery groups</h1><p style={{ color: "var(--text-2)" }}>Accept PM invitations and see the internal teams you work with.</p></div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} onClick={() => void refresh()}>Refresh</Button>
      </div>
      {error && <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 14 }}>{error}</Card>}
      {invitations.length > 0 && (
        <Card style={{ padding: 20, marginBottom: 16 }}>
          <strong>Pending invitations</strong>
          {invitations.map((invitation) => (
            <div key={invitation.id} className="row" style={{ justifyContent: "space-between", padding: "14px 0", borderTop: "1px solid var(--border)", marginTop: 10 }}>
              <div><strong>{invitation.group?.name}</strong><small style={{ display: "block", color: "var(--text-3)" }}>Invited as {invitation.role.replaceAll("_", " ")}</small></div>
              <div className="row gap-2"><Button variant="ghost" size="sm" disabled={busy} onClick={() => void respond(invitation.id, "decline")}>Decline</Button><Button variant="primary" size="sm" disabled={busy} onClick={() => void respond(invitation.id, "accept")}>Accept</Button></div>
            </div>
          ))}
        </Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {groups.map((group) => (
          <Card key={group.id} style={{ padding: 20 }}>
            <div className="row" style={{ justifyContent: "space-between" }}><strong>{group.name}</strong><Badge tone={group.status === "ACTIVE" ? "green" : "gray"}>{group.status}</Badge></div>
            <p style={{ color: "var(--text-2)", margin: "10px 0 14px" }}>{group.description || "Internal delivery group"}</p>
            <small style={{ color: "var(--text-3)" }}>{group.members.length} members · {group._count.repositories} repositories</small>
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {group.members.map((member) => <Badge key={member.id} tone="gray">{member.user.fullName || member.user.email} · {member.role.replaceAll("_", " ")}</Badge>)}
            </div>
          </Card>
        ))}
        {groups.length === 0 && invitations.length === 0 && <Card style={{ padding: 24 }}><strong>No groups yet</strong><p style={{ color: "var(--text-3)", marginTop: 6 }}>A project manager must invite you before a group appears here.</p></Card>}
      </div>
    </div>
  );
}
