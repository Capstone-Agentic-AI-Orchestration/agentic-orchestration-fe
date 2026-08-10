"use client";

import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/shared/components/ui";
import { IconArrowRight, IconMessageCircle } from "@/shared/components/icons";
import { SectionTitle } from "./pm-project-ui";
import { useDevFlowConversations } from "@/shared/hooks/use-devflow-collaboration";
import { devflowClientScope } from "@/shared/api/devflow-api";
import { compactDevFlowError, formatDevFlowDate } from "@/shared/utils/devflow-projects";

/**
 * The client conversation as seen from inside a project: readable here, answered on the client.
 *
 * The mirror image of the Documents rollup on the client page. A document belongs to the project it
 * was uploaded into, so the client page shows a read-only rollup of them; a conversation belongs to
 * the company, so the project page shows a read-only rollup of that. In both directions the rule is
 * the same — you can see it from the other side, you edit it where it lives.
 *
 * Read-only is the point, not a shortcut. Two composers writing to one thread from two pages would
 * suggest the reply is somehow about this project, which is exactly the confusion that moving these
 * threads was meant to end.
 */
export function PMClientConversationRollup({
  clientId,
  clientName,
  limit = 4,
}: Readonly<{ clientId?: string | null; clientName?: string | null; limit?: number }>) {
  const router = useRouter();
  const scope = clientId ? devflowClientScope(clientId) : null;
  const { conversations, loading, error } = useDevFlowConversations(scope);

  const openClient = () => router.push(`/pm/clients/${clientId}?tab=messages`);

  if (!clientId) {
    return (
      <Card className="pm-tab-panel">
        <div className="pm-tab-empty">
          This project is not linked to a client, so there is no conversation to show. Link it to a
          company first — the conversation belongs to them, not to the build.
        </div>
      </Card>
    );
  }

  return (
    <Card className="pm-tab-panel">
      <div className="pm-tab-header" style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
        <SectionTitle
          title="Client conversation"
          subtitle={`Threads with ${clientName || "this client"}, across every project you deliver for them.`}
        />
        <Button size="sm" iconRight={<IconArrowRight size={13} />} onClick={openClient}>
          Open conversation
        </Button>
      </div>

      <div className="pm-document-summary">
        This conversation belongs to the client, not to this project — it carries on between builds.
        Read it here; reply from the client page so the thread stays in one place.
      </div>

      {error ? (
        <div className="pm-tab-message pm-tab-message--danger" style={{ margin: 16 }}>
          {compactDevFlowError(error)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="pm-tab-empty">
          {loading
            ? "Loading conversation…"
            : "No threads with this client yet. Open the client to start one."}
        </div>
      ) : (
        <div className="pm-tab-list">
          {conversations.slice(0, limit).map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className="pm-tab-list-row pm-artifact-row"
              style={{ textAlign: "left", border: 0, borderTop: "1px solid var(--border-soft)", background: "none", color: "inherit", cursor: "pointer", width: "100%" }}
              onClick={openClient}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <IconMessageCircle size={13} />
                  <strong style={{ fontSize: 13.5, fontWeight: 650, overflowWrap: "anywhere" }}>
                    {conversation.title}
                  </strong>
                  {Boolean(conversation.unreadCount) && (
                    <Badge tone="amber">{conversation.unreadCount} unread</Badge>
                  )}
                </span>
                {conversation.messages?.[0]?.body && (
                  <span
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: "var(--text-2)",
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {conversation.messages[0].body}
                  </span>
                )}
                <span style={{ display: "block", marginTop: 4, color: "var(--text-3)", fontSize: 11.5 }}>
                  {conversation._count.messages} messages · last activity{" "}
                  {formatDevFlowDate(conversation.lastMessageAt ?? conversation.createdAt)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {conversations.length > limit && (
        <button
          type="button"
          className="pm-client-doc-group"
          onClick={openClient}
        >
          <IconMessageCircle size={13} />
          <span>View all {conversations.length} threads with {clientName || "this client"}</span>
        </button>
      )}
    </Card>
  );
}
