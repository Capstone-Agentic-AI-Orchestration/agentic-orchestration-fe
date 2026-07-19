"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, useToast } from "@/shared/components/ui";
import { IconRefresh, IconUsers } from "@/shared/components/icons";
import {
  listDevFlowGroups,
  listMyDevFlowGroupInvitations,
  respondToDevFlowGroupInvitation,
  type DevFlowGroup,
  type DevFlowGroupInvitation,
} from "@/shared/api/devflow-api";

const POLL_INTERVAL_MS = 20_000;

export function DevGroupsView() {
  const [groups, setGroups] = useState<DevFlowGroup[]>([]);
  const [invitations, setInvitations] = useState<DevFlowGroupInvitation[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();
  const router = useRouter();
  const prevInviteIds = useRef<Set<string>>(new Set());

  // `silent` refreshes (polling / focus) don't toggle the loading state, so the
  // list never flickers to a spinner while it's already showing content.
  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [nextGroups, nextInvitations] = await Promise.all([
        listDevFlowGroups(),
        listMyDevFlowGroupInvitations(),
      ]);
      setGroups(nextGroups);
      setInvitations(nextInvitations);
      setError("");

      // Surface newly-arrived invitations (e.g. discovered by polling) as a toast.
      const nextIds = new Set(nextInvitations.map((i) => i.id));
      if (prevInviteIds.current.size > 0) {
        const fresh = nextInvitations.filter((i) => !prevInviteIds.current.has(i.id));
        if (fresh.length > 0) {
          toast.info(
            fresh.length === 1 ? "New team invitation" : `${fresh.length} new team invitations`,
            fresh.length === 1 ? `You've been invited to ${fresh[0].group?.name ?? "a group"}.` : undefined,
          );
        }
      }
      prevInviteIds.current = nextIds;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  // Initial load, background polling, and a refresh when the tab regains focus —
  // so an invitation sent while the developer is on this page shows up on its own.
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(true), POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
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
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusy(false);
    }
  };

  const nothingYet = groups.length === 0 && invitations.length === 0;

  return (
    <div data-screen-label="Developer - Groups">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <span className="eyebrow"><IconUsers size={14} /> Internal groups</span>
          <h1 style={{ marginTop: 8 }}>Your delivery groups</h1>
          <p style={{ color: "var(--text-2)" }}>Accept PM invitations and see the internal teams you work with.</p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error && <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 14 }}>{error}</Card>}

      {loading && nothingYet && (
        <Card style={{ padding: 24 }}><strong>Loading your groups…</strong><p style={{ color: "var(--text-3)", marginTop: 6 }}>Checking for pending invitations.</p></Card>
      )}

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
          <Card key={group.id} hover style={{ padding: 20, cursor: "pointer" }} onClick={() => router.push(`/dev/team/${group.id}`)}>
            <div className="row" style={{ justifyContent: "space-between" }}><strong>{group.name}</strong><Badge tone={group.status === "ACTIVE" ? "green" : "gray"}>{group.status}</Badge></div>
            <p style={{ color: "var(--text-2)", margin: "10px 0 14px" }}>{group.description || "Internal delivery group"}</p>
            <small style={{ color: "var(--text-3)" }}>{group.members.length} members · {group._count.repositories} repositories</small>
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {group.members.map((member) => <Badge key={member.id} tone="gray">{member.user.fullName || member.user.email} · {member.role.replaceAll("_", " ")}</Badge>)}
            </div>
            <div style={{ marginTop: 12, color: "var(--accent, #4F8BFF)", fontSize: 13 }}>Open team overview →</div>
          </Card>
        ))}
        {!loading && nothingYet && <Card style={{ padding: 24 }}><strong>No groups yet</strong><p style={{ color: "var(--text-3)", marginTop: 6 }}>A project manager must invite you before a group appears here.</p></Card>}
      </div>
    </div>
  );
}
