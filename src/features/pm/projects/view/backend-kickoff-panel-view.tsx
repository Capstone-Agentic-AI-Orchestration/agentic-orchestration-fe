"use client";

import { Badge, Button, Card, Field, Textarea } from "@/shared/components/ui";
import { IconCheckCircle, IconClipboard, IconWorkflow } from "@/shared/components/icons";
import { SectionTitle, MiniStat } from "../components/pm-project-ui";
import { compactBackendError } from "../utils/pm-project-detail.utils";
import { BACKEND_KICKOFF_TEXT_FIELDS } from "../model/kickoff-panel";
import type { BackendKickoffPanelViewModel } from "../view-model/use-kickoff-panel-view-model";

export function BackendKickoffPanelView({ vm }: { vm: BackendKickoffPanelViewModel }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18 }}>
      <Card style={{ padding: 22 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <SectionTitle title="Project kickoff" subtitle={`${vm.completedChecks} of ${vm.totalChecks} checks complete`} />
          <Badge tone={vm.statusTone}>{vm.statusLabel}</Badge>
        </div>
        {vm.kickoffError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactBackendError(vm.kickoffError)}</div>}
        {vm.error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactBackendError(vm.error)}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
          {BACKEND_KICKOFF_TEXT_FIELDS.map((field) => (
            <Field key={field.key} label={field.label}>
              <Textarea
                rows={4}
                value={vm.form[field.key]}
                onChange={(event) => vm.actions.setValue(field.key, event.target.value)}
              />
            </Field>
          ))}
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
          {vm.checklist.map((item) => (
            <label key={item.key} className="row" style={{ gap: 12, alignItems: "flex-start", padding: "11px 12px", border: "1px solid var(--border)", borderRadius: 8, background: item.checked ? "rgba(16,185,129,.08)" : "rgba(8,14,32,.35)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(event) => vm.actions.setValue(item.key, event.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16 }}
              />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", color: "white", fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                <span style={{ display: "block", color: "var(--text-3)", fontSize: 12, marginTop: 3, lineHeight: 1.45 }}>{item.body}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="row gap-2" style={{ marginTop: 16, flexWrap: "wrap" }}>
          <Button variant="primary" size="sm" icon={<IconCheckCircle size={13} />} onClick={vm.actions.saveKickoff} disabled={vm.saving}>
            {vm.saving ? "Saving..." : "Save kickoff"}
          </Button>
          <Button variant="secondary" size="sm" icon={<IconClipboard size={13} />} onClick={vm.actions.createStarterTasks} disabled={vm.action === "tasks" || vm.loading}>
            {vm.action === "tasks" ? "Creating..." : "Create starter tasks"}
          </Button>
          <Button variant="secondary" size="sm" icon={<IconWorkflow size={13} />} onClick={vm.actions.createStarterWorkOrders} disabled={vm.action === "work-orders" || vm.loading}>
            {vm.action === "work-orders" ? "Creating..." : "Create starter work orders"}
          </Button>
        </div>
      </Card>

      <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle title="Client onboarding" subtitle={vm.inviteSubtitle} />
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {!vm.hasInvites ? (
              <div style={{ color: "var(--text-3)", fontSize: 13 }}>No client invite is linked to this project.</div>
            ) : vm.inviteRows.map((invite) => (
              <div key={invite.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}>
                <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{invite.contactName}</div>
                  <Badge tone={invite.tone}>{invite.status}</Badge>
                </div>
                <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>{invite.email}</div>
                <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>{invite.timelineLabel}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionTitle title="Kickoff outputs" subtitle="Task and work-order hooks" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <MiniStat label="Tasks" value={String(vm.taskCount)} />
            <MiniStat label="Work orders" value={String(vm.workOrderCount)} />
          </div>
          <div style={{ color: vm.outputTone, fontSize: 12.5, lineHeight: 1.5, marginTop: 12 }}>
            {vm.outputMessage}
          </div>
        </Card>
      </div>
    </div>
  );
}
