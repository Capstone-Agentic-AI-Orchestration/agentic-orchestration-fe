// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/shared/components/ui";
import { IconPlus, IconRocket, IconRefresh } from "@/shared/components/icons";
import {
  SectionTitle,
  WorkOrderStatusBadge,
  WorkOrderPriorityBadge,
} from "./pm-project-ui";
import {
  compactBackendError,
  formatBackendDate,
  workOrderDispatchBlocker,
} from "../utils/pm-project-detail.utils";
import {
  createDevFlowWorkOrder,
  dispatchDevFlowWorkOrder,
  updateDevFlowWorkOrder,
} from "@/shared/api/devflow-api";

interface WorkOrder {
  id: string;
  title: string;
  instructions?: string;
  agentType: string;
  priority: string;
  status: string;
  taskId?: string;
  artifactId?: string;
  task?: { title: string };
  artifact?: { displayName?: string; filePath?: string };
  executionRunId?: string;
  executionAttempt?: number;
  executionStartedAt?: string;
  executionCompletedAt?: string;
  executionError?: string;
  updatedAt?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  artifactId?: string;
  assignedTo?: { fullName?: string; email?: string };
}

interface Artifact {
  id: string;
  displayName?: string;
  filePath?: string;
}

interface BackendWorkOrdersPanelProps {
  projectId: string;
  workOrders: WorkOrder[];
  tasks: Task[];
  artifacts: Artifact[];
  loading: boolean;
  error?: string;
  onChanged?: () => Promise<void>;
}

export function BackendWorkOrdersPanel({ projectId, workOrders, tasks, artifacts, loading, error, onChanged }: BackendWorkOrdersPanelProps) {
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [workOrderError, setWorkOrderError] = useState("");
  const [form, setForm] = useState({
    title: "",
    instructions: "",
    agentType: "FRONTEND",
    priority: "NORMAL",
    taskId: "",
    artifactId: "",
  });

  const selectedTask = tasks.find((task) => task.id === form.taskId);
  const selectedArtifact = artifacts.find((artifact) => artifact.id === form.artifactId);
  const formIssue = !form.title.trim()
    ? "Title is required."
    : !form.instructions.trim()
      ? "Instructions are required before a work order can be actioned."
      : "";

  const createWorkOrder = async () => {
    if (formIssue) {
      setWorkOrderError(formIssue);
      return;
    }
    setSaving(true);
    setWorkOrderError("");
    try {
      await createDevFlowWorkOrder(projectId, {
        title: form.title.trim(),
        instructions: form.instructions.trim() || undefined,
        agentType: form.agentType,
        priority: form.priority,
        taskId: form.taskId || undefined,
        artifactId: form.artifactId || undefined,
      });
      setForm({ title: "", instructions: "", agentType: "FRONTEND", priority: "NORMAL", taskId: "", artifactId: "" });
      await onChanged?.();
    } catch (nextError) {
      setWorkOrderError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  };

  const createFromTask = (task: Task) => {
    setForm((current) => ({
      ...current,
      title: current.title || `Handoff: ${task.title}`,
      instructions: current.instructions || task.description || "",
      taskId: task.id,
      artifactId: task.artifactId || current.artifactId,
    }));
  };

  const changeStatus = async (workOrder: WorkOrder, status: string) => {
    if (["READY", "DISPATCHED", "COMPLETED"].includes(status) && !workOrder.instructions?.trim()) {
      setWorkOrderError("Instructions are required before a work order can be marked ready, dispatched, or completed.");
      return;
    }
    setActionId(workOrder.id);
    setWorkOrderError("");
    try {
      await updateDevFlowWorkOrder(projectId, workOrder.id, { status });
      await onChanged?.();
    } catch (nextError) {
      setWorkOrderError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setActionId("");
    }
  };

  const dispatchWorkOrder = async (workOrder: WorkOrder) => {
    const blocker = workOrderDispatchBlocker(workOrder);
    if (blocker) {
      setWorkOrderError(blocker);
      return;
    }
    setActionId(workOrder.id);
    setWorkOrderError("");
    try {
      await dispatchDevFlowWorkOrder(projectId, workOrder.id);
      await onChanged?.();
    } catch (nextError) {
      setWorkOrderError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setActionId("");
    }
  };

  if (loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading work orders...</Card>;
  if (error) return <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>{compactBackendError(error)}</Card>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 18 }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle title="Orchestration handoff" subtitle={`${workOrders.length} work order${workOrders.length === 1 ? "" : "s"} ready for persona handoff`} />
          {workOrderError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 8 }}>{compactBackendError(workOrderError)}</div>}
        </div>

        {workOrders.length === 0 ? (
          <div style={{ padding: 18, color: "var(--text-3)", fontSize: 13 }}>No work orders created yet.</div>
        ) : workOrders.map((workOrder) => (
          <div key={workOrder.id} style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 7 }}>
                  <WorkOrderStatusBadge status={workOrder.status} />
                  <WorkOrderPriorityBadge priority={workOrder.priority} />
                  <Badge tone="purple">{workOrder.agentType}</Badge>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{workOrder.title}</div>
                {workOrder.instructions ? (
                  <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5, marginTop: 5, whiteSpace: "pre-wrap" }}>{workOrder.instructions}</div>
                ) : (
                  <div style={{ color: "#FBBF24", fontSize: 12.5, lineHeight: 1.5, marginTop: 5 }}>Instructions required before ready or dispatch.</div>
                )}
                <div className="row gap-2" style={{ marginTop: 9, flexWrap: "wrap" }}>
                  {workOrder.task && <Badge tone="blue">{workOrder.task.title}</Badge>}
                  {workOrder.artifact && <Badge tone="gray">{workOrder.artifact.displayName || workOrder.artifact.filePath}</Badge>}
                  {workOrder.executionRunId && <Badge tone="purple">Run {workOrder.executionAttempt || 1}</Badge>}
                  <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>Updated {formatBackendDate(workOrder.updatedAt)}</span>
                </div>
                {(workOrder.executionStartedAt || workOrder.executionCompletedAt || workOrder.executionError) && (
                  <div style={{ color: workOrder.executionError ? "#FCA5A5" : "var(--text-3)", fontSize: 11.5, marginTop: 6 }}>
                    {workOrder.executionError
                      ? `Execution failed: ${workOrder.executionError}`
                      : workOrder.executionCompletedAt
                        ? `Execution completed ${formatBackendDate(workOrder.executionCompletedAt)}`
                        : `Execution started ${formatBackendDate(workOrder.executionStartedAt)}`}
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gap: 8, justifyItems: "end", minWidth: 152 }}>
                <Select value={workOrder.status} onChange={(event) => changeStatus(workOrder, event.target.value)} disabled={actionId === workOrder.id || ["DISPATCHED", "COMPLETED"].includes(workOrder.status)} style={{ width: 152 }}>
                  <option value="DRAFT">Draft</option>
                  <option value="READY">Ready</option>
                  {workOrder.status === "DISPATCHED" && <option value="DISPATCHED">Dispatched</option>}
                  {workOrder.status === "COMPLETED" && <option value="COMPLETED">Completed</option>}
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<IconRocket size={13} />}
                  onClick={() => dispatchWorkOrder(workOrder)}
                  disabled={actionId === workOrder.id || Boolean(workOrderDispatchBlocker(workOrder))}
                >
                  {actionId === workOrder.id ? "Executing..." : "Dispatch"}
                </Button>
                {workOrderDispatchBlocker(workOrder) && <div style={{ color: "var(--text-3)", fontSize: 11, maxWidth: 152, textAlign: "right" }}>{workOrderDispatchBlocker(workOrder)}</div>}
              </div>
            </div>
          </div>
        ))}
      </Card>

      <Card style={{ padding: 22 }}>
        <SectionTitle title="New work order" subtitle="Package a task or artifact for a specialist persona" />
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <Field label="Source task">
            <Select value={form.taskId} onChange={(event) => setForm((current) => ({ ...current, taskId: event.target.value, artifactId: tasks.find((task) => task.id === event.target.value)?.artifactId || current.artifactId }))}>
              <option value="">No task link</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </Select>
          </Field>

          {tasks.length > 0 && (
            <div style={{ display: "grid", gap: 6, maxHeight: 132, overflow: "auto", paddingRight: 2 }}>
              {tasks.slice(0, 4).map((task) => (
                <button key={task.id} onClick={() => createFromTask(task)} style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, background: task.id === form.taskId ? "rgba(79,139,255,.14)" : "rgba(8,14,32,.35)", color: "white", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{task.title}</div>
                  <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{task.assignedTo?.fullName || task.assignedTo?.email || "Unassigned"} - {task.status}</div>
                </button>
              ))}
            </div>
          )}

          <Field label="Title">
            <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Handoff: implement dashboard shell" />
          </Field>
          <Field label="Instructions">
            <Textarea rows={5} value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} placeholder="Acceptance notes, scope, constraints, and files to inspect." />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Agent">
              <Select value={form.agentType} onChange={(event) => setForm((current) => ({ ...current, agentType: event.target.value }))}>
                <option value="FRONTEND">Frontend</option>
                <option value="BACKEND">Backend</option>
                <option value="DATABASE">Database</option>
                <option value="ARCHITECTURE">Architecture</option>
                <option value="CONTRACT">Contract</option>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </Select>
            </Field>
          </div>
          <Field label="Related artifact">
            <Select value={form.artifactId} onChange={(event) => setForm((current) => ({ ...current, artifactId: event.target.value }))}>
              <option value="">No artifact link</option>
              {artifacts.map((artifact) => (
                <option key={artifact.id} value={artifact.id}>{artifact.displayName || artifact.filePath}</option>
              ))}
            </Select>
          </Field>
          {(selectedTask || selectedArtifact) && (
            <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5 }}>
              {selectedTask && <div>Task: {selectedTask.title}</div>}
              {selectedArtifact && <div>Artifact: {selectedArtifact.displayName || selectedArtifact.filePath}</div>}
            </div>
          )}
          {formIssue && <div style={{ color: "var(--text-3)", fontSize: 12 }}>{formIssue}</div>}
          <Button variant="primary" size="sm" icon={<IconPlus size={13} />} onClick={createWorkOrder} disabled={saving || Boolean(formIssue)}>
            {saving ? "Creating..." : "Create work order"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
