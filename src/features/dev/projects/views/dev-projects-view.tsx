// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/shared/components/ui";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCpu,
  IconRefresh,
} from "@/shared/components/icons";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { DevFlowProjectTimeline } from "@/shared/components/project-timeline/devflow-project-timeline";
import {
  getStageIndex,
  LIFECYCLE_STAGES,
  mapProjectStatusToLifecycleStage,
  ProjectLifecycleIndicator,
} from "@/shared/components/project-lifecycle/project-lifecycle-indicator";
import {
  useDevFlowProject,
  useDevFlowProjects,
} from "@/shared/hooks/use-devflow-projects";
import {
  compactDevFlowError,
  devflowLifecycleView,
} from "@/shared/utils/devflow-projects";
import { DevProjectDetailContentView, DevProjectMembersView } from "../view/dev-project-detail-view";
import { DevArtifactsPanelView } from "../view/dev-artifacts-panel-view";
import { DevTasksPanelView } from "../view/dev-tasks-panel-view";
import { useDevProjectDetailViewModel } from "../view-model/use-dev-project-detail-view-model";
import { useDevArtifactsPanelViewModel } from "../view-model/use-dev-artifacts-panel-view-model";
import { useDevTasksPanelViewModel } from "../view-model/use-dev-tasks-panel-view-model";
import { DevProjectSubnav } from "../components/dev-project-subnav";
import { DevOutputView } from "./dev-output-view";
import { BackendKickoffPanel, BackendWorkOrdersPanel } from "@/features/delivery/panels";
import { formatBackendDate } from "@/features/pm/projects/utils/pm-project-detail.utils";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";

export function DevProjectsView() {
  const router = useRouter();
  const { setSelectedProjectId } = useSelectedDevFlowProject();
  const {
    projects: backendProjects,
    loading,
    error,
    refresh,
  } = useDevFlowProjects();

  const openProject = (projectId) => {
    setSelectedProjectId(projectId);
    router.push(`/dev/project/${projectId}`);
  };

  return (
    <div data-screen-label="Dev - My Projects" className="pm-projects-flat-page dev-projects-flat-page">
      <div className="pm-projects-flat-actions">
        <button type="button" className="pm-project-create-tab" onClick={refresh}>
          <IconRefresh size={14} /> Refresh projects
        </button>
      </div>

      <BackendAssignedProjects
        projects={backendProjects}
        loading={loading}
        error={error}
        onOpen={openProject}
      />
    </div>
  );
}

function BackendAssignedProjects({ projects, loading, error, onOpen }) {
  if (loading && projects.length === 0) {
    return (
      <div className="pm-projects-flat-loading" aria-label="Loading assigned projects">
        {[0, 1, 2].map((index) => <span key={index} />)}
      </div>
    );
  }

  if (error) {
    return (
      <p className="pm-projects-flat-message is-error">{compactDevFlowError(error)}</p>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="dev-projects-flat-empty">
        <h2>No assignments yet</h2>
        <p>
          A project manager must add this developer profile to a project before
          it appears here.
        </p>
      </div>
    );
  }

  return (
    <div className="pm-projects-flat-list" role="list">
        {projects.map((project, index) => (
          <BackendProjectRow
            key={project.id}
            project={project}
            index={index}
            onOpen={() => onOpen(project.id)}
          />
        ))}
    </div>
  );
}

function BackendProjectRow({ project, index, onOpen }) {
  const lifecycle = devflowLifecycleView(project);
  const signals = lifecycle.signals ?? {};

  return (
    <article className="pm-project-flat-row reveal" style={{ "--i": index }} role="listitem">
      <button type="button" className="pm-project-flat-main" onClick={onOpen}>
        <span className="pm-project-flat-identity">
          <strong>{project.companyName}</strong>
          <small className="mono">{project.id}</small>
        </span>

        <span className="pm-project-flat-stage">
          <small>{signals.openTasks || 0} tasks · {signals.activeWorkOrders || 0} handoffs</small>
          <strong>{lifecycle.label}</strong>
        </span>

        <span className="pm-project-flat-progress" aria-label={`${lifecycle.progress}% complete`}>
          <span style={{ width: `${lifecycle.progress}%` }} />
        </span>
      </button>

      <button type="button" className="pm-project-flat-action" onClick={onOpen}>
        {lifecycle.nextAction || "Open project"} <IconArrowRight size={14} />
      </button>
    </article>
  );
}

export function DevProjectDetailView({ projectId }) {
  const router = useRouter();
  const {
    project: backendProject,
    loading: backendLoading,
    error: backendError,
  } = useDevFlowProject(projectId);

  if (backendProject) {
    return (
      <BackendDevProjectDetail
        project={backendProject}
        onBack={() => router.push("/dev/projects")}
      />
    );
  }

  if (backendLoading) {
    return (
      <div data-screen-label={`Dev - Project - ${projectId}`}>
        <ProjectBackButton onClick={() => router.push("/dev/projects")} />
        <Card className="dev-muted-state">Loading project workspace…</Card>
      </div>
    );
  }

  return (
    <div data-screen-label={`Dev - Project - ${projectId}`}>
      <ProjectBackButton onClick={() => router.push("/dev/projects")} />
      <Card className="dev-error-state">
        <strong>Project not available</strong>
        <span>
          {compactDevFlowError(backendError) ||
            "This project is not assigned to this developer account."}
        </span>
      </Card>
    </div>
  );
}

function ProjectBackButton({ onClick }) {
  return (
    <button className="dev-back-link" onClick={onClick}>
      <IconArrowLeft size={13} /> My projects
    </button>
  );
}

function BackendDevProjectDetail({ project, onBack }) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const { setSelectedProjectId } = useSelectedDevFlowProject();

  useEffect(() => {
    setSelectedProjectId(project.id);
  }, [project.id, setSelectedProjectId]);

  // This project's build workspace. It used to open the console-level orchestrator, which then
  // asked which project to run — from inside a project, which had already answered that.
  const openOrchestrator = () => {
    setSelectedProjectId(project.id);
    router.push(`/dev/orchestrate/${project.id}`);
  };
  const vm = useDevProjectDetailViewModel({
    project,
    onBack,
    onOpenOrchestrator: openOrchestrator,
  });
  const outputs = vm.outputs;
  const lifecycleStageId = mapProjectStatusToLifecycleStage(project.status, project.kickoffStatus);
  const completedStages = new Set(
    LIFECYCLE_STAGES
      .slice(0, getStageIndex(lifecycleStageId))
      .map((stage) => stage.id),
  );

  return (
    <div className="pm-project-workspace dev-project-workspace" data-screen-label={`Dev - Backend Project - ${project.id}`}>
      <DevProjectSubnav projectName={project.companyName} activeItem={tab} onSelect={setTab} />

      <section className="pm-project-workspace-content">
        <DevPageHeader
          title={project.companyName}
          subtitle={`${project.stackKey} - ${project.id}`}
          actions={
            <>
              <Button variant="secondary" size="sm" icon={<IconArrowLeft size={13} />} onClick={onBack}>
                All projects
              </Button>
              <Button variant="secondary" size="sm" icon={<IconCpu size={13} />} onClick={openOrchestrator}>
                Open build workspace
              </Button>
            </>
          }
        />

        <div className="pm-project-section-stack">
          {tab === "overview" && (
            <>
              <div className="project-detail-lifecycle">
                <ProjectLifecycleIndicator
                  currentStage={lifecycleStageId}
                  maxReachedStage={lifecycleStageId}
                  completedStages={completedStages}
                  onClickStage={openOrchestrator}
                />
              </div>
              <DevProjectDetailContentView vm={vm} />
            </>
          )}
          {tab === "tasks" && (
            <DevBackendTasks
              projectId={project.id}
              tasks={outputs.tasks}
              loading={outputs.loading}
              error={outputs.error}
              onChanged={outputs.refresh}
            />
          )}
          {/* The build sections. These arrived from the PM console with the role split:
              prompting, kickoff, work-order dispatch and gate approval are the developer's,
              and the backend now enforces that with @Roles(DEV, ADMIN). They render the same
              panels the PM used to own, writable here and `readOnly` over there. */}
          {tab === "setup" && (
            <BackendKickoffPanel
              detail={project}
              tasks={outputs.tasks}
              workOrders={outputs.workOrders}
              documents={outputs.documents}
              loading={outputs.loading}
              error={outputs.error}
              onChanged={outputs.refresh}
            />
          )}
          {tab === "work-orders" && (
            <BackendWorkOrdersPanel
              projectId={project.id}
              workOrders={outputs.workOrders}
              tasks={outputs.tasks}
              artifacts={outputs.artifacts}
              loading={outputs.loading}
              error={outputs.error}
              onChanged={outputs.refresh}
            />
          )}
          {tab === "orchestration" && (
            <Card className="pm-tab-panel pm-tab-panel--padded">
              <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Start and steer this project&apos;s run from the build workspace, where the
                prompt, the model selection and the live run controls are together.
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<IconCpu size={13} />}
                style={{ marginTop: 14 }}
                onClick={() => router.push(`/dev/orchestrate/${project.id}`)}
              >
                Open build workspace
              </Button>
            </Card>
          )}
          {tab === "gates" && (
            <DevGateDecisions gates={project.gates ?? []} />
          )}
          {tab === "output" && <DevOutputView project={project} outputs={outputs} />}
          {tab === "artifacts" && (
            <DevBackendArtifacts
              artifacts={outputs.artifacts}
              loading={outputs.loading}
              error={outputs.error}
            />
          )}
          {tab === "members" && <DevProjectMembersView vm={vm} />}
          {tab === "activity" && (
            <Card className="dev-activity-panel">
              <DevFlowProjectTimeline
                timeline={outputs.timeline}
                loading={outputs.loading}
                error={outputs.error}
                emptyText="No project timeline events yet."
                compactError={compactDevFlowError}
              />
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function DevBackendTasks({
  projectId,
  tasks,
  loading,
  error,
  onChanged,
}) {
  const vm = useDevTasksPanelViewModel({
    projectId,
    tasks,
    loading,
    error,
    onChanged,
  });
  return <DevTasksPanelView vm={vm} />;
}

function DevBackendArtifacts({ artifacts, loading, error }) {
  const vm = useDevArtifactsPanelViewModel({ artifacts, loading, error });
  return <DevArtifactsPanelView vm={vm} />;
}

/**
 * Gate history for the developer, who now records these decisions.
 *
 * Approving or rejecting still happens in the build workspace (/dev/orchestrate), where the
 * gate step shows the artifact under review next to the decision — a decision list is the
 * wrong place to approve from. This is the record of what was decided and when.
 */
function DevGateDecisions({ gates }) {
  return (
    <Card className="pm-tab-panel pm-tab-panel--padded">
      <div className="pm-tab-header">
        <SectionTitle
          title="Gate decisions"
          subtitle="Architecture and delivery approvals recorded for this project."
        />
        <Badge tone={gates.length > 0 ? "blue" : "gray"}>{gates.length} decisions</Badge>
      </div>
      <div className="pm-tab-section">
        {gates.length === 0 ? (
          <div className="pm-tab-empty" style={{ padding: 0 }}>
            No gate decisions recorded yet. Gate 1 opens once the contract is generated.
          </div>
        ) : (
          <div className="pm-tab-list">
            {gates.map((gate) => (
              <div key={gate.id} className="pm-tab-list-row">
                <div className="pm-tab-list-row__content">
                  <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{gate.gateType}</div>
                    <Badge tone={gate.decision === "APPROVED" ? "green" : "red"}>{gate.decision}</Badge>
                  </div>
                  <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>
                    {formatBackendDate(gate.decidedAt)}
                  </div>
                  {gate.notes && (
                    <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 6 }}>{gate.notes}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
