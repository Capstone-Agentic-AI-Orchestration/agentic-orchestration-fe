"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDevFlowNotifications,
  markAllDevFlowNotificationsRead,
  markDevFlowNotificationRead,
  type DevFlowNotification,
} from "@/shared/api/devflow-api";

export function useDevFlowNotifications() {
  const [notifications, setNotifications] = useState<DevFlowNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setNotifications(await getDevFlowNotifications());
    } catch (nextError) {
      setNotifications([]);
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    await markDevFlowNotificationRead(id);
    await refresh();
  };

  const markAllRead = async () => {
    await markAllDevFlowNotificationsRead();
    await refresh();
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getDevFlowNotifications()
      .then((result) => { if (active) setNotifications(result); })
      .catch((nextError) => { if (active) { setNotifications([]); setError(nextError instanceof Error ? nextError.message : String(nextError)); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  return { notifications, unreadCount, loading, error, refresh, markRead, markAllRead };
}
