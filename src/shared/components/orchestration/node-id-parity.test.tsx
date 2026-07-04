import { PIPELINE_NODES } from "./canvas/pipeline-layout";
import { STEPS } from "./run-status-banner";
import { AGENT_CONFIG } from "@/features/pm/shared/components/pm-agent-live-strip";

/**
 * Node-ID parity guard.
 *
 * The backend streams orchestration events keyed by the canonical graph node
 * IDs (backend topology.ts `NODE`). On the frontend, those same IDs are the
 * single join key between the store's per-node runtime / agent streams and
 * every component that renders them. `PIPELINE_NODES` (the canvas) is the
 * frontend source of truth for that ID set.
 *
 * History: the live strip and the stream emitters once used a parallel naming
 * scheme (`requirements_parser` vs `parse_requirements`, `validator` vs
 * `validate_outputs`), which silently broke token streaming for three of the
 * agents. This test fails the build if any consumer's node IDs drift from the
 * canvas again.
 */
describe("orchestration node-id parity", () => {
  const canvasIds = new Set(PIPELINE_NODES.map((n) => n.id));

  it("every RunStatusBanner step maps to a canvas node", () => {
    for (const step of STEPS) {
      expect(canvasIds.has(step.nodeId)).toBe(true);
    }
  });

  it("every AgentLiveStrip lane maps to a canvas node", () => {
    for (const agent of AGENT_CONFIG) {
      expect(canvasIds.has(agent.nodeId)).toBe(true);
    }
  });
});
