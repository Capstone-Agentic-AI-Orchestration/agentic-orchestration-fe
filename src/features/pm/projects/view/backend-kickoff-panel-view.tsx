"use client";

import { Badge, Button, Card, Field, Textarea } from "@/shared/components/ui";
import { IconCheckCircle, IconClipboard, IconWorkflow } from "@/shared/components/icons";
import { SectionTitle, MiniStat } from "../components/pm-project-ui";
import { compactBackendError } from "../utils/pm-project-detail.utils";
import { BACKEND_KICKOFF_TEXT_FIELDS } from "../model/kickoff-panel";
import type { BackendKickoffPanelViewModel } from "../view-model/use-kickoff-panel-view-model";

export function BackendKickoffPanelView({ vm }: { vm: BackendKickoffPanelViewModel }) {
  return (
    <div className="pm-tab-layout pm-tab-layout--aside">
      <Card className="pm-tab-panel pm-tab-panel--padded">
        <div className="pm-tab-header">
          <SectionTitle title="Project kickoff" subtitle={`${vm.completedChecks} of ${vm.totalChecks} checks complete`} />
          <Badge tone={vm.statusTone}>{vm.statusLabel}</Badge>
        </div>
        {vm.kickoffError && <div className="pm-tab-message pm-tab-message--danger" style={{ marginTop: 14 }}>{compactBackendError(vm.kickoffError)}</div>}
        {vm.error && <div className="pm-tab-message pm-tab-message--danger" style={{ marginTop: 14 }}>{compactBackendError(vm.error)}</div>}

        <div className="pm-tab-section">
          <div className="pm-tab-section-heading">
            <h4>Kickoff details</h4>
            <p>Define what will be delivered and what the team needs before work starts.</p>
          </div>
          <div className="pm-tab-form-grid">
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
        </div>

        <div className="pm-tab-section">
          <div className="pm-tab-section-heading">
            <h4>Readiness checklist</h4>
            <p>Complete each requirement before generating execution work.</p>
          </div>
          <div className="pm-tab-checklist">
            {vm.checklist.map((item) => (
              <label
                key={item.key}
                className="pm-tab-checklist-item"
                data-checked={item.checked}
                data-blocked={item.blockedReason ? true : undefined}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  // A blocked check is one the project cannot honestly claim yet, so ticking it
                  // is refused rather than merely discouraged. Already-ticked items stay
                  // untickable-off-and-on but remain visible with their reason.
                  disabled={Boolean(item.blockedReason) && !item.checked}
                  onChange={(event) => vm.actions.setValue(item.key, event.target.checked)}
                />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <strong>{item.label}</strong>
                  <span>{item.body}</span>
                  {item.blockedReason && (
                    <span className="pm-tab-checklist-blocked">{item.blockedReason}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="pm-tab-actions" style={{ marginTop: 18 }}>
          <Button variant="primary" size="sm" icon={<IconCheckCircle size={13} />} onClick={vm.actions.saveKickoff} disabled={vm.saving}>
            {vm.saving ? "Saving..." : "Save kickoff"}
          </Button>
        </div>

        <div className="pm-tab-section">
          <div className="pm-tab-section-heading">
            <h4>After kickoff</h4>
            <p>Create the initial delivery records after the kickoff details are saved.</p>
          </div>
          <div className="pm-tab-actions">
          <Button variant="secondary" size="sm" icon={<IconClipboard size={13} />} onClick={vm.actions.createStarterTasks} disabled={vm.action === "tasks" || vm.loading}>
            {vm.action === "tasks" ? "Creating..." : "Create starter tasks"}
          </Button>
          <Button variant="secondary" size="sm" icon={<IconWorkflow size={13} />} onClick={vm.actions.createStarterWorkOrders} disabled={vm.action === "work-orders" || vm.loading}>
            {vm.action === "work-orders" ? "Creating..." : "Create starter work orders"}
          </Button>
          </div>
        </div>
      </Card>

      <aside className="pm-tab-aside">
        <Card className="pm-tab-panel pm-tab-panel--padded">
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

        <Card className="pm-tab-panel pm-tab-panel--padded">
          <SectionTitle title="Kickoff outputs" subtitle="Task and work-order hooks" />
          <div className="pm-tab-stat-grid" style={{ marginTop: 12 }}>
            <MiniStat label="Tasks" value={String(vm.taskCount)} />
            <MiniStat label="Work orders" value={String(vm.workOrderCount)} />
          </div>
          <div style={{ color: vm.outputTone, fontSize: 12.5, lineHeight: 1.5, marginTop: 12 }}>
            {vm.outputMessage}
          </div>
        </Card>
      </aside>
    </div>
  );
}
