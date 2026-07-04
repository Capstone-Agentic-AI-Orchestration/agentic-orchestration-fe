/**
 * Static layout for the DevFlow pipeline DAG (Phase 4).
 *
 * Node ids match the backend graph node names (topology.ts) so the store's
 * per-node runtime (keyed by nodeId) maps directly onto canvas nodes. Positions
 * are a left-to-right flow with the four code agents stacked in a parallel
 * column.
 */

export type PipelineNodeKind = 'stage' | 'gate' | 'agent' | 'terminal';

export interface PipelineNodeDef {
  id: string;
  label: string;
  kind: PipelineNodeKind;
  /** Role accent color (agents) or neutral stage tint. */
  color: string;
  x: number;
  y: number;
}

export interface PipelineEdgeDef {
  id: string;
  source: string;
  target: string;
}

const COL = 230;
const ROW = 96;
const NEUTRAL = '#4F8BFF';

// Column indices for the left-to-right flow.
const C = {
  PARSE: 0,
  CONTRACT: 1,
  GATE1: 2,
  AGENTS: 3,
  VALIDATE: 4,
  GATE2: 5,
  COMMIT: 6,
  DELIVER: 7,
} as const;

const AGENT_BASE_Y = -1.5 * ROW;

export const PIPELINE_NODES: PipelineNodeDef[] = [
  { id: 'parse_requirements', label: 'Requirements', kind: 'stage', color: NEUTRAL, x: C.PARSE * COL, y: 0 },
  { id: 'negotiate_contract', label: 'Contract', kind: 'stage', color: NEUTRAL, x: C.CONTRACT * COL, y: 0 },
  { id: 'gate_1_check', label: 'Gate 1', kind: 'gate', color: '#F59E0B', x: C.GATE1 * COL, y: 0 },
  { id: 'frontend_agent', label: 'Frontend', kind: 'agent', color: '#F97316', x: C.AGENTS * COL, y: AGENT_BASE_Y + 0 * ROW },
  { id: 'backend_agent', label: 'Backend', kind: 'agent', color: '#10B981', x: C.AGENTS * COL, y: AGENT_BASE_Y + 1 * ROW },
  { id: 'database_agent', label: 'Database', kind: 'agent', color: '#14B8A6', x: C.AGENTS * COL, y: AGENT_BASE_Y + 2 * ROW },
  { id: 'architecture_agent', label: 'Architecture', kind: 'agent', color: '#6366F1', x: C.AGENTS * COL, y: AGENT_BASE_Y + 3 * ROW },
  { id: 'validate_outputs', label: 'Validation', kind: 'stage', color: NEUTRAL, x: C.VALIDATE * COL, y: 0 },
  { id: 'gate_2_check', label: 'Gate 2', kind: 'gate', color: '#F59E0B', x: C.GATE2 * COL, y: 0 },
  { id: 'commit_to_github', label: 'GitHub', kind: 'stage', color: NEUTRAL, x: C.COMMIT * COL, y: 0 },
  { id: 'mark_delivered', label: 'Delivered', kind: 'terminal', color: '#10B981', x: C.DELIVER * COL, y: 0 },
];

const AGENTS = ['frontend_agent', 'backend_agent', 'database_agent', 'architecture_agent'];

export const PIPELINE_EDGES: PipelineEdgeDef[] = [
  { id: 'e-parse-contract', source: 'parse_requirements', target: 'negotiate_contract' },
  { id: 'e-contract-gate1', source: 'negotiate_contract', target: 'gate_1_check' },
  ...AGENTS.map((a) => ({ id: `e-gate1-${a}`, source: 'gate_1_check', target: a })),
  ...AGENTS.map((a) => ({ id: `e-${a}-validate`, source: a, target: 'validate_outputs' })),
  { id: 'e-validate-gate2', source: 'validate_outputs', target: 'gate_2_check' },
  { id: 'e-gate2-commit', source: 'gate_2_check', target: 'commit_to_github' },
  { id: 'e-commit-deliver', source: 'commit_to_github', target: 'mark_delivered' },
];

export const PIPELINE_NODE_IDS = PIPELINE_NODES.map((n) => n.id);
