"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconLock,
  IconClose,
  IconPlus,
} from "@/shared/components/icons";
import { useDevFlowAgent, useDevFlowAgentSkills } from "@/shared/hooks/use-devflow-agents";
import {
  attachDevFlowAgentSkill,
  createDevFlowAgentSkill,
  deleteDevFlowAgent,
  deleteDevFlowAgentSkill,
  detachDevFlowAgentSkill,
  updateDevFlowAgent,
  updateDevFlowAgentSkill,
  type DevFlowAgentDetail,
  type DevFlowAgentSkill,
} from "@/shared/api/devflow-api";
import { relativeTime } from "./pm-agents-view";

type AgentTab = "overview" | "work" | "capabilities" | "settings";

const TABS: Array<{ id: AgentTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "work", label: "Work" },
  { id: "capabilities", label: "Capabilities" },
  { id: "settings", label: "Settings" },
];

export function PMAgentDetailView({ agentId }: { agentId: string }) {
  const router = useRouter();
  const { agent, loading, error, setAgent, refresh } = useDevFlowAgent(agentId);
  const [tab, setTab] = useState<AgentTab>("overview");

  if (loading && !agent) return <Card className="pm-tab-panel pm-tab-empty">Loading agent...</Card>;
  if (error) return <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">{error}</Card>;
  if (!agent) return <Card className="pm-tab-panel pm-tab-empty">This agent is unavailable.</Card>;

  const working = agent.running > 0;

  return (
    <div className="pm-agent-detail" data-screen-label={`PM - Agent - ${agent.key}`}>
      <div className="pm-agent-crumbs">
        <button type="button" onClick={() => router.push("/pm/agents")}>
          <IconArrowLeft size={13} /> Agents
        </button>
        <span>/</span>
        <strong>{agent.name}</strong>
      </div>

      <header className="pm-agent-head">
        <span className="pm-agent-avatar" aria-hidden="true">{agent.avatarEmoji || "🤖"}</span>
        <div className="pm-agent-head-text">
          <h1>
            {agent.name}
            <span className={`pm-agent-live${working ? " is-working" : ""}`}>
              <span aria-hidden="true" /> {working ? `Working (${agent.running})` : "Idle"}
            </span>
          </h1>
          <p>{agent.description || "No description"}</p>
          {agent.runtimeMissing && (
            <p className="pm-agent-runtime-warning">
              <IconAlertTriangle size={13} />
              No subagent named <code>{agent.key}</code> is deployed on the Eve service. Runs that
              dispatch it will fail. Deploy the agent package to fix it.
            </p>
          )}
          <div className="pm-agent-meta">
            <span>{agent.model || "Default model"}</span>
            <span>{agent.accessScope === "PERSONAL" ? "Personal" : "Workspace"}</span>
            <span>Concurrency {agent.concurrency}</span>
            {agent.isBuiltIn && <span>Built in</span>}
            <span>Updated {relativeTime(agent.updatedAt)}</span>
          </div>
        </div>
      </header>

      <nav className="pm-agent-tabs" role="tablist" aria-label="Agent sections">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            className={tab === entry.id ? "is-active" : ""}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && <OverviewTab agent={agent} />}
      {tab === "work" && <WorkTab agent={agent} />}
      {tab === "capabilities" && <CapabilitiesTab agent={agent} onChanged={setAgent} onReload={refresh} />}
      {tab === "settings" && (
        <SettingsTab
          agent={agent}
          onChanged={setAgent}
          onRemoved={() => router.push("/pm/agents")}
        />
      )}
    </div>
  );
}

function OverviewTab({ agent }: { agent: DevFlowAgentDetail }) {
  return (
    <div className="pm-agent-overview">
      <div className="pm-agent-overview-main">
        <section>
          <h3>Now <span>{agent.activity.active.length === 0 ? "No active work" : `${agent.activity.active.length} running`}</span></h3>
          {agent.activity.active.length === 0 ? (
            <p className="pm-agent-empty">This agent isn&apos;t running anything right now.</p>
          ) : (
            <div className="pm-agent-runs">
              {agent.activity.active.map((run) => (
                <div key={run.id} className="pm-agent-run">
                  <strong>{run.project?.companyName ?? "Unknown project"}</strong>
                  <span>{run.nodeId ?? "—"} · {run.engine}</span>
                  <time dateTime={run.startedAt}>started {relativeTime(run.startedAt)}</time>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3>Recent work <span>{agent.activity.recent.length === 0 ? "Nothing finished yet" : `${agent.activity.recent.length} shown`}</span></h3>
          {agent.activity.recent.length === 0 ? (
            <p className="pm-agent-empty">This agent hasn&apos;t completed anything yet.</p>
          ) : (
            <div className="pm-agent-runs">
              {agent.activity.recent.map((run) => (
                <div key={run.id} className="pm-agent-run">
                  <strong>{run.project?.companyName ?? "Unknown project"}</strong>
                  <span>{run.nodeId ?? "—"} · {run.model || run.engine}</span>
                  <time dateTime={run.completedAt ?? run.startedAt}>
                    {run.completedAt ? relativeTime(run.completedAt) : "—"}
                  </time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="pm-agent-rail">
        <Card className="pm-tab-panel pm-tab-panel--padded">
          <h4>Agent</h4>
          <dl>
            <div><dt>Owner</dt><dd>{agent.owner?.fullName || agent.owner?.email || "Workspace"}</dd></div>
            <div><dt>Access</dt><dd>{agent.accessScope === "PERSONAL" ? "Personal" : "Workspace"}</dd></div>
            <div><dt>Model</dt><dd>{agent.model || "Default"}</dd></div>
            <div><dt>Concurrency</dt><dd>{agent.concurrency}</dd></div>
            <div><dt>Dispatch key</dt><dd><code>{agent.key}</code></dd></div>
            {/* Identity and capability are separate; they only coincide for built-ins. */}
            {agent.runtimeKey !== agent.key && (
              <div><dt>Runtime</dt><dd><code>{agent.runtimeKey}</code></dd></div>
            )}
            {agent.builtIn?.node && (
              <div><dt>Pipeline node</dt><dd><code>{agent.builtIn.node}</code></dd></div>
            )}
          </dl>
        </Card>

        <Card className="pm-tab-panel pm-tab-panel--padded">
          <h4>Skills <span>{agent.skills.length}</span></h4>
          {agent.skills.length === 0 ? (
            <p className="pm-agent-empty">No skills assigned</p>
          ) : (
            <ul className="pm-agent-skill-chips">
              {agent.skills.map((skill) => <li key={skill.id}>{skill.name}</li>)}
            </ul>
          )}
        </Card>

        <Card className="pm-tab-panel pm-tab-panel--padded">
          <h4>Last {agent.activity.windowDays} days</h4>
          <p className="pm-agent-stat">{agent.activity.completedInWindow}</p>
          <p className="pm-agent-empty">
            {agent.activity.completedInWindow === 0
              ? `No completions in the last ${agent.activity.windowDays} days.`
              : "completed dispatches"}
          </p>
        </Card>
      </aside>
    </div>
  );
}

function WorkTab({ agent }: { agent: DevFlowAgentDetail }) {
  const rows = [...agent.activity.active, ...agent.activity.recent];
  if (rows.length === 0) {
    return <Card className="pm-tab-panel pm-tab-empty">No dispatches recorded for this agent yet.</Card>;
  }
  return (
    <div className="pm-agent-work">
      <div className="pm-agent-work-row pm-agent-work-row--head">
        <span>Project</span><span>Node</span><span>Engine</span><span>Model</span><span>Tokens</span><span>When</span>
      </div>
      {rows.map((run) => (
        <div key={run.id} className="pm-agent-work-row">
          <span>{run.project?.companyName ?? "—"}</span>
          <span className="mono">{run.nodeId ?? "—"}</span>
          <span>{run.engine}</span>
          <span className="mono">{run.model || "—"}</span>
          <span>{(run.inputTokens ?? 0) + (run.outputTokens ?? 0) || "—"}</span>
          <time dateTime={run.completedAt ?? run.startedAt}>
            {relativeTime(run.completedAt ?? run.startedAt)}
          </time>
        </div>
      ))}
    </div>
  );
}

function CapabilitiesTab({
  agent,
  onChanged,
  onReload,
}: {
  agent: DevFlowAgentDetail;
  onChanged: (agent: DevFlowAgentDetail) => void;
  onReload: () => Promise<void> | void;
}) {
  const [section, setSection] = useState<"instructions" | "skills">("instructions");

  return (
    <div className="pm-agent-capabilities">
      <aside className="pm-agent-subnav">
        <button type="button" className={section === "instructions" ? "is-active" : ""} onClick={() => setSection("instructions")}>
          Instructions
        </button>
        <button type="button" className={section === "skills" ? "is-active" : ""} onClick={() => setSection("skills")}>
          Skills <span>{agent.skills.length}</span>
        </button>
      </aside>

      <div className="pm-agent-capabilities-body">
        {section === "instructions" ? (
          <InstructionsPanel agent={agent} onChanged={onChanged} />
        ) : (
          <SkillsPanel agent={agent} onChanged={onChanged} onReload={onReload} />
        )}
      </div>
    </div>
  );
}

function InstructionsPanel({
  agent,
  onChanged,
}: {
  agent: DevFlowAgentDetail;
  onChanged: (agent: DevFlowAgentDetail) => void;
}) {
  const [value, setValue] = useState(agent.instructions ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(agent.instructions ?? "");
  }, [agent.id, agent.instructions]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      onChanged(await updateDevFlowAgent(agent.id, { instructions: value }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="pm-agent-panel">
      <h3>Instructions</h3>
      <p className="pm-agent-panel-hint">
        The system prompt sent on every dispatch. Markdown is supported. Leaving it empty uses the
        built-in prompt this agent ships with.
      </p>

      {agent.usesBuiltInPrompt && agent.builtInPrompt && (
        <details className="pm-agent-builtin-prompt">
          <summary>Currently running on the built-in prompt — view it</summary>
          <pre>{agent.builtInPrompt}</pre>
        </details>
      )}

      <Textarea
        rows={18}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={"Define this agent's role, expertise, and working style.\n\n## Working style\n- Write small, focused changes\n\n## Constraints\n- Follow the existing patterns in features/"}
      />

      {error && <div className="field-error">{error}</div>}

      <div className="pm-agent-panel-actions">
        {agent.instructions && (
          <Button
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={() => setValue("")}
            title="Clear the override and go back to the built-in prompt"
          >
            Reset to built-in
          </Button>
        )}
        <Button size="sm" icon={saved ? <IconCheck size={13} /> : undefined} disabled={saving} onClick={() => void save()}>
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </Button>
      </div>
    </section>
  );
}

function SkillsPanel({
  agent,
  onChanged,
  onReload,
}: {
  agent: DevFlowAgentDetail;
  onChanged: (agent: DevFlowAgentDetail) => void;
  onReload: () => Promise<void> | void;
}) {
  const { skills, refresh } = useDevFlowAgentSkills(agent.groupId);
  const [editing, setEditing] = useState<DevFlowAgentSkill | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const attached = new Set(agent.skills.map((skill) => skill.id));

  const toggle = async (skillId: string) => {
    setBusy(skillId);
    setError("");
    try {
      onChanged(
        attached.has(skillId)
          ? await detachDevFlowAgentSkill(agent.id, skillId)
          : await attachDevFlowAgentSkill(agent.id, skillId),
      );
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : String(toggleError));
    } finally {
      setBusy("");
    }
  };

  const remove = async (skill: DevFlowAgentSkill) => {
    setBusy(skill.id);
    setError("");
    try {
      await deleteDevFlowAgentSkill(skill.id);
      await Promise.all([refresh(), onReload()]);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : String(removeError));
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="pm-agent-panel">
      <div className="pm-tab-header">
        <div>
          <h3>Skills</h3>
          <p className="pm-agent-panel-hint">
            Markdown documents shared across the workspace. A skill attached to this agent is
            appended to its system prompt, so it changes behaviour rather than only documenting it.
          </p>
        </div>
        <Button size="sm" icon={<IconPlus size={13} />} onClick={() => setCreating(true)}>New skill</Button>
      </div>

      {agent.builtIn && agent.builtIn.tools.length > 0 && (
        <div className="pm-agent-tools-note">
          <strong>Built-in tools</strong>
          <span>Wired in the agent package, not editable here.</span>
          <span className="pm-agent-tool-chips">
            {agent.builtIn.tools.map((tool) => <code key={tool}>{tool}</code>)}
          </span>
        </div>
      )}

      {error && <div className="field-error">{error}</div>}

      {skills.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">
          No skills in this workspace yet. Create one and attach it to any agent.
        </Card>
      ) : (
        <div className="pm-agent-skill-list">
          {skills.map((skill) => (
            <div key={skill.id} className={`pm-agent-skill${attached.has(skill.id) ? " is-attached" : ""}`}>
              <label className="pm-agent-skill-toggle">
                <input
                  type="checkbox"
                  checked={attached.has(skill.id)}
                  disabled={busy === skill.id}
                  onChange={() => void toggle(skill.id)}
                />
                <span className="pm-agent-skill-text">
                  <strong>{skill.name}</strong>
                  <span>{skill.description || "No description"}</span>
                </span>
              </label>
              <div className="pm-agent-skill-actions">
                {typeof skill.agentCount === "number" && (
                  <Badge tone="gray">{skill.agentCount} agent{skill.agentCount === 1 ? "" : "s"}</Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => setEditing(skill)}>Edit</Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<IconClose size={13} />}
                  disabled={busy === skill.id}
                  onClick={() => void remove(skill)}
                  title="Delete this skill from the workspace"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <SkillEditorModal
        open={creating || Boolean(editing)}
        groupId={agent.groupId}
        skill={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={async () => {
          setCreating(false);
          setEditing(null);
          await Promise.all([refresh(), onReload()]);
        }}
      />
    </section>
  );
}

function SkillEditorModal({
  open,
  groupId,
  skill,
  onClose,
  onSaved,
}: {
  open: boolean;
  groupId: string;
  skill: DevFlowAgentSkill | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(skill?.name ?? "");
    setDescription(skill?.description ?? "");
    setBody(skill?.body ?? "");
    setError("");
  }, [skill, open]);

  const submit = async () => {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (skill) {
        await updateDevFlowAgentSkill(skill.id, {
          name: name.trim(),
          description: description.trim(),
          body,
        });
      } else {
        await createDevFlowAgentSkill({
          groupId,
          name: name.trim(),
          description: description.trim() || undefined,
          body,
        });
      }
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={skill ? "Edit skill" : "New skill"}>
      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Name">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tailwind conventions" />
        </Field>
        <Field label="Description" helper="One line, shown in the skill list.">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Field label="Markdown" helper="Appended to the system prompt of every agent this is attached to.">
          <Textarea
            rows={12}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={"## Tailwind conventions\n- Use design tokens, never raw hex\n- Prefer composition over @apply"}
          />
        </Field>
        {error && <div className="field-error">{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!name.trim() || !body.trim() || saving} onClick={() => void submit()}>
            {saving ? "Saving..." : skill ? "Save skill" : "Create skill"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function SettingsTab({
  agent,
  onChanged,
  onRemoved,
}: {
  agent: DevFlowAgentDetail;
  onChanged: (agent: DevFlowAgentDetail) => void;
  onRemoved: () => void;
}) {
  const [section, setSection] = useState<"general" | "access">("general");
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description ?? "");
  const [avatarEmoji, setAvatarEmoji] = useState(agent.avatarEmoji ?? "🤖");
  const [model, setModel] = useState(agent.model ?? "");
  const [concurrency, setConcurrency] = useState(String(agent.concurrency));
  const [accessScope, setAccessScope] = useState(agent.accessScope);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const parsed = Number.parseInt(concurrency, 10);
      onChanged(
        await updateDevFlowAgent(agent.id, {
          name: name.trim(),
          description,
          avatarEmoji,
          model,
          concurrency: Number.isFinite(parsed) ? Math.min(50, Math.max(1, parsed)) : 1,
          accessScope,
        }),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await deleteDevFlowAgent(agent.id);
      onRemoved();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : String(removeError));
      setSaving(false);
    }
  };

  return (
    <div className="pm-agent-capabilities">
      <aside className="pm-agent-subnav">
        <button type="button" className={section === "general" ? "is-active" : ""} onClick={() => setSection("general")}>General</button>
        <button type="button" className={section === "access" ? "is-active" : ""} onClick={() => setSection("access")}>Access</button>
      </aside>

      <div className="pm-agent-capabilities-body">
        {section === "general" ? (
          <section className="pm-agent-panel">
            <h3>Profile</h3>
            <p className="pm-agent-panel-hint">How this agent appears across the workspace.</p>
            <div className="pm-tab-form-grid">
              <Field label="Avatar"><Input value={avatarEmoji} onChange={(event) => setAvatarEmoji(event.target.value)} /></Field>
              <Field label="Name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
            </div>
            <Field label="Description">
              <Textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>

            <h3 style={{ marginTop: 18 }}>Execution</h3>
            <p className="pm-agent-panel-hint">Model and parallel task limit used when this agent is dispatched.</p>
            <div className="pm-tab-form-grid">
              <Field label="Model" helper="Empty uses the run's default model.">
                <Input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Default" />
              </Field>
              <Field label="Concurrency" helper="Max concurrent tasks (1–50)">
                <Input type="number" min={1} max={50} value={concurrency} onChange={(event) => setConcurrency(event.target.value)} />
              </Field>
            </div>

            {error && <div className="field-error">{error}</div>}
            <div className="pm-agent-panel-actions">
              <Button size="sm" icon={saved ? <IconCheck size={13} /> : undefined} disabled={saving} onClick={() => void save()}>
                {saving ? "Saving..." : saved ? "Saved" : "Save"}
              </Button>
            </div>
          </section>
        ) : (
          <section className="pm-agent-panel">
            <h3>Access</h3>
            <p className="pm-agent-panel-hint">Who can see and use this agent.</p>
            <Field label="Visibility">
              <Select value={accessScope} onChange={(event) => setAccessScope(event.target.value as typeof accessScope)}>
                <option value="WORKSPACE">Workspace — everyone in this team</option>
                <option value="PERSONAL">Personal — only me</option>
              </Select>
            </Field>
            {error && <div className="field-error">{error}</div>}
            <div className="pm-agent-panel-actions">
              <Button size="sm" disabled={saving} onClick={() => void save()}>
                {saving ? "Saving..." : saved ? "Saved" : "Save"}
              </Button>
            </div>

            <div className="pm-agent-danger">
              <div>
                <strong>{agent.isBuiltIn ? "Archive this agent" : "Delete this agent"}</strong>
                <span>
                  {agent.isBuiltIn
                    ? "Built-in agents are archived rather than deleted — runs dispatch them by key, so removing the record would break a run rather than tidy the list."
                    : "This cannot be undone. Attached skills stay in the workspace."}
                </span>
              </div>
              {confirmRemove ? (
                <div className="row gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>Cancel</Button>
                  <Button variant="danger" size="sm" disabled={saving} onClick={() => void remove()}>
                    {agent.isBuiltIn ? "Archive" : "Delete"}
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" icon={<IconAlertTriangle size={13} />} onClick={() => setConfirmRemove(true)}>
                  {agent.isBuiltIn ? "Archive" : "Delete"}
                </Button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
