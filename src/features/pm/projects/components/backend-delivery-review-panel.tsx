// @ts-nocheck
"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, Textarea } from "@/shared/components/ui";
import { IconCheck, IconRefresh } from "@/shared/components/icons";
import { SectionTitle, MiniStat, ReviewNote } from "./pm-project-ui";
import { compactBackendError, formatBackendDate } from "../utils/pm-project-detail.utils";
import { resolveDevFlowProjectDeliveryRevision } from "@/shared/api/devflow-api";

function deliveryReviewStatusView(status: string) {
  const map: Record<string, { tone: string; label: string }> = {
    ACCEPTED: { tone: "green", label: "Accepted" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision requested" },
    REVISION_RESOLVED: { tone: "blue", label: "Ready for acceptance" },
    PENDING: { tone: "gray", label: "Pending" },
  };
  return map[status || "PENDING"] || map.PENDING;
}

export function BackendDeliveryReviewPanel({ projectId, review, readiness, readinessLoading, readinessError, onRefreshReadiness, onChanged }: Record<string, any>) {
  const [note, setNote] = useState(review?.resolutionNote || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const status = deliveryReviewStatusView(review?.status);
  const readinessStatus = readiness?.ready
    ? { tone: "green", label: "Ready" }
    : { tone: "amber", label: readinessLoading ? "Checking" : "Blocked" };

  const resolveRevision = async () => {
    setSaving(true); setError("");
    try { await resolveDevFlowProjectDeliveryRevision(projectId, { resolutionNote: note.trim() || undefined }); await onChanged?.(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };

  return (
    <Card style={{ padding: 22 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <SectionTitle title="Delivery review" subtitle="Project-level acceptance and revision state" />
        <div className="row gap-2">
          <Badge tone={readinessStatus.tone}>{readinessStatus.label}</Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
          <Button variant="secondary" size="sm" icon={<IconRefresh size={13} />} onClick={onRefreshReadiness} disabled={readinessLoading}>{readinessLoading ? "Checking..." : "Refresh"}</Button>
        </div>
      </div>

      {readinessError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 12 }}>{compactBackendError(readinessError)}</div>}
      {readiness && (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10 }}>
            <MiniStat label="Published artifacts" value={String(readiness.counts.publishedArtifacts)} />
            <MiniStat label="Open work orders" value={String(readiness.counts.activeWorkOrders)} />
            <MiniStat label="Open documents" value={String(readiness.counts.openDocuments)} />
            <MiniStat label="Missing coverage" value={String(readiness.counts.missingAgentTypes)} />
          </div>
          {readiness.blockers.length > 0 ? (
            <div style={{ padding: 12, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 10 }}>
              <div style={{ color: "white", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Acceptance blockers</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.55 }}>
                {readiness.blockers.map((b: any) => <li key={b.code}>{b.message}</li>)}
              </ul>
            </div>
          ) : (
            <div style={{ padding: 12, border: "1px solid rgba(16,185,129,.24)", background: "rgba(16,185,129,.07)", borderRadius: 10, color: "var(--text-2)", fontSize: 12.5 }}>
              Final delivery is ready for client acceptance.
            </div>
          )}
        </div>
      )}

      {!review ? (
        <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 12 }}>No project-level delivery review has been submitted yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {review.acceptedAt && <MiniStat label="Accepted" value={formatBackendDate(review.acceptedAt)} />}
          {review.acceptanceNote && <ReviewNote tone="green" title="Client acceptance note" body={review.acceptanceNote} />}
          {review.revisionRequestedAt && <MiniStat label="Revision requested" value={formatBackendDate(review.revisionRequestedAt)} />}
          {review.revisionNote && <ReviewNote tone="amber" title="Client revision request" body={review.revisionNote} />}
          {review.resolutionNote && <ReviewNote tone="blue" title="PM resolution note" body={review.resolutionNote} />}
          {review.status === "REVISION_REQUESTED" && (
            <div style={{ display: "grid", gap: 10, paddingTop: 4 }}>
              <Field label="Resolution note"><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Summarize what the delivery team changed or will change." /></Field>
              {error && <div style={{ color: "#FCA5A5", fontSize: 12.5 }}>{compactBackendError(error)}</div>}
              <Button variant="primary" size="sm" icon={<IconCheck size={13} />} onClick={resolveRevision} disabled={saving}>{saving ? "Resolving..." : "Mark delivery revision resolved"}</Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
