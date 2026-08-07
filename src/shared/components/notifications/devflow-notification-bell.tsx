"use client";

import { useState } from "react";
import { Card } from "@/shared/components/ui";
import { IconBell } from "@/shared/components/icons";
import { DevFlowNotificationList } from "@/shared/components/notifications/devflow-notification-list";
import { useDevFlowNotifications } from "@/shared/hooks/use-devflow-notifications";

/**
 * Topbar bell for the consoles that still have one. The PM console no longer does — its
 * notifications moved into the account menu — so this is the developer console's surface.
 */
export function DevFlowNotificationBell() {
  const [open, setOpen] = useState(false);
  const state = useDevFlowNotifications();

  return (
    <div style={{ position: "relative" }}>
      <button className="cs-iconbtn" aria-label="Notifications" onClick={() => setOpen((value) => !value)}>
        <IconBell size={17} />
        {state.unreadCount > 0 && <span className="cs-iconbtn-badge">{state.unreadCount > 9 ? "9+" : state.unreadCount}</span>}
      </button>

      {open && (
        <Card style={{ position: "absolute", right: 0, top: 44, width: 380, maxWidth: "calc(100vw - 32px)", zIndex: 80, padding: 0, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
          <DevFlowNotificationList state={state} />
        </Card>
      )}
    </div>
  );
}
