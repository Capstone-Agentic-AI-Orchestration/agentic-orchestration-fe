"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Modal, Textarea } from "@/shared/components/ui";
import { IconCheck, IconClose, IconMail, IconRefresh } from "@/shared/components/icons";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";
import { compactBackendError, formatBackendDate } from "@/features/pm/projects/utils/pm-project-detail.utils";
import { useDevFlowInquiries } from "@/shared/hooks/use-devflow-inquiries";
import { useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";
import {
  approveDevFlowInquiry,
  getDevFlowInquiryClientSuggestions,
  rejectDevFlowInquiry,
  sendDevFlowInquiryAccountInvite,
  type DevFlowInquiry,
  type DevFlowClientIntakePayload,
  type DevFlowClientSuggestion,
  type DevFlowInquiryStatus,
  type DevFlowIntakeInterviewTopicId,
} from "@/shared/api/devflow-api";

/** What the assistant asked, phrased as a project manager would describe the question. */
const REQUEST_TOPIC_LABELS: Record<DevFlowIntakeInterviewTopicId, string> = {
  goal: "What it is for",
  users: "Who uses it",
  musthaves: "What it must do",
  boundaries: "Connections, exclusions and timing",
};

const STATUS_TONE: Record<DevFlowInquiryStatus, "blue" | "green" | "red" | "amber"> = {
  NEW: "blue",
  IN_DISCOVERY: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

const STATUS_LABEL: Record<DevFlowInquiryStatus, string> = {
  NEW: "new",
  IN_DISCOVERY: "in discovery",
  APPROVED: "delivering",
  REJECTED: "declined",
};

const FILTERS: Array<{ id: DevFlowInquiryStatus | "ALL"; label: string }> = [
  { id: "NEW", label: "New" },
  { id: "IN_DISCOVERY", label: "In discovery" },
  { id: "APPROVED", label: "Delivering" },
  { id: "REJECTED", label: "Declined" },
  { id: "ALL", label: "All" },
];

export function PMInquiriesView() {
  const router = useRouter();
  const [filter, setFilter] = useState<DevFlowInquiryStatus | "ALL">("NEW");
  const { inquiries, loading, error, refresh } = useDevFlowInquiries(filter);
  // The switcher's current workspace is where an approved lead lands. Read here rather than added
  // as another picker in the modal: a PM already chose a workspace to be working in.
  const { selectedTeamId, selectedTeam } = useSelectedTeamWorkspace();

  const [active, setActive] = useState<DevFlowInquiry | null>(null);
  const [suggestions, setSuggestions] = useState<DevFlowClientSuggestion[]>([]);
  const [chosenClientId, setChosenClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [placeholderCompany, setPlaceholderCompany] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [emailingId, setEmailingId] = useState("");

  const openReview = async (inquiry: DevFlowInquiry) => {
    setActive(inquiry);
    setChosenClientId("");
    setNote("");
    setActionError("");
    setSuggestions([]);
    setPlaceholderCompany(false);
    // Fall back to the raw company name so the field is never blank while suggestions load.
    setNewClientName(inquiry.companyName);
    try {
      const result = await getDevFlowInquiryClientSuggestions(inquiry.id);
      setSuggestions(result.suggestions);
      setPlaceholderCompany(result.companyNameIsPlaceholder);
      setNewClientName(result.suggestedName ?? (result.companyNameIsPlaceholder ? "" : inquiry.companyName));
    } catch {
      // Suggestions are an aid, not a requirement: approving still works without them.
      setSuggestions([]);
    }
  };

  const decide = async (approved: boolean) => {
    if (!active) return;
    setBusy(true);
    setActionError("");
    try {
      if (approved) {
        // The workspace is required: approval creates a client and a project, and both belong to a
        // team. It was never sent, so every approval failed validation before reaching the service.
        if (!selectedTeamId) {
          setActionError("Pick a team workspace first — an approved lead has to belong to one.");
          return;
        }
        const result = await approveDevFlowInquiry(active.id, {
          reviewNote: note.trim() || undefined,
          groupId: selectedTeamId,
          clientId: chosenClientId || undefined,
          clientName: chosenClientId ? undefined : newClientName.trim() || undefined,
        });
        setNotice(
          result.accountInvitation?.message
            ?? "Discovery opened. Talk to the client and gather documents, then start delivery.",
        );
      } else {
        await rejectDevFlowInquiry(active.id, { reviewNote: note.trim() || undefined });
        setNotice("Inquiry declined.");
      }
      setActive(null);
      await refresh();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  const sendAccountEmail = async (inquiry: DevFlowInquiry) => {
    setEmailingId(inquiry.id);
    setActionError("");
    setNotice("");
    try {
      const delivery = await sendDevFlowInquiryAccountInvite(inquiry.id);
      setNotice(delivery.message);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setEmailingId("");
    }
  };

  return (
    <div className="pm-clients-view">
      <div className="pm-tab-header" style={{ marginBottom: 16 }}>
        <SectionTitle
          title="Inquiries"
          subtitle="Inbound leads. Accepting one opens a discovery space with the client; delivery starts later."
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div className="pm-intake-step-tabs" style={{ borderBottom: 0, marginBottom: 4 }}>
          {FILTERS.map((option) => (
            <Button
              key={option.id}
              size="sm"
              variant={filter === option.id ? "primary" : "ghost"}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={<IconRefresh size={13} className={loading ? "spin" : undefined} />}
          disabled={loading}
          onClick={() => void refresh()}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">{compactBackendError(error)}</Card>
      )}
      {actionError && (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">{compactBackendError(actionError)}</Card>
      )}
      {notice && (
        <Card className="pm-tab-panel pm-tab-message">{notice}</Card>
      )}

      {loading && inquiries.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">Loading inquiries...</Card>
      ) : inquiries.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">
          {filter === "NEW" && "No new inquiries waiting for review."}
          {filter === "IN_DISCOVERY" && "No leads are in discovery right now."}
          {filter !== "NEW" && filter !== "IN_DISCOVERY" && "No inquiries match this filter."}
        </Card>
      ) : (
        <Card className="pm-tab-panel">
          <div className="pm-tab-list">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="pm-tab-list-row">
                <span className="pm-document-icon pm-document-icon--file" aria-hidden="true">
                  <IconMail size={15} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 650, fontSize: 13.5 }}>{inquiry.companyName}</div>
                  <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 3 }}>
                    {inquiry.contactName} · {inquiry.email} · {formatBackendDate(inquiry.createdAt)}
                  </div>
                  <div style={{ color: "var(--text-2)", fontSize: 12.5, marginTop: 6, lineHeight: 1.5 }}>
                    {inquiry.brief.length > 180 ? `${inquiry.brief.slice(0, 180)}...` : inquiry.brief}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <Badge tone={STATUS_TONE[inquiry.status]}>{STATUS_LABEL[inquiry.status]}</Badge>
                  {inquiry.status === "NEW" ? (
                    <Button size="sm" onClick={() => void openReview(inquiry)}>Review</Button>
                  ) : (
                    <>
                      {inquiry.status === "APPROVED" && inquiry.clientInvite?.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={emailingId === inquiry.id}
                          onClick={() => void sendAccountEmail(inquiry)}
                        >
                          {emailingId === inquiry.id ? "Sending..." : "Send account email"}
                        </Button>
                      )}
                      {inquiry.approvedProjectId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/pm/project/${inquiry.approvedProjectId}`)}
                        >
                          {inquiry.status === "IN_DISCOVERY" ? "Open discovery" : "Open project"}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active ? `Review inquiry from ${active.companyName}` : "Review inquiry"}
        // Wider than the 520 default: this dialog carries a brief, a client picker and a note,
        // and the decision buttons carry real verbs rather than "OK".
        width={640}
        footer={
          active && (
            <div className="pm-inquiry-actions">
              {/* States what Accept does, so the button label can stay short enough to fit
                  without hiding that approval also emails the client. */}
              <p className="pm-inquiry-actions-note">
                Accepting opens a discovery space and emails the client an account invite. No
                delivery work starts until you choose to begin it.
              </p>
              <Button variant="ghost" disabled={busy} onClick={() => setActive(null)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                icon={<IconClose size={13} />}
                disabled={busy}
                onClick={() => void decide(false)}
              >
                Decline
              </Button>
              <Button
                icon={<IconCheck size={13} />}
                disabled={busy || !selectedTeamId || (!chosenClientId && !newClientName.trim())}
                onClick={() => void decide(true)}
              >
                {busy ? "Working..." : "Accept and open discovery"}
              </Button>
            </div>
          )
        }
      >
        {active && (
          <div className="pm-inquiry-review">
            <Card style={{ padding: 14 }}>
              <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>
                {active.contactName} · {active.email}
                {active.phone ? ` · ${active.phone}` : ""}
              </div>
              <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.6, margin: "8px 0 0" }}>
                {active.brief}
              </p>
              <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 10 }}>
                {[active.budgetRange, active.timeline, active.stackKey].filter(Boolean).join(" · ")}
              </div>
            </Card>

            {/* A guided request arrives with its scope already agreed with the client. Approving it
                without reading that would be approving a sentence -- and these answers are copied
                into the project's intake on approval, so this is the last point before they become
                the thing agents build from. A marketing-form lead has no payload and shows nothing. */}
            {active.payload && <InquiryBrief payload={active.payload} />}

            <div>
              <SectionTitle
                title="File under a client"
                subtitle="Pick an existing client so a repeat customer's projects stay together."
              />
              <div className="pm-inquiry-client-options">
                {/* The name field lives inside its option rather than in a card seamed below it,
                    so the choice and the value it needs read as one control. */}
                <div className={`pm-inquiry-client-option${chosenClientId === "" ? " is-active" : ""}`}>
                  <button
                    type="button"
                    className="pm-inquiry-client-choice"
                    aria-pressed={chosenClientId === ""}
                    onClick={() => setChosenClientId("")}
                  >
                    <strong>Create a new client</strong>
                    <span>
                      {placeholderCompany
                        ? `This lead sent "${active.companyName}", which is a placeholder rather than a company name.`
                        : "A client with the name below will be created if none already matches."}
                    </span>
                  </button>

                  {chosenClientId === "" && (
                    <div className="pm-inquiry-client-name">
                      <Field
                        label="Client name"
                        helper={
                          placeholderCompany
                            ? "Taken from the contact's email domain where possible. Check it against the brief."
                            : "Edit if the company gave an abbreviated or misspelled name."
                        }
                        error={!newClientName.trim() ? "A client name is required to approve." : undefined}
                      >
                        <Input
                          value={newClientName}
                          onChange={(event) => setNewClientName(event.target.value)}
                          placeholder="Northwind Traders"
                        />
                      </Field>
                    </div>
                  )}
                </div>

                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`pm-inquiry-client-option${chosenClientId === suggestion.id ? " is-active" : ""}`}
                  >
                    <button
                      type="button"
                      className="pm-inquiry-client-choice"
                      aria-pressed={chosenClientId === suggestion.id}
                      onClick={() => setChosenClientId(suggestion.id)}
                    >
                      <strong>{suggestion.name}</strong>
                      <span>{suggestion.reason}</span>
                    </button>
                  </div>
                ))}
              </div>
              {suggestions.length === 0 && !placeholderCompany && (
                <p style={{ color: "var(--text-3)", fontSize: 11.5, margin: "8px 0 0" }}>
                  No existing client looks like a match.
                </p>
              )}
            </div>

            {/* Named, not silent. Approval files a real company into a real team, and a PM whose
                switcher is on the wrong workspace would otherwise only find out afterwards. */}
            <div className="pm-inquiry-workspace">
              <span>Filed into</span>
              <strong>{selectedTeam?.name ?? "No workspace selected"}</strong>
              {!selectedTeamId && <small>Choose one in the workspace switcher before approving.</small>}
            </div>

            <Field label="Review note" helper="Shared with the client on approval or rejection.">
              <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>

            {actionError && <div className="field-error">{compactBackendError(actionError)}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}


/**
 * The scope a client agreed with the assistant, shown before a project manager approves it.
 *
 * A short read rather than the full one-page brief that lives on a project: at this moment the
 * decision is whether to take the work on, and the whole brief is one click away the instant the
 * project exists. What it must not do is hide that a scope exists at all -- approving copies these
 * answers into the project's intake, and they become what the agents build from.
 */
function InquiryBrief({ payload }: Readonly<{ payload: DevFlowClientIntakePayload }>) {
  const mustHaves = payload.features
    .filter((feature) => feature.priority === "MUST_HAVE")
    .map((feature) => feature.title)
    .filter(Boolean);

  const unparsed = Object.entries(payload.unparsedReplies ?? {}).filter(
    (entry): entry is [DevFlowIntakeInterviewTopicId, string] => Boolean(entry[1]?.trim()),
  );

  return (
    <div>
      <SectionTitle
        title="What they asked for"
        subtitle="Answered with the assistant before this was sent. Approving copies it into the project's requirements."
      />
      <Card style={{ padding: 14 }}>
        <dl className="pm-inquiry-brief">
          <BriefFact label="What it is for" value={payload.overview.businessGoal} />
          <BriefFact label="Success looks like" value={payload.overview.successMeasures} />
          <BriefFact label="Who uses it" value={payload.roles.map((role) => role.name).filter(Boolean)} />
          <BriefFact label="Must be able to" value={mustHaves} />
          <BriefFact
            label="Connects to"
            value={payload.dataAndIntegrations.integrations.map((item) => item.name).filter(Boolean)}
          />
          <BriefFact label="Not included" value={payload.experienceAndDelivery.outOfScope} />
          <BriefFact label="Wanted by" value={payload.overview.targetLaunch} />
        </dl>

        {/* Answers the assistant could not file under a heading. Without these the rows above look
            unanswered, and a PM would go and ask again for something the client already told us. */}
        {unparsed.length > 0 && (
          <div className="pm-inquiry-brief__unparsed">
            <strong>In their own words</strong>
            {unparsed.map(([topicId, reply]) => (
              <p key={topicId}>
                <span>{REQUEST_TOPIC_LABELS[topicId] ?? topicId}</span>
                {reply}
              </p>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function BriefFact({ label, value }: Readonly<{ label: string; value: string | string[] }>) {
  const items = Array.isArray(value) ? value.filter((item) => item.trim()) : [];
  const text = Array.isArray(value) ? "" : value.trim();
  const answered = Array.isArray(value) ? items.length > 0 : Boolean(text);

  return (
    <div className="pm-inquiry-brief__row" data-answered={answered ? "true" : "false"}>
      <dt>{label}</dt>
      <dd>{answered ? (Array.isArray(value) ? items.join(" · ") : text) : "Not discussed"}</dd>
    </div>
  );
}
