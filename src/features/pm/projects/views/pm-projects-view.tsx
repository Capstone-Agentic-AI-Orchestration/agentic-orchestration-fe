// @ts-nocheck
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import {
  IconArrowRight,
  IconPlus,
  IconSparkles,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
} from "@/shared/components/icons";
import {
  createDevFlowProject,
  getDevFlowClients,
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
import { useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import { useDevFlowClients } from "@/shared/hooks/use-devflow-clients";
import {
  LIFECYCLE_STAGES,
  mapProjectStatusToLifecycleStage,
  getStageIndex,
  getStageProgress,
  type LifecycleStageId,
} from "@/shared/components/project-lifecycle/project-lifecycle-indicator";
import {
  filterPmProjects,
  pmProjectNextAction,
  pmProjectRoute,
} from "../model/pm-projects-list";
import { teamBlockedReason, teamHasDeveloper } from "../model/team-readiness";

const CREATE_PROJECT_STEPS = [
  { id: "project", label: "Project", hint: "Company and stack" },
  { id: "brief", label: "Brief", hint: "Scope and AI expansion" },
  { id: "design", label: "Design", hint: "Frontend direction" },
  { id: "review", label: "Review", hint: "Create and start" },
];

function orchestrateRoute(project): string {
  return pmProjectRoute(project);
}

function nextAction(stageId: LifecycleStageId, project): string {
  return pmProjectNextAction(stageId, project);
}

/**
 * The workspace project list.
 *
 * This used to render two screens off a `cardsOnly` flag: a KPI dashboard called "Home" and
 * this list. Two doors into one room — the tiles restated what the list already showed, and
 * every project still had to be opened from the same cards. The dashboard is gone.
 */
export function PMProjectsView() {
  const router = useRouter();
  const { selectedTeamId } = useSelectedTeamWorkspace();
  const { refreshProjects: refreshWorkspaceProjects, setSelectedProjectId } = useSelectedDevFlowProject();
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
    await Promise.all([refreshBackendProjects(), refreshWorkspaceProjects()]);
    if (projectId) {
      setSelectedProjectId(projectId);
      router.push(`/pm/project/${projectId}`);
    }
  };

  // The workspace's clients, so a project can be placed by the company it belongs to.
  const { clients } = useDevFlowClients(undefined, selectedTeamId ?? undefined);

  /**
   * Every project this workspace owns, reached through its clients.
   *
   * The filter used to be `project.groupId === selectedTeamId` alone, which had two failure
   * modes seen in the console: a project whose groupId was never set was invisible in every
   * workspace while its client card still counted it, and selecting no team showed nothing at
   * all. A project belongs to the workspace that owns its client; project.groupId is kept as a
   * fallback for the reverse case, a project grouped here whose client is not yet assigned.
   */
  const workspaceProjects = useMemo(() => {
    if (!selectedTeamId) return backendProjects;
    const clientIds = new Set(clients.map((client) => client.id));
    return backendProjects.filter(
      (project) =>
        // A discovery space is not a project. Approving an inquiry creates one so the client has
        // somewhere to be invited and upload documents into; it becomes a project when a human
        // starts delivery. Listing it here makes a lead you are still talking to look like work.
        project.status !== "DISCOVERY"
        && ((project.client?.id && clientIds.has(project.client.id)) || project.groupId === selectedTeamId),
    );
  }, [backendProjects, clients, selectedTeamId]);

  // No filter chips, search box or sort control on this screen any more; the list is every
  // project in the workspace, newest activity first. Kept going through filterPmProjects so
  // ordering stays the one place it was already defined.
  const projects = useMemo(
    () => filterPmProjects({ projects: workspaceProjects, filter: "all", search: "", sort: "updated" }),
    [workspaceProjects],
  );

  /** Grouped by the company the work is for, which is how a PM is asked about it. */
  const projectsByClient = useMemo(() => {
    const groups = new Map<string, { name: string; projects: typeof projects }>();
    for (const project of projects) {
      const id = project.client?.id ?? "__unassigned";
      const name = project.client?.name ?? "No client";
      const group = groups.get(id) ?? { name, projects: [] };
      group.projects.push(project);
      groups.set(id, group);
    }
    // Unassigned last: it is a state to resolve, not a company to report on.
    return [...groups.entries()].sort(([a], [b]) =>
      a === "__unassigned" ? 1 : b === "__unassigned" ? -1 : 0,
    );
  }, [projects]);

  const openProject = (id: string) => router.push(`/pm/project/${id}`);

  return (
    <div className="pm-projects-flat-page" data-screen-label="PM - Projects">
      <div className="pm-projects-flat-actions">
        <button type="button" className="pm-project-create-tab" onClick={openNewProject}>
          <IconPlus size={15} /> Create project
        </button>
      </div>

      {apiError ? (
        <p className="pm-projects-flat-message is-error">{compactApiError(apiError)}</p>
      ) : loadingBackend ? (
        <div className="pm-projects-flat-loading" aria-label="Loading projects">
          {[0, 1, 2].map((index) => <span key={index} />)}
        </div>
      ) : projects.length === 0 ? (
        <p className="pm-projects-flat-message">No projects in this workspace.</p>
      ) : (
        projectsByClient.map(([clientId, group]) => (
          <section key={clientId} className="pm-projects-client-group">
            <header className="pm-projects-client-head">
              <h3>{group.name}</h3>
              <span>{group.projects.length} {group.projects.length === 1 ? "project" : "projects"}</span>
            </header>
            <div className="pm-projects-flat-list">
              {group.projects.map((project, i) => (
                <LifecycleProjectRow
                  key={project.id}
                  project={project}
                  index={i}
                  onOpen={() => openProject(project.id)}
                  onContinue={() => router.push(orchestrateRoute(project))}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <NewProjectWizardModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreated={handleProjectCreated}
        onError={setApiError}
        initialGroupId={selectedTeamId}
      />
    </div>
  );
}

function NewProjectWizardModal({
  open,
  onClose,
  onCreated,
  onError,
  initialGroupId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (projectId?: string) => Promise<void>;
  onError: (message: string) => void;
  initialGroupId: string | null;
}) {
  // This modal has its own router: the enclosing PMProjectsView's instance is not in scope here,
  // and the "no clients yet" path has to be able to navigate away to the client list.
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ companyName: "", brief: "", stackKey: "nextjs-nestjs-supabase", groupId: "", repositoryName: "", clientId: "" });
  const [clientOptions, setClientOptions] = useState([]);
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

  const resetWizard = useCallback(() => {
    setStepIndex(0);
    setCreating(false);
    setForm({ companyName: "", brief: "", stackKey: "nextjs-nestjs-supabase", groupId: initialGroupId || "", repositoryName: "", clientId: "" });
    setDesignGuidance(DEFAULT_DESIGN_GUIDANCE);
    setAnalyzing(false);
    setAnalyzeResult(null);
    setAnalyzeError("");
    setCreateError("");
  }, [initialGroupId]);

  useEffect(() => {
    if (open) {
      resetWizard();
      listDevFlowGroups()
        .then((items) => {
          const active = items.filter((group) => group.status === "ACTIVE");
          setGroups(active);
          const workspaceTeam = active.find((group) => group.id === initialGroupId);
          if (workspaceTeam || active[0]) setForm((current) => ({ ...current, groupId: workspaceTeam?.id || active[0].id }));
        })
        .catch((error) => setCreateError(error instanceof Error ? error.message : String(error)));
      // Clients populate the picker on the first wizard step. A failure here must not block
      // project creation, since a project may legitimately be created unassigned.
      getDevFlowClients()
        .then((result) => setClientOptions(result.clients.filter((client) => client.status !== "ARCHIVED")))
        .catch(() => setClientOptions([]));
    }
  }, [initialGroupId, open, resetWizard]);

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
    if (!form.clientId) {
      // Called out on its own rather than folded into the list below: "pick a client" is a
      // different kind of fix from "write a longer brief" — it may mean leaving to add the client.
      setCreateError("Choose the client this project is for. Projects cannot exist without a client.");
      return;
    }
    if (!companyName || brief.length < 10 || !stackKey || !form.groupId || !repositoryName) {
      setCreateError("Company, team, repository name, stack, and a brief of at least 10 characters are required.");
      return;
    }
    const teamProblem = teamBlockedReason(groups.find((group) => group.id === form.groupId));
    if (teamProblem) {
      setCreateError(teamProblem);
      return;
    }
    setCreating(true);
    setCreateError("");
    onError("");
    try {
      const result = await createDevFlowProject({
        companyName,
        clientId: form.clientId,
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
                {/* Required, not "flagged for follow-up". A project exists for a client, so the
                    client is chosen before anything else about the project is described. */}
                <Field
                  label="Client *"
                  helper={
                    clientOptions.length
                      ? "Every project belongs to a client. Not listed? Add the client first."
                      : "No clients yet — add a client before creating a project."
                  }
                >
                  <Select
                    value={form.clientId}
                    onChange={(event) => {
                      const clientId = event.target.value;
                      const picked = clientOptions.find((option) => option.id === clientId);
                      // Fill the company name from the client so the two cannot disagree, but
                      // leave it editable for projects named differently to the company.
                      setForm((current) => ({
                        ...current,
                        clientId,
                        companyName: picked && !current.companyName.trim() ? picked.name : current.companyName,
                      }));
                    }}
                  >
                    <option value="">Select a client…</option>
                    {clientOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </Select>
                </Field>
                {!clientOptions.length && (
                  <Button variant="secondary" size="sm" onClick={() => router.push("/pm/clients")}>
                    Add a client first
                  </Button>
                )}
                <Field label="Project name" helper="Defaults to the client name; change it if this project has its own name.">
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
                <Field
                  label="Team workspace"
                  helper="The team that will build this. A team needs a developer in it."
                >
                  <Select
                    value={form.groupId}
                    disabled={Boolean(initialGroupId && groups.some((group) => group.id === initialGroupId))}
                    onChange={(event) => setForm((current) => ({ ...current, groupId: event.target.value }))}
                  >
                    <option value="">Select a team</option>
                    {/* Developer-less teams stay listed but are marked and unselectable: hiding
                        them would leave a PM hunting for a team they know exists. */}
                    {groups.map((group) => {
                      const usable = teamHasDeveloper(group.members);
                      return (
                        <option key={group.id} value={group.id} disabled={!usable}>
                          {group.name}{usable ? "" : " — no developer yet"}
                        </option>
                      );
                    })}
                  </Select>
                </Field>
                {teamBlockedReason(groups.find((group) => group.id === form.groupId)) && (
                  <div className="field-error">
                    {teamBlockedReason(groups.find((group) => group.id === form.groupId))}
                  </div>
                )}
                <Field label="GitHub repository" helper="A private repository with folders only. CI/CD is not added.">
                  <Input
                    value={form.repositoryName}
                    onChange={(event) => setForm((current) => ({ ...current, repositoryName: event.target.value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-") }))}
                    placeholder="acme-logistics"
                  />
                </Field>
              </div>
              {groups.length === 0 && (
                <div className="wizard-info-banner warning"><IconAlertTriangle size={16} /><span>Create an active team under Teams before starting a project.</span></div>
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
                  <span>Team workspace</span>
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
/* ─── Flat workspace project row ─────────────────────────────────── */
function LifecycleProjectRow({ project, index, onOpen, onContinue }) {
  const stageId = mapProjectStatusToLifecycleStage(project.status, project.kickoffStatus);
  const stage = LIFECYCLE_STAGES.find((item) => item.id === stageId);
  const action = nextAction(stageId, project);

  return (
    <article className="pm-project-flat-row reveal" style={{ "--i": index } as CSSProperties}>
      <button
        type="button"
        className="pm-project-flat-main"
        onClick={onOpen}
        aria-label={`Open ${project.companyName}`}
      >
        <span className="pm-project-flat-identity">
          <strong>{project.companyName}</strong>
          <small className="mono">{project.id}</small>
        </span>

        <span className="pm-project-flat-stage">
          <small>Stage {getStageIndex(stageId) + 1} of 5</small>
          <strong className={`lifecycle-text-${stageId}`}>{stage?.label ?? stageId}</strong>
        </span>

        <span className="pm-project-flat-progress" aria-label={`${getStageProgress(stageId)}% complete`}>
          <span
            style={{
              width: `${getStageProgress(stageId)}%`,
              background: stageId === "delivered" ? "#34D399" : "linear-gradient(90deg, #F5F5F5, #737373)",
            }}
          />
        </span>
      </button>

      <button type="button" className="pm-project-flat-action" onClick={onContinue}>
        {action} <IconArrowRight size={14} />
      </button>
    </article>
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
