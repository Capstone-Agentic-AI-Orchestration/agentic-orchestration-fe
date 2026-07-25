// @ts-nocheck
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AgentLiveStrip } from "@/features/pm/shared/components/pm-agent-live-strip";
import { ActivityConsole } from "@/shared/components/orchestration/activity-console";
import { RunStatusBanner } from "@/shared/components/orchestration/run-status-banner";
import { useSocketSubscription } from "@/shared/hooks/use-socket-subscription";
import { PMPageHeader } from "@/features/pm/shared/components/pm-page-header";
import { Badge, Button, Card, Field, Input, Modal, Select, Tabs, Textarea } from "@/shared/components/ui";
import { DevFlowProjectTimeline } from "@/shared/components/project-timeline/devflow-project-timeline";
import { OrchestrationProviderStatusPanel } from "@/shared/components/orchestration/orchestration-provider-status-panel";
import { OrchestrationLiveVisualizer } from "@/shared/components/orchestration/orchestration-live-visualizer";
import { BlockingIssuePanel, GuidedActionPanel } from "@/shared/components/journey";
import { makeProjectJourneyContext } from "@/shared/journey";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconCircle,
  IconClipboard,
  IconClose,
  IconCode,
  IconCpu,
  IconDatabase,
  IconDownload,
  IconEdit,
  IconExternalLink,
  IconFileText,
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
  IconRocket,
  IconSearch,
  IconSend,
  IconSettings,
  IconShield,
  IconStar,
  IconUpload,
  IconUser,
  IconUsers,
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
import { BackendTasksPanel } from "../components/backend-tasks-panel";
import { BackendDeliveryReviewPanel } from "../components/backend-delivery-review-panel";
import { BackendArtifactsPanel } from "../components/backend-artifacts-panel";
import { ProjectNextActionHero } from "../components/project-next-action-hero";
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
  const [detail, setDetail] = useState(project);
  const [tab, setTab] = useState("build");
  const outputs = useDevFlowProjectOutputs(detail.id, { includeEvents: true, includeTasks: true, includeTimeline: true, includeWorkOrders: true });
  const orchestration = useDevFlowOrchestrationStatus(detail.id);
  const provider = useDevFlowOrchestrationProviderStatus(detail.id);
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
  const [starting, setStarting] = useState(false);
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

  const startRun = async () => {
    const blockers = orchestrationReadinessBlockers(detail, outputs.workOrders, outputs.loading);
    const providerBlocker = provider.error || (provider.status && !provider.status.available ? provider.status.reason : "");
    if (provider.loading) {
      setError("Wait for the agent provider check to finish before starting orchestration.");
      return;
    }
    if (providerBlocker) {
      setError(providerBlocker);
      return;
    }
    if (blockers.length && !detail.runId) {
      setError(blockers[0]);
      setTab(blockers[0].includes("work order") ? "build" : "build");
      return;
    }

    setStarting(true);
    setError("");
    try {
      await startDevFlowOrchestration(detail.id, {
        designGuidance: loadDesignGuidance(detail.id),
      });
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      setDetail(await getDevFlowProject(detail.id));
      await Promise.all([outputs.refresh?.(), orchestration.refresh?.(), provider.refresh?.(), refreshOrchestrationRuns(), refreshDeliveryReadiness()]);
      setTab("build");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setStarting(false);
    }
  };

  const [gateAction, setGateAction] = useState("");

  const approveGate = async (gate: "architecture" | "code", approved: boolean) => {
    setGateAction(`${gate}-${approved}`);
    setError("");
    try {
      const fn = gate === "architecture" ? approveDevFlowGate1 : approveDevFlowGate2;
      await fn(detail.id, approved);
      setDetail(await getDevFlowProject(detail.id));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setGateAction("");
    }
  };

  const rerunReadyWorkOrders = async () => {
    const blockers = orchestrationReadinessBlockers(detail, outputs.workOrders, outputs.loading, true);
    if (blockers.length) {
      setError(blockers[0]);
      return;
    }

    setOrchestrationAction("rerun-ready");
    setError("");
    try {
      await rerunReadyDevFlowWorkOrders(detail.id);
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      setDetail(await getDevFlowProject(detail.id));
      await Promise.all([outputs.refresh?.(), orchestration.refresh?.(), provider.refresh?.(), refreshOrchestrationRuns(), refreshDeliveryReadiness()]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setOrchestrationAction("");
    }
  };

  const retryFailedWorkOrder = async (workOrderId) => {
    setOrchestrationAction(workOrderId);
    setError("");
    try {
      await retryDevFlowWorkOrder(detail.id, workOrderId);
      await Promise.all([outputs.refresh?.(), orchestration.refresh?.(), refreshOrchestrationRuns(), refreshDeliveryReadiness()]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setOrchestrationAction("");
    }
  };
  const projectJourney = makeProjectJourneyContext({
    role: "pm",
    project: detail,
    providerStatus: provider.status,
    providerError: provider.error,
    loading: outputs.loading || provider.loading,
    pendingActions: outputs.tasks.filter((task) => task.status !== "DONE").length + outputs.workOrders.filter((workOrder) => ["READY", "RUNNING", "FAILED"].includes(workOrder.status)).length,
    blockers: orchestrationBlockers,
    primaryAction: {
      label: canStartOrchestration ? "Start build run" : detail.runId ? "Open build run" : "Resolve blockers",
      onClick: canStartOrchestration ? startRun : () => setTab("build"),
      disabled: starting,
    },
    secondaryAction: { label: "Guided wizard", href: `/pm/orchestrate/${detail.id}/brief`, variant: "secondary", icon: <IconWorkflow size={13} /> },
  });

  return (
    <div data-screen-label={`PM - Backend Project - ${detail.id}`}>
      <PMPageHeader
        title={detail.companyName}
        subtitle={`${detail.stackKey} - ${detail.id}`}
        actions={
          <div className="row gap-2">
            <Button variant="secondary" size="sm" icon={<IconArrowLeft size={14} />} onClick={onBack}>All projects</Button>
            <Button variant="secondary" size="sm" icon={<IconWorkflow size={13} />} onClick={() => router.push(`/pm/orchestrate/${detail.id}/brief`)}>
              Guided wizard
            </Button>
            <Button variant="secondary" size="sm" icon={<IconClipboard size={13} />} onClick={() => router.push(`/pm/project/${detail.id}/intake`)}>
              Review intake
            </Button>
          </div>
        }
      />

      {/* Lifecycle indicator */}
      <div className="project-detail-lifecycle">
        <ProjectLifecycleIndicator
          currentStage={lifecycleStageId}
          maxReachedStage={lifecycleStageId}
          completedStages={completedStagesFromProject}
          onClickStage={(stage) => router.push(`/pm/orchestrate/${detail.id}/${stage === "draft" ? "brief" : stage === "kickoff" ? "review" : stage === "build" ? "run" : stage === "review" ? "gate-2" : "delivery"}`)}
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
        isStarting={starting}
        onStart={startRun}
        onApproveGate1={() => approveGate("architecture", true)}
        onRejectGate1={() => approveGate("architecture", false)}
        onApproveGate2={() => approveGate("code", true)}
        onRejectGate2={() => approveGate("code", false)}
        onCreateRepo={handleCreateRepo}
      />

      <GuidedActionPanel context={projectJourney} />
      <BlockingIssuePanel issues={projectJourney.blockers} />

      {error && (
        <Card style={{ padding: 14, marginBottom: 16, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>
          {compactBackendError(error)}
        </Card>
      )}

      <Tabs
        items={[
          { value: "build", label: "Build" },
          { value: "review", label: "Review" },
          { value: "team", label: "Team" },
          { value: "settings", label: "Settings" },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div style={{ marginTop: 18 }}>
        {tab === "build" && (
          <div style={{ display: "grid", gap: 18 }}>
            <BackendKickoffPanel
              detail={detail}
              tasks={outputs.tasks}
              workOrders={outputs.workOrders}
              loading={outputs.loading}
              error={outputs.error}
              onChanged={async () => {
                setDetail(await getDevFlowProject(detail.id));
                await Promise.all([outputs.refresh?.(), refreshDeliveryReadiness()]);
              }}
            />
            <BackendTasksPanel
              projectId={detail.id}
              tasks={outputs.tasks}
              artifacts={outputs.artifacts}
              members={detail.members}
              loading={outputs.loading}
              error={outputs.error}
              onChanged={async () => {
                await Promise.all([outputs.refresh?.(), refreshDeliveryReadiness()]);
              }}
            />
            <BackendWorkOrdersPanel
              projectId={detail.id}
              workOrders={outputs.workOrders}
              tasks={outputs.tasks}
              artifacts={outputs.artifacts}
              loading={outputs.loading}
              error={outputs.error}
              onChanged={async () => {
                await Promise.all([outputs.refresh?.(), refreshDeliveryReadiness()]);
              }}
            />
            <BackendOrchestrationPanel
              detail={detail}
              status={orchestration.status}
              statusLoading={orchestration.loading}
              statusError={orchestration.error}
              providerStatus={provider.status}
              providerLoading={provider.loading}
              providerError={provider.error}
              githubVerification={githubVerification}
              githubVerificationLoading={githubVerificationLoading}
              githubVerificationError={githubVerificationError}
              llmVerification={llmVerification}
              llmVerificationLoading={llmVerificationLoading}
              llmVerificationError={llmVerificationError}
              workOrders={outputs.workOrders}
              artifacts={outputs.artifacts}
              events={outputs.events}
              runs={orchestrationRuns}
              runsLoading={orchestrationRunsLoading}
              runsError={orchestrationRunsError}
              blockers={orchestrationBlockers}
              starting={starting}
              actionId={orchestrationAction}
              creatingRepo={creatingRepo}
              onCreateRepo={handleCreateRepo}
              onStart={startRun}
              onRerunReady={rerunReadyWorkOrders}
              onRetryFailedWorkOrder={retryFailedWorkOrder}
              onVerifyGithubDelivery={verifyGithubDelivery}
              onVerifyLlmProvider={verifyLlmProvider}
              onRefresh={async () => {
                setDetail(await getDevFlowProject(detail.id));
                await Promise.all([outputs.refresh?.(), orchestration.refresh?.(), provider.refresh?.(), refreshOrchestrationRuns(), refreshDeliveryReadiness()]);
              }}
            />
          </div>
        )}

        {tab === "review" && (
          <div style={{ display: "grid", gap: 18 }}>
            {detail.gates.length > 0 && (
              <Card style={{ padding: 22 }}>
                <SectionTitle title="Gate decisions" subtitle="Architecture and code review gates" />
                <div style={{ marginTop: 12 }}>
                  {detail.gates.map((gate) => (
                    <div key={gate.id} style={{ padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                      <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{gate.gateType}</div>
                        <Badge tone={gate.decision === "APPROVED" ? "green" : "red"}>{gate.decision}</Badge>
                      </div>
                      <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>{formatBackendDate(gate.decidedAt)}</div>
                      {gate.notes && <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 6 }}>{gate.notes}</div>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
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
          </div>
        )}

        {tab === "team" && (
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18 }}>
              <Card style={{ padding: 22 }}>
                <SectionTitle title="Project members" subtitle="Users who can access this project" />
                <div style={{ marginTop: 12 }}>
                  {detail.members.length === 0 ? (
                    <div style={{ color: "var(--text-3)", fontSize: 13 }}>No assigned members yet.</div>
                  ) : detail.members.map((member) => {
                    const isLastManager = managerIds.has(member.userId) && managerIds.size <= 1;
                    return (
                      <div key={member.id} className="row" style={{ gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                        <BackendPersonAvatar profile={member.user} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{member.user.fullName || member.user.email || member.user.id}</div>
                          <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{member.user.email || "No email"} - {member.role}</div>
                          {isLastManager && <div style={{ color: "#FBBF24", fontSize: 11.5, marginTop: 3 }}>Last project manager cannot be removed.</div>}
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => removeMember(member.userId)} disabled={saving || isLastManager}>Remove</Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
              <Card style={{ padding: 22 }}>
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
            <DevFlowProjectTimeline
              timeline={outputs.timeline}
              loading={outputs.loading}
              error={outputs.error}
              emptyText="No timeline events have been recorded for this project yet."
              compactError={compactBackendError}
            />
          </div>
        )}

        {tab === "settings" && (
          <Card style={{ padding: 22, maxWidth: 780 }}>
            <SectionTitle title="Project settings" subtitle="Update backend project metadata" />
            <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
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
              <Field label="Brief">
                <Textarea rows={5} value={form.brief} onChange={(event) => setForm((current) => ({ ...current, brief: event.target.value }))} />
              </Field>
              <Button variant="primary" size="sm" icon={<IconCheck size={13} />} onClick={saveProject} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            </div>
          </Card>
        )}
      </div>
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

