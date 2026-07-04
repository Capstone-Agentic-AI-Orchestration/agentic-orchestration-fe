"use client";

import { useOrchestrationStore } from "@/shared/store/orchestration-store";
import type { ReactNode } from "react";
import { Badge, Button, Card } from "@/shared/components/ui";
import {
  IconActivity,
  IconAlertTriangle,
  IconCheckCircle,
  IconClipboard,
  IconCode,
  IconCpu,
  IconDatabase,
  IconFileText,
  IconGitBranch,
  IconRocket,
  IconShield,
  IconWorkflow,
} from "@/shared/components/icons";
import type {
  DevFlowAgentProviderStatus,
  DevFlowArtifact,
  DevFlowEventLog,
  DevFlowOrchestrationRun,
  DevFlowOrchestrationStatus,
  DevFlowProjectDetail,
  DevFlowWorkOrder,
  DevFlowWorkOrderAgentType,
} from "@/shared/api/devflow-api";

type StageState = "done" | "active" | "blocked" | "waiting";
type BadgeTone = "green" | "blue" | "amber" | "red" | "purple" | "gray";

interface OrchestrationLiveVisualizerProps {
  project?: Pick<DevFlowProjectDetail, "id" | "status" | "runId" | "repoUrl" | "stackKey"> | null;
  status?: DevFlowOrchestrationStatus | null;
  providerStatus?: DevFlowAgentProviderStatus | null;
  runs?: DevFlowOrchestrationRun[];
  workOrders?: DevFlowWorkOrder[];
  artifacts?: DevFlowArtifact[];
  events?: DevFlowEventLog[];
  loading?: boolean;
  compact?: boolean;
  onSelectArtifact?: (artifact: DevFlowArtifact) => void;
  useWebSocket?: boolean;
}

interface FlowStage {
  id: string;
  label: string;
  subtitle: string;
  context: string;
  nodes: string[];
  statuses: string[];
  icon: ReactNode;
  metric: string;
}

const STAGE_NODE_GROUPS = {
  INTAKE: ["load_ready_work_orders"],
  REQUIREMENTS: ["parse_requirements"],
  CONTRACT: ["negotiate_contract", "gate_1_check"],
  CODING: [
    "execute_ready_work_orders",
    "frontend_agent",
    "backend_agent",
    "database_agent",
    "architecture_agent",
    "frontend",
    "backend",
    "database",
    "architecture",
  ],
  SELF_CRITIQUE: ["self_critique"],
  VALIDATION: ["validate_outputs"],
  GATE_2: ["gate_2_check"],
  GITHUB: ["commit_to_github", "mark_delivered", "finalize_mock_orchestration"],
};

const AGENT_LANES: Array<{
  agentType: DevFlowWorkOrderAgentType;
  label: string;
  color: string;
  icon: ReactNode;
}> = [
  { agentType: "FRONTEND", label: "Frontend", color: "#F97316", icon: <IconCode size={14} /> },
  { agentType: "BACKEND", label: "Backend", color: "#10B981", icon: <IconCpu size={14} /> },
  { agentType: "DATABASE", label: "Database", color: "#14B8A6", icon: <IconDatabase size={14} /> },
  { agentType: "ARCHITECTURE", label: "Architecture", color: "#A78BFA", icon: <IconWorkflow size={14} /> },
  { agentType: "CONTRACT", label: "Contract", color: "#4F8BFF", icon: <IconShield size={14} /> },
];

export function OrchestrationLiveVisualizer({
  project,
  status: propStatus,
  providerStatus,
  runs = [],
  workOrders = [],
  artifacts = [],
  events = [],
  loading = false,
  compact = false,
  onSelectArtifact,
  useWebSocket = false,
}: OrchestrationLiveVisualizerProps) {
  const wsState = useOrchestrationStore((s) => s.orchestrationState);
  const wsStreams = useOrchestrationStore((s) => s.agentStreams);

  const resolvedStatus = useWebSocket && wsState ? {
    status: wsState.status,
    currentNode: wsState.currentNode,
    error: wsState.error,
  } : propStatus;

  const effectiveProject = useWebSocket && wsState ? {
    ...(project || { id: '', status: wsState.status, runId: wsState.runId, repoUrl: null, stackKey: '' }),
    status: wsState.status,
    runId: wsState.runId,
  } as OrchestrationLiveVisualizerProps['project'] : project;

  const latestRun = runs[0] || null;
  const currentNode = normalizeNode(resolvedStatus?.currentNode || latestRun?.currentNode || (wsState?.currentNode ?? ""));
  const runStatus = latestRun?.status || resolvedStatus?.status || effectiveProject?.status || "PENDING";
  const isFailed = runStatus === "FAILED" || effectiveProject?.status === "FAILED";
  const isDelivered = effectiveProject?.status === "DELIVERED" || runStatus === "SUCCEEDED";
  const activeProvider = providerStatus?.activeMode === "llm" ? "LLM" : providerStatus?.activeMode === "mock" ? "Mock" : "Agent";
  const readyWorkOrders = workOrders.filter((workOrder) => workOrder.status === "READY");
  const activeWorkOrders = workOrders.filter((workOrder) => workOrder.status === "DISPATCHED" || (workOrder.executionStartedAt && !workOrder.executionCompletedAt && !workOrder.executionError));
  const completedWorkOrders = workOrders.filter((workOrder) => workOrder.status === "COMPLETED");
  const failedWorkOrders = workOrders.filter((workOrder) => workOrder.status === "FAILED");
  const activeIndex = resolveActiveStageIndex(currentNode, resolvedStatus?.status || effectiveProject?.status || latestRun?.status, isDelivered);
  const activeWsAgents = useWebSocket ? Object.keys(wsStreams).length : 0;
  const stages = buildStages({
    readyCount: readyWorkOrders.length,
    workOrderCount: workOrders.length,
    artifactCount: artifacts.length,
    completedCount: completedWorkOrders.length,
    failedCount: failedWorkOrders.length,
    repoLinked: Boolean(effectiveProject?.repoUrl),
  }, currentNode, runStatus);
  const progress = resolveProgress(activeIndex, stages.length, isDelivered, isFailed);
  const activityFeed = buildActivityFeed({ events, artifacts, workOrders, latestRun });
  const latestActivity = activityFeed[0]?.items[0];

  return (
    <Card style={{ padding: compact ? 16 : 20, overflow: "hidden" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 10 }}>
            <Badge tone={loading ? "gray" : isFailed ? "red" : isDelivered ? "green" : latestRun?.status === "RUNNING" || activeWorkOrders.length ? "blue" : "amber"} style={undefined}>
              {loading ? "Syncing" : isFailed ? "Blocked" : isDelivered ? "Delivered" : latestRun?.status === "RUNNING" || activeWorkOrders.length ? "Live" : "Standby"}
            </Badge>
            <Badge tone="purple" style={undefined}>{activeProvider}</Badge>
            {project?.stackKey && <Badge tone="gray" style={undefined}>{project.stackKey}</Badge>}
          </div>
          <h3 style={{ margin: 0, fontSize: compact ? 15 : 17, fontWeight: 800 }}>Use-case orchestration map</h3>
          <p style={{ color: "var(--text-3)", fontSize: 12.5, lineHeight: 1.5, margin: "5px 0 0", maxWidth: 760 }}>
            {latestActivity?.summary || "Waiting for backend orchestration activity."}
          </p>
        </div>
        <div style={{ minWidth: 180, textAlign: "right" }}>
          <div className="mono" style={{ color: "white", fontSize: 22, fontWeight: 900 }}>{progress}%</div>
          <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2 }}>workflow progress</div>
              {useWebSocket && activeWsAgents > 0 && (
                <span style={{ color: "var(--text-3)", fontSize: 12 }}>{activeWsAgents} agents active via WebSocket</span>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ height: 8, borderRadius: 999, background: "rgba(8,14,32,.78)", border: "1px solid rgba(148,163,184,.14)", overflow: "hidden" }}>
              <div
                className={latestRun?.status === "RUNNING" || activeWorkOrders.length ? "orchestration-live-fill" : undefined}
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: isFailed
                    ? "linear-gradient(90deg, #EF4444, #FCA5A5)"
                    : "linear-gradient(90deg, #2F6BFF, #10B981, #A78BFA)",
                  transition: "width .35s ease",
                }}
              />
            </div>
          </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
          gap: 10,
          marginTop: 16,
        }}
      >
        {stages.map((stage, index) => {
          const state = stageState(index, activeIndex, isFailed, isDelivered);
          return <FlowStageCard key={stage.id} stage={stage} state={state} current={stage.nodes.includes(currentNode)} />;
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: compact ? "1fr" : "minmax(0, 1.25fr) minmax(280px, .75fr)",
          gap: 14,
          marginTop: 16,
        }}
      >
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,.16)",
            background: "rgba(8,14,32,.52)",
          }}
        >
          <div className="row" style={{ justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <div className="row gap-2" style={{ color: "#93C5FD", fontSize: 12.5, fontWeight: 800 }}>
              <IconCode size={14} />
              Coding lanes
            </div>
            <Badge tone={activeWorkOrders.length ? "blue" : completedWorkOrders.length ? "green" : "gray"} style={undefined}>
              {activeWorkOrders.length ? `${activeWorkOrders.length} active` : `${completedWorkOrders.length} completed`}
            </Badge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 8 }}>
            {AGENT_LANES.map((lane) => (
              <AgentLane
                key={lane.agentType}
                lane={lane}
                workOrders={workOrders.filter((workOrder) => workOrder.agentType === lane.agentType)}
                artifacts={artifacts.filter((artifact) => artifact.agentType?.toLowerCase() === lane.agentType.toLowerCase())}
                executions={(latestRun?.executions || []).filter((execution) => execution.agentType === lane.agentType)}
                onSelectArtifact={onSelectArtifact}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid rgba(148,163,184,.16)",
            background: "rgba(8,14,32,.52)",
            minWidth: 0,
          }}
        >
          <div className="row gap-2" style={{ color: "#C4B5FD", fontSize: 12.5, fontWeight: 800, marginBottom: 10 }}>
            <IconActivity size={14} />
            Live coding feed
          </div>
          {activityFeed.reduce((sum, g) => sum + g.items.length, 0) === 0 ? (
            <div style={{ color: "var(--text-3)", fontSize: 12.5 }}>No coding activity recorded yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {activityFeed.slice(0, compact ? 2 : 3).map((group) => (
                <div key={group.label}>
                  <div style={{ color: "var(--text-3)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{group.label}</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {group.items.slice(0, compact ? 2 : 4).map((item) => (
                      <div key={item.id} style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr)", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: item.color, marginTop: 1 }}>{item.icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <div className="mono" style={{ color: "white", fontSize: 11, fontWeight: 700, overflowWrap: "anywhere" }}>{item.label}</div>
                          <div style={{ color: "var(--text-3)", fontSize: 11, marginTop: 1, lineHeight: 1.4 }}>{item.summary}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function FlowStageCard({ stage, state, current }: { stage: FlowStage; state: StageState; current: boolean }) {
  const visual = stateVisual(state);
  return (
    <div
      style={{
        padding: 12,
        minHeight: 142,
        borderRadius: 8,
        border: `1px solid ${visual.border}`,
        background: visual.background,
        display: "grid",
        alignContent: "space-between",
        gap: 10,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {state === "active" && (
        <div
          className="orchestration-stage-scan"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(110deg, transparent 0%, rgba(147,197,253,.13) 42%, transparent 68%)",
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative" }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              display: "grid",
              placeItems: "center",
              color: visual.color,
              background: visual.iconBackground,
              border: `1px solid ${visual.border}`,
            }}
          >
            {stage.icon}
          </span>
          <Badge tone={visual.tone} style={undefined}>{state === "done" ? "Done" : state === "active" ? "Active" : state === "blocked" ? "Blocked" : "Waiting"}</Badge>
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.25 }}>{stage.label}</div>
        <div style={{ color: "var(--text-3)", fontSize: 11.5, lineHeight: 1.45, marginTop: 4 }}>{stage.subtitle}</div>
        {(state === "active" || state === "blocked") && stage.context && (
          <div style={{ color: state === "blocked" ? "#FCA5A5" : "#93C5FD", fontSize: 11.5, lineHeight: 1.45, marginTop: 6, fontStyle: "italic" }}>
            {stage.context}
          </div>
        )}
      </div>
      <div className="row" style={{ justifyContent: "space-between", gap: 8, position: "relative" }}>
        <span className="mono" style={{ color: current ? "#93C5FD" : "var(--text-2)", fontSize: 11.5, overflowWrap: "anywhere" }}>{stage.metric}</span>
        {current && <span style={{ width: 7, height: 7, borderRadius: 999, background: "#3B82F6", boxShadow: "0 0 12px #3B82F6" }} />}
      </div>
      {state === "done" && stage.context && (
        <div style={{ color: "#6EE7B7", fontSize: 11, lineHeight: 1.4, marginTop: 2 }}>
          {stage.context}
        </div>
      )}
    </div>
  );
}

function AgentLane({
  lane,
  workOrders,
  artifacts,
  executions,
  onSelectArtifact,
}: {
  lane: { agentType: DevFlowWorkOrderAgentType; label: string; color: string; icon: ReactNode };
  workOrders: DevFlowWorkOrder[];
  artifacts: DevFlowArtifact[];
  executions: DevFlowOrchestrationRun["executions"];
  onSelectArtifact?: (artifact: DevFlowArtifact) => void;
}) {
  const active = workOrders.find((workOrder) => workOrder.status === "DISPATCHED" || (workOrder.executionStartedAt && !workOrder.executionCompletedAt));
  const failed = workOrders.filter((workOrder) => workOrder.status === "FAILED").length + executions.filter((execution) => execution.status === "FAILED").length;
  const completed = workOrders.filter((workOrder) => workOrder.status === "COMPLETED").length + executions.filter((execution) => execution.status === "SUCCEEDED").length;
  const tone: BadgeTone = failed ? "red" : active ? "blue" : completed || artifacts.length ? "green" : workOrders.length ? "amber" : "gray";
  const label = active?.title || artifacts[0]?.displayName || artifacts[0]?.filePath || workOrders[0]?.title || "No handoff yet";

  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        background: "rgba(15,23,42,.72)",
        border: `1px solid ${active ? `${lane.color}66` : "rgba(148,163,184,.16)"}`,
        minWidth: 0,
      }}
    >
      <div className="row" style={{ justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div className="row gap-2" style={{ color: lane.color, fontSize: 12, fontWeight: 900 }}>
          {lane.icon}
          <span>{lane.label}</span>
        </div>
        <Badge tone={tone} style={undefined}>{active ? "Coding" : failed ? "Fix" : completed || artifacts.length ? "Done" : workOrders.length ? "Queued" : "Idle"}</Badge>
      </div>
      <div style={{ color: "white", fontSize: 12, fontWeight: 700, lineHeight: 1.35, minHeight: 32, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {label}
      </div>
      {artifacts.length > 0 && onSelectArtifact && (
        <div style={{ marginTop: 8, display: "grid", gap: 3 }}>
          {artifacts.slice(0, 3).map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectArtifact(a)}
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(148,163,184,.12)",
                borderRadius: 5,
                padding: "4px 8px",
                color: "var(--text-2)",
                fontSize: 11,
                fontFamily: "mono",
                cursor: "pointer",
                textAlign: "left",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title="Click to preview"
            >
              {a.filePath.split("/").pop()}
            </button>
          ))}
          {artifacts.length > 3 && (
            <div style={{ color: "var(--text-3)", fontSize: 10.5, padding: "2px 8px" }}>+{artifacts.length - 3} more files</div>
          )}
        </div>
      )}
      <div className="row" style={{ justifyContent: "space-between", gap: 8, marginTop: 9, color: "var(--text-3)", fontSize: 11 }}>
        <span>{workOrders.length} orders</span>
        <span>{artifacts.length} files</span>
      </div>
    </div>
  );
}

function buildStageContext(stageId: string, currentNode: string, currentStatus: string): string {
  const contexts: Record<string, Record<string, string>> = {
    intake: {
      default: "Defining the project scope, user goals, and executable work orders.",
      active: "Analyzing project brief and preparing work orders for execution...",
      done: "Intake complete. Work orders are ready for execution.",
    },
    requirements: {
      default: "Parsing the project brief into structured, agent-readable requirements.",
      active: "Parsing your project brief into structured requirements...",
      done: "Requirements parsed successfully with complexity assessment.",
    },
    contract: {
      default: "Generating an architecture contract with file manifest and acceptance criteria.",
      active: "Negotiating project contract with file manifest and acceptance criteria...",
      done: "Contract generated. Ready for architecture review.",
    },
    coding: {
      default: "Frontend, backend, database, and architecture agents generating code in parallel.",
      active: "AI agents are generating code across all modules...",
      done: "All code agents completed. Outputs ready for validation.",
    },
    validation: {
      default: "Validating generated artifacts against contract requirements.",
      active: "Running validation checks on generated artifacts...",
      done: "Validation passed. All artifacts meet contract requirements.",
    },
    "gate-2": {
      default: "Awaiting PM review before GitHub delivery.",
      active: "Waiting for your review of the generated code.",
      done: "Gate 2 approved. Ready for delivery.",
    },
    github: {
      default: "Committing approved artifacts to the project repository.",
      active: "Committing artifacts to GitHub and finalizing delivery...",
      done: "Project delivered to GitHub successfully.",
    },
  };

  const stageContexts = contexts[stageId];
  if (!stageContexts) return "";

  if (currentStatus === "FAILED") return "An error occurred during this stage. Check the activity log for details.";
  if (currentNode.includes(stageId) || (currentStatus && stageId === "gate-2" && currentStatus === "AWAITING_GATE_2")) return stageContexts.active;
  return stageContexts.default;
}

function buildStages(input: {
  readyCount: number;
  workOrderCount: number;
  artifactCount: number;
  completedCount: number;
  failedCount: number;
  repoLinked: boolean;
}, currentNode: string, runStatus: string): FlowStage[] {
  return [
    {
      id: "intake",
      label: "Use case intake",
      subtitle: "Kickoff scope, user goals, and executable work orders.",
      context: buildStageContext("intake", currentNode, runStatus),
      nodes: STAGE_NODE_GROUPS.INTAKE,
      statuses: ["PENDING"],
      icon: <IconClipboard size={15} />,
      metric: `${input.readyCount}/${input.workOrderCount} ready`,
    },
    {
      id: "requirements",
      label: "Requirements",
      subtitle: "Agent-readable requirements, constraints, and context.",
      context: buildStageContext("requirements", currentNode, runStatus),
      nodes: STAGE_NODE_GROUPS.REQUIREMENTS,
      statuses: ["PARSING_REQUIREMENTS"],
      icon: <IconFileText size={15} />,
      metric: "brief parsed",
    },
    {
      id: "contract",
      label: "Contract + Gate 1",
      subtitle: "Architecture contract and approval boundary.",
      context: buildStageContext("contract", currentNode, runStatus),
      nodes: STAGE_NODE_GROUPS.CONTRACT,
      statuses: ["NEGOTIATING_CONTRACT", "AWAITING_GATE_1"],
      icon: <IconShield size={15} />,
      metric: "scope guarded",
    },
    {
      id: "coding",
      label: "Agent coding",
      subtitle: "Frontend, backend, database, and architecture output.",
      context: buildStageContext("coding", currentNode, runStatus),
      nodes: STAGE_NODE_GROUPS.CODING,
      statuses: ["GENERATING_CODE"],
      icon: <IconCode size={15} />,
      metric: `${input.completedCount} done`,
    },
    {
      id: "self-critique",
      label: "Self-review",
      subtitle: "Automated quality review before formal validation.",
      context: buildStageContext("self-critique", currentNode, runStatus),
      nodes: STAGE_NODE_GROUPS.SELF_CRITIQUE,
      statuses: [],
      icon: <IconActivity size={15} />,
      metric: "reviewing",
    },
    {
      id: "validation",
      label: "Validation",
      subtitle: "Output contracts, file checks, and artifact health.",
      context: buildStageContext("validation", currentNode, runStatus),
      nodes: STAGE_NODE_GROUPS.VALIDATION,
      statuses: [],
      icon: <IconCheckCircle size={15} />,
      metric: `${input.artifactCount} artifacts`,
    },
    {
      id: "gate-2",
      label: "PM Gate 2",
      subtitle: "Review queue before GitHub delivery.",
      context: buildStageContext("gate-2", currentNode, runStatus),
      nodes: STAGE_NODE_GROUPS.GATE_2,
      statuses: ["AWAITING_GATE_2"],
      icon: <IconActivity size={15} />,
      metric: input.failedCount ? `${input.failedCount} failed` : "review ready",
    },
    {
      id: "github",
      label: "GitHub delivery",
      subtitle: "Repository commit, delivery handoff, and final state.",
      context: buildStageContext("github", currentNode, runStatus),
      nodes: STAGE_NODE_GROUPS.GITHUB,
      statuses: ["COMMITTING", "DELIVERED"],
      icon: <IconGitBranch size={15} />,
      metric: input.repoLinked ? "repo linked" : "repo pending",
    },
  ];
}

function buildActivityFeed({
  events,
  artifacts,
  workOrders,
  latestRun,
}: {
  events: DevFlowEventLog[];
  artifacts: DevFlowArtifact[];
  workOrders: DevFlowWorkOrder[];
  latestRun: DevFlowOrchestrationRun | null;
}) {
  const activeWorkOrders = workOrders
    .filter((workOrder) => workOrder.status === "DISPATCHED" || (workOrder.executionStartedAt && !workOrder.executionCompletedAt))
    .map((workOrder) => ({
      id: `work-order-${workOrder.id}`,
      label: `${workOrder.agentType.toLowerCase()}.work_order`,
      summary: `${workOrder.title} ${workOrder.executionAttempt ? `(attempt ${workOrder.executionAttempt})` : ""}`.trim(),
      at: workOrder.lastEventAt || workOrder.executionStartedAt || workOrder.updatedAt,
      color: "#93C5FD",
      icon: <IconCode size={14} />,
      kind: "work_order" as const,
    }));

  const eventItems = events.map((event) => ({
    id: `event-${event.id}`,
    label: normalizeNode(event.nodeName),
    summary: `${event.eventType}${event.runTokens ? ` - ${event.runTokens} tokens` : ""}`,
    at: event.occurredAt,
    color: event.eventType === "FAILED" ? "#FCA5A5" : event.eventType === "COMPLETED" ? "#6EE7B7" : "#C4B5FD",
    icon: event.eventType === "FAILED" ? <IconAlertTriangle size={14} /> : <IconActivity size={14} />,
    kind: "event" as const,
  }));

  const artifactItems = artifacts.map((artifact) => ({
    id: `artifact-${artifact.id}`,
    label: artifact.agentType ? `${artifact.agentType}.artifact` : "artifact.created",
    summary: artifact.displayName || artifact.filePath,
    at: artifact.createdAt,
    color: "#6EE7B7",
    icon: <IconFileText size={14} />,
    kind: "artifact" as const,
  }));

  const executionItems = (latestRun?.executions || []).map((execution) => ({
    id: `execution-${execution.id}`,
    label: `${execution.agentType.toLowerCase()}.execution`,
    summary: `${execution.status}${execution.workOrder?.title ? ` - ${execution.workOrder.title}` : ""}`,
    at: execution.completedAt || execution.updatedAt || execution.startedAt,
    color: execution.status === "FAILED" ? "#FCA5A5" : execution.status === "SUCCEEDED" ? "#6EE7B7" : "#93C5FD",
    icon: <IconRocket size={14} />,
    kind: "execution" as const,
  }));

  const allItems = [...activeWorkOrders, ...eventItems, ...executionItems, ...artifactItems]
    .filter((item) => Boolean(item.at))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return groupByTimePeriod(allItems);
}

function groupByTimePeriod(items: Array<{ id: string; label: string; summary: string; at: string; color: string; icon: React.ReactNode; kind: string }>) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const groups: Array<{ label: string; items: typeof items }> = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const item of items) {
    const date = new Date(item.at);
    if (date >= today) {
      groups[0].items.push(item);
    } else if (date >= yesterday) {
      groups[1].items.push(item);
    } else {
      groups[2].items.push(item);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

function resolveActiveStageIndex(currentNode: string, currentStatus: string | null | undefined, delivered: boolean): number {
  if (delivered) return 6;
  const normalizedStatus = currentStatus || "";
  const byNode = buildStages({ readyCount: 0, workOrderCount: 0, artifactCount: 0, completedCount: 0, failedCount: 0, repoLinked: false }, currentNode, normalizedStatus)
    .findIndex((stage) => stage.nodes.includes(currentNode));
  if (byNode >= 0) return byNode;
  const byStatus = buildStages({ readyCount: 0, workOrderCount: 0, artifactCount: 0, completedCount: 0, failedCount: 0, repoLinked: false }, currentNode, normalizedStatus)
    .findIndex((stage) => stage.statuses.includes(normalizedStatus));
  return byStatus >= 0 ? byStatus : 0;
}

function stageState(index: number, activeIndex: number, failed: boolean, delivered: boolean): StageState {
  if (delivered || index < activeIndex) return "done";
  if (failed && index === activeIndex) return "blocked";
  if (index === activeIndex) return "active";
  return "waiting";
}

function resolveProgress(activeIndex: number, totalStages: number, delivered: boolean, failed: boolean): number {
  if (delivered) return 100;
  const stageBase = Math.max(0, activeIndex) / Math.max(1, totalStages - 1);
  const activeBonus = failed ? 0 : 0.08;
  return Math.min(96, Math.max(4, Math.round((stageBase + activeBonus) * 100)));
}

function stateVisual(state: StageState): { tone: BadgeTone; color: string; border: string; background: string; iconBackground: string } {
  if (state === "done") {
    return { tone: "green", color: "#6EE7B7", border: "rgba(16,185,129,.34)", background: "rgba(16,185,129,.08)", iconBackground: "rgba(16,185,129,.14)" };
  }
  if (state === "active") {
    return { tone: "blue", color: "#93C5FD", border: "rgba(59,130,246,.42)", background: "rgba(59,130,246,.10)", iconBackground: "rgba(59,130,246,.16)" };
  }
  if (state === "blocked") {
    return { tone: "red", color: "#FCA5A5", border: "rgba(239,68,68,.38)", background: "rgba(239,68,68,.09)", iconBackground: "rgba(239,68,68,.15)" };
  }
  return { tone: "gray", color: "#94A3B8", border: "rgba(148,163,184,.16)", background: "rgba(15,23,42,.58)", iconBackground: "rgba(148,163,184,.08)" };
}

function normalizeNode(node: string): string {
  if (!node || node === "none") return "";
  return node
    .replace(/^work_order_/, "")
    .replace(/_agent$/, "_agent")
    .toLowerCase();
}
