// @ts-nocheck
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AgentLiveStrip } from "@/features/pm/shared/components/pm-agent-live-strip";
import { ActivityConsole } from "@/shared/components/orchestration/activity-console";
import { RunStatusBanner } from "@/shared/components/orchestration/run-status-banner";
import { useSocketSubscription } from "@/shared/hooks/use-socket-subscription";
import { PMPageHeader } from "@/features/pm/shared/components/pm-page-header";
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { DevFlowProjectTimeline } from "@/shared/components/project-timeline/devflow-project-timeline";
import { OrchestrationProviderStatusPanel } from "@/shared/components/orchestration/orchestration-provider-status-panel";
import { OrchestrationLiveVisualizer } from "@/shared/components/orchestration/orchestration-live-visualizer";
import { OrchestrationPreflight } from "@/shared/components/orchestration/orchestration-preflight";
import { BlockingIssuePanel, GuidedActionPanel } from "@/shared/components/journey";
import { makeProjectJourneyContext } from "@/shared/journey";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBriefcase,
  IconArrowRight,
  IconCheck,
  IconCircle,
  IconClose,
  IconCode,
  IconDatabase,
  IconDownload,
  IconEdit,
  IconExternalLink,
  IconFolder,
  IconGitBranch,
  IconGitHub,
  IconHash,
  IconLock,
  IconMessageCircle,
  IconMoreVertical,
  IconPlus,
  IconPlay,
  IconRefresh,
  IconSearch,
  IconSend,
  IconStar,
  IconUpload,
  IconUser,
  IconWorkflow,
} from "@/shared/components/icons";
import {
  addDevFlowProjectMember,
  addDevFlowProjectTaskComment,
  approveDevFlowGate1,
  approveDevFlowGate2,
  createDevFlowAdminRepository,
  createDevFlowKickoffTasks,
  createDevFlowKickoffWorkOrders,
  createDevFlowProjectTask,
  createDevFlowWorkOrder,
  dispatchDevFlowWorkOrder,
  getDevFlowDeliveryReadiness,
  getDevFlowOrchestrationRuns,
  getDevFlowProjectTaskActivity,
  getDevFlowProject,
  startDevFlowProjectDelivery,
  getDevFlowProjectArtifact,
  handleDevFlowArtifactRevision,
  publishDevFlowArtifactOutput,
  rerunReadyDevFlowWorkOrders,
  removeDevFlowProjectMember,
  retryDevFlowWorkOrder,
  reviewDevFlowArtifactOutput,
  resolveDevFlowProjectDeliveryRevision,
  searchDevFlowProfiles,
  startDevFlowOrchestration,
  updateDevFlowArtifactSharing,
  updateDevFlowProject,
  updateDevFlowProjectKickoff,
  updateDevFlowProjectTask,
  updateDevFlowWorkOrder,
  verifyDevFlowGithubDelivery,
  verifyDevFlowLlmProvider,
} from "@/shared/api/devflow-api";
import { loadDesignGuidance } from "@/shared/design-guidance";
import { useDevFlowOrchestrationProviderStatus, useDevFlowOrchestrationStatus, useDevFlowProjectOutputs } from "@/shared/hooks/use-devflow-projects";
import { useOrchestrationModelSelection } from "@/shared/hooks/use-orchestration-model-selection";
import {
  ProjectLifecycleIndicator,
  mapProjectStatusToLifecycleStage,
  getStageIndex,
  LIFECYCLE_STAGES,
} from "@/shared/components/project-lifecycle/project-lifecycle-indicator";
import {
  SectionTitle,
  MiniStat,
  FactRow,
  OrchestrationFact,
  OrchestrationRunBadge,
  BackendTaskStatusBadge,
  ProjectTaskStatusDot,
  WorkOrderStatusBadge,
  WorkOrderPriorityBadge,
  BackendReviewBadge,
  ArtifactValidationBadge,
  OutputReviewBadge,
} from "../components/pm-project-ui";
import { BackendWorkOrdersPanel } from "../components/backend-work-orders-panel";
import { BackendOrchestrationPanel } from "../components/backend-orchestration-panel";
import { BackendKickoffPanel } from "../components/backend-kickoff-panel";
import { ProjectConversationPanel } from "@/shared/components/collaboration/project-conversation-panel";
import { BackendDocumentsPanel } from "../components/backend-documents-panel";
import { BackendTasksPanel } from "../components/backend-tasks-panel";
import { BackendDeliveryReviewPanel } from "../components/backend-delivery-review-panel";
import { BackendArtifactsPanel } from "../components/backend-artifacts-panel";
import { ProjectNextActionHero } from "../components/project-next-action-hero";
import { ProjectRepositoryPanel } from "../components/project-repository-panel";
import { ProjectIssueBoard } from "@/shared/components/issues/project-issue-board";
import { PMProjectSubnav, PM_PROJECT_DEFAULT_SECTION, PM_PROJECT_SECTION_IDS } from "../components/pm-project-subnav";
import {
  kickoffFormFromDetail,
  clientInviteSummary,
  projectManagerIds,
  orchestrationReadinessBlockers,
  workOrderDispatchBlocker,
  backendStatusBits,
  githubAutopushStatus,
  compactBackendError,
  formatBackendDate,
  groupArtifactsByAgent,
  orchestrationTriggerLabel,
} from "../utils/pm-project-detail.utils";

export function PMProjectDetailView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [backendProject, setBackendProject] = useState(null);
  const [backendLoading, setBackendLoading] = useState(true);
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    let active = true;
    setBackendLoading(true);
    setBackendError("");
    getDevFlowProject(projectId)
      .then((detail) => {
        if (!active) return;
        setBackendProject(detail);
      })
      .catch((error) => {
        if (!active) return;
        setBackendProject(null);
        setBackendError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!active) return;
        setBackendLoading(false);
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  if (backendProject) {
    return <BackendProjectDetail project={backendProject} onBack={() => router.push("/pm/projects")} />;
  }

  if (backendLoading) {
    return (
      <div>
        <PMPageHeader
          title="Loading project"
          subtitle={`Checking backend record for ${projectId}.`}
          actions={<Button variant="secondary" size="sm" icon={<IconArrowLeft size={14} />} onClick={() => router.push("/pm/projects")}>Back to projects</Button>}
        />
        <Card style={{ padding: 32, color: "var(--text-2)" }}>Loading backend project...</Card>
      </div>
    );
  }

  return (
    <div>
      <PMPageHeader
        title="Project not found"
        subtitle={`No backend project exists for ${projectId}.`}
        actions={<Button variant="secondary" size="sm" icon={<IconArrowLeft size={14} />} onClick={() => router.push("/pm/projects")}>Back to projects</Button>}
      />
      <Card style={{ padding: 32 }}>
        <div className="row gap-3">
          <IconFolder size={24} style={{ color: "var(--text-3)" }} />
          <div>
            <div style={{ fontWeight: 600 }}>This project is not available from the backend.</div>
            <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>{compactBackendError(backendError) || "Open the project list and select an active backend project."}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BackendProjectDetail({ project, onBack }) {
  const router = useRouter();
  const [detail, setDetail] = useState(project);
  const [tab, setTab] = useState(PM_PROJECT_DEFAULT_SECTION);
  const [startingDelivery, setStartingDelivery] = useState(false);
  const outputs = useDevFlowProjectOutputs(detail.id, { includeDocuments: true, includeEvents: true, includeTasks: true, includeTimeline: true, includeWorkOrders: true });
  const orchestration = useDevFlowOrchestrationStatus(detail.id);
  const provider = useDevFlowOrchestrationProviderStatus(detail.id);
  const modelSelection = useOrchestrationModelSelection(detail.id);
  const [orchestrationRuns, setOrchestrationRuns] = useState([]);
  const [orchestrationRunsLoading, setOrchestrationRunsLoading] = useState(false);
  const [orchestrationRunsError, setOrchestrationRunsError] = useState("");
  const [deliveryReadiness, setDeliveryReadiness] = useState(null);
  const [deliveryReadinessLoading, setDeliveryReadinessLoading] = useState(false);
  const [deliveryReadinessError, setDeliveryReadinessError] = useState("");
  const [githubVerification, setGithubVerification] = useState(null);
  const [githubVerificationLoading, setGithubVerificationLoading] = useState(false);
  const [githubVerificationError, setGithubVerificationError] = useState("");
  const [llmVerification, setLlmVerification] = useState(null);
  const [llmVerificationLoading, setLlmVerificationLoading] = useState(false);
  const [llmVerificationError, setLlmVerificationError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab && requestedTab !== "intake" && PM_PROJECT_SECTION_IDS.has(requestedTab)) {
      setTab(requestedTab);
    }
  }, [project.id]);
  const [starting, setStarting] = useState(false);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [orchestrationAction, setOrchestrationAction] = useState("");
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [error, setError] = useState("");
  const [memberSearchError, setMemberSearchError] = useState("");
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [form, setForm] = useState({
    companyName: project.companyName,
    brief: project.brief,
    stackKey: project.stackKey,
    status: project.status,
    repoUrl: project.repoUrl || "",
  });
  const [memberForm, setMemberForm] = useState({ email: "", role: "DEV" });

  const status = backendStatusBits(detail.status);
  const lifecycle = detail.lifecycle || {
    label: status.label,
    tone: status.tone,
    nextAction: "Open project",
    progress: 0,
    signals: {},
  };
  const lifecycleStageId = mapProjectStatusToLifecycleStage(detail.status, detail.kickoff?.status);
  const lifecycleStageIndex = getStageIndex(lifecycleStageId);
  const completedStagesFromProject = new Set(
    ["draft", "kickoff", "build", "review", "delivered"].slice(0, lifecycleStageIndex) as any,
  );
  const budgetPct = detail.runBudget
    ? Math.min(100, Math.round((detail.runBudget.tokensConsumed / detail.runBudget.tokenBudget) * 100))
    : 0;
  const managerIds = projectManagerIds(detail);
  const orchestrationBlockers = orchestrationReadinessBlockers(detail, outputs.workOrders, outputs.loading);
  const providerActionBlocked = provider.loading || provider.error || (provider.status && !provider.status.available);
  const canStartOrchestration = orchestrationBlockers.length === 0 && !detail.runId && !starting && !providerActionBlocked;
  const refreshOrchestrationRuns = async (quiet = false) => {
    if (!quiet) setOrchestrationRunsLoading(true);
    setOrchestrationRunsError("");
    try {
      setOrchestrationRuns(await getDevFlowOrchestrationRuns(detail.id));
    } catch (nextError) {
      setOrchestrationRunsError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      if (!quiet) setOrchestrationRunsLoading(false);
    }
  };

  const refreshDeliveryReadiness = async () => {
    setDeliveryReadinessLoading(true);
    setDeliveryReadinessError("");
    try {
      setDeliveryReadiness(await getDevFlowDeliveryReadiness(detail.id));
    } catch (nextError) {
      setDeliveryReadiness(null);
      setDeliveryReadinessError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setDeliveryReadinessLoading(false);
    }
  };

  const verifyGithubDelivery = async () => {
    setGithubVerificationLoading(true);
    setGithubVerificationError("");
    try {
      setGithubVerification(await verifyDevFlowGithubDelivery(detail.id));
      await provider.refresh?.();
    } catch (nextError) {
      setGithubVerification(null);
      setGithubVerificationError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setGithubVerificationLoading(false);
    }
  };

  const verifyLlmProvider = async () => {
    setLlmVerificationLoading(true);
    setLlmVerificationError("");
    try {
      setLlmVerification(await verifyDevFlowLlmProvider(detail.id));
      await provider.refresh?.();
    } catch (nextError) {
      setLlmVerification(null);
      setLlmVerificationError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLlmVerificationLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const query = memberForm.email.trim();
    setSelectedProfile(null);
    setMemberSearchError("");

    if (query.length < 2) {
      setMemberSearchResults([]);
      setMemberSearchLoading(false);
      return () => {
        active = false;
      };
    }

    setMemberSearchLoading(true);
    const timeout = window.setTimeout(() => {
      searchDevFlowProfiles({
        q: query,
        roles: [memberForm.role],
        limit: 8,
      })
        .then((profiles) => {
          if (!active) return;
          setMemberSearchResults(profiles);
        })
        .catch((nextError) => {
          if (!active) return;
          setMemberSearchResults([]);
          setMemberSearchError(nextError instanceof Error ? nextError.message : String(nextError));
        })
        .finally(() => {
          if (!active) return;
          setMemberSearchLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [memberForm.email, memberForm.role]);

  useEffect(() => {
    refreshOrchestrationRuns();
    refreshDeliveryReadiness();
  }, [detail.id]);

  // WebSocket subscription replaces 4-second polling for live orchestration state
  const fallbackPollFn = useCallback(async () => {
    try {
      const result = await getDevFlowOrchestrationStatus(detail.id);
      return result ? { status: result.status, currentNode: result.currentNode ?? '', runId: result.runId ?? '' } : null;
    } catch {
      return null;
    }
  }, [detail.id]);

  useSocketSubscription({
    projectId: detail.id,
    initialStatus: detail.status,
    initialCurrentNode: detail.runId ? 'started' : undefined,
    initialRunId: detail.runId ?? undefined,
    onStateChange: (state) => {
      setDetail((prev) => prev ? { ...prev, status: state.status as DevFlowProjectStatus } : prev);
    },
    fallbackPollFn,
  });

  // Refresh outputs when orchestration state transitions
  useEffect(() => {
    if (!orchestration.status?.currentNode) return;
    outputs.refresh?.();
  }, [orchestration.status?.currentNode]);

  const saveProject = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateDevFlowProject(detail.id, {
        ...form,
        repoUrl: form.repoUrl.trim() || undefined,
      });
      setDetail(updated);
      setForm({
        companyName: updated.companyName,
        brief: updated.brief,
        stackKey: updated.stackKey,
        status: updated.status,
        repoUrl: updated.repoUrl || "",
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  };

  const addMember = async () => {
    if (!selectedProfile) {
      setError("Select an existing profile before adding a member.");
      return;
    }
    if (selectedProfile.role !== memberForm.role) {
      setError(`Selected profile is ${selectedProfile.role}. Choose a matching ${selectedProfile.role} project role before adding this member.`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await addDevFlowProjectMember(detail.id, {
        userId: selectedProfile.id,
        role: memberForm.role,
      });
      setDetail(updated);
      setMemberForm({ email: "", role: "DEV" });
      setSelectedProfile(null);
      setMemberSearchResults([]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (userId) => {
    setSaving(true);
    setError("");
    try {
      setDetail(await removeDevFlowProjectMember(detail.id, userId));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRepo = async () => {
    setCreatingRepo(true);
    setError("");
    try {
      const result = await createDevFlowAdminRepository(detail.id);
      setDetail({ ...detail, repoUrl: result.repoUrl });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setCreatingRepo(false);
    }
  };

  // startRun / approveGate / rerunReadyWorkOrders / retryFailedWorkOrder lived here.
  // All four call routes that are now @Roles(DEV, ADMIN), so keeping them would only give
  // the PM console four ways to trigger a 403. They moved to the developer workspace.

  const projectJourney = makeProjectJourneyContext({
    role: "pm",
    project: detail,
    providerStatus: provider.status,
    providerError: provider.error,
    loading: outputs.loading || provider.loading,
    pendingActions: outputs.tasks.filter((task) => task.status !== "DONE").length + outputs.workOrders.filter((workOrder) => ["READY", "RUNNING", "FAILED"].includes(workOrder.status)).length,
    blockers: orchestrationBlockers,
    // The PM's next action is never "start the build" any more — they cannot, the route is
    // DEV-only. What is theirs is provisioning the repository the developer will build in,
    // so that leads until it exists; after that the PM's job is reviewing what came out.
    primaryAction: detail.repoUrl
      ? {
          label: "Review artifacts",
          onClick: () => setTab("artifacts"),
          icon: <IconFolder size={13} />,
        }
      : {
          label: creatingRepo ? "Creating repository..." : "Create repository",
          onClick: handleCreateRepo,
          disabled: creatingRepo,
          icon: <IconGitBranch size={13} />,
        },
    secondaryAction: {
      label: "Delivery progress",
      onClick: () => setTab("work-orders"),
      variant: "secondary",
      icon: <IconWorkflow size={13} />,
    },
  });

  /**
   * Project status belongs on the landing section, not above every section.
   *
   * It was promoted out of the old Overview tab to render everywhere, which sounded like
   * "never lose the context" and read as "scroll past 700px of banners, stepper, hero and
   * guidance to reach the board you opened". A section you navigated to should start at its
   * own content; Repository is where you go to ask where the project is up to.
   */
  const showProjectStatus = tab === PM_PROJECT_DEFAULT_SECTION;

  return (
    <div className="pm-project-workspace" data-screen-label={`PM - Backend Project - ${detail.id}`}>
      <PMProjectSubnav
        projectId={detail.id}
        projectName={detail.companyName}
        activeItem={tab}
        onSelect={(nextTab) => {
          setTab(nextTab);
          const query = nextTab === PM_PROJECT_DEFAULT_SECTION ? "" : `?tab=${encodeURIComponent(nextTab)}`;
          router.replace(`/pm/project/${detail.id}${query}`, { scroll: false });
        }}
      />

      <section className="pm-project-workspace-content">
      <PMPageHeader
        title={detail.client?.name ?? detail.companyName}
        subtitle={`${detail.stackKey} - ${detail.id}`}
        actions={
          <div className="row gap-2">
            <Button variant="secondary" size="sm" icon={<IconArrowLeft size={14} />} onClick={onBack}>All projects</Button>
            {detail.repoUrl && (
              <Button
                variant="secondary"
                size="sm"
                icon={<IconGitHub size={13} />}
                onClick={() => window.open(detail.repoUrl, "_blank", "noopener,noreferrer")}
              >
                Open repository
              </Button>
            )}
          </div>
        }
      />

      {showProjectStatus && detail.status === "DISCOVERY" && (
        <Card className="pm-discovery-banner">
          <div className="pm-discovery-copy">
            <strong>This project is in discovery</strong>
            <span>
              Talk to the client and collect the documents you need. Nothing is built and
              orchestration stays locked until you start delivery.
            </span>
          </div>
          <Button
            disabled={startingDelivery}
            onClick={async () => {
              setStartingDelivery(true);
              try {
                await startDevFlowProjectDelivery(detail.id);
                setDetail(await getDevFlowProject(detail.id));
              } finally {
                setStartingDelivery(false);
              }
            }}
          >
            {startingDelivery ? "Starting..." : "Start delivery"}
          </Button>
        </Card>
      )}

      {showProjectStatus && (detail.client ? (
        <button
          type="button"
          className="pm-project-client-chip"
          onClick={() => router.push(`/pm/clients/${detail.client.id}`)}
        >
          <IconBriefcase size={13} />
          <span>{detail.client.name}</span>
          <span className="pm-project-client-chip-hint">View client</span>
        </button>
      ) : (
        <button
          type="button"
          className="pm-unassigned-banner"
          style={{ marginBottom: 14 }}
          onClick={() => router.push("/pm/clients/unassigned")}
        >
          <span className="pm-unassigned-icon" aria-hidden="true"><IconAlertTriangle size={15} /></span>
          <span className="pm-unassigned-copy">
            <strong>This project has no client</strong>
            <span>It will not appear on any client page until you link it to a company.</span>
          </span>
          <span className="pm-unassigned-action">Link a client</span>
        </button>
      ))}

      {showProjectStatus && (
      <div className="pm-project-section-stack">
          <div className="project-detail-lifecycle">
            <ProjectLifecycleIndicator
              currentStage={lifecycleStageId}
              maxReachedStage={lifecycleStageId}
              completedStages={completedStagesFromProject}
            />
          </div>

          <ProjectNextActionHero
            projectName={detail.companyName}
            stackKey={detail.stackKey}
            status={detail.status}
            runId={detail.runId}
            repoUrl={detail.repoUrl}
            artifactCount={outputs.artifacts.length}
            hasRunBudget={Boolean(detail.runBudget)}
            tokensConsumed={detail.runBudget?.tokensConsumed}
            tokenBudget={detail.runBudget?.tokenBudget}
            retryCount={detail.runBudget?.retryCount}
            maxRetries={detail.runBudget?.maxRetries}
            orchestrationBlockers={orchestrationBlockers}
            providerAvailable={provider.status?.available}
            providerReason={provider.status?.reason || provider.error}
            // The PM observes the build; starting it and deciding the gates are the
            // developer's, so no start/approve handlers are passed at all. Repository
            // creation stays because provisioning the repo IS the PM's job here.
            canBuild={false}
            onCreateRepo={handleCreateRepo}
          />

          <GuidedActionPanel context={projectJourney} />
          <BlockingIssuePanel issues={projectJourney.blockers} />
      </div>
      )}

      {error && (
        <Card style={{ padding: 14, marginBottom: 16, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>
          {compactBackendError(error)}
        </Card>
      )}

      <div className="pm-project-section-stack">
        {/* Setup (kickoff) and Orchestration used to render here. Both are the developer's
            now — the backend answers 403 to a PM on every write behind them, so the panels
            were removed rather than left to fail on click. See pm-project-subnav.tsx. */}

        {/* Tasks and Work orders were two panels answering one question. Issues is that board;
            the human/agent split survives as its Members and Agents filter. The PM writes here
            — POST/PATCH /tasks accepts PM — but agent work orders stay read-only, because
            dispatching one is build execution and that is @Roles(DEV, ADMIN). */}
        {tab === "issues" && (
          <ProjectIssueBoard
            projectId={detail.id}
            tasks={outputs.tasks}
            workOrders={outputs.workOrders}
            members={detail.members}
            loading={outputs.loading}
            error={outputs.error}
            onChanged={async () => {
              await Promise.all([outputs.refresh?.(), refreshDeliveryReadiness()]);
            }}
          />
        )}

        {/* Orchestration and Gate decisions moved to the developer console:
            prompting, run control and both gate approvals are @Roles(DEV, ADMIN) now.
            The gate history lives with the person who decides it. */}

        {tab === "artifacts" && (
          <BackendArtifactsPanel
            projectId={detail.id}
            artifacts={outputs.artifacts}
            tasks={outputs.tasks}
            members={detail.members}
            loading={outputs.loading}
            error={outputs.error}
            emptyText="No generated artifacts have been recorded for this project yet."
            onChanged={outputs.refresh}
          />
        )}

        {tab === "delivery-review" && (
          <BackendDeliveryReviewPanel
            review={detail.deliveryReview}
            readiness={deliveryReadiness}
            readinessLoading={deliveryReadinessLoading}
            readinessError={deliveryReadinessError}
            onRefreshReadiness={refreshDeliveryReadiness}
            onResolve={async (note) => {
              await resolveDevFlowProjectDeliveryRevision(detail.id, { note });
              setDetail(await getDevFlowProject(detail.id));
              await Promise.all([outputs.refresh?.(), refreshDeliveryReadiness()]);
            }}
          />
        )}

        {tab === "messages" && (
          <ProjectConversationPanel
            projectId={detail.id}
            title="Client conversation"
            subtitle="Threads the client can see and reply to. Use Work orders or the team workspace for internal discussion."
            defaultVisibility="CLIENT"
            defaultCategory="GENERAL"
            emptyText="No client conversation yet. Start a thread to ask for the documents or details this project still needs."
          />
        )}

        {tab === "documents" && (
          <BackendDocumentsPanel
            projectId={detail.id}
            documents={outputs.documents}
            loading={outputs.loading}
            error={outputs.error}
            onChanged={async () => {
              await Promise.all([outputs.refresh?.(), refreshDeliveryReadiness()]);
            }}
          />
        )}

        {tab === "members" && (
          <div className="pm-tab-layout pm-tab-layout--aside">
              <Card className="pm-tab-panel pm-tab-panel--padded">
                <div className="pm-tab-header">
                  <SectionTitle title="Project members" subtitle="People who can access this project and their delivery role." />
                  <Badge tone="blue">{detail.members.length} members</Badge>
                </div>
                <div className="pm-tab-section">
                  {detail.members.length === 0 ? (
                    <div className="pm-tab-empty" style={{ padding: 0 }}>No assigned members yet.</div>
                  ) : detail.members.map((member) => {
                    const isLastManager = managerIds.has(member.userId) && managerIds.size <= 1;
                    return (
                      <div key={member.id} className="pm-tab-list-row">
                        <div className="row gap-3 pm-tab-list-row__content">
                          <BackendPersonAvatar profile={member.user} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{member.user.fullName || member.user.email || member.user.id}</div>
                            <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{member.user.email || "No email"} - {member.role}</div>
                            {isLastManager && <div style={{ color: "#FBBF24", fontSize: 11.5, marginTop: 3 }}>Last project manager cannot be removed.</div>}
                          </div>
                        </div>
                        <div className="pm-tab-list-row__actions">
                          <Button variant="secondary" size="sm" onClick={() => removeMember(member.userId)} disabled={saving || isLastManager}>Remove</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card className="pm-tab-panel pm-tab-panel--padded">
                <SectionTitle title="Add member" subtitle="Search signed-in developer or client profiles" />
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  <Field label="Project role">
                    <Select value={memberForm.role} onChange={(event) => setMemberForm((current) => ({ ...current, role: event.target.value }))}>
                      <option value="DEV">Developer</option>
                      <option value="CLIENT">Client</option>
                    </Select>
                  </Field>
                  <Field label="Search profile">
                    <Input value={memberForm.email} onChange={(event) => setMemberForm((current) => ({ ...current, email: event.target.value }))} placeholder="name or email" />
                  </Field>
                  <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", background: "rgba(8,14,32,.45)", minHeight: 94 }}>
                    {memberForm.email.trim().length < 2 ? (
                      <div style={{ padding: 14, color: "var(--text-3)", fontSize: 12.5 }}>Type at least 2 characters to search profiles.</div>
                    ) : memberSearchLoading ? (
                      <div style={{ padding: 14, color: "var(--text-2)", fontSize: 12.5 }}>Searching profiles...</div>
                    ) : memberSearchError ? (
                      <div style={{ padding: 14, color: "#FCA5A5", fontSize: 12.5 }}>{compactBackendError(memberSearchError)}</div>
                    ) : memberSearchResults.length === 0 ? (
                      <div style={{ padding: 14 }}>
                        <div style={{ color: "white", fontSize: 13, fontWeight: 600 }}>No matching profile found.</div>
                        <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>The user must sign in once before they can be assigned.</div>
                      </div>
                    ) : (
                      memberSearchResults.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => setSelectedProfile(profile)}
                          style={{
                            width: "100%", padding: "10px 12px", border: 0, borderBottom: "1px solid var(--border)",
                            background: selectedProfile?.id === profile.id ? "rgba(79,139,255,.14)" : "transparent",
                            color: "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                          }}
                        >
                          <div className="row gap-3">
                            <BackendPersonAvatar profile={profile} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{profile.fullName || profile.email || profile.id}</div>
                              <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{profile.email || "No email"}</div>
                            </div>
                            <Badge tone={profile.role === "DEV" ? "purple" : "blue"}>{profile.role}</Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {selectedProfile && (
                    <div style={{ color: "#6EE7B7", fontSize: 12 }}>
                      Selected {selectedProfile.fullName || selectedProfile.email || selectedProfile.id}.
                    </div>
                  )}
                  <Button variant="primary" size="sm" icon={<IconPlus size={13} />} onClick={addMember} disabled={saving || !selectedProfile}>Add selected member</Button>
                </div>
              </Card>
          </div>
        )}

        {/* Timeline rendered here. It was an audit log dominated by TASK_* and WORK_ORDER_*
            events, which is each issue's own activity now. The event stream and the shared
            component both remain — the developer console still lists them. */}

        {tab === "repository" && (
          <ProjectRepositoryPanel
            projectId={detail.id}
            groupId={detail.groupId ?? null}
            fallbackName={detail.companyName}
          />
        )}

        {tab === "settings" && (
          <Card className="pm-tab-panel pm-tab-panel--padded" style={{ maxWidth: 920 }}>
            <div className="pm-tab-header">
              <SectionTitle title="Project settings" subtitle="Update project identity, delivery status, and repository metadata." />
            </div>
            <div className="pm-tab-section">
              <div className="pm-tab-form-grid">
              <Field label="Company">
                <Input value={form.companyName} onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))} />
              </Field>
              <Field label="Stack">
                <Input value={form.stackKey} onChange={(event) => setForm((current) => ({ ...current, stackKey: event.target.value }))} />
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  <option value="PENDING">Pending</option>
                  <option value="PARSING_REQUIREMENTS">Parsing requirements</option>
                  <option value="NEGOTIATING_CONTRACT">Negotiating contract</option>
                  <option value="AWAITING_GATE_1">Awaiting gate 1</option>
                  <option value="GENERATING_CODE">Generating code</option>
                  <option value="AWAITING_GATE_2">Awaiting gate 2</option>
                  <option value="COMMITTING">Committing</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="FAILED">Failed</option>
                </Select>
              </Field>
              <Field label="Repo URL">
                <Input value={form.repoUrl} onChange={(event) => setForm((current) => ({ ...current, repoUrl: event.target.value }))} placeholder="https://github.com/org/repo" />
              </Field>
              <div className="pm-tab-form-span">
                <Field label="Brief">
                  <Textarea rows={5} value={form.brief} onChange={(event) => setForm((current) => ({ ...current, brief: event.target.value }))} />
                </Field>
              </div>
              </div>
              <div className="pm-tab-actions">
              <Button variant="primary" size="sm" icon={<IconCheck size={13} />} onClick={saveProject} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
      </section>
    </div>
  );
}

// BackendOrchestrationPanel → ../components/backend-orchestration-panel
// OrchestrationRunBadge, OrchestrationFact → ../components/pm-project-ui
// orchestrationTriggerLabel → ../utils/pm-project-detail.utils
// BackendKickoffPanel → ../components/backend-kickoff-panel
// BackendTasksPanel → ../components/backend-tasks-panel
// BackendWorkOrdersPanel → ../components/backend-work-orders-panel
// TaskActivityModal, TaskActivityRow, taskActivityLabel → ../components/backend-tasks-panel
// ProjectTaskStatusDot, BackendTaskStatusBadge → ../components/pm-project-ui
// WorkOrderStatusBadge, WorkOrderPriorityBadge → ../components/pm-project-ui

// BackendDeliveryReviewPanel → ../components/backend-delivery-review-panel
// deliveryReviewStatusView, ReviewNote → ../components/pm-project-ui
// BackendArtifactsPanel, ArtifactPreviewModal → ../components/backend-artifacts-panel
// BackendReviewBadge, ArtifactValidationBadge, ArtifactValidationPanel → ../components/backend-artifacts-panel
// workOrderAgentTypeFromArtifact, OutputReviewBadge → ../components/backend-artifacts-panel

function BackendPersonAvatar({ profile }) {
  const label = profile.fullName || profile.email || profile.id || "User";
  const initials = label
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #4F8BFF, #8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

