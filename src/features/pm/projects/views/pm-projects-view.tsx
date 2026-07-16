// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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
  createDevFlowProject,
  listDevFlowGroups,
  listDevFlowProjects,
  type DevFlowAutoAnalyzeResult,
  type DevFlowDesignGuidance,
  type DevFlowProjectSummary,
  type DevFlowGroup,
} from "@/shared/api/devflow-api";
import { requestFastBriefAnalysis } from "@/shared/ai/brief-analysis";
import { DesignGuidancePanel } from "@/shared/components/design/design-guidance-panel";
import { DEFAULT_DESIGN_GUIDANCE, describeDesignGuidance, saveDesignGuidance } from "@/shared/design-guidance";
import {
  LIFECYCLE_STAGES,
  mapProjectStatusToLifecycleStage,
  getStageIndex,
  getStageProgress,
  type LifecycleStageId,
} from "@/shared/components/project-lifecycle/project-lifecycle-indicator";
import {
  buildPmProjectStats,
  filterPmProjects,
  pmAttentionProjects,
  pmProjectAttentionMeta,
  pmProjectFilterCount,
  pmProjectNeedsAttention,
  pmProjectNextAction,
  pmProjectOrchestrateRoute,
} from "../model/pm-projects-list";

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

const CREATE_PROJECT_STEPS = [
  { id: "project", label: "Project", hint: "Company and stack" },
  { id: "brief", label: "Brief", hint: "Scope and AI expansion" },
  { id: "design", label: "Design", hint: "Frontend direction" },
  { id: "review", label: "Review", hint: "Create and start" },
];

function isAttention(project) {
  return pmProjectNeedsAttention(project);
}

/** Deep-link straight to the right wizard step (the index route auto-resolves the rest). */
function orchestrateRoute(project): string {
  return pmProjectOrchestrateRoute(project);
}

function attentionMeta(project) {
  const meta = pmProjectAttentionMeta(project);
  const icons = {
    shield: <IconShield size={15} />,
    code: <IconCode size={15} />,
    alert: <IconAlertTriangle size={15} />,
  };
  return { ...meta, icon: icons[meta.icon] };
}

function nextAction(stageId: LifecycleStageId, project): string {
  return pmProjectNextAction(stageId, project);
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

  const openNewProject = () => setNewProjectOpen(true);

  const handleProjectCreated = async (projectId?: string) => {
    setNewProjectOpen(false);
    await refreshBackendProjects();
    if (projectId) router.push(`/pm/orchestrate/${projectId}/brief`);
  };

  const projects = useMemo(() => {
    return filterPmProjects({ projects: backendProjects, filter, search, sort });
  }, [backendProjects, filter, search, sort]);

  const attentionProjects = useMemo(
    () => pmAttentionProjects(backendProjects),
    [backendProjects],
  );
  const projectStats = useMemo(() => {
    return buildPmProjectStats(backendProjects);
  }, [backendProjects]);

  const openProject = (id: string) => router.push(`/pm/project/${id}`);
  const hasNoProjects = !loadingBackend && !apiError && backendProjects.length === 0;

  return (
    <div className="pm-command-screen" data-screen-label="PM - Projects">
      <ProjectCommandStats stats={projectStats} loading={loadingBackend} />

      {hasNoProjects ? (
        <FirstProjectWorkspace onNewProject={openNewProject} />
      ) : (
        <>
          {attentionProjects.length > 0 && (
            <AttentionRail projects={attentionProjects} onGo={(p) => router.push(orchestrateRoute(p))} />
          )}

          <section className="pm-inventory-shell">
            <div className="pm-inventory-head">
              <div>
                <span className="pm-command-kicker">Project inventory</span>
                <h2>Active work</h2>
              </div>
              <div className="pm-inventory-actions">
                <span className="pm-inventory-meta">
                  {loadingBackend ? "Syncing projects" : `${projects.length} shown`}
                </span>
                <button className="btn btn-primary btn-sm" onClick={openNewProject}>
                  <IconPlus size={14} /> New project
                </button>
              </div>
            </div>

            <div className="hub-toolbar">
              <div className="pm-filter-row">
              {FILTERS.map((item) => {
                const count =
                  pmProjectFilterCount(backendProjects, item.id);
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

              <div className="pm-toolbar-actions">
                <div className="pm-project-search">
                <IconSearch size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
                <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." style={{ paddingLeft: 34, height: 36, fontSize: 13 }} />
              </div>
                <select className="input select pm-sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="updated">Recently updated</option>
                <option value="started">Recently started</option>
              </select>
                <div className="pm-view-toggle">
                <ViewToggle active={view === "grid"} onClick={() => setView("grid")} icon={<IconLayout size={13} />} label="Grid view" />
                <ViewToggle active={view === "table"} onClick={() => setView("table")} icon={<IconList size={13} />} label="Table view" />
              </div>
            </div>
            </div>

            {apiError ? (
              <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>{compactApiError(apiError)}</Card>
            ) : loadingBackend ? (
              <ProjectsLoadingState view={view} />
            ) : projects.length === 0 ? (
              <FilteredProjectsEmpty onClear={() => { setFilter("all"); setSearch(""); }} />
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
          </section>
        </>
      )}

      <NewProjectWizardModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreated={handleProjectCreated}
        onError={setApiError}
      />
    </div>
  );
}

function NewProjectWizardModal({
  open,
  onClose,
  onCreated,
  onError,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (projectId?: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ companyName: "", brief: "", stackKey: "nextjs-nestjs-supabase", groupId: "", repositoryName: "" });
  const [groups, setGroups] = useState<DevFlowGroup[]>([]);
  const [designGuidance, setDesignGuidance] = useState<DevFlowDesignGuidance>(DEFAULT_DESIGN_GUIDANCE);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<DevFlowAutoAnalyzeResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState("");
  const [createError, setCreateError] = useState("");
  const analyzeRequestRef = useRef(0);

  const activeStep = CREATE_PROJECT_STEPS[stepIndex];
  const projectReady = form.companyName.trim().length > 0 && form.stackKey.trim().length > 0 && form.groupId.length > 0 && form.repositoryName.trim().length > 0;
  const briefReady = form.brief.trim().length >= 10;
  const canCreate = projectReady && briefReady;
  const canContinue =
    activeStep.id === "project" ? projectReady :
    activeStep.id === "brief" ? briefReady :
    activeStep.id === "design" ? true :
    canCreate;

  const resetWizard = () => {
    setStepIndex(0);
    setCreating(false);
    setForm({ companyName: "", brief: "", stackKey: "nextjs-nestjs-supabase", groupId: "", repositoryName: "" });
    setDesignGuidance(DEFAULT_DESIGN_GUIDANCE);
    setAnalyzing(false);
    setAnalyzeResult(null);
    setAnalyzeError("");
    setCreateError("");
  };

  useEffect(() => {
    if (open) {
      resetWizard();
      listDevFlowGroups()
        .then((items) => {
          const active = items.filter((group) => group.status === "ACTIVE");
          setGroups(active);
          if (active[0]) setForm((current) => ({ ...current, groupId: active[0].id }));
        })
        .catch((error) => setCreateError(error instanceof Error ? error.message : String(error)));
    }
  }, [open]);

  const handleAnalyze = async () => {
    const requestId = analyzeRequestRef.current + 1;
    analyzeRequestRef.current = requestId;
    const input = {
      companyName: form.companyName.trim() || "Unknown company",
      brief: form.brief.trim(),
      stackKey: form.stackKey,
      designGuidance,
    };
    setAnalyzing(true);
    setAnalyzeError("");
    setAnalyzeResult(null);
    try {
      const result = await requestFastBriefAnalysis(input);
      if (analyzeRequestRef.current !== requestId) return;
      setAnalyzeResult(result);
    } catch (error) {
      if (analyzeRequestRef.current !== requestId) return;
      const msg = error instanceof Error ? error.message : String(error);
      const details = (error as any)?.details ?? "";
      setAnalyzeError(
        `${msg} ${details}`.includes("API key") || `${msg} ${details}`.includes("not configured")
          ? "Auto-analyze needs an LLM provider. Ask an admin to add one in Admin > Providers, then retry."
          : msg,
      );
    } finally {
      if (analyzeRequestRef.current === requestId) {
        setAnalyzing(false);
      }
    }
  };

  const createProject = async () => {
    const companyName = form.companyName.trim();
    const brief = form.brief.trim();
    const stackKey = form.stackKey.trim();
    const repositoryName = form.repositoryName.trim();
    if (!companyName || brief.length < 10 || !stackKey || !form.groupId || !repositoryName) {
      setCreateError("Company, group, repository name, stack, and a brief of at least 10 characters are required.");
      return;
    }
    setCreating(true);
    setCreateError("");
    onError("");
    try {
      const result = await createDevFlowProject({
        companyName,
        brief,
        stackKey,
        groupId: form.groupId,
        repositoryName,
        repositoryDescription: `${companyName} workspace created by DevFlow`,
      });
      if (result?.id) saveDesignGuidance(result.id, designGuidance);
      resetWizard();
      await onCreated(result?.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setCreateError(message);
      onError(message);
    } finally {
      setCreating(false);
    }
  };

  const goNext = () => {
    if (!canContinue) return;
    if (stepIndex < CREATE_PROJECT_STEPS.length - 1) {
      setStepIndex((current) => current + 1);
      return;
    }
    void createProject();
  };

  const goBack = () => setStepIndex((current) => Math.max(0, current - 1));

  return (
    <Modal
      open={open}
      onClose={() => !creating && onClose()}
      title="New project"
      width={980}
      bodyStyle={{ padding: 0, overflowX: "hidden" }}
      footerStyle={{ justifyContent: "space-between", alignItems: "center" }}
      footer={
        <>
          <span className="newproj-footer-meta">Step {stepIndex + 1} of {CREATE_PROJECT_STEPS.length}</span>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" size="sm" onClick={stepIndex === 0 ? onClose : goBack} disabled={creating}>
              {stepIndex === 0 ? "Cancel" : "Back"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconRight={stepIndex === CREATE_PROJECT_STEPS.length - 1 ? undefined : <IconArrowRight size={13} />}
              onClick={goNext}
              disabled={creating || !canContinue}
            >
              {stepIndex === CREATE_PROJECT_STEPS.length - 1
                ? creating ? "Creating..." : "Create & start"
                : "Continue"}
            </Button>
          </div>
        </>
      }
    >
      <div className="newproj-wizard">
        <nav className="newproj-stepper" aria-label="Project creation steps">
          {CREATE_PROJECT_STEPS.map((step, index) => {
            const state = index === stepIndex ? "active" : index < stepIndex ? "complete" : "idle";
            return (
              <button
                key={step.id}
                type="button"
                className={`newproj-step ${state}`}
                onClick={() => index <= stepIndex && setStepIndex(index)}
                disabled={index > stepIndex || creating}
                aria-current={index === stepIndex ? "step" : undefined}
              >
                <span className="newproj-step-index">{index + 1}</span>
                <span>
                  <span className="newproj-step-label">{step.label}</span>
                  <span className="newproj-step-hint">{step.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <section className="newproj-panel">
          {activeStep.id === "project" && (
            <div className="newproj-section">
              <div>
                <h4>Project basics</h4>
                <p>Name the client/project and choose the scaffold the OpenCode path should generate against.</p>
              </div>
              <div className="newproj-grid">
                <Field label="Company">
                  <Input
                    value={form.companyName}
                    onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                    placeholder="Acme Logistics"
                  />
                </Field>
                <Field label="Stack">
                  <Select
                    value={form.stackKey}
                    onChange={(event) => setForm((current) => ({ ...current, stackKey: event.target.value }))}
                  >
                    <option value="nextjs-nestjs-supabase">Next.js + NestJS + Supabase</option>
                    <option value="nextjs-nestjs-postgres">Next.js + NestJS + PostgreSQL</option>
                    <option value="nextjs-only">Next.js only</option>
                  </Select>
                </Field>
                <Field label="Delivery group">
                  <Select
                    value={form.groupId}
                    onChange={(event) => setForm((current) => ({ ...current, groupId: event.target.value }))}
                  >
                    <option value="">Select a group</option>
                    {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </Select>
                </Field>
                <Field label="GitHub repository" helper="A private repository with folders only. CI/CD is not added.">
                  <Input
                    value={form.repositoryName}
                    onChange={(event) => setForm((current) => ({ ...current, repositoryName: event.target.value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-") }))}
                    placeholder="acme-logistics"
                  />
                </Field>
              </div>
              {groups.length === 0 && (
                <div className="wizard-info-banner warning"><IconAlertTriangle size={16} /><span>Create an active group under Groups &amp; repos before starting a project.</span></div>
              )}
            </div>
          )}

          {activeStep.id === "brief" && (
            <div className="newproj-section">
              <div>
                <h4>Project brief</h4>
                <p>Start rough, then optionally let the current LLM provider expand the brief before creation.</p>
              </div>
              <Field label="Brief" helper="Minimum 10 characters. You can refine the brief again in the orchestration wizard.">
                <Textarea
                  rows={6}
                  value={form.brief}
                  onChange={(event) => setForm((current) => ({ ...current, brief: event.target.value }))}
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
                    {analyzeResult.suggestedFeatures.slice(0, 8).map((feature, index) => (
                      <span key={index} className="newproj-ai-chip">{feature}</span>
                    ))}
                  </div>
                  <div className="newproj-ai-foot">
                    <span>Complexity <strong>{analyzeResult.complexity}</strong> · ~{analyzeResult.estimatedFiles} files</span>
                    <button className="newproj-ai-apply" onClick={() => setForm((current) => ({ ...current, brief: analyzeResult.enhancedBrief }))}>
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
                {analyzing ? <><IconRefresh size={14} className="spin" /> Expanding...</> : <><IconSparkles size={14} /> Expand with AI</>}
              </button>
            </div>
          )}

          {activeStep.id === "design" && (
            <div className="newproj-section">
              <div>
                <h4>Design direction</h4>
                <p>Keep the PM choices simple here. The full DESIGN.md contract is still available when needed.</p>
              </div>
              <DesignGuidancePanel value={designGuidance} onChange={setDesignGuidance} compact />
            </div>
          )}

          {activeStep.id === "review" && (
            <div className="newproj-section">
              <div>
                <h4>Review and create</h4>
                <p>These values will be sent to DevFlow and carried into the frontend agent prompt.</p>
              </div>
              {createError && (
                <div className="wizard-info-banner warning"><IconAlertTriangle size={16} /><span>{createError}</span></div>
              )}
              <div className="newproj-review-grid">
                <div className="newproj-summary-card">
                  <span>Company</span>
                  <strong>{form.companyName.trim() || "Not set"}</strong>
                </div>
                <div className="newproj-summary-card">
                  <span>Stack</span>
                  <strong>{stackLabel(form.stackKey)}</strong>
                </div>
                <div className="newproj-summary-card">
                  <span>Group</span>
                  <strong>{groups.find((group) => group.id === form.groupId)?.name || "Not set"}</strong>
                </div>
                <div className="newproj-summary-card">
                  <span>Repository</span>
                  <strong>{form.repositoryName || "Not set"}</strong>
                </div>
                <div className="newproj-summary-card wide">
                  <span>Design</span>
                  <strong>{describeDesignGuidance(designGuidance)}</strong>
                </div>
                <div className="newproj-summary-card wide">
                  <span>Brief</span>
                  <p>{form.brief.trim() || "No brief provided yet."}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}

function stackLabel(stackKey: string): string {
  switch (stackKey) {
    case "nextjs-nestjs-postgres":
      return "Next.js + NestJS + PostgreSQL";
    case "nextjs-only":
      return "Next.js only";
    default:
      return "Next.js + NestJS + Supabase";
  }
}

function ProjectCommandStats({ stats, loading }: { stats: { total: number; waiting: number; active: number; activeBuilds: number; delivered: number }; loading: boolean }) {
  const items = [
    { label: "Total projects", value: stats.total, hint: "All client builds" },
    { label: "Waiting approvals", value: stats.waiting, hint: "Gate reviews" },
    { label: "Active builds", value: stats.activeBuilds || stats.active, hint: "In motion" },
    { label: "Delivered", value: stats.delivered, hint: "Handed off" },
  ];

  return (
    <section className="pm-command-stats" aria-label="Project command stats">
      {items.map((item) => (
        <div key={item.label} className="pm-command-stat">
          <span>{item.label}</span>
          {loading ? <strong className="pm-stat-skeleton" aria-label={`${item.label} loading`} /> : <strong>{item.value}</strong>}
          <small>{item.hint}</small>
        </div>
      ))}
    </section>
  );
}

function FirstProjectWorkspace({ onNewProject }: { onNewProject: () => void }) {
  return (
    <section className="pm-start-workspace reveal">
      <div className="pm-start-main">
        <span className="pm-command-kicker">First project</span>
        <h2>Start the build workspace</h2>
        <p>
          Add a company, describe the product, choose the visual direction, then send the brief into the guided orchestration path.
        </p>
        <div className="pm-start-actions">
          <button className="btn btn-primary btn-lg magnetic" onClick={onNewProject}>
            <IconPlus size={16} /> New project
            <span className="btn-island" aria-hidden="true"><IconArrowRight size={14} /></span>
          </button>
          <span>Next: setup, build, review, deliver.</span>
        </div>
      </div>

      <div className="pm-lifecycle-preview" aria-label="Delivery lifecycle preview">
        {JOURNEY.map((phase, index) => (
          <div key={phase.label} className="pm-lifecycle-step">
            <span className="pm-lifecycle-index">{index + 1}</span>
            <span className="pm-lifecycle-icon">{phase.icon}</span>
            <span className="pm-lifecycle-copy">
              <strong>{phase.label}</strong>
              <small>{phase.sub}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectsLoadingState({ view }: { view: string }) {
  if (view === "table") {
    return (
      <Card className="pm-table-skeleton" style={{ padding: 0, overflow: "hidden" }}>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="pm-table-skeleton-row">
            <span className="pm-skeleton-line wide" />
            <span className="pm-skeleton-line" />
            <span className="pm-skeleton-line short" />
            <span className="pm-skeleton-line" />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <div className="proj-grid" aria-label="Loading projects">
      {[0, 1, 2].map((index) => (
        <div key={index} className="proj-card pm-project-skeleton">
          <div className="proj-card-inner">
            <span className="proj-card-bar" />
            <div className="proj-card-head">
              <span className="pm-skeleton-avatar" />
              <span className="pm-skeleton-line wide" />
            </div>
            <span className="pm-skeleton-line" />
            <span className="pm-skeleton-line short" />
          </div>
          <div className="proj-card-cta"><span className="pm-skeleton-line short" /></div>
        </div>
      ))}
    </div>
  );
}

function FilteredProjectsEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="projects-empty-state projects-empty-state-filtered">
      <IconSearch size={28} style={{ color: "var(--text-3)" }} />
      <h3>No projects match the current view</h3>
      <p>Clear the filters to return to the full project inventory.</p>
      <Button variant="secondary" size="sm" onClick={onClear} icon={<IconRefresh size={14} />}>Clear filters</Button>
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
