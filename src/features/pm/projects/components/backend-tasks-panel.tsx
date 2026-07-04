// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { IconMessageCircle, IconPlus, IconSend } from "@/shared/components/icons";
import { SectionTitle, ProjectTaskStatusDot, BackendTaskStatusBadge } from "./pm-project-ui";
import { compactBackendError, formatBackendDate } from "../utils/pm-project-detail.utils";
import { createDevFlowProjectTask, addDevFlowProjectTaskComment, getDevFlowProjectTaskActivity, updateDevFlowProjectTask } from "@/shared/api/devflow-api";

export function BackendTasksPanel({ projectId, tasks, artifacts, members, loading, error, onChanged }: Record<string, any>) {
  const devMembers = members.filter((m: any) => m.role === "DEV");
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [comment, setComment] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignedToId: "", artifactId: "" });

  const createTask = async () => {
    if (!form.title.trim()) return;
    setSavingTask(true); setTaskError("");
    try {
      await createDevFlowProjectTask(projectId, { title: form.title.trim(), description: form.description.trim() || undefined, assignedToId: form.assignedToId || undefined, artifactId: form.artifactId || undefined });
      setForm({ title: "", description: "", assignedToId: "", artifactId: "" }); await onChanged?.();
    } catch (e) { setTaskError(e instanceof Error ? e.message : String(e)); }
    finally { setSavingTask(false); }
  };

  const openTaskActivity = async (task: any) => {
    setSelectedTask(task); setActivityOpen(true); setActivity([]); setActivityError(""); setActivityLoading(true);
    try { setActivity(await getDevFlowProjectTaskActivity(projectId, task.id)); }
    catch (e) { setActivityError(e instanceof Error ? e.message : String(e)); }
    finally { setActivityLoading(false); }
  };

  const addComment = async () => {
    if (!selectedTask || !comment.trim()) return;
    setCommentSaving(true); setActivityError("");
    try { await addDevFlowProjectTaskComment(projectId, selectedTask.id, { message: comment.trim() }); setComment(""); setActivity(await getDevFlowProjectTaskActivity(projectId, selectedTask.id)); }
    catch (e) { setActivityError(e instanceof Error ? e.message : String(e)); }
    finally { setCommentSaving(false); }
  };

  const updateTaskStatus = async (task: any, status: string) => {
    setTaskError("");
    try { await updateDevFlowProjectTask(projectId, task.id, { status }); await onChanged?.(); }
    catch (e) { setTaskError(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading project tasks...</Card>;
  if (error) return <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>{compactBackendError(error)}</Card>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18 }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle title="Project work queue" subtitle={`${tasks.length} backend task${tasks.length === 1 ? "" : "s"}`} />
          {taskError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 8 }}>{compactBackendError(taskError)}</div>}
        </div>
        {tasks.length === 0 ? (
          <div style={{ padding: 18, color: "var(--text-3)", fontSize: 13 }}>No tasks created yet.</div>
        ) : tasks.map((task: any) => (
          <div key={task.id} className="row gap-3" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
            <ProjectTaskStatusDot status={task.status} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{task.title}</div>
              {task.description && <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4, lineHeight: 1.45 }}>{task.description}</div>}
              <div className="row gap-2" style={{ marginTop: 8, flexWrap: "wrap" }}>
                <Badge tone="blue">{task.assignedTo?.fullName || task.assignedTo?.email || "Unassigned"}</Badge>
                {task.artifact && <Badge tone="purple">{task.artifact.displayName || task.artifact.filePath}</Badge>}
              </div>
            </div>
            <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
              <Select value={task.status} onChange={(e) => updateTaskStatus(task, e.target.value)} style={{ width: 150 }}>
                <option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="IN_REVIEW">In review</option><option value="DONE">Done</option>
              </Select>
              <Button variant="secondary" size="sm" icon={<IconMessageCircle size={13} />} onClick={() => openTaskActivity(task)}>Activity</Button>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ padding: 22 }}>
        <SectionTitle title="New task" subtitle="Assign work to a project developer" />
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder="Fix requested dashboard copy" /></Field>
          <Field label="Description"><Textarea rows={4} value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="Specific acceptance notes for the assigned developer." /></Field>
          <Field label="Assignee">
            <Select value={form.assignedToId} onChange={(e) => setForm((c) => ({ ...c, assignedToId: e.target.value }))}>
              <option value="">Unassigned</option>
              {devMembers.map((m: any) => <option key={m.userId} value={m.userId}>{m.user.fullName || m.user.email || m.user.id}</option>)}
            </Select>
          </Field>
          <Field label="Related artifact">
            <Select value={form.artifactId} onChange={(e) => setForm((c) => ({ ...c, artifactId: e.target.value }))}>
              <option value="">No artifact link</option>
              {artifacts.map((a: any) => <option key={a.id} value={a.id}>{a.displayName || a.filePath}</option>)}
            </Select>
          </Field>
          <Button variant="primary" size="sm" icon={<IconPlus size={13} />} onClick={createTask} disabled={savingTask || !form.title.trim()}>{savingTask ? "Creating..." : "Create task"}</Button>
        </div>
      </Card>

      <Modal open={activityOpen} onClose={() => setActivityOpen(false)} title="Task activity" width={760} footer={<><Button variant="ghost" size="sm" onClick={() => setActivityOpen(false)}>Close</Button></>}>
        {!selectedTask ? null : (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedTask.title}</div>
              {selectedTask.description && <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>{selectedTask.description}</div>}
            </div>
            {activityLoading ? (
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>Loading activity...</div>
            ) : activityError ? (
              <div style={{ color: "#FCA5A5", fontSize: 13 }}>{compactBackendError(activityError)}</div>
            ) : activity.length === 0 ? (
              <div style={{ color: "var(--text-3)", fontSize: 13 }}>No activity recorded yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {activity.map((item: any) => (
                  <div key={item.id} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>{item.actorName || item.actorEmail || "System"}</span>
                      <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{formatBackendDate(item.createdAt)}</span>
                    </div>
                    <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4 }}>{item.message || item.type}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div className="row gap-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." onKeyDown={(e) => e.key === "Enter" && addComment()} />
                <Button variant="primary" size="sm" icon={<IconSend size={13} />} onClick={addComment} disabled={commentSaving || !comment.trim()}>Send</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
