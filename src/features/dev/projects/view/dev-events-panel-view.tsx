"use client";

import { Card } from "@/shared/components/ui";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";
import type { DevEventsPanelViewModel } from "../view-model/use-dev-events-panel-view-model";

export function DevEventsPanelView({ vm }: { vm: DevEventsPanelViewModel }) {
  if (vm.loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading pipeline activity...</Card>;
  if (vm.error) return <Card style={{ padding: 22, color: "#FCA5A5" }}>{compactDevFlowError(vm.error)}</Card>;

  return (
    <Card style={{ padding: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Pipeline activity</h3>
      <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Recent backend event logs</p>
      {vm.empty ? (
        <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No event logs yet.</div>
      ) : vm.rows.map((event) => (
        <div key={event.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{event.nodeName}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{event.subtitle}</div>
        </div>
      ))}
    </Card>
  );
}
