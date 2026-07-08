"use client";

import { Badge, Card } from "@/shared/components/ui";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";
import type {
  DevWorkOrderBadgeView,
  DevWorkOrderChip,
} from "../model/dev-work-orders-panel";
import type { DevWorkOrdersPanelViewModel } from "../view-model/use-dev-work-orders-panel-view-model";

export function DevWorkOrdersPanelView({ vm }: { vm: DevWorkOrdersPanelViewModel }) {
  if (vm.loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading work orders...</Card>;
  if (vm.error) return <Card style={{ padding: 22, color: "#FCA5A5" }}>{compactDevFlowError(vm.error)}</Card>;

  return (
    <Card style={{ padding: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Work orders</h3>
      <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Read-only orchestration handoffs assigned through your tasks</p>
      {vm.empty ? (
        <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No work orders assigned yet.</div>
      ) : vm.rows.map((row) => (
        <div key={row.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 7 }}>
                <DevWorkOrderBadge badge={row.status} />
                <DevWorkOrderBadge badge={row.priority} />
                <Badge tone="purple">{row.agentType}</Badge>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{row.title}</div>
              {row.instructions && <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5, marginTop: 5, whiteSpace: "pre-wrap" }}>{row.instructions}</div>}
              <div className="row gap-2" style={{ flexWrap: "wrap", marginTop: 8 }}>
                {row.chips.map((chip) => <DevWorkOrderChipBadge key={`${chip.tone}-${chip.label}`} chip={chip} />)}
              </div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 7 }}>{row.executionLabel}</div>
              {row.executionError && <div style={{ color: "#FCA5A5", fontSize: 11.5, marginTop: 5 }}>{row.executionError}</div>}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function DevWorkOrderBadge({ badge }: { badge: DevWorkOrderBadgeView }) {
  return <Badge tone={badge.tone}>{badge.label}</Badge>;
}

function DevWorkOrderChipBadge({ chip }: { chip: DevWorkOrderChip }) {
  return <Badge tone={chip.tone}>{chip.label}</Badge>;
}
