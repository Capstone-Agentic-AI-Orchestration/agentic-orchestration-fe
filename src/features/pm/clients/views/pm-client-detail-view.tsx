"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheckCircle,
  IconClock,
  IconFileText,
  IconFolder,
  IconMessageCircle,
  IconPlus,
  IconUsers,
} from "@/shared/components/icons";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";
import { compactBackendError, formatBackendDate } from "@/features/pm/projects/utils/pm-project-detail.utils";
import { devflowStatusView } from "@/shared/utils/devflow-projects";
import { ConversationPanel } from "@/shared/components/collaboration/project-conversation-panel";
import {
  PMClientSubnav,
  PM_CLIENT_SECTION_IDS,
  type PMClientSectionId,
} from "../components/pm-client-subnav";
import { useDevFlowClientWorkspace } from "@/shared/hooks/use-devflow-clients";
import { useDevFlowConversations } from "@/shared/hooks/use-devflow-collaboration";
import { useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";
import {
  addDevFlowClientContact,
  devflowClientScope,
  getDevFlowClientContactCandidates,
  listDevFlowProjects,
  removeDevFlowClientContact,
  setDevFlowProjectClient,
  updateDevFlowClient,
  type DevFlowClientStatus,
  type DevFlowProfile,
  type DevFlowProjectStatus,
  type DevFlowProjectSummary,
} from "@/shared/api/devflow-api";

const STATUS_TONE: Record<DevFlowClientStatus, "green" | "blue" | "gray"> = {
  ACTIVE: "green",
  PROSPECT: "blue",
  ARCHIVED: "gray",
};

/** Statuses that mean the work is finished, one way or the other. */
const SETTLED_STATUSES: ReadonlySet<DevFlowProjectStatus> = new Set(["DELIVERED", "FAILED"]);

/**
 * Progress-bar fill per status tone, resolved through live tokens.
 *
 * Deliberately not `lifecycleProgressColor()`: that helper still hands back the pre-rebrand
 * #60A5FA / #A78BFA palette, and this theme has no blue and no purple. Neutral carries the
 * default; color is spent only where it means something.
 */
const PIPELINE_FILL: Record<string, string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
};
const pipelineFill = (tone: string) => PIPELINE_FILL[tone] ?? "var(--text-2)";

/**
 * Discovery is deliberately absent from `devflowStatusView` — it is not a delivery stage. The
 * pipeline still has to draw it, so name it for what it is instead of printing the raw enum
 * through the "Unknown" fallback.
 */
function pipelineView(status: DevFlowProjectStatus) {
  if (status === "DISCOVERY") {
    return { label: "In discovery", tone: "amber", progress: 6, stage: "Waiting on client" };
  }
  return devflowStatusView(status);
}

/**
 * Coarse relative age. The exact timestamp is one hover away in the fact list; on a rollup the
 * question is only ever "is this stale?", which a precise date answers slowly.
 */
function relativeWhen(value?: string | null) {
  if (!value) return "Never";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "Never";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 31) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

type AttentionTone = "warn" | "danger" | "good";

interface AttentionItem {
  id: string;
  tone: AttentionTone;
  icon: ReactNode;
  title: string;
  detail: string;
  action?: { label: string; run: () => void };
}

function extractionBadge(document: { fileName: string | null; extraction: { status: string } | null }) {
  if (!document.fileName && !document.extraction) return { tone: "gray" as const, label: "Reference only" };
  const status = document.extraction?.status;
  if (status === "READY") return { tone: "green" as const, label: "Text extracted" };
  if (status === "FAILED") return { tone: "red" as const, label: "Extraction failed" };
  if (status === "EXTRACTING") return { tone: "amber" as const, label: "Extracting" };
  return { tone: "amber" as const, label: "Queued" };
}

export function PMClientDetailView({ clientId }: Readonly<{ clientId: string }>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { client, projects, documents, contacts, loading, error, refresh } =
    useDevFlowClientWorkspace(clientId);

  // The relationship conversation. Fetched here as well as inside the panel because the subnav
  // badge has to show unread mail on every section, not only while Messages is open.
  const conversationScope = useMemo(() => devflowClientScope(clientId), [clientId]);
  const { conversations } = useDevFlowConversations(conversationScope);
  const unreadMessages = useMemo(
    () => conversations.reduce((total, conversation) => total + (conversation.unreadCount ?? 0), 0),
    [conversations],
  );
  // Projects belonging to some OTHER client. There is no "unassigned" pool to draw from any
  // more, so this modal moves a project that was filed under the wrong client rather than
  // adopting an orphan.
  const [movable, setMovable] = useState<DevFlowProjectSummary[]>([]);
  // Seeded from ?tab= so the project page's "Open conversation" link lands on Messages rather than
  // dropping the PM on Overview to find it themselves. Validated against the known ids: the value
  // comes from the URL, so a typo must fall back rather than render a blank section.
  const [tab, setTab] = useState<PMClientSectionId>(() => {
    const requested = searchParams.get("tab");
    return PM_CLIENT_SECTION_IDS.find((section) => section === requested) ?? "overview";
  });
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkProjectId, setLinkProjectId] = useState("");

  const [contactOpen, setContactOpen] = useState(false);
  const [candidates, setCandidates] = useState<DevFlowProfile[]>([]);
  const [candidateId, setCandidateId] = useState("");

  const counts = useMemo(
    () => ({
      // Unread, not total. A running total of every message ever sent is inventory; what a PM needs
      // off the side of the screen is whether anyone is waiting on a reply.
      messages: unreadMessages,
      projects: projects.length,
      documents: documents.totals.documents,
      contacts: contacts.length,
    }),
    [unreadMessages, projects.length, documents.totals.documents, contacts.length],
  );

  // Everything the overview reads, derived once from the four payloads the workspace hook
  // already fetched. No extra requests: this page is a rollup, not a new data source.
  //
  // A project in DISCOVERY is a container for the documents and conversation that precede a
  // build, not delivery work. The backend already refuses to orchestrate one; the console should
  // not present it as a project the team is delivering either.
  const overview = useMemo(() => {
    const discovery = projects.filter((project) => project.status === "DISCOVERY");
    const delivery = projects.filter((project) => project.status !== "DISCOVERY");
    const inFlight = delivery.filter((project) => !SETTLED_STATUSES.has(project.status));
    const delivered = delivery.filter((project) => project.status === "DELIVERED");
    const failed = delivery.filter((project) => project.status === "FAILED");

    const allDocuments = documents.groups.flatMap((group) =>
      group.documents.map((document) => ({ ...document, group })),
    );
    const failedExtractions = allDocuments.filter(
      (document) => document.extraction?.status === "FAILED",
    );
    // Only projects that produced a document group with something in it count as documented.
    const documentedProjectIds = new Set(
      documents.groups.filter((group) => group.documents.length > 0).map((group) => group.projectId),
    );

    const contactsWithAccess = contacts.filter((contact) => contact.hasProjectAccess);
    const stacks = [...new Set(projects.map((project) => project.stackKey).filter(Boolean))];

    // Newest touch anywhere in the relationship — a project moving or a document landing both
    // count as the client being live.
    const lastActivityAt = [
      ...projects.map((project) => project.updatedAt),
      ...allDocuments.map((document) => document.updatedAt),
    ].reduce<string | null>(
      (latest, value) => (value && (!latest || value > latest) ? value : latest),
      null,
    );

    // Newest first: a rollup that leads with the oldest thing buries the answer.
    const timeline = [
      ...projects.map((project) => ({
        id: `project-${project.id}`,
        kind: "project" as const,
        title: project.companyName,
        detail: `${pipelineView(project.status).label} · ${project.stackKey}`,
        at: project.updatedAt,
        href: `/pm/project/${project.id}`,
      })),
      ...allDocuments.map((document) => ({
        id: `document-${document.id}`,
        kind: "document" as const,
        title: document.title,
        detail: `Document in ${document.group.projectName}`,
        at: document.updatedAt,
        href: `/pm/project/${document.group.projectId}?tab=documents`,
      })),
    ]
      .filter((entry) => Boolean(entry.at))
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 6);

    return {
      discovery,
      delivery,
      inFlight,
      delivered,
      failed,
      failedExtractions,
      documentedCount: projects.filter((project) => documentedProjectIds.has(project.id)).length,
      // Delivery work only. A discovery space with nothing in it yet is the normal starting
      // state, and the discovery row already says so — flagging it twice is just noise.
      undocumentedDelivery: delivery.filter((project) => !documentedProjectIds.has(project.id)),
      contactsWithAccess,
      stacks,
      lastActivityAt,
      timeline,
      // Most recently touched first, so the pipeline preview shows live work rather than
      // whatever happened to be created first.
      pipeline: [...projects].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    };
  }, [projects, documents, contacts]);

  const discoveryCount = overview.discovery.length;
  const deliveryCount = overview.delivery.length;

  // Actionable, not decorative: every row names something a PM can go and fix, and links to the
  // section where the fix lives.
  const attention: AttentionItem[] = [];
  // First, because it is a person waiting rather than a state to tidy.
  if (unreadMessages > 0) {
    attention.push({
      id: "unread-messages",
      tone: "warn",
      icon: <IconMessageCircle size={14} />,
      title: `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`,
      detail: "Someone at this company is waiting on a reply.",
      action: { label: "Open messages", run: () => setTab("messages") },
    });
  }
  if (projects.length === 0) {
    attention.push({
      id: "no-projects",
      tone: "warn",
      icon: <IconFolder size={14} />,
      title: "No projects yet",
      detail: "Link an existing project, or approve an inquiry to open a discovery space.",
      action: { label: "Link a project", run: () => setTab("projects") },
    });
  }
  if (overview.failed.length > 0) {
    attention.push({
      id: "failed-projects",
      tone: "danger",
      icon: <IconAlertTriangle size={14} />,
      title: `${overview.failed.length} project${overview.failed.length === 1 ? "" : "s"} failed`,
      detail: overview.failed.map((project) => project.companyName).join(", "),
      action: { label: "Review", run: () => setTab("projects") },
    });
  }
  if (overview.failedExtractions.length > 0) {
    attention.push({
      id: "failed-extractions",
      tone: "danger",
      icon: <IconFileText size={14} />,
      title: `${overview.failedExtractions.length} document${overview.failedExtractions.length === 1 ? "" : "s"} could not be read`,
      detail: "Agents cannot use these. Re-upload them from the owning project.",
      action: { label: "Open documents", run: () => setTab("documents") },
    });
  }
  if (discoveryCount > 0) {
    attention.push({
      id: "discovery",
      tone: "warn",
      icon: <IconClock size={14} />,
      title: `${discoveryCount} discovery space${discoveryCount === 1 ? "" : "s"} waiting`,
      detail: "Collect scope and documents, then start delivery to unlock orchestration.",
      action: { label: "Open projects", run: () => setTab("projects") },
    });
  }
  if (overview.undocumentedDelivery.length > 0) {
    const count = overview.undocumentedDelivery.length;
    attention.push({
      id: "undocumented",
      tone: "warn",
      icon: <IconFileText size={14} />,
      title: `${count} delivery project${count === 1 ? "" : "s"} with no documents`,
      detail: "Agents have nothing from the client to work from on these.",
      action: { label: "Open documents", run: () => setTab("documents") },
    });
  }
  if (contacts.length === 0) {
    attention.push({
      id: "no-contacts",
      tone: "warn",
      icon: <IconUsers size={14} />,
      title: "No contacts recorded",
      detail: "Nobody on the client side is on file for this account.",
      action: { label: "Add contact", run: () => setTab("contacts") },
    });
  } else if (overview.contactsWithAccess.length < contacts.length) {
    const blocked = contacts.length - overview.contactsWithAccess.length;
    attention.push({
      id: "contacts-without-access",
      tone: "warn",
      icon: <IconUsers size={14} />,
      title: `${blocked} contact${blocked === 1 ? "" : "s"} cannot open anything`,
      detail: "Being listed here grants nothing — access comes from project membership.",
      action: { label: "Review contacts", run: () => setTab("contacts") },
    });
  }
  if (!client?.primaryContactEmail) {
    attention.push({
      id: "no-primary-email",
      tone: "warn",
      icon: <IconAlertTriangle size={14} />,
      title: "No primary contact email",
      detail: "Inbound inquiries cannot be matched to this client without one. Add it in Details.",
    });
  }

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError("");
    try {
      await action();
      await refresh();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  const openContactPicker = async () => {
    setContactOpen(true);
    setCandidateId("");
    try {
      setCandidates(await getDevFlowClientContactCandidates());
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  };

  if (loading && !client) {
    return <Card className="pm-tab-panel pm-tab-empty">Loading client...</Card>;
  }

  if (error && !client) {
    return (
      <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">
        {compactBackendError(error)}
      </Card>
    );
  }

  if (!client) {
    return <Card className="pm-tab-panel pm-tab-empty">This client is unavailable.</Card>;
  }

  return (
    <div className="pm-project-workspace" data-screen-label={`PM - Client - ${client.name}`}>
      <PMClientSubnav
        clientName={client.name}
        activeItem={tab}
        counts={counts}
        attention={{ messages: true }}
        onSelect={setTab}
      />

      {/* pm-project-workspace-content, not a bespoke class: it carries the 28px gutter that
          separates this column from the subnav rule, plus the responsive overrides every other
          workspace page relies on. */}
      <section className="pm-project-workspace-content">
        <div className="pm-client-detail-header">
          <div className="pm-client-detail-heading">
            <Button variant="ghost" size="sm" icon={<IconArrowLeft size={13} />} onClick={() => router.push("/pm/clients")}>
              All clients
            </Button>
            <h1>{client.name}</h1>
            <p>
              {client.primaryContactName || client.primaryContactEmail || "No primary contact recorded"}
            </p>
          </div>
          <div className="pm-client-detail-status">
            <Badge tone={STATUS_TONE[client.status]}>{client.status.toLowerCase()}</Badge>
            <Select
              value={client.status}
              disabled={busy}
              onChange={(event) =>
                void run(() =>
                  updateDevFlowClient(client.id, { status: event.target.value as DevFlowClientStatus }),
                )
              }
              aria-label="Client status"
            >
              <option value="ACTIVE">Active</option>
              <option value="PROSPECT">Prospect</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
        </div>

        {actionError && (
          <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger" style={{ marginBottom: 14 }}>
            {compactBackendError(actionError)}
          </Card>
        )}

        {tab === "overview" && (
          <div className="pm-tab-layout pm-tab-layout--aside">
            <div className="pm-client-overview-stack">
              <Card className="pm-tab-panel pm-tab-panel--padded">
                <SectionTitle title="At a glance" subtitle="What this client currently has with you." />
                <div className="pm-tab-stat-grid" style={{ marginTop: 14 }}>
                  {/* Discovery spaces are counted apart from delivery work. Folding them in is
                      what made a client you have only just approved look like work in flight. */}
                  <div className="pm-client-stat">
                    <small>Delivery projects</small>
                    <strong>{deliveryCount}</strong>
                    {discoveryCount > 0 ? (
                      <span className="is-warn">+{discoveryCount} in discovery</span>
                    ) : (
                      <span>{overview.inFlight.length} in flight</span>
                    )}
                  </div>
                  <div className="pm-client-stat">
                    <small>Documents</small>
                    <strong>{documents.totals.documents}</strong>
                    <span>{documents.totals.files} with a file attached</span>
                  </div>
                  <div className="pm-client-stat">
                    <small>Readable by agents</small>
                    <strong>{documents.totals.readable}</strong>
                    {documents.totals.files === 0 ? (
                      <span>No files uploaded yet</span>
                    ) : documents.totals.readable === documents.totals.files ? (
                      <span className="is-good">Every file extracted</span>
                    ) : (
                      <span className="is-warn">
                        {documents.totals.files - documents.totals.readable} still unreadable
                      </span>
                    )}
                  </div>
                  <div className="pm-client-stat">
                    <small>Contacts</small>
                    <strong>{contacts.length}</strong>
                    {contacts.length === 0 ? (
                      <span>Nobody on file</span>
                    ) : (
                      <span className={overview.contactsWithAccess.length === contacts.length ? "is-good" : "is-warn"}>
                        {overview.contactsWithAccess.length} can open a project
                      </span>
                    )}
                  </div>
                  <div className="pm-client-stat">
                    <small>Delivered</small>
                    <strong>{overview.delivered.length}</strong>
                    <span>
                      {overview.failed.length > 0
                        ? `${overview.failed.length} failed run${overview.failed.length === 1 ? "" : "s"}`
                        : "No failed runs"}
                    </span>
                  </div>
                  <div className="pm-client-stat">
                    <small>Last activity</small>
                    <strong style={{ fontSize: 17 }}>{relativeWhen(overview.lastActivityAt)}</strong>
                    <span>Across projects and documents</span>
                  </div>
                </div>
              </Card>

              {/* Leads the column when there is something wrong: the overview exists to tell a PM
                  what to do next, and a wall of counters never does. */}
              <Card className="pm-tab-panel pm-tab-panel--padded">
                <SectionTitle
                  title="Needs attention"
                  subtitle="Gaps that stop agents or the client from getting on with it."
                />
                <div className="pm-client-attention" style={{ marginTop: 14 }}>
                  {attention.length === 0 ? (
                    <div className="pm-client-attention-row" data-tone="good">
                      <span className="pm-client-attention-icon">
                        <IconCheckCircle size={14} />
                      </span>
                      <div className="pm-client-attention-copy">
                        <strong>Nothing outstanding</strong>
                        <span>
                          Contacts, documents and projects are all in a state agents can work from.
                        </span>
                      </div>
                      <span />
                    </div>
                  ) : (
                    attention.map((item) => (
                      <div key={item.id} className="pm-client-attention-row" data-tone={item.tone}>
                        <span className="pm-client-attention-icon">{item.icon}</span>
                        <div className="pm-client-attention-copy">
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                        </div>
                        {item.action ? (
                          <Button size="sm" variant="ghost" onClick={item.action.run}>
                            {item.action.label}
                          </Button>
                        ) : (
                          <span />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {projects.length > 0 && (
                <Card className="pm-tab-panel pm-tab-panel--padded">
                  <SectionTitle
                    title="Delivery pipeline"
                    subtitle="How far each piece of work has actually got."
                  />
                  <div className="pm-client-pipeline" style={{ marginTop: 16 }}>
                    {overview.pipeline.slice(0, 5).map((project) => {
                      const view = pipelineView(project.status);
                      return (
                        <div key={project.id} className="pm-client-pipeline-row">
                          <div className="pm-client-pipeline-head">
                            <strong>{project.companyName}</strong>
                            <Badge tone={view.tone}>{view.label}</Badge>
                            <span className="pm-client-pipeline-stage">{view.stage}</span>
                          </div>
                          <div className="pm-client-pipeline-track">
                            <span
                              style={{
                                width: `${view.progress}%`,
                                background: pipelineFill(view.tone),
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {projects.length > 5 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ marginTop: 14, marginLeft: -12 }}
                      onClick={() => setTab("projects")}
                    >
                      View all {projects.length} projects
                    </Button>
                  )}
                </Card>
              )}

              {overview.timeline.length > 0 && (
                <Card className="pm-tab-panel pm-tab-panel--padded">
                  <SectionTitle
                    title="Recent activity"
                    subtitle="The last things to move on this account."
                  />
                  <div className="pm-client-timeline" style={{ marginTop: 10 }}>
                    {overview.timeline.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className="pm-client-timeline-row"
                        onClick={() => router.push(entry.href)}
                      >
                        <span className="pm-client-timeline-icon">
                          {entry.kind === "project" ? <IconFolder size={14} /> : <IconFileText size={14} />}
                        </span>
                        <span className="pm-client-timeline-copy">
                          <strong>{entry.title}</strong>
                          <small>{entry.detail}</small>
                        </span>
                        <span className="pm-client-timeline-when" title={formatBackendDate(entry.at)}>
                          {relativeWhen(entry.at)}
                        </span>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Notes used to render only when they already existed, which left no way to write
                  the first one from the console. */}
              <Card className="pm-tab-panel pm-tab-panel--padded">
                <SectionTitle
                  title="Notes"
                  subtitle="Internal context for your team. The client never sees this."
                />
                <Textarea
                  key={client.notes ?? ""}
                  defaultValue={client.notes ?? ""}
                  disabled={busy}
                  rows={4}
                  placeholder="How this relationship works, who decides, anything the next PM should know."
                  style={{ marginTop: 14 }}
                  onBlur={(event) =>
                    event.target.value !== (client.notes ?? "") &&
                    void run(() => updateDevFlowClient(client.id, { notes: event.target.value }))
                  }
                />
              </Card>
            </div>

            <div className="pm-client-overview-stack">
              <Card className="pm-tab-panel pm-tab-panel--padded">
                <SectionTitle title="Details" subtitle="Used to match inbound inquiries to this client." />
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  <Field label="Primary contact name">
                    <Input
                      defaultValue={client.primaryContactName ?? ""}
                      disabled={busy}
                      onBlur={(event) =>
                        event.target.value !== (client.primaryContactName ?? "") &&
                        void run(() => updateDevFlowClient(client.id, { primaryContactName: event.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Primary contact email">
                    <Input
                      type="email"
                      defaultValue={client.primaryContactEmail ?? ""}
                      disabled={busy}
                      onBlur={(event) =>
                        event.target.value !== (client.primaryContactEmail ?? "") &&
                        void run(() => updateDevFlowClient(client.id, { primaryContactEmail: event.target.value }))
                      }
                    />
                  </Field>
                  <Field
                    label="Workspace"
                    helper="The team that delivers for this client. Moving it moves the client out of your current list."
                  >
                    <WorkspaceSelect
                      value={client.groupId}
                      disabled={busy}
                      onSelect={(groupId) =>
                        groupId !== client.groupId &&
                        void run(() => updateDevFlowClient(client.id, { groupId }))
                      }
                    />
                  </Field>
                </div>
              </Card>

              <Card className="pm-tab-panel pm-tab-panel--padded">
                <SectionTitle title="Relationship" subtitle="Facts about the account itself." />
                <div className="pm-client-facts" style={{ marginTop: 10 }}>
                  <div className="pm-client-fact">
                    <span>Added</span>
                    <strong>{formatBackendDate(client.createdAt)}</strong>
                  </div>
                  <div className="pm-client-fact">
                    <span>Last activity</span>
                    <strong>
                      {overview.lastActivityAt ? formatBackendDate(overview.lastActivityAt) : "No activity yet"}
                    </strong>
                  </div>
                  <div className="pm-client-fact">
                    <span>Record updated</span>
                    <strong>{formatBackendDate(client.updatedAt)}</strong>
                  </div>
                  {client.createdBy && (
                    <div className="pm-client-fact">
                      <span>Added by</span>
                      <strong>{client.createdBy.fullName || client.createdBy.email}</strong>
                    </div>
                  )}
                  <div className="pm-client-fact">
                    <span>Stacks in use</span>
                    <strong>{overview.stacks.length > 0 ? overview.stacks.join(", ") : "None yet"}</strong>
                  </div>
                  <div className="pm-client-fact">
                    <span>Projects with documents</span>
                    <strong>
                      {overview.documentedCount}/{projects.length}
                    </strong>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* The conversation's home. It used to sit inside whichever project happened to be open,
            which meant the second engagement with a company started from an empty thread while
            everything ever said sat in the first project's tab. */}
        {tab === "messages" && (
          <ConversationPanel
            scope={conversationScope}
            title="Client conversation"
            subtitle={`Threads with ${client.name}. Not tied to a project — this carries on between builds.`}
            participantsLabel="Project manager and client"
            defaultVisibility="CLIENT"
            defaultCategory="GENERAL"
            emptyText="No threads with this client yet. Start one to ask for what you need, or to send an update."
            newThreadTitle={`Start a thread with ${client.name}`}
            newThreadHint="The client's contacts can read and reply to this. Keep project-specific delivery chatter on the project instead."
            noScopeText="This client is unavailable."
          />
        )}

        {tab === "projects" && (
          <Card className="pm-tab-panel">
            <div className="pm-tab-header" style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
              <SectionTitle title="Projects" subtitle="Delivery work for this client." />
              <Button size="sm" icon={<IconPlus size={13} />} onClick={async () => {
                setLinkOpen(true);
                // Loaded on open rather than with the page: moving a project between clients is
                // rare, and the full project list is not worth fetching on every visit.
                const all = await listDevFlowProjects().catch(() => []);
                setMovable(all.filter((project) => project.client?.id !== clientId));
              }}>
                Link a project
              </Button>
            </div>
            {projects.length === 0 ? (
              <div className="pm-tab-empty">
                Nothing yet. Link an existing project, or approve an inquiry from this client to
                open a discovery space and start collecting documents.
              </div>
            ) : (
              <div className="pm-tab-list">
                {projects.map((project) => (
                  <div key={project.id} className="pm-tab-list-row">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 650, fontSize: 13.5 }}>{project.companyName}</div>
                      <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>
                        {project.stackKey} · updated {formatBackendDate(project.updatedAt)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      {/* Discovery reads as what it is — waiting on the client — rather than as
                          another delivery status the PM has to decode. */}
                      {project.status === "DISCOVERY" ? (
                        <Badge tone="amber">in discovery</Badge>
                      ) : (
                        <Badge tone="gray">{project.status.toLowerCase()}</Badge>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => router.push(`/pm/project/${project.id}`)}>
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void run(() => setDevFlowProjectClient(project.id, null))}
                      >
                        Unlink
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {tab === "documents" && (
          <Card className="pm-tab-panel">
            <div className="pm-tab-header" style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
              <SectionTitle
                title="Documents"
                subtitle="Everything this client has provided, across all their projects."
              />
              <Badge tone={documents.totals.readable ? "green" : "gray"}>
                {documents.totals.readable}/{documents.totals.files} readable
              </Badge>
            </div>
            <div className="pm-document-summary">
              Documents stay attached to the project they belong to. This is a read-only rollup —
              upload and review them from each project&apos;s Client documents tab.
            </div>
            {documents.groups.length === 0 ? (
              <div className="pm-tab-empty">No documents from this client yet.</div>
            ) : (
              documents.groups.map((group) => (
                <div key={group.projectId}>
                  <button
                    type="button"
                    className="pm-client-doc-group"
                    onClick={() => router.push(`/pm/project/${group.projectId}?tab=documents`)}
                  >
                    <IconFileText size={13} />
                    <span>{group.projectName}</span>
                    <span className="pm-client-doc-count">{group.documents.length}</span>
                  </button>
                  <div className="pm-tab-list">
                    {group.documents.map((document) => {
                      const badge = extractionBadge(document);
                      return (
                        <div key={document.id} className="pm-tab-list-row">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 650, fontSize: 13.5, overflowWrap: "anywhere" }}>
                              {document.title}
                            </div>
                            <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>
                              {[document.fileName, formatBackendDate(document.updatedAt)]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <Badge tone={badge.tone}>{badge.label}</Badge>
                            <Badge tone={document.clientVisible ? "blue" : "gray"}>
                              {document.clientVisible ? "Client can see" : "Team only"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </Card>
        )}

        {tab === "contacts" && (
          <Card className="pm-tab-panel">
            <div className="pm-tab-header" style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
              <SectionTitle title="Contacts" subtitle="People who work for this client." />
              <Button size="sm" icon={<IconPlus size={13} />} onClick={() => void openContactPicker()}>
                Add contact
              </Button>
            </div>
            <div className="pm-document-summary">
              Listing someone here does not grant access. A contact can only open a project if they
              are a member of it — the access column below shows what each person can actually reach.
            </div>
            {contacts.length === 0 ? (
              <div className="pm-tab-empty">No contacts recorded for this client.</div>
            ) : (
              <div className="pm-tab-list">
                {contacts.map((contact) => (
                  <div key={contact.id} className="pm-tab-list-row">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 650, fontSize: 13.5 }}>
                        {contact.profile.fullName || contact.profile.email}
                        {contact.isPrimary && <Badge tone="blue" style={{ marginLeft: 8 }}>Primary</Badge>}
                      </div>
                      <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>
                        {contact.profile.email}
                      </div>
                      <div style={{ fontSize: 11.5, marginTop: 5, color: contact.hasProjectAccess ? "var(--text-2)" : "#FCD34D" }}>
                        {contact.hasProjectAccess
                          ? `Can open: ${contact.accessibleProjects.map((project) => project.name).join(", ")}`
                          : "Cannot open any project yet — add them as a project member to grant access."}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void run(() => removeDevFlowClientContact(client.id, contact.id))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </section>

      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="Link a project to this client">
        <div style={{ display: "grid", gap: 12 }}>
          {movable.length === 0 ? (
            <p style={{ color: "var(--text-2)", fontSize: 13, margin: 0 }}>
              There are no other projects to move here.
            </p>
          ) : (
            <Field
              label="Project to move"
              helper="Moving a project reassigns it from its current client to this one."
            >
              <Select value={linkProjectId} onChange={(event) => setLinkProjectId(event.target.value)}>
                <option value="">Select a project</option>
                {movable.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.companyName}{project.client ? ` — currently ${project.client.name}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button
              disabled={!linkProjectId || busy}
              onClick={async () => {
                await run(() => setDevFlowProjectClient(linkProjectId, client.id));
                setLinkProjectId("");
                setLinkOpen(false);
              }}
            >
              Link project
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title="Add a contact">
        <div style={{ display: "grid", gap: 12 }}>
          {candidates.length === 0 ? (
            <p style={{ color: "var(--text-2)", fontSize: 13, margin: 0 }}>
              No client accounts exist yet. A contact appears here once they have signed up through
              the client application.
            </p>
          ) : (
            <Field label="Person" helper="Client accounts only. This records who they work for; it does not grant project access.">
              <Select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}>
                <option value="">Select a person</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.fullName ? `${candidate.fullName} (${candidate.email})` : candidate.email}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button
              disabled={!candidateId || busy}
              onClick={async () => {
                await run(() => addDevFlowClientContact(client.id, { profileId: candidateId }));
                setCandidateId("");
                setContactOpen(false);
              }}
            >
              Add contact
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Moves a client to another team workspace.
 *
 * Every client has a workspace — the column is NOT NULL — so this is a move, never a clear, and
 * the control has no empty option. Moving takes the client out of the current workspace's list,
 * which the helper text says plainly: the alternative is a PM wondering where it went.
 */
function WorkspaceSelect({
  value,
  disabled,
  onSelect,
}: {
  value: string;
  disabled?: boolean;
  onSelect: (groupId: string) => void;
}) {
  const { teams, teamsLoading } = useSelectedTeamWorkspace();

  if (teamsLoading) return <Input value="Loading workspaces..." disabled readOnly />;

  return (
    <Select value={value} disabled={disabled} onChange={(event) => onSelect(event.target.value)}>
      {/* A client can sit in a workspace this member cannot see; keep it selectable-looking
          rather than silently snapping the dropdown to the first option. */}
      {!teams.some((team) => team.id === value) && (
        <option value={value}>Current workspace</option>
      )}
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.name}{team.status === "ARCHIVED" ? " (Archived)" : ""}
        </option>
      ))}
    </Select>
  );
}
