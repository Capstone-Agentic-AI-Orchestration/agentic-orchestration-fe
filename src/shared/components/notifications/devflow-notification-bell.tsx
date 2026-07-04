// @ts-nocheck
"use client";

import { useState } from "react";
import { Button, Card } from "@/shared/components/ui";
import { IconBell, IconCheck, IconRefresh } from "@/shared/components/icons";
import { useDevFlowNotifications } from "@/shared/hooks/use-devflow-notifications";

export function DevFlowNotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, error, refresh, markRead, markAllRead } = useDevFlowNotifications();

  return (
    <div style={{ position: "relative" }}>
      <button className="cs-iconbtn" aria-label="Notifications" onClick={() => setOpen((value) => !value)}>
        <IconBell size={17} />
        {unreadCount > 0 && <span className="cs-iconbtn-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <Card style={{ position: "absolute", right: 0, top: 44, width: 380, maxWidth: "calc(100vw - 32px)", zIndex: 80, padding: 0, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
          <div className="row" style={{ justifyContent: "space-between", padding: 14, borderBottom: "1px solid var(--border)", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Notifications</div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5 }}>{unreadCount} unread</div>
            </div>
            <div className="row gap-2">
              <Button variant="ghost" size="sm" icon={<IconRefresh size={13} />} onClick={refresh} />
              <Button variant="secondary" size="sm" icon={<IconCheck size={13} />} onClick={markAllRead} disabled={unreadCount === 0}>Read all</Button>
            </div>
          </div>

          <div style={{ maxHeight: 420, overflow: "auto" }}>
            {loading ? (
              <div style={{ padding: 14, color: "var(--text-2)", fontSize: 13 }}>Loading notifications...</div>
            ) : error ? (
              <div style={{ padding: 14, color: "#FCA5A5", fontSize: 13 }}>{compactNotificationError(error)}</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 14, color: "var(--text-3)", fontSize: 13 }}>No notifications yet.</div>
            ) : notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => !notification.readAt && markRead(notification.id)}
                style={{
                  width: "100%",
                  border: 0,
                  borderBottom: "1px solid var(--border)",
                  padding: "12px 14px",
                  background: notification.readAt ? "transparent" : "rgba(79,139,255,.10)",
                  color: "white",
                  cursor: notification.readAt ? "default" : "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{notification.title}</div>
                    {notification.body && <div style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45, marginTop: 4 }}>{notification.body}</div>}
                  </div>
                  {!notification.readAt && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#60A5FA", flexShrink: 0, marginTop: 5 }} />}
                </div>
                <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 7 }}>
                  {notification.actor?.fullName || notification.actor?.email || "System"} - {formatNotificationDate(notification.createdAt)}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function formatNotificationDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function compactNotificationError(message) {
  if (!message) return "";
  try {
    const parsed = JSON.parse(message);
    if (Array.isArray(parsed.message)) return parsed.message.join(" ");
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    return message;
  }
  return message;
}
