import {
  buildDevEventRows,
  buildDevEventsPanelModel,
} from "./dev-events-panel";

describe("dev events panel model", () => {
  const event = {
    id: "event-1",
    projectId: "project-1",
    nodeName: "backend-agent",
    eventType: "WORK_ORDER_DISPATCHED",
    costMeta: {},
    runTokens: 120,
    occurredAt: "2026-07-08T00:00:00.000Z",
  };

  it("builds event rows and caps the visible list at six", () => {
    const rows = buildDevEventRows(Array.from({ length: 7 }, (_, index) => ({
      ...event,
      id: `event-${index}`,
      nodeName: `node-${index}`,
    })) as never);

    expect(rows).toHaveLength(6);
    expect(rows[0]).toMatchObject({
      id: "event-0",
      nodeName: "node-0",
      subtitle: expect.stringContaining("WORK_ORDER_DISPATCHED - "),
    });
  });

  it("builds aggregate loading, error, and empty state", () => {
    expect(buildDevEventsPanelModel({ events: [], loading: true })).toMatchObject({
      loading: true,
      error: null,
      empty: false,
      rows: [],
    });

    expect(buildDevEventsPanelModel({ events: [], error: "Network error" })).toMatchObject({
      loading: false,
      error: "Network error",
      empty: false,
    });

    expect(buildDevEventsPanelModel({ events: [] })).toMatchObject({
      loading: false,
      error: null,
      empty: true,
      rows: [],
    });

    expect(buildDevEventsPanelModel({ events: [event] as never })).toEqual(
      expect.objectContaining({
        empty: false,
        rows: [expect.objectContaining({ nodeName: "backend-agent" })],
      }),
    );
  });
});
