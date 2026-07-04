"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card } from "@/shared/components/ui";
import { useOrchestrationStore } from "@/shared/store/orchestration-store";
import { PIPELINE_NODES, PIPELINE_EDGES } from "./pipeline-layout";
import { PipelineNode, type PipelineNodeData } from "./pipeline-node";
import { NodeInspector } from "./node-inspector";
import { RunControls } from "./run-controls";

const nodeTypes = { pipeline: PipelineNode };

interface OrchestrationCanvasProps {
  projectId: string;
  /** Whether a run is live (enables controls). */
  live?: boolean;
  height?: number;
}

function CanvasInner({ projectId, live = true, height = 460 }: OrchestrationCanvasProps) {
  const nodeStates = useOrchestrationStore((s) => s.nodeStates);
  const connectionStatus = useOrchestrationStore((s) => s.connectionStatus);
  const orchestrationState = useOrchestrationStore((s) => s.orchestrationState);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodes = useMemo<Node<PipelineNodeData>[]>(
    () =>
      PIPELINE_NODES.map((def) => ({
        id: def.id,
        type: "pipeline",
        position: { x: def.x, y: def.y },
        selected: def.id === selectedId,
        data: {
          label: def.label,
          kind: def.kind,
          color: def.color,
          runtime: nodeStates[def.id],
        },
      })),
    [nodeStates, selectedId],
  );

  const edges = useMemo<Edge[]>(
    () =>
      PIPELINE_EDGES.map((e) => {
        const phase = nodeStates[e.source]?.phase;
        const active = phase === "running" || phase === "entering";
        const done = phase === "exiting";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          animated: active,
          style: {
            stroke: active ? "#93C5FD" : done ? "rgba(16,185,129,.5)" : "rgba(148,163,184,.25)",
            strokeWidth: active ? 2 : 1.5,
          },
        };
      }),
    [nodeStates],
  );

  const onNodeClick: NodeMouseHandler = (_event, node) => {
    setSelectedId((prev) => (prev === node.id ? null : node.id));
  };

  const connTone =
    connectionStatus === "connected" ? "#10B981" : connectionStatus === "connecting" ? "#F59E0B" : "#EF4444";

  return (
    <div className="orchestration-canvas-grid">
      <Card style={{ padding: 0, overflow: "hidden", height }}>
        <div style={{ width: "100%", height: "100%" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            fitView
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background color="rgba(148,163,184,.15)" gap={18} />
            <MiniMap
              pannable
              zoomable
              maskColor="rgba(5,11,31,.7)"
              style={{ background: "rgba(8,14,32,.8)", border: "1px solid rgba(148,163,184,.16)" }}
              nodeColor={(n) => (n.data as PipelineNodeData)?.color ?? "#4F8BFF"}
            />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </Card>

      <div style={{ display: "grid", gap: 14, gridTemplateRows: "auto auto 1fr", minWidth: 0 }}>
        <Card style={{ padding: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Run controls</div>
            <span className="row" style={{ gap: 6, alignItems: "center", color: "var(--text-3)", fontSize: 11 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: connTone }} />
              {connectionStatus}
            </span>
          </div>
          <RunControls projectId={projectId} selectedNodeId={selectedId} disabled={!live} />
          {orchestrationState && (
            <div className="mono" style={{ color: "var(--text-3)", fontSize: 10.5, marginTop: 10 }}>
              {orchestrationState.status} · {orchestrationState.currentNode}
            </div>
          )}
        </Card>

        <Card style={{ padding: 14 }}>
          <NodeInspector projectId={projectId} nodeId={selectedId} />
        </Card>

        <div />
      </div>
    </div>
  );
}

/**
 * Interactive pipeline DAG visualizer (Phase 4). React Flow canvas + node
 * inspector + mid-run controls, driven entirely by the typed protocol channel
 * via the orchestration store. The parent view owns the socket subscription.
 */
export function OrchestrationCanvas(props: OrchestrationCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
