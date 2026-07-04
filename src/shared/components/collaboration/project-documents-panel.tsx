// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/shared/components/ui";
import { IconCheck, IconFileText, IconRefresh, IconUpload, IconArrowUpRight } from "@/shared/components/icons";
import { useDevFlowCollaborationDocuments } from "@/shared/hooks/use-devflow-collaboration";
import { compactDevFlowError, formatDevFlowDate } from "@/shared/utils/devflow-projects";

const KIND_COLORS = {
  GENERAL: "#93C5FD",
  REQUIREMENT: "#6EE7B7",
  CONTRACT: "#FBBF24",
  DELIVERABLE: "#C4B5FD",
};

function statusTone(status) {
  if (status === "APPROVED") return "green";
  if (status === "REVISION_REQUESTED") return "amber";
  if (status === "APPROVAL_REQUESTED") return "blue";
  if (status === "ARCHIVED") return "gray";
  return "purple";
}

/* ---------- Skeleton ---------- */
function DocSkeleton() {
  return (
    <div style={{ height: 88, borderRadius: 12, background: "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.06), rgba(255,255,255,0.02))", backgroundSize: "200% 100%", animation: "calSkeletonPulse 1.8s ease-in-out infinite", marginBottom: 10 }} />
  );
}

/* ---------- Empty State ---------- */
function DocEmptyState({ loading }) {
  if (loading) return <DocSkeleton />;
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(47,107,255,0.08)", border: "1px solid rgba(79,139,255,0.20)", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "#93C5FD" }}>
        <IconFileText size={22} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>No documents yet</h3>
      <p style={{ color: "var(--text-2)", fontSize: 13, maxWidth: 300, margin: "0 auto", lineHeight: 1.55 }}>
        Document records will appear here once they are created by the project team.
      </p>
    </div>
  );
}

/* ---------- Document Card ---------- */
function DocumentCard({ document, allowReview, busy, onReview }) {
  const kindColor = KIND_COLORS[document.kind] || "#93C5FD";
  return (
    <div className="doc-card">
      <div className="doc-card-inner">
        <div className="row gap-3" style={{ alignItems: "flex-start", minWidth: 0, flex: 1 }}>
          <div className="doc-card-icon" style={{ background: `${kindColor}18`, color: kindColor }}>
            <IconFileText size={17} />
          </div>
          <div className="doc-card-body">
            <div className="doc-card-title">{document.title}</div>
            <div className="doc-card-meta">
              {document.fileName || document.externalUrl || "No file reference"} - {formatDevFlowDate(document.updatedAt)}
            </div>
            {document.description && <div className="doc-card-desc">{document.description}</div>}
            {document.reviewNote && <div className="doc-card-note">{document.reviewNote}</div>}
          </div>
        </div>
        <div className="row gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0, alignSelf: "flex-start" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 10px", borderRadius: 999,
            fontSize: 10.5, fontWeight: 600,
            letterSpacing: "0.04em", textTransform: "uppercase",
            background: `${kindColor}18`,
            color: kindColor,
            border: `1px solid ${kindColor}30`,
          }}>
            {document.kind}
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 10px", borderRadius: 999,
            fontSize: 10.5, fontWeight: 600,
            letterSpacing: "0.04em", textTransform: "uppercase",
            background: document.clientVisible ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.10)",
            color: document.clientVisible ? "#6EE7B7" : "#94A3B8",
            border: `1px solid ${document.clientVisible ? "rgba(16,185,129,0.25)" : "rgba(148,163,184,0.15)"}`,
          }}>
            {document.clientVisible ? "Client-visible" : "Team-only"}
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 10px", borderRadius: 999,
            fontSize: 10.5, fontWeight: 600,
            letterSpacing: "0.04em", textTransform: "uppercase",
            background: `${statusToneColor(document.status)}18`,
            color: statusToneColor(document.status),
            border: `1px solid ${statusToneColor(document.status)}30`,
          }}>
            {document.status.replaceAll("_", " ")}
          </span>
        </div>
      </div>
      {allowReview && ["APPROVAL_REQUESTED", "UPLOADED", "REVISION_REQUESTED"].includes(document.status) && (
        <div className="row gap-2" style={{ justifyContent: "flex-end", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReview(document.id, "REVISION_REQUESTED")}
            style={{
              padding: "0 14px", height: 34,
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "white", fontSize: 12.5, fontWeight: 500,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
          >
            Request revision
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onReview(document.id, "APPROVED")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "0 14px 0 16px", height: 34,
              borderRadius: 999,
              background: "linear-gradient(135deg, #10B981, #14B8A6)",
              border: "none",
              color: "white", fontWeight: 600, fontSize: 12.5,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.5 : 1,
              boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
              transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <IconCheck size={12} />
            Approve
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <IconArrowUpRight size={10} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function statusToneColor(status) {
  if (status === "APPROVED") return "#6EE7B7";
  if (status === "REVISION_REQUESTED") return "#FBBF24";
  if (status === "APPROVAL_REQUESTED") return "#93C5FD";
  if (status === "ARCHIVED") return "#94A3B8";
  return "#C4B5FD";
}

/* ================================================================
   EXPORTED: ProjectDocumentsPanel
   ================================================================ */
export function ProjectDocumentsPanel({
  projectId,
  title = "Project documents",
  subtitle = "Project-scoped document records from the collaboration backend.",
  allowCreate = true,
  allowReview = false,
  defaultClientVisible = true,
  defaultKind = "GENERAL",
  kindFilter = null,
}) {
  const { documents, loading, error, refresh, createDocument, reviewDocument } = useDevFlowCollaborationDocuments(projectId);
  const [form, setForm] = useState({ title: "", description: "", fileName: "", externalUrl: "", kind: defaultKind, clientVisible: defaultClientVisible });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const visibleDocuments = useMemo(() => kindFilter ? documents.filter((d) => d.kind === kindFilter) : documents, [documents, kindFilter]);

  const submit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    setActionError("");
    try {
      await createDocument({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        fileName: form.fileName.trim() || undefined,
        externalUrl: form.externalUrl.trim() || undefined,
        kind: form.kind,
        clientVisible: Boolean(form.clientVisible),
      });
      setForm({ title: "", description: "", fileName: "", externalUrl: "", kind: defaultKind, clientVisible: defaultClientVisible });
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  const review = async (documentId, status) => {
    setBusy(true);
    setActionError("");
    try {
      await reviewDocument(documentId, { status });
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  if (!projectId) {
    return (
      <div style={{ padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,18,40,0.5)", color: "var(--text-3)", fontSize: 13.5, textAlign: "center" }}>
        No backend project is selected.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: allowCreate ? "minmax(0, 1fr) 340px" : "1fr", gap: 16 }} className="doc-panel-inner">
      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,18,40,0.82)", backdropFilter: "blur(18px) saturate(140%)", WebkitBackdropFilter: "blur(18px) saturate(140%)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.07)" }}>
        <div className="doc-panel-header">
          <div className="row">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
              <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 0" }}>{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={refresh}
              style={{ width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-2)", cursor: "pointer", display: "grid", placeItems: "center", transition: "all 0.2s ease", flexShrink: 0 }}
            >
              <IconRefresh size={13} />
            </button>
          </div>
          {actionError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginTop: 10 }}>{compactDevFlowError(actionError)}</div>}
        </div>

        {error ? (
          <div style={{ padding: 18, color: "#FCA5A5", fontSize: 13 }}>{compactDevFlowError(error)}</div>
        ) : visibleDocuments.length === 0 ? (
          <DocEmptyState loading={loading} />
        ) : (
          <div>
            {loading ? (
              <div style={{ padding: 18 }}><DocSkeleton /><DocSkeleton /></div>
            ) : (
              visibleDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} allowReview={allowReview} busy={busy} onReview={review} />
              ))
            )}
          </div>
        )}
      </div>

      {allowCreate && (
        <div className="doc-form-section">
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Add document record</h3>
          <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 16px" }}>This stores metadata now; file storage can attach later.</p>
          {actionError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 12 }}>{compactDevFlowError(actionError)}</div>}
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Document title" /></Field>
            <Field label="File name"><Input value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="scope.pdf" /></Field>
            <Field label="External URL"><Input value={form.externalUrl} onChange={(e) => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://..." /></Field>
            <Field label="Kind">
              <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="GENERAL">General</option>
                <option value="REQUIREMENT">Requirement</option>
                <option value="CONTRACT">Contract</option>
                <option value="DELIVERABLE">Deliverable</option>
              </Select>
            </Field>
            <label className="row gap-2" style={{ color: "var(--text-2)", fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={form.clientVisible} onChange={(e) => setForm({ ...form, clientVisible: e.target.checked })} />
              Client-visible
            </label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
            <button
              type="button"
              disabled={busy || !form.title.trim()}
              onClick={submit}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                width: "100%", height: 44,
                borderRadius: 999,
                background: "linear-gradient(135deg, #2F6BFF, #4F8BFF)",
                border: "none",
                color: "white", fontWeight: 600, fontSize: 14,
                cursor: busy || !form.title.trim() ? "not-allowed" : "pointer",
                opacity: busy || !form.title.trim() ? 0.5 : 1,
                boxShadow: "0 6px 20px rgba(47,107,255,0.25)",
                transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <IconUpload size={14} />
              Save document
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <IconArrowUpRight size={11} />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}