"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Field, Input, Modal, Textarea } from "@/shared/components/ui";
import { IconArrowLeft, IconMessageCircle, IconPlus, IconRefresh, IconSend } from "@/shared/components/icons";
import { useDevFlowConversationMessages, useDevFlowConversations } from "@/shared/hooks/use-devflow-collaboration";
import { compactDevFlowError, formatDevFlowDate } from "@/shared/utils/devflow-projects";
import type {
  DevFlowCollaborationVisibility,
  DevFlowConversationCategory,
} from "@/shared/api/devflow-api";

export interface ConversationPanelProps {
  /**
   * The client company whose threads these are. There is no project equivalent: the conversation
   * belongs to the company, because it outlives any single build.
   */
  clientId?: string | null;
  title?: string;
  subtitle?: string;
  /** Who the active thread is between, shown above the message list. */
  participantsLabel?: string;
  defaultVisibility?: DevFlowCollaborationVisibility;
  defaultCategory?: DevFlowConversationCategory;
  emptyText?: string;
  newThreadTitle?: string;
  newThreadHint?: string;
  /** Shown in place of the panel when no client is available. */
  noClientText?: string;
}

export function ConversationPanel({
  clientId,
  title = "Conversations",
  subtitle = "Messages from the collaboration backend.",
  participantsLabel = "Developer and project manager",
  defaultVisibility = "CLIENT",
  defaultCategory = "GENERAL",
  emptyText = "No conversations yet.",
  newThreadTitle = "Start a thread",
  newThreadHint = "Start a conversation with the project manager.",
  noClientText = "Nothing is selected.",
}: Readonly<ConversationPanelProps>) {
  const { conversations, loading, error, refresh, createConversation } = useDevFlowConversations(clientId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) || conversations[0] || null,
    [activeId, conversations],
  );
  const messages = useDevFlowConversationMessages(clientId, active?.id);
  const [draft, setDraft] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [creating, setCreating] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const lastReadRefreshKey = useRef("");

  useEffect(() => {
    setActiveId(null);
    setDraft("");
    setNewTitle("");
    setNewMessage("");
    setActionError("");
    setCreating(false);
    setMobileDetail(false);
    lastReadRefreshKey.current = "";
  }, [clientId]);

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

  // Opening a thread marks it read on the server, so the unread badges in the list are stale until
  // the list is refetched. Guarded by a key so this fires once per thread, not on every render.
  useEffect(() => {
    const readRefreshKey = clientId && active?.id ? `${clientId}:${active.id}` : "";
    if (!readRefreshKey || messages.loading || messages.error || lastReadRefreshKey.current === readRefreshKey) return;
    lastReadRefreshKey.current = readRefreshKey;
    void refresh();
  }, [active?.id, messages.error, messages.loading, clientId, refresh]);

  const createThread = async () => {
    if (!newTitle.trim()) return;
    setBusy(true);
    setActionError("");
    try {
      const conversation = await createConversation({
        title: newTitle.trim(),
        message: newMessage.trim() || undefined,
        visibility: defaultVisibility,
        category: defaultCategory,
      });
      setNewTitle("");
      setNewMessage("");
      setActiveId(conversation?.id || null);
      setCreating(false);
      setMobileDetail(true);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    setActionError("");
    try {
      await messages.sendMessage(draft.trim());
      setDraft("");
      await refresh();
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setBusy(false);
    }
  };

  if (!clientId) {
    return <Card style={{ padding: 22, color: "var(--text-3)" }}>{noClientText}</Card>;
  }

  return (
    <>
      <div className={`project-conversation-shell${mobileDetail ? " is-detail-open" : ""}`}>
      <Card className="conversation-thread-pane">
        <div className="conversation-pane-header">
          <div className="conversation-pane-title">
            <div>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </div>
            <div className="conversation-pane-actions">
              <Button
                variant="ghost"
                size="sm"
                icon={<IconRefresh size={13} />}
                onClick={() => void refresh()}
                title="Refresh conversations"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<IconPlus size={13} />}
                onClick={() => {
                  setActionError("");
                  setCreating(true);
                }}
              >
                New thread
              </Button>
            </div>
          </div>
        </div>

        <div className="conversation-thread-list">
          {error ? (
            <div className="conversation-error">{compactDevFlowError(error)}</div>
          ) : conversations.length === 0 ? (
            <div className="conversation-empty">{loading ? "Loading conversations…" : emptyText}</div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                aria-current={active?.id === conversation.id ? "true" : undefined}
                className={`conversation-thread${active?.id === conversation.id ? " is-active" : ""}`}
                onClick={() => {
                  setActiveId(conversation.id);
                  setMobileDetail(true);
                }}
              >
                <div className="conversation-thread-heading">
                  <strong>{conversation.title}</strong>
                  {Boolean(conversation.unreadCount) && (
                    <Badge tone="blue" dot={false}>{conversation.unreadCount}</Badge>
                  )}
                </div>
                <span>{conversation._count.messages} messages</span>
                {conversation.messages?.[0]?.body && <p>{conversation.messages[0].body}</p>}
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="conversation-message-pane">
        <div className="conversation-pane-header">
          <div className="conversation-active-heading">
            <button
              className="conversation-mobile-back"
              type="button"
              onClick={() => setMobileDetail(false)}
              aria-label="Back to conversations"
            >
              <IconArrowLeft size={15} />
            </button>
            <div className="conversation-icon"><IconMessageCircle size={17} /></div>
            <div>
              <h3>{active?.title || "No conversation selected"}</h3>
              <p>{active ? participantsLabel : "Create a thread to start messaging."}</p>
            </div>
          </div>
        </div>

        <div className="conversation-message-list">
          {messages.error ? (
            <div className="conversation-error">{compactDevFlowError(messages.error)}</div>
          ) : messages.messages.length === 0 ? (
            <div className="conversation-empty">{messages.loading ? "Loading messages…" : "No messages yet."}</div>
          ) : (
            messages.messages.map((message) => (
              <div key={message.id} className="conversation-message">
                <div>
                  <strong>{message.author?.fullName || message.author?.email || "System"}</strong>
                  <span>{formatDevFlowDate(message.createdAt)}</span>
                </div>
                <p>{message.body}</p>
              </div>
            ))
          )}
        </div>

        <div className="conversation-composer">
          {!creating && actionError && <div className="conversation-error">{compactDevFlowError(actionError)}</div>}
          <div className="conversation-composer-row">
            <Textarea
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={active ? "Write a message..." : "Select a conversation first"}
              disabled={!active}
            />
            <Button
              variant="primary"
              icon={<IconSend size={14} />}
              disabled={busy || !active || !draft.trim()}
              onClick={() => void send()}
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={newThreadTitle}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={busy}>Cancel</Button>
            <Button
              variant="primary"
              icon={<IconPlus size={13} />}
              disabled={busy || !newTitle.trim()}
              onClick={() => void createThread()}
            >
              {busy ? "Creating…" : "Create thread"}
            </Button>
          </>
        )}
      >
        <div className="conversation-new-thread-form">
          <p>{newThreadHint}</p>
          <Field label="Thread title">
            <Input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="What do you need to discuss?"
              autoFocus
            />
          </Field>
          <Field label="First message" helper="Optional">
            <Textarea
              rows={5}
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Add some context…"
            />
          </Field>
          {creating && actionError && <div className="conversation-error">{compactDevFlowError(actionError)}</div>}
        </div>
      </Modal>
    </>
  );
}

