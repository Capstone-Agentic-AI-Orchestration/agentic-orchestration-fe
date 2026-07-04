// @ts-nocheck
"use client";

import { Badge } from "@/shared/components/ui";

/**
 * Reusable badge and presentational components for PM project detail views.
 */

export function OrchestrationRunBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    SUCCEEDED: { tone: "green", label: "Succeeded" },
    RUNNING: { tone: "blue", label: "Running" },
    FAILED: { tone: "red", label: "Failed" },
    CANCELLED: { tone: "gray", label: "Cancelled" },
  };
  const next = map[status || "RUNNING"] || map.RUNNING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function OrchestrationFact({ label, value, tone, mono }: { label: string; value: string; tone?: string; mono?: boolean }) {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: "rgba(8,14,32,.55)", border: "1px solid var(--border)", minWidth: 0 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{label}</span>
        <Badge tone={tone || "gray"}>{tone === "green" ? "OK" : tone === "amber" ? "Review" : tone === "red" ? "Blocked" : "Live"}</Badge>
      </div>
      <div className={mono ? "mono" : undefined} style={{ fontSize: 15, fontWeight: 800, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

export function ProjectTaskStatusDot({ status }: { status?: string }) {
  const colors: Record<string, string> = {
    TODO: "var(--text-3)", IN_PROGRESS: "var(--blue)", DONE: "var(--green)", BLOCKED: "var(--red)",
  };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status || "TODO"] || "var(--text-3)", flexShrink: 0 }} />;
}

export function BackendTaskStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    TODO: { tone: "gray", label: "To Do" },
    IN_PROGRESS: { tone: "blue", label: "In Progress" },
    DONE: { tone: "green", label: "Done" },
    BLOCKED: { tone: "red", label: "Blocked" },
  };
  const next = map[status || "TODO"] || map.TODO;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function WorkOrderStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    DRAFT: { tone: "gray", label: "Draft" },
    READY: { tone: "blue", label: "Ready" },
    DISPATCHED: { tone: "purple", label: "Dispatched" },
    COMPLETED: { tone: "green", label: "Completed" },
    FAILED: { tone: "red", label: "Failed" },
    CANCELLED: { tone: "gray", label: "Cancelled" },
  };
  const next = map[status || "DRAFT"] || map.DRAFT;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function WorkOrderPriorityBadge({ priority }: { priority?: string }) {
  const map: Record<string, { tone: string }> = {
    LOW: { tone: "gray" }, NORMAL: { tone: "blue" }, HIGH: { tone: "amber" }, URGENT: { tone: "red" },
  };
  const next = map[priority || "NORMAL"] || map.NORMAL;
  return <Badge tone={next.tone}>{priority || "Normal"}</Badge>;
}

export function BackendReviewBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    PENDING: { tone: "gray", label: "Pending" },
    APPROVED: { tone: "green", label: "Approved" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision" },
  };
  const next = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function ArtifactValidationBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    PASS: { tone: "green", label: "Valid" },
    FAIL: { tone: "red", label: "Invalid" },
    PENDING: { tone: "gray", label: "Unchecked" },
  };
  const next = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function OutputReviewBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    PENDING: { tone: "gray", label: "Awaiting" },
    APPROVED: { tone: "green", label: "Approved" },
    REWORK_REQUESTED: { tone: "amber", label: "Rework" },
  };
  const next = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function SectionTitle({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="row gap-2" style={{ alignItems: "flex-start" }}>
      {icon && <span style={{ color: "var(--primary)", marginTop: 1 }}>{icon}</span>}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ color: "var(--text-3)", fontSize: 12, margin: "3px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ padding: 14, borderRadius: 10, background: "rgba(8,14,32,.55)", border: "1px solid var(--border)", marginTop: 10 }}>
      <div style={{ color: "var(--text-3)", fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function FactRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="row gap-2" style={{ color: "var(--text-3)", fontSize: 12 }}>{icon}{label}</div>
      <div style={{ fontWeight: 600, fontSize: 13, textAlign: "right" }}>{value}</div>
    </div>
  );
}

export function BackendPersonAvatar({ name, size = 32 }: { name?: string; size?: number }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: "rgba(79,139,255,.18)", color: "#93C5FD", display: "grid", placeItems: "center", fontSize: size * 0.38, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </span>
  );
}

export function BackendPersonRow({ name, email, role }: { name?: string; email?: string; role?: string }) {
  return (
    <div className="row gap-2" style={{ alignItems: "center" }}>
      <BackendPersonAvatar name={name || email} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{name || email}</div>
        {role && <div style={{ color: "var(--text-3)", fontSize: 11 }}>{role}</div>}
      </div>
    </div>
  );
}

export function ReviewNote({ title, body, tone }: { title?: string; body?: string; tone?: string }) {
  const border = tone === "green" ? "rgba(16,185,129,.24)" : tone === "blue" ? "rgba(79,139,255,.24)" : "rgba(245,158,11,.28)";
  const background = tone === "green" ? "rgba(16,185,129,.07)" : tone === "blue" ? "rgba(79,139,255,.07)" : "rgba(245,158,11,.08)";
  return (
    <div style={{ padding: 12, border: `1px solid ${border}`, background, borderRadius: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
