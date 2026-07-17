"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Select, Textarea, useToast } from "@/shared/components/ui";
import { IconGitHub, IconPlus, IconRefresh, IconUsers } from "@/shared/components/icons";
import {
  archiveDevFlowGroup,
  assignDevFlowRepository,
  createDevFlowGroup,
  getDevFlowGithubStatus,
  inviteDevFlowGroupMember,
  listDevFlowGroupEligibleUsers,
  listDevFlowGroups,
  listDevFlowRepositories,
  removeDevFlowGroupMember,
  reopenDevFlowGroup,
  revokeDevFlowRepositoryAssignment,
  updateDevFlowGroupMemberRole,
  type DevFlowGroup,
  type DevFlowGroupPerson,
  type DevFlowGroupRole,
  type DevFlowRepository,
} from "@/shared/api/devflow-api";

const MANAGED_ROLES: Exclude<DevFlowGroupRole, "LEAD">[] = ["DELEGATED_LEAD", "MEMBER", "VIEWER"];

export function PMGroupsView() {
  const [groups, setGroups] = useState<DevFlowGroup[]>([]);
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [eligible, setEligible] = useState<DevFlowGroupPerson[]>([]);
  const [form, setForm] = useState({ name: "", businessUnit: "", description: "" });
  const [invite, setInvite] = useState({ userId: "", role: "MEMBER" as Exclude<DevFlowGroupRole, "LEAD"> });
  const [assignmentUsers, setAssignmentUsers] = useState<Record<string, string>>({});
  const [githubStatus, setGithubStatus] = useState<Awaited<ReturnType<typeof getDevFlowGithubStatus>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const router = useRouter();

  const selected = useMemo(
    () => groups.find((group) => group.id === selectedId) ?? groups[0] ?? null,
    [groups, selectedId],
  );
  const groupRepositories = repositories.filter((repository) => repository.groupId === selected?.id);
  const developers = selected?.members.filter((member) => member.user.role === "DEV") ?? [];

  const refresh = useCallback(async (preferredId?: string) => {
    setError("");
    try {
      const [nextGroups, nextRepositories, nextGithubStatus] = await Promise.all([
        listDevFlowGroups(),
        listDevFlowRepositories(),
        getDevFlowGithubStatus(),
      ]);
      setGroups(nextGroups);
      setRepositories(nextRepositories);
      setGithubStatus(nextGithubStatus);
      setSelectedId((current) => preferredId || current || nextGroups[0]?.id || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!selected?.id || selected.status === "ARCHIVED") {
      setEligible([]);
      return;
    }
    listDevFlowGroupEligibleUsers(selected.id).then(setEligible).catch(() => setEligible([]));
  }, [selected?.id, selected?.updatedAt, selected?.status]);

  const createGroup = async () => {
    if (form.name.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const group = await createDevFlowGroup({
        name: form.name.trim(),
        businessUnit: form.businessUnit.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setForm({ name: "", businessUnit: "", description: "" });
      await refresh(group.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusy(false);
    }
  };

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh(selected?.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pm-command-screen" data-screen-label="PM - Groups">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
        <div>
          <span className="eyebrow"><IconUsers size={14} /> Internal delivery groups</span>
          <h1 style={{ marginTop: 8 }}>Groups and repository access</h1>
          <p style={{ color: "var(--text-2)", maxWidth: 720 }}>
            Organize PMs and developers, invite known DevFlow users, and assign developers to plain GitHub repositories.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} onClick={() => void refresh(selected?.id)} disabled={busy}>
          Refresh
        </Button>
      </div>

      {error && <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 16 }}>{error}</Card>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, .8fr) minmax(0, 2fr)", gap: 18, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <div className="row gap-2" style={{ marginBottom: 14 }}><IconPlus size={15} /><strong>Create group</strong></div>
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Group name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Platform delivery" /></Field>
              <Field label="Business unit"><Input value={form.businessUnit} onChange={(event) => setForm({ ...form, businessUnit: event.target.value })} placeholder="Engineering" /></Field>
              <Field label="Description"><Textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What this group owns" /></Field>
              <Button variant="primary" onClick={() => void createGroup()} disabled={busy || form.name.trim().length < 2}>Create group</Button>
            </div>
          </Card>

          <Card style={{ padding: 10 }}>
            {groups.length === 0 ? (
              <p style={{ color: "var(--text-3)", padding: 10 }}>No internal groups yet.</p>
            ) : groups.map((group) => (
              <button
                key={group.id}
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "space-between", marginBottom: 4, background: selected?.id === group.id ? "rgba(255,255,255,.08)" : undefined }}
                onClick={() => setSelectedId(group.id)}
              >
                <span style={{ textAlign: "left" }}><strong style={{ display: "block" }}>{group.name}</strong><small style={{ color: "var(--text-3)" }}>{group._count.projects} projects · {group.members.length} members</small></span>
                <Badge tone={group.status === "ACTIVE" ? "green" : "gray"}>{group.status}</Badge>
              </button>
            ))}
          </Card>

          <Card style={{ padding: 18 }}>
            <div className="row gap-2"><IconGitHub size={15} /><strong>GitHub App</strong></div>
            <p style={{ color: "var(--text-2)", margin: "10px 0" }}>
              {githubStatus?.configured ? `Connected to ${githubStatus.owner || "the configured account"}.` : githubStatus?.reason || "Checking GitHub configuration…"}
            </p>
            <Badge tone={githubStatus?.configured ? "green" : "yellow"}>{githubStatus?.configured ? "CONNECTED" : "SETUP REQUIRED"}</Badge>
            {!githubStatus?.configured && githubStatus?.installUrl && <a className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} href={githubStatus.installUrl} target="_blank" rel="noreferrer">Install GitHub App</a>}
          </Card>
        </div>

        {selected ? (
          <div style={{ display: "grid", gap: 16 }}>
            <Card style={{ padding: 20 }}>
              <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
                <div>
                  <span className="eyebrow">{selected.businessUnit || "Internal group"}</span>
                  <h2 style={{ marginTop: 6 }}>{selected.name}</h2>
                  <p style={{ color: "var(--text-2)" }}>{selected.description || "No group description yet."}</p>
                </div>
                <div className="row gap-2">
                  <Button variant="primary" size="sm" onClick={() => router.push(`/pm/team/${selected.id}`)}>
                    Open team platform →
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => void run(() => selected.status === "ACTIVE" ? archiveDevFlowGroup(selected.id) : reopenDevFlowGroup(selected.id))}
                  >
                    {selected.status === "ACTIVE" ? "Archive" : "Reopen"}
                  </Button>
                </div>
              </div>
            </Card>

            <Card style={{ padding: 20 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
                <div><strong>Members</strong><p style={{ color: "var(--text-3)", marginTop: 4 }}>Only PM and developer personas can be added.</p></div>
                <Badge tone="blue">{selected.members.length}</Badge>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {selected.members.map((member) => (
                  <div key={member.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                    <div><strong>{member.user.fullName || member.user.email || member.userId}</strong><small style={{ display: "block", color: "var(--text-3)" }}>{member.user.githubLogin ? `@${member.user.githubLogin}` : "GitHub login not captured yet"}</small></div>
                    <div className="row gap-2">
                      {member.role === "LEAD" ? <Badge tone="purple">LEAD</Badge> : (
                        <Select
                          value={member.role}
                          disabled={busy || selected.status === "ARCHIVED"}
                          onChange={(event) => void run(() => updateDevFlowGroupMemberRole(selected.id, member.userId, event.target.value as Exclude<DevFlowGroupRole, "LEAD">))}
                        >
                          {MANAGED_ROLES.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
                        </Select>
                      )}
                      {member.role !== "LEAD" && <Button variant="ghost" size="sm" disabled={busy || selected.status === "ARCHIVED"} onClick={() => void run(() => removeDevFlowGroupMember(selected.id, member.userId))}>Remove</Button>}
                    </div>
                  </div>
                ))}
              </div>

              {selected.status === "ACTIVE" && (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 180px auto", gap: 10, marginTop: 18 }}>
                  <Select value={invite.userId} onChange={(event) => setInvite({ ...invite, userId: event.target.value })}>
                    <option value="">Select a PM or developer</option>
                    {eligible.map((person) => {
                      const notOnSystem = person.onSystem === false || !person.id;
                      return (
                        <option
                          key={person.id ?? person.githubLogin ?? person.email}
                          value={person.id ?? ""}
                          disabled={notOnSystem}
                        >
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
                    await inviteDevFlowGroupMember(selected.id, invite);
                    setInvite({ userId: "", role: "MEMBER" });
                    toast.success(
                      "Invitation sent",
                      `${invitee?.fullName || invitee?.email || invitee?.githubLogin || "The member"} was invited to ${selected.name}. They'll see it in their notifications.`,
                    );
                  })}>Invite</Button>
                </div>
              )}
            </Card>

            <Card style={{ padding: 20 }}>
              <div className="row gap-2" style={{ marginBottom: 14 }}><IconGitHub size={16} /><strong>Repositories</strong><Badge tone="gray">Plain structure · no CI/CD</Badge></div>
              {groupRepositories.length === 0 ? <p style={{ color: "var(--text-3)" }}>Create a project in this group to initialize its repository.</p> : groupRepositories.map((repository) => (
                <div key={repository.id} style={{ borderTop: "1px solid var(--border)", padding: "14px 0" }}>
                  <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
                    <div><strong>{repository.fullName || repository.name}</strong><small style={{ display: "block", color: "var(--text-3)" }}>{repository.project.companyName} · {repository.defaultBranch}</small></div>
                    <div className="row gap-2">
                      <Badge tone={repository.status === "ACTIVE" ? "green" : repository.status === "FAILED" ? "red" : "gray"}>{repository.status}</Badge>
                      {repository.htmlUrl && <a className="btn btn-secondary btn-sm" href={repository.htmlUrl} target="_blank" rel="noreferrer">Open GitHub</a>}
                    </div>
                  </div>
                  {developers.length > 0 && repository.status === "ACTIVE" && (
                    <div className="row gap-2" style={{ marginTop: 10 }}>
                      <Select value={assignmentUsers[repository.id] || ""} onChange={(event) => setAssignmentUsers({ ...assignmentUsers, [repository.id]: event.target.value })}>
                        <option value="">Assign a developer</option>
                        {developers.map((member) => <option key={member.userId} value={member.userId}>{member.user.fullName || member.user.email}</option>)}
                      </Select>
                      <Button variant="secondary" size="sm" disabled={busy || !assignmentUsers[repository.id]} onClick={() => void run(() => assignDevFlowRepository(repository.id, assignmentUsers[repository.id]))}>Grant access</Button>
                    </div>
                  )}
                  {repository.assignments.filter((assignment) => assignment.desiredState === "ASSIGNED").length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {repository.assignments.filter((assignment) => assignment.desiredState === "ASSIGNED").map((assignment) => (
                        <span key={assignment.id} className="row gap-2">
                          <Badge tone={assignment.effectiveState === "ACTIVE" ? "green" : assignment.effectiveState === "FAILED" ? "red" : "yellow"}>
                            {assignment.user.fullName || assignment.user.email} · {assignment.effectiveState}
                          </Badge>
                          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void run(() => revokeDevFlowRepositoryAssignment(repository.id, assignment.userId))}>Revoke</Button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          </div>
        ) : <Card style={{ padding: 24 }}>Create a group to begin.</Card>}
      </div>
    </div>
  );
}
