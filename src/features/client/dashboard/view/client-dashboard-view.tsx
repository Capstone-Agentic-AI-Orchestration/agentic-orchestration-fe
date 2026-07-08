"use client";

import type { ReactNode } from "react";
import { Button, Card, Badge } from "@/shared/components/ui";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconFileText,
  IconLayout,
  IconMessageCircle,
  IconRocket,
  IconUpload,
} from "@/shared/components/icons";
import {
  AvatarCircle,
  ClientStatusPill,
  KPICard,
} from "@/features/client/shared/components/client-widgets";
import { DevFlowProjectTimeline } from "@/shared/components/project-timeline/devflow-project-timeline";
import { GuidedActionPanel, RoleEmptyState } from "@/shared/components/journey";
import { makeProjectJourneyContext } from "@/shared/journey";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";
import type {
  ClientBackendEngagementModel,
  ClientDashboardMetric,
  ClientDashboardRoute,
  ClientTeamMemberModel,
} from "../model/client-dashboard";
import type { ClientDashboardViewModel } from "../view-model/use-client-dashboard-view-model";

export function ClientDashboardContentView({ vm }: { vm: ClientDashboardViewModel }) {
  const journeyContext = makeProjectJourneyContext({
    role: "client",
    project: vm.selectedProject,
    loading: vm.selectedProjectLoading,
    totalProjects: vm.projectCount,
    pendingActions: vm.pendingReviews,
    blockers: vm.journeyBlockers,
    primaryAction: vm.primaryActionLabel
      ? { label: vm.primaryActionLabel, href: "/client/product" }
      : undefined,
    secondaryAction: {
      label: "Refresh",
      onClick: vm.actions.refresh,
      variant: "secondary",
      icon: <IconCalendar size={13} />,
    },
  });

  return (
    <div data-screen-label="Client - Dashboard">
      <div style={{ marginBottom: 28 }}>
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: 0, margin: 0 }}>Welcome back.</h1>
            <p style={{ color: "var(--text-2)", fontSize: 14.5, marginTop: 6 }}>Here&apos;s where {vm.engagementName} stands today.</p>
          </div>
          <div className="row gap-3">
            <ClientStatusPill tone="blue">{vm.engagementStatus}</ClientStatusPill>
            <Button variant="secondary" size="sm" icon={<IconCalendar size={15} />} onClick={vm.actions.refresh}>Refresh</Button>
          </div>
        </div>
      </div>

      <ClientBackendEngagementView model={vm.backendEngagement} />

      <GuidedActionPanel context={journeyContext} />
      {vm.showEmptyState && <RoleEmptyState role="client" />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        {vm.metrics.map((metric) => (
          <ClientDashboardMetricCard key={metric.key} metric={metric} onNavigate={vm.actions.navigate} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <Card style={{ padding: 28 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Engagement Timeline</h3>
                <p style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>Your journey from discovery to delivery</p>
              </div>
              <Badge tone="blue">{vm.timelineBadge}</Badge>
            </div>
            <div style={{ marginTop: 28, padding: 16, background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.20)", borderRadius: 12, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(139,92,246,.18)", color: "#C4B5FD", display: "grid", placeItems: "center", flexShrink: 0 }}><IconActivity size={16} /></div>
              <div style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.55 }}>
                <strong style={{ color: "white" }}>{vm.engagementStage}.</strong>{" "}
                <span style={{ color: "var(--text-2)" }}>{vm.timelineBrief}</span>
              </div>
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
                timeline={vm.timelineEvents}
                loading={vm.timelineLoading}
                error={vm.timelineError}
                emptyText={vm.timelineEmptyText}
                compactError={compactDevFlowError}
              />
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 4 }}>Quick Actions</h4>
            <p style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 16 }}>{vm.quickActionsSubtitle}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <QuickAction icon={<IconMessageCircle size={16} />} tint="#4F8BFF" title="Messages" sub="Threaded chat API pending" onClick={() => vm.actions.navigate("chat")} />
              <QuickAction icon={<IconUpload size={16} />} tint="#8B5CF6" title="Documents" sub="Backend artifacts and upload status" onClick={() => vm.actions.navigate("documents")} />
              <QuickAction icon={<IconLayout size={16} />} tint="#10B981" title="View product" sub="Backend project and artifacts" onClick={() => vm.actions.navigate("product")} />
            </div>
          </Card>

          <Card style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 4 }}>Your Team</h4>
            <p style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 16 }}>Backend project members</p>
            {vm.teamMembers.length > 0 ? (
              <BackendTeam members={vm.teamMembers} />
            ) : (
              <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>{vm.teamEmptyText}</div>
            )}
          </Card>

          <Card style={{ padding: 22, background: "linear-gradient(135deg, rgba(47,107,255,.10), rgba(139,92,246,.06))" }}>
            <div className="row gap-3" style={{ alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(47,107,255,.20)", color: "#93C5FD", display: "grid", placeItems: "center", flexShrink: 0 }}><IconRocket size={17} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Next milestone</div>
                <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4, lineHeight: 1.5 }}>{vm.nextMilestoneText}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ClientDashboardMetricCard({
  metric,
  onNavigate,
}: {
  metric: ClientDashboardMetric;
  onNavigate: (route: ClientDashboardRoute) => void;
}) {
  const actionRoute = metric.actionRoute;
  const icon = {
    stage: <IconRocket size={18} />,
    days: <IconClock size={18} />,
    artifacts: <IconFileText size={18} />,
    pending: <IconAlertTriangle size={18} />,
  }[metric.key];

  return (
    <KPICard label={metric.label} value={metric.value} icon={icon} tint={metric.tint} sub={metric.sub}>
      {metric.actionLabel && actionRoute ? (
        <div style={{ marginTop: 10, fontSize: 12 }}>
          <a className="auth-link" onClick={() => onNavigate(actionRoute)}>{metric.actionLabel}</a>
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-3)" }}>{metric.footer}</div>
      )}
    </KPICard>
  );
}

function ClientBackendEngagementView({ model }: { model: ClientBackendEngagementModel }) {
  if (model.loading) {
    return <Card style={{ padding: 16, marginBottom: 20, color: "var(--text-2)" }}>Loading assigned engagement...</Card>;
  }

  if (model.error) {
    return (
      <Card style={{ padding: 16, marginBottom: 20, border: "1px solid rgba(239,68,68,.30)" }}>
        <div style={{ color: "#FCA5A5", fontWeight: 600 }}>Backend engagement unavailable</div>
        <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4 }}>{model.error}</div>
      </Card>
    );
  }

  if (!model.hasProject) {
    return (
      <Card style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontWeight: 600 }}>{model.emptyTitle}</div>
        <div style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 4 }}>{model.emptyDescription}</div>
      </Card>
    );
  }

  return (
    <Card style={{ padding: 18, marginBottom: 20, border: "1px solid rgba(79,139,255,.28)" }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div className="row gap-3" style={{ minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "linear-gradient(135deg,#4F8BFF,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, flexShrink: 0 }}>{model.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{model.companyName}</div>
            <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>{model.meta}</div>
          </div>
        </div>
        <div className="row gap-2">
          <Badge tone={model.lifecycleTone}>{model.lifecycleLabel}</Badge>
          <Badge tone="blue">{model.projectCountLabel}</Badge>
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  icon,
  tint,
  title,
  sub,
  onClick,
  badge,
}: {
  icon: ReactNode;
  tint: string;
  title: string;
  sub: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: "10px 12px", background: "rgba(8,14,32,.5)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, color: "white", fontFamily: "inherit" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${tint}22`, color: tint, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{sub}</div>
      </div>
      {badge && <span className="cs-nav-badge cs-nav-badge--text">{badge}</span>}
      <IconArrowRight size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
    </button>
  );
}

function BackendTeam({ members }: { members: ClientTeamMemberModel[] }) {
  return (
    <>
      {members.map((member) => (
        <div key={member.id} className="row gap-3" style={{ alignItems: "center", marginTop: 12 }}>
          <AvatarCircle initials={member.initials} color={member.color} online={false} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{member.name}</div>
            <div style={{ color: "var(--text-3)", fontSize: 12 }}>{member.role}</div>
          </div>
          <button className="cs-iconbtn" style={{ width: 30, height: 30 }} title="Message"><IconMessageCircle size={14} /></button>
        </div>
      ))}
    </>
  );
}
