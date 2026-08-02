"use client";

import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { IconMessageCircle, IconPlus, IconSend } from "@/shared/components/icons";
import { SectionTitle, ProjectTaskStatusDot } from "../components/pm-project-ui";
import { compactBackendError } from "../utils/pm-project-detail.utils";
import {
  PROJECT_TASK_STATUS_OPTIONS,
  type BackendTaskRow,
} from "../model/tasks-panel";
import type { BackendTasksPanelViewModel } from "../view-model/use-tasks-panel-view-model";
import type { DevFlowProjectTaskStatus } from "@/shared/api/devflow-api";

export function BackendTasksPanelView({ vm }: { vm: BackendTasksPanelViewModel }) {
  if (vm.loading) {
    return <Card className="pm-tab-panel pm-tab-empty">Loading project tasks...</Card>;
  }

  if (vm.error) {
    return (
      <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">
        {compactBackendError(vm.error)}
      </Card>
    );
  }

  return (
    <div className="pm-tab-layout pm-tab-layout--aside">
      <Card className="pm-tab-panel">
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle title="Project work queue" subtitle={vm.taskSubtitle} />
          {vm.taskError && <div className="pm-tab-message pm-tab-message--danger" style={{ marginTop: 12 }}>{compactBackendError(vm.taskError)}</div>}
        </div>
        {!vm.hasTasks ? (
          <div className="pm-tab-empty">No tasks created yet. Use the task form to define the first piece of delivery work.</div>
        ) : <div className="pm-tab-list">{vm.taskRows.map((row) => <BackendTaskListRow key={row.id} row={row} vm={vm} />)}</div>}
      </Card>

      <Card className="pm-tab-panel pm-tab-panel--padded">
        <SectionTitle title="New task" subtitle="Assign work to a project developer" />
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <Field label="Title">
            <Input value={vm.form.title} onChange={vm.actions.onTitleChange} placeholder="Fix requested dashboard copy" />
          </Field>
          <Field label="Description">
            <Textarea rows={4} value={vm.form.description} onChange={vm.actions.onDescriptionChange} placeholder="Specific acceptance notes for the assigned developer." />
          </Field>
          <Field label="Assignee">
            <Select value={vm.form.assignedToId} onChange={vm.actions.onAssigneeChange}>
              <option value="">Unassigned</option>
              {vm.assigneeOptions.map((assignee) => (
                <option key={assignee.userId} value={assignee.userId}>{assignee.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Related artifact">
            <Select value={vm.form.artifactId} onChange={vm.actions.onArtifactChange}>
              <option value="">No artifact link</option>
              {vm.artifactOptions.map((artifact) => (
                <option key={artifact.id} value={artifact.id}>{artifact.label}</option>
              ))}
            </Select>
          </Field>
          <Button
            variant="primary"
            size="sm"
            icon={<IconPlus size={13} />}
            onClick={vm.actions.createTask}
            disabled={vm.savingTask || !vm.canCreateTask}
          >
            {vm.savingTask ? "Creating..." : "Create task"}
          </Button>
        </div>
      </Card>

      <Modal
        open={vm.activityOpen}
        onClose={vm.actions.closeActivity}
        title="Task activity"
        width={760}
        footer={<Button variant="ghost" size="sm" onClick={vm.actions.closeActivity}>Close</Button>}
      >
        {!vm.selectedTask ? null : (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{vm.selectedTask.title}</div>
              {vm.selectedTask.description && <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>{vm.selectedTask.description}</div>}
            </div>
            {vm.activityLoading ? (
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>Loading activity...</div>
            ) : vm.activityError ? (
              <div style={{ color: "#FCA5A5", fontSize: 13 }}>{compactBackendError(vm.activityError)}</div>
            ) : !vm.hasActivity ? (
              <div style={{ color: "var(--text-3)", fontSize: 13 }}>No activity recorded yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {vm.activityRows.map((item) => (
                  <div key={item.id} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>{item.actorLabel}</span>
                      <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{item.createdAtLabel}</span>
                    </div>
                    <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4 }}>{item.message}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div className="row gap-2">
                <Input value={vm.comment} onChange={vm.actions.onCommentChange} placeholder="Add a comment..." onKeyDown={vm.actions.onCommentKeyDown} />
                <Button
                  variant="primary"
                  size="sm"
                  icon={<IconSend size={13} />}
                  onClick={vm.actions.addComment}
                  disabled={vm.commentSaving || !vm.comment.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function BackendTaskListRow({
  row,
  vm,
}: {
  row: BackendTaskRow;
  vm: BackendTasksPanelViewModel;
}) {
  return (
    <div className="pm-tab-list-row">
      <div className="pm-tab-list-row__content">
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <ProjectTaskStatusDot status={row.status} />
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{row.title}</div>
        </div>
        {row.description && <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>{row.description}</div>}
        <div className="row gap-2" style={{ marginTop: 9, flexWrap: "wrap" }}>
          <Badge tone="blue">{row.assigneeLabel}</Badge>
          {row.artifactLabel && <Badge tone="purple">{row.artifactLabel}</Badge>}
        </div>
      </div>
      <div className="pm-tab-list-row__actions">
        <Select
          value={row.status}
          onChange={(event) => vm.actions.updateTaskStatus(row.task, event.target.value as DevFlowProjectTaskStatus)}
          style={{ width: 150 }}
        >
          {PROJECT_TASK_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <Button variant="secondary" size="sm" icon={<IconMessageCircle size={13} />} onClick={() => vm.actions.openTaskActivity(row.task)}>
          Activity
        </Button>
      </div>
    </div>
  );
}
