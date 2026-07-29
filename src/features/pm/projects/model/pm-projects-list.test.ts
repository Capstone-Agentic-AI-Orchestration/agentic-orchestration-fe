import {
  buildPmProjectStats,
  filterPmProjects,
  pmAttentionProjects,
  pmProjectAttentionMeta,
  pmProjectFilterCount,
  pmProjectLifecycleStage,
  pmProjectNextAction,
  pmProjectOrchestrateRoute,
} from "./pm-projects-list";

const project = (overrides: Record<string, unknown>) => ({
  id: "project-1",
  companyName: "Acme",
  status: "PENDING",
  kickoffStatus: "DRAFT",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
  ...overrides,
});

describe("pm projects list model", () => {
  it("maps lifecycle, next actions, and orchestrator routes", () => {
    expect(pmProjectLifecycleStage("AWAITING_GATE_1", "READY")).toBe("review");
    expect(pmProjectLifecycleStage("FAILED", "LOCKED")).toBe("build");
    expect(pmProjectLifecycleStage("DELIVERED")).toBe("delivered");
    expect(pmProjectNextAction("build", { status: "AWAITING_GATE_2" } as never)).toBe("Review the build");
    expect(pmProjectNextAction("build", { status: "GENERATING_CODE" } as never)).toBe("Monitor build");
    expect(pmProjectOrchestrateRoute({ id: "abc", status: "AWAITING_GATE_1" } as never)).toBe("/pm/orchestrate/abc");
    expect(pmProjectOrchestrateRoute({ id: "abc", status: "DELIVERED" } as never)).toBe("/pm/orchestrate/abc");
  });

  it("builds attention metadata without JSX", () => {
    expect(pmProjectAttentionMeta({ status: "AWAITING_GATE_1" } as never)).toMatchObject({
      cta: "Review plan",
      tone: "amber",
      icon: "shield",
    });
    expect(pmProjectAttentionMeta({ status: "FAILED" } as never)).toMatchObject({
      cta: "Resume run",
      tone: "red",
      icon: "alert",
    });
  });

  it("filters, searches, sorts, and counts projects", () => {
    const projects = [
      project({ id: "old", companyName: "Old Co", status: "DELIVERED", updatedAt: "2026-07-02T00:00:00.000Z" }),
      project({ id: "gate", companyName: "Gate Co", status: "AWAITING_GATE_1", updatedAt: "2026-07-04T00:00:00.000Z" }),
      project({ id: "failed", companyName: "Failed Co", status: "FAILED", updatedAt: "2026-07-03T00:00:00.000Z" }),
    ] as never;

    expect(filterPmProjects({ projects, filter: "attention", search: "", sort: "updated" }).map((item) => item.id))
      .toEqual(["gate", "failed"]);
    expect(filterPmProjects({ projects, filter: "all", search: "old", sort: "updated" }).map((item) => item.id))
      .toEqual(["old"]);
    expect(pmAttentionProjects(projects).map((item) => item.id)).toEqual(["gate", "failed"]);
    expect(pmProjectFilterCount(projects, "delivered")).toBe(1);
  });

  it("builds project inventory stats", () => {
    const stats = buildPmProjectStats([
      project({ status: "PARSING_REQUIREMENTS" }),
      project({ status: "AWAITING_GATE_2" }),
      project({ status: "FAILED" }),
      project({ status: "DELIVERED" }),
    ] as never);

    expect(stats).toEqual({
      total: 4,
      waiting: 2,
      active: 2,
      activeBuilds: 1,
      delivered: 1,
    });
  });
});
