"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Select, Textarea, useToast } from "@/shared/components/ui";
import { IconArrowLeft, IconGitHub, IconPlus, IconRefresh, IconUsers } from "@/shared/components/icons";
import {
  createDevFlowProject,
  listDevFlowGroups,
  listDevFlowProjects,
  listDevFlowRepositories,
  type DevFlowGroup,
  type DevFlowProjectSummary,
  type DevFlowRepository,
} from "@/shared/api/devflow-api";
import { pmProjectOrchestrateRoute } from "@/features/pm/projects/model/pm-projects-list";

const EMPTY_FORM = {
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

export function PMTeamView({ groupId }: { groupId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [group, setGroup] = useState<DevFlowGroup | null>(null);
  const [projects, setProjects] = useState<DevFlowProjectSummary[]>([]);
  const [repositories, setRepositories] = useState<DevFlowRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

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

  const ready =
    form.companyName.trim().length > 0 &&
    form.brief.trim().length >= 10 &&
    form.stackKey.trim().length > 0 &&
    form.repositoryName.trim().length > 0;

  const createProject = async () => {
    if (!ready) {
      setError("Company, repository name, stack, and a brief of at least 10 characters are required.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const companyName = form.companyName.trim();
      await createDevFlowProject({
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
      await refresh();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : String(requestError);
      setError(message);
      toast.error("Could not create project", message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div data-screen-label="PM - Team platform">
      <button type="button" className="auth-link auth-link-btn" onClick={() => router.push("/pm/groups")} style={{ marginBottom: 14, color: "var(--text-2)", fontSize: 13 }}>
        <IconArrowLeft size={14} /> Back to groups
      </button>

      <div className="row" style={{ justifyContent: "space-between", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow"><IconUsers size={14} /> Team platform</span>
          <h1 style={{ marginTop: 8 }}>{group?.name ?? (loading ? "Loading team…" : "Team")}</h1>
          <p style={{ color: "var(--text-2)" }}>{group?.description || "Create projects (each gets a GitHub repository); developers start orchestration from their workspace once the repo is ready."}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} disabled={loading} onClick={() => void refresh()}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {group && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {group.members.map((member) => (
            <Badge key={member.id} tone="gray">{member.user.fullName || member.user.email} · {member.role.replaceAll("_", " ")}</Badge>
          ))}
        </div>
      )}

      {error && <Card style={{ padding: 14, color: "#FCA5A5", marginBottom: 14 }}>{error}</Card>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
        {/* Create project (scoped to this team) */}
        <Card style={{ padding: 20 }}>
          <div className="row gap-2" style={{ marginBottom: 14 }}><IconPlus size={16} /><strong>Create project</strong></div>
          <p style={{ color: "var(--text-3)", fontSize: 13, marginBottom: 14 }}>Projects created here belong to <strong>{group?.name ?? "this team"}</strong> and use its GitHub repositories.</p>
          <div style={{ display: "grid", gap: 12 }}>
            <Field label="Company / project name"><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Inc." /></Field>
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
                  <Button variant="primary" size="sm" onClick={() => router.push(pmProjectOrchestrateRoute(project))}>Orchestrate</Button>
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
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
