"use client";

import { Badge, Button, Card, Field, Textarea } from "@/shared/components/ui";
import { IconCheck, IconRefresh } from "@/shared/components/icons";
import { SectionTitle, MiniStat, ReviewNote } from "../components/pm-project-ui";
import { compactBackendError } from "../utils/pm-project-detail.utils";
import type { DeliveryReviewPanelViewModel } from "../view-model/use-delivery-review-panel-view-model";

export function BackendDeliveryReviewPanelView({
  vm,
}: {
  vm: DeliveryReviewPanelViewModel;
}) {
  return (
    <Card style={{ padding: 22 }}>
      <div className="row" style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <SectionTitle title="Delivery review" subtitle="Project-level acceptance and revision state" />
        <div className="row gap-2">
          <Badge tone={vm.readinessStatus.tone}>{vm.readinessStatus.label}</Badge>
          <Badge tone={vm.reviewStatus.tone}>{vm.reviewStatus.label}</Badge>
          <Button
            variant="secondary"
            size="sm"
            icon={<IconRefresh size={13} />}
            onClick={vm.actions.refreshReadiness}
            disabled={vm.readinessLoading}
          >
            {vm.readinessLoading ? "Checking..." : "Refresh"}
          </Button>
        </div>
      </div>

      {vm.readinessError && (
        <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 12 }}>
          {compactBackendError(vm.readinessError)}
        </div>
      )}
      {vm.hasReadiness && vm.readiness && (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10 }}>
            {vm.readinessStats.map((stat) => (
              <MiniStat key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
          {vm.hasBlockers ? (
            <div style={{ padding: 12, border: "1px solid rgba(245,158,11,.28)", background: "rgba(245,158,11,.08)", borderRadius: 10 }}>
              <div style={{ color: "white", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Acceptance blockers</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.55 }}>
                {vm.readiness.blockers.map((blocker) => <li key={blocker.code}>{blocker.message}</li>)}
              </ul>
            </div>
          ) : (
            <div style={{ padding: 12, border: "1px solid rgba(16,185,129,.24)", background: "rgba(16,185,129,.07)", borderRadius: 10, color: "var(--text-2)", fontSize: 12.5 }}>
              Final delivery is ready for client acceptance.
            </div>
          )}
        </div>
      )}

      {vm.showEmptyReview || !vm.review ? (
        <div style={{ color: "var(--text-3)", fontSize: 13, marginTop: 12 }}>No project-level delivery review has been submitted yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {vm.acceptedAtLabel && <MiniStat label="Accepted" value={vm.acceptedAtLabel} />}
          {vm.review.acceptanceNote && <ReviewNote tone="green" title="Client acceptance note" body={vm.review.acceptanceNote} />}
          {vm.revisionRequestedAtLabel && <MiniStat label="Revision requested" value={vm.revisionRequestedAtLabel} />}
          {vm.review.revisionNote && <ReviewNote tone="amber" title="Client revision request" body={vm.review.revisionNote} />}
          {vm.review.resolutionNote && <ReviewNote tone="blue" title="PM resolution note" body={vm.review.resolutionNote} />}
          {vm.showResolveRevision && (
            <div style={{ display: "grid", gap: 10, paddingTop: 4 }}>
              <Field label="Resolution note">
                <Textarea
                  rows={3}
                  value={vm.note}
                  onChange={vm.actions.onNoteChange}
                  placeholder="Summarize what the delivery team changed or will change."
                />
              </Field>
              {vm.error && (
                <div style={{ color: "#FCA5A5", fontSize: 12.5 }}>
                  {compactBackendError(vm.error)}
                </div>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={<IconCheck size={13} />}
                onClick={vm.actions.resolveRevision}
                disabled={vm.saving}
              >
                {vm.saving ? "Resolving..." : "Mark delivery revision resolved"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
