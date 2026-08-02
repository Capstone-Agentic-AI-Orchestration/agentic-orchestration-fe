// @ts-nocheck
"use client";

import { Badge, Card } from "@/shared/components/ui";
import { IconActivity, IconCheck, IconFileText, IconMessageCircle, IconPlus, IconUser } from "@/shared/components/icons";

export function DevFlowProjectTimeline({ timeline, loading, error, emptyText, compactError }) {
  if (loading) return <Card className="pm-tab-panel pm-tab-empty">Loading project timeline...</Card>;
  if (error) return <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">{compactError ? compactError(error) : error}</Card>;
  if (!timeline.length) return <Card className="pm-tab-panel pm-tab-empty">{emptyText || "No project timeline events yet."}</Card>;

  return (
    <Card className="pm-tab-panel">
      <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Project timeline</div>
        <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 3 }}>A chronological record of {timeline.length} recent project events.</div>
      </div>
      <div className="pm-tab-list">{timeline.map((event) => {
        const view = timelineView(event.type);
        return (
          <div key={event.id} className="pm-tab-list-row">
            <div className="row gap-3 pm-tab-list-row__content" style={{ alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${view.color}20`, color: view.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {view.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{event.title}</div>
                  <Badge tone={event.visibility === "CLIENT" ? "green" : event.visibility === "TEAM" ? "blue" : "gray"}>{event.visibility}</Badge>
                </div>
                {event.body && <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45, marginTop: 4, whiteSpace: "pre-wrap" }}>{event.body}</div>}
                <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 6 }}>
                  {event.actor?.fullName || event.actor?.email || "System"} - {formatTimelineDate(event.createdAt)}
                </div>
              </div>
            </div>
          </div>
        );
      })}</div>
    </Card>
  );
}

function timelineView(type) {
  const map = {
    PROJECT_CREATED: { color: "#60A5FA", icon: <IconPlus size={14} /> },
    PROJECT_UPDATED: { color: "#93C5FD", icon: <IconActivity size={14} /> },
    MEMBER_ADDED: { color: "#A78BFA", icon: <IconUser size={14} /> },
    MEMBER_REMOVED: { color: "#94A3B8", icon: <IconUser size={14} /> },
    ARTIFACT_SHARED: { color: "#6EE7B7", icon: <IconFileText size={14} /> },
    ARTIFACT_UNSHARED: { color: "#94A3B8", icon: <IconFileText size={14} /> },
    ARTIFACT_REVIEWED: { color: "#FBBF24", icon: <IconCheck size={14} /> },
    REVISION_HANDLED: { color: "#6EE7B7", icon: <IconCheck size={14} /> },
    TASK_CREATED: { color: "#60A5FA", icon: <IconPlus size={14} /> },
    TASK_ASSIGNED: { color: "#A78BFA", icon: <IconUser size={14} /> },
    TASK_STATUS_CHANGED: { color: "#FBBF24", icon: <IconActivity size={14} /> },
    TASK_COMMENTED: { color: "#93C5FD", icon: <IconMessageCircle size={14} /> },
    NOTIFICATION_SENT: { color: "#94A3B8", icon: <IconActivity size={14} /> },
  };
  return map[type] || { color: "#94A3B8", icon: <IconActivity size={14} /> };
}

function formatTimelineDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
