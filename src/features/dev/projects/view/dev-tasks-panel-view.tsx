"use client";

import { Badge, Button, Card, Field, Modal, Select, Textarea } from "@/shared/components/ui";
import { IconMessageCircle } from "@/shared/components/icons";
import type { DevFlowProjectTaskStatus } from "@/shared/api/devflow-api";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";
import type {
  DevTaskActivityRowModel,
  DevTaskBadgeView,
} from "../model/dev-tasks-panel";
import type { DevTasksPanelViewModel } from "../view-model/use-dev-tasks-panel-view-model";

export function DevTasksPanelView({ vm }: { vm: DevTasksPanelViewModel }) {
  if (vm.loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading assigned tasks...</Card>;
  if (vm.error) return <Card style={{ padding: 22, color: "#FCA5A5" }}>{compactDevFlowError(vm.error)}</Card>;

  return (
    <Card style={{ padding: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>My assigned tasks</h3>
      <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Project tasks assigned to this developer</p>
      {vm.taskError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactDevFlowError(vm.taskError)}</div>}
      {vm.empty ? (
        <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No assigned backend tasks yet.</div>
      ) : vm.rows.map((row) => (
        <div key={row.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{row.title}</div>
              {row.description && <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{row.description}</div>}
              {row.artifactLabel && <div className="mono" style={{ color: "#93C5FD", fontSize: 11, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis" }}>{row.artifactLabel}</div>}
              {row.revision && (
                <div style={{ marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.07)", color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>
                  <div className="row gap-2" style={{ marginBottom: row.revision.note ? 5 : 0, flexWrap: "wrap" }}>
                    <Badge tone="amber">Revision task</Badge>
                    {row.revision.requestedAtLabel && <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{row.revision.requestedAtLabel}</span>}
                  </div>
                  {row.revision.note && <div>{row.revision.note}</div>}
                </div>
              )}
            </div>
            <DevTaskBadge badge={row.statusBadge} />
          </div>
          <Select value={row.status} onChange={(event) => vm.actions.updateStatus(row.task, event.target.value as DevFlowProjectTaskStatus)} disabled={row.updating} style={{ marginTop: 10 }}>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="IN_REVIEW">In review</option>
            <option value="DONE">Done</option>
          </Select>
          <Button variant="secondary" size="sm" icon={<IconMessageCircle size={13} />} onClick={() => vm.actions.openActivity(row.task)} style={{ marginTop: 8 }}>Activity</Button>
        </div>
      ))}
      <DevTaskActivityModal vm={vm} />
    </Card>
  );
}

function DevTaskActivityModal({ vm }: { vm: DevTasksPanelViewModel }) {
  const modal = vm.activityModal;

  return (
    <Modal open={vm.activityOpen} onClose={vm.actions.closeActivity} title="Task activity" width={760} footer={<><Button variant="primary" size="sm" onClick={vm.actions.closeActivity}>Close</Button></>}>
      {!modal ? null : (
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{modal.taskTitle}</div>
            {modal.taskDescription && <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, marginTop: 5 }}>{modal.taskDescription}</div>}
          </div>
          <div style={{ display: "grid", gap: 10, maxHeight: 360, overflow: "auto", paddingRight: 4 }}>
            {modal.loading ? (
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>Loading activity...</div>
            ) : modal.error ? (
              <div style={{ color: "#FCA5A5", fontSize: 13 }}>{compactDevFlowError(modal.error)}</div>
            ) : modal.empty ? (
              <div style={{ color: "var(--text-3)", fontSize: 13 }}>No activity yet.</div>
            ) : modal.rows.map((item) => (
              <DevTaskActivityRow key={item.id} item={item} />
            ))}
          </div>
          <Field label="Add comment">
            <Textarea rows={3} value={modal.comment} onChange={(event) => vm.actions.setComment(event.target.value)} placeholder="Share a progress update, blocker, or question." />
          </Field>
          <Button variant="primary" size="sm" icon={<IconMessageCircle size={13} />} onClick={vm.actions.addComment} disabled={modal.postDisabled}>
            {modal.commentSaving ? "Posting..." : "Post comment"}
          </Button>
        </div>
      )}
    </Modal>
  );
}

function DevTaskActivityRow({ item }: { item: DevTaskActivityRowModel }) {
  return (
    <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: item.isComment ? "rgba(79,139,255,.08)" : "rgba(8,14,32,.45)" }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{item.actorName}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{item.label}</div>
        </div>
        <span style={{ color: "var(--text-3)", fontSize: 11.5, whiteSpace: "nowrap" }}>{item.createdAtLabel}</span>
      </div>
      {item.message && <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, marginTop: 8, whiteSpace: "pre-wrap" }}>{item.message}</div>}
    </div>
  );
}

function DevTaskBadge({ badge }: { badge: DevTaskBadgeView }) {
  return <Badge tone={badge.tone}>{badge.label}</Badge>;
}
