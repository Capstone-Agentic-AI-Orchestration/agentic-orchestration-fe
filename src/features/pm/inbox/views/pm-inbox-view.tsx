"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui";
import { IconCheck, IconRefresh } from "@/shared/components/icons";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";
import { useDevFlowNotifications } from "@/shared/hooks/use-devflow-notifications";
import type { DevFlowNotification } from "@/shared/api/devflow-api";

/**
 * The inbox as a mail client rather than as a dropdown that grew up.
 *
 * The dense sender / subject / snippet / time row is what every mail app converged on because
 * it is scannable in a single vertical sweep: weight carries unread, the left column answers
 * "who", the right column answers "when", and the middle stays one line so the eye never has to
 * re-find where the next item starts. The stacked cards this replaced fit about five items on a
 * screen; this fits twenty.
 */
export function PMInboxView() {
  const router = useRouter();
  const { notifications, unreadCount, loading, error, refresh, markRead, markAllRead } = useDevFlowNotifications();

  const openNotification = (notification: DevFlowNotification) => {
    if (!notification.readAt) void markRead(notification.id);
    // Opening a row opens the thing it is about, the way a mail row opens the message.
    if (notification.projectId) router.push(`/pm/project/${notification.projectId}`);
  };

  return (
    <div className="pm-inbox-view" data-screen-label="PM - Inbox">
      <SectionTitle
        title="Inbox"
        subtitle="Project activity, approvals, and account updates that need your attention."
      />

      <div className="pm-inbox">
        <div className="pm-inbox-toolbar">
          <span className="pm-inbox-status">
            {loading ? "Loading…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </span>
          <div className="row gap-2">
            {/* Button forwards `title` but not `aria-label`, and this one is icon-only. */}
            <Button variant="ghost" size="sm" icon={<IconRefresh size={13} />} onClick={refresh} title="Refresh inbox" />
            <Button
              variant="secondary"
              size="sm"
              icon={<IconCheck size={13} />}
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
          </div>
        </div>

        {error ? (
          <p className="pm-inbox-message is-error">{compactNotificationError(error)}</p>
        ) : loading && notifications.length === 0 ? (
          <div className="pm-inbox-skeleton" aria-label="Loading inbox">
            {[0, 1, 2, 3, 4].map((index) => <span key={index} />)}
          </div>
        ) : notifications.length === 0 ? (
          <p className="pm-inbox-message">
            Your inbox is clear. New project and account activity will appear here.
          </p>
        ) : (
          <ul className="pm-inbox-list">
            {notifications.map((notification) => (
              <li key={notification.id} className={`pm-inbox-row${notification.readAt ? "" : " is-unread"}`}>
                <button type="button" className="pm-inbox-row-main" onClick={() => openNotification(notification)}>
                  <span className="pm-inbox-unread-dot" aria-hidden="true" />
                  <span className="pm-inbox-sender">
                    {notification.actor?.fullName || notification.actor?.email || "System"}
                  </span>
                  <span className="pm-inbox-subject">
                    <strong>{notification.title}</strong>
                    {notification.body && <span className="pm-inbox-snippet"> — {notification.body}</span>}
                  </span>
                  <time className="pm-inbox-time" dateTime={notification.createdAt}>
                    {formatInboxDate(notification.createdAt)}
                  </time>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Mail-client date rules: something from today is placed by clock time, anything older by
 * calendar date. Which unit is useful changes with the message's age.
 */
function formatInboxDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  }
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
  }
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function compactNotificationError(message: string) {
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
