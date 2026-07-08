// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/shared/components/ui";
import {
  IconActivity,
  IconArrowLeft,
  IconArrowRight,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
} from "@/shared/components/icons";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { DevFlowProjectTimeline } from "@/shared/components/project-timeline/devflow-project-timeline";
import { useDevFlowProject, useDevFlowProjectOutputs, useDevFlowProjects } from "@/shared/hooks/use-devflow-projects";
import { compactDevFlowError, devflowLifecycleView, devflowStatusView, formatDevFlowDate, lifecycleProgressColor, projectInitials } from "@/shared/utils/devflow-projects";
import { DevProjectDetailContentView } from "../view/dev-project-detail-view";
import { DevArtifactsPanelView } from "../view/dev-artifacts-panel-view";
import { DevEventsPanelView } from "../view/dev-events-panel-view";
import { DevTasksPanelView } from "../view/dev-tasks-panel-view";
import { DevWorkOrdersPanelView } from "../view/dev-work-orders-panel-view";
import { useDevProjectDetailViewModel } from "../view-model/use-dev-project-detail-view-model";
import { useDevArtifactsPanelViewModel } from "../view-model/use-dev-artifacts-panel-view-model";
import { useDevEventsPanelViewModel } from "../view-model/use-dev-events-panel-view-model";
import { useDevTasksPanelViewModel } from "../view-model/use-dev-tasks-panel-view-model";
import { useDevWorkOrdersPanelViewModel } from "../view-model/use-dev-work-orders-panel-view-model";

export function DevProjectsView() {
  const router = useRouter();
  const { projects: backendProjects, loading, error, refresh } = useDevFlowProjects();

  return (
    <div data-screen-label="Dev - My Projects">
      <DevPageHeader
        title="My projects"
        subtitle="Projects you're assigned to."
        actions={<Button variant="secondary" size="sm" icon={<IconActivity size={13} />} onClick={refresh}>Refresh</Button>}
      />

      <BackendAssignedProjects
        projects={backendProjects}
        loading={loading}
        error={error}
        onOpen={(id) => router.push(`/dev/project/${id}`)}
      />
    </div>
  );
}

function BackendAssignedProjects({ projects, loading, error, onOpen }) {
  if (loading) {
    return (
      <Card style={{ padding: 18, color: "var(--text-2)", marginBottom: 16 }}>
        Loading assigned backend projects...
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: 18, border: "1px solid rgba(239,68,68,.30)", marginBottom: 16 }}>
        <div style={{ fontWeight: 600, color: "#FCA5A5" }}>Backend projects unavailable</div>
        <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4 }}>{compactDevFlowError(error)}</div>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ fontWeight: 600 }}>No backend assignments yet.</div>
        <div style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 4 }}>Ask a PM to add this developer profile to a project member list.</div>
      </Card>
    );
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {projects.map((project) => (
          <BackendProjectCard key={project.id} project={project} onOpen={() => onOpen(project.id)} />
        ))}
      </div>
    </div>
  );
}

function BackendProjectCard({ project, onOpen }) {
  const lifecycle = devflowLifecycleView(project);
  const initials = projectInitials(project.companyName);

  return (
    <Card hover style={{ padding: 22, cursor: "pointer", border: "1px solid rgba(79,139,255,.28)" }} onClick={onOpen}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div className="row gap-3" style={{ alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#4F8BFF,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>Backend assignment</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{project.id}</div>
          </div>
        </div>
        <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{project.companyName}</div>
      <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
        <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(168,85,247,.15)", color: "#C4B5FD", fontSize: 11, fontWeight: 600, border: "1px solid rgba(168,85,247,.30)" }}>Assigned member</span>
        <span style={{ padding: "3px 9px", borderRadius: 999, background: "rgba(79,139,255,.14)", color: "#93C5FD", fontSize: 11, fontWeight: 600, border: "1px solid rgba(79,139,255,.28)" }}>{lifecycle.nextAction}</span>
        {lifecycle.signals?.openTasks > 0 && <span style={{ padding: "3px 9px", borderRadius: 999, background: "rgba(79,139,255,.14)", color: "#93C5FD", fontSize: 11, fontWeight: 600, border: "1px solid rgba(79,139,255,.28)" }}>{lifecycle.signals.openTasks} tasks</span>}
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "var(--text-2)" }}>Backend progress</span>
          <span className="mono" style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{lifecycle.progress}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(8,14,32,.7)" }}>
          <div style={{ width: `${lifecycle.progress}%`, height: "100%", borderRadius: 999, background: lifecycleProgressColor(lifecycle.tone) }} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>Created {formatDevFlowDate(project.createdAt)}</span>
        <span className="row gap-1" style={{ alignItems: "center", color: "#93C5FD", fontSize: 12, fontWeight: 500 }}>Open <IconArrowRight size={11} /></span>
      </div>
    </Card>
  );
}

export function DevProjectDetailView({ projectId }) {
  const router = useRouter();
  const { project: backendProject, loading: backendLoading, error: backendError } = useDevFlowProject(projectId);

  if (backendProject) {
    return <BackendDevProjectDetail project={backendProject} onBack={() => router.push("/dev/projects")} onOpenOrchestrator={() => router.push("/dev/orchestrator")} />;
  }

  if (backendLoading) {
    return (
      <div data-screen-label={`Dev - Project - ${projectId}`}>
        <button onClick={() => router.push("/dev/projects")} style={{ background: "none", border: 0, color: "var(--text-2)", fontSize: 12.5, cursor: "pointer", padding: "0 0 8px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <IconArrowLeft size={12} /> My projects
        </button>
        <Card style={{ padding: 24, color: "var(--text-2)" }}>Loading backend project...</Card>
      </div>
    );
  }

  return (
    <div data-screen-label={`Dev - Project - ${projectId}`}>
      <button onClick={() => router.push("/dev/projects")} style={{ background: "none", border: 0, color: "var(--text-2)", fontSize: 12.5, cursor: "pointer", padding: "0 0 8px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <IconArrowLeft size={12} /> My projects
      </button>
      <Card style={{ padding: 24 }}>
        <div style={{ fontWeight: 600 }}>Project not available.</div>
        <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>{compactDevFlowError(backendError) || "This backend project is not assigned to this developer account."}</div>
      </Card>
    </div>
  );
}

function BackendDevProjectDetail({ project, onBack, onOpenOrchestrator }) {
  const vm = useDevProjectDetailViewModel({ project, onBack, onOpenOrchestrator });
  const outputs = vm.outputs;

  return (
    <DevProjectDetailContentView
      vm={vm}
      workOrders={<DevBackendWorkOrders workOrders={outputs.workOrders} loading={outputs.loading} error={outputs.error} />}
      tasks={<DevBackendTasks projectId={project.id} tasks={outputs.tasks} loading={outputs.loading} error={outputs.error} onChanged={outputs.refresh} />}
      timeline={<DevFlowProjectTimeline timeline={outputs.timeline} loading={outputs.loading} error={outputs.error} emptyText="No project timeline events yet." compactError={compactDevFlowError} />}
      artifacts={<DevBackendArtifacts artifacts={outputs.artifacts} loading={outputs.loading} error={outputs.error} />}
    />
  );
}

function DevBackendTasks({ projectId, tasks, loading, error, onChanged }) {
  const vm = useDevTasksPanelViewModel({ projectId, tasks, loading, error, onChanged });
  return <DevTasksPanelView vm={vm} />;
}

function DevBackendWorkOrders({ workOrders, loading, error }) {
  const vm = useDevWorkOrdersPanelViewModel({ workOrders, loading, error });
  return <DevWorkOrdersPanelView vm={vm} />;
}

function DevBackendArtifacts({ artifacts, loading, error }) {
  const vm = useDevArtifactsPanelViewModel({ artifacts, loading, error });
  return <DevArtifactsPanelView vm={vm} />;
}

function DevBackendEvents({ events, loading, error }) {
  const vm = useDevEventsPanelViewModel({ events, loading, error });
  return <DevEventsPanelView vm={vm} />;
}

function BackendWorkspaceStat({ label, value }) {
  return (
    <Card style={{ padding: 12, background: "rgba(8,14,32,.45)" }}>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>Backend</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{label}: {value}</div>
    </Card>
  );
}

function DevFact({ label, value }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 10 }}>
      <span style={{ color: "var(--text-3)", fontSize: 12 }}>{label}</span>
      <span className="mono" style={{ color: "white", fontSize: 11.5, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </div>
  );
}

export function ArtifactTree({ node, depth = 0, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen || depth < 1);
  if (node.type === "folder") {
    return (
      <div>
        <button onClick={() => setOpen((value) => !value)} style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: "6px 12px", paddingLeft: 12 + depth * 18, background: "none", border: 0, color: "white", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
          {open ? <IconChevronDown size={11} style={{ color: "var(--text-3)" }} /> : <IconChevronRight size={11} style={{ color: "var(--text-3)" }} />}
          <IconFolder size={13} style={{ color: node.locked ? "var(--text-4)" : "#FBBF24" }} />
          <span style={{ flex: 1, color: node.locked ? "var(--text-4)" : "white" }}>{node.name}/</span>
          {typeof node.count === "number" && <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{node.count} files</span>}
        </button>
        {open && node.children?.map((child, index) => <ArtifactTree key={`${child.name}-${index}`} node={child} depth={depth + 1} />)}
      </div>
    );
  }
  const extColor = { tsx: "#3B82F6", ts: "#3B82F6", py: "#10B981", sql: "#14B8A6", md: "#A78BFA", json: "#F59E0B", yml: "#EC4899", txt: "#94A3B8" }[node.ext] || "#94A3B8";
  return (
    <div style={{ padding: "5px 12px", paddingLeft: 12 + depth * 18, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)" }}>
      <span style={{ width: 11 }} />
      <span style={{ width: 13, height: 13, fontSize: 8, fontWeight: 700, color: extColor, border: `1px solid ${extColor}44`, borderRadius: 3, display: "inline-grid", placeItems: "center", letterSpacing: ".04em", flexShrink: 0 }}>{node.ext.toUpperCase().slice(0, 3)}</span>
      <span style={{ flex: 1 }}>{node.name}</span>
      <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{node.size}</span>
    </div>
  );
}
