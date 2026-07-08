import type {
  DevFlowWorkOrder,
  DevFlowWorkOrderPriority,
  DevFlowWorkOrderStatus,
} from "@/shared/api/devflow-api";
import { formatDevFlowDate } from "@/shared/utils/devflow-projects";

export type DevWorkOrderBadgeTone = "green" | "amber" | "gray" | "red" | "blue" | "purple";

export interface DevWorkOrderBadgeView {
  tone: DevWorkOrderBadgeTone;
  label: string;
}

export interface DevWorkOrderChip {
  tone: DevWorkOrderBadgeTone;
  label: string;
}

export interface DevWorkOrderRow {
  id: string;
  status: DevWorkOrderBadgeView;
  priority: DevWorkOrderBadgeView;
  agentType: string;
  title: string;
  instructions: string | null;
  chips: DevWorkOrderChip[];
  executionLabel: string;
  executionError: string | null;
  workOrder: DevFlowWorkOrder;
}

export interface DevWorkOrdersPanelModel {
  loading: boolean;
  error: string | null;
  empty: boolean;
  rows: DevWorkOrderRow[];
}

export interface DevWorkOrdersPanelInput {
  workOrders: DevFlowWorkOrder[];
  loading?: boolean;
  error?: string | null;
}

export function devWorkOrderStatusBadgeView(status?: DevFlowWorkOrderStatus): DevWorkOrderBadgeView {
  const map: Record<DevFlowWorkOrderStatus, DevWorkOrderBadgeView> = {
    DRAFT: { tone: "gray", label: "Draft" },
    READY: { tone: "blue", label: "Ready" },
    DISPATCHED: { tone: "purple", label: "Dispatched" },
    COMPLETED: { tone: "green", label: "Completed" },
    FAILED: { tone: "red", label: "Failed" },
    CANCELLED: { tone: "gray", label: "Cancelled" },
  };

  return map[status || "DRAFT"] || map.DRAFT;
}

export function devWorkOrderPriorityBadgeView(priority?: DevFlowWorkOrderPriority): DevWorkOrderBadgeView {
  const map: Record<DevFlowWorkOrderPriority, DevWorkOrderBadgeView> = {
    LOW: { tone: "gray", label: "Low" },
    NORMAL: { tone: "blue", label: "Normal" },
    HIGH: { tone: "amber", label: "High" },
    URGENT: { tone: "red", label: "Urgent" },
  };

  return map[priority || "NORMAL"] || map.NORMAL;
}

export function buildDevWorkOrderExecutionLabel(workOrder: DevFlowWorkOrder): string {
  if (workOrder.executionCompletedAt) return `Completed ${formatDevFlowDate(workOrder.executionCompletedAt)}`;
  if (workOrder.executionStartedAt) return `Started ${formatDevFlowDate(workOrder.executionStartedAt)}`;
  if (workOrder.dispatchedAt) return `Dispatched ${formatDevFlowDate(workOrder.dispatchedAt)}`;
  return `Updated ${formatDevFlowDate(workOrder.updatedAt)}`;
}

export function buildDevWorkOrderChips(workOrder: DevFlowWorkOrder): DevWorkOrderChip[] {
  const chips: DevWorkOrderChip[] = [];

  if (workOrder.task) chips.push({ tone: "blue", label: workOrder.task.title });
  if (workOrder.artifact) chips.push({ tone: "gray", label: workOrder.artifact.displayName || workOrder.artifact.filePath });
  if (workOrder.executionRunId) chips.push({ tone: "purple", label: `Run ${workOrder.executionAttempt || 1}` });

  return chips;
}

export function buildDevWorkOrderRows(workOrders: DevFlowWorkOrder[]): DevWorkOrderRow[] {
  return workOrders.map((workOrder) => ({
    id: workOrder.id,
    status: devWorkOrderStatusBadgeView(workOrder.status),
    priority: devWorkOrderPriorityBadgeView(workOrder.priority),
    agentType: workOrder.agentType,
    title: workOrder.title,
    instructions: workOrder.instructions,
    chips: buildDevWorkOrderChips(workOrder),
    executionLabel: buildDevWorkOrderExecutionLabel(workOrder),
    executionError: workOrder.executionError,
    workOrder,
  }));
}

export function buildDevWorkOrdersPanelModel(input: DevWorkOrdersPanelInput): DevWorkOrdersPanelModel {
  const rows = buildDevWorkOrderRows(input.workOrders);

  return {
    loading: Boolean(input.loading),
    error: input.error || null,
    empty: !input.loading && !input.error && rows.length === 0,
    rows,
  };
}
