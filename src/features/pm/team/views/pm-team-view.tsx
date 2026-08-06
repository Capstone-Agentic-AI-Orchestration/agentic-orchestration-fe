"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Select, Tabs, Textarea, useToast } from "@/shared/components/ui";
import { IconArrowLeft, IconGitHub, IconPlus, IconRefresh, IconUsers } from "@/shared/components/icons";
import {
  assignDevFlowRepository,
  createDevFlowProject,
  inviteDevFlowGroupMember,
  listDevFlowGroupEligibleUsers,
  listDevFlowGroups,
  listDevFlowProjects,
  listDevFlowRepositories,
  removeDevFlowGroupMember,
  revokeDevFlowRepositoryAssignment,
  updateDevFlowGroupMemberRole,
  type DevFlowGroupPerson,
  type DevFlowGroupRole,
  type DevFlowGroup,
  type DevFlowProjectSummary,
  type DevFlowRepository,
} from "@/shared/api/devflow-api";
import { pmProjectRoute } from "@/features/pm/projects/model/pm-projects-list";
import { useDevFlowClients } from "@/shared/hooks/use-devflow-clients";
import { teamHasDeveloper } from "@/features/pm/projects/model/team-readiness";
import { useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";

const EMPTY_FORM = {
  clientId: "",
  companyName: "",
  brief: "",
  stackKey: "nextjs-nestjs-supabase",
  repositoryName: "",
  includeMobile: false,
  backendStack: "nest",
  frontendStack: "next",
  mobileStack: "expo",
};

const STACK_LABELS: Record<string, string> = {
  nest: "NestJS", node: "Node / Express",
  next: "Next.js", react: "React (Vite)",
  expo: "Expo", "react-native": "React Native CLI",
};

const MANAGED_ROLES: Exclude<DevFlowGroupRole, "LEAD">[] = ["DELEGATED_LEAD", "MEMBER", "VIEWER"];

export function PMTeamView({ groupId }: { groupId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { setSelectedTeamId } = useSelectedTeamWorkspace();
  const { refreshProjects: refreshWorkspaceProjects } = useSelectedDevFlowProject();
  const [group, setGroup] = useState<DevFlowGroup | null>(null);
  const [projects, setProjects] = useState<DevFlowProjectSummary[]>([]);
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [eligible, setEligible] = useState<DevFlowGroupPerson[]>([]);
  const [invite, setInvite] = useState({ userId: "", role: "MEMBER" as Exclude<DevFlowGroupRole, "LEAD"> });
  const [assignmentUsers, setAssignmentUsers] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"members" | "projects">("members");
  // A project is created for a client, so this wizard needs the client list even though it is
  // scoped to a team. Team and client are independent: the team is who builds it, the client is
  // who it is for.
  const { clients, loading: clientsLoading } = useDevFlowClients();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [groups, allProjects, repos] = await Promise.all([
        listDevFlowGroups(),
        listDevFlowProjects(),
        listDevFlowRepositories(),
      ]);
      setGroup(groups.find((g) => g.id === groupId) ?? null);
      setProjects(allProjects.filter((p) => p.groupId === groupId));
      setRepositories(repos.filter((r) => r.groupId === groupId));
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    setSelectedTeamId(groupId);
  }, [groupId, setSelectedTeamId]);

  useEffect(() => {
    const syncTabFromUrl = () => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      setActiveTab(tab === "projects" ? "projects" : "members");
    };
    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, [groupId]);

  useEffect(() => {
    if (!group?.id || group.status === "ARCHIVED") {
      setEligible([]);
      return;
    }
    listDevFlowGroupEligibleUsers(group.id).then(setEligible).catch(() => setEligible([]));
  }, [group?.id, group?.status, group?.updatedAt]);

  const developers = group?.members.filter((member) => member.user.role === "DEV") ?? [];

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusy(false);
    }
  };

  // This page creates into one fixed team, so the developer requirement is a property of the
  // page rather than a choice: with nobody to build, creation is refused outright.
  const hasDeveloper = teamHasDeveloper(group?.members);

  const ready =
    hasDeveloper &&
    form.clientId.length > 0 &&
    form.companyName.trim().length > 0 &&
    form.brief.trim().length >= 10 &&
    form.stackKey.trim().length > 0 &&
    form.repositoryName.trim().length > 0;

  const createProject = async () => {
    if (!hasDeveloper) {
      setError(
        `${group?.name ?? "This team"} has no developer, so nobody could build this project. ` +
          "Add a developer on the Members tab first — project managers cannot run the build themselves.",
      );
      return;
    }
    if (!form.clientId) {
      // Its own message because the fix may be to leave this page and add the client first,
      // unlike the other required fields which are all filled in right here.
      setError("Choose the client this project is for. Projects cannot exist without a client.");
      return;
    }
    if (!ready) {
      setError("Company, repository name, stack, and a brief of at least 10 characters are required.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const companyName = form.companyName.trim();
      await createDevFlowProject({
        clientId: form.clientId,
        companyName,
        brief: form.brief.trim(),
        stackKey: form.stackKey.trim(),
        groupId,
        repositoryName: form.repositoryName.trim(),
        repositoryDescription: `${companyName} workspace created by DevFlow`,
        includeMobile: form.includeMobile,
        backendStack: form.backendStack,
        frontendStack: form.frontendStack,
        mobileStack: form.mobileStack,
      });
      toast.success(
        "Project & repositories created",
        `Provisioning ${form.repositoryName.trim()}-be, ${form.repositoryName.trim()}-fe${form.includeMobile ? ", " + form.repositoryName.trim() + "-mobile" : ""}. A developer starts orchestration once they're ready.`,
      );
      setForm(EMPTY_FORM);
      await Promise.all([refresh(), refreshWorkspaceProjects()]);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : String(requestError);
      setError(message);
      toast.error("Could not create project", message);
    } finally {
      setCreating(false);
    }
  };

  const changeTab = (tab: string) => {
    const nextTab = tab === "projects" ? "projects" : "members";
    setActiveTab(nextTab);
    router.replace(`/pm/team/${groupId}${nextTab === "projects" ? "?tab=projects" : ""}`);
  };

  return (
    <div data-screen-label="PM - Team platform">
      <button type="button" className="auth-link auth-link-btn" onClick={() => router.push("/pm/groups")} style={{ marginBottom: 14, color: "var(--text-2)", fontSize: 13 }}>
        <IconArrowLeft size={14} /> Back to teams
      </button>

      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow"><IconUsers size={14} /> Team platform</span>
          <h1 style={{ marginTop: 8 }}>{group?.name ?? (loading ? "Loading team…" : "Team")}</h1>
          <p style={{ color: "var(--text-2)" }}>{group?.description || "Manage the people and delivery work assigned to this team workspace."}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error && <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 14 }}>{error}</Card>}

      <Tabs
        items={[
          { value: "members", label: `Members${group ? ` (${group.members.length})` : ""}` },
          { value: "projects", label: `Projects (${projects.length})` },
        ]}
        value={activeTab}
        onChange={changeTab}
      />

      {activeTab === "members" && group && (
        <Card style={{ padding: 20, marginTop: 18 }}>
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <div><strong>Members</strong><p style={{ color: "var(--text-3)", marginTop: 4 }}>Only PM and developer personas can be added.</p></div>
            <Badge tone="blue">{group.members.length}</Badge>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {group.members.map((member) => (
              <div key={member.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div><strong>{member.user.fullName || member.user.email || member.userId}</strong><small style={{ display: "block", color: "var(--text-3)" }}>{member.user.githubLogin ? `@${member.user.githubLogin}` : "GitHub login not captured yet"}</small></div>
                <div className="row gap-2">
                  {member.role === "LEAD" ? <Badge tone="purple">LEAD</Badge> : (
                    <Select
                      value={member.role}
                      disabled={busy || group.status === "ARCHIVED"}
                      onChange={(event) => void run(() => updateDevFlowGroupMemberRole(group.id, member.userId, event.target.value as Exclude<DevFlowGroupRole, "LEAD">))}
                    >
                      {MANAGED_ROLES.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
                    </Select>
                  )}
                  {member.role !== "LEAD" && <Button variant="ghost" size="sm" disabled={busy || group.status === "ARCHIVED"} onClick={() => void run(() => removeDevFlowGroupMember(group.id, member.userId))}>Remove</Button>}
                </div>
              </div>
            ))}
          </div>

          {group.status === "ACTIVE" && (
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
                await inviteDevFlowGroupMember(group.id, invite);
                setInvite({ userId: "", role: "MEMBER" });
                toast.success("Invitation sent", `${invitee?.fullName || invitee?.email || invitee?.githubLogin || "The member"} was invited to ${group.name}.`);
              })}>Invite</Button>
            </div>
          )}
        </Card>
      )}

      {activeTab === "projects" && (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)", gap: 18, alignItems: "start", marginTop: 18 }}>
        {/* Create project (scoped to this team) */}
        <Card style={{ padding: 20 }}>
          <div className="row gap-2" style={{ marginBottom: 14 }}><IconPlus size={16} /><strong>Create project</strong></div>
          <p style={{ color: "var(--text-3)", fontSize: 13, marginBottom: 14 }}>Projects created here belong to <strong>{group?.name ?? "this team"}</strong> and use its GitHub repositories.</p>
          {!hasDeveloper && (
            <div className="field-error" style={{ marginBottom: 14 }}>
              This team has no developer yet, so nobody could build a project created here. Add
              one on the Members tab first.
            </div>
          )}
          <div style={{ display: "grid", gap: 12 }}>
            {/* Client first: it is the only field that can send you somewhere else to fix it,
                so it leads rather than sitting further down the form. */}
            <Field
              label="Client *"
              helper={
                clientsLoading
                  ? "Loading clients…"
                  : clients.length
                    ? "Every project belongs to a client."
                    : "No clients yet — add one before creating a project."
              }
            >
              <Select
                value={form.clientId}
                disabled={clientsLoading || !clients.length}
                onChange={(e) => {
                  const clientId = e.target.value;
                  const picked = clients.find((option) => option.id === clientId);
                  // Prefill the project name from the client so the two cannot silently disagree,
                  // but leave it editable for a project named differently to the company.
                  setForm((current) => ({
                    ...current,
                    clientId,
                    companyName: picked && !current.companyName.trim() ? picked.name : current.companyName,
                  }));
                }}
              >
                <option value="">Select a client…</option>
                {clients.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </Select>
            </Field>
            {!clientsLoading && !clients.length && (
              <Button variant="secondary" size="sm" onClick={() => router.push("/pm/clients")}>
                Add a client first
              </Button>
            )}
            <Field label="Project name" helper="Defaults to the client name; change it if this project has its own name."><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Inc." /></Field>
            <Field label="Repository base name">
              <Input value={form.repositoryName} onChange={(e) => setForm({ ...form, repositoryName: e.target.value })} placeholder="acme-platform" />
            </Field>
            <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: -6 }}>
              Creates <strong>{(form.repositoryName || "acme-platform").replace(/-(be|fe|backend|frontend|mobile|api|web)$/i, "")}-be</strong> and <strong>{(form.repositoryName || "acme-platform").replace(/-(be|fe|backend|frontend|mobile|api|web)$/i, "")}-fe</strong>{form.includeMobile ? " and -mobile" : ""}, each scaffolded (MVVM + .gitignore).
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Backend stack">
                <Select value={form.backendStack} onChange={(e) => setForm({ ...form, backendStack: e.target.value })}>
                  <option value="nest">{STACK_LABELS.nest}</option>
                  <option value="node">{STACK_LABELS.node}</option>
                </Select>
              </Field>
              <Field label="Frontend stack">
                <Select value={form.frontendStack} onChange={(e) => setForm({ ...form, frontendStack: e.target.value })}>
                  <option value="next">{STACK_LABELS.next}</option>
                  <option value="react">{STACK_LABELS.react}</option>
                </Select>
              </Field>
            </div>
            <Field label="Brief"><Textarea value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} placeholder="What should this project deliver? (min 10 characters)" rows={4} /></Field>
            <label className="row gap-2" style={{ alignItems: "center", cursor: "pointer", fontSize: 13, color: "var(--text-2)" }}>
              <input type="checkbox" checked={form.includeMobile} onChange={(e) => setForm({ ...form, includeMobile: e.target.checked })} />
              Also create a mobile app repo
            </label>
            {form.includeMobile && (
              <Field label="Mobile stack">
                <Select value={form.mobileStack} onChange={(e) => setForm({ ...form, mobileStack: e.target.value })}>
                  <option value="expo">{STACK_LABELS.expo}</option>
                  <option value="react-native">{STACK_LABELS["react-native"]}</option>
                </Select>
              </Field>
            )}
            <Button variant="primary" disabled={creating || !ready} onClick={() => void createProject()}>
              {creating ? "Creating…" : `Create project & repos${form.includeMobile ? " (3)" : " (2)"}`}
            </Button>
          </div>
        </Card>

        {/* Projects + orchestration */}
        <div style={{ display: "grid", gap: 14 }}>
          <Card style={{ padding: 20 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <strong>Projects &amp; orchestration</strong>
              <Badge tone="gray">{projects.length}</Badge>
            </div>
            {loading && projects.length === 0 && <p style={{ color: "var(--text-3)" }}>Loading projects…</p>}
            {!loading && projects.length === 0 && <p style={{ color: "var(--text-3)" }}>No projects yet. Create one on the left to start an orchestration run.</p>}
            {projects.map((project) => (
              <div key={project.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: "14px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div>
                  <strong>{project.companyName}</strong>
                  <small style={{ display: "block", color: "var(--text-3)" }}>{project.lifecycle.label} · {project.lifecycle.nextAction}</small>
                </div>
                <div className="row gap-2">
                  <Badge tone={project.lifecycle.tone}>{project.status.replaceAll("_", " ")}</Badge>
                  <Button variant="secondary" size="sm" onClick={() => router.push(`/pm/project/${project.id}`)}>Open</Button>
                  <Button variant="primary" size="sm" onClick={() => router.push(pmProjectRoute(project))}>Open project</Button>
                </div>
              </div>
            ))}
          </Card>

          <Card style={{ padding: 20 }}>
            <div className="row gap-2" style={{ marginBottom: 10 }}><IconGitHub size={16} /><strong>Repositories</strong><Badge tone="gray">Plain structure · no CI/CD</Badge></div>
            {repositories.length === 0 ? (
              <p style={{ color: "var(--text-3)" }}>Repositories are initialized when you create a project in this team.</p>
            ) : repositories.map((repository) => (
              <div key={repository.id} className="row" style={{ justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
                <div><strong>{repository.fullName || repository.name}</strong><small style={{ display: "block", color: "var(--text-3)" }}>{repository.defaultBranch}</small></div>
                <div className="row gap-2">
                  <Badge tone={repository.status === "ACTIVE" ? "green" : repository.status === "FAILED" ? "red" : "gray"}>{repository.status}</Badge>
                  {repository.htmlUrl && <a className="btn btn-secondary btn-sm" href={repository.htmlUrl} target="_blank" rel="noreferrer">Open GitHub</a>}
                </div>
                {developers.length > 0 && repository.status === "ACTIVE" && (
                  <div className="row gap-2" style={{ width: "100%", marginTop: 4 }}>
                    <Select value={assignmentUsers[repository.id] || ""} onChange={(event) => setAssignmentUsers({ ...assignmentUsers, [repository.id]: event.target.value })}>
                      <option value="">Assign a developer</option>
                      {developers
                        .filter((member) => !repository.assignments.some((assignment) => assignment.desiredState === "ASSIGNED" && assignment.userId === member.userId))
                        .map((member) => <option key={member.userId} value={member.userId}>{member.user.fullName || member.user.email}</option>)}
                    </Select>
                    <Button variant="secondary" size="sm" disabled={busy || !assignmentUsers[repository.id]} onClick={() => void run(async () => {
                      const devName = developers.find((member) => member.userId === assignmentUsers[repository.id])?.user.fullName;
                      await assignDevFlowRepository(repository.id, assignmentUsers[repository.id]);
                      setAssignmentUsers((previous) => ({ ...previous, [repository.id]: "" }));
                      toast.success("Developer granted access", `${devName || "The developer"} can now see ${repository.name} in this team.`);
                    })}>Grant access</Button>
                  </div>
                )}
                {repository.assignments.filter((assignment) => assignment.desiredState === "ASSIGNED").length > 0 && (
                  <div style={{ width: "100%", marginTop: 4, display: "flex", flexWrap: "wrap", gap: 6 }}>
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
      </div>
      )}
    </div>
  );
}
