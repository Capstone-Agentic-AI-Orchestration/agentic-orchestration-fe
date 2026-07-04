// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/shared/components/ui";
import { IconArrowRight, IconCheckCircle, IconCpu, IconFolder, IconRefresh } from "@/shared/components/icons";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { useAuth } from "@/shared/auth/auth-provider";
import { getDevFlowDeveloper } from "@/shared/api/devflow-api";
import { useDevFlowProjects } from "@/shared/hooks/use-devflow-projects";
import { BackendAwareRouteState } from "@/shared/components/backend-aware-route-state";
import { compactDevFlowError, devflowLifecycleView } from "@/shared/utils/devflow-projects";

export function DevDashboardView() {
  const router = useRouter();
  const { devFlowUser } = useAuth();
  const { projects, loading, error, refresh } = useDevFlowProjects();
  const [developer, setDeveloper] = useState(null);
  const [developerError, setDeveloperError] = useState("");
  const name = devFlowUser?.fullName || devFlowUser?.email?.split("@")[0] || "Developer";
  const openTasks = projects.reduce((total, project) => total + (project.lifecycle?.signals?.openTasks || 0), 0);
  const activeWorkOrders = projects.reduce((total, project) => total + (project.lifecycle?.signals?.activeWorkOrders || 0), 0);
  const inDelivery = projects.filter((project) => project.lifecycle?.signals?.orchestrationStarted).length;

  useEffect(() => {
    let active = true;
    if (!devFlowUser?.id) return;
    getDevFlowDeveloper(devFlowUser.id)
      .then((nextDeveloper) => {
        if (active) setDeveloper(nextDeveloper);
      })
      .catch((nextError) => {
        if (active) setDeveloperError(nextError instanceof Error ? nextError.message : String(nextError));
      });
    return () => {
      active = false;
    };
  }, [devFlowUser?.id]);

  return (
    <div data-screen-label="Dev - Dashboard">
      <DevPageHeader
        title={`Hey, ${name}.`}
        subtitle="Assigned backend projects and honest status for pending developer modules."
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={refresh}>Refresh</Button>
            <Button variant="primary" size="sm" icon={<IconFolder size={13} />} onClick={() => router.push("/dev/projects")}>My projects</Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
        <Metric icon={<IconFolder size={17} />} label="Assigned projects" value={loading ? "..." : String(projects.length)} sub={error ? compactDevFlowError(error) : "From /projects"} />
        <Metric icon={<IconCheckCircle size={17} />} label="Open tasks" value={loading ? "..." : String(openTasks)} sub="Role-scoped tasks" />
        <Metric icon={<IconCpu size={17} />} label="Active handoffs" value={loading ? "..." : String(activeWorkOrders)} sub={`${inDelivery} orchestration runs visible`} />
        <Metric icon={<IconCpu size={17} />} label="Capacity" value={developer?.weeklyCapacityHours == null ? "Unset" : `${developer.weeklyCapacityHours}h`} sub={developerError ? compactDevFlowError(developerError) : developer?.availabilityStatus || "Update in settings"} />
      </div>

      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div className="row" style={{ padding: 18, borderBottom: "1px solid var(--border)", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Assigned backend projects</h3>
            <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 0" }}>This replaces the old static task board.</p>
          </div>
          <Badge tone="purple">{loading ? "Loading" : `${projects.length} assigned`}</Badge>
        </div>
        {error ? (
          <div style={{ padding: 24, color: "#FCA5A5" }}>{compactDevFlowError(error)}</div>
        ) : projects.length === 0 ? (
          <div style={{ padding: 24, color: "var(--text-3)" }}>{loading ? "Loading projects..." : "No backend projects are assigned to this developer profile yet."}</div>
        ) : (
          projects.map((project, index) => {
            const lifecycle = devflowLifecycleView(project);
            return (
              <button key={project.id} onClick={() => router.push(`/dev/project/${project.id}`)} style={{ width: "100%", display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) 1fr 1fr 36px", gap: 14, alignItems: "center", padding: "14px 18px", border: 0, borderBottom: index === projects.length - 1 ? 0 : "1px solid var(--border)", background: "transparent", color: "white", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{project.companyName}</div>
                  <div className="mono" style={{ color: "var(--text-3)", fontSize: 11, marginTop: 3 }}>{project.id}</div>
                </div>
                <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
                <div style={{ color: "var(--text-2)", fontSize: 12 }}>{lifecycle.nextAction}</div>
                <IconArrowRight size={14} style={{ color: "var(--text-3)" }} />
              </button>
            );
          })
        )}
      </Card>

      <BackendAwareRouteState
        title="Developer board, GitHub, and IDE telemetry need real service integrations"
        subtitle="This dashboard now uses project lifecycle, task, and handoff signals from the backend. GitHub and IDE telemetry still need separate service contracts."
        projects={projects}
        loading={loading}
        error={error}
        pending={["GitHub OAuth/repository activity", "IDE session telemetry", "Cross-project developer activity feed"]}
        primaryAction={{ label: "Open assigned projects", onClick: () => router.push("/dev/projects") }}
      />
    </div>
  );
}

function Metric({ icon, label, value, sub }) {
  return (
    <Card style={{ padding: 16 }}>
      <div className="row gap-2" style={{ color: "#C4B5FD" }}>{icon}<span style={{ fontSize: 12, color: "var(--text-2)" }}>{label}</span></div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 10 }}>{value}</div>
      <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{sub}</div>
    </Card>
  );
}
