// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/shared/components/ui";
import {
  IconArrowRight,
  IconCheckCircle,
  IconCpu,
  IconFolder,
  IconRefresh,
} from "@/shared/components/icons";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { useAuth } from "@/shared/auth/auth-provider";
import { getDevFlowDeveloper } from "@/shared/api/devflow-api";
import { useDevFlowProjects } from "@/shared/hooks/use-devflow-projects";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import {
  compactDevFlowError,
  devflowLifecycleView,
} from "@/shared/utils/devflow-projects";

const ATTENTION_STATUSES = new Set([
  "FAILED",
  "AWAITING_GATE_1",
  "AWAITING_GATE_2",
  "PARSING_REQUIREMENTS",
  "NEGOTIATING_CONTRACT",
  "GENERATING_CODE",
  "COMMITTING",
]);

export function DevDashboardView() {
  const router = useRouter();
  const { devFlowUser } = useAuth();
  const { setSelectedProjectId } = useSelectedDevFlowProject();
  const { projects, loading, error, refresh } = useDevFlowProjects();
  const [developer, setDeveloper] = useState(null);
  const [developerError, setDeveloperError] = useState("");

  const name =
    devFlowUser?.fullName ||
    devFlowUser?.email?.split("@")[0] ||
    "Developer";
  const openTasks = projects.reduce(
    (total, project) =>
      total + (project.lifecycle?.signals?.openTasks || 0),
    0,
  );
  const activeWorkOrders = projects.reduce(
    (total, project) =>
      total + (project.lifecycle?.signals?.activeWorkOrders || 0),
    0,
  );
  const activeRuns = projects.filter(
    (project) =>
      project.lifecycle?.signals?.orchestrationStarted &&
      project.status !== "DELIVERED",
  ).length;

  const focusProject = useMemo(
    () =>
      projects.find((project) => ATTENTION_STATUSES.has(project.status)) ||
      projects.find(
        (project) =>
          project.lifecycle?.signals?.openTasks ||
          project.lifecycle?.signals?.activeWorkOrders,
      ) ||
      projects[0] ||
      null,
    [projects],
  );
  const focusLifecycle = focusProject
    ? devflowLifecycleView(focusProject)
    : null;

  useEffect(() => {
    let active = true;
    if (!devFlowUser?.id) return;
    getDevFlowDeveloper(devFlowUser.id)
      .then((nextDeveloper) => {
        if (active) setDeveloper(nextDeveloper);
      })
      .catch((nextError) => {
        if (active) {
          setDeveloperError(
            nextError instanceof Error
              ? nextError.message
              : String(nextError),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [devFlowUser?.id]);

  const openProject = (projectId) => {
    setSelectedProjectId(projectId);
    router.push(`/dev/project/${projectId}`);
  };

  const continueWork = () => {
    if (!focusProject) {
      router.push("/dev/projects");
      return;
    }
    setSelectedProjectId(focusProject.id);
    if (focusProject.lifecycle?.signals?.orchestrationStarted) {
      // Straight to this project's build workspace. This used to go to the console-level
      // orchestrator, which then had to ask which project — after we had just decided.
      router.push(`/dev/orchestrate/${focusProject.id}`);
      return;
    }
    router.push(`/dev/project/${focusProject.id}`);
  };

  return (
    <div data-screen-label="Dev - Dashboard" className="dev-workspace-page">
      <DevPageHeader
        title={`Hey, ${name}.`}
        subtitle="Pick up the build that needs your attention and keep delivery moving."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<IconRefresh size={13} />}
            onClick={refresh}
          >
            Refresh
          </Button>
        }
      />

      {error ? (
        <Card className="dev-error-state">
          <strong>Developer workspace unavailable</strong>
          <span>{compactDevFlowError(error)}</span>
        </Card>
      ) : (
        <section className="dev-dashboard-lead" aria-label="Continue work">
          <Card className="dev-focus-card">
            <div className="dev-section-kicker">Continue work</div>
            {loading && !focusProject ? (
              <div className="dev-muted-state">Loading your assignments…</div>
            ) : focusProject && focusLifecycle ? (
              <>
                <div className="dev-focus-heading">
                  <div>
                    <Badge tone={focusLifecycle.tone}>
                      {focusLifecycle.label}
                    </Badge>
                    <h2>{focusProject.companyName}</h2>
                    <p>{focusLifecycle.nextAction}</p>
                  </div>
                  <div className="dev-focus-progress">
                    <strong>{focusLifecycle.progress}%</strong>
                    <span>delivery progress</span>
                  </div>
                </div>
                <div className="dev-focus-signals">
                  <span>
                    <IconCheckCircle size={14} />
                    {focusLifecycle.signals?.openTasks || 0} open tasks
                  </span>
                  <span>
                    <IconCpu size={14} />
                    {focusLifecycle.signals?.activeWorkOrders || 0} active handoffs
                  </span>
                </div>
                <div className="dev-focus-actions">
                  <Button
                    variant="primary"
                    iconRight={<IconArrowRight size={14} />}
                    onClick={continueWork}
                  >
                    {focusProject.lifecycle?.signals?.orchestrationStarted
                      ? "Open orchestrator"
                      : "Open project"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="dev-empty-lead">
                <h2>No assigned project yet</h2>
                <p>
                  Your workspace will populate when a project manager assigns
                  you to a delivery project.
                </p>
                <Button variant="secondary" onClick={refresh}>
                  Check assignments
                </Button>
              </div>
            )}
          </Card>

          <div className="dev-dashboard-metrics">
            <Metric
              icon={<IconFolder size={16} />}
              label="Assigned"
              value={loading ? "…" : String(projects.length)}
              sub="projects"
            />
            <Metric
              icon={<IconCheckCircle size={16} />}
              label="Open work"
              value={loading ? "…" : String(openTasks)}
              sub="tasks"
            />
            <Metric
              icon={<IconCpu size={16} />}
              label="Active"
              value={loading ? "…" : String(activeRuns || activeWorkOrders)}
              sub={activeRuns ? "AI runs" : "handoffs"}
            />
            <Metric
              icon={<IconCpu size={16} />}
              label="Capacity"
              value={
                developer?.weeklyCapacityHours == null
                  ? "Unset"
                  : `${developer.weeklyCapacityHours}h`
              }
              sub={
                developerError
                  ? compactDevFlowError(developerError)
                  : developer?.availabilityStatus || "Update in settings"
              }
            />
          </div>
        </section>
      )}

      <Card className="dev-list-card">
        <div className="dev-list-card-header">
          <div>
            <div className="dev-section-kicker">Assigned work</div>
            <h2>My projects</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconRight={<IconArrowRight size={13} />}
            onClick={() => router.push("/dev/projects")}
          >
            View all
          </Button>
        </div>

        <div className="dev-project-list" role="list">
          {!error &&
            projects.map((project) => {
              const lifecycle = devflowLifecycleView(project);
              return (
                <button
                  key={project.id}
                  className="dev-project-row"
                  onClick={() => openProject(project.id)}
                  role="listitem"
                >
                  <div className="dev-project-row-name">
                    <strong>{project.companyName}</strong>
                    <span>{project.id}</span>
                  </div>
                  <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
                  <div className="dev-project-row-work">
                    <span>{lifecycle.signals?.openTasks || 0} tasks</span>
                    <span>
                      {lifecycle.signals?.activeWorkOrders || 0} handoffs
                    </span>
                  </div>
                  <div className="dev-project-row-next">
                    {lifecycle.nextAction}
                  </div>
                  <IconArrowRight size={14} aria-hidden />
                </button>
              );
            })}
          {!error && !loading && projects.length === 0 && (
            <div className="dev-muted-state">
              No projects are assigned to this developer profile.
            </div>
          )}
          {loading && projects.length === 0 && (
            <div className="dev-muted-state">
              Loading assigned projects…
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function Metric({ icon, label, value, sub }) {
  return (
    <Card className="dev-metric-card">
      <div className="dev-metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </Card>
  );
}
