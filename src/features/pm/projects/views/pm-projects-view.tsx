// @ts-nocheck
"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import {
  IconArrowRight,
  IconChevronRight,
  IconFolder,
  IconLayout,
  IconList,
  IconPlus,
  IconSearch,
  IconClipboard,
  IconCode,
  IconShield,
  IconGitBranch,
  IconSparkles,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
} from "@/shared/components/icons";
import {
  autoAnalyzeDevFlowBrief,
  createDevFlowProject,
  listDevFlowProjects,
  type DevFlowAutoAnalyzeResult,
  type DevFlowProjectSummary,
} from "@/shared/api/devflow-api";
import {
  LIFECYCLE_STAGES,
  mapProjectStatusToLifecycleStage,
  getStageIndex,
  getStageProgress,
  type LifecycleStageId,
} from "@/shared/components/project-lifecycle/project-lifecycle-indicator";
import { GuidedActionPanel, RoleEmptyState } from "@/shared/components/journey";
import { makeProjectJourneyContext, humanizeJourneyTerm } from "@/shared/journey";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs attention" },
  { id: "active", label: "Active" },
  { id: "delivered", label: "Delivered" },
  { id: "archived", label: "Archived" },
];

const JOURNEY = [
  { icon: <IconClipboard size={16} />, label: "Setup", sub: "Brief, kickoff & team" },
  { icon: <IconCode size={16} />, label: "Build", sub: "Agents generate code" },
  { icon: <IconShield size={16} />, label: "Review", sub: "Approve two gates" },
  { icon: <IconGitBranch size={16} />, label: "Deliver", sub: "Commit & hand off" },
];

const ATTENTION_STATUSES = new Set(["AWAITING_GATE_1", "AWAITING_GATE_2", "FAILED"]);

function isAttention(project) {
  return ATTENTION_STATUSES.has(project.status);
}

/** Deep-link straight to the right wizard step (the index route auto-resolves the rest). */
function orchestrateRoute(project): string {
  const id = project.id;
  switch (project.status) {
    case "AWAITING_GATE_1": return `/pm/orchestrate/${id}/gate-1`;
    case "AWAITING_GATE_2": return `/pm/orchestrate/${id}/gate-2`;
    case "FAILED":
    case "PARSING_REQUIREMENTS":
    case "NEGOTIATING_CONTRACT":
    case "GENERATING_CODE":
    case "COMMITTING": return `/pm/orchestrate/${id}/run`;
    case "DELIVERED": return `/pm/orchestrate/${id}/delivery`;
    default: return `/pm/orchestrate/${id}`;
  }
}

function attentionMeta(project) {
  switch (project.status) {
    case "AWAITING_GATE_1":
      return { label: "Plan review - architecture", cta: "Review plan", tone: "amber", icon: <IconShield size={15} />, color: "#FBBF24" };
    case "AWAITING_GATE_2":
      return { label: "Build review - code", cta: "Review build", tone: "purple", icon: <IconCode size={15} />, color: "#A78BFA" };
    default:
      return { label: "Run blocked", cta: "Resume run", tone: "red", icon: <IconAlertTriangle size={15} />, color: "#FCA5A5" };
  }
}

function nextAction(stageId: LifecycleStageId, project): string {
  if (project.status === "AWAITING_GATE_1") return "Review the plan";
  if (project.status === "AWAITING_GATE_2") return "Review the build";
  if (project.status === "FAILED") return "Resume run";
  if (project.status === "GENERATING_CODE") return "Monitor build";
  if (project.status === "PARSING_REQUIREMENTS" || project.status === "NEGOTIATING_CONTRACT") return "Monitor run";
  const stage = LIFECYCLE_STAGES.find((s) => s.id === stageId);
  return stage?.nextAction ?? "Continue";
}

export function PMProjectsView() {
  const router = useRouter();
  const [view, setView] = useState("grid");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const [backendProjects, setBackendProjects] = useState<DevFlowProjectSummary[]>([]);
  const [apiError, setApiError] = useState("");
  const [loadingBackend, setLoadingBackend] = useState(true);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ companyName: "", brief: "", stackKey: "nextjs-nestjs-supabase" });

  // AI auto-analyze (in-modal)
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<DevFlowAutoAnalyzeResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState("");

  const refreshBackendProjects = async () => {
    setLoadingBackend(true);
    setApiError("");
    try {
      setBackendProjects(await listDevFlowProjects());
    } catch (error) {
      setApiError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoadingBackend(false);
    }
  };

  useEffect(() => {
    void refreshBackendProjects();
  }, []);

  const resetModal = () => {
    setForm({ companyName: "", brief: "", stackKey: "nextjs-nestjs-supabase" });
    setAnalyzeResult(null);
    setAnalyzeError("");
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError("");
    setAnalyzeResult(null);
    try {
      const result = await autoAnalyzeDevFlowBrief({
        companyName: form.companyName.trim() || "Unknown company",
        brief: form.brief.trim(),
        stackKey: form.stackKey,
      });
      setAnalyzeResult(result);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const details = (error as any)?.details ?? "";
      setAnalyzeError(
        `${msg} ${details}`.includes("API key") || `${msg} ${details}`.includes("not configured")
          ? "Auto-analyze needs an LLM provider. Ask an admin to add one in Admin › Providers, then retry."
          : msg,
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const createProject = async () => {
    const companyName = form.companyName.trim();
    const brief = form.brief.trim();
    const stackKey = form.stackKey.trim();
    if (!companyName || brief.length < 10 || !stackKey) {
      setApiError("Company, stack, and a brief of at least 10 characters are required.");
      return;
    }
    setCreating(true);
    setApiError("");
    try {
      const result = await createDevFlowProject({ companyName, brief, stackKey });
      resetModal();
      setNewProjectOpen(false);
      await refreshBackendProjects();
      if (result?.id) router.push(`/pm/orchestrate/${result.id}/brief`);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : String(error));
    } finally {
      setCreating(false);
    }
  };

  const projects = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = backendProjects.filter((project) => {
      const stage = mapProjectStatusToLifecycleStage(project.status, project.kickoffStatus);
      const matchesFilter =
        filter === "all" ? true :
        filter === "attention" ? isAttention(project) :
        filter === "active" ? stage !== "delivered" && project.status !== "FAILED" :
        filter === "delivered" ? stage === "delivered" :
        filter === "archived" ? project.status === "FAILED" :
        true;
      const matchesSearch =
        !query ||
        project.companyName.toLowerCase().includes(query) ||
        project.id.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
    return filtered.sort((a, b) => {
      if (sort === "started") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      return Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt);
    });
  }, [backendProjects, filter, search, sort]);

  const attentionProjects = useMemo(
    () => backendProjects.filter(isAttention).sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt)),
    [backendProjects],
  );

  const openProject = (id: string) => router.push(`/pm/project/${id}`);
  const hasNoProjects = !loadingBackend && !apiError && backendProjects.length === 0;
  const canCreate = form.companyName.trim().length > 0 && form.brief.trim().length >= 10;
  const featuredProject = attentionProjects[0] || backendProjects[0] || null;
  const hubJourney = makeProjectJourneyContext({
    role: "pm",
    project: featuredProject,
    loading: loadingBackend,
    totalProjects: backendProjects.length,
    activeCount: backendProjects.filter((project) => mapProjectStatusToLifecycleStage(project.status, project.kickoffStatus) !== "delivered" && project.status !== "FAILED").length,
    blockers: apiError ? [{ title: "Projects could not load", description: apiError, severity: "critical" }] : [],
    primaryAction: featuredProject
      ? { label: humanizeJourneyTerm(nextAction(mapProjectStatusToLifecycleStage(featuredProject.status, featuredProject.kickoffStatus), featuredProject)), href: orchestrateRoute(featuredProject) }
      : { label: "Create project", onClick: () => { resetModal(); setNewProjectOpen(true); } },
    secondaryAction: { label: "Refresh", onClick: refreshBackendProjects, variant: "secondary", icon: <IconRefresh size={13} /> },
  });

  return (
    <div data-screen-label="PM - Projects">
      <HubHero
        total={backendProjects.length}
        attention={attentionProjects.length}
        onNewProject={() => { resetModal(); setNewProjectOpen(true); }}
      />

      <GuidedActionPanel context={hubJourney} />

      {hasNoProjects ? (
        <>
          <RoleEmptyState role="pm" action={{ label: "Create project", onClick: () => { resetModal(); setNewProjectOpen(true); } }} />
          <PMOnboarding onNewProject={() => { resetModal(); setNewProjectOpen(true); }} />
        </>
      ) : (
        <>
          {attentionProjects.length > 0 && (
            <AttentionRail projects={attentionProjects} onGo={(p) => router.push(orchestrateRoute(p))} />
          )}

          <div className="hub-toolbar">
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {FILTERS.map((item) => {
                const count =
                  item.id === "all" ? backendProjects.length :
                  item.id === "attention" ? attentionProjects.length :
                  item.id === "active" ? backendProjects.filter((p) => mapProjectStatusToLifecycleStage(p.status, p.kickoffStatus) !== "delivered" && p.status !== "FAILED").length :
                  item.id === "delivered" ? backendProjects.filter((p) => mapProjectStatusToLifecycleStage(p.status, p.kickoffStatus) === "delivered").length :
                  backendProjects.filter((p) => p.status === "FAILED").length;
                return (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={`projects-filter-chip ${filter === item.id ? "projects-filter-active" : ""}`}
                  >
                    {item.label}
                    <span className="projects-filter-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 240, maxWidth: "100%" }}>
                <IconSearch size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." style={{ paddingLeft: 34, height: 36, fontSize: 13 }} />
              </div>
              <select className="input select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 168, height: 36, fontSize: 13, paddingTop: 0, paddingBottom: 0 }}>
                <option value="updated">Recently updated</option>
                <option value="started">Recently started</option>
              </select>
              <div style={{ display: "flex", background: "rgba(8,14,32,.6)", borderRadius: 8, padding: 3, border: "1px solid var(--border)", height: 36 }}>
                <ViewToggle active={view === "grid"} onClick={() => setView("grid")} icon={<IconLayout size={13} />} label="Grid view" />
                <ViewToggle active={view === "table"} onClick={() => setView("table")} icon={<IconList size={13} />} label="Table view" />
              </div>
            </div>
          </div>

          {apiError ? (
            <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>{compactApiError(apiError)}</Card>
          ) : loadingBackend ? (
            <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading backend projects...</Card>
          ) : projects.length === 0 ? (
            <div className="projects-empty-state">
              <IconFolder size={36} style={{ color: "var(--text-3)" }} />
              <h3>No projects match your filters</h3>
              <p>Try a different search term or filter, or create a new project.</p>
              <Button variant="primary" size="sm" onClick={() => { setFilter("all"); setSearch(""); }} icon={<IconArrowRight size={14} />}>Clear filters</Button>
            </div>
          ) : view === "grid" ? (
            <div className="proj-grid">
              {projects.map((project, i) => (
                <LifecycleGridCard
                  key={project.id}
                  project={project}
                  index={i}
                  onOpen={() => openProject(project.id)}
                  onContinue={() => router.push(orchestrateRoute(project))}
                />
              ))}
            </div>
          ) : (
            <LifecycleTable projects={projects} onOpen={openProject} onContinue={(p) => router.push(orchestrateRoute(p))} />
          )}
        </>
      )}

      <Modal
        open={newProjectOpen}
        onClose={() => !creating && setNewProjectOpen(false)}
        title="New project"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setNewProjectOpen(false)} disabled={creating}>Cancel</Button>
            <Button variant="primary" size="sm" icon={<IconArrowRight size={13} />} onClick={createProject} disabled={creating || !canCreate}>
              {creating ? "Creating..." : "Create & start"}
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div className="newproj-journey">
            {JOURNEY.map((p, i) => (
              <span key={p.label} className="newproj-journey-step">
                <span className="newproj-journey-icon">{p.icon}</span>
                {p.label}
                {i < JOURNEY.length - 1 && <IconChevronRight size={12} style={{ color: "var(--text-4)" }} />}
              </span>
            ))}
          </div>

          <Field label="Company">
            <Input value={form.companyName} onChange={(e) => setForm((c) => ({ ...c, companyName: e.target.value }))} placeholder="Acme Logistics" />
          </Field>
          <Field label="Stack">
            <Select value={form.stackKey} onChange={(e) => setForm((c) => ({ ...c, stackKey: e.target.value }))}>
              <option value="nextjs-nestjs-supabase">Next.js + NestJS + Supabase</option>
              <option value="nextjs-nestjs-postgres">Next.js + NestJS + PostgreSQL</option>
              <option value="nextjs-only">Next.js only</option>
            </Select>
          </Field>
          <Field label="Brief" helper="A rough idea is fine — expand it with AI, or refine it in the wizard after creating.">
            <Textarea
              rows={4}
              value={form.brief}
              onChange={(e) => setForm((c) => ({ ...c, brief: e.target.value }))}
              placeholder="Build a dashboard for tracking deliveries, drivers, customer notifications, and admin reporting."
            />
          </Field>

          {analyzeError && (
            <div className="wizard-info-banner warning"><IconAlertTriangle size={16} /><span>{analyzeError}</span></div>
          )}

          {analyzeResult && (
            <div className="newproj-ai-result reveal">
              <div className="newproj-ai-head"><IconSparkles size={14} /> AI-enhanced brief</div>
              <p className="newproj-ai-brief">{analyzeResult.enhancedBrief}</p>
              <div className="newproj-ai-features">
                {analyzeResult.suggestedFeatures.slice(0, 8).map((f, i) => (
                  <span key={i} className="newproj-ai-chip">{f}</span>
                ))}
              </div>
              <div className="newproj-ai-foot">
                <span>Complexity <strong>{analyzeResult.complexity}</strong> · ~{analyzeResult.estimatedFiles} files</span>
                <button className="newproj-ai-apply" onClick={() => setForm((c) => ({ ...c, brief: analyzeResult.enhancedBrief }))}>
                  <IconCheck size={13} /> Use this brief
                </button>
              </div>
            </div>
          )}

          <button
            className="newproj-ai-btn magnetic"
            onClick={handleAnalyze}
            disabled={analyzing || form.brief.trim().length < 3}
            type="button"
          >
            {analyzing ? <><IconRefresh size={14} className="spin" /> Expanding…</> : <><IconSparkles size={14} /> Expand with AI</>}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Hub hero / command center ───────────────────────────────────── */
function HubHero({ total, attention, onNewProject }: { total: number; attention: number; onNewProject: () => void }) {
  return (
    <section className="hub-hero reveal">
      <div className="hub-hero-main">
        <span className="eyebrow"><span className="dot" /> Orchestration hub</span>
        <h1 className="hub-hero-title">Ship client software with an AI build crew</h1>
        <p className="hub-hero-lead">
          Every project runs one guided path — set the brief, launch the agents, approve two gates,
          deliver to GitHub. Start something new, or pick up exactly where you left off.
        </p>
        <div className="hub-hero-actions">
          <button className="btn btn-primary btn-lg magnetic" onClick={onNewProject}>
            <IconPlus size={16} /> New project
            <span className="btn-island" aria-hidden="true"><IconArrowRight size={14} /></span>
          </button>
          <span className="hub-hero-meta">
            {total} project{total === 1 ? "" : "s"}
            {attention > 0 && <> · <span style={{ color: "#FBBF24" }}>{attention} need attention</span></>}
          </span>
        </div>
      </div>
      <div className="journey-legend">
        {JOURNEY.map((phase, i) => (
          <div key={phase.label} className="journey-phase reveal" style={{ "--i": i + 1 } as CSSProperties}>
            <span className="journey-phase-icon">{phase.icon}</span>
            <div>
              <div className="journey-phase-label">{phase.label}</div>
              <div className="journey-phase-sub">{phase.sub}</div>
            </div>
            {i < JOURNEY.length - 1 && <span className="journey-connector" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Needs-attention rail ────────────────────────────────────────── */
function AttentionRail({ projects, onGo }: { projects: DevFlowProjectSummary[]; onGo: (p) => void }) {
  return (
    <section className="hub-attention reveal">
      <div className="hub-section-head">
        <IconAlertTriangle size={15} style={{ color: "#FBBF24" }} />
        Needs your attention
        <span className="hub-section-count">{projects.length}</span>
      </div>
      <div className="hub-attention-rail">
        {projects.map((project, i) => {
          const meta = attentionMeta(project);
          return (
            <button
              key={project.id}
              className="attention-card reveal magnetic"
              style={{ "--i": i, "--accent": meta.color } as CSSProperties}
              onClick={() => onGo(project)}
            >
              <div className="attention-card-top">
                <span className="attention-card-icon" style={{ background: `${meta.color}22`, color: meta.color }}>{meta.icon}</span>
                <span className="attention-card-name">{project.companyName}</span>
              </div>
              <div className="attention-card-reason" style={{ color: meta.color }}>{meta.label}</div>
              <div className="attention-card-cta">{meta.cta}<IconArrowRight size={13} /></div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ─── Onboarding for new PMs ──────────────────────────────────────── */
function PMOnboarding({ onNewProject }: { onNewProject: () => void }) {
  const router = useRouter();
  return (
    <div className="pm-onboarding-hero reveal">
      <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,.06)", border: "1px solid var(--border)", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
        <IconFolder size={28} style={{ color: "var(--primary)" }} />
      </div>
      <h2>Create your first project</h2>
      <p>Spin up a project draft, then follow the guided orchestration wizard to set up, build, and deliver — no guesswork.</p>
      <div className="pm-onboarding-cards">
        <button type="button" className="pm-onboarding-card magnetic" onClick={onNewProject}>
          <div className="pm-onboarding-card-icon" style={{ background: "rgba(255,255,255,.07)", color: "var(--primary)" }}><IconPlus size={18} /></div>
          <div className="pm-onboarding-card-body">
            <h4>Create a new project</h4>
            <p>Start with a company name, tech stack, and a rough brief — expand it with AI.</p>
          </div>
        </button>
      </div>
    </div>
  );
}

/* ─── Lifecycle grid card ─────────────────────────────────────────── */
function LifecycleGridCard({ project, index, onOpen, onContinue }) {
  const stageId = mapProjectStatusToLifecycleStage(project.status, project.kickoffStatus);
  const stage = LIFECYCLE_STAGES.find((s) => s.id === stageId);
  const signals = project.lifecycle?.signals ?? {};
  const action = nextAction(stageId, project);
  const attention = isAttention(project);

  return (
    <article className="proj-card reveal" style={{ "--i": index } as CSSProperties}>
      <div
        className="proj-card-inner"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      >
        <span className={`proj-card-bar lifecycle-bar-${stageId}`} aria-hidden="true" />
        <div className="proj-card-head">
          <div className="row gap-3" style={{ alignItems: "center", minWidth: 0 }}>
            <div className="proj-card-avatar">{project.companyName.slice(0, 2).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div className="proj-card-name">{project.companyName}</div>
              <div className="proj-card-id mono">{project.id}</div>
            </div>
          </div>
          <span className={`lifecycle-badge-${stageId}`} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, border: "1px solid", whiteSpace: "nowrap" }}>
            {stage?.shortLabel ?? stageId}
          </span>
        </div>

        <div className="proj-card-progress">
          <div className="row" style={{ justifyContent: "space-between", gap: 8, fontSize: 11.5 }}>
            <span style={{ color: "var(--text-3)" }}>Stage {getStageIndex(stageId) + 1} of 5</span>
            <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{stage?.label}</span>
          </div>
          <div className="proj-card-track">
            <div className="proj-card-fill" style={{ width: `${getStageProgress(stageId)}%`, background: stageId === "delivered" ? "#34D399" : "linear-gradient(90deg, #F5F5F5, #737373)" }} />
          </div>
        </div>

        <div className="row gap-2" style={{ flexWrap: "wrap", minHeight: 22 }}>
          {signals.openTasks > 0 && <Badge tone="blue">{signals.openTasks} task{signals.openTasks > 1 ? "s" : ""}</Badge>}
          {signals.activeWorkOrders > 0 && <Badge tone="gray">{signals.activeWorkOrders} work orders</Badge>}
          {project.status === "FAILED" && <Badge tone="red">Failed</Badge>}
        </div>
      </div>

      <button className={`proj-card-cta ${attention ? "is-attention" : ""}`} onClick={onContinue}>
        <span>{action}</span>
        <IconArrowRight size={14} />
      </button>
    </article>
  );
}

/* ─── Lifecycle table ─────────────────────────────────────────────── */
function LifecycleTable({ projects, onOpen, onContinue }) {
  return (
    <Card style={{ padding: 0, overflow: "auto" }}>
      <div style={{ minWidth: 760 }}>
        <div className="projects-table-header">
          <div>Project</div>
          <div>Stage</div>
          <div>Progress</div>
          <div>Next action</div>
          <div>Updated</div>
          <div />
        </div>
        {projects.map((project) => {
          const stageId = mapProjectStatusToLifecycleStage(project.status, project.kickoffStatus);
          const action = nextAction(stageId, project);
          return (
            <div key={project.id} className="projects-table-row" onClick={() => onOpen(project.id)} role="button" tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter") && onOpen(project.id)}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{project.companyName}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{project.id}</div>
              </div>
              <div>
                <span className={`lifecycle-badge-${stageId}`} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, border: "1px solid" }}>
                  {stageId.charAt(0).toUpperCase() + stageId.slice(1)}
                </span>
              </div>
              <div style={{ width: 120 }}>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(148,163,184,.16)", overflow: "hidden" }}>
                  <div style={{ width: `${getStageProgress(stageId)}%`, height: "100%", borderRadius: 999, background: stageId === "delivered" ? "#34D399" : "linear-gradient(90deg, #F5F5F5, #737373)" }} />
                </div>
              </div>
              <div>
                <button className="projects-table-action" onClick={(e) => { e.stopPropagation(); onContinue(project); }}>
                  {action} <IconArrowRight size={12} />
                </button>
              </div>
              <div style={{ color: "var(--text-2)", fontSize: 12.5 }}>{formatDate(project.updatedAt || project.createdAt)}</div>
              <IconChevronRight size={14} style={{ color: "var(--text-3)" }} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
function compactApiError(message) {
  try {
    const parsed = JSON.parse(message);
    return parsed.message || parsed.error || message;
  } catch {
    return message;
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function ViewToggle({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      style={{ width: 30, borderRadius: 6, background: active ? "rgba(47,107,255,.20)" : "transparent", color: active ? "white" : "var(--text-2)", border: 0, cursor: "pointer", display: "grid", placeItems: "center", fontFamily: "inherit" }}>
      {icon}
    </button>
  );
}
