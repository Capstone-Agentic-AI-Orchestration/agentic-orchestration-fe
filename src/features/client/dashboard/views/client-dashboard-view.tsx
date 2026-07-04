// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Badge } from "@/shared/components/ui";
import { IconActivity, IconAlertTriangle, IconCalendar, IconCheckCircle, IconClock, IconFileText, IconLayout, IconMessageCircle, IconRocket, IconUpload, IconUsers, IconArrowRight } from "@/shared/components/icons";
import { AvatarCircle, ClientStatusPill, KPICard } from "@/features/client/shared/components/client-widgets";
import { DevFlowProjectTimeline } from "@/shared/components/project-timeline/devflow-project-timeline";
import { useDevFlowProjectOutputs } from "@/shared/hooks/use-devflow-projects";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import { compactDevFlowError, devflowLifecycleView, formatDevFlowDate, projectInitials } from "@/shared/utils/devflow-projects";

export function ClientDashboardView() {
  const router = useRouter();
  const navigate = (route: string) => router.push(`/client/${route}`);
  const { projects, selectedProject, selectedProjectLoading, selectedProjectError, refreshProjects } = useSelectedDevFlowProject();
  const outputs = useDevFlowProjectOutputs(selectedProject?.id, { includeEvents: false, includeTimeline: true });
  const lifecycle = devflowLifecycleView(selectedProject);
  const engagementName = selectedProject?.companyName || "No selected project";
  const engagementStatus = selectedProject ? lifecycle.label : "Unassigned";
  const engagementStage = selectedProject ? lifecycle.stage : "No active stage";
  const engagementProgress = selectedProject ? lifecycle.progress : 0;
  const refresh = () => {
    refreshProjects();
    outputs.refresh();
  };

  return (
    <div data-screen-label="Client - Dashboard">
      <div style={{ marginBottom: 28 }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: 0, margin: 0 }}>Welcome back.</h1>
            <p style={{ color: "var(--text-2)", fontSize: 14.5, marginTop: 6 }}>Here&apos;s where {engagementName} stands today.</p>
          </div>
          <div className="row gap-3">
            <ClientStatusPill tone="blue">{engagementStatus}</ClientStatusPill>
            <Button variant="secondary" size="sm" icon={<IconCalendar size={15} />} onClick={refresh}>Refresh</Button>
          </div>
        </div>
      </div>

      <ClientBackendEngagement
        loading={selectedProjectLoading}
        error={selectedProjectError}
        project={selectedProject}
        projectCount={projects.length}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KPICard label="Current Stage" value={engagementStage} icon={<IconRocket size={18} />} tint="#8B5CF6" sub={selectedProject ? "Backend status" : "Awaiting project selection"}>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-3)" }}>{selectedProject ? `${engagementProgress}% complete` : "No backend project yet"}</div>
        </KPICard>
        <KPICard label="Days in Engagement" value={selectedProject ? daysSince(selectedProject.createdAt) : "0"} icon={<IconClock size={18} />} tint="#4F8BFF" sub={selectedProject ? "since project creation" : "not started"}>
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-3)" }}>{selectedProject ? "Tracked from backend" : "Waiting for project selection"}</div>
        </KPICard>
        <KPICard label="Visible Artifacts" value={String(outputs.artifacts.length)} icon={<IconFileText size={18} />} tint="#10B981" sub="from backend">
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-3)" }}>Client-visible deliverables</div>
        </KPICard>
        <KPICard label="Pending Actions" value={String(outputs.artifacts.filter((artifact) => artifact.reviewStatus === "PENDING").length)} icon={<IconAlertTriangle size={18} />} tint="#F59E0B" sub="artifact reviews">
          <div style={{ marginTop: 10, fontSize: 12 }}><a className="auth-link" onClick={() => navigate("product")}>Review product</a></div>
        </KPICard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <Card style={{ padding: 28 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Engagement Timeline</h3>
                <p style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>Your journey from discovery to delivery</p>
              </div>
              <Badge tone="blue">{selectedProject ? "Backend timeline" : "No project"}</Badge>
            </div>
            <div style={{ marginTop: 28, padding: 16, background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.20)", borderRadius: 12, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(139,92,246,.18)", color: "#C4B5FD", display: "grid", placeItems: "center", flexShrink: 0 }}><IconActivity size={16} /></div>
              <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.55 }}><strong style={{ color: "white" }}>{engagementStage}.</strong> <span style={{ color: "var(--text-2)" }}>{selectedProject ? selectedProject.brief : "No project is selected yet."}</span></div>
            </div>
          </Card>

          <Card style={{ padding: 28 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Recent Activity</h3>
                <p style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>Latest updates from your project</p>
              </div>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
            <div style={{ margin: -28, marginTop: 0 }}>
              <DevFlowProjectTimeline
                timeline={selectedProject ? outputs.timeline : []}
                loading={selectedProject ? outputs.loading : false}
                error={selectedProject ? outputs.error : ""}
                emptyText={selectedProject ? "No project timeline events yet." : "No backend project is selected yet."}
                compactError={compactDevFlowError}
              />
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 4 }}>Quick Actions</h4>
            <p style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 16 }}>{selectedProject ? lifecycle.nextAction : "Common tasks at your fingertips"}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <QuickAction icon={<IconMessageCircle size={16} />} tint="#4F8BFF" title="Messages" sub="Threaded chat API pending" onClick={() => navigate("chat")} />
              <QuickAction icon={<IconUpload size={16} />} tint="#8B5CF6" title="Documents" sub="Backend artifacts and upload status" onClick={() => navigate("documents")} />
              <QuickAction icon={<IconLayout size={16} />} tint="#10B981" title="View product" sub="Backend project and artifacts" onClick={() => navigate("product")} />
            </div>
          </Card>

          <Card style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 4 }}>Your Team</h4>
            <p style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 16 }}>Backend project members</p>
            {selectedProject ? (
              <BackendTeam project={selectedProject} />
            ) : (
              <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>Team assignments will appear after a PM adds this client to a backend project.</div>
            )}
          </Card>

          <Card style={{ padding: 22, background: "linear-gradient(135deg, rgba(47,107,255,.10), rgba(139,92,246,.06))" }}>
            <div className="row gap-3" style={{ alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(47,107,255,.20)", color: "#93C5FD", display: "grid", placeItems: "center", flexShrink: 0 }}><IconRocket size={17} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Next milestone</div>
                <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>{selectedProject ? `${lifecycle.nextAction} - ${engagementProgress}% complete.` : "No milestone is available until a backend project is selected."}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ClientBackendEngagement({ loading, error, project, projectCount }) {
  if (loading) {
    return <Card style={{ padding: 16, marginBottom: 20, color: "var(--text-2)" }}>Loading assigned engagement...</Card>;
  }

  if (error) {
    return (
      <Card style={{ padding: 16, marginBottom: 20, border: "1px solid rgba(239,68,68,.30)" }}>
        <div style={{ color: "#FCA5A5", fontWeight: 600 }}>Backend engagement unavailable</div>
        <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4 }}>{compactDevFlowError(error)}</div>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 600 }}>No backend engagement assigned</div>
        <div style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 4 }}>Ask a PM to add this client profile to a project member list.</div>
      </Card>
    );
  }

  const lifecycle = devflowLifecycleView(project);

  return (
    <Card style={{ padding: 18, marginBottom: 20, border: "1px solid rgba(79,139,255,.28)" }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div className="row gap-3" style={{ minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#4F8BFF,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, flexShrink: 0 }}>{projectInitials(project.companyName)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{project.companyName}</div>
            <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>{project.stackKey} - created {formatDevFlowDate(project.createdAt)}</div>
          </div>
        </div>
        <div className="row gap-2">
          <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
          <Badge tone="blue">{projectCount} assigned</Badge>
        </div>
      </div>
    </Card>
  );
}

function daysSince(value) {
  const started = new Date(value).getTime();
  if (!Number.isFinite(started)) return "0";
  return String(Math.max(0, Math.ceil((Date.now() - started) / 86400000)));
}

function QuickAction({ icon, tint, title, sub, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: "10px 12px", background: "rgba(8,14,32,.5)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, color: "white", fontFamily: "inherit" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${tint}22`, color: tint, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div><div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{sub}</div></div>
      {badge && <span className="cs-nav-badge cs-nav-badge--text">{badge}</span>}
      <IconArrowRight size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
    </button>
  );
}

function BackendTeam({ project }) {
  const visibleMembers = project.members.slice(0, 4);

  if (visibleMembers.length === 0) {
    return <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>Team assignments will appear here once the PM adds members.</div>;
  }

  return (
    <>
      {visibleMembers.map((member) => (
        <div key={member.id} className="row gap-3" style={{ alignItems: "center", marginTop: 12 }}>
          <AvatarCircle initials={projectInitials(member.user.fullName || member.user.email)} color={member.role === "PM" ? "linear-gradient(135deg,#10B981,#14B8A6)" : "linear-gradient(135deg,#4F8BFF,#8B5CF6)"} online={false} />
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13.5 }}>{member.user.fullName || member.user.email || member.user.id}</div><div style={{ color: "var(--text-3)", fontSize: 12 }}>{member.role}</div></div>
          <button className="cs-iconbtn" style={{ width: 30, height: 30 }} title="Message"><IconMessageCircle size={14} /></button>
        </div>
      ))}
    </>
  );
}
