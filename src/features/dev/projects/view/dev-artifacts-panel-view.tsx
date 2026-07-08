"use client";

import { Badge, Button, Card, Modal } from "@/shared/components/ui";
import { IconFileText } from "@/shared/components/icons";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";
import type {
  DevArtifactBadgeView,
  DevArtifactPreviewModel,
} from "../model/dev-artifacts-panel";
import type { DevArtifactsPanelViewModel } from "../view-model/use-dev-artifacts-panel-view-model";

export function DevArtifactsPanelView({ vm }: { vm: DevArtifactsPanelViewModel }) {
  if (vm.loading) return <Card style={{ padding: 22, color: "var(--text-2)" }}>Loading generated artifacts...</Card>;
  if (vm.error) return <Card style={{ padding: 22, color: "#FCA5A5" }}>{compactDevFlowError(vm.error)}</Card>;

  return (
    <>
      <Card style={{ padding: 22 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Generated artifacts</h3>
        <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Read-only files produced by orchestration</p>
        {vm.empty ? (
          <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 14 }}>No backend artifacts yet.</div>
        ) : vm.rows.map((row) => (
          <button key={row.id} onClick={() => vm.actions.openPreview(row.artifact)} className="row gap-3" style={{ width: "100%", padding: "10px 0", border: 0, borderBottom: "1px solid var(--border)", background: "transparent", color: "white", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
            <IconFileText size={14} style={{ color: "#93C5FD", flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="mono" style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{row.filePath}</div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{row.subtitle}</div>
            </div>
            <div className="row gap-2" style={{ flexShrink: 0 }}>
              <DevArtifactBadge badge={row.review} />
              <DevArtifactBadge badge={row.outputReview} />
              <DevArtifactBadge badge={row.validation} />
              {row.revisionHandled && <Badge tone="green">PM handled</Badge>}
            </div>
          </button>
        ))}
      </Card>

      <DevArtifactPreviewModal
        open={vm.previewOpen}
        onClose={vm.actions.closePreview}
        preview={vm.preview}
        loading={vm.previewLoading}
        error={vm.previewError}
      />
    </>
  );
}

function DevArtifactPreviewModal({
  open,
  onClose,
  preview,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  preview: DevArtifactPreviewModel | null;
  loading: boolean;
  error: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Read-only artifact" width={900} footer={<><Button variant="secondary" size="sm" disabled>Download disabled</Button><Button variant="primary" size="sm" onClick={onClose}>Close</Button></>}>
      {loading ? (
        <div style={{ color: "var(--text-2)", padding: 12 }}>Loading artifact...</div>
      ) : error ? (
        <div style={{ color: "#FCA5A5", padding: 12 }}>{compactDevFlowError(error)}</div>
      ) : preview ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="mono" style={{ fontWeight: 700 }}>{preview.title}</div>
              <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 3 }}>{preview.subtitle}</div>
            </div>
            <Badge tone="purple">Developer preview</Badge>
          </div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            <DevArtifactBadge badge={preview.review} />
            <DevArtifactBadge badge={preview.validation} />
            {preview.reviewedAtLabel && <span style={{ color: "var(--text-3)", fontSize: 12 }}>{preview.reviewedAtLabel}</span>}
          </div>
          {preview.validationSummary && (
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid rgba(16,185,129,.24)", background: "rgba(16,185,129,.07)", color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45 }}>
              {preview.validationSummary}
            </div>
          )}
          {preview.reviewNote && (
            <div style={{ padding: 12, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 10, color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>
              {preview.reviewNote}
            </div>
          )}
          {preview.revisionHandledLabel && (
            <div style={{ padding: 12, border: "1px solid rgba(34,197,94,.28)", background: "rgba(34,197,94,.08)", borderRadius: 10, color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, marginBottom: preview.revisionResolutionNote ? 6 : 0 }}>{preview.revisionHandledLabel}</div>
              {preview.revisionResolutionNote && <div>{preview.revisionResolutionNote}</div>}
            </div>
          )}
          <pre style={{ margin: 0, maxHeight: 520, overflow: "auto", padding: 16, borderRadius: 10, border: "1px solid var(--border)", background: "rgba(8,14,32,.85)", color: "var(--text-2)", fontSize: 12, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{preview.content}</pre>
        </div>
      ) : null}
    </Modal>
  );
}

function DevArtifactBadge({ badge }: { badge: DevArtifactBadgeView }) {
  return <Badge tone={badge.tone}>{badge.label}</Badge>;
}
