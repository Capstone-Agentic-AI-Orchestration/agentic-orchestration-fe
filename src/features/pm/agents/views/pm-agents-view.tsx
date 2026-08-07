"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { IconLock, IconPlus, IconSearch, IconUsers } from "@/shared/components/icons";
import { SectionTitle } from "@/features/pm/projects/components/pm-project-ui";
import { useDevFlowAgents } from "@/shared/hooks/use-devflow-agents";
import { useSelectedTeamWorkspace } from "@/shared/projects/selected-team-workspace-context";
import {
  createDevFlowAgent,
  listDevFlowAgentRuntimes,
  type DevFlowAgentListItem,
  type DevFlowAgentListScope,
  type DevFlowAgentRuntime,
} from "@/shared/api/devflow-api";

const SCOPES: Array<{ id: DevFlowAgentListScope; label: string }> = [
  { id: "mine", label: "Mine" },
  { id: "all", label: "All" },
  { id: "archived", label: "Archived" },
];

/**
 * The agent roster for a workspace.
 *
 * This replaced a hand-maintained TypeScript constant that mirrored the agent package: it could
 * drift silently and nothing on it could be changed. Every row is a record now, and every
 * number in it — runs, last active, whether an agent is working — is read from the invocations
 * the runs themselves wrote rather than from anything the console can set.
 */
export function PMAgentsView() {
  const router = useRouter();
  const { selectedTeamId } = useSelectedTeamWorkspace();
  const [scope, setScope] = useState<DevFlowAgentListScope>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { agents, counts, loading, error, refresh } = useDevFlowAgents(selectedTeamId, scope, search);

  return (
    <div className="pm-agents-view" data-screen-label="PM - Agents">
      <div className="pm-tab-header">
        <SectionTitle
          title="Agents"
          subtitle="The specialists that plan, build and review every project. Editing an agent changes what it is told on its next run."
        />
        <Button icon={<IconPlus size={13} />} onClick={() => setCreateOpen(true)} disabled={!selectedTeamId}>
          New agent
        </Button>
      </div>

      <div className="pm-agents-toolbar">
        <div className="pm-agents-search">
          <IconSearch size={14} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search agents..."
            aria-label="Search agents"
          />
        </div>
        <div className="pm-agents-scopes" role="group" aria-label="Filter agents">
          {SCOPES.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`pm-agents-scope${scope === option.id ? " is-active" : ""}`}
              aria-pressed={scope === option.id}
              onClick={() => setScope(option.id)}
            >
              {option.label}
              <span>{counts[option.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {!selectedTeamId ? (
        <Card className="pm-tab-panel pm-tab-empty">Select a team workspace to see its agents.</Card>
      ) : error ? (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">{error}</Card>
      ) : loading && agents.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">Loading agents...</Card>
      ) : agents.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">
          {scope === "archived" ? "No archived agents." : "No agents match."}
        </Card>
      ) : (
        <div className="pm-agents-table" role="table" aria-label="Agents">
          <div className="pm-agents-row pm-agents-row--head" role="row">
            <span role="columnheader">Agent</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Owner</span>
            <span role="columnheader">Access</span>
            <span role="columnheader">Skills</span>
            <span role="columnheader">Last active</span>
            <span role="columnheader">Runs</span>
          </div>
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} onOpen={() => router.push(`/pm/agents/${agent.id}`)} />
          ))}
        </div>
      )}

      <NewAgentModal
        open={createOpen}
        groupId={selectedTeamId}
        onClose={() => setCreateOpen(false)}
        onCreated={async (agentId) => {
          setCreateOpen(false);
          await refresh();
          router.push(`/pm/agents/${agentId}`);
        }}
      />
    </div>
  );
}

function AgentRow({ agent, onOpen }: { agent: DevFlowAgentListItem; onOpen: () => void }) {
  const working = agent.running > 0;
  return (
    <button type="button" className="pm-agents-row" role="row" onClick={onOpen}>
      <span className="pm-agents-cell pm-agents-identity" role="cell">
        <span className="pm-agents-avatar" aria-hidden="true">{agent.avatarEmoji || "🤖"}</span>
        <span className="pm-agents-identity-text">
          <strong>
            {agent.name}
            {agent.accessScope === "PERSONAL" && <IconLock size={11} aria-label="Personal" />}
            {agent.isBuiltIn && <span className="pm-agents-builtin">Built in</span>}
            {agent.runtimeMissing && (
              <span
                className="pm-agents-noruntime"
                title="No subagent deployed on the Eve service. Dispatching this agent will fail."
              >
                No runtime
              </span>
            )}
          </strong>
          <span>{agent.description || "No description"}</span>
        </span>
      </span>

      <span className="pm-agents-cell" role="cell">
        <span className={`pm-agents-status${working ? " is-working" : ""}`}>
          <span className="pm-agents-status-dot" aria-hidden="true" />
          {working ? `Working (${agent.running})` : "Idle"}
        </span>
      </span>

      <span className="pm-agents-cell pm-agents-muted" role="cell">
        {agent.owner?.fullName || agent.owner?.email || "Workspace"}
      </span>

      <span className="pm-agents-cell pm-agents-muted" role="cell">
        {agent.accessScope === "PERSONAL" ? "Owner only" : "Workspace"}
      </span>

      <span className="pm-agents-cell pm-agents-muted" role="cell">{agent.skillCount}</span>

      <span className="pm-agents-cell pm-agents-muted" role="cell">
        {agent.lastActiveAt ? relativeTime(agent.lastActiveAt) : "No activity"}
      </span>

      <span className="pm-agents-cell pm-agents-muted" role="cell">{agent.runs}</span>
    </button>
  );
}

function NewAgentModal({
  open,
  groupId,
  onClose,
  onCreated,
}: {
  open: boolean;
  groupId: string | null;
  onClose: () => void;
  onCreated: (agentId: string) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🤖");
  const [runtimes, setRuntimes] = useState<DevFlowAgentRuntime[]>([]);
  const [runtimeKey, setRuntimeKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Capability is a closed set: the console offers what is deployed and cannot invent a tool.
  useEffect(() => {
    if (!open) return;
    listDevFlowAgentRuntimes()
      .then(({ runtimes: available }) => {
        setRuntimes(available);
        setRuntimeKey((current) => current || available[0]?.key || "");
      })
      .catch(() => setRuntimes([]));
  }, [open]);

  const chosen = runtimes.find((runtime) => runtime.key === runtimeKey);

  const submit = async () => {
    if (!name.trim() || !groupId) return;
    setSaving(true);
    setError("");
    try {
      const agent = await createDevFlowAgent({
        groupId,
        name: name.trim(),
        description: description.trim() || undefined,
        avatarEmoji: avatarEmoji.trim() || undefined,
        runtimeKey: runtimeKey || undefined,
      });
      setName("");
      setDescription("");
      await onCreated(agent.id);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : String(createError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New agent">
      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Name">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="UI Developer" />
        </Field>
        <Field label="Description" helper="Shown wherever the agent is listed or assigned.">
          <Textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Handles UI focused websites" />
        </Field>
        <Field label="Avatar" helper="A single emoji.">
          <Input value={avatarEmoji} onChange={(event) => setAvatarEmoji(event.target.value)} style={{ width: 90 }} />
        </Field>
        <Field
          label="Runtime"
          helper={chosen ? chosen.summary : "Which deployed capability executes this agent."}
        >
          <Select value={runtimeKey} onChange={(event) => setRuntimeKey(event.target.value)}>
            {runtimes.length === 0 && <option value="">Loading runtimes...</option>}
            {runtimes.map((runtime) => (
              <option key={runtime.key} value={runtime.key}>
                {runtime.label}{runtime.deployed === false ? " (not deployed yet)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        {chosen?.deployed === false && (
          <p className="pm-agents-hint" style={{ color: "#FCA5A5" }}>
            This runtime is not deployed yet, so the agent will not be able to run until the agent
            package is redeployed.
          </p>
        )}
        <p className="pm-agents-hint">
          <IconUsers size={12} /> You can write its instructions and attach skills once it exists.
        </p>
        {error && <div className="field-error">{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!name.trim() || saving} onClick={() => void submit()}>
            {saving ? "Creating..." : "Create agent"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function relativeTime(value: string): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days > 90 ? new Date(value).toLocaleDateString() : `${days}d ago`;
}
