"use client";

import type { ReactNode } from "react";
import { Badge, Button, Card, Field, Modal, Row, Stack, Textarea } from "@/shared/components/ui";
import { ClientPageHeader } from "@/features/client/shared/components/client-page-header";
import {
  IconAlertTriangle,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconCircle,
  IconCode,
  IconDatabase,
  IconExternalLink,
  IconGitBranch,
  IconMessageCircle,
  IconMonitor,
  IconRefresh,
  IconShield,
  IconSmartphone,
} from "@/shared/components/icons";
import { BlockingIssuePanel, GuidedActionPanel } from "@/shared/components/journey";
import { makeProjectJourneyContext } from "@/shared/journey";
import { compactDevFlowError } from "@/shared/utils/devflow-projects";
import type {
  ClientProductArtifactReviewRow,
  ClientProductBadge,
  ClientProductBackendItemModel,
  ClientProductChecklistItem,
  ClientProductPreviewModel,
  ClientProductTab,
} from "../model/client-product";
import type { ClientProductViewModel } from "../view-model/use-client-product-view-model";

export function ClientProductContentView({ vm }: { vm: ClientProductViewModel }) {
  const productJourney = makeProjectJourneyContext({
    role: "client",
    project: vm.selectedProject,
    loading: vm.selectedProjectLoading,
    pendingActions: vm.pendingActions,
    blockers: vm.journeyBlockers,
    primaryAction: vm.selectedProject
      ? { label: vm.primaryActionLabel || "Review deliverables", onClick: vm.actions.refreshDeliveryReadiness }
      : undefined,
    secondaryAction: { label: "Refresh build", onClick: vm.actions.refresh, variant: "secondary", icon: <IconRefresh size={13} /> },
  });

  if (!vm.selectedProject || !vm.hero) {
    return (
      <div data-screen-label="Client - My Product">
        <ClientPageHeader title="My Product" subtitle="Preview your application, review the latest build, and approve final delivery." />
        <ClientProductBackendNotice loading={vm.notice.loading} error={vm.notice.error} hasProject={vm.notice.hasProject} />
        <GuidedActionPanel context={productJourney} />
      </div>
    );
  }

  return (
    <div data-screen-label="Client - My Product">
      <ClientPageHeader title="My Product" subtitle="Preview your application, review the latest build, and approve final delivery." />

      <ClientProductBackendNotice loading={vm.notice.loading} error={vm.notice.error} hasProject={vm.notice.hasProject} />

      <GuidedActionPanel context={productJourney} />
      <BlockingIssuePanel issues={productJourney.blockers} />

      <Card style={{ padding: 28, marginBottom: 24 }}>
        <Row align="flex-start" gap={6} wrap style={{ justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Badge tone={vm.hero.lifecycleTone}>{vm.hero.lifecycleLabel}</Badge>
            <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: "14px 0 10px" }}>{vm.hero.productName}</h2>
            <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>{vm.hero.brief}</p>
            <div style={{ marginTop: 24, maxWidth: 460 }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>Overall completion</span>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 600 }}>{vm.hero.progress}%</span>
              </Row>
              <div style={{ height: 4, borderRadius: 999, background: "var(--bg-sunken)", overflow: "hidden" }}>
                <div style={{ width: `${vm.hero.progress}%`, height: "100%", background: "var(--text)" }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>
                {vm.hero.nextActionLabel} - updated {vm.hero.updatedAtLabel}
              </div>
            </div>
          </div>
          <Row gap={2} wrap>
            <Button variant="secondary" icon={<IconExternalLink size={15} />} disabled>
              Preview unavailable
            </Button>
            <Button variant="primary" icon={<IconRefresh size={15} />} onClick={vm.actions.refresh}>
              Refresh build
            </Button>
          </Row>
        </Row>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 20 }}>
        <div style={{ minWidth: 0 }}>
          <div className="tabs" style={{ marginBottom: 20 }}>
            {[
              ["web", "Web Preview"],
              ["mobile", "Mobile Preview"],
              ["backend", "Backend & Architecture"],
            ].map(([key, label]) => (
              <button key={key} className={"tab" + (vm.tab === key ? " active" : "")} onClick={() => vm.actions.setTab(key as ClientProductTab)}>
                {label}
              </button>
            ))}
          </div>
          {vm.tab === "web" && <WebPreviewPane model={vm.webPreview} />}
          {vm.tab === "mobile" && <MobilePreviewPane model={vm.mobilePreview} />}
          {vm.tab === "backend" && vm.backendPreview && <BackendPreviewPane vm={vm} />}

          <Card style={{ padding: 26, marginTop: 20 }}>
            <Row style={{ justifyContent: "space-between", marginBottom: 8 }} gap={3} wrap>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Approval</div>
              <ProductBadge badge={vm.deliveryReviewBadge} />
            </Row>
            <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.55, marginBottom: 18, maxWidth: 580 }}>
              Once you&apos;re happy with the build, accept delivery to trigger final production deploy and start your support window.
            </p>
            {vm.deliveryReview?.revisionNote && <NoteBlock tone="attention">{vm.deliveryReview.revisionNote}</NoteBlock>}
            {vm.deliveryReview?.resolutionNote && <NoteBlock tone="success">{vm.deliveryReview.resolutionNote}</NoteBlock>}
            <Row style={{ justifyContent: "space-between", marginBottom: 14 }} gap={2} wrap>
              <ProductBadge badge={vm.deliveryReadinessBadge} />
              <Button
                variant="secondary"
                size="sm"
                icon={<IconRefresh size={14} />}
                onClick={vm.actions.refreshDeliveryReadiness}
                disabled={vm.deliveryReadinessLoading}
              >
                {vm.deliveryReadinessLoading ? "Checking..." : "Check readiness"}
              </Button>
            </Row>
            {vm.deliveryMetrics.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 1, marginBottom: 14, border: "1px solid var(--border-soft)", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--border-soft)" }}>
                {vm.deliveryMetrics.map((metric) => (
                  <DeliveryMetric key={metric.label} label={metric.label} value={metric.value} />
                ))}
              </div>
            )}
            {vm.deliveryBlockers.length > 0 && (
              <NoteBlock tone="attention">
                <strong style={{ color: "var(--text)" }}>Delivery acceptance is blocked.</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                  {vm.deliveryBlockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </NoteBlock>
            )}
            {vm.deliveryError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 12 }}>{compactDevFlowError(vm.deliveryError)}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
              <ApprovalButton
                icon={<IconCheckCircle size={18} />}
                title="Approve & accept delivery"
                sub={vm.acceptButtonSubtitle}
                onClick={vm.actions.openApprove}
                primary
                disabled={!vm.canAcceptDelivery}
              />
              <ApprovalButton
                icon={<IconMessageCircle size={18} />}
                title="Request revisions"
                sub="Send a project-level delivery request"
                onClick={vm.actions.openRevision}
              />
              <ApprovalButton icon={<IconCalendar size={18} />} title="Schedule walkthrough" sub="Scheduling is not connected yet" disabled />
            </div>
          </Card>
        </div>

        <Stack gap={4}>
          <Card style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Deliverable checklist</h4>
            <p style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 14 }}>What you&apos;ll receive on handover</p>
            <ClientDeliverableChecklist items={vm.checklist} />
          </Card>
          <Card style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Build info</h4>
            {vm.buildInfo.map((row) => (
              <KV key={row.label} label={row.label} value={row.value} />
            ))}
          </Card>
          <Card style={{ padding: 18 }}>
            <Row gap={2} align="flex-start">
              <IconAlertTriangle size={16} style={{ color: "var(--attention)", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>
                <strong style={{ color: "var(--text)" }}>Note:</strong> Previews are sandboxed and refresh as the team commits updates.
              </div>
            </Row>
          </Card>
        </Stack>
      </div>

      <Modal
        open={vm.approveOpen}
        onClose={vm.actions.closeApprove}
        title="Accept final delivery"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={vm.actions.closeApprove} disabled={vm.deliverySaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<IconCheck size={15} />}
              onClick={vm.actions.acceptDelivery}
              disabled={vm.deliverySaving || !vm.canAcceptDelivery}
            >
              {vm.deliverySaving ? "Confirming..." : "Confirm acceptance"}
            </Button>
          </>
        }
      >
        <NoteBlock tone="success">
          By confirming, you agree that the delivered application meets the approved requirements.
        </NoteBlock>
        {vm.deliveryBlockers.length > 0 && <div style={{ color: "#FBBF24", fontSize: 12.5, marginBottom: 12 }}>{vm.deliveryBlockers.join(" ")}</div>}
        {vm.deliveryError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 12 }}>{compactDevFlowError(vm.deliveryError)}</div>}
        <Field label="Acceptance comments">
          <Textarea
            rows={4}
            value={vm.deliveryNote}
            onChange={vm.actions.onDeliveryNoteChange}
            placeholder="Anything you'd like to flag for the team."
          />
        </Field>
      </Modal>

      <Modal
        open={vm.revisionOpen}
        onClose={vm.actions.closeRevision}
        title="Request delivery revisions"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={vm.actions.closeRevision} disabled={vm.deliverySaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<IconMessageCircle size={15} />}
              onClick={vm.actions.requestRevision}
              disabled={vm.deliverySaving || !vm.deliveryNote.trim()}
            >
              {vm.deliverySaving ? "Submitting..." : "Submit request"}
            </Button>
          </>
        }
      >
        <Field label="Revision request">
          <Textarea
            rows={5}
            value={vm.deliveryNote}
            onChange={vm.actions.onDeliveryNoteChange}
            placeholder="Describe what needs to change before final acceptance."
          />
        </Field>
        {vm.deliveryError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 12 }}>{compactDevFlowError(vm.deliveryError)}</div>}
      </Modal>
    </div>
  );
}

function ProductBadge({ badge }: { badge: ClientProductBadge }) {
  return <Badge tone={badge.tone}>{badge.label}</Badge>;
}

function NoteBlock({ tone = "neutral", children }: { tone?: "neutral" | "success" | "attention"; children: ReactNode }) {
  const borderColor =
    tone === "success" ? "rgba(16,185,129,.30)" : tone === "attention" ? "rgba(255,107,53,.32)" : "var(--border-soft)";
  return (
    <div
      style={{
        padding: 12,
        border: `1px solid ${borderColor}`,
        background: "var(--bg-sunken)",
        borderRadius: "var(--r-md)",
        color: "var(--text-2)",
        fontSize: 13,
        lineHeight: 1.55,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function ClientProductBackendNotice({ loading, error, hasProject }: { loading: boolean; error: string; hasProject: boolean }) {
  if (loading) {
    return <Card style={{ padding: 16, marginBottom: 18, color: "var(--text-2)" }}>Loading assigned product...</Card>;
  }
  if (error) {
    return (
      <Card style={{ padding: 16, marginBottom: 18, border: "1px solid rgba(239,68,68,.30)" }}>
        <div style={{ color: "#FCA5A5", fontWeight: 600 }}>Backend product unavailable</div>
        <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4 }}>{error}</div>
      </Card>
    );
  }
  if (!hasProject) {
    return (
      <Card style={{ padding: 16, marginBottom: 18 }}>
        <div style={{ fontWeight: 600 }}>No backend product assigned</div>
        <div style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 4 }}>
          Product previews appear after you select a backend project from the top bar.
        </div>
      </Card>
    );
  }
  return null;
}

function PreviewPane({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <Card style={{ padding: 24 }}>
      <Row gap={3} align="flex-start">
        <span style={{ color: "var(--text-2)", flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>{body}</div>
        </div>
      </Row>
    </Card>
  );
}

function WebPreviewPane({ model }: { model: ClientProductPreviewModel }) {
  return <PreviewPane icon={<IconMonitor size={20} />} title={model.title} body={model.body} />;
}

function MobilePreviewPane({ model }: { model: ClientProductPreviewModel }) {
  return <PreviewPane icon={<IconSmartphone size={20} />} title={model.title} body={model.body} />;
}

function BackendPreviewPane({ vm }: { vm: ClientProductViewModel }) {
  const backendPreview = vm.backendPreview;
  if (!backendPreview) return null;
  const itemIcons: Record<string, ReactNode> = {
    artifacts: <IconCode size={18} />,
    repo: <IconGitBranch size={18} />,
    event: <IconDatabase size={18} />,
  };

  return (
    <Stack gap={3}>
      <Card style={{ padding: 18 }}>
        <Row gap={3}>
          <IconShield size={16} style={{ color: "var(--text-2)", flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
            <strong style={{ color: "var(--text)" }}>You&apos;ll own everything on handover.</strong> All code, infrastructure, and
            documentation transfer to your team.
          </div>
        </Row>
      </Card>
      {backendPreview.items.map((item) => (
        <BackendPreviewItem key={item.key} item={item} icon={itemIcons[item.key]} />
      ))}
      {backendPreview.hasArtifacts && (
        <Card style={{ padding: 18 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Deliverable summary</h4>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Source preview is available to the delivery team only.</p>
          {vm.reviewError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactDevFlowError(vm.reviewError)}</div>}
          {backendPreview.artifactRows.map((row) => (
            <ArtifactReviewRowView key={row.id} row={row} vm={vm} />
          ))}
        </Card>
      )}
      <Modal
        open={Boolean(vm.revisionArtifact)}
        onClose={vm.actions.closeArtifactRevision}
        title="Request revision"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={vm.actions.closeArtifactRevision} disabled={vm.reviewing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => vm.revisionArtifact && vm.actions.reviewArtifact(vm.revisionArtifact, "REVISION_REQUESTED", vm.revisionNote)}
              disabled={vm.reviewing || !vm.revisionNote.trim()}
            >
              Submit request
            </Button>
          </>
        }
      >
        <Field label="Revision note">
          <Textarea
            rows={4}
            value={vm.revisionNote}
            onChange={vm.actions.onRevisionNoteChange}
            placeholder="Describe what should change before approval."
          />
        </Field>
      </Modal>
    </Stack>
  );
}

function BackendPreviewItem({ item, icon }: { item: ClientProductBackendItemModel; icon: ReactNode }) {
  return (
    <Card hover style={{ padding: 22 }}>
      <Row gap={4}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--r-md)",
            background: "var(--bg-3)",
            color: "var(--text-2)",
            border: "1px solid var(--border-soft)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title}</div>
          <div style={{ color: "var(--text-2)", fontSize: 13, marginTop: 4 }}>{item.sub}</div>
        </div>
        <Button variant="secondary" size="sm">
          {item.cta}
        </Button>
      </Row>
    </Card>
  );
}

function ArtifactReviewRowView({
  row,
  vm,
}: {
  row: ClientProductArtifactReviewRow;
  vm: ClientProductViewModel;
}) {
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
      <Row style={{ justifyContent: "space-between" }} gap={3}>
        <span className="mono" style={{ fontSize: 11.5, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis" }}>
          {row.title}
        </span>
        <Row gap={2} style={{ flexShrink: 0 }}>
          {row.published && <Badge tone="neutral">Published</Badge>}
          <ProductBadge badge={row.review} />
        </Row>
      </Row>
      {row.reviewNote && <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>{row.reviewNote}</div>}
      <Row gap={2} style={{ marginTop: 8 }} wrap>
        <Button variant="secondary" size="sm" icon={<IconCheck size={12} />} onClick={() => vm.actions.reviewArtifact(row.artifact, "APPROVED")} disabled={vm.reviewing}>
          Approve
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<IconMessageCircle size={12} />}
          onClick={() => vm.actions.openArtifactRevision(row.artifact)}
          disabled={vm.reviewing}
        >
          Request revision
        </Button>
        <Badge tone="neutral">{row.agentType}</Badge>
      </Row>
    </div>
  );
}

function ApprovalButton({
  icon,
  title,
  sub,
  onClick,
  primary,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "16px 18px",
        textAlign: "left",
        background: "transparent",
        border: `1px solid ${primary ? "var(--border-strong)" : "var(--border-soft)"}`,
        borderRadius: "var(--r-md)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        color: "var(--text)",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        transition: "border-color var(--motion-fast), background var(--motion-fast)",
      }}
    >
      <span style={{ color: "var(--text-2)", flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span>
        <span style={{ display: "block", fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span style={{ display: "block", color: "var(--text-3)", fontSize: 12, marginTop: 4, lineHeight: 1.45 }}>{sub}</span>
      </span>
    </button>
  );
}

function DeliveryMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ padding: "12px 14px", background: "var(--bg-2)" }}>
      <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{label}</div>
      <div className="mono" style={{ color: "var(--text)", fontWeight: 600, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function DeliverableCheck({
  item,
  last,
}: {
  item: ClientProductChecklistItem;
  last?: boolean;
}) {
  const tone = item.done ? "var(--green)" : item.inProgress ? "var(--amber)" : "var(--text-3)";
  return (
    <Row style={{ padding: "10px 0", borderBottom: last ? 0 : "1px solid var(--border-soft)" }} gap={3}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "transparent",
          border: `1px solid ${item.done ? "rgba(16,185,129,.5)" : item.inProgress ? "rgba(245,158,11,.5)" : "var(--border)"}`,
          color: tone,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {item.done ? <IconCheck size={11} /> : item.inProgress ? <IconCircle size={8} /> : <IconCircle size={8} />}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: item.done || item.inProgress ? "var(--text)" : "var(--text-3)" }}>{item.label}</div>
      <div style={{ fontSize: 11, color: tone }}>{item.done ? "Complete" : item.inProgress ? "In progress" : "Pending"}</div>
    </Row>
  );
}

function ClientDeliverableChecklist({ items }: { items: ClientProductChecklistItem[] }) {
  return (
    <>
      {items.map((item, index) => (
        <DeliverableCheck key={item.label} item={item} last={index === items.length - 1} />
      ))}
    </>
  );
}

function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Row style={{ justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
      <span style={{ color: "var(--text-3)" }}>{label}</span>
      <span className="mono" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </Row>
  );
}
