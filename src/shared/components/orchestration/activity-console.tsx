"use client";

import { useRef, useEffect } from "react";
import { Card } from "@/shared/components/ui";
import { IconActivity, IconCpu, IconAlertTriangle, IconCheckCircle } from "@/shared/components/icons";
import { useOrchestrationStore, type ActivityLogEntry } from "@/shared/store/orchestration-store";

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function ActivityIcon({ entry }: { entry: ActivityLogEntry }) {
  if (entry.type === "system") {
    return <IconActivity size={12} style={{ color: "#4F8BFF", flexShrink: 0 }} />;
  }
  if (entry.description.toLowerCase().includes("fail") || entry.description.toLowerCase().includes("error")) {
    return <IconAlertTriangle size={12} style={{ color: "#EF4444", flexShrink: 0 }} />;
  }
  if (entry.description.toLowerCase().includes("complete") || entry.description.toLowerCase().includes("generated") || entry.description.toLowerCase().includes("passed")) {
    return <IconCheckCircle size={12} style={{ color: "#22C55E", flexShrink: 0 }} />;
  }
  return <IconCpu size={12} style={{ color: "#A78BFA", flexShrink: 0 }} />;
}

interface ActivityConsoleProps {
  maxHeight?: number;
}

export function ActivityConsole({ maxHeight = 300 }: ActivityConsoleProps) {
  const activityLog = useOrchestrationStore((s) => s.activityLog);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activityLog.length]);

  if (activityLog.length === 0) {
    return null;
  }

  return (
    <Card glass style={{ borderRadius: 16, overflow: "hidden" }}>
      <div className="row gap-2" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
        <IconActivity size={15} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Activity Log</span>
        <span style={{ color: "var(--text-3)", fontSize: 12, marginLeft: "auto" }}>{activityLog.length} events</span>
      </div>
      <div
        ref={scrollRef}
        style={{
          maxHeight,
          overflowY: "auto",
          padding: "8px 0",
        }}
      >
        {activityLog.map((entry, index) => (
          <div
            key={`${entry.timestamp}-${index}`}
            className="row gap-3"
            style={{
              padding: "6px 18px",
              fontSize: 13,
              lineHeight: 1.5,
              alignItems: "flex-start",
              transition: "background .1s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span style={{ color: "var(--text-3)", fontSize: 11, fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>
              {formatTime(entry.timestamp)}
            </span>
            <ActivityIcon entry={entry} />
            <span style={{ color: "var(--text-2)", fontWeight: 500, flexShrink: 0 }}>{entry.source}:</span>
            <span style={{ color: "var(--text-1)", wordBreak: "break-word" }}>{entry.description}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
