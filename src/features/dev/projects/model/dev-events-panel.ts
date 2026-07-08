import type { DevFlowEventLog } from "@/shared/api/devflow-api";
import { formatDevFlowDate } from "@/shared/utils/devflow-projects";

export interface DevEventRow {
  id: string;
  nodeName: string;
  subtitle: string;
  event: DevFlowEventLog;
}

export interface DevEventsPanelModel {
  loading: boolean;
  error: string | null;
  empty: boolean;
  rows: DevEventRow[];
}

export interface DevEventsPanelInput {
  events: DevFlowEventLog[];
  loading?: boolean;
  error?: string | null;
}

export function buildDevEventRows(events: DevFlowEventLog[]): DevEventRow[] {
  return events.slice(0, 6).map((event) => ({
    id: event.id,
    nodeName: event.nodeName,
    subtitle: `${event.eventType} - ${formatDevFlowDate(event.occurredAt)}`,
    event,
  }));
}

export function buildDevEventsPanelModel(input: DevEventsPanelInput): DevEventsPanelModel {
  const rows = buildDevEventRows(input.events);

  return {
    loading: Boolean(input.loading),
    error: input.error || null,
    empty: !input.loading && !input.error && rows.length === 0,
    rows,
  };
}
