"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { IconAlertTriangle, IconChevronRight, IconPlus, IconSearch } from "@/shared/components/icons";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";
import { compactBackendError, formatBackendDate } from "@/features/pm/projects/utils/pm-project-detail.utils";
import { useDevFlowClients } from "@/shared/hooks/use-devflow-clients";
import { createDevFlowClient, type DevFlowClientStatus } from "@/shared/api/devflow-api";

const STATUS_TONE: Record<DevFlowClientStatus, "green" | "blue" | "gray"> = {
  ACTIVE: "green",
  PROSPECT: "blue",
  ARCHIVED: "gray",
};

const EMPTY_FORM = { name: "", primaryContactName: "", primaryContactEmail: "", notes: "", status: "ACTIVE" as DevFlowClientStatus };

export function PMClientsView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { clients, unassignedProjectCount, loading, error } = useDevFlowClients(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setFormError("");
    try {
      const client = await createDevFlowClient({
        name: form.name.trim(),
        status: form.status,
        primaryContactName: form.primaryContactName.trim() || undefined,
        primaryContactEmail: form.primaryContactEmail.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm(EMPTY_FORM);
      setCreateOpen(false);
      router.push(`/pm/clients/${client.id}`);
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pm-clients-view">
      <div className="pm-tab-header" style={{ marginBottom: 16 }}>
        <SectionTitle
          title="Clients"
          subtitle="Every company you deliver for. Each client owns its projects, documents, and contacts."
        />
        <Button icon={<IconPlus size={13} />} onClick={() => setCreateOpen(true)}>
          New client
        </Button>
      </div>

      <div className="pm-clients-search">
        <IconSearch size={14} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search clients by name"
          aria-label="Search clients"
        />
      </div>

      {unassignedProjectCount > 0 && (
        <button type="button" className="pm-unassigned-banner" onClick={() => router.push("/pm/clients/unassigned")}>
          <span className="pm-unassigned-icon"><IconAlertTriangle size={15} /></span>
          <span className="pm-unassigned-copy">
            <strong>
              {unassignedProjectCount} project{unassignedProjectCount === 1 ? "" : "s"} without a client
            </strong>
            <span>They will not appear on any client page until you link them.</span>
          </span>
          <IconChevronRight size={15} />
        </button>
      )}

      {error && (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">{compactBackendError(error)}</Card>
      )}

      {loading && clients.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">Loading clients...</Card>
      ) : clients.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">
          {search.trim()
            ? `No clients match "${search.trim()}".`
            : "No clients yet. Create one, or approve an inquiry to create a client from a real lead."}
        </Card>
      ) : (
        <div className="pm-client-grid">
          {clients.map((client) => (
            <button
              key={client.id}
              type="button"
              className="pm-client-card"
              onClick={() => router.push(`/pm/clients/${client.id}`)}
            >
              <div className="pm-client-card-head">
                <span className="pm-client-avatar" aria-hidden="true">
                  {client.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <div className="pm-client-card-title">
                  <strong>{client.name}</strong>
                  <span>{client.primaryContactEmail || "No primary contact"}</span>
                </div>
                <Badge tone={STATUS_TONE[client.status]}>{client.status.toLowerCase()}</Badge>
              </div>
              <div className="pm-client-card-stats">
                <span>
                  <strong>{client.projectCount}</strong> project{client.projectCount === 1 ? "" : "s"}
                </span>
                <span>
                  <strong>{client.contactCount}</strong> contact{client.contactCount === 1 ? "" : "s"}
                </span>
                <span>
                  {client.lastProjectActivityAt
                    ? `Active ${formatBackendDate(client.lastProjectActivityAt)}`
                    : "No project activity"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New client">
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Company name" helper="The name you and the client both recognise.">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Acme Logistics"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as DevFlowClientStatus })}
            >
              <option value="ACTIVE">Active</option>
              <option value="PROSPECT">Prospect</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
          <Field label="Primary contact name">
            <Input
              value={form.primaryContactName}
              onChange={(event) => setForm({ ...form, primaryContactName: event.target.value })}
            />
          </Field>
          <Field label="Primary contact email" helper="Used to suggest this client when a matching inquiry arrives.">
            <Input
              value={form.primaryContactEmail}
              onChange={(event) => setForm({ ...form, primaryContactEmail: event.target.value })}
              placeholder="name@company.com"
            />
          </Field>
          <Field label="Notes">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Anything the delivery team should know about this client."
            />
          </Field>
          {formError && <div className="field-error">{compactBackendError(formError)}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!form.name.trim() || saving} onClick={() => void submit()}>
              {saving ? "Creating..." : "Create client"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
