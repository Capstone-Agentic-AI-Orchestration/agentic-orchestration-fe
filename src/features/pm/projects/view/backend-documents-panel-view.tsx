"use client";

import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/shared/components/ui";
import { IconFileText, IconExternalLink } from "@/shared/components/icons";
import { SectionTitle } from "../components/pm-project-ui";
import { compactBackendError, formatBackendDate } from "../utils/pm-project-detail.utils";
import { DOCUMENT_KIND_OPTIONS, type ProjectDocumentRow } from "../model/documents-panel";
import {
  ACCEPTED_DOCUMENT_EXTENSIONS,
  type BackendDocumentsPanelViewModel,
} from "../view-model/use-documents-panel-view-model";

function extractionBadge(row: ProjectDocumentRow) {
  if (row.sourceKind === "link") return { tone: "gray" as const, label: "Reference only" };
  if (row.extraction === "READY") return { tone: "green" as const, label: "Text extracted" };
  if (row.extraction === "FAILED") return { tone: "red" as const, label: "Extraction failed" };
  if (row.extraction === "EXTRACTING") return { tone: "amber" as const, label: "Extracting" };
  return { tone: "amber" as const, label: "Queued" };
}

function DocumentRow({ row, vm }: Readonly<{ row: ProjectDocumentRow; vm: BackendDocumentsPanelViewModel }>) {
  const badge = extractionBadge(row);

  return (
    <div className="pm-tab-list-row pm-document-row">
      <span className={`pm-document-icon pm-document-icon--${row.sourceKind}`} aria-hidden="true">
        {row.sourceKind === "file" ? <IconFileText size={15} /> : <IconExternalLink size={15} />}
      </span>

      <div className="pm-document-body">
        <div className="pm-document-title">{row.title}</div>
        <div className="pm-document-meta">
          {[row.sourceLabel, row.sizeLabel, `Added by ${row.uploadedByLabel}`, formatBackendDate(row.updatedAt)]
            .filter(Boolean)
            .join(" · ")}
        </div>
        {row.description && <div className="pm-document-desc">{row.description}</div>}
        {row.extractionError && (
          <div className="pm-tab-message pm-tab-message--danger" style={{ marginTop: 8 }}>
            {row.extractionError}
          </div>
        )}
        {row.externalUrl && (
          <a className="pm-document-link" href={row.externalUrl} target="_blank" rel="noreferrer noopener">
            Open reference
          </a>
        )}
      </div>

      <div className="pm-document-tags">
        <Badge tone={badge.tone}>{badge.label}</Badge>
        <Badge tone={row.clientVisible ? "blue" : "gray"}>
          {row.clientVisible ? "Client can see" : "Team only"}
        </Badge>
        <Badge tone="gray">{row.kind.toLowerCase()}</Badge>
        {row.canRetryExtraction && (
          <Button variant="secondary" size="sm" onClick={() => void vm.actions.retryExtraction(row.id)}>
            Retry extraction
          </Button>
        )}
      </div>
    </div>
  );
}

export function BackendDocumentsPanelView({ vm }: Readonly<{ vm: BackendDocumentsPanelViewModel }>) {
  if (vm.loading && !vm.hasDocuments) {
    return <Card className="pm-tab-panel pm-tab-empty">Loading project documents...</Card>;
  }

  if (vm.error) {
    return (
      <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">
        {compactBackendError(vm.error)}
      </Card>
    );
  }

  return (
    <div className="pm-tab-layout pm-tab-layout--aside">
      <Card className="pm-tab-panel">
        <div className="pm-tab-header" style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
          <SectionTitle
            title="Client documents"
            subtitle="Everything the client has provided for this project. Only extracted files are readable by the delivery agents."
          />
          <Badge tone={vm.summary.extracted ? "green" : "gray"}>
            {vm.summary.extracted}/{vm.summary.files} readable
          </Badge>
        </div>

        <div className="pm-document-summary">{vm.evidenceSummary}</div>

        {vm.actionError && (
          <div className="pm-tab-message pm-tab-message--danger" style={{ margin: "0 16px 12px" }}>
            {compactBackendError(vm.actionError)}
          </div>
        )}
        {vm.notice && (
          <div className="pm-tab-message pm-tab-message--success" style={{ margin: "0 16px 12px" }}>
            {vm.notice}
          </div>
        )}

        {!vm.hasDocuments ? (
          <div className="pm-tab-empty">
            No documents yet. Upload the files the client sent you, or link a document that lives
            somewhere else.
          </div>
        ) : (
          <div className="pm-tab-list">
            {vm.rows.map((row) => (
              <DocumentRow key={row.id} row={row} vm={vm} />
            ))}
          </div>
        )}
      </Card>

      <Card className="pm-tab-panel pm-tab-panel--padded">
        <SectionTitle
          title="Upload a file"
          subtitle="Stored on the project and read by the agents once text extraction succeeds."
        />
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <Field
            label="Document from the client"
            helper="PDF, DOCX, XLSX, TXT, PNG, JPG or JPEG. Up to 25 MB each. Marked client-visible so the client can confirm it arrived."
          >
            <Input
              type="file"
              accept={ACCEPTED_DOCUMENT_EXTENSIONS}
              disabled={vm.uploading}
              onChange={vm.actions.onFileSelected}
            />
          </Field>
          {vm.uploading && (
            <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>Uploading and queueing extraction...</div>
          )}
          <p className="pm-document-hint">
            Do not upload passwords, API keys, or production credentials.
          </p>
        </div>

        <div className="pm-document-divider" />

        <SectionTitle
          title="Link a document"
          subtitle="For files that stay in the client's own system. Stored as a reference — the agents cannot read its contents."
        />
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <Field label="Title">
            <Input
              value={vm.linkForm.title}
              onChange={(event) => vm.actions.setLinkValue("title", event.target.value)}
              placeholder="Brand guidelines (Google Drive)"
            />
          </Field>
          <Field label="URL">
            <Input
              value={vm.linkForm.externalUrl}
              onChange={(event) => vm.actions.setLinkValue("externalUrl", event.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Kind">
            <Select
              value={vm.linkForm.kind}
              onChange={(event) =>
                vm.actions.setLinkValue("kind", event.target.value as typeof vm.linkForm.kind)
              }
            >
              {DOCUMENT_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={vm.linkForm.description}
              onChange={(event) => vm.actions.setLinkValue("description", event.target.value)}
              placeholder="What this reference contains and who owns it."
            />
          </Field>
          <label className="pm-document-checkbox">
            <input
              type="checkbox"
              checked={vm.linkForm.clientVisible}
              onChange={(event) => vm.actions.setLinkValue("clientVisible", event.target.checked)}
            />
            <span>Client can see this reference</span>
          </label>
          <Button disabled={!vm.canSubmitLink} onClick={() => void vm.actions.createLink()}>
            {vm.savingLink ? "Saving..." : "Save link"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
