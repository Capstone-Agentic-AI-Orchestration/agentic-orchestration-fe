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
    <div className="pm-tab-layout">
      <Card className="pm-tab-panel pm-tab-panel--padded">
        <div className="pm-tab-header">
          <SectionTitle title="Delivery readiness" subtitle="Confirm the project is complete before asking the client to accept it." />
          <div className="pm-tab-header-actions">
            <Badge tone={vm.readinessStatus.tone}>{vm.readinessStatus.label}</Badge>
            <Button
              variant="secondary"
              size="sm"
              icon={<IconRefresh size={13} />}
              onClick={vm.actions.refreshReadiness}
              disabled={vm.readinessLoading}
            >
              {vm.readinessLoading ? "Checking..." : "Refresh readiness"}
            </Button>
          </div>
        </div>

        {vm.readinessError && (
          <div className="pm-tab-message pm-tab-message--danger" style={{ marginTop: 14 }}>
            {compactBackendError(vm.readinessError)}
          </div>
        )}
        {vm.hasReadiness && vm.readiness && (
          <div className="pm-tab-section">
            <div className="pm-tab-stat-grid">
            {vm.readinessStats.map((stat) => (
              <MiniStat key={stat.label} label={stat.label} value={stat.value} />
            ))}
            </div>
            {vm.hasBlockers ? (
              <div className="pm-tab-message pm-tab-message--warning">
                <div style={{ color: "white", fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>Resolve before acceptance</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.55 }}>
                  {vm.readiness.blockers.map((blocker) => <li key={blocker.code}>{blocker.message}</li>)}
                </ul>
              </div>
            ) : (
              <div className="pm-tab-message pm-tab-message--success">Final delivery is ready for client acceptance.</div>
            )}
          </div>
        )}
      </Card>

      <Card className="pm-tab-panel pm-tab-panel--padded">
        <div className="pm-tab-header">
          <SectionTitle title="Client decision" subtitle="Acceptance notes and any requested revisions remain together here." />
          <Badge tone={vm.reviewStatus.tone}>{vm.reviewStatus.label}</Badge>
        </div>
        {vm.showEmptyReview || !vm.review ? (
          <div className="pm-tab-empty" style={{ paddingLeft: 0, paddingRight: 0 }}>No project-level delivery review has been submitted yet.</div>
        ) : (
          <div className="pm-tab-section">
            <div className="pm-tab-stat-grid">
              {vm.acceptedAtLabel && <MiniStat label="Accepted" value={vm.acceptedAtLabel} />}
              {vm.revisionRequestedAtLabel && <MiniStat label="Revision requested" value={vm.revisionRequestedAtLabel} />}
            </div>
            {vm.review.acceptanceNote && <ReviewNote tone="green" title="Client acceptance note" body={vm.review.acceptanceNote} />}
            {vm.review.revisionNote && <ReviewNote tone="amber" title="Client revision request" body={vm.review.revisionNote} />}
            {vm.review.resolutionNote && <ReviewNote tone="blue" title="PM resolution note" body={vm.review.resolutionNote} />}
            {vm.showResolveRevision && (
              <div className="pm-tab-section">
                <div className="pm-tab-section-heading">
                  <h4>Resolve the revision</h4>
                  <p>Record what changed before closing the client request.</p>
                </div>
                <Field label="Resolution note">
                  <Textarea
                    rows={3}
                    value={vm.note}
                    onChange={vm.actions.onNoteChange}
                    placeholder="Summarize what the delivery team changed or will change."
                  />
                </Field>
                {vm.error && <div className="pm-tab-message pm-tab-message--danger">{compactBackendError(vm.error)}</div>}
                <div className="pm-tab-actions">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<IconCheck size={13} />}
                    onClick={vm.actions.resolveRevision}
                    disabled={vm.saving}
                  >
                    {vm.saving ? "Resolving..." : "Mark revision resolved"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
