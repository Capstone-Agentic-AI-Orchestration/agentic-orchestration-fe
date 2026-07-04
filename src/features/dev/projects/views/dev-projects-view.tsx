// @ts-nocheck
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Modal, Select, Textarea, Field } from "@/shared/components/ui";
import {
  IconActivity,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCpu,
  IconDownload,
  IconExternalLink,
  IconFileText,
  IconFolder,
  IconGitBranch,
  IconMessageCircle,
  IconPaperclip,
  IconPlus,
} from "@/shared/components/icons";
import { DevPageHeader } from "@/features/dev/shared/components/dev-page-header";
import { DevFlowProjectTimeline } from "@/shared/components/project-timeline/devflow-project-timeline";
import { addDevFlowProjectTaskComment, getDevFlowProjectArtifact, getDevFlowProjectTaskActivity, updateDevFlowProjectTask } from "@/shared/api/devflow-api";
import { useDevFlowProject, useDevFlowProjectOutputs, useDevFlowProjects } from "@/shared/hooks/use-devflow-projects";
import { compactDevFlowError, devflowLifecycleView, devflowStatusView, formatDevFlowDate, lifecycleProgressColor, projectInitials } from "@/shared/utils/devflow-projects";

export function DevProjectsView() {
  const router = useRouter();
  const { projects: backendProjects, loading, error, refresh } = useDevFlowProjects();

  return (
    <div data-screen-label="Dev - My Projects">
      <DevPageHeader
        title="My projects"
        subtitle="Projects you're assigned to."
        actions={<Button variant="secondary" size="sm" icon={<IconActivity size={13} />} onClick={refresh}>Refresh</Button>}
      />

      <BackendAssignedProjects
        projects={backendProjects}
        loading={loading}
        error={error}
        onOpen={(id) => router.push(`/dev/project/${id}`)}
      />
    </div>
  );
}

function BackendAssignedProjects({ projects, loading, error, onOpen }) {
  if (loading) {
    return (
      <Card style={{ padding: 18, color: "var(--text-2)", marginBottom: 16 }}>
        Loading assigned backend projects...
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: 18, border: "1px solid rgba(239,68,68,.30)", marginBottom: 16 }}>
        <div style={{ fontWeight: 600, color: "#FCA5A5" }}>Backend projects unavailable</div>
        <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4 }}>{compactDevFlowError(error)}</div>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ fontWeight: 600 }}>No backend assignments yet.</div>
        <div style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 4 }}>Ask a PM to add this developer profile to a project member list.</div>
      </Card>
    );
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {projects.map((project) => (
          <BackendProjectCard key={project.id} project={project} onOpen={() => onOpen(project.id)} />
        ))}
      </div>
    </div>
  );
}

function BackendProjectCard({ project, onOpen }) {
  const lifecycle = devflowLifecycleView(project);
  const initials = projectInitials(project.companyName);

  return (
    <Card hover style={{ padding: 22, cursor: "pointer", border: "1px solid rgba(79,139,255,.28)" }} onClick={onOpen}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div className="row gap-3" style={{ alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#4F8BFF,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>Backend assignment</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-4)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{project.id}</div>
          </div>
        </div>
        <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{project.companyName}</div>
      <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
        <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(168,85,247,.15)", color: "#C4B5FD", fontSize: 11, fontWeight: 600, border: "1px solid rgba(168,85,247,.30)" }}>Assigned member</span>
        <span style={{ padding: "3px 9px", borderRadius: 999, background: "rgba(79,139,255,.14)", color: "#93C5FD", fontSize: 11, fontWeight: 600, border: "1px solid rgba(79,139,255,.28)" }}>{lifecycle.nextAction}</span>
        {lifecycle.signals?.openTasks > 0 && <span style={{ padding: "3px 9px", borderRadius: 999, background: "rgba(79,139,255,.14)", color: "#93C5FD", fontSize: 11, fontWeight: 600, border: "1px solid rgba(79,139,255,.28)" }}>{lifecycle.signals.openTasks} tasks</span>}
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "var(--text-2)" }}>Backend progress</span>
          <span className="mono" style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{lifecycle.progress}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(8,14,32,.7)" }}>
          <div style={{ width: `${lifecycle.progress}%`, height: "100%", borderRadius: 999, background: lifecycleProgressColor(lifecycle.tone) }} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>Created {formatDevFlowDate(project.createdAt)}</span>
        <span className="row gap-1" style={{ alignItems: "center", color: "#93C5FD", fontSize: 12, fontWeight: 500 }}>Open <IconArrowRight size={11} /></span>
      </div>
    </Card>
  );
}

export function DevProjectDetailView({ projectId }) {
  const router = useRouter();
  const { project: backendProject, loading: backendLoading, error: backendError } = useDevFlowProject(projectId);

  if (backendProject) {
    return <BackendDevProjectDetail project={backendProject} onBack={() => router.push("/dev/projects")} onOpenOrchestrator={() => router.push("/dev/orchestrator")} />;
  }

  if (backendLoading) {
    return (
      <div data-screen-label={`Dev - Project - ${projectId}`}>
        <button onClick={() => router.push("/dev/projects")} style={{ background: "none", border: 0, color: "var(--text-2)", fontSize: 12.5, cursor: "pointer", padding: "0 0 8px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <IconArrowLeft size={12} /> My projects
        </button>
        <Card style={{ padding: 24, color: "var(--text-2)" }}>Loading backend project...</Card>
      </div>
    );
  }

  return (
    <div data-screen-label={`Dev - Project - ${projectId}`}>
      <button onClick={() => router.push("/dev/projects")} style={{ background: "none", border: 0, color: "var(--text-2)", fontSize: 12.5, cursor: "pointer", padding: "0 0 8px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <IconArrowLeft size={12} /> My projects
      </button>
      <Card style={{ padding: 24 }}>
        <div style={{ fontWeight: 600 }}>Project not available.</div>
        <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>{compactDevFlowError(backendError) || "This backend project is not assigned to this developer account."}</div>
      </Card>
    </div>
  );
}

function BackendDevProjectDetail({ project, onBack, onOpenOrchestrator }) {
  const status = devflowStatusView(project.status);
  const lifecycle = devflowLifecycleView(project);
  const initials = projectInitials(project.companyName);
  const devMembers = project.members.filter((member) => member.role === "DEV");
  const outputs = useDevFlowProjectOutputs(project.id, { includeTasks: true, includeTimeline: true, includeWorkOrders: true });

  return (
    <div data-screen-label={`Dev - Backend Project - ${project.id}`}>
      <button onClick={onBack} style={{ background: "none", border: 0, color: "var(--text-2)", fontSize: 12.5, cursor: "pointer", padding: "0 0 8px", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <IconArrowLeft size={12} /> My projects
      </button>

      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 16, alignItems: "flex-start", marginBottom: 18 }}>
        <div className="row gap-4" style={{ alignItems: "center", minWidth: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: "linear-gradient(135deg,#4F8BFF,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontWeight: 700, fontSize: 17, flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--text-3)", fontSize: 12 }}>Backend project - <span className="mono">{project.id}</span></div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0, margin: "3px 0 6px" }}>{project.companyName}</h1>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
              <Badge tone={status.tone}>{status.label}</Badge>
              <span style={{ padding: "2px 10px", borderRadius: 999, background: "rgba(168,85,247,.15)", color: "#C4B5FD", fontSize: 11, fontWeight: 600, border: "1px solid rgba(168,85,247,.30)" }}>My role: Developer</span>
            </div>
          </div>
        </div>
        <div className="row gap-2">
          <Button variant="primary" size="sm" icon={<IconCpu size={13} />} onClick={onOpenOrchestrator}>Open orchestrator</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 18 }}>
        <BackendWorkspaceStat label="Stack" value={project.stackKey} />
        <BackendWorkspaceStat label="Next" value={lifecycle.nextAction} />
        <BackendWorkspaceStat label="Artifacts" value={String(project._count.artifacts)} />
        <BackendWorkspaceStat label="Events" value={String(project._count.eventLogs)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 18 }}>
        <Card style={{ padding: 22 }}>
          <Badge tone="blue">Assigned backend project</Badge>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "8px 0 0" }}>Project brief</h3>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.6, marginTop: 10 }}>{project.brief}</p>
          <div style={{ marginTop: 18 }}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "var(--text-2)", fontSize: 12 }}>Backend progress</span>
              <span className="mono" style={{ color: "white", fontSize: 12 }}>{lifecycle.progress}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(8,14,32,.7)" }}>
              <div style={{ width: `${lifecycle.progress}%`, height: "100%", borderRadius: 999, background: lifecycleProgressColor(lifecycle.tone) }} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: 18 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, margin: 0, marginBottom: 10 }}>Delivery facts</h4>
          <DevFact label="Created" value={formatDevFlowDate(project.createdAt)} />
          <DevFact label="Updated" value={formatDevFlowDate(project.updatedAt)} />
          <DevFact label="Run" value={project.runId || "Not started"} />
          <DevFact label="Repo" value={project.repoUrl || "Not linked"} />
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 18, marginTop: 18 }}>
        <Card style={{ padding: 22 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, marginBottom: 12 }}>Team members</h3>
          {project.members.length === 0 ? (
            <div style={{ color: "var(--text-3)", fontSize: 13 }}>No members assigned yet.</div>
          ) : project.members.map((member) => (
            <div key={member.id} className="row gap-3" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: member.role === "DEV" ? "linear-gradient(135deg,#A855F7,#EC4899)" : "linear-gradient(135deg,#4F8BFF,#8B5CF6)", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{projectInitials(member.user.fullName || member.user.email)}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{member.user.fullName || member.user.email || member.user.id}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{member.role}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding: 18, background: "linear-gradient(135deg, rgba(168,85,247,.08), rgba(79,139,255,.04))" }}>
          <h4 style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>Developer access</h4>
          <p style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>
            This page is visible because this account is assigned through project membership. Developers can inspect delivery state without PM-only edit controls.
          </p>
          <Badge tone="purple">{devMembers.length} developers assigned</Badge>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18, marginTop: 18 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <DevBackendWorkOrders workOrders={outputs.workOrders} loading={outputs.loading} error={outputs.error} />
          <DevBackendTasks projectId={project.id} tasks={outputs.tasks} loading={outputs.loading} error={outputs.error} onChanged={outputs.refresh} />
        </div>
        <DevFlowProjectTimeline timeline={outputs.timeline} loading={outputs.loading} error={outputs.error} emptyText="No project timeline events yet." compactError={compactDevFlowError} />
      </div>

      <div style={{ marginTop: 18 }}>
        <DevBackendArtifacts artifacts={outputs.artifacts} loading={outputs.loading} error={outputs.error} />
      </div>
    </div>
  );
}

function DevBackendTasks({ projectId, tasks, loading, error, onChanged }) {
  const [taskError, setTaskError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [comment, setComment] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  const updateStatus = async (task, status) => {
    setUpdatingTaskId(task.id);
    setTaskError("");
    try {
      await updateDevFlowProjectTask(projectId, task.id, { status });
      await onChanged?.();
    } catch (nextError) {
      setTaskError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setUpdatingTaskId("");
    }
  };

  const openActivity = async (task) => {
    setSelectedTask(task);
    setActivityOpen(true);
    setActivity([]);
    setActivityError("");
    setActivityLoading(true);
    try {
      setActivity(await getDevFlowProjectTaskActivity(projectId, task.id));
    } catch (nextError) {
      setActivityError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setActivityLoading(false);
    }
  };

  const addComment = async () => {
    if (!selectedTask || !comment.trim()) return;
    setCommentSaving(true);
    setActivityError("");
    try {
      await addDevFlowProjectTaskComment(projectId, selectedTask.id, { message: comment.trim() });
      setComment("");
      setActivity(await getDevFlowProjectTaskActivity(projectId, selectedTask.id));
    } catch (nextError) {
      setActivityError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setCommentSaving(false);
    }
  };

  if (loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading assigned tasks...</Card>;
  if (error) return <Card style={{ padding: 22, color: "#FCA5A5" }}>{compactDevFlowError(error)}</Card>;

  return (
    <Card style={{ padding: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>My assigned tasks</h3>
      <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Project tasks assigned to this developer</p>
      {taskError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactDevFlowError(taskError)}</div>}
      {tasks.length === 0 ? (
        <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No assigned backend tasks yet.</div>
      ) : tasks.map((task) => (
        <div key={task.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{task.title}</div>
              {task.description && <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{task.description}</div>}
              {task.artifact && <div className="mono" style={{ color: "#93C5FD", fontSize: 11, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis" }}>{task.artifact.displayName || task.artifact.filePath}</div>}
              {task.artifact?.reviewStatus === "REVISION_REQUESTED" && (
                <div style={{ marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.07)", color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>
                  <div className="row gap-2" style={{ marginBottom: task.artifact.reviewNote ? 5 : 0, flexWrap: "wrap" }}>
                    <Badge tone="amber">Revision task</Badge>
                    {task.artifact.reviewedAt && <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>Requested {formatDevFlowDate(task.artifact.reviewedAt)}</span>}
                  </div>
                  {task.artifact.reviewNote && <div>{task.artifact.reviewNote}</div>}
                </div>
              )}
            </div>
            <DevTaskStatusBadge status={task.status} />
          </div>
          <Select value={task.status} onChange={(event) => updateStatus(task, event.target.value)} disabled={updatingTaskId === task.id} style={{ marginTop: 10 }}>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="IN_REVIEW">In review</option>
            <option value="DONE">Done</option>
          </Select>
          <Button variant="secondary" size="sm" icon={<IconMessageCircle size={13} />} onClick={() => openActivity(task)} style={{ marginTop: 8 }}>Activity</Button>
        </div>
      ))}
      <DevTaskActivityModal
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        task={selectedTask}
        activity={activity}
        loading={activityLoading}
        error={activityError}
        comment={comment}
        onCommentChange={setComment}
        onAddComment={addComment}
        commentSaving={commentSaving}
      />
    </Card>
  );
}

function DevBackendWorkOrders({ workOrders, loading, error }) {
  if (loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading work orders...</Card>;
  if (error) return <Card style={{ padding: 22, color: "#FCA5A5" }}>{compactDevFlowError(error)}</Card>;

  return (
    <Card style={{ padding: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Work orders</h3>
      <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Read-only orchestration handoffs assigned through your tasks</p>
      {workOrders.length === 0 ? (
        <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No work orders assigned yet.</div>
      ) : workOrders.map((workOrder) => (
        <div key={workOrder.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 7 }}>
                <DevWorkOrderStatusBadge status={workOrder.status} />
                <DevWorkOrderPriorityBadge priority={workOrder.priority} />
                <Badge tone="purple">{workOrder.agentType}</Badge>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{workOrder.title}</div>
              {workOrder.instructions && <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.5, marginTop: 5, whiteSpace: "pre-wrap" }}>{workOrder.instructions}</div>}
              <div className="row gap-2" style={{ flexWrap: "wrap", marginTop: 8 }}>
                {workOrder.task && <Badge tone="blue">{workOrder.task.title}</Badge>}
                {workOrder.artifact && <Badge tone="gray">{workOrder.artifact.displayName || workOrder.artifact.filePath}</Badge>}
                {workOrder.executionRunId && <Badge tone="purple">Run {workOrder.executionAttempt || 1}</Badge>}
              </div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 7 }}>
                {workOrder.executionCompletedAt
                  ? `Completed ${formatDevFlowDate(workOrder.executionCompletedAt)}`
                  : workOrder.executionStartedAt
                    ? `Started ${formatDevFlowDate(workOrder.executionStartedAt)}`
                    : workOrder.dispatchedAt
                      ? `Dispatched ${formatDevFlowDate(workOrder.dispatchedAt)}`
                      : `Updated ${formatDevFlowDate(workOrder.updatedAt)}`}
              </div>
              {workOrder.executionError && <div style={{ color: "#FCA5A5", fontSize: 11.5, marginTop: 5 }}>{workOrder.executionError}</div>}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

function DevTaskActivityModal({ open, onClose, task, activity, loading, error, comment, onCommentChange, onAddComment, commentSaving }) {
  return (
    <Modal open={open} onClose={onClose} title="Task activity" width={760} footer={<><Button variant="primary" size="sm" onClick={onClose}>Close</Button></>}>
      {!task ? null : (
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{task.title}</div>
            {task.description && <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, marginTop: 5 }}>{task.description}</div>}
          </div>
          <div style={{ display: "grid", gap: 10, maxHeight: 360, overflow: "auto", paddingRight: 4 }}>
            {loading ? (
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>Loading activity...</div>
            ) : error ? (
              <div style={{ color: "#FCA5A5", fontSize: 13 }}>{compactDevFlowError(error)}</div>
            ) : activity.length === 0 ? (
              <div style={{ color: "var(--text-3)", fontSize: 13 }}>No activity yet.</div>
            ) : activity.map((item) => (
              <DevTaskActivityRow key={item.id} item={item} />
            ))}
          </div>
          <Field label="Add comment">
            <Textarea rows={3} value={comment} onChange={(event) => onCommentChange(event.target.value)} placeholder="Share a progress update, blocker, or question." />
          </Field>
          <Button variant="primary" size="sm" icon={<IconMessageCircle size={13} />} onClick={onAddComment} disabled={commentSaving || !comment.trim()}>
            {commentSaving ? "Posting..." : "Post comment"}
          </Button>
        </div>
      )}
    </Modal>
  );
}

function DevTaskActivityRow({ item }) {
  const isComment = item.type === "COMMENT";
  return (
    <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: isComment ? "rgba(79,139,255,.08)" : "rgba(8,14,32,.45)" }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{item.actor?.fullName || item.actor?.email || "System"}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{devTaskActivityLabel(item.type)}</div>
        </div>
        <span style={{ color: "var(--text-3)", fontSize: 11.5, whiteSpace: "nowrap" }}>{formatDevFlowDate(item.createdAt)}</span>
      </div>
      {item.message && <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, marginTop: 8, whiteSpace: "pre-wrap" }}>{item.message}</div>}
    </div>
  );
}

function devTaskActivityLabel(type) {
  const map = {
    TASK_CREATED: "created task",
    STATUS_CHANGED: "changed status",
    ASSIGNEE_CHANGED: "changed assignee",
    ARTIFACT_CHANGED: "changed artifact link",
    COMMENT: "commented",
  };
  return map[type] || type;
}

function DevTaskStatusBadge({ status }) {
  const map = {
    TODO: { tone: "gray", label: "To do" },
    IN_PROGRESS: { tone: "blue", label: "In progress" },
    IN_REVIEW: { tone: "amber", label: "In review" },
    DONE: { tone: "green", label: "Done" },
  };
  const item = map[status] || map.TODO;
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

function DevWorkOrderStatusBadge({ status }) {
  const map = {
    DRAFT: { tone: "gray", label: "Draft" },
    READY: { tone: "blue", label: "Ready" },
    DISPATCHED: { tone: "purple", label: "Dispatched" },
    COMPLETED: { tone: "green", label: "Completed" },
    FAILED: { tone: "red", label: "Failed" },
    CANCELLED: { tone: "gray", label: "Cancelled" },
  };
  const item = map[status] || map.DRAFT;
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

function DevWorkOrderPriorityBadge({ priority }) {
  const map = {
    LOW: { tone: "gray", label: "Low" },
    NORMAL: { tone: "blue", label: "Normal" },
    HIGH: { tone: "amber", label: "High" },
    URGENT: { tone: "red", label: "Urgent" },
  };
  const item = map[priority] || map.NORMAL;
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

function DevBackendArtifacts({ artifacts, loading, error }) {
  const [preview, setPreview] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const openPreview = async (artifact) => {
    setPreviewOpen(true);
    setPreview(null);
    setPreviewError("");
    setPreviewLoading(true);
    try {
      setPreview(await getDevFlowProjectArtifact(artifact.projectId, artifact.id));
    } catch (nextError) {
      setPreviewError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading generated artifacts...</Card>;
  if (error) return <Card style={{ padding: 22, color: "#FCA5A5" }}>{compactDevFlowError(error)}</Card>;

  return (
    <>
      <Card style={{ padding: 22 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Generated artifacts</h3>
        <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Read-only files produced by orchestration</p>
        {artifacts.length === 0 ? (
          <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No backend artifacts yet.</div>
        ) : artifacts.slice(0, 8).map((artifact) => (
          <button key={artifact.id} onClick={() => openPreview(artifact)} className="row gap-3" style={{ width: "100%", padding: "10px 0", border: 0, borderBottom: "1px solid var(--border)", background: "transparent", color: "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            <IconFileText size={14} style={{ color: "#93C5FD", flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{artifact.filePath}</div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{artifact.agentType} - {formatDevFlowDate(artifact.createdAt)}</div>
            </div>
            <div className="row gap-2" style={{ flexShrink: 0 }}>
              <DevReviewBadge status={artifact.reviewStatus} />
              <DevOutputReviewBadge status={artifact.outputReviewStatus} />
              <DevValidationBadge status={artifact.validationStatus} />
              {artifact.revisionHandledAt && <Badge tone="green">PM handled</Badge>}
            </div>
          </button>
        ))}
      </Card>

      <DevArtifactPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        artifact={preview}
        loading={previewLoading}
        error={previewError}
      />
    </>
  );
}

function DevArtifactPreviewModal({ open, onClose, artifact, loading, error }) {
  return (
    <Modal open={open} onClose={onClose} title="Read-only artifact" width={900} footer={<><Button variant="secondary" size="sm" disabled>Download disabled</Button><Button variant="primary" size="sm" onClick={onClose}>Close</Button></>}>
      {loading ? (
        <div style={{ color: "var(--text-2)", padding: 12 }}>Loading artifact...</div>
      ) : error ? (
        <div style={{ color: "#FCA5A5", padding: 12 }}>{compactDevFlowError(error)}</div>
      ) : artifact ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="mono" style={{ fontWeight: 700 }}>{artifact.filePath}</div>
              <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 3 }}>{artifact.agentType} - {formatDevFlowDate(artifact.createdAt)}</div>
            </div>
            <Badge tone="purple">Developer preview</Badge>
          </div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            <DevReviewBadge status={artifact.reviewStatus} />
            <DevValidationBadge status={artifact.validationStatus} />
            {artifact.reviewedAt && <span style={{ color: "var(--text-3)", fontSize: 12 }}>Reviewed {formatDevFlowDate(artifact.reviewedAt)}</span>}
          </div>
          {artifact.validationSummary && (
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(16,185,129,.24)", background: "rgba(16,185,129,.07)", color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>
              {artifact.validationSummary}
            </div>
          )}
          {artifact.reviewNote && (
            <div style={{ padding: 12, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 10, color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>
              {artifact.reviewNote}
            </div>
          )}
          {artifact.revisionHandledAt && (
            <div style={{ padding: 12, border: "1px solid rgba(34,197,94,.28)", background: "rgba(34,197,94,.08)", borderRadius: 10, color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, marginBottom: artifact.revisionResolutionNote ? 6 : 0 }}>PM handled {formatDevFlowDate(artifact.revisionHandledAt)}</div>
              {artifact.revisionResolutionNote && <div>{artifact.revisionResolutionNote}</div>}
            </div>
          )}
          <pre style={{ margin: 0, maxHeight: 520, overflow: "auto", padding: 16, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(8,14,32,.85)", color: "var(--text-2)", fontSize: 12, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{artifact.content ?? ""}</pre>
        </div>
      ) : null}
    </Modal>
  );
}

function DevReviewBadge({ status }) {
  const map = {
    APPROVED: { tone: "green", label: "Approved" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision requested" },
    PENDING: { tone: "gray", label: "Pending review" },
  };
  const next = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

function DevValidationBadge({ status }) {
  const map = {
    PASSED: { tone: "green", label: "Validated" },
    FAILED: { tone: "red", label: "Invalid" },
    PENDING: { tone: "gray", label: "Unvalidated" },
  };
  const next = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

function DevOutputReviewBadge({ status }) {
  const map = {
    APPROVED: { tone: "green", label: "PM approved" },
    REWORK_REQUESTED: { tone: "amber", label: "Rework" },
    PUBLISHED: { tone: "blue", label: "Published" },
    PENDING: { tone: "gray", label: "PM pending" },
  };
  const item = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

function DevBackendEvents({ events, loading, error }) {
  if (loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading pipeline activity...</Card>;
  if (error) return <Card style={{ padding: 22, color: "#FCA5A5" }}>{compactDevFlowError(error)}</Card>;

  return (
    <Card style={{ padding: 22 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Pipeline activity</h3>
      <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Recent backend event logs</p>
      {events.length === 0 ? (
        <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No event logs yet.</div>
      ) : events.slice(0, 6).map((event) => (
        <div key={event.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{event.nodeName}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{event.eventType} - {formatDevFlowDate(event.occurredAt)}</div>
        </div>
      ))}
    </Card>
  );
}

function BackendWorkspaceStat({ label, value }) {
  return (
    <Card style={{ padding: 12, background: "rgba(8,14,32,.45)" }}>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>Backend</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{label}: {value}</div>
    </Card>
  );
}

function DevFact({ label, value }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 10 }}>
      <span style={{ color: "var(--text-3)", fontSize: 12 }}>{label}</span>
      <span className="mono" style={{ color: "white", fontSize: 11.5, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </div>
  );
}

export function ArtifactTree({ node, depth = 0, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen || depth < 1);
  if (node.type === "folder") {
    return (
      <div>
        <button onClick={() => setOpen((value) => !value)} style={{ width: "100%", textAlign: "left", cursor: "pointer", padding: "6px 12px", paddingLeft: 12 + depth * 18, background: "none", border: 0, color: "white", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
          {open ? <IconChevronDown size={11} style={{ color: "var(--text-3)" }} /> : <IconChevronRight size={11} style={{ color: "var(--text-3)" }} />}
          <IconFolder size={13} style={{ color: node.locked ? "var(--text-4)" : "#FBBF24" }} />
          <span style={{ flex: 1, color: node.locked ? "var(--text-4)" : "white" }}>{node.name}/</span>
          {typeof node.count === "number" && <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{node.count} files</span>}
        </button>
        {open && node.children?.map((child, index) => <ArtifactTree key={`${child.name}-${index}`} node={child} depth={depth + 1} />)}
      </div>
    );
  }
  const extColor = { tsx: "#3B82F6", ts: "#3B82F6", py: "#10B981", sql: "#14B8A6", md: "#A78BFA", json: "#F59E0B", yml: "#EC4899", txt: "#94A3B8" }[node.ext] || "#94A3B8";
  return (
    <div style={{ padding: "5px 12px", paddingLeft: 12 + depth * 18, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-2)" }}>
      <span style={{ width: 11 }} />
      <span style={{ width: 13, height: 13, fontSize: 8, fontWeight: 700, color: extColor, border: `1px solid ${extColor}44`, borderRadius: 3, display: "inline-grid", placeItems: "center", letterSpacing: ".04em", flexShrink: 0 }}>{node.ext.toUpperCase().slice(0, 3)}</span>
      <span style={{ flex: 1 }}>{node.name}</span>
      <span className="mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{node.size}</span>
    </div>
  );
}
