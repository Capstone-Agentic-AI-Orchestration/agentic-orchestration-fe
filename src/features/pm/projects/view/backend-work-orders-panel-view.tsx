"use client";

import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/shared/components/ui";
import { IconPlus, IconRocket } from "@/shared/components/icons";
import {
  SectionTitle,
  WorkOrderPriorityBadge,
  WorkOrderStatusBadge,
} from "../components/pm-project-ui";
import { compactBackendError } from "../utils/pm-project-detail.utils";
import {
  WORK_ORDER_AGENT_OPTIONS,
  WORK_ORDER_PRIORITY_OPTIONS,
  type BackendWorkOrderRow,
} from "../model/work-orders-panel";
import type { BackendWorkOrdersPanelViewModel } from "../view-model/use-work-orders-panel-view-model";
import type { DevFlowWorkOrderStatus } from "@/shared/api/devflow-api";

export function BackendWorkOrdersPanelView({ vm }: { vm: BackendWorkOrdersPanelViewModel }) {
  if (vm.loading) {
    return <Card className="pm-tab-panel pm-tab-empty">Loading work orders...</Card>;
  }

  if (vm.error) {
    return (
      <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">
        {compactBackendError(vm.error)}
      </Card>
    );
  }

  return (
    <div className={vm.readOnly ? "pm-tab-layout" : "pm-tab-layout pm-tab-layout--aside"}>
      <Card className="pm-tab-panel">
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle title="Orchestration handoff" subtitle={vm.workOrderSubtitle} />
          {vm.workOrderError && <div className="pm-tab-message pm-tab-message--danger" style={{ marginTop: 12 }}>{compactBackendError(vm.workOrderError)}</div>}
        </div>

        {!vm.hasWorkOrders ? (
          <div className="pm-tab-empty">
            {vm.readOnly
              ? "No work orders yet. They appear here once a developer packages the delivery work for the agents."
              : "No work orders created yet. Package a task into a specialist handoff when it is ready for execution."}
          </div>
        ) : <div className="pm-tab-list">{vm.workOrderRows.map((row) => (
          <BackendWorkOrderRowView key={row.id} row={row} vm={vm} />
        ))}</div>}
      </Card>

      {!vm.readOnly && (
      <Card className="pm-tab-panel pm-tab-panel--padded">
        <SectionTitle title="New work order" subtitle="Package a task or artifact for a specialist persona" />
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <Field label="Source task">
            <Select value={vm.form.taskId} onChange={vm.actions.onTaskChange}>
              <option value="">No task link</option>
              {vm.taskOptions.map((task) => (
                <option key={task.id} value={task.id}>{task.label}</option>
              ))}
            </Select>
          </Field>

          {vm.taskShortcuts.length > 0 && (
            <div className="pm-tab-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
              <div className="pm-tab-section-heading">
                <h4>Quick start from a task</h4>
                <p>Select an existing task to prefill this handoff.</p>
              </div>
              <div style={{ display: "grid", gap: 6, maxHeight: 150, overflow: "auto", paddingRight: 2 }}>
              {vm.taskShortcuts.map((shortcut) => (
                <button
                  key={shortcut.id}
                  onClick={() => vm.actions.createFromTask(shortcut.task)}
                  style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, background: shortcut.selected ? "rgba(79,139,255,.14)" : "rgba(8,14,32,.35)", color: "white", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{shortcut.title}</div>
                  <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{shortcut.meta}</div>
                </button>
              ))}
              </div>
            </div>
          )}

          <Field label="Title">
            <Input value={vm.form.title} onChange={vm.actions.onTitleChange} placeholder="Handoff: implement dashboard shell" />
          </Field>
          <Field label="Instructions">
            <Textarea rows={5} value={vm.form.instructions} onChange={vm.actions.onInstructionsChange} placeholder="Acceptance notes, scope, constraints, and files to inspect." />
          </Field>
          <div className="pm-tab-form-grid">
            <Field label="Agent">
              <Select value={vm.form.agentType} onChange={vm.actions.onAgentTypeChange}>
                {WORK_ORDER_AGENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={vm.form.priority} onChange={vm.actions.onPriorityChange}>
                {WORK_ORDER_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Related artifact">
            <Select value={vm.form.artifactId} onChange={vm.actions.onArtifactChange}>
              <option value="">No artifact link</option>
              {vm.artifactOptions.map((artifact) => (
                <option key={artifact.id} value={artifact.id}>{artifact.label}</option>
              ))}
            </Select>
          </Field>
          {(vm.selectedTaskLabel || vm.selectedArtifactLabel) && (
            <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5 }}>
              {vm.selectedTaskLabel && <div>{vm.selectedTaskLabel}</div>}
              {vm.selectedArtifactLabel && <div>{vm.selectedArtifactLabel}</div>}
            </div>
          )}
          {vm.formIssue && <div style={{ color: "var(--text-3)", fontSize: 12 }}>{vm.formIssue}</div>}
          <Button variant="primary" size="sm" icon={<IconPlus size={13} />} onClick={vm.actions.createWorkOrder} disabled={vm.saving || !vm.canCreateWorkOrder}>
            {vm.saving ? "Creating..." : "Create work order"}
          </Button>
        </div>
      </Card>
      )}
    </div>
  );
}

function BackendWorkOrderRowView({
  row,
  vm,
}: {
  row: BackendWorkOrderRow;
  vm: BackendWorkOrdersPanelViewModel;
}) {
  return (
    <div className="pm-tab-list-row">
        <div className="pm-tab-list-row__content">
          <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 7 }}>
            <WorkOrderStatusBadge status={row.status} />
            <WorkOrderPriorityBadge priority={row.priority} />
            <Badge tone="purple">{row.agentType}</Badge>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{row.title}</div>
          {row.hasInstructions ? (
            <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5, marginTop: 5, whiteSpace: "pre-wrap" }}>{row.instructions}</div>
          ) : (
            <div style={{ color: "#FBBF24", fontSize: 12.5, lineHeight: 1.5, marginTop: 5 }}>Instructions required before ready or dispatch.</div>
          )}
          <div className="row gap-2" style={{ marginTop: 9, flexWrap: "wrap" }}>
            {row.taskLabel && <Badge tone="blue">{row.taskLabel}</Badge>}
            {row.artifactLabel && <Badge tone="gray">{row.artifactLabel}</Badge>}
            {row.runLabel && <Badge tone="purple">{row.runLabel}</Badge>}
            <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>Updated {row.updatedAtLabel}</span>
          </div>
          {row.executionLabel && (
            <div style={{ color: row.executionTone, fontSize: 11.5, marginTop: 6 }}>
              {row.executionLabel}
            </div>
          )}
        </div>
        {/* Status and Dispatch are the developer's controls. The PM already sees the state
            in the badges above this row, so read-only mode renders no action column at all
            rather than a disabled one that suggests the action exists. */}
        {!vm.readOnly && (
        <div className="pm-tab-list-row__actions">
          <Select
            value={row.status}
            onChange={(event) => vm.actions.changeStatus(row.workOrder, event.target.value as DevFlowWorkOrderStatus)}
            disabled={vm.actionId === row.id || row.statusDisabled}
            style={{ width: 152 }}
          >
            {row.statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Button
            variant="primary"
            size="sm"
            icon={<IconRocket size={13} />}
            onClick={() => vm.actions.dispatchWorkOrder(row.workOrder)}
            disabled={vm.actionId === row.id || Boolean(row.dispatchBlocker)}
          >
            {vm.actionId === row.id ? "Executing..." : "Dispatch"}
          </Button>
          {row.dispatchBlocker && <div style={{ color: "var(--text-3)", fontSize: 11, maxWidth: 152, textAlign: "right" }}>{row.dispatchBlocker}</div>}
        </div>
        )}
    </div>
  );
}
