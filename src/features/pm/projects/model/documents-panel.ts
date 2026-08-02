import type {
  DevFlowCollaborationDocumentKind,
  DevFlowIntakeDocument,
} from "@/shared/api/devflow-api";

/**
 * Two genuinely different things live in the same document table, and conflating them is what
 * made the old UI misleading:
 *
 * - a FILE was uploaded, stored, and had its text extracted — only these can reach the agents
 * - a LINK is a reference to something held elsewhere; there is no text for an agent to read
 *
 * `storageKey` is not exposed by the API, so an uploaded file is identified by having a
 * `fileName` with extraction state attached.
 */
export type ProjectDocumentSourceKind = "file" | "link";

export type ProjectDocumentExtractionState =
  | "READY"
  | "PENDING"
  | "EXTRACTING"
  | "FAILED"
  | "NOT_APPLICABLE";

export interface ProjectDocumentRow {
  id: string;
  title: string;
  description: string | null;
  sourceKind: ProjectDocumentSourceKind;
  /** File name for uploads, host for links, or null when neither is recorded. */
  sourceLabel: string | null;
  externalUrl: string | null;
  sizeLabel: string | null;
  kind: DevFlowCollaborationDocumentKind;
  clientVisible: boolean;
  uploadedByLabel: string;
  updatedAt: string;
  extraction: ProjectDocumentExtractionState;
  extractionError: string | null;
  /** True when this document contributes text to the agent context package. */
  usableAsEvidence: boolean;
  canRetryExtraction: boolean;
}

export interface ProjectDocumentsSummary {
  total: number;
  files: number;
  links: number;
  extracted: number;
  pending: number;
  failed: number;
  clientVisible: number;
}

export interface ProjectDocumentsPanelModel {
  rows: ProjectDocumentRow[];
  summary: ProjectDocumentsSummary;
  hasDocuments: boolean;
  /** Plain-language statement of what orchestration will actually receive. */
  evidenceSummary: string;
}

export interface DocumentLinkForm {
  title: string;
  externalUrl: string;
  description: string;
  kind: DevFlowCollaborationDocumentKind;
  clientVisible: boolean;
}

export const EMPTY_DOCUMENT_LINK_FORM: DocumentLinkForm = {
  title: "",
  externalUrl: "",
  description: "",
  kind: "GENERAL",
  clientVisible: false,
};

export const DOCUMENT_KIND_OPTIONS: Array<{ value: DevFlowCollaborationDocumentKind; label: string }> = [
  { value: "REQUIREMENT", label: "Requirement" },
  { value: "CONTRACT", label: "Contract" },
  { value: "DELIVERABLE", label: "Deliverable" },
  { value: "GENERAL", label: "General" },
];

function sizeLabel(sizeBytes: number | null): string | null {
  if (!sizeBytes || sizeBytes <= 0) return null;
  if (sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function hostOf(externalUrl: string | null): string | null {
  if (!externalUrl) return null;
  try {
    return new URL(externalUrl).host;
  } catch {
    // A malformed URL is still worth showing verbatim rather than hiding the row's only label.
    return externalUrl;
  }
}

function extractionStateOf(
  document: DevFlowIntakeDocument,
  sourceKind: ProjectDocumentSourceKind,
): ProjectDocumentExtractionState {
  if (sourceKind === "link") return "NOT_APPLICABLE";
  return document.extraction?.status ?? "PENDING";
}

export function buildProjectDocumentsPanelModel(input: {
  documents: DevFlowIntakeDocument[];
}): ProjectDocumentsPanelModel {
  const rows: ProjectDocumentRow[] = input.documents.map((document) => {
    // Extraction state only exists for stored files; a metadata-only link never has one.
    const sourceKind: ProjectDocumentSourceKind =
      document.fileName || document.extraction ? "file" : "link";
    const extraction = extractionStateOf(document, sourceKind);

    return {
      id: document.id,
      title: document.title,
      description: document.description,
      sourceKind,
      sourceLabel: sourceKind === "file" ? document.fileName : hostOf(document.externalUrl),
      externalUrl: document.externalUrl,
      sizeLabel: sizeLabel(document.sizeBytes ?? null),
      kind: document.kind,
      clientVisible: document.clientVisible,
      uploadedByLabel: document.uploadedBy?.fullName || document.uploadedBy?.email || "Unknown",
      updatedAt: document.updatedAt,
      extraction,
      extractionError: document.extraction?.error ?? null,
      usableAsEvidence: extraction === "READY",
      canRetryExtraction: extraction === "FAILED",
    };
  });

  const summary: ProjectDocumentsSummary = {
    total: rows.length,
    files: rows.filter((row) => row.sourceKind === "file").length,
    links: rows.filter((row) => row.sourceKind === "link").length,
    extracted: rows.filter((row) => row.extraction === "READY").length,
    pending: rows.filter((row) => row.extraction === "PENDING" || row.extraction === "EXTRACTING").length,
    failed: rows.filter((row) => row.extraction === "FAILED").length,
    clientVisible: rows.filter((row) => row.clientVisible).length,
  };

  return { rows, summary, hasDocuments: rows.length > 0, evidenceSummary: evidenceSummaryFor(summary) };
}

/**
 * States what orchestration receives, not how many rows exist. The old Setup checklist counted
 * intent ("documents confirmed") rather than outcome, which let a project look ready with no
 * readable evidence at all.
 */
export function evidenceSummaryFor(summary: ProjectDocumentsSummary): string {
  if (summary.total === 0) return "No documents attached, so agents will build from the intake form alone.";

  const parts = [`${summary.extracted} of ${summary.files} uploaded file${summary.files === 1 ? "" : "s"} readable by agents`];
  if (summary.pending) parts.push(`${summary.pending} still processing`);
  if (summary.failed) parts.push(`${summary.failed} failed extraction`);
  if (summary.links) parts.push(`${summary.links} external link${summary.links === 1 ? "" : "s"} (not readable by agents)`);
  return `${parts.join(" · ")}.`;
}

export function documentLinkCreatePayload(form: DocumentLinkForm) {
  const title = form.title.trim();
  const externalUrl = form.externalUrl.trim();
  if (!title || !externalUrl) return null;

  return {
    title,
    externalUrl,
    description: form.description.trim() || undefined,
    kind: form.kind,
    clientVisible: form.clientVisible,
  };
}
