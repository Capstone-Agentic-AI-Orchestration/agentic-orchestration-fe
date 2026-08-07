"use client";

import { Badge, Button, Card, EmptyState, Skeleton } from "@/shared/components/ui";
import type {
  DevFlowRuntimeAdapter,
  DevFlowRuntimeMachine,
} from "@/shared/api/devflow-api";

/** Wire kind → the name people actually use for the tool. */
const ADAPTER_LABELS: Record<string, string> = {
  CLAUDE_CODE: "Claude Code",
  CODEX_CLI: "Codex CLI",
  COPILOT_CLI: "GitHub Copilot",
  OPENCODE_CLI: "OpenCode",
  ANTIGRAVITY_CLI: "Antigravity",
  HERMES_CLI: "Hermes",
  REASONIX_CLI: "Reasonix",
  GEMINI_CLI: "Gemini",
};

interface RuntimesMachinesSectionProps {
  machines: DevFlowRuntimeMachine[];
  loading: boolean;
  error: string | null;
  onConnect: () => void;
  onRevoke: (id: string) => void;
  revokingId: string | null;
  /** The machine the visitor is sitting at, discovered over loopback. Null if no companion found. */
  thisMachineId: string | null;
}

/**
 * "Seen 4s ago" beats a timestamp here.
 *
 * The only question this line answers is whether the machine is still talking, and a relative gap
 * answers it without the reader doing arithmetic against their own clock.
 */
function relativeSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "never seen";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(lastSeenAt).getTime()) / 1000));
  if (seconds < 60) return `seen ${seconds}s ago`;
  if (seconds < 3600) return `seen ${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `seen ${Math.floor(seconds / 3600)}h ago`;
  return `seen ${Math.floor(seconds / 86_400)}d ago`;
}

function AdapterRow({ adapter }: { adapter: DevFlowRuntimeAdapter }) {
  const label = ADAPTER_LABELS[adapter.kind] ?? adapter.kind;

  // Three states worth distinguishing: not installed, installed but nobody signed in, and ready.
  // The middle one is the whole reason `authenticated` is reported separately from `version`.
  const detail =
    adapter.status === "MISSING"
      ? "not installed"
      : adapter.authenticated
        ? "signed in"
        : "not signed in";

  const tone = adapter.status === "MISSING" ? "gray" : adapter.authenticated ? "green" : "amber";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
        borderTop: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
        opacity: adapter.status === "MISSING" ? 0.55 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        {adapter.version && (
          <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "monospace" }}>
            {adapter.version}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
        {/* Said out loud rather than implied: DevFlow can see this tool but cannot drive it yet, so
            nobody expects it to pick up work. */}
        {adapter.status !== "MISSING" && !adapter.dispatchable && (
          <Badge tone="gray">detected only</Badge>
        )}
        <Badge tone={tone}>{detail}</Badge>
      </div>
    </div>
  );
}

export function RuntimesMachinesSection({
  machines,
  loading,
  error,
  onConnect,
  onRevoke,
  revokingId,
  thisMachineId,
}: RuntimesMachinesSectionProps) {
  if (loading) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} h={160} r={8} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          color: "var(--text-error)",
          fontSize: 13,
          padding: 12,
          backgroundColor: "var(--bg-error)",
          borderRadius: 8,
        }}
      >
        Could not load machines: {error}
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <EmptyState
        title="No machines connected"
        description="Connect a machine to let DevFlow see the AI CLIs installed on it. Detection runs on your own computer, not on the server."
        action={
          <Button variant="primary" onClick={onConnect}>
            Connect a machine
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {machines.map((machine) => (
        <Card key={machine.id} style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{machine.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                {machine.os} · {machine.arch} · runtime v{machine.runtimeVersion} ·{" "}
                {relativeSeen(machine.lastSeenAt)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {/* Worth calling out explicitly: with several machines paired, the one you can actually
                  go and fix is the one you are sitting at. */}
              {thisMachineId === machine.id && <Badge tone="blue">This machine</Badge>}
              <Badge tone={machine.online ? "green" : "gray"}>
                {machine.online ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>

          {machine.adapters.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-2)", padding: "8px 0" }}>
              No CLIs reported yet — the daemon reports them on its first heartbeat.
            </div>
          ) : (
            <div>
              {machine.adapters.map((adapter) => (
                <AdapterRow key={adapter.id} adapter={adapter} />
              ))}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color: "var(--text-2)",
                marginBottom: 6,
              }}
            >
              Project directories
            </div>
            {machine.resources.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                None registered. Run <code>devflow-runtime resource add</code> on that machine.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 4 }}>
                {machine.resources.map((resource) => (
                  <div
                    key={resource.id}
                    style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}
                  >
                    <span>{resource.name}</span>
                    <span style={{ color: "var(--text-2)", fontFamily: "monospace" }}>
                      {resource.access}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Button
              variant="ghost"
              onClick={() => onRevoke(machine.id)}
              disabled={revokingId === machine.id}
              style={{ fontSize: 12, color: "var(--text-error)" }}
            >
              {revokingId === machine.id ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
