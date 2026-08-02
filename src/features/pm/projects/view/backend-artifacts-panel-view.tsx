"use client";

import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import {
  IconAlertTriangle,
  IconCheck,
  IconExternalLink,
  IconFileText,
  IconPlus,
} from "@/shared/components/icons";
import {
  BackendTaskStatusBadge,
  ProjectTaskStatusDot,
  SectionTitle,
} from "../components/pm-project-ui";
import { compactBackendError } from "../utils/pm-project-detail.utils";
import type {
  ArtifactBadgeView,
  ArtifactRow,
  LinkedArtifactTaskRow,
  RevisionRequestRow,
  ValidationPanelModel,
} from "../model/artifacts-panel";
import type { BackendArtifactsPanelViewModel } from "../view-model/use-artifacts-panel-view-model";

export function BackendArtifactsPanelView({ vm }: { vm: BackendArtifactsPanelViewModel }) {
  if (vm.loading) {
    return <Card className="pm-tab-panel pm-tab-empty">Loading artifacts...</Card>;
  }

  if (vm.error) {
    return (
      <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">
        {compactBackendError(vm.error)}
      </Card>
    );
  }

  if (!vm.hasArtifacts) {
    return <Card className="pm-tab-panel pm-tab-empty">{vm.emptyText}</Card>;
  }

  return (
    <div className="pm-tab-layout">
      {vm.hasUnresolvedRevisions && (
        <Card className="pm-tab-panel" style={{ border: "1px solid rgba(245,158,11,.34)" }}>
          <div style={{ padding: 16, borderBottom: "1px solid rgba(245,158,11,.22)", background: "rgba(245,158,11,.08)" }}>
            <SectionTitle title="Needs your review" subtitle={vm.unresolvedSubtitle} />
          </div>
          <div className="pm-tab-list">{vm.unresolvedRevisions.map((row) => (
              <RevisionRequestButton key={row.id} row={row} vm={vm} />
            ))}</div>
        </Card>
      )}

      <Card className="pm-tab-panel">
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle title="Project artifacts" subtitle={vm.artifactSubtitle} />
        </div>
        <div className="pm-tab-list">{vm.artifactRows.map((row) => (
            <ArtifactRowButton key={row.id} row={row} vm={vm} />
          ))}</div>
      </Card>

      <ArtifactPreviewModal vm={vm} />
    </div>
  );
}

function ArtifactBadge({ badge }: { badge: ArtifactBadgeView }) {
  return <Badge tone={badge.tone}>{badge.label}</Badge>;
}

function RevisionRequestButton({
  row,
  vm,
}: {
  row: RevisionRequestRow;
  vm: BackendArtifactsPanelViewModel;
}) {
  return (
    <button
      onClick={() => vm.actions.openPreview(row.id)}
      className="pm-tab-list-row pm-artifact-row"
      style={{ width: "100%", borderRight: 0, borderBottom: 0, borderLeft: 0, background: "transparent", color: "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
    >
      <div className="row gap-3 pm-tab-list-row__content">
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(245,158,11,.16)", color: "#FCD34D", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <IconAlertTriangle size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{row.title}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{row.requestedLabel}</div>
        </div>
      </div>
      <div className="pm-artifact-row__badges">
        {row.hasLinkedTask && <Badge tone="blue">Task linked</Badge>}
        <Badge tone="amber">Open request</Badge>
      </div>
    </button>
  );
}

function ArtifactRowButton({
  row,
  vm,
}: {
  row: ArtifactRow;
  vm: BackendArtifactsPanelViewModel;
}) {
  return (
    <button
      onClick={() => vm.actions.openPreview(row.id)}
      className="pm-tab-list-row pm-artifact-row"
      style={{ width: "100%", borderRight: 0, borderBottom: 0, borderLeft: 0, background: "transparent", color: "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
    >
      <div className="row gap-3 pm-tab-list-row__content" style={{ alignItems: "flex-start" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(79,139,255,.14)", color: "#93C5FD", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <IconFileText size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis" }}>{row.title}</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>{row.subtitle}</div>
        </div>
      </div>
      <div className="pm-artifact-row__badges">
        <ArtifactBadge badge={row.review} />
        <ArtifactBadge badge={row.outputReview} />
        <ArtifactBadge badge={row.validation} />
        {row.hasLinkedTask && <Badge tone="blue">Task linked</Badge>}
        <Badge tone={row.visibilityTone}>{row.visibilityLabel}</Badge>
      </div>
    </button>
  );
}

function ArtifactPreviewModal({ vm }: { vm: BackendArtifactsPanelViewModel }) {
  const preview = vm.preview;
  const previewModel = vm.previewModel;

  return (
    <Modal
      open={vm.previewOpen}
      onClose={vm.actions.closePreview}
      title="Artifact preview"
      width={900}
      footer={(
        <>
          <Button variant="secondary" size="sm" disabled>Download disabled</Button>
          {preview?.clientVisible ? (
            <Button variant="secondary" size="sm" onClick={() => vm.actions.updateSharing(false)} disabled={vm.sharing}>Unshare</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => vm.actions.updateSharing(true)} disabled={vm.sharing || !preview}>Share with client</Button>
          )}
          <Button variant="ghost" size="sm" onClick={vm.actions.closePreview}>Close</Button>
        </>
      )}
    >
      {vm.previewLoading ? (
        <div style={{ color: "var(--text-2)", padding: 12 }}>Loading artifact...</div>
      ) : vm.previewError ? (
        <div style={{ color: "#FCA5A5", padding: 12 }}>{compactBackendError(vm.previewError)}</div>
      ) : preview && previewModel ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="mono" style={{ fontWeight: 700 }}>{previewModel.title}</div>
              <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 3 }}>{previewModel.subtitle}</div>
            </div>
            <Badge tone={previewModel.visibilityTone}>{previewModel.visibilityLabel}</Badge>
          </div>

          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            <ArtifactBadge badge={previewModel.review} />
            <ArtifactBadge badge={previewModel.outputReview} />
            <ArtifactBadge badge={previewModel.validation} />
            {previewModel.reviewedAtLabel && <span style={{ color: "var(--text-3)", fontSize: 12 }}>{previewModel.reviewedAtLabel}</span>}
            {previewModel.publishedAtLabel && <span style={{ color: "var(--text-3)", fontSize: 12 }}>{previewModel.publishedAtLabel}</span>}
          </div>

          {preview.content && <ArtifactContentPreview preview={preview} fileName={previewModel.fileName} contentKbLabel={previewModel.contentKbLabel} />}
          <ArtifactValidationPanelView model={previewModel.validationPanel} />
          <OutputHandoffPanel vm={vm} />
          {preview.reviewNote && <div style={{ padding: 12, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 10, color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>{preview.reviewNote}</div>}
          {previewModel.revisionOpen && <RevisionHandlingPanel vm={vm} />}
          <Field label="Client display name" helper="Used only when this artifact is shared with the client.">
            <Input value={vm.displayName} onChange={vm.actions.onDisplayNameChange} placeholder={preview.filePath} />
          </Field>
          <pre style={{ margin: 0, maxHeight: 520, overflow: "auto", padding: 16, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(8,14,32,.85)", color: "var(--text-2)", fontSize: 12, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{preview.content ?? ""}</pre>
        </div>
      ) : null}
    </Modal>
  );
}

function ArtifactContentPreview({
  preview,
  fileName,
  contentKbLabel,
}: {
  preview: { filePath: string; content?: string };
  fileName: string;
  contentKbLabel: string;
}) {
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,.04)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "mono" }}>{fileName}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{contentKbLabel}</span>
      </div>
      <pre style={{ margin: 0, padding: 14, fontSize: 13, lineHeight: 1.5, overflow: "auto", maxHeight: 480, background: "rgba(0,0,0,.25)", color: "#E2E8F0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", whiteSpace: "pre", tabSize: 2 }}>{preview.content}</pre>
    </div>
  );
}

function ArtifactValidationPanelView({ model }: { model: ValidationPanelModel }) {
  if (!model.visible) return null;
  return (
    <div style={{ padding: 12, border: `1px solid ${model.failed ? "rgba(239,68,68,.28)" : "rgba(16,185,129,.24)"}`, background: model.failed ? "rgba(239,68,68,.07)" : "rgba(16,185,129,.07)", borderRadius: 10 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Artifact contract</div>
        <ArtifactBadge badge={model.badge} />
      </div>
      {model.summary && <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 6 }}>{model.summary}</div>}
      {model.errors.length > 0 && (
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: model.failed ? "#FCA5A5" : "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>
          {model.errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}
        </ul>
      )}
    </div>
  );
}

function OutputHandoffPanel({ vm }: { vm: BackendArtifactsPanelViewModel }) {
  const preview = vm.preview;
  const previewModel = vm.previewModel;
  if (!preview || !previewModel) return null;

  return (
    <div style={{ display: "grid", gap: 10, padding: 12, border: "1px solid rgba(79,139,255,.22)", background: "rgba(79,139,255,.06)", borderRadius: 10 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>PM output handoff</div>
          <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>Approve internally, request rework, or publish to client review.</div>
        </div>
        <ArtifactBadge badge={previewModel.outputReview} />
      </div>
      {preview.outputReviewNote && <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>{preview.outputReviewNote}</div>}
      {previewModel.outputReviewBlocked && (
        <div style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>
          This artifact is blocked from publishing until the rework handoff produces a revised output.
        </div>
      )}
      <Field label="Output review note">
        <Textarea rows={3} value={vm.outputReviewNote} onChange={vm.actions.onOutputReviewNoteChange} placeholder="PM review notes, publish context, or rework instructions." />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
        <Field label="Rework assignee">
          <Select value={vm.outputReviewAssigneeId} onChange={vm.actions.onOutputReviewAssigneeChange}>
            <option value="">Use linked developer</option>
            {vm.developerOptions.map((developer) => (
              <option key={developer.userId} value={developer.userId}>{developer.label}</option>
            ))}
          </Select>
        </Field>
        <Button variant="secondary" size="sm" icon={<IconAlertTriangle size={13} />} onClick={vm.actions.requestOutputRework} disabled={vm.outputReviewing || preview.outputReviewStatus === "PUBLISHED"}>Rework</Button>
      </div>
      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
        <Button variant="secondary" size="sm" icon={<IconCheck size={13} />} onClick={vm.actions.approveOutput} disabled={vm.outputReviewing || preview.outputReviewStatus === "PUBLISHED"}>Approve output</Button>
        <Button variant="primary" size="sm" icon={<IconExternalLink size={13} />} onClick={vm.actions.publishOutput} disabled={vm.outputReviewing || ["PUBLISHED", "REWORK_REQUESTED"].includes(preview.outputReviewStatus || "PENDING")}>Publish to client</Button>
      </div>
    </div>
  );
}

function RevisionHandlingPanel({ vm }: { vm: BackendArtifactsPanelViewModel }) {
  const preview = vm.preview;
  const previewModel = vm.previewModel;
  if (!preview || !previewModel) return null;

  return (
    <div style={{ display: "grid", gap: 10, padding: 12, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.06)", borderRadius: 10 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Revision handling</div>
          <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>{previewModel.revisionStatusLabel}</div>
        </div>
        {previewModel.revisionHandled ? <Badge tone="green">Handled</Badge> : <Badge tone="amber">Needs action</Badge>}
      </div>

      {previewModel.revisionHandled ? (
        preview.revisionResolutionNote && <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>{preview.revisionResolutionNote}</div>
      ) : (
        <>
          <Field label="PM resolution note">
            <Textarea rows={3} value={vm.revisionResolutionNote} onChange={vm.actions.onRevisionResolutionNoteChange} placeholder="Summarize what needs to happen next." />
          </Field>
          <Button variant="primary" size="sm" icon={<IconCheck size={13} />} onClick={vm.actions.handleRevision} disabled={vm.revisionHandling || !preview}>
            {vm.revisionHandling ? "Marking..." : "Mark revision handled"}
          </Button>
        </>
      )}

      <div style={{ borderTop: "1px solid rgba(245,158,11,.20)", paddingTop: 10, display: "grid", gap: 10 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Linked work</div>
            <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>{previewModel.linkedTasksLabel}</div>
          </div>
          {previewModel.hasLinkedTasks && <Badge tone="blue">Task linked</Badge>}
        </div>
        {previewModel.linkedTasks.map((task) => (
          <LinkedArtifactTaskRowView key={task.id} row={task} />
        ))}
        <Field label="Task assignee">
          <Select value={vm.revisionTaskAssigneeId} onChange={vm.actions.onRevisionTaskAssigneeChange}>
            <option value="">Choose developer</option>
            {vm.developerOptions.map((developer) => (
              <option key={developer.userId} value={developer.userId}>{developer.label}</option>
            ))}
          </Select>
        </Field>
        <div style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(148,163,184,.22)", background: "rgba(8,14,32,.42)", color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>
          <div style={{ color: "white", fontWeight: 700, marginBottom: 4 }}>{previewModel.revisionTitle}</div>
          {previewModel.revisionBody}
        </div>
        <Button variant="primary" size="sm" icon={<IconPlus size={13} />} onClick={vm.actions.createRevisionTask} disabled={vm.revisionTaskCreating || !vm.revisionTaskAssigneeId}>
          {vm.revisionTaskCreating ? "Creating..." : "Create task + work order"}
        </Button>
      </div>
    </div>
  );
}

function LinkedArtifactTaskRowView({ row }: { row: LinkedArtifactTaskRow }) {
  return (
    <div className="row gap-2" style={{ padding: "8px 0", borderBottom: "1px solid rgba(245,158,11,.14)" }}>
      <ProjectTaskStatusDot status={row.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>{row.title}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>{row.assigneeLabel}</div>
      </div>
      <BackendTaskStatusBadge status={row.status} />
    </div>
  );
}
