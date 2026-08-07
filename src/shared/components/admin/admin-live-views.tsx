// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { OrchestrationProviderStatusPanel } from "@/shared/components/orchestration/orchestration-provider-status-panel";
import { OrchestrationLiveVisualizer } from "@/shared/components/orchestration/orchestration-live-visualizer";
import { BlockingIssuePanel, GuidedActionPanel } from "@/shared/components/journey";
import { makeProjectJourneyContext } from "@/shared/journey";
import {
  createDevFlowAdminDomain,
  createDevFlowAdminRepository,
  getDevFlowAdminAuditLogs,
  getDevFlowAdminHealth,
  getDevFlowAdminUsage,
  getDevFlowPlatformSettings,
  getDevFlowOrchestrationRuns,
  getDevFlowProjectEvents,
  linkDevFlowAdminRepository,
  listDevFlowAdminDomains,
  listDevFlowAdminHandoffs,
  listDevFlowAdminRepositories,
  listDevFlowAdminUsers,
  overrideDevFlowAdminHandoff,
  updateDevFlowPlatformSetting,
  updateDevFlowAdminUserRole,
  updateDevFlowAdminUserStatus,
  verifyDevFlowAdminDomain,
} from "@/shared/api/devflow-api";
import { useDevFlowOrchestrationProviderStatus, useDevFlowProjectDirectory, useDevFlowProjectOutputs, useDevFlowProjects } from "@/shared/hooks/use-devflow-projects";
import { useAuth } from "@/shared/auth/auth-provider";
import { compactDevFlowError, devflowLifecycleView, formatDevFlowDate, projectInitials } from "@/shared/utils/devflow-projects";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowRight,
  IconBell,
  IconCheck,
  IconCloud,
  IconCode,
  IconCpu,
  IconCreditCard,
  IconDatabase,
  IconDownload,
  IconExternalLink,
  IconFileText,
  IconFolder,
  IconGitBranch,
  IconGitHub,
  IconLock,
  IconRefresh,
  IconRocket,
  IconSearch,
  IconSettings,
  IconShield,
  IconUsers,
  IconWorkflow,
} from "@/shared/components/icons";

const DOMAIN_CONTROLS = [
  { name: "alphaexplora.dev", type: "Primary app domain", status: "Planned", owner: "Platform" },
  { name: "client.alphaexplora.dev", type: "Client portal domain", status: "Planned", owner: "Client workspace" },
  { name: "api.alphaexplora.dev", type: "Backend API domain", status: "Planned", owner: "NestJS API" },
];

const ADMIN_ACTIONS = [
  "Create and suspend users",
  "Assign PM, DEV, CLIENT, and ADMIN roles",
  "Configure organization domains",
  "Connect project repositories",
  "Review delivery handoffs",
];

export function useAdminResource(loader, initialValue) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setData(await loader());
    } catch (error) {
      setError(compactDevFlowError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    loader()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) setError(compactDevFlowError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error, refresh };
}

function AdminPageHeader({ title, subtitle, actions, live = true }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
      <div>
        <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 8 }}>
          <Badge tone={live ? "green" : "amber"}>{live ? "Backend aware" : "Pending module"}</Badge>
          <Badge tone="purple">Admin control plane</Badge>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: 0, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--text-3)", fontSize: 13.5, marginTop: 6, maxWidth: 760, lineHeight: 1.5 }}>{subtitle}</p>}
      </div>
      {actions && <div className="row gap-2" style={{ alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

function StatCard({ label, value, sub, icon, tint = "#4F8BFF" }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: `${tint}22`, color: tint, border: `1px solid ${tint}44`, display: "grid", placeItems: "center" }}>{icon}</div>
      <div style={{ color: "var(--text-2)", fontSize: 12, marginTop: 14 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 800, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function StatusPill({ state }) {
  const map = {
    active: { tone: "green", label: "Active" },
    accepted: { tone: "green", label: "Accepted" },
    available: { tone: "green", label: "Available" },
    verified: { tone: "green", label: "Verified" },
    running: { tone: "blue", label: "Running" },
    pending: { tone: "amber", label: "Pending" },
    pending_verification: { tone: "amber", label: "Pending verification" },
    planned: { tone: "amber", label: "Planned" },
    failed: { tone: "red", label: "Failed" },
    disabled: { tone: "gray", label: "Disabled" },
    suspended: { tone: "red", label: "Suspended" },
    missing: { tone: "red", label: "Missing" },
    readonly: { tone: "gray", label: "Read only" },
  }[String(state || "").toLowerCase()] || { tone: "gray", label: state || "Unknown" };
  return <Badge tone={map.tone}>{map.label}</Badge>;
}

export function AdminOverviewView() {
  const router = useRouter();
  const directory = useDevFlowProjectDirectory();
  const projects = directory.projects;
  const users = useMemo(() => deriveUsers(projects), [projects]);
  const reposLinked = projects.filter((project) => project.repoUrl).length;
  const activeWorkOrders = projects.reduce((sum, project) => sum + (project.lifecycle?.signals?.activeWorkOrders || 0), 0);
  const pendingInvites = projects.flatMap((project) => project.clientInvites || []).filter((invite) => invite.status === "PENDING").length;
  const delivered = projects.filter((project) => project.status === "DELIVERED" || project.deliveryReview?.status === "ACCEPTED").length;
  const missingRepos = Math.max(0, projects.length - reposLinked);
  const adminIssues = [
    directory.error ? { title: "Project directory could not load", description: compactDevFlowError(directory.error), severity: "critical" } : null,
    missingRepos ? { title: "Projects missing repository links", description: `${missingRepos} project${missingRepos === 1 ? "" : "s"} need a repository before GitHub delivery is clear.`, severity: "warning" } : null,
    pendingInvites ? { title: "Pending client invites", description: `${pendingInvites} invite${pendingInvites === 1 ? "" : "s"} still need acceptance.`, severity: "info" } : null,
  ].filter(Boolean);
  const overviewJourney = makeProjectJourneyContext({
    role: "admin",
    project: projects.find((project) => !project.repoUrl) || projects[0] || null,
    loading: directory.loading,
    totalProjects: projects.length,
    activeCount: projects.filter((project) => project.status !== "DELIVERED").length,
    pendingActions: missingRepos + pendingInvites,
    blockers: adminIssues,
    primaryAction: { label: "Open providers", href: "/admin/providers" },
    secondaryAction: { label: "Refresh", onClick: directory.refresh, variant: "secondary", icon: <IconRefresh size={13} /> },
  });

  return (
    <div data-screen-label="Admin - Overview">
      <AdminPageHeader
        title="Platform Overview"
        subtitle="Manage the whole DevFlow operating surface: users, domains, repositories, orchestration, and delivery handoffs."
        actions={<Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={directory.refresh}>Refresh</Button>}
      />

      <GuidedActionPanel context={overviewJourney} />
      <BlockingIssuePanel issues={adminIssues} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Projects" value={directory.loading ? "..." : String(projects.length)} sub="Backend records" icon={<IconFolder size={16} />} />
        <StatCard label="Users" value={directory.loading ? "..." : String(users.length)} sub="From project memberships" icon={<IconUsers size={16} />} tint="#10B981" />
        <StatCard label="Repositories" value={directory.loading ? "..." : `${reposLinked}/${projects.length}`} sub="Repo URLs linked" icon={<IconGitHub size={16} />} tint="#A78BFA" />
        <StatCard label="Active handoffs" value={directory.loading ? "..." : String(activeWorkOrders)} sub="Agent tasks in motion" icon={<IconWorkflow size={16} />} tint="#F59E0B" />
      </div>

      {directory.error && <ErrorCard message={directory.error} />}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, .85fr)", gap: 18 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <PanelHeader title="Project control queue" subtitle="Current backend projects ordered by most recent activity." badge={`${projects.length} records`} />
          {directory.loading ? (
            <EmptyState text="Loading platform projects..." />
          ) : projects.length === 0 ? (
            <EmptyState text="No backend projects are available to this admin account yet." />
          ) : (
            projects.slice(0, 6).map((project, index) => (
              <ProjectControlRow key={project.id} project={project} border={index < Math.min(projects.length, 6) - 1} onOpen={() => router.push(`/admin/projects?project=${project.id}`)} />
            ))
          )}
        </Card>

        <div style={{ display: "grid", gap: 18 }}>
          <Card style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Admin powers</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {ADMIN_ACTIONS.map((action) => (
                <div key={action} className="row gap-2" style={{ color: "var(--text-2)", fontSize: 12.5 }}>
                  <IconCheck size={13} style={{ color: "#6EE7B7", flexShrink: 0 }} />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Attention</h3>
            <SignalRow icon={<IconUsers size={14} />} label="Pending client invites" value={String(pendingInvites)} tone={pendingInvites ? "amber" : "green"} />
            <SignalRow icon={<IconGitHub size={14} />} label="Projects missing repo links" value={String(missingRepos)} tone={missingRepos ? "amber" : "green"} />
            <SignalRow icon={<IconRocket size={14} />} label="Delivered projects" value={String(delivered)} tone="blue" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AdminUsersView() {
  const usersState = useAdminResource(() => listDevFlowAdminUsers(), []);
  const users = usersState.data;
  const [role, setRole] = useState("ALL");
  const [savingId, setSavingId] = useState("");
  const [actionError, setActionError] = useState("");
  const filtered = role === "ALL" ? users : users.filter((user) => user.role === role);
  const updateRole = async (user, nextRole) => {
    if (nextRole === user.role) return;
    setSavingId(user.id);
    setActionError("");
    try {
      await updateDevFlowAdminUserRole(user.id, nextRole);
      await usersState.refresh();
    } catch (error) {
      setActionError(compactDevFlowError(error));
    } finally {
      setSavingId("");
    }
  };
  const updateStatus = async (user, nextStatus) => {
    if (nextStatus === user.status) return;
    setSavingId(user.id);
    setActionError("");
    try {
      await updateDevFlowAdminUserStatus(user.id, nextStatus);
      await usersState.refresh();
    } catch (error) {
      setActionError(compactDevFlowError(error));
    } finally {
      setSavingId("");
    }
  };

  return (
    <div data-screen-label="Admin - Users">
      <AdminPageHeader
        title="User Management"
        subtitle="Manage platform profiles, role assignment, and account status from the admin backend."
        actions={<><Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={usersState.refresh}>Refresh</Button><Button variant="primary" size="sm" icon={<IconUsers size={13} />} disabled>Invite user</Button></>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        <StatCard label="All users" value={usersState.loading ? "..." : String(users.length)} sub="Known to admin" icon={<IconUsers size={16} />} />
        <StatCard label="PM/Admin" value={countRoles(users, ["PM", "ADMIN"])} sub="Can manage projects" icon={<IconShield size={16} />} tint="#10B981" />
        <StatCard label="Developers" value={countRoles(users, ["DEV"])} sub="Delivery members" icon={<IconCode size={16} />} tint="#A78BFA" />
        <StatCard label="Clients" value={countRoles(users, ["CLIENT"])} sub="Members or invites" icon={<IconBell size={16} />} tint="#F59E0B" />
      </div>
      {usersState.error && <ErrorCard message={usersState.error} />}
      {actionError && <ErrorCard message={actionError} />}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div className="row" style={{ padding: 18, borderBottom: "1px solid var(--border)", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>User directory</h3>
            <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 0" }}>Role and status updates are written to backend profiles and logged in admin audit.</p>
          </div>
          <select className="input select" value={role} onChange={(event) => setRole(event.target.value)} style={{ width: 160 }}>
            <option value="ALL">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="PM">PM</option>
            <option value="DEV">Developer</option>
            <option value="CLIENT">Client</option>
          </select>
        </div>
        {usersState.loading ? <EmptyState text="Loading users..." /> : filtered.length === 0 ? <EmptyState text="No users match this role filter." /> : filtered.map((user, index) => <UserRow key={`${user.id}-${user.email}`} user={user} border={index < filtered.length - 1} saving={savingId === user.id} onRoleChange={updateRole} onStatusChange={updateStatus} />)}
      </Card>
    </div>
  );
}

export function AdminProjectsView() {
  const router = useRouter();
  const directory = useDevFlowProjectDirectory();
  const projects = directory.projects;

  return (
    <div data-screen-label="Admin - Projects">
      <AdminPageHeader
        title="Project Management"
        subtitle="Platform-wide registry with lifecycle, client onboarding, active handoffs, and GitHub repository state."
        actions={<Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={directory.refresh}>Refresh</Button>}
      />
      {directory.error && <ErrorCard message={directory.error} />}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <PanelHeader title="Backend project registry" subtitle="Admins can inspect every project returned by the backend." badge={directory.loading ? "Loading" : `${projects.length} projects`} />
        {directory.loading ? <EmptyState text="Loading projects..." /> : projects.length === 0 ? <EmptyState text="No projects found." /> : projects.map((project, index) => (
          <ProjectManagementRow key={project.id} project={project} border={index < projects.length - 1} onOpen={() => router.push(`/pm/project/${project.id}`)} />
        ))}
      </Card>
    </div>
  );
}

export function AdminDomainsView() {
  const domainsState = useAdminResource(() => listDevFlowAdminDomains(), []);
  const domains = domainsState.data;
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [domainForm, setDomainForm] = useState({ name: "", type: "Client portal", target: "app.devflow.local", environment: "production" });
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const addDomain = async () => {
    setBusy(true);
    setActionError("");
    try {
      await createDevFlowAdminDomain({
        name: domainForm.name.trim(),
        type: domainForm.type.trim() || "Client portal",
        target: domainForm.target.trim() || undefined,
        environment: domainForm.environment.trim() || "production",
      });
      setDomainForm({ name: "", type: "Client portal", target: "app.devflow.local", environment: "production" });
      setDomainModalOpen(false);
      await domainsState.refresh();
    } catch (error) {
      setActionError(compactDevFlowError(error));
    } finally {
      setBusy(false);
    }
  };
  const verifyDomain = async (domain) => {
    setActionError("");
    try {
      await verifyDevFlowAdminDomain(domain.id);
      await domainsState.refresh();
    } catch (error) {
      setActionError(compactDevFlowError(error));
    }
  };

  return (
    <div data-screen-label="Admin - Domains">
      <AdminPageHeader
        title="Domain Management"
        subtitle="Plan, register, and verify client-facing domains, app domains, and API domains."
        actions={<><Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={domainsState.refresh}>Refresh</Button><Button variant="primary" size="sm" icon={<IconCloud size={13} />} onClick={() => setDomainModalOpen(true)}>Add domain</Button></>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 18 }}>
        <StatCard label="Configured domains" value={domainsState.loading ? "..." : String(domains.length)} sub="AdminDomain rows" icon={<IconCloud size={16} />} />
        <StatCard label="Verified" value={domainsState.loading ? "..." : String(domains.filter((domain) => domain.status === "VERIFIED").length)} sub="Ready for routing" icon={<IconCheck size={16} />} tint="#10B981" />
        <StatCard label="Pending" value={domainsState.loading ? "..." : String(domains.filter((domain) => domain.status !== "VERIFIED").length)} sub="Needs verification" icon={<IconLock size={16} />} tint="#F59E0B" />
      </div>
      {domainsState.error && <ErrorCard message={domainsState.error} />}
      {actionError && <ErrorCard message={actionError} />}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <PanelHeader title="Domain records" subtitle="Operational model for custom domains and routing ownership." badge={domainsState.loading ? "Loading" : `${domains.length} records`} />
          {domainsState.loading ? <EmptyState text="Loading domains..." /> : domains.length === 0 ? <EmptyState text="No domains configured yet." /> : domains.map((domain, index) => (
            <DomainRow key={domain.id} domain={domain} border={index < domains.length - 1} onVerify={() => verifyDomain(domain)} />
          ))}
        </Card>
        <Card style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Next integrations</h3>
          {["DNS provider TXT/CNAME validation", "Deployment routing for previews and production", "Automated certificate provisioning", "Domain removal safety checks"].map((item) => (
            <div key={item} className="row gap-2" style={{ color: "var(--text-2)", fontSize: 12.5, padding: "7px 0", alignItems: "flex-start" }}>
              <IconAlertTriangle size={13} style={{ color: "#FBBF24", marginTop: 2, flexShrink: 0 }} />
              <span>{item}</span>
            </div>
          ))}
        </Card>
      </div>
      <Modal
        open={domainModalOpen}
        onClose={() => setDomainModalOpen(false)}
        title="Add domain"
        footer={<><Button variant="ghost" onClick={() => setDomainModalOpen(false)}>Cancel</Button><Button variant="primary" disabled={busy || !domainForm.name.trim()} onClick={addDomain}>Save domain</Button></>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Domain name"><Input value={domainForm.name} onChange={(event) => setDomainForm({ ...domainForm, name: event.target.value })} placeholder="client.example.com" /></Field>
          <Field label="Type"><Input value={domainForm.type} onChange={(event) => setDomainForm({ ...domainForm, type: event.target.value })} /></Field>
          <Field label="Target host"><Input value={domainForm.target} onChange={(event) => setDomainForm({ ...domainForm, target: event.target.value })} /></Field>
          <Field label="Environment">
            <Select value={domainForm.environment} onChange={(event) => setDomainForm({ ...domainForm, environment: event.target.value })}>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

export function AdminRepositoriesView() {
  const router = useRouter();
  const reposState = useAdminResource(() => listDevFlowAdminRepositories(), []);
  const repositories = reposState.data;
  const [repoModalItem, setRepoModalItem] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [creatingId, setCreatingId] = useState("");
  const createRepo = async (projectId: string) => {
    setCreatingId(projectId);
    setActionError("");
    try {
      await createDevFlowAdminRepository(projectId);
      await reposState.refresh();
    } catch (error) {
      setActionError(compactDevFlowError(error));
    } finally {
      setCreatingId("");
    }
  };
  const openRepoModal = (item) => {
    setRepoModalItem(item);
    setRepoUrl(item.repoUrl || "https://github.com/");
    setActionError("");
  };
  const linkRepo = async () => {
    if (!repoModalItem) return;
    setBusy(true);
    setActionError("");
    try {
      await linkDevFlowAdminRepository(repoModalItem.projectId, repoUrl.trim());
      setRepoModalItem(null);
      await reposState.refresh();
    } catch (error) {
      setActionError(compactDevFlowError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-screen-label="Admin - Repositories">
      <AdminPageHeader
        title="GitHub Repositories"
        subtitle="Track and repair project-to-repository links created by orchestration delivery or entered by admins."
        actions={<Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={reposState.refresh}>Refresh</Button>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        <StatCard label="Projects" value={reposState.loading ? "..." : String(repositories.length)} sub="Backend projects" icon={<IconFolder size={16} />} />
        <StatCard label="Linked repos" value={reposState.loading ? "..." : String(repositories.filter((item) => item.repoUrl).length)} sub="Has repoUrl" icon={<IconGitHub size={16} />} tint="#10B981" />
        <StatCard label="Missing links" value={reposState.loading ? "..." : String(repositories.filter((item) => !item.repoUrl).length)} sub="Needs GitHub handoff" icon={<IconGitBranch size={16} />} tint="#F59E0B" />
      </div>
      {reposState.error && <ErrorCard message={reposState.error} />}
      {actionError && <ErrorCard message={actionError} />}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <PanelHeader title="Repository links" subtitle="Open linked GitHub repositories, inspect the PM project record, or assign a repo URL." badge="Admin API" />
        {reposState.loading ? <EmptyState text="Loading repositories..." /> : repositories.length === 0 ? <EmptyState text="No projects are available." /> : repositories.map((item, index) => (
          <RepoRow key={item.projectId} item={item} border={index < repositories.length - 1} creating={creatingId === item.projectId} onLink={() => openRepoModal(item)} onCreate={() => createRepo(item.projectId)} onOpenProject={() => router.push(`/pm/project/${item.projectId}`)} />
        ))}
      </Card>
      <Modal
        open={Boolean(repoModalItem)}
        onClose={() => setRepoModalItem(null)}
        title="Link repository"
        footer={<><Button variant="ghost" onClick={() => setRepoModalItem(null)}>Cancel</Button><Button variant="primary" disabled={busy || !repoUrl.trim()} onClick={linkRepo}>Save repository</Button></>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Project"><Input value={repoModalItem?.companyName || ""} readOnly /></Field>
          <Field label="GitHub repository URL"><Input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/org/repo" /></Field>
        </div>
      </Modal>
    </div>
  );
}

export function AdminHandoffsView() {
  const router = useRouter();
  const handoffsState = useAdminResource(() => listDevFlowAdminHandoffs(), []);
  const [overrideItem, setOverrideItem] = useState(null);
  const [overrideForm, setOverrideForm] = useState({ note: "Admin reviewed this handoff.", markReady: false });
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const handoffs = useMemo(() => handoffsState.data.map((handoff) => ({
    ...handoff,
    project: { id: handoff.projectId, companyName: handoff.companyName, status: handoff.projectStatus },
    lifecycle: { label: handoff.projectStatus, tone: handoff.projectStatus === "DELIVERED" ? "green" : handoff.projectStatus === "FAILED" ? "red" : "blue" },
    reviewStatus: handoff.deliveryReviewStatus,
  })), [handoffsState.data]);
  const openOverrideModal = (handoff) => {
    setOverrideItem(handoff);
    setOverrideForm({ note: "Admin reviewed this handoff.", markReady: false });
    setActionError("");
  };
  const overrideHandoff = async () => {
    if (!overrideItem) return;
    setBusy(true);
    setActionError("");
    try {
      await overrideDevFlowAdminHandoff(overrideItem.projectId, overrideForm);
      setOverrideItem(null);
      await handoffsState.refresh();
    } catch (error) {
      setActionError(compactDevFlowError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-screen-label="Admin - Handoffs">
      <AdminPageHeader
        title="Delivery Handoffs"
        subtitle="Admin view of projects moving from internal delivery to client review, revision, or accepted delivery."
        actions={<Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={handoffsState.refresh}>Refresh</Button>}
      />
      {handoffsState.error && <ErrorCard message={handoffsState.error} />}
      {actionError && <ErrorCard message={actionError} />}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <PanelHeader title="Handoff queue" subtitle="Derived from lifecycle signals, published artifacts, work orders, and delivery review state." badge={handoffsState.loading ? "Loading" : `${handoffs.length} projects`} />
        {handoffsState.loading ? <EmptyState text="Loading handoffs..." /> : handoffs.length === 0 ? <EmptyState text="No handoff records yet." /> : handoffs.map((handoff, index) => (
          <HandoffRow key={handoff.project.id} handoff={handoff} border={index < handoffs.length - 1} onOverride={() => openOverrideModal(handoff)} onOpen={() => router.push(`/pm/project/${handoff.project.id}`)} />
        ))}
      </Card>
      <Modal
        open={Boolean(overrideItem)}
        onClose={() => setOverrideItem(null)}
        title="Override handoff"
        footer={<><Button variant="ghost" onClick={() => setOverrideItem(null)}>Cancel</Button><Button variant="primary" disabled={busy || !overrideForm.note.trim()} onClick={overrideHandoff}>Save override</Button></>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Project"><Input value={overrideItem?.companyName || ""} readOnly /></Field>
          <Field label="Override note"><Textarea rows={4} value={overrideForm.note} onChange={(event) => setOverrideForm({ ...overrideForm, note: event.target.value })} /></Field>
          <label className="row gap-2" style={{ color: "var(--text-2)", fontSize: 13 }}>
            <input type="checkbox" checked={overrideForm.markReady} onChange={(event) => setOverrideForm({ ...overrideForm, markReady: event.target.checked })} />
            Mark this project as ready for client review
          </label>
        </div>
      </Modal>
    </div>
  );
}

export function AdminOrchestrationView() {
  const projectsState = useDevFlowProjects();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const selectedProject = projectsState.projects.find((project) => project.id === selectedProjectId) || projectsState.projects[0] || null;
  const effectiveProjectId = selectedProject?.id || "";
  const provider = useDevFlowOrchestrationProviderStatus(effectiveProjectId);
  const outputs = useDevFlowProjectOutputs(effectiveProjectId, { includeEvents: false, includeWorkOrders: true });
  const [runs, setRuns] = useState([]);
  const [events, setEvents] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState("");
  const latestRun = runs[0] || null;
  const executions = runs.flatMap((run) => run.executions || []);

  const refreshRuns = async (projectId = effectiveProjectId, quiet = false) => {
    if (!projectId) {
      setRuns([]);
      setEvents([]);
      setRunsLoading(false);
      setRunsError("");
      return;
    }
    if (!quiet) setRunsLoading(true);
    setRunsError("");
    try {
      const [nextRuns, nextEvents] = await Promise.all([getDevFlowOrchestrationRuns(projectId), getDevFlowProjectEvents(projectId)]);
      setRuns(nextRuns);
      setEvents(nextEvents);
    } catch (nextError) {
      setRuns([]);
      setEvents([]);
      setRunsError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      if (!quiet) setRunsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedProjectId && projectsState.projects[0]?.id) setSelectedProjectId(projectsState.projects[0].id);
  }, [projectsState.projects, selectedProjectId]);

  useEffect(() => {
    void refreshRuns(effectiveProjectId);
  }, [effectiveProjectId]);

  const refresh = () => {
    projectsState.refresh();
    provider.refresh();
    outputs.refresh();
    refreshRuns();
  };

  return (
    <div data-screen-label="Admin - Orchestration">
      <AdminPageHeader title="AI Orchestration" subtitle="Inspect provider readiness, durable run history, work orders, artifacts, and event logs." actions={<Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={refresh}>Refresh</Button>} />
      <Card style={{ padding: 22, marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Project runtime</h3>
            <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 0" }}>Choose a backend project to inspect orchestration state.</p>
          </div>
          <Field label="Project">
            <select className="input select" value={effectiveProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} style={{ minWidth: 300 }}>
              {projectsState.projects.map((project) => <option key={project.id} value={project.id}>{project.companyName}</option>)}
            </select>
          </Field>
        </div>
        {projectsState.error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 12 }}>{compactDevFlowError(projectsState.error)}</div>}
        {!projectsState.loading && !selectedProject ? (
          <div style={{ color: "var(--text-3)", fontSize: 13 }}>No backend projects are available to inspect.</div>
        ) : (
          <OrchestrationProviderStatusPanel status={provider.status} loading={projectsState.loading || provider.loading} error={provider.error ? compactDevFlowError(provider.error) : ""} compact />
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginTop: 16 }}>
          <StatCard label="Runs" value={runsLoading ? "..." : String(runs.length)} sub={latestRun ? `${latestRun.trigger} latest` : "No runs recorded"} icon={<IconCpu size={16} />} />
          <StatCard label="Executions" value={runsLoading ? "..." : String(executions.length)} sub={`${executions.filter((item) => item.status === "SUCCEEDED").length} succeeded`} icon={<IconWorkflow size={16} />} tint="#10B981" />
          <StatCard label="Running" value={String(executions.filter((item) => item.status === "RUNNING").length)} sub={latestRun?.currentNode || "No active node"} icon={<IconActivity size={16} />} tint="#F59E0B" />
          <StatCard label="Events" value={runsLoading ? "..." : String(events.length)} sub="Event log records" icon={<IconFileText size={16} />} tint="#A78BFA" />
        </div>
      </Card>
      <div style={{ marginBottom: 18 }}>
        <OrchestrationLiveVisualizer project={selectedProject} providerStatus={provider.status} runs={runs} workOrders={outputs.workOrders} artifacts={outputs.artifacts} events={events} loading={runsLoading || outputs.loading || provider.loading} />
        {outputs.error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 8 }}>{compactDevFlowError(outputs.error)}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) 360px", gap: 18 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <PanelHeader title="Run history" subtitle={`${runs.length} durable orchestration run${runs.length === 1 ? "" : "s"}`} badge={runsLoading ? "Loading" : "Live"} />
          {runsError && <div style={{ padding: 14, color: "#FCA5A5" }}>{compactDevFlowError(runsError)}</div>}
          {runsLoading ? <EmptyState text="Loading runs..." /> : runs.length === 0 ? <EmptyState text="No orchestration runs recorded." /> : runs.map((run) => <RunRow key={run.id} run={run} />)}
        </Card>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <PanelHeader title="Recent events" subtitle="Event log records from the selected project" badge={String(events.length)} />
          {events.length === 0 ? <EmptyState text="No event logs yet." /> : events.slice(0, 8).map((event) => (
            <div key={event.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: 12.5 }}>{event.nodeName}</div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{event.eventType} - {formatDevFlowDate(event.occurredAt)} - {event.runTokens} tokens</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function AdminProvidersView() {
  const projectsState = useDevFlowProjects();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const selectedProject = projectsState.projects.find((project) => project.id === selectedProjectId) || projectsState.projects[0] || null;
  const effectiveProjectId = selectedProject?.id || "";
  const provider = useDevFlowOrchestrationProviderStatus(effectiveProjectId);

  useEffect(() => {
    if (!selectedProjectId && projectsState.projects[0]?.id) setSelectedProjectId(projectsState.projects[0].id);
  }, [projectsState.projects, selectedProjectId]);

  const refresh = () => {
    projectsState.refresh();
    provider.refresh();
  };
  const providerIssues = [
    projectsState.error ? { title: "Projects could not load", description: compactDevFlowError(projectsState.error), severity: "critical" } : null,
    provider.error ? { title: "Provider status could not load", description: compactDevFlowError(provider.error), severity: "critical" } : null,
  ].filter(Boolean);
  const providerJourney = makeProjectJourneyContext({
    role: "admin",
    project: selectedProject,
    loading: projectsState.loading || provider.loading,
    totalProjects: projectsState.projects.length,
    pendingActions: provider.status?.missingRequirements?.length || 0,
    blockers: providerIssues,
    providerStatus: provider.status,
    providerError: provider.error ? compactDevFlowError(provider.error) : "",
    primaryAction: { label: "Refresh provider status", onClick: refresh, variant: "secondary", icon: <IconRefresh size={13} /> },
    secondaryAction: selectedProject ? { label: "Open project", href: `/pm/project/${selectedProject.id}`, variant: "ghost" } : undefined,
  });

  return (
    <div data-screen-label="Admin - Providers">
      <AdminPageHeader title="AI Providers" subtitle="Backend provider selection, adapter readiness, GitHub delivery configuration, and missing runtime requirements." actions={<Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={refresh}>Refresh</Button>} />
      <GuidedActionPanel context={providerJourney} />
      <BlockingIssuePanel issues={providerJourney.blockers} />
      <Card style={{ padding: 20, marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ minWidth: 260, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Project-scoped provider check</div>
            <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Provider status is protected by project access and reflects the backend orchestration runtime.</div>
          </div>
          <Field label="Project">
            <select className="input select" value={effectiveProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} style={{ minWidth: 280 }}>
              {projectsState.projects.map((project) => <option key={project.id} value={project.id}>{project.companyName}</option>)}
            </select>
          </Field>
        </div>
        {projectsState.error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactDevFlowError(projectsState.error)}</div>}
        <div style={{ marginTop: 16 }}>
          <OrchestrationProviderStatusPanel status={provider.status} loading={projectsState.loading || provider.loading} error={provider.error ? compactDevFlowError(provider.error) : ""} />
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {(provider.status?.providers || []).map((providerItem) => <ProviderCard key={providerItem.mode} provider={providerItem} />)}
        {!provider.loading && !provider.status?.providers?.length && <Card style={{ padding: 20, color: "var(--text-3)" }}>Provider adapters appear after selecting an accessible backend project.</Card>}
      </div>
    </div>
  );
}

export function AdminCostView() {
  const usageState = useAdminResource(() => getDevFlowAdminUsage(), { totals: { tokensConsumed: 0, tokenBudget: 0, budgetUtilization: 0, runCount: 0, eventCount: 0 }, projects: [], recentRuns: [] });
  const usage = usageState.data;
  const consumed = usage.totals.tokensConsumed;
  const budgetTotal = usage.totals.tokenBudget;
  const projects = usage.projects.map((project) => ({
    id: project.projectId,
    companyName: project.companyName,
    status: project.status,
    runBudget: {
      tokensConsumed: project.tokensConsumed,
      tokenBudget: project.tokenBudget,
      retryCount: project.retryCount,
      maxRetries: project.maxRetries,
    },
  }));

  return (
    <div data-screen-label="Admin - Cost">
      <AdminPageHeader title="Cost & Usage" subtitle="Token budget, orchestration run, and event volume from the admin usage API." live={Boolean(projects.length)} actions={<Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={usageState.refresh}>Refresh</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
        <StatCard label="Token budget used" value={budgetTotal ? `${Math.round((consumed / budgetTotal) * 100)}%` : "0%"} sub={`${consumed.toLocaleString()} / ${budgetTotal.toLocaleString()} tokens`} icon={<IconCreditCard size={16} />} tint="#A78BFA" />
        <StatCard label="Budgeted projects" value={usageState.loading ? "..." : String(projects.length)} sub="RunBudget rows" icon={<IconDatabase size={16} />} />
        <StatCard label="Recent runs" value={usageState.loading ? "..." : String(usage.totals.runCount)} sub={`${usage.totals.eventCount.toLocaleString()} events`} icon={<IconWorkflow size={16} />} tint="#F59E0B" />
      </div>
      {usageState.error && <ErrorCard message={usageState.error} />}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <PanelHeader title="Project token budgets" subtitle="Live when orchestration has created a run budget." badge={usageState.loading ? "Loading" : `${projects.length} projects`} />
        {usageState.loading ? <EmptyState text="Loading budget data..." /> : projects.length === 0 ? <EmptyState text="No run budgets yet." /> : projects.map((project, index) => <BudgetRow key={project.id} project={project} border={index < projects.length - 1} />)}
      </Card>
    </div>
  );
}

export function AdminAuditView() {
  const auditState = useAdminResource(() => getDevFlowAdminAuditLogs(100), []);
  const events = auditState.data;

  return (
    <div data-screen-label="Admin - Audit">
      <AdminPageHeader title="Audit Log" subtitle="Security-relevant admin actions captured by the backend audit log." actions={<Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={auditState.refresh}>Refresh</Button>} />
      {auditState.error && <ErrorCard message={auditState.error} />}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <PanelHeader title="Admin activity audit" subtitle="Role, status, domain, repository, handoff, and settings actions." badge={auditState.loading ? "Loading" : `${events.length} events`} />
        {auditState.loading ? <EmptyState text="Loading activity..." /> : events.length === 0 ? <EmptyState text="No admin audit events yet." /> : events.map((event, index) => (
          <div key={event.id} className="row" style={{ padding: "12px 16px", borderBottom: index < events.length - 1 ? "1px solid var(--border)" : 0, gap: 12, alignItems: "flex-start" }}>
            <IconFileText size={14} style={{ color: "#93C5FD", marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{event.summary}</div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{event.actor?.email || "System"} - {event.action} - {formatDevFlowDate(event.createdAt)}</div>
              {event.targetId && <div className="mono" style={{ color: "var(--text-2)", fontSize: 11.5, marginTop: 5 }}>{event.targetType}: {event.targetId}</div>}
            </div>
            <Badge tone={event.targetType === "profile" ? "purple" : event.targetType === "domain" ? "blue" : "gray"}>{event.targetType}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function AdminHealthView() {
  const healthState = useAdminResource(() => getDevFlowAdminHealth(), null);
  const health = healthState.data;
  const backendOk = Boolean(health?.ok) && !healthState.error;

  return (
    <div data-screen-label="Admin - Health">
      <AdminPageHeader title="System Health" subtitle="Operational health from the admin backend control-plane endpoint." actions={<Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={healthState.refresh}>Refresh</Button>} />
      {healthState.error && <ErrorCard message={healthState.error} />}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <PanelHeader title="Services" subtitle="Current reachable areas from the frontend session." badge={backendOk ? "Operational" : "Issue"} />
          <ServiceRow name="NestJS API" detail={healthState.loading ? "Checking..." : `${health?.services?.projects || 0} projects reachable`} ok={backendOk} />
          <ServiceRow name="Supabase Auth" detail="Session resolved through RequireAuth" ok />
          <ServiceRow name="Database" detail={health?.services?.database || "Checking database"} ok={backendOk} />
          <ServiceRow name="Orchestration runs" detail={`${health?.services?.runningRuns || 0} running - ${health?.services?.failedRuns || 0} failed`} ok={!health?.services?.failedRuns} />
        </Card>
        <Card style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Platform counts</h3>
          <SignalRow icon={<IconFolder size={14} />} label="Projects" value={String(health?.services?.projects || 0)} tone="blue" />
          <SignalRow icon={<IconUsers size={14} />} label="Profiles" value={String(health?.services?.profiles || 0)} tone="purple" />
          {(health?.domains || []).map((domain) => <SignalRow key={domain.status} icon={<IconCloud size={14} />} label={`Domains ${domain.status}`} value={String(domain._count)} tone={domain.status === "VERIFIED" ? "green" : "amber"} />)}
        </Card>
      </div>
    </div>
  );
}

export function AdminSettingsView() {
  const { devFlowUser, devFlowUserError } = useAuth();
  const settingsState = useAdminResource(() => getDevFlowPlatformSettings(), []);
  const [settingModalOpen, setSettingModalOpen] = useState(false);
  const [settingForm, setSettingForm] = useState({ key: "admin.policy", value: "{\"enabled\":true}" });
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const upsertSetting = async () => {
    setBusy(true);
    setActionError("");
    try {
      await updateDevFlowPlatformSetting(settingForm.key.trim(), JSON.parse(settingForm.value));
      setSettingModalOpen(false);
      await settingsState.refresh();
    } catch (error) {
      setActionError(error instanceof SyntaxError ? "Setting value must be valid JSON." : compactDevFlowError(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div data-screen-label="Admin - Settings">
      <AdminPageHeader title="Settings" subtitle="Admin identity is live from Supabase and platform settings are persisted by the admin backend." actions={<><Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={settingsState.refresh}>Refresh</Button><Button variant="primary" size="sm" icon={<IconSettings size={13} />} onClick={() => setSettingModalOpen(true)}>Set value</Button></>} />
      {actionError && <ErrorCard message={actionError} />}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 760px) minmax(260px, 1fr)", gap: 18 }}>
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Authenticated admin</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Name"><Input value={devFlowUser?.fullName || "Admin"} readOnly /></Field>
            <Field label="Email"><Input value={devFlowUser?.email || "No email"} readOnly /></Field>
            <Field label="Role"><Input value={devFlowUser?.role || "ADMIN"} readOnly /></Field>
            <Field label="Access"><Input value="Platform control plane" readOnly /></Field>
          </div>
          {devFlowUserError && <div style={{ color: "#FCA5A5", marginTop: 12 }}>{compactDevFlowError(devFlowUserError)}</div>}
        </Card>
        <Card style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Platform settings</h3>
          {settingsState.error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 10 }}>{settingsState.error}</div>}
          {settingsState.loading ? <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>Loading settings...</div> : settingsState.data.length === 0 ? <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>No settings saved yet.</div> : settingsState.data.map((setting) => <SignalRow key={setting.key} icon={<IconSettings size={14} />} label={setting.key} value={formatDevFlowDate(setting.updatedAt)} tone="blue" />)}
        </Card>
      </div>
      <Modal
        open={settingModalOpen}
        onClose={() => setSettingModalOpen(false)}
        title="Set platform value"
        footer={<><Button variant="ghost" onClick={() => setSettingModalOpen(false)}>Cancel</Button><Button variant="primary" disabled={busy || !settingForm.key.trim() || !settingForm.value.trim()} onClick={upsertSetting}>Save value</Button></>}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Setting key"><Input value={settingForm.key} onChange={(event) => setSettingForm({ ...settingForm, key: event.target.value })} /></Field>
          <Field label="JSON value"><Textarea rows={5} value={settingForm.value} onChange={(event) => setSettingForm({ ...settingForm, value: event.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}

function deriveUsers(projects) {
  const users = new Map();
  const add = (input) => {
    if (!input?.id && !input?.email) return;
    const key = input.id || input.email.toLowerCase();
    const existing = users.get(key) || { id: input.id || key, email: input.email || null, fullName: input.fullName || null, role: input.role || "CLIENT", projects: new Map(), invited: false };
    existing.email = existing.email || input.email || null;
    existing.fullName = existing.fullName || input.fullName || null;
    existing.role = input.role || existing.role;
    if (input.project) existing.projects.set(input.project.id, input.project);
    if (input.invited) existing.invited = true;
    users.set(key, existing);
  };

  for (const project of projects) {
    add({ ...project.createdBy, project, role: project.createdBy?.role || "PM" });
    for (const member of project.members || []) add({ ...member.user, role: member.role, project });
    for (const invite of project.clientInvites || []) add({ id: invite.acceptedById || invite.email, email: invite.email, fullName: invite.contactName, role: "CLIENT", project, invited: true });
  }

  return Array.from(users.values()).map((user) => ({ ...user, projects: Array.from(user.projects.values()) })).sort((a, b) => (a.fullName || a.email || a.id).localeCompare(b.fullName || b.email || b.id));
}

function deriveCompanyDomains(projects) {
  const seen = new Set();
  return projects.map((project) => {
    const slug = String(project.companyName || "client").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const name = `${slug || project.id}.client-domain.local`;
    if (seen.has(name)) return null;
    seen.add(name);
    return { name, type: "Inferred client domain", status: "Planned", owner: project.companyName };
  }).filter(Boolean);
}

function countRoles(users, roles) {
  return String(users.filter((user) => roles.includes(user.role)).length);
}

function PanelHeader({ title, subtitle, badge }) {
  return (
    <div className="row" style={{ padding: 18, borderBottom: "1px solid var(--border)", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {badge && <Badge tone="blue">{badge}</Badge>}
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ padding: 24, color: "var(--text-3)", fontSize: 13 }}>{text}</div>;
}

function ErrorCard({ message }) {
  return <Card style={{ padding: 16, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)", marginBottom: 18 }}>{compactDevFlowError(message)}</Card>;
}

function ProjectControlRow({ project, border, onOpen }) {
  const lifecycle = devflowLifecycleView(project);
  return (
    <button onClick={onOpen} style={{ width: "100%", display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) 150px 120px 32px", gap: 12, alignItems: "center", padding: "14px 18px", border: 0, borderBottom: border ? "1px solid var(--border)" : 0, background: "transparent", color: "white", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
      <div className="row gap-3" style={{ minWidth: 0 }}>
        <Avatar label={project.companyName} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{project.companyName}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{project.id} - updated {formatDevFlowDate(project.updatedAt)}</div>
        </div>
      </div>
      <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
      <StatusPill state={project.repoUrl ? "available" : "missing"} />
      <IconArrowRight size={14} style={{ color: "var(--text-3)" }} />
    </button>
  );
}

function UserRow({ user, border, saving, onRoleChange, onStatusChange }) {
  const label = user.fullName || user.email || user.id;
  const projectCount = user.projectCount ?? user.projects?.length ?? 0;
  return (
    <div className="row" style={{ padding: "14px 18px", borderBottom: border ? "1px solid var(--border)" : 0, gap: 12, alignItems: "center" }}>
      <Avatar label={label} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{label}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{user.email || "No email"} - {projectCount} project{projectCount === 1 ? "" : "s"}</div>
      </div>
      {user.invited && <Badge tone="amber">Invited</Badge>}
      <select className="input select" value={user.role} disabled={saving} onChange={(event) => onRoleChange(user, event.target.value)} style={{ width: 118 }}>
        <option value="ADMIN">Admin</option>
        <option value="PM">PM</option>
        <option value="DEV">Developer</option>
        <option value="CLIENT">Client</option>
      </select>
      <select className="input select" value={user.status || "ACTIVE"} disabled={saving} onChange={(event) => onStatusChange(user, event.target.value)} style={{ width: 128 }}>
        <option value="ACTIVE">Active</option>
        <option value="SUSPENDED">Suspended</option>
      </select>
    </div>
  );
}

function ProjectManagementRow({ project, border, onOpen }) {
  const lifecycle = devflowLifecycleView(project);
  return (
    <div className="row" style={{ padding: "15px 18px", borderBottom: border ? "1px solid var(--border)" : 0, gap: 14, alignItems: "center" }}>
      <Avatar label={project.companyName} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{project.companyName}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{project.stackKey} - {project.id}</div>
      </div>
      <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
      <Badge tone={project.repoUrl ? "green" : "amber"}>{project.repoUrl ? "Repo linked" : "No repo"}</Badge>
      <Button variant="secondary" size="sm" icon={<IconExternalLink size={13} />} onClick={onOpen}>Open</Button>
    </div>
  );
}

function DomainRow({ domain, border, onVerify }) {
  return (
    <div className="row" style={{ padding: "14px 18px", borderBottom: border ? "1px solid var(--border)" : 0, gap: 12, alignItems: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, display: "grid", placeItems: "center", background: "rgba(79,139,255,.12)", color: "#93C5FD", flexShrink: 0 }}><IconCloud size={15} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mono" style={{ fontWeight: 800, fontSize: 12.5 }}>{domain.name}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{domain.type} - {domain.owner || domain.environment || "Platform"}{domain.target ? ` - ${domain.target}` : ""}</div>
      </div>
      <StatusPill state={domain.status} />
      <Button variant="secondary" size="sm" disabled={domain.status === "VERIFIED"} onClick={onVerify}>Verify</Button>
    </div>
  );
}

function RepoRow({ item, border, onOpenProject, onLink, onCreate, creating }) {
  const companyName = item.project?.companyName || item.companyName;
  const projectStatus = item.status || (item.repoUrl ? "Linked" : "Missing");
  return (
    <div className="row" style={{ padding: "14px 18px", borderBottom: border ? "1px solid var(--border)" : 0, gap: 12, alignItems: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, display: "grid", placeItems: "center", background: "rgba(168,85,247,.14)", color: "#C4B5FD", flexShrink: 0 }}><IconGitHub size={15} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{companyName}</div>
        <div className="mono" style={{ color: item.repoUrl ? "#93C5FD" : "var(--text-3)", fontSize: 11.5, marginTop: 3, overflowWrap: "anywhere" }}>{item.repoUrl || "No repository URL stored"}</div>
      </div>
      <Badge tone={item.repoUrl ? "green" : "amber"}>{item.repoUrl ? "Linked" : projectStatus}</Badge>
      {item.repoUrl ? <Button variant="secondary" size="sm" icon={<IconExternalLink size={13} />} onClick={() => window.open(item.repoUrl, "_blank", "noopener,noreferrer")}>GitHub</Button> : <>
        <Button variant="secondary" size="sm" loading={creating} onClick={onCreate}>Create repo</Button>
        <Button variant="ghost" size="sm" onClick={onLink}>Link repo</Button>
      </>}
      <Button variant="ghost" size="sm" onClick={onOpenProject}>Project</Button>
    </div>
  );
}

function HandoffRow({ handoff, border, onOpen, onOverride }) {
  return (
    <div className="row" style={{ padding: "15px 18px", borderBottom: border ? "1px solid var(--border)" : 0, gap: 14, alignItems: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, display: "grid", placeItems: "center", background: "rgba(16,185,129,.12)", color: "#6EE7B7", flexShrink: 0 }}><IconRocket size={15} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{handoff.project.companyName}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{handoff.publishedArtifacts} client-visible artifacts - {handoff.activeWorkOrders} active work orders</div>
      </div>
      <Badge tone={handoff.lifecycle.tone}>{handoff.lifecycle.label}</Badge>
      <Badge tone={handoff.reviewStatus === "ACCEPTED" ? "green" : handoff.reviewStatus === "REVISION_REQUESTED" ? "amber" : "gray"}>{handoff.reviewStatus}</Badge>
      <Button variant="secondary" size="sm" onClick={onOverride}>Override</Button>
      <Button variant="secondary" size="sm" icon={<IconExternalLink size={13} />} onClick={onOpen}>Open</Button>
    </div>
  );
}

function RunRow({ run }) {
  return (
    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ color: "white", fontSize: 12, fontWeight: 800, overflowWrap: "anywhere" }}>{run.runId}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{run.trigger} - {run.currentNode || "No active node"} - {formatDevFlowDate(run.startedAt)}</div>
        </div>
        <Badge tone={run.status === "SUCCEEDED" ? "green" : run.status === "FAILED" ? "red" : run.status === "RUNNING" ? "blue" : "gray"}>{run.status}</Badge>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        <Badge tone="green">{run.completedWorkOrders} done</Badge>
        <Badge tone={run.failedWorkOrders ? "red" : "gray"}>{run.failedWorkOrders} failed</Badge>
        <Badge tone="blue">{run.completedArtifacts} artifacts</Badge>
        <Badge tone="purple">{run.providerMode}</Badge>
      </div>
    </div>
  );
}

function ProviderCard({ provider }) {
  return (
    <Card style={{ padding: 20 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{provider.displayName}</h3>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{provider.mode.toUpperCase()} adapter</div>
        </div>
        <Badge tone={provider.available ? "green" : provider.implemented ? "amber" : "gray"}>{provider.active ? "Active" : provider.available ? "Ready" : "Unavailable"}</Badge>
      </div>
      <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5, minHeight: 38 }}>{provider.reason || "Provider can execute orchestration work orders."}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <SmallFact label="Implemented" value={provider.implemented ? "Yes" : "No"} />
        <SmallFact label="Available" value={provider.available ? "Yes" : "No"} />
      </div>
      {provider.missingRequirements?.length ? <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>{provider.missingRequirements.map((requirement) => <Badge key={requirement} tone="amber">{requirement}</Badge>)}</div> : null}
    </Card>
  );
}

function BudgetRow({ project, border }) {
  const budget = project.runBudget;
  const pct = budget ? Math.round((budget.tokensConsumed / budget.tokenBudget) * 100) : 0;
  return (
    <div style={{ padding: "14px 18px", borderBottom: border ? "1px solid var(--border)" : 0 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{project.companyName}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{budget ? `${budget.tokensConsumed.toLocaleString()} / ${budget.tokenBudget.toLocaleString()} tokens` : "No run budget yet"}</div>
        </div>
        <Badge tone={pct >= 90 ? "red" : pct >= 70 ? "amber" : "green"}>{pct}%</Badge>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: "rgba(8,14,32,.7)", marginTop: 10 }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", borderRadius: 999, background: pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#10B981" }} />
      </div>
    </div>
  );
}

function ServiceRow({ name, detail, ok }) {
  return (
    <div className="row" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", gap: 12, alignItems: "center" }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: ok ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)", color: ok ? "#6EE7B7" : "#FCA5A5", display: "grid", placeItems: "center" }}>{ok ? <IconCheck size={14} /> : <IconAlertTriangle size={14} />}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{name}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{detail}</div>
      </div>
      <StatusPill state={ok ? "active" : "failed"} />
    </div>
  );
}

function SignalRow({ icon, label, value, tone }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="row gap-2" style={{ color: "var(--text-2)", fontSize: 12.5 }}>{icon}<span>{label}</span></div>
      <Badge tone={tone}>{value}</Badge>
    </div>
  );
}

function SmallFact({ label, value }) {
  return <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "rgba(8,14,32,.45)" }}><div style={{ color: "var(--text-3)", fontSize: 11 }}>{label}</div><div style={{ color: "white", fontWeight: 800, fontSize: 13, marginTop: 3 }}>{value}</div></div>;
}

function Avatar({ label }) {
  return (
    <div style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(135deg,#4F8BFF,#8B5CF6)", color: "white", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
      {projectInitials(label || "Admin")}
    </div>
  );
}
