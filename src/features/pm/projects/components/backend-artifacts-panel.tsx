// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import {
  IconAlertTriangle,
  IconCheck,
  IconExternalLink,
  IconFileText,
  IconPlus,
} from "@/shared/components/icons";
import {
  SectionTitle,
  ProjectTaskStatusDot,
  BackendTaskStatusBadge,
} from "./pm-project-ui";
import { compactBackendError, formatBackendDate } from "../utils/pm-project-detail.utils";
import {
  createDevFlowProjectTask,
  createDevFlowWorkOrder,
  getDevFlowProjectArtifact,
  handleDevFlowArtifactRevision,
  publishDevFlowArtifactOutput,
  reviewDevFlowArtifactOutput,
  updateDevFlowArtifactSharing,
  updateDevFlowWorkOrder,
} from "@/shared/api/devflow-api";

function workOrderAgentTypeFromArtifact(agentType: string): string {
  const normalized = String(agentType || "").toUpperCase();
  return ["FRONTEND", "BACKEND", "DATABASE", "ARCHITECTURE", "CONTRACT"].includes(normalized)
    ? normalized
    : "FRONTEND";
}

function BackendReviewBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    APPROVED: { tone: "green", label: "Approved" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision requested" },
    PENDING: { tone: "gray", label: "Pending review" },
  };
  const next = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

function ArtifactValidationBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    PASSED: { tone: "green", label: "Validated" },
    FAILED: { tone: "red", label: "Invalid" },
    PENDING: { tone: "gray", label: "Unvalidated" },
  };
  const next = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

function ArtifactValidationPanel({ artifact }: { artifact: any }) {
  const errors = Array.isArray(artifact.validationErrors) ? artifact.validationErrors.filter(Boolean) : [];
  if (!artifact.validationSummary && errors.length === 0 && !artifact.validationStatus) return null;
  const failed = artifact.validationStatus === "FAILED";
  return (
    <div style={{ padding: 12, border: `1px solid ${failed ? "rgba(239,68,68,.28)" : "rgba(16,185,129,.24)"}`, background: failed ? "rgba(239,68,68,.07)" : "rgba(16,185,129,.07)", borderRadius: 10 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Artifact contract</div>
        <ArtifactValidationBadge status={artifact.validationStatus} />
      </div>
      {artifact.validationSummary && <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 6 }}>{artifact.validationSummary}</div>}
      {errors.length > 0 && (
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: failed ? "#FCA5A5" : "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>
          {errors.map((error: any, index: number) => <li key={`${String(error)}-${index}`}>{String(error)}</li>)}
        </ul>
      )}
    </div>
  );
}

function OutputReviewBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    APPROVED: { tone: "green", label: "PM approved" },
    REWORK_REQUESTED: { tone: "amber", label: "Rework requested" },
    PUBLISHED: { tone: "blue", label: "Published" },
    PENDING: { tone: "gray", label: "PM review pending" },
  };
  const next = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

export function BackendArtifactsPanel({ projectId, artifacts, tasks, members, loading, error, emptyText, onChanged }: Record<string, any>) {
  const devMembers = members.filter((m: any) => m.role === "DEV");
  const [preview, setPreview] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [revisionHandling, setRevisionHandling] = useState(false);
  const [revisionResolutionNote, setRevisionResolutionNote] = useState("");
  const [revisionTaskAssigneeId, setRevisionTaskAssigneeId] = useState("");
  const [revisionTaskCreating, setRevisionTaskCreating] = useState(false);
  const [outputReviewing, setOutputReviewing] = useState(false);
  const [outputReviewNote, setOutputReviewNote] = useState("");
  const [outputReviewAssigneeId, setOutputReviewAssigneeId] = useState("");

  const unresolvedRevisions = artifacts.filter((a: any) => a.reviewStatus === "REVISION_REQUESTED" && !a.revisionHandledAt);
  const linkedTasks = preview ? tasks.filter((t: any) => t.artifactId === preview.id) : [];

  const openPreview = async (artifactId: string) => {
    setPreviewOpen(true); setPreview(null); setPreviewError(""); setRevisionResolutionNote(""); setRevisionTaskAssigneeId(""); setPreviewLoading(true);
    try {
      const artifact = await getDevFlowProjectArtifact(projectId, artifactId);
      setPreview(artifact); setDisplayName(artifact.displayName || artifact.filePath);
      setRevisionResolutionNote(artifact.revisionResolutionNote || ""); setOutputReviewNote(artifact.outputReviewNote || ""); setOutputReviewAssigneeId("");
    } catch (e) { setPreviewError(e instanceof Error ? e.message : String(e)); }
    finally { setPreviewLoading(false); }
  };

  const createRevisionTask = async () => {
    if (!preview || !revisionTaskAssigneeId) return;
    setRevisionTaskCreating(true); setPreviewError("");
    try {
      const label = preview.displayName || preview.filePath;
      const notes = [preview.reviewNote ? `Client revision request:\n${preview.reviewNote}` : "Client requested a revision for this artifact.", preview.revisionResolutionNote || revisionResolutionNote.trim() ? `PM resolution note:\n${preview.revisionResolutionNote || revisionResolutionNote.trim()}` : ""].filter(Boolean).join("\n\n");
      const task = await createDevFlowProjectTask(projectId, { title: `Revision: ${label}`, description: notes, assignedToId: revisionTaskAssigneeId, artifactId: preview.id });
      const wo = await createDevFlowWorkOrder(projectId, { title: `Revision handoff: ${label}`, instructions: notes, agentType: workOrderAgentTypeFromArtifact(preview.agentType), priority: "HIGH", taskId: task.id, artifactId: preview.id });
      await updateDevFlowWorkOrder(projectId, wo.id, { status: "READY" }); await onChanged?.();
    } catch (e) { setPreviewError(e instanceof Error ? e.message : String(e)); }
    finally { setRevisionTaskCreating(false); }
  };

  const handleRevision = async () => {
    if (!preview) return; setRevisionHandling(true); setPreviewError("");
    try { const updated = await handleDevFlowArtifactRevision(projectId, preview.id, { resolutionNote: revisionResolutionNote.trim() || undefined }); setPreview(updated); setRevisionResolutionNote(updated.revisionResolutionNote || ""); await onChanged?.(); }
    catch (e) { setPreviewError(e instanceof Error ? e.message : String(e)); }
    finally { setRevisionHandling(false); }
  };

  const updateSharing = async (clientVisible: boolean) => {
    if (!preview) return; setSharing(true); setPreviewError("");
    try { const updated = await updateDevFlowArtifactSharing(projectId, preview.id, { clientVisible, displayName: clientVisible ? displayName.trim() || preview.filePath : undefined }); setPreview(updated); setDisplayName(updated.displayName || updated.filePath); await onChanged?.(); }
    catch (e) { setPreviewError(e instanceof Error ? e.message : String(e)); }
    finally { setSharing(false); }
  };

  const approveOutput = async () => {
    if (!preview) return; setOutputReviewing(true); setPreviewError("");
    try { const updated = await reviewDevFlowArtifactOutput(projectId, preview.id, { status: "APPROVED", note: outputReviewNote.trim() || undefined }); setPreview(updated); setOutputReviewNote(updated.outputReviewNote || ""); await onChanged?.(); }
    catch (e) { setPreviewError(e instanceof Error ? e.message : String(e)); }
    finally { setOutputReviewing(false); }
  };

  const requestOutputRework = async () => {
    if (!preview) return; setOutputReviewing(true); setPreviewError("");
    try { const updated = await reviewDevFlowArtifactOutput(projectId, preview.id, { status: "REWORK_REQUESTED", note: outputReviewNote.trim() || undefined, assignedToId: outputReviewAssigneeId || undefined }); setPreview(updated); setOutputReviewNote(updated.outputReviewNote || ""); await onChanged?.(); }
    catch (e) { setPreviewError(e instanceof Error ? e.message : String(e)); }
    finally { setOutputReviewing(false); }
  };

  const publishOutput = async () => {
    if (!preview) return; setOutputReviewing(true); setPreviewError("");
    try { const updated = await publishDevFlowArtifactOutput(projectId, preview.id, { displayName: displayName.trim() || preview.displayName || preview.filePath }); setPreview(updated); setDisplayName(updated.displayName || updated.filePath); await onChanged?.(); }
    catch (e) { setPreviewError(e instanceof Error ? e.message : String(e)); }
    finally { setOutputReviewing(false); }
  };

  if (loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading artifacts...</Card>;
  if (error) return <Card style={{ padding: 22, color: "#FCA5A5", border: "1px solid rgba(239,68,68,.30)" }}>{compactBackendError(error)}</Card>;
  if (!artifacts.length) return <Card style={{ padding: 22, color: "var(--text-3)" }}>{emptyText}</Card>;

  return (
    <>
      {unresolvedRevisions.length > 0 && (
        <Card style={{ padding: 0, overflow: "hidden", border: "1px solid rgba(245,158,11,.34)", marginBottom: 14 }}>
          <div style={{ padding: 16, borderBottom: "1px solid rgba(245,158,11,.22)", background: "rgba(245,158,11,.08)" }}>
            <SectionTitle title="Needs PM action" subtitle={`${unresolvedRevisions.length} client revision request${unresolvedRevisions.length === 1 ? "" : "s"} waiting for acknowledgement`} />
          </div>
          {unresolvedRevisions.map((artifact: any) => (
            <button key={artifact.id} onClick={() => openPreview(artifact.id)} className="row gap-3" style={{ width: "100%", padding: "12px 16px", border: 0, borderBottom: "1px solid var(--border)", background: "transparent", color: "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(245,158,11,.16)", color: "#FCD34D", display: "grid", placeItems: "center", flexShrink: 0 }}><IconAlertTriangle size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{artifact.displayName || artifact.filePath}</div>
                <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{artifact.reviewedAt ? `Requested ${formatBackendDate(artifact.reviewedAt)}` : "Revision requested"}</div>
              </div>
              {tasks.some((t: any) => t.artifactId === artifact.id) && <Badge tone="blue">Task linked</Badge>}
              <Badge tone="amber">Open request</Badge>
            </button>
          ))}
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle title="Generated artifacts" subtitle={`${artifacts.length} backend artifact records`} />
        </div>
        {artifacts.map((artifact: any) => (
          <button key={artifact.id} onClick={() => openPreview(artifact.id)} style={{ width: "100%", padding: "12px 16px", border: 0, borderBottom: "1px solid var(--border)", background: "transparent", color: "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            <div className="row gap-3" style={{ alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(79,139,255,.14)", color: "#93C5FD", display: "grid", placeItems: "center", flexShrink: 0 }}><IconFileText size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis" }}>{artifact.filePath}</div>
                <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{artifact.agentType} - {formatBackendDate(artifact.createdAt)}</div>
              </div>
              <div className="row gap-2" style={{ flexShrink: 0 }}>
                <BackendReviewBadge status={artifact.reviewStatus} />
                <OutputReviewBadge status={artifact.outputReviewStatus} />
                <ArtifactValidationBadge status={artifact.validationStatus} />
                {tasks.some((t: any) => t.artifactId === artifact.id) && <Badge tone="blue">Task linked</Badge>}
                <Badge tone={artifact.clientVisible ? "green" : "blue"}>{artifact.clientVisible ? "Client-visible" : "Internal"}</Badge>
              </div>
            </div>
          </button>
        ))}
      </Card>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Artifact preview" width={900}
        footer={<><Button variant="secondary" size="sm" disabled>Download disabled</Button>{artifact?.clientVisible ? <Button variant="secondary" size="sm" onClick={() => updateSharing(false)} disabled={sharing}>Unshare</Button> : <Button variant="primary" size="sm" onClick={() => updateSharing(true)} disabled={sharing || !preview}>Share with client</Button>}<Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>Close</Button></>}>
        {previewLoading ? (
          <div style={{ color: "var(--text-2)", padding: 12 }}>Loading artifact...</div>
        ) : previewError ? (
          <div style={{ color: "#FCA5A5", padding: 12 }}>{compactBackendError(previewError)}</div>
        ) : preview ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div><div className="mono" style={{ fontWeight: 700 }}>{preview.filePath}</div><div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 3 }}>{preview.agentType} - {formatBackendDate(preview.createdAt)}</div></div>
              <Badge tone={preview.clientVisible ? "green" : "gray"}>{preview.clientVisible ? "Client-visible" : "Internal only"}</Badge>
            </div>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              <BackendReviewBadge status={preview.reviewStatus} /><OutputReviewBadge status={preview.outputReviewStatus} /><ArtifactValidationBadge status={preview.validationStatus} />
              {preview.reviewedAt && <span style={{ color: "var(--text-3)", fontSize: 12 }}>Reviewed {formatBackendDate(preview.reviewedAt)}</span>}
              {preview.publishedAt && <span style={{ color: "var(--text-3)", fontSize: 12 }}>Published {formatBackendDate(preview.publishedAt)}</span>}
            </div>
            {preview.content && (
              <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,.04)", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "mono" }}>{preview.filePath?.split("/").pop()}</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{(preview.content.length / 1024).toFixed(1)} KB</span>
                </div>
                <pre style={{ margin: 0, padding: 14, fontSize: 13, lineHeight: 1.5, overflow: "auto", maxHeight: 480, background: "rgba(0,0,0,.25)", color: "#E2E8F0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", whiteSpace: "pre", tabSize: 2 }}>{preview.content}</pre>
              </div>
            )}
            <ArtifactValidationPanel artifact={preview} />
            <div style={{ display: "grid", gap: 10, padding: 12, border: "1px solid rgba(79,139,255,.22)", background: "rgba(79,139,255,.06)", borderRadius: 10 }}>
              <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div><div style={{ fontSize: 13, fontWeight: 700 }}>PM output handoff</div><div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>Approve internally, request rework, or publish to client review.</div></div>
                <OutputReviewBadge status={preview.outputReviewStatus} />
              </div>
              {preview.outputReviewNote && <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>{preview.outputReviewNote}</div>}
              {preview.outputReviewStatus === "REWORK_REQUESTED" && (
                <div style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>This artifact is blocked from publishing until the rework handoff produces a revised output.</div>
              )}
              <Field label="Output review note"><Textarea rows={3} value={outputReviewNote} onChange={(e) => setOutputReviewNote(e.target.value)} placeholder="PM review notes, publish context, or rework instructions." /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
                <Field label="Rework assignee">
                  <Select value={outputReviewAssigneeId} onChange={(e) => setOutputReviewAssigneeId(e.target.value)}>
                    <option value="">Use linked developer</option>
                    {devMembers.map((m: any) => <option key={m.userId} value={m.userId}>{m.user.fullName || m.user.email || m.userId}</option>)}
                  </Select>
                </Field>
                <Button variant="secondary" size="sm" icon={<IconAlertTriangle size={13} />} onClick={requestOutputRework} disabled={outputReviewing || preview.outputReviewStatus === "PUBLISHED"}>Rework</Button>
              </div>
              <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                <Button variant="secondary" size="sm" icon={<IconCheck size={13} />} onClick={approveOutput} disabled={outputReviewing || preview.outputReviewStatus === "PUBLISHED"}>Approve output</Button>
                <Button variant="primary" size="sm" icon={<IconExternalLink size={13} />} onClick={publishOutput} disabled={outputReviewing || ["PUBLISHED", "REWORK_REQUESTED"].includes(preview.outputReviewStatus)}>Publish to client</Button>
              </div>
            </div>
            {preview.reviewNote && <div style={{ padding: 12, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 10, color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>{preview.reviewNote}</div>}
            {preview.reviewStatus === "REVISION_REQUESTED" && (
              <div style={{ display: "grid", gap: 10, padding: 12, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.06)", borderRadius: 10 }}>
                <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div><div style={{ fontSize: 13, fontWeight: 700 }}>Revision handling</div><div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>{preview.revisionHandledAt ? `Handled ${formatBackendDate(preview.revisionHandledAt)}` : "Awaiting PM acknowledgement"}</div></div>
                  {preview.revisionHandledAt ? <Badge tone="green">Handled</Badge> : <Badge tone="amber">Needs action</Badge>}
                </div>
                {preview.revisionHandledAt ? (
                  preview.revisionResolutionNote && <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>{preview.revisionResolutionNote}</div>
                ) : (
                  <><Field label="PM resolution note"><Textarea rows={3} value={revisionResolutionNote} onChange={(e) => setRevisionResolutionNote(e.target.value)} placeholder="Summarize what needs to happen next." /></Field>
                  <Button variant="primary" size="sm" icon={<IconCheck size={13} />} onClick={handleRevision} disabled={revisionHandling || !preview}>{revisionHandling ? "Marking..." : "Mark revision handled"}</Button></>
                )}
                <div style={{ borderTop: "1px solid rgba(245,158,11,.20)", paddingTop: 10, display: "grid", gap: 10 }}>
                  <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 700 }}>Linked work</div><div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>{linkedTasks.length ? `${linkedTasks.length} task${linkedTasks.length === 1 ? "" : "s"} linked to this revision` : "Create a developer task from this revision request"}</div></div>
                    {linkedTasks.length > 0 && <Badge tone="blue">Task linked</Badge>}
                  </div>
                  {linkedTasks.map((task: any) => (
                    <div key={task.id} className="row gap-2" style={{ padding: "8px 0", borderBottom: "1px solid rgba(245,158,11,.14)" }}>
                      <ProjectTaskStatusDot status={task.status} />
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 700 }}>{task.title}</div><div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{task.assignedTo?.fullName || task.assignedTo?.email || "Unassigned"}</div></div>
                      <BackendTaskStatusBadge status={task.status} />
                    </div>
                  ))}
                  <Field label="Task assignee">
                    <Select value={revisionTaskAssigneeId} onChange={(e) => setRevisionTaskAssigneeId(e.target.value)}>
                      <option value="">Choose developer</option>
                      {devMembers.map((m: any) => <option key={m.userId} value={m.userId}>{m.user.fullName || m.user.email || m.user.id}</option>)}
                    </Select>
                  </Field>
                  <div style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(148,163,184,.22)", background: "rgba(8,14,32,.42)", color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>
                    <div style={{ color: "white", fontWeight: 700, marginBottom: 4 }}>Revision: {preview.displayName || preview.filePath}</div>
                    {preview.reviewNote || "Client requested a revision for this artifact."}
                  </div>
                  <Button variant="primary" size="sm" icon={<IconPlus size={13} />} onClick={createRevisionTask} disabled={revisionTaskCreating || !revisionTaskAssigneeId}>{revisionTaskCreating ? "Creating..." : "Create task + work order"}</Button>
                </div>
              </div>
            )}
            <Field label="Client display name" helper="Used only when this artifact is shared with the client."><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={preview.filePath} /></Field>
            <pre style={{ margin: 0, maxHeight: 520, overflow: "auto", padding: 16, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(8,14,32,.85)", color: "var(--text-2)", fontSize: 12, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{preview.content ?? ""}</pre>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
