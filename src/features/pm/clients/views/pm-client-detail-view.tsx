"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Modal, Select } from "@/shared/components/ui";
import { IconArrowLeft, IconExternalLink, IconFileText, IconPlus } from "@/shared/components/icons";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";
import { compactBackendError, formatBackendDate } from "@/features/pm/projects/utils/pm-project-detail.utils";
import { PMClientSubnav, type PMClientSectionId } from "../components/pm-client-subnav";
import { useDevFlowClientWorkspace } from "@/shared/hooks/use-devflow-clients";
import {
  addDevFlowClientContact,
  getDevFlowClientContactCandidates,
  removeDevFlowClientContact,
  setDevFlowProjectClient,
  updateDevFlowClient,
  type DevFlowClientStatus,
  type DevFlowProfile,
} from "@/shared/api/devflow-api";

const STATUS_TONE: Record<DevFlowClientStatus, "green" | "blue" | "gray"> = {
  ACTIVE: "green",
  PROSPECT: "blue",
  ARCHIVED: "gray",
};

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
  const { client, projects, documents, contacts, unassignedProjects, loading, error, refresh } =
    useDevFlowClientWorkspace(clientId);
  const [tab, setTab] = useState<PMClientSectionId>("overview");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const [linkOpen, setLinkOpen] = useState(false);
  const [linkProjectId, setLinkProjectId] = useState("");

  const [contactOpen, setContactOpen] = useState(false);
  const [candidates, setCandidates] = useState<DevFlowProfile[]>([]);
  const [candidateId, setCandidateId] = useState("");

  const counts = useMemo(
    () => ({ projects: projects.length, documents: documents.totals.documents, contacts: contacts.length }),
    [projects.length, documents.totals.documents, contacts.length],
  );

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
        onSelect={setTab}
      />

      <div className="pm-project-workspace-main">
        <div className="pm-tab-header" style={{ marginBottom: 16 }}>
          <div>
            <Button variant="ghost" size="sm" icon={<IconArrowLeft size={13} />} onClick={() => router.push("/pm/clients")}>
              All clients
            </Button>
            <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>{client.name}</h1>
            <div style={{ color: "var(--text-2)", fontSize: 13 }}>
              {client.primaryContactName || client.primaryContactEmail || "No primary contact recorded"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
            <Card className="pm-tab-panel pm-tab-panel--padded">
              <SectionTitle title="At a glance" subtitle="What this client currently has with you." />
              <div className="pm-tab-stat-grid" style={{ marginTop: 14 }}>
                <Card className="pm-tab-panel pm-tab-panel--padded">
                  <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>Projects</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{projects.length}</div>
                </Card>
                <Card className="pm-tab-panel pm-tab-panel--padded">
                  <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>Documents</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{documents.totals.documents}</div>
                </Card>
                <Card className="pm-tab-panel pm-tab-panel--padded">
                  <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>Readable by agents</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{documents.totals.readable}</div>
                </Card>
                <Card className="pm-tab-panel pm-tab-panel--padded">
                  <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>Contacts</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{contacts.length}</div>
                </Card>
              </div>
              {client.notes && (
                <div style={{ marginTop: 18 }}>
                  <SectionTitle title="Notes" />
                  <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{client.notes}</p>
                </div>
              )}
            </Card>

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
                    defaultValue={client.primaryContactEmail ?? ""}
                    disabled={busy}
                    onBlur={(event) =>
                      event.target.value !== (client.primaryContactEmail ?? "") &&
                      void run(() => updateDevFlowClient(client.id, { primaryContactEmail: event.target.value }))
                    }
                  />
                </Field>
                <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>
                  Added {formatBackendDate(client.createdAt)}
                </div>
              </div>
            </Card>
          </div>
        )}

        {tab === "projects" && (
          <Card className="pm-tab-panel">
            <div className="pm-tab-header" style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
              <SectionTitle title="Projects" subtitle="Delivery work for this client." />
              <Button size="sm" icon={<IconPlus size={13} />} onClick={() => setLinkOpen(true)}>
                Link a project
              </Button>
            </div>
            {projects.length === 0 ? (
              <div className="pm-tab-empty">
                No projects yet. Link an existing project, or approve an inquiry from this client.
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
                      <Badge tone="gray">{project.status.toLowerCase()}</Badge>
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
      </div>

      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="Link a project to this client">
        <div style={{ display: "grid", gap: 12 }}>
          {unassignedProjects.length === 0 ? (
            <p style={{ color: "var(--text-2)", fontSize: 13, margin: 0 }}>
              Every project already belongs to a client. To move one, unlink it from its current
              client first.
            </p>
          ) : (
            <Field label="Unassigned project" helper="Only projects without a client are listed.">
              <Select value={linkProjectId} onChange={(event) => setLinkProjectId(event.target.value)}>
                <option value="">Select a project</option>
                {unassignedProjects.map((project) => (
                  <option key={project.id} value={project.id}>{project.companyName}</option>
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
