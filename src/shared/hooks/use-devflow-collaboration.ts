"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDevFlowCollaborationDocument,
  createDevFlowConversation,
  createDevFlowMessage,
  devflowScopeKey,
  getDevFlowCollaborationDocuments,
  getDevFlowConversationMessages,
  getDevFlowConversations,
  reviewDevFlowCollaborationDocument,
  type CreateDevFlowCollaborationDocumentInput,
  type CreateDevFlowConversationInput,
  type DevFlowCollaborationDocument,
  type DevFlowConversation,
  type DevFlowConversationScope,
  type DevFlowMessage,
  type ReviewDevFlowCollaborationDocumentInput,
} from "@/shared/api/devflow-api";

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Threads for one owner — a project or a client.
 *
 * Note the dependency on `devflowScopeKey(scope)` rather than `scope`. A scope is an object
 * literal built at the call site, so it is a fresh reference on every render; depending on the
 * object itself re-runs the fetch forever.
 */
export function useDevFlowConversations(scope?: DevFlowConversationScope | null) {
  const [conversations, setConversations] = useState<DevFlowConversation[]>([]);
  const [loading, setLoading] = useState(Boolean(scope));
  const [error, setError] = useState("");
  const scopeKey = devflowScopeKey(scope);

  const refresh = useCallback(async () => {
    if (!scope) {
      setConversations([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setConversations(await getDevFlowConversations(scope));
    } catch (nextError) {
      setConversations([]);
      setError(errorText(nextError));
    } finally {
      setLoading(false);
    }
    // scopeKey, not scope — see the note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey]);

  const createConversation = useCallback(
    async (input: CreateDevFlowConversationInput) => {
      if (!scope) return null;
      const conversation = await createDevFlowConversation(scope, input);
      await refresh();
      return conversation;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopeKey, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { conversations, loading, error, refresh, createConversation };
}

export function useDevFlowConversationMessages(
  scope?: DevFlowConversationScope | null,
  conversationId?: string | null,
) {
  const [messages, setMessages] = useState<DevFlowMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(scope && conversationId));
  const [error, setError] = useState("");
  const scopeKey = devflowScopeKey(scope);

  const refresh = useCallback(async () => {
    if (!scope || !conversationId) {
      setMessages([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setMessages(await getDevFlowConversationMessages(scope, conversationId));
    } catch (nextError) {
      setMessages([]);
      setError(errorText(nextError));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey, conversationId]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!scope || !conversationId) return null;
      const message = await createDevFlowMessage(scope, conversationId, { body });
      await refresh();
      return message;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopeKey, conversationId, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { messages, loading, error, refresh, sendMessage };
}

export function useDevFlowCollaborationDocuments(projectId?: string | null) {
  const [documents, setDocuments] = useState<DevFlowCollaborationDocument[]>([]);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!projectId) {
      setDocuments([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setDocuments(await getDevFlowCollaborationDocuments(projectId));
    } catch (nextError) {
      setDocuments([]);
      setError(errorText(nextError));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createDocument = useCallback(
    async (input: CreateDevFlowCollaborationDocumentInput) => {
      if (!projectId) return null;
      const document = await createDevFlowCollaborationDocument(projectId, input);
      await refresh();
      return document;
    },
    [projectId, refresh],
  );

  const reviewDocument = useCallback(
    async (documentId: string, input: ReviewDevFlowCollaborationDocumentInput) => {
      if (!projectId) return null;
      const document = await reviewDevFlowCollaborationDocument(projectId, documentId, input);
      await refresh();
      return document;
    },
    [projectId, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { documents, loading, error, refresh, createDocument, reviewDocument };
}
