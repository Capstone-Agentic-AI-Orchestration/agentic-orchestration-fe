// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Card, Field, Input, Modal, Textarea } from "@/shared/components/ui";
import { IconArrowLeft, IconMessageCircle, IconPlus, IconRefresh, IconSend } from "@/shared/components/icons";
import { useDevFlowConversationMessages, useDevFlowConversations } from "@/shared/hooks/use-devflow-collaboration";
import { compactDevFlowError, formatDevFlowDate } from "@/shared/utils/devflow-projects";

export function ProjectConversationPanel({
  projectId,
  title = "Project conversations",
  subtitle = "Project-scoped messages from the collaboration backend.",
  defaultVisibility = "CLIENT",
  defaultCategory = "GENERAL",
  emptyText = "No conversations yet.",
}) {
  const { conversations, loading, error, refresh, createConversation } = useDevFlowConversations(projectId);
  const [activeId, setActiveId] = useState(null);
  const active = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) || conversations[0] || null,
    [activeId, conversations],
  );
  const messages = useDevFlowConversationMessages(projectId, active?.id);
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
  }, [projectId]);

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

  useEffect(() => {
    const readRefreshKey = projectId && active?.id ? `${projectId}:${active.id}` : "";
    if (!readRefreshKey || messages.loading || messages.error || lastReadRefreshKey.current === readRefreshKey) return;
    lastReadRefreshKey.current = readRefreshKey;
    void refresh();
  }, [active?.id, messages.error, messages.loading, projectId, refresh]);

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

  if (!projectId) {
    return <Card style={{ padding: 22, color: "var(--text-3)" }}>No backend project is selected.</Card>;
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
                onClick={refresh}
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
                className={`conversation-thread${active?.id === conversation.id ? " is-active" : ""}`}
                onClick={() => {
                  setActiveId(conversation.id);
                  setMobileDetail(true);
                }}
              >
                <div className="conversation-thread-heading">
                  <strong>{conversation.title}</strong>
                  {conversation.unreadCount > 0 && <Badge tone="blue" dot={false}>{conversation.unreadCount}</Badge>}
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
              <p>{active ? "Developer and project manager" : "Create a thread to start messaging."}</p>
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
            <Textarea rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={active ? "Write a project message..." : "Select a conversation first"} disabled={!active} />
            <Button variant="primary" icon={<IconSend size={14} />} disabled={busy || !active || !draft.trim()} onClick={send}>Send</Button>
          </div>
        </div>
      </Card>
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Start a project thread"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={busy}>Cancel</Button>
            <Button
              variant="primary"
              icon={<IconPlus size={13} />}
              disabled={busy || !newTitle.trim()}
              onClick={createThread}
            >
              {busy ? "Creating…" : "Create thread"}
            </Button>
          </>
        )}
      >
        <div className="conversation-new-thread-form">
          <p>Start a TEAM conversation with the project manager for this project.</p>
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
              placeholder="Add context for the project manager…"
            />
          </Field>
          {creating && actionError && <div className="conversation-error">{compactDevFlowError(actionError)}</div>}
        </div>
      </Modal>
    </>
  );
}
