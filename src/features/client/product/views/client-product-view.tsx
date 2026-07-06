"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import {
  acceptDevFlowProjectDelivery,
  getDevFlowDeliveryReadiness,
  requestDevFlowProjectDeliveryRevision,
  reviewDevFlowArtifact,
} from "@/shared/api/devflow-api";
import { useDevFlowProjectOutputs } from "@/shared/hooks/use-devflow-projects";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import { compactDevFlowError, devflowLifecycleView, formatDevFlowDate } from "@/shared/utils/devflow-projects";
import { BlockingIssuePanel, GuidedActionPanel } from "@/shared/components/journey";
import { makeProjectJourneyContext } from "@/shared/journey";

/* Feature-level views work against loosely-typed backend payloads. */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Artifact = any;
type ProjectEvent = any;
type Project = any;
type Readiness = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ClientProductView() {
  const [tab, setTab] = useState("web");
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [deliveryError, setDeliveryError] = useState("");
  const [deliverySaving, setDeliverySaving] = useState(false);
  const [deliveryReadiness, setDeliveryReadiness] = useState<Readiness>(null);
  const [deliveryReadinessLoading, setDeliveryReadinessLoading] = useState(false);
  const [deliveryReadinessError, setDeliveryReadinessError] = useState("");
  const { selectedProject, selectedProjectLoading, selectedProjectError, refreshProjects, refreshSelectedProject } =
    useSelectedDevFlowProject();
  const outputs = useDevFlowProjectOutputs(selectedProject?.id, { includeDocuments: true, includeEvents: true });
  const lifecycle = devflowLifecycleView(selectedProject);
  const productName = selectedProject?.companyName || "No selected product";
  const progress = selectedProject ? lifecycle.progress : 0;
  const sharedArtifacts = outputs.artifacts.filter((artifact: Artifact) => artifact.clientVisible);
  const sharedDocuments = outputs.documents.filter((document: Artifact) => document.clientVisible);
  const deliveryReview = selectedProject?.deliveryReview;
  const deliveryBlockers = selectedProject
    ? deliveryReadiness
      ? deliveryReadiness.blockers
          .filter((blocker: Artifact) => blocker.severity === "BLOCKER")
          .map((blocker: Artifact) => blocker.message)
      : deliveryReadinessError
        ? [`Delivery readiness could not be verified: ${compactDevFlowError(deliveryReadinessError)}`]
        : clientDeliveryBlockers(selectedProject, sharedArtifacts, sharedDocuments)
    : [];

  const refreshDeliveryReadiness = async () => {
    if (!selectedProject?.id) {
      setDeliveryReadiness(null);
      return;
    }
    setDeliveryReadinessLoading(true);
    setDeliveryReadinessError("");
    try {
      setDeliveryReadiness(await getDevFlowDeliveryReadiness(selectedProject.id));
    } catch (nextError) {
      setDeliveryReadiness(null);
      setDeliveryReadinessError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setDeliveryReadinessLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!selectedProject?.id) {
      setDeliveryReadiness(null);
      setDeliveryReadinessError("");
      setDeliveryReadinessLoading(false);
      return () => {
        active = false;
      };
    }
    setDeliveryReadinessLoading(true);
    setDeliveryReadinessError("");
    getDevFlowDeliveryReadiness(selectedProject.id)
      .then((readiness) => {
        if (!active) return;
        setDeliveryReadiness(readiness);
      })
      .catch((nextError) => {
        if (!active) return;
        setDeliveryReadiness(null);
        setDeliveryReadinessError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => {
        if (!active) return;
        setDeliveryReadinessLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedProject?.id]);

  const refresh = async () => {
    await Promise.all([refreshProjects(), refreshSelectedProject?.(), outputs.refresh(), refreshDeliveryReadiness()]);
  };
  const productJourney = makeProjectJourneyContext({
    role: "client",
    project: selectedProject,
    loading: selectedProjectLoading || outputs.loading,
    pendingActions: sharedArtifacts.filter((artifact: Artifact) => artifact.reviewStatus === "PENDING").length,
    blockers: deliveryBlockers.map((blocker: string) => ({ title: blocker, severity: "warning" })),
    primaryAction: selectedProject
      ? { label: deliveryBlockers.length ? "Review blockers" : "Review deliverables", onClick: refreshDeliveryReadiness }
      : undefined,
    secondaryAction: { label: "Refresh build", onClick: refresh, variant: "secondary", icon: <IconRefresh size={13} /> },
  });

  const acceptDelivery = async () => {
    if (deliveryBlockers.length) {
      setDeliveryError(deliveryBlockers[0]);
      return;
    }
    setDeliverySaving(true);
    setDeliveryError("");
    try {
      await acceptDevFlowProjectDelivery(selectedProject!.id, { note: deliveryNote.trim() || undefined });
      setApproveOpen(false);
      setDeliveryNote("");
      await refresh();
    } catch (nextError) {
      setDeliveryError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setDeliverySaving(false);
    }
  };

  const requestRevision = async () => {
    setDeliverySaving(true);
    setDeliveryError("");
    try {
      await requestDevFlowProjectDeliveryRevision(selectedProject!.id, { note: deliveryNote.trim() });
      setRevisionOpen(false);
      setDeliveryNote("");
      await refresh();
    } catch (nextError) {
      setDeliveryError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setDeliverySaving(false);
    }
  };

  if (!selectedProject) {
    return (
      <div data-screen-label="Client - My Product">
        <ClientPageHeader title="My Product" subtitle="Preview your application, review the latest build, and approve final delivery." />
        <ClientProductBackendNotice loading={selectedProjectLoading} error={selectedProjectError} project={selectedProject} />
        <GuidedActionPanel context={productJourney} />
      </div>
    );
  }

  return (
    <div data-screen-label="Client - My Product">
      <ClientPageHeader title="My Product" subtitle="Preview your application, review the latest build, and approve final delivery." />

      <ClientProductBackendNotice loading={selectedProjectLoading} error={selectedProjectError} project={selectedProject} />

      <GuidedActionPanel context={productJourney} />
      <BlockingIssuePanel issues={productJourney.blockers} />

      {/* Hero — single status, one progress line, primary action */}
      <Card style={{ padding: 28, marginBottom: 24 }}>
        <Row align="flex-start" gap={6} wrap style={{ justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
            <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: "14px 0 10px" }}>{productName}</h2>
            <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, maxWidth: 560 }}>{selectedProject.brief}</p>
            <div style={{ marginTop: 24, maxWidth: 460 }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>Overall completion</span>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 600 }}>{progress}%</span>
              </Row>
              <div style={{ height: 4, borderRadius: 999, background: "var(--bg-sunken)", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "var(--text)" }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>
                {lifecycle.nextAction} · updated {formatDevFlowDate(selectedProject.updatedAt)}
              </div>
            </div>
          </div>
          <Row gap={2} wrap>
            <Button variant="secondary" icon={<IconExternalLink size={15} />} disabled>
              Preview unavailable
            </Button>
            <Button variant="primary" icon={<IconRefresh size={15} />} onClick={refresh}>
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
              <button key={key} className={"tab" + (tab === key ? " active" : "")} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>
          {tab === "web" && <WebPreviewPane artifacts={sharedArtifacts} />}
          {tab === "mobile" && <MobilePreviewPane artifacts={sharedArtifacts} />}
          {tab === "backend" && (
            <BackendPreviewPane artifacts={sharedArtifacts} events={outputs.events} project={selectedProject} onReviewed={outputs.refresh} />
          )}

          <Card style={{ padding: 26, marginTop: 20 }}>
            <Row style={{ justifyContent: "space-between", marginBottom: 8 }} gap={3} wrap>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Approval</div>
              <DeliveryReviewBadge review={deliveryReview} />
            </Row>
            <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.55, marginBottom: 18, maxWidth: 580 }}>
              Once you&apos;re happy with the build, accept delivery to trigger final production deploy and start your support window.
            </p>
            {deliveryReview?.revisionNote && <NoteBlock tone="attention">{deliveryReview.revisionNote}</NoteBlock>}
            {deliveryReview?.resolutionNote && <NoteBlock tone="success">{deliveryReview.resolutionNote}</NoteBlock>}
            <Row style={{ justifyContent: "space-between", marginBottom: 14 }} gap={2} wrap>
              <Badge tone={deliveryReadiness?.ready ? "green" : deliveryReadinessLoading ? "neutral" : "amber"}>
                {deliveryReadiness?.ready ? "Ready for acceptance" : deliveryReadinessLoading ? "Checking readiness" : "Acceptance blocked"}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                icon={<IconRefresh size={14} />}
                onClick={refreshDeliveryReadiness}
                disabled={deliveryReadinessLoading}
              >
                {deliveryReadinessLoading ? "Checking…" : "Check readiness"}
              </Button>
            </Row>
            {deliveryReadiness && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 1, marginBottom: 14, border: "1px solid var(--border-soft)", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--border-soft)" }}>
                <DeliveryMetric label="Artifacts" value={deliveryReadiness.counts.publishedArtifacts} />
                <DeliveryMetric label="Work orders" value={deliveryReadiness.counts.activeWorkOrders} />
                <DeliveryMetric label="Documents" value={deliveryReadiness.counts.openDocuments} />
                <DeliveryMetric label="Coverage gaps" value={deliveryReadiness.counts.missingAgentTypes} />
              </div>
            )}
            {deliveryBlockers.length > 0 && (
              <NoteBlock tone="attention">
                <strong style={{ color: "var(--text)" }}>Delivery acceptance is blocked.</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                  {deliveryBlockers.map((blocker: string) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </NoteBlock>
            )}
            {deliveryError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 12 }}>{compactDevFlowError(deliveryError)}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
              <ApprovalButton
                icon={<IconCheckCircle size={18} />}
                title="Approve & accept delivery"
                sub={deliveryBlockers.length ? "Resolve open reviews first" : "Marks the engagement as delivered"}
                onClick={() => {
                  setDeliveryError("");
                  setDeliveryNote(deliveryReview?.acceptanceNote || "");
                  setApproveOpen(true);
                }}
                primary
                disabled={deliveryBlockers.length > 0}
              />
              <ApprovalButton
                icon={<IconMessageCircle size={18} />}
                title="Request revisions"
                sub="Send a project-level delivery request"
                onClick={() => {
                  setDeliveryError("");
                  setDeliveryNote(deliveryReview?.revisionNote || "");
                  setRevisionOpen(true);
                }}
              />
              <ApprovalButton icon={<IconCalendar size={18} />} title="Schedule walkthrough" sub="Scheduling is not connected yet" disabled />
            </div>
          </Card>
        </div>

        <Stack gap={4}>
          <Card style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Deliverable checklist</h4>
            <p style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 14 }}>What you&apos;ll receive on handover</p>
            <ClientDeliverableChecklist artifacts={sharedArtifacts} hasBackendProject={Boolean(selectedProject)} />
          </Card>
          <Card style={{ padding: 22 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>Build info</h4>
            <KV label="Build" value={selectedProject.runId || "Not started"} />
            <KV label="Branch" value={selectedProject.repoUrl ? "linked repo" : "Not linked"} />
            <KV label="Last update" value={formatDevFlowDate(selectedProject.updatedAt)} />
            <KV label="Environment" value={selectedProject.stackKey} />
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
        open={approveOpen}
        onClose={() => !deliverySaving && setApproveOpen(false)}
        title="Accept final delivery"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproveOpen(false)} disabled={deliverySaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<IconCheck size={15} />}
              onClick={acceptDelivery}
              disabled={deliverySaving || deliveryBlockers.length > 0}
            >
              {deliverySaving ? "Confirming…" : "Confirm acceptance"}
            </Button>
          </>
        }
      >
        <NoteBlock tone="success">
          By confirming, you agree that the delivered application meets the approved requirements.
        </NoteBlock>
        {deliveryBlockers.length > 0 && <div style={{ color: "#FBBF24", fontSize: 12.5, marginBottom: 12 }}>{deliveryBlockers.join(" ")}</div>}
        {deliveryError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 12 }}>{compactDevFlowError(deliveryError)}</div>}
        <Field label="Acceptance comments">
          <Textarea
            rows={4}
            value={deliveryNote}
            onChange={(event) => setDeliveryNote(event.target.value)}
            placeholder="Anything you'd like to flag for the team."
          />
        </Field>
      </Modal>

      <Modal
        open={revisionOpen}
        onClose={() => !deliverySaving && setRevisionOpen(false)}
        title="Request delivery revisions"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevisionOpen(false)} disabled={deliverySaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<IconMessageCircle size={15} />}
              onClick={requestRevision}
              disabled={deliverySaving || !deliveryNote.trim()}
            >
              {deliverySaving ? "Submitting…" : "Submit request"}
            </Button>
          </>
        }
      >
        <Field label="Revision request">
          <Textarea
            rows={5}
            value={deliveryNote}
            onChange={(event) => setDeliveryNote(event.target.value)}
            placeholder="Describe what needs to change before final acceptance."
          />
        </Field>
        {deliveryError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 12 }}>{compactDevFlowError(deliveryError)}</div>}
      </Modal>
    </div>
  );
}

/* Small hairline note block — neutral, success, or attention. */
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

function ClientProductBackendNotice({ loading, error, project }: { loading: boolean; error: unknown; project: Project }) {
  if (loading) {
    return <Card style={{ padding: 16, marginBottom: 18, color: "var(--text-2)" }}>Loading assigned product…</Card>;
  }
  if (error) {
    return (
      <Card style={{ padding: 16, marginBottom: 18, border: "1px solid rgba(239,68,68,.30)" }}>
        <div style={{ color: "#FCA5A5", fontWeight: 600 }}>Backend product unavailable</div>
        <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 4 }}>{compactDevFlowError(error)}</div>
      </Card>
    );
  }
  if (!project) {
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

function WebPreviewPane({ artifacts }: { artifacts: Artifact[] }) {
  const frontendArtifacts = artifacts.filter((artifact) => artifactAgentIs(artifact, "frontend"));
  return (
    <PreviewPane
      icon={<IconMonitor size={20} />}
      title="Web preview artifact"
      body={
        frontendArtifacts.length
          ? `${frontendArtifacts.length} frontend artifact${frontendArtifacts.length === 1 ? "" : "s"} available in the backend deliverable list.`
          : "No client-visible frontend artifact has been shared yet."
      }
    />
  );
}

function MobilePreviewPane({ artifacts }: { artifacts: Artifact[] }) {
  const mobileArtifacts = artifacts.filter(
    (artifact) => artifactAgentIs(artifact, "mobile") || artifact.filePath.toLowerCase().includes("mobile"),
  );
  return (
    <PreviewPane
      icon={<IconSmartphone size={20} />}
      title="Mobile preview artifact"
      body={
        mobileArtifacts.length
          ? `${mobileArtifacts.length} mobile artifact${mobileArtifacts.length === 1 ? "" : "s"} available in the backend deliverable list.`
          : "No client-visible mobile artifact has been shared yet."
      }
    />
  );
}

function BackendPreviewPane({
  artifacts = [],
  events = [],
  project,
  onReviewed,
}: {
  artifacts?: Artifact[];
  events?: ProjectEvent[];
  project: Project;
  onReviewed?: () => void | Promise<void>;
}) {
  const artifactCount = artifacts.length;
  const latestEvent = events[0];
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [revisionArtifact, setRevisionArtifact] = useState<Artifact>(null);
  const [revisionNote, setRevisionNote] = useState("");

  const reviewArtifact = async (artifact: Artifact, reviewStatus: "APPROVED" | "REVISION_REQUESTED", reviewNote = "") => {
    setReviewing(true);
    setReviewError("");
    try {
      await reviewDevFlowArtifact(artifact.projectId, artifact.id, {
        reviewStatus,
        reviewNote: reviewNote.trim() || undefined,
      });
      setRevisionArtifact(null);
      setRevisionNote("");
      await onReviewed?.();
    } catch (nextError) {
      setReviewError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setReviewing(false);
    }
  };

  const items = [
    { icon: <IconCode size={18} />, title: "Generated artifacts", sub: `${artifactCount} files recorded`, cta: "Read-only" },
    { icon: <IconGitBranch size={18} />, title: "Source repository", sub: project.repoUrl || "Repository not linked yet", cta: "Status" },
    {
      icon: <IconDatabase size={18} />,
      title: "Latest build event",
      sub: latestEvent ? `${latestEvent.nodeName} ${latestEvent.eventType}` : "No event logs yet",
      cta: "View",
    },
  ];

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
      {items.map((item) => (
        <Card key={item.title} hover style={{ padding: 22 }}>
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
              {item.icon}
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
      ))}
      {project && artifacts.length > 0 && (
        <Card style={{ padding: 18 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Deliverable summary</h4>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>Source preview is available to the delivery team only.</p>
          {reviewError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactDevFlowError(reviewError)}</div>}
          {artifacts.slice(0, 5).map((artifact) => (
            <div key={artifact.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border-soft)" }}>
              <Row style={{ justifyContent: "space-between" }} gap={3}>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {artifact.displayName || artifact.filePath}
                </span>
                <Row gap={2} style={{ flexShrink: 0 }}>
                  {artifact.publishedAt && <Badge tone="neutral">Published</Badge>}
                  <ReviewBadge status={artifact.reviewStatus} />
                </Row>
              </Row>
              {artifact.reviewNote && <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>{artifact.reviewNote}</div>}
              <Row gap={2} style={{ marginTop: 8 }} wrap>
                <Button variant="secondary" size="sm" icon={<IconCheck size={12} />} onClick={() => reviewArtifact(artifact, "APPROVED")} disabled={reviewing}>
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<IconMessageCircle size={12} />}
                  onClick={() => {
                    setRevisionArtifact(artifact);
                    setRevisionNote(artifact.reviewNote || "");
                  }}
                  disabled={reviewing}
                >
                  Request revision
                </Button>
                <Badge tone="neutral">{artifact.agentType}</Badge>
              </Row>
            </div>
          ))}
        </Card>
      )}
      <Modal
        open={Boolean(revisionArtifact)}
        onClose={() => !reviewing && setRevisionArtifact(null)}
        title="Request revision"
        width={520}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevisionArtifact(null)} disabled={reviewing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => reviewArtifact(revisionArtifact, "REVISION_REQUESTED", revisionNote)}
              disabled={reviewing || !revisionNote.trim()}
            >
              Submit request
            </Button>
          </>
        }
      >
        <Field label="Revision note">
          <Textarea
            rows={4}
            value={revisionNote}
            onChange={(event) => setRevisionNote(event.target.value)}
            placeholder="Describe what should change before approval."
          />
        </Field>
      </Modal>
    </Stack>
  );
}

function ReviewBadge({ status }: { status?: string }) {
  const map: Record<string, { tone: "green" | "amber" | "neutral"; label: string }> = {
    APPROVED: { tone: "green", label: "Approved" },
    REVISION_REQUESTED: { tone: "amber", label: "Revision requested" },
    PENDING: { tone: "neutral", label: "Pending review" },
  };
  const next = map[status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
}

function DeliveryReviewBadge({ review }: { review?: { status?: string } | null }) {
  const map: Record<string, { tone: "green" | "amber" | "neutral"; label: string }> = {
    ACCEPTED: { tone: "green", label: "Delivery accepted" },
    REVISION_REQUESTED: { tone: "amber", label: "Delivery revision" },
    REVISION_RESOLVED: { tone: "neutral", label: "Ready for acceptance" },
    PENDING: { tone: "neutral", label: "Awaiting acceptance" },
  };
  const next = map[review?.status || "PENDING"] || map.PENDING;
  return <Badge tone={next.tone}>{next.label}</Badge>;
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
  label,
  done,
  inProgress,
  last,
}: {
  label: string;
  done?: boolean;
  inProgress?: boolean;
  last?: boolean;
}) {
  const tone = done ? "var(--green)" : inProgress ? "var(--amber)" : "var(--text-3)";
  return (
    <Row style={{ padding: "10px 0", borderBottom: last ? 0 : "1px solid var(--border-soft)" }} gap={3}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "transparent",
          border: `1px solid ${done ? "rgba(16,185,129,.5)" : inProgress ? "rgba(245,158,11,.5)" : "var(--border)"}`,
          color: tone,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {done ? <IconCheck size={11} /> : inProgress ? <IconCircle size={8} /> : <IconCircle size={8} />}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: done || inProgress ? "var(--text)" : "var(--text-3)" }}>{label}</div>
      <div style={{ fontSize: 11, color: tone }}>{done ? "Complete" : inProgress ? "In progress" : "Pending"}</div>
    </Row>
  );
}

function ClientDeliverableChecklist({ artifacts, hasBackendProject }: { artifacts: Artifact[]; hasBackendProject: boolean }) {
  if (!hasBackendProject) {
    return (
      <>
        <DeliverableCheck label="Frontend application" />
        <DeliverableCheck label="Backend API" />
        <DeliverableCheck label="Database schema" />
        <DeliverableCheck label="Documentation" />
        <DeliverableCheck label="Production deployment" last />
      </>
    );
  }
  const frontend = artifacts.some((artifact) => artifactAgentIs(artifact, "frontend"));
  const backend = artifacts.some((artifact) => artifactAgentIs(artifact, "backend"));
  const database = artifacts.some((artifact) => artifactAgentIs(artifact, "database"));
  const docs = artifacts.some(
    (artifact) => artifact.filePath.toLowerCase().includes("readme") || artifact.filePath.toLowerCase().includes("doc"),
  );
  return (
    <>
      <DeliverableCheck label="Frontend application" done={frontend} inProgress={!frontend} />
      <DeliverableCheck label="Backend API" done={backend} inProgress={!backend} />
      <DeliverableCheck label="Database schema" done={database} inProgress={!database} />
      <DeliverableCheck label="Documentation" done={docs} inProgress={!docs} />
      <DeliverableCheck label="Production deployment" last />
    </>
  );
}

function clientDeliveryBlockers(project: Project, artifacts: Artifact[], documents: Artifact[]) {
  const blockers: string[] = [];
  const acceptedInvite = project.clientInvites?.some((invite: Artifact) => invite.status === "ACCEPTED");
  const openArtifacts = artifacts.filter((artifact) => artifact.reviewStatus !== "APPROVED");
  const openDocuments = documents.filter((document) => !["APPROVED", "ARCHIVED"].includes(document.status));
  if (!acceptedInvite) {
    blockers.push("Accept the project invite before accepting final delivery.");
  }
  if (openArtifacts.length > 0) {
    blockers.push(`${openArtifacts.length} shared artifact${openArtifacts.length === 1 ? "" : "s"} still need approval or revision handling.`);
  }
  if (openDocuments.length > 0) {
    blockers.push(`${openDocuments.length} client-visible document${openDocuments.length === 1 ? "" : "s"} still need approval or archival.`);
  }
  return blockers;
}

function artifactAgentIs(artifact: Artifact, agentType: string) {
  return String(artifact.agentType || "").toLowerCase() === agentType;
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
