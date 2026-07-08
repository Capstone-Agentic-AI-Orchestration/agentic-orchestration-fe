"use client";

import type { ReactNode } from "react";
import { Badge } from "@/shared/components/ui";
import {
  artifactValidationBadge,
  backendReviewBadge,
  backendTaskStatusBadge,
  orchestrationFactBadge,
  orchestrationRunBadge,
  outputReviewBadge,
  personInitials,
  projectTaskStatusColor,
  reviewNoteColors,
  workOrderPriorityBadge,
  workOrderStatusBadge,
} from "../model/pm-project-ui";

/**
 * Reusable badge and presentational components for PM project detail views.
 */

export function OrchestrationRunBadge({ status }: { status?: string }) {
  const next = orchestrationRunBadge(status);
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function OrchestrationFact({ label, value, tone, mono }: { label: string; value: string; tone?: string; mono?: boolean }) {
  const badge = orchestrationFactBadge(tone);
  return (
    <div style={{ padding: 12, borderRadius: 10, background: "rgba(8,14,32,.55)", border: "1px solid var(--border)", minWidth: 0 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{label}</span>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      <div className={mono ? "mono" : undefined} style={{ fontSize: 15, fontWeight: 800, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

export function ProjectTaskStatusDot({ status }: { status?: string }) {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: projectTaskStatusColor(status), flexShrink: 0 }} />;
}

export function BackendTaskStatusBadge({ status }: { status?: string }) {
  const next = backendTaskStatusBadge(status);
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function WorkOrderStatusBadge({ status }: { status?: string }) {
  const next = workOrderStatusBadge(status);
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function WorkOrderPriorityBadge({ priority }: { priority?: string }) {
  const next = workOrderPriorityBadge(priority);
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function BackendReviewBadge({ status }: { status?: string }) {
  const next = backendReviewBadge(status);
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function ArtifactValidationBadge({ status }: { status?: string }) {
  const next = artifactValidationBadge(status);
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function OutputReviewBadge({ status }: { status?: string }) {
  const next = outputReviewBadge(status);
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function SectionTitle({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
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

export function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ padding: 14, borderRadius: 10, background: "rgba(8,14,32,.55)", border: "1px solid var(--border)", marginTop: 10 }}>
      <div style={{ color: "var(--text-3)", fontSize: 11 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function FactRow({ icon, label, value }: { icon?: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="row gap-2" style={{ color: "var(--text-3)", fontSize: 12 }}>{icon}{label}</div>
      <div style={{ fontWeight: 600, fontSize: 13, textAlign: "right" }}>{value}</div>
    </div>
  );
}

export function BackendPersonAvatar({ name, size = 32 }: { name?: string; size?: number }) {
  const initials = personInitials(name);
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
  const { border, background } = reviewNoteColors(tone);
  return (
    <div style={{ padding: 12, border: `1px solid ${border}`, background, borderRadius: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{title}</div>
      <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}
