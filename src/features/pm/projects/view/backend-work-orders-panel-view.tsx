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
    return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading work orders...</Card>;
  }

  if (vm.error) {
    return (
      <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>
        {compactBackendError(vm.error)}
      </Card>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 18 }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle title="Orchestration handoff" subtitle={vm.workOrderSubtitle} />
          {vm.workOrderError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 8 }}>{compactBackendError(vm.workOrderError)}</div>}
        </div>

        {!vm.hasWorkOrders ? (
          <div style={{ padding: 18, color: "var(--text-3)", fontSize: 13 }}>No work orders created yet.</div>
        ) : vm.workOrderRows.map((row) => (
          <BackendWorkOrderRowView key={row.id} row={row} vm={vm} />
        ))}
      </Card>

      <Card style={{ padding: 22 }}>
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
            <div style={{ display: "grid", gap: 6, maxHeight: 132, overflow: "auto", paddingRight: 2 }}>
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
          )}

          <Field label="Title">
            <Input value={vm.form.title} onChange={vm.actions.onTitleChange} placeholder="Handoff: implement dashboard shell" />
          </Field>
          <Field label="Instructions">
            <Textarea rows={5} value={vm.form.instructions} onChange={vm.actions.onInstructionsChange} placeholder="Acceptance notes, scope, constraints, and files to inspect." />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
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
        <div style={{ display: "grid", gap: 8, justifyItems: "end", minWidth: 152 }}>
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
      </div>
    </div>
  );
}
