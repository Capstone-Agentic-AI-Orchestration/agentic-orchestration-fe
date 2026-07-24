// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/shared/components/ui";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import {
  IconActivity,
  IconArrowLeft,
  IconArrowRight,
} from "@/shared/components/icons";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { DevFlowProjectTimeline } from "@/shared/components/project-timeline/devflow-project-timeline";
import {
  useDevFlowProject,
  useDevFlowProjects,
} from "@/shared/hooks/use-devflow-projects";
import {
  compactDevFlowError,
  devflowLifecycleView,
  formatDevFlowDate,
} from "@/shared/utils/devflow-projects";
import { DevProjectDetailContentView } from "../view/dev-project-detail-view";
import { DevArtifactsPanelView } from "../view/dev-artifacts-panel-view";
import { DevTasksPanelView } from "../view/dev-tasks-panel-view";
import { DevWorkOrdersPanelView } from "../view/dev-work-orders-panel-view";
import { useDevProjectDetailViewModel } from "../view-model/use-dev-project-detail-view-model";
import { useDevArtifactsPanelViewModel } from "../view-model/use-dev-artifacts-panel-view-model";
import { useDevTasksPanelViewModel } from "../view-model/use-dev-tasks-panel-view-model";
import { useDevWorkOrdersPanelViewModel } from "../view-model/use-dev-work-orders-panel-view-model";

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
    <div data-screen-label="Dev - My Projects" className="dev-workspace-page">
      <DevPageHeader
        title="My projects"
        subtitle="Assigned delivery work, progress, and the next action in one scan."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<IconActivity size={13} />}
            onClick={refresh}
          >
            Refresh
          </Button>
        }
      />

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
      <Card className="dev-muted-state">
        Loading assigned projects…
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="dev-error-state">
        <strong>Projects unavailable</strong>
        <span>{compactDevFlowError(error)}</span>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="dev-empty-lead">
        <h2>No assignments yet</h2>
        <p>
          A project manager must add this developer profile to a project before
          it appears here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="dev-list-card">
          <div className="dev-project-table-head" aria-hidden="true">
            <span>Project</span>
            <span>Status</span>
            <span>Progress</span>
            <span>My work</span>
            <span>Next action</span>
            <span>Updated</span>
            <span />
          </div>
      <div className="dev-project-list" role="list">
        {projects.map((project) => (
          <BackendProjectRow
            key={project.id}
            project={project}
            onOpen={() => onOpen(project.id)}
          />
        ))}
      </div>
    </Card>
  );
}

function BackendProjectRow({ project, onOpen }) {
  const lifecycle = devflowLifecycleView(project);

  return (
    <button
      className="dev-project-table-row"
      onClick={onOpen}
      role="listitem"
    >
      <div className="dev-project-row-name">
        <strong>{project.companyName}</strong>
        <span>{project.id}</span>
      </div>
      <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
      <div className="dev-table-progress">
        <div>
          <span style={{ width: `${lifecycle.progress}%` }} />
        </div>
        <small>{lifecycle.progress}%</small>
      </div>
      <div className="dev-project-row-work">
        <span>{lifecycle.signals?.openTasks || 0} tasks</span>
        <span>{lifecycle.signals?.activeWorkOrders || 0} handoffs</span>
      </div>
      <span className="dev-project-row-next">{lifecycle.nextAction}</span>
      <span className="dev-project-row-date">
        {formatDevFlowDate(project.updatedAt || project.createdAt)}
      </span>
      <IconArrowRight size={14} aria-hidden />
    </button>
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

  const openOrchestrator = () => {
    setSelectedProjectId(project.id);
    router.push("/dev/orchestrator");
  };
  const vm = useDevProjectDetailViewModel({
    project,
    onBack,
    onOpenOrchestrator: openOrchestrator,
  });
  const outputs = vm.outputs;
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "tasks", label: "Tasks", count: outputs.tasks.length },
    { id: "handoffs", label: "Handoffs", count: outputs.workOrders.length },
    { id: "artifacts", label: "Artifacts", count: outputs.artifacts.length },
    { id: "activity", label: "Activity", count: outputs.timeline.length },
  ];

  return (
    <div className="dev-project-detail">
      <nav className="dev-detail-tabs" aria-label="Project workspace">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "is-active" : undefined}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {typeof item.count === "number" && <span>{item.count}</span>}
          </button>
        ))}
      </nav>

      {tab === "overview" && <DevProjectDetailContentView vm={vm} />}
      {tab === "tasks" && (
        <DevBackendTasks
          projectId={project.id}
          tasks={outputs.tasks}
          loading={outputs.loading}
          error={outputs.error}
          onChanged={outputs.refresh}
        />
      )}
      {tab === "handoffs" && (
        <DevBackendWorkOrders
          workOrders={outputs.workOrders}
          loading={outputs.loading}
          error={outputs.error}
        />
      )}
      {tab === "artifacts" && (
        <DevBackendArtifacts
          artifacts={outputs.artifacts}
          loading={outputs.loading}
          error={outputs.error}
        />
      )}
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

function DevBackendWorkOrders({ workOrders, loading, error }) {
  const vm = useDevWorkOrdersPanelViewModel({
    workOrders,
    loading,
    error,
  });
  return <DevWorkOrdersPanelView vm={vm} />;
}

function DevBackendArtifacts({ artifacts, loading, error }) {
  const vm = useDevArtifactsPanelViewModel({ artifacts, loading, error });
  return <DevArtifactsPanelView vm={vm} />;
}
