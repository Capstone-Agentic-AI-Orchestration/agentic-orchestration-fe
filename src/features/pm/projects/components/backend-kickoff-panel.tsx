// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Field, Textarea } from "@/shared/components/ui";
import { IconCheckCircle, IconClipboard, IconWorkflow } from "@/shared/components/icons";
import { SectionTitle, MiniStat } from "./pm-project-ui";
import { kickoffFormFromDetail, clientInviteSummary, compactBackendError, formatBackendDate } from "../utils/pm-project-detail.utils";
import { updateDevFlowProjectKickoff, createDevFlowKickoffTasks, createDevFlowKickoffWorkOrders } from "@/shared/api/devflow-api";

export function BackendKickoffPanel({ detail, tasks, workOrders, loading, error, onChanged }: Record<string, any>) {
  const kickoff = detail.kickoff || {};
  const [saving, setSaving] = useState(false);
  const [action, setAction] = useState("");
  const [kickoffError, setKickoffError] = useState("");
  const [form, setForm] = useState(() => kickoffFormFromDetail(kickoff, detail));

  useEffect(() => {
    setForm(kickoffFormFromDetail(detail.kickoff || {}, detail));
  }, [detail.id, detail.kickoff?.updatedAt]);

  const checklist = [
    { key: "scopeConfirmed", label: "Scope", body: form.scopeSummary || detail.brief },
    { key: "milestonesConfirmed", label: "Milestones", body: form.milestones || "No milestones saved" },
    { key: "documentsConfirmed", label: "Documents", body: form.requiredDocuments || "No required documents saved" },
    { key: "techStackConfirmed", label: "Stack", body: form.techStackNotes || detail.stackKey },
    { key: "rolesConfirmed", label: "Roles", body: form.deliveryRoles || `${detail.members.length} project member${detail.members.length === 1 ? "" : "s"}` },
    { key: "clientAccessConfirmed", label: "Client access", body: clientInviteSummary(detail.clientInvites) },
    { key: "initialTasksCreated", label: "Tasks", body: `${tasks.length} task${tasks.length === 1 ? "" : "s"}` },
    { key: "initialWorkOrdersCreated", label: "Work orders", body: `${workOrders.length} work order${workOrders.length === 1 ? "" : "s"}` },
  ];
  const completed = checklist.filter((item) => form[item.key]).length;
  const ready = kickoff.status === "READY" || kickoff.status === "LOCKED";

  const setValue = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));

  const saveKickoff = async () => {
    setSaving(true); setKickoffError("");
    try { await updateDevFlowProjectKickoff(detail.id, form); await onChanged?.(); }
    catch (e) { setKickoffError(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };

  const createStarterTasks = async () => {
    setAction("tasks"); setKickoffError("");
    try { await createDevFlowKickoffTasks(detail.id); await onChanged?.(); }
    catch (e) { setKickoffError(e instanceof Error ? e.message : String(e)); }
    finally { setAction(""); }
  };

  const createStarterWorkOrders = async () => {
    setAction("work-orders"); setKickoffError("");
    try { await createDevFlowKickoffWorkOrders(detail.id); await onChanged?.(); }
    catch (e) { setKickoffError(e instanceof Error ? e.message : String(e)); }
    finally { setAction(""); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18 }}>
      <Card style={{ padding: 22 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <SectionTitle title="Project kickoff" subtitle={`${completed} of ${checklist.length} checks complete`} />
          <Badge tone={ready ? "green" : "yellow"}>{ready ? "Ready" : kickoff.status || "Draft"}</Badge>
        </div>
        {kickoffError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactBackendError(kickoffError)}</div>}
        {error && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactBackendError(error)}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
          <Field label="Scope summary"><Textarea rows={4} value={form.scopeSummary} onChange={(e) => setValue("scopeSummary", e.target.value)} /></Field>
          <Field label="Milestones"><Textarea rows={4} value={form.milestones} onChange={(e) => setValue("milestones", e.target.value)} /></Field>
          <Field label="Required documents"><Textarea rows={4} value={form.requiredDocuments} onChange={(e) => setValue("requiredDocuments", e.target.value)} /></Field>
          <Field label="Tech stack notes"><Textarea rows={4} value={form.techStackNotes} onChange={(e) => setValue("techStackNotes", e.target.value)} /></Field>
          <Field label="Delivery roles"><Textarea rows={4} value={form.deliveryRoles} onChange={(e) => setValue("deliveryRoles", e.target.value)} /></Field>
          <Field label="Readiness notes"><Textarea rows={4} value={form.readinessNotes} onChange={(e) => setValue("readinessNotes", e.target.value)} /></Field>
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
          {checklist.map((item) => (
            <label key={item.key} className="row" style={{ gap: 12, alignItems: "flex-start", padding: "11px 12px", border: "1px solid var(--border)", borderRadius: 8, background: form[item.key] ? "rgba(16,185,129,.08)" : "rgba(8,14,32,.35)", cursor: "pointer" }}>
              <input type="checkbox" checked={Boolean(form[item.key])} onChange={(e) => setValue(item.key, e.target.checked)} style={{ marginTop: 2, width: 16, height: 16 }} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", color: "white", fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                <span style={{ display: "block", color: "var(--text-3)", fontSize: 12, marginTop: 3, lineHeight: 1.45 }}>{item.body}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="row gap-2" style={{ marginTop: 16, flexWrap: "wrap" }}>
          <Button variant="primary" size="sm" icon={<IconCheckCircle size={13} />} onClick={saveKickoff} disabled={saving}>{saving ? "Saving..." : "Save kickoff"}</Button>
          <Button variant="secondary" size="sm" icon={<IconClipboard size={13} />} onClick={createStarterTasks} disabled={action === "tasks" || loading}>{action === "tasks" ? "Creating..." : "Create starter tasks"}</Button>
          <Button variant="secondary" size="sm" icon={<IconWorkflow size={13} />} onClick={createStarterWorkOrders} disabled={action === "work-orders" || loading}>{action === "work-orders" ? "Creating..." : "Create starter work orders"}</Button>
        </div>
      </Card>

      <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
        <Card style={{ padding: 20 }}>
          <SectionTitle title="Client onboarding" subtitle={`${detail.clientInvites?.length || 0} invite${detail.clientInvites?.length === 1 ? "" : "s"}`} />
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {(detail.clientInvites || []).length === 0 ? (
              <div style={{ color: "var(--text-3)", fontSize: 13 }}>No client invite is linked to this project.</div>
            ) : detail.clientInvites.map((invite: any) => (
              <div key={invite.id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}>
                <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{invite.contactName}</div>
                  <Badge tone={invite.status === "ACCEPTED" ? "green" : invite.status === "PENDING" ? "yellow" : "red"}>{invite.status}</Badge>
                </div>
                <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>{invite.email}</div>
                <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 4 }}>
                  {invite.acceptedAt ? `Joined ${formatBackendDate(invite.acceptedAt)}` : `Invited ${formatBackendDate(invite.createdAt)}`}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <SectionTitle title="Kickoff outputs" subtitle="Task and work-order hooks" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <MiniStat label="Tasks" value={String(tasks.length)} />
            <MiniStat label="Work orders" value={String(workOrders.length)} />
          </div>
          <div style={{ color: ready ? "#6EE7B7" : "var(--text-3)", fontSize: 12.5, lineHeight: 1.5, marginTop: 12 }}>
            {ready ? "Orchestration start is available." : "Orchestration start unlocks when every kickoff check is saved."}
          </div>
        </Card>
      </div>
    </div>
  );
}
