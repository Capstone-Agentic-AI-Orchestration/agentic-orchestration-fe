"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Button, Card, Field, Input, Modal, Select, Textarea } from "@/shared/components/ui";
import { IconList, IconLayout, IconPlus, IconRefresh } from "@/shared/components/icons";
import {
  createDevFlowProjectTask,
  updateDevFlowProjectTask,
  type DevFlowProfile,
  type DevFlowProjectTask,
  type DevFlowProjectTaskStatus,
  type DevFlowWorkOrder,
} from "@/shared/api/devflow-api";
import {
  agentsWorkingCount,
  buildBoardIssues,
  groupByColumn,
  ISSUE_COLUMNS,
  type BoardIssue,
  type IssueColumnId,
  type IssueFilter,
} from "./issue-board.model";

const FILTERS: Array<{ id: IssueFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "member", label: "Members" },
  { id: "agent", label: "Agents" },
];

/**
 * The project issue board, shared by the PM and developer consoles.
 *
 * `readOnly` is the same escape hatch the panels it replaces used: the two consoles render the
 * identical board and the caller decides whether the write affordances exist, rather than each
 * console growing its own near-copy that drifts.
 *
 * Drag and drop is native HTML5 rather than a library — a seven-column board moving one card at
 * a time does not need a dependency, and the agent lane is undraggable anyway.
 */
export function ProjectIssueBoard({
  projectId,
  tasks,
  workOrders,
  members,
  loading,
  error,
  readOnly = false,
  onChanged,
}: {
  projectId: string;
  tasks: DevFlowProjectTask[];
  workOrders: DevFlowWorkOrder[];
  members?: Array<{ userId: string; profile?: DevFlowProfile | null }>;
  loading?: boolean;
  error?: string;
  readOnly?: boolean;
  onChanged?: () => Promise<void> | void;
}) {
  const [filter, setFilter] = useState<IssueFilter>("all");
  const [view, setView] = useState<"board" | "list">("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [dragging, setDragging] = useState<BoardIssue | null>(null);
  const [dropTarget, setDropTarget] = useState<IssueColumnId | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const issues = useMemo(() => buildBoardIssues(tasks, workOrders, filter), [tasks, workOrders, filter]);
  const columns = useMemo(() => groupByColumn(issues), [issues]);
  const working = agentsWorkingCount(workOrders);

  const moveIssue = async (issue: BoardIssue, column: IssueColumnId) => {
    if (!issue.movable || issue.column === column || readOnly) return;
    setBusy(true);
    setActionError("");
    try {
      await updateDevFlowProjectTask(projectId, issue.id, { status: column as DevFlowProjectTaskStatus });
      await onChanged?.();
    } catch (moveError) {
      setActionError(moveError instanceof Error ? moveError.message : String(moveError));
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>, column: IssueColumnId) => {
    event.preventDefault();
    setDropTarget(null);
    const issue = dragging;
    setDragging(null);
    if (issue) void moveIssue(issue, column);
  };

  return (
    <div className="issue-board-shell" data-view={view}>
      <div className="issue-board-toolbar">
        <div className="issue-board-filters" role="group" aria-label="Filter issues">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`issue-board-filter${filter === option.id ? " is-active" : ""}`}
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="issue-board-toolbar-right">
          <span className={`issue-board-working${working > 0 ? " is-live" : ""}`}>
            {working > 0 && <span className="issue-board-working-dot" aria-hidden="true" />}
            {working} {working === 1 ? "agent" : "agents"} working
          </span>

          {onChanged && (
            <Button variant="ghost" size="sm" icon={<IconRefresh size={13} />} title="Refresh issues" onClick={() => void onChanged()} />
          )}

          <div className="issue-board-view-toggle">
            <button
              type="button"
              className={view === "board" ? "is-active" : ""}
              aria-label="Board view"
              aria-pressed={view === "board"}
              onClick={() => setView("board")}
            >
              <IconLayout size={13} />
            </button>
            <button
              type="button"
              className={view === "list" ? "is-active" : ""}
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <IconList size={13} />
            </button>
          </div>

          {!readOnly && (
            <Button size="sm" icon={<IconPlus size={13} />} onClick={() => setCreateOpen(true)}>
              New issue
            </Button>
          )}
        </div>
      </div>

      {(error || actionError) && (
        <Card className="pm-tab-panel pm-tab-message pm-tab-message--danger">{error || actionError}</Card>
      )}

      {loading && issues.length === 0 ? (
        <Card className="pm-tab-panel pm-tab-empty">Loading issues...</Card>
      ) : view === "board" ? (
        <div className="issue-board" data-busy={busy || undefined}>
          {ISSUE_COLUMNS.map((column) => (
            <div
              key={column.id}
              className={`issue-column${dropTarget === column.id ? " is-drop-target" : ""}`}
              data-tone={column.tone}
              onDragOver={(event) => {
                if (!dragging?.movable) return;
                event.preventDefault();
                setDropTarget(column.id);
              }}
              onDragLeave={() => setDropTarget((current) => (current === column.id ? null : current))}
              onDrop={(event) => onDrop(event, column.id)}
            >
              <div className="issue-column-head">
                <span className="issue-column-dot" aria-hidden="true" />
                <strong>{column.label}</strong>
                <span className="issue-column-count">{columns[column.id].length}</span>
              </div>

              <div className="issue-column-body">
                {columns[column.id].length === 0 ? (
                  <p className="issue-column-empty">No issues</p>
                ) : (
                  columns[column.id].map((issue) => (
                    <IssueCard
                      key={issue.key}
                      issue={issue}
                      draggable={!readOnly && issue.movable}
                      onDragStart={() => setDragging(issue)}
                      onDragEnd={() => {
                        setDragging(null);
                        setDropTarget(null);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <IssueList issues={issues} />
      )}

      {!readOnly && (
        <NewIssueModal
          open={createOpen}
          projectId={projectId}
          members={members}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            await onChanged?.();
          }}
        />
      )}
    </div>
  );
}

function IssueCard({
  issue,
  draggable,
  onDragStart,
  onDragEnd,
}: {
  issue: BoardIssue;
  draggable: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <article
      className={`issue-card issue-card--${issue.lane}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="issue-card-ref">
        <span className="mono">{issue.ref}</span>
        {issue.lane === "agent" && <span className="issue-card-lane">Agent</span>}
      </div>

      <h4>{issue.title}</h4>
      {issue.description && <p>{issue.description}</p>}

      <footer>
        <span className="issue-card-owner">{issue.owner || "Unassigned"}</span>
        <time dateTime={issue.updatedAt}>{relativeTime(issue.updatedAt)}</time>
      </footer>
    </article>
  );
}

function IssueList({ issues }: { issues: BoardIssue[] }) {
  if (issues.length === 0) {
    return <Card className="pm-tab-panel pm-tab-empty">No issues yet.</Card>;
  }

  return (
    <div className="issue-list">
      {issues.map((issue) => {
        const column = ISSUE_COLUMNS.find((entry) => entry.id === issue.column);
        return (
          <div key={issue.key} className="issue-list-row" data-tone={column?.tone}>
            <span className="issue-list-dot" aria-hidden="true" />
            <span className="mono issue-list-ref">{issue.ref}</span>
            <span className="issue-list-title">{issue.title}</span>
            <span className="issue-list-status">{column?.label ?? issue.column}</span>
            <span className="issue-list-owner">{issue.owner || "Unassigned"}</span>
            <time dateTime={issue.updatedAt}>{relativeTime(issue.updatedAt)}</time>
          </div>
        );
      })}
    </div>
  );
}

function NewIssueModal({
  open,
  projectId,
  members,
  onClose,
  onCreated,
}: {
  open: boolean;
  projectId: string;
  members?: Array<{ userId: string; profile?: DevFlowProfile | null }>;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createDevFlowProjectTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        assignedToId: assignedToId || undefined,
      });
      setTitle("");
      setDescription("");
      setAssignedToId("");
      await onCreated();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : String(createError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New issue">
      <div style={{ display: "grid", gap: 12 }}>
        <Field label="Title">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Wire the signup form" />
        </Field>
        <Field label="Description">
          <Textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Field label="Assignee" helper="Only project members can be assigned an issue.">
          <Select value={assignedToId} onChange={(event) => setAssignedToId(event.target.value)}>
            <option value="">Unassigned</option>
            {(members ?? []).map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.profile?.fullName || member.profile?.email || member.userId}
              </option>
            ))}
          </Select>
        </Field>
        {error && <div className="field-error">{error}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!title.trim() || saving} onClick={() => void submit()}>
            {saving ? "Creating..." : "Create issue"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function relativeTime(value: string): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
