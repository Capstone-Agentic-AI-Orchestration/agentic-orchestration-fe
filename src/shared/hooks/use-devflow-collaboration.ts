"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDevFlowCollaborationDocument,
  createDevFlowConversation,
  createDevFlowMessage,
  getDevFlowCollaborationDocuments,
  getDevFlowConversationMessages,
  getDevFlowConversations,
  reviewDevFlowCollaborationDocument,
  type CreateDevFlowCollaborationDocumentInput,
  type CreateDevFlowConversationInput,
  type DevFlowCollaborationDocument,
  type DevFlowConversation,
  type DevFlowMessage,
  type ReviewDevFlowCollaborationDocumentInput,
} from "@/shared/api/devflow-api";

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Threads with one client company. */
export function useDevFlowConversations(clientId?: string | null) {
  const [conversations, setConversations] = useState<DevFlowConversation[]>([]);
  const [loading, setLoading] = useState(Boolean(clientId));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!clientId) {
      setConversations([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setConversations(await getDevFlowConversations(clientId));
    } catch (nextError) {
      setConversations([]);
      setError(errorText(nextError));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const createConversation = useCallback(
    async (input: CreateDevFlowConversationInput) => {
      if (!clientId) return null;
      const conversation = await createDevFlowConversation(clientId, input);
      await refresh();
      return conversation;
    },
    [clientId, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { conversations, loading, error, refresh, createConversation };
}

export function useDevFlowConversationMessages(
  clientId?: string | null,
  conversationId?: string | null,
) {
  const [messages, setMessages] = useState<DevFlowMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(clientId && conversationId));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!clientId || !conversationId) {
      setMessages([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      setMessages(await getDevFlowConversationMessages(clientId, conversationId));
    } catch (nextError) {
      setMessages([]);
      setError(errorText(nextError));
    } finally {
      setLoading(false);
    }
  }, [clientId, conversationId]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!clientId || !conversationId) return null;
      const message = await createDevFlowMessage(clientId, conversationId, { body });
      await refresh();
      return message;
    },
    [clientId, conversationId, refresh],
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
