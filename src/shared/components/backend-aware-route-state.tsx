// @ts-nocheck
"use client";

import { Badge, Button, Card } from "@/shared/components/ui";
import { IconArrowRight, IconClock, IconFolder } from "@/shared/components/icons";
import type { DevFlowProjectSummary } from "@/shared/api/devflow-api";

export function BackendAwareRouteState({
  eyebrow = "Backend-aware state",
  title,
  subtitle,
  projects = [],
  loading,
  error,
  pending = [],
  primaryAction,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  projects?: DevFlowProjectSummary[];
  loading?: boolean;
  error?: string;
  pending?: string[];
  primaryAction?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <Card style={{ padding: 26 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 780 }}>
            <Badge tone="blue">{eyebrow}</Badge>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "12px 0 0", letterSpacing: 0 }}>{title}</h2>
            <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, margin: "8px 0 0" }}>{subtitle}</p>
          </div>
          {primaryAction && (
            <Button variant="primary" iconRight={<IconArrowRight size={14} />} onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <Card style={{ padding: 18 }}>
          <div className="row gap-2" style={{ color: "#93C5FD" }}><IconFolder size={16} />Backend projects</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 10 }}>{loading ? "..." : projects.length}</div>
          <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>{error ? compactError(error) : "Visible to the current authenticated role."}</div>
        </Card>
        <Card style={{ padding: 18 }}>
          <div className="row gap-2" style={{ color: "#FBBF24" }}><IconClock size={16} />Integration status</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>Pending backend module</div>
          <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>This page no longer shows fabricated operational data.</div>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>What still needs an API</h3>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {pending.map((item) => (
              <div key={item} className="row gap-3" style={{ padding: 12, background: "rgba(8,14,32,.45)", border: "1px solid var(--border)", borderRadius: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#F59E0B", flexShrink: 0 }} />
                <span style={{ color: "var(--text-2)", fontSize: 13 }}>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function compactError(message: string) {
  try {
    const parsed = JSON.parse(message);
    return parsed.message || parsed.error || message;
  } catch {
    return message;
  }
}
