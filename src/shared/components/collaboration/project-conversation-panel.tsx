// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Field, Input, Textarea } from "@/shared/components/ui";
import { IconMessageCircle, IconPlus, IconRefresh, IconSend } from "@/shared/components/icons";
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

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id);
  }, [activeId, conversations]);

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
    <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: 16 }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 18, borderBottom: "1px solid var(--border)" }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
              <p style={{ color: "var(--text-3)", fontSize: 12, margin: "4px 0 0" }}>{subtitle}</p>
            </div>
            <Button variant="ghost" size="sm" icon={<IconRefresh size={13} />} onClick={refresh} />
          </div>
        </div>

        <div style={{ maxHeight: 360, overflow: "auto" }}>
          {error ? (
            <div style={{ padding: 18, color: "#FCA5A5", fontSize: 13 }}>{compactDevFlowError(error)}</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 18, color: "var(--text-3)", fontSize: 13 }}>{loading ? "Loading conversations..." : emptyText}</div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                style={{
                  width: "100%",
                  border: 0,
                  borderBottom: "1px solid var(--border)",
                  background: active?.id === conversation.id ? "rgba(79,139,255,.12)" : "transparent",
                  color: "white",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: 14,
                  fontFamily: "inherit",
                }}
              >
                <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{conversation.title}</span>
                  {conversation.unreadCount > 0 && <Badge tone="blue" dot={false}>{conversation.unreadCount}</Badge>}
                </div>
                <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 5 }}>{conversation.visibility} - {conversation._count.messages} messages</div>
                {conversation.messages?.[0]?.body && <div style={{ color: "var(--text-2)", fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>{conversation.messages[0].body}</div>}
              </button>
            ))
          )}
        </div>

        <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "grid", gap: 10 }}>
          <Field label="New thread"><Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Thread title" /></Field>
          <Textarea rows={3} value={newMessage} onChange={(event) => setNewMessage(event.target.value)} placeholder="Optional first message" />
          {actionError && <div style={{ color: "#FCA5A5", fontSize: 12.5 }}>{compactDevFlowError(actionError)}</div>}
          <Button variant="secondary" size="sm" icon={<IconPlus size={13} />} disabled={busy || !newTitle.trim()} onClick={createThread}>Create thread</Button>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden", minHeight: 520 }}>
        <div style={{ padding: 18, borderBottom: "1px solid var(--border)" }}>
          <div className="row gap-3">
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(79,139,255,.14)", color: "#93C5FD", display: "grid", placeItems: "center" }}><IconMessageCircle size={17} /></div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{active?.title || "No conversation selected"}</h3>
              <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 3 }}>{active ? `${active.category} - ${active.visibility}` : "Create a thread to start messaging."}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: 18, minHeight: 330, maxHeight: 430, overflow: "auto", display: "grid", alignContent: "start", gap: 12 }}>
          {messages.error ? (
            <div style={{ color: "#FCA5A5", fontSize: 13 }}>{compactDevFlowError(messages.error)}</div>
          ) : messages.messages.length === 0 ? (
            <div style={{ color: "var(--text-3)", fontSize: 13 }}>{messages.loading ? "Loading messages..." : "No messages yet."}</div>
          ) : (
            messages.messages.map((message) => (
              <div key={message.id} style={{ padding: 13, border: "1px solid var(--border)", borderRadius: 8, background: "rgba(8,14,32,.45)" }}>
                <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>{message.author?.fullName || message.author?.email || "System"}</span>
                  <span style={{ color: "var(--text-3)", fontSize: 11 }}>{formatDevFlowDate(message.createdAt)}</span>
                </div>
                <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.55, marginTop: 7, whiteSpace: "pre-wrap" }}>{message.body}</div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
          {actionError && <div style={{ color: "#FCA5A5", fontSize: 12.5, marginBottom: 10 }}>{compactDevFlowError(actionError)}</div>}
          <div className="row gap-2" style={{ alignItems: "flex-end" }}>
            <Textarea rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={active ? "Write a project message..." : "Select a conversation first"} disabled={!active} />
            <Button variant="primary" icon={<IconSend size={14} />} disabled={busy || !active || !draft.trim()} onClick={send}>Send</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
