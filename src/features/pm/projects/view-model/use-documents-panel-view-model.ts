"use client";

import { useState, type ChangeEvent } from "react";
import {
  buildProjectDocumentsPanelModel,
  documentLinkCreatePayload,
  EMPTY_DOCUMENT_LINK_FORM,
  type DocumentLinkForm,
  type ProjectDocumentsPanelModel,
} from "../model/documents-panel";
import {
  createDevFlowCollaborationDocument,
  retryDevFlowProjectIntakeDocumentExtraction,
  uploadDevFlowProjectIntakeDocument,
  type DevFlowCollaborationDocument,
} from "@/shared/api/devflow-api";

/** Mirrors the backend upload guard so the browser rejects bad files before a round trip. */
export const ACCEPTED_DOCUMENT_EXTENSIONS = ".pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg";

export interface BackendDocumentsPanelInput {
  projectId: string;
  documents: DevFlowCollaborationDocument[];
  loading?: boolean;
  error?: string | null;
  onChanged?: () => void | Promise<void>;
}

export interface BackendDocumentsPanelViewModel extends ProjectDocumentsPanelModel {
  projectId: string;
  loading: boolean;
  error: string;
  actionError: string;
  notice: string;
  uploading: boolean;
  savingLink: boolean;
  linkForm: DocumentLinkForm;
  canSubmitLink: boolean;
  actions: {
    uploadFile: (file: File | null) => Promise<void>;
    onFileSelected: (event: ChangeEvent<HTMLInputElement>) => void;
    setLinkValue: <Key extends keyof DocumentLinkForm>(key: Key, value: DocumentLinkForm[Key]) => void;
    createLink: () => Promise<void>;
    retryExtraction: (documentId: string) => Promise<void>;
    dismissNotice: () => void;
  };
}

export function useBackendDocumentsPanelViewModel(
  input: BackendDocumentsPanelInput,
): BackendDocumentsPanelViewModel {
  const [uploading, setUploading] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [linkForm, setLinkForm] = useState<DocumentLinkForm>(EMPTY_DOCUMENT_LINK_FORM);

  const model = buildProjectDocumentsPanelModel({ documents: input.documents });

  const uploadFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setActionError("");
    setNotice("");
    try {
      const result = await uploadDevFlowProjectIntakeDocument(input.projectId, file, {
        kind: "REQUIREMENT",
        // A PM uploads what the client sent, so the client must be able to see it listed back.
        clientVisible: true,
        description: "Uploaded by the project manager on behalf of the client.",
      });
      setNotice(
        result.duplicate
          ? `"${result.document.title}" is already attached to this project.`
          : `"${result.document.title}" uploaded. Text extraction runs automatically.`,
      );
      await input.onChanged?.();
      // Extraction finishes after the upload responds, so re-read once to pick up its result.
      window.setTimeout(() => void input.onChanged?.(), 1800);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setUploading(false);
    }
  };

  const createLink = async () => {
    const payload = documentLinkCreatePayload(linkForm);
    if (!payload) return;
    setSavingLink(true);
    setActionError("");
    setNotice("");
    try {
      await createDevFlowCollaborationDocument(input.projectId, payload);
      setLinkForm(EMPTY_DOCUMENT_LINK_FORM);
      setNotice(`Linked "${payload.title}". Links are references only — agents cannot read them.`);
      await input.onChanged?.();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSavingLink(false);
    }
  };

  const retryExtraction = async (documentId: string) => {
    setActionError("");
    setNotice("");
    try {
      await retryDevFlowProjectIntakeDocumentExtraction(input.projectId, documentId);
      setNotice("Extraction re-queued.");
      await input.onChanged?.();
      window.setTimeout(() => void input.onChanged?.(), 1800);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  };

  return {
    ...model,
    projectId: input.projectId,
    loading: Boolean(input.loading),
    error: input.error ?? "",
    actionError,
    notice,
    uploading,
    savingLink,
    linkForm,
    canSubmitLink: Boolean(documentLinkCreatePayload(linkForm)) && !savingLink,
    actions: {
      uploadFile,
      onFileSelected: (event) => {
        void uploadFile(event.target.files?.[0] ?? null);
        // Reset so selecting the same file again after an error still fires a change event.
        event.target.value = "";
      },
      setLinkValue: (key, value) => setLinkForm((current) => ({ ...current, [key]: value })),
      createLink,
      retryExtraction,
      dismissNotice: () => setNotice(""),
    },
  };
}
