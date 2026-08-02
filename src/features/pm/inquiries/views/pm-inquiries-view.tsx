"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Modal, Textarea } from "@/shared/components/ui";
import { IconCheck, IconClose, IconMail } from "@/shared/components/icons";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";
import { compactBackendError, formatBackendDate } from "@/features/pm/projects/utils/pm-project-detail.utils";
import { useDevFlowInquiries } from "@/shared/hooks/use-devflow-inquiries";
import {
  approveDevFlowInquiry,
  getDevFlowInquiryClientSuggestions,
  rejectDevFlowInquiry,
  type DevFlowInquiry,
  type DevFlowClientSuggestion,
  type DevFlowInquiryStatus,
} from "@/shared/api/devflow-api";

const STATUS_TONE: Record<DevFlowInquiryStatus, "blue" | "green" | "red"> = {
  NEW: "blue",
  APPROVED: "green",
  REJECTED: "red",
};

const FILTERS: Array<{ id: DevFlowInquiryStatus | "ALL"; label: string }> = [
  { id: "NEW", label: "New" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "ALL", label: "All" },
];

export function PMInquiriesView() {
  const router = useRouter();
  const [filter, setFilter] = useState<DevFlowInquiryStatus | "ALL">("NEW");
  const { inquiries, loading, error, refresh } = useDevFlowInquiries(filter);

  const [active, setActive] = useState<DevFlowInquiry | null>(null);
  const [suggestions, setSuggestions] = useState<DevFlowClientSuggestion[]>([]);
  const [chosenClientId, setChosenClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [placeholderCompany, setPlaceholderCompany] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

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
        await approveDevFlowInquiry(active.id, {
          reviewNote: note.trim() || undefined,
          clientId: chosenClientId || undefined,
          clientName: chosenClientId ? undefined : newClientName.trim() || undefined,
        });
      } else {
        await rejectDevFlowInquiry(active.id, { reviewNote: note.trim() || undefined });
      }
      setActive(null);
      await refresh();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pm-clients-view">
      <div className="pm-tab-header" style={{ marginBottom: 16 }}>
        <SectionTitle
          title="Inquiries"
          subtitle="Inbound leads. Approving one creates the project and files it under a client."
        />
      </div>

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

      {error && (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">{compactBackendError(error)}</Card>
      )}

      {loading && inquiries.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">Loading inquiries...</Card>
      ) : inquiries.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">
          {filter === "NEW"
            ? "No new inquiries waiting for review."
            : "No inquiries match this filter."}
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
                  <Badge tone={STATUS_TONE[inquiry.status]}>{inquiry.status.toLowerCase()}</Badge>
                  {inquiry.status === "NEW" ? (
                    <Button size="sm" onClick={() => void openReview(inquiry)}>Review</Button>
                  ) : (
                    inquiry.approvedProjectId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/pm/project/${inquiry.approvedProjectId}`)}
                      >
                        Open project
                      </Button>
                    )
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
      >
        {active && (
          <div style={{ display: "grid", gap: 14 }}>
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

            <div>
              <SectionTitle
                title="File under a client"
                subtitle="Pick an existing client so a repeat customer's projects stay together."
              />
              <div className="pm-inquiry-client-options">
                <button
                  type="button"
                  className={`pm-inquiry-client-option${chosenClientId === "" ? " is-active" : ""}`}
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
                          ? "Taken from the contact's email domain where possible. Check it against the brief before approving."
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
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className={`pm-inquiry-client-option${chosenClientId === suggestion.id ? " is-active" : ""}`}
                    onClick={() => setChosenClientId(suggestion.id)}
                  >
                    <strong>{suggestion.name}</strong>
                    <span>{suggestion.reason}</span>
                  </button>
                ))}
              </div>
              {suggestions.length === 0 && !placeholderCompany && (
                <p style={{ color: "var(--text-3)", fontSize: 11.5, margin: "8px 0 0" }}>
                  No existing client looks like a match.
                </p>
              )}
            </div>

            <Field label="Review note" helper="Shared with the client on approval or rejection.">
              <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>

            {actionError && <div className="field-error">{compactBackendError(actionError)}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="ghost" onClick={() => setActive(null)}>Cancel</Button>
              <Button
                variant="secondary"
                icon={<IconClose size={13} />}
                disabled={busy}
                onClick={() => void decide(false)}
              >
                Reject
              </Button>
              <Button
                icon={<IconCheck size={13} />}
                disabled={busy || (!chosenClientId && !newClientName.trim())}
                onClick={() => void decide(true)}
              >
                {busy ? "Working..." : "Approve and create project"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
