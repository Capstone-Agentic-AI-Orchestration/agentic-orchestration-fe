import {
  buildClientBackendEngagementModel,
  buildClientDashboardModel,
  buildClientTeamMembers,
  countPendingReviews,
  daysSince,
} from "./client-dashboard";

describe("client dashboard model", () => {
  it("counts pending reviews and calculates days since engagement start", () => {
    expect(countPendingReviews([
      { reviewStatus: "PENDING" },
      { reviewStatus: "APPROVED" },
      { reviewStatus: "PENDING" },
    ] as never)).toBe(2);

    expect(daysSince("2026-07-01T00:00:00.000Z", Date.parse("2026-07-04T00:00:00.000Z"))).toBe("3");
    expect(daysSince("not-a-date", Date.parse("2026-07-04T00:00:00.000Z"))).toBe("0");
  });

  it("builds empty dashboard state without a selected project", () => {
    const model = buildClientDashboardModel({
      projects: [],
      selectedProject: null,
      selectedProjectLoading: false,
      selectedProjectError: "",
      artifacts: [],
      timeline: [],
      outputsLoading: false,
      outputsError: "",
      now: Date.parse("2026-07-04T00:00:00.000Z"),
    });

    expect(model).toMatchObject({
      engagementName: "No selected project",
      engagementStatus: "Unassigned",
      engagementStage: "No active stage",
      engagementProgress: 0,
      showEmptyState: true,
      primaryActionLabel: null,
      timelineBadge: "No project",
      timelineEmptyText: "No backend project is selected yet.",
      nextMilestoneText: "No milestone is available until a backend project is selected.",
    });
    expect(model.metrics.map((metric) => metric.value)).toEqual(["No active stage", "0", "0", "0"]);
  });

  it("builds selected project metrics and journey state", () => {
    const project = {
      id: "project-1",
      companyName: "Acme Labs",
      status: "DELIVERED",
      stackKey: "next-nest",
      createdAt: "2026-07-01T00:00:00.000Z",
      brief: "Build the portal",
      members: [],
    };
    const model = buildClientDashboardModel({
      projects: [project],
      selectedProject: project,
      selectedProjectLoading: false,
      selectedProjectError: "",
      artifacts: [
        { id: "artifact-1", reviewStatus: "PENDING" },
        { id: "artifact-2", reviewStatus: "APPROVED" },
      ] as never,
      timeline: [{ id: "event-1" }] as never,
      outputsLoading: true,
      outputsError: "Timeline failed",
      now: Date.parse("2026-07-04T00:00:00.000Z"),
    } as never);

    expect(model).toMatchObject({
      engagementName: "Acme Labs",
      pendingReviews: 1,
      primaryActionLabel: "Review deliverables",
      timelineBadge: "Backend timeline",
      timelineBrief: "Build the portal",
      timelineLoading: true,
      timelineError: "Timeline failed",
    });
    expect(model.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "days", value: "3", sub: "since project creation" }),
      expect.objectContaining({ key: "artifacts", value: "2" }),
      expect.objectContaining({ key: "pending", value: "1", actionRoute: "product" }),
    ]));
  });

  it("builds backend engagement loading, error, and project states", () => {
    expect(buildClientBackendEngagementModel({
      loading: true,
      error: "",
      project: null,
      projectCount: 0,
    })).toMatchObject({ loading: true, hasProject: false });

    expect(buildClientBackendEngagementModel({
      loading: false,
      error: "Server exploded",
      project: null,
      projectCount: 0,
    })).toMatchObject({ error: "Server exploded", hasProject: false });

    expect(buildClientBackendEngagementModel({
      loading: false,
      error: "",
      project: {
        companyName: "Acme Labs",
        status: "DELIVERED",
        stackKey: "next-nest",
        createdAt: "2026-07-01T00:00:00.000Z",
      },
      projectCount: 2,
    } as never)).toMatchObject({
      hasProject: true,
      initials: "AL",
      companyName: "Acme Labs",
      projectCountLabel: "2 assigned",
    });
  });

  it("builds visible team members", () => {
    const members = buildClientTeamMembers({
      members: [
        { id: "member-1", role: "PM", user: { fullName: "Pat Manager", email: "pm@example.com" } },
        { id: "member-2", role: "DEV", user: { fullName: "", email: "dev@example.com", id: "dev-1" } },
      ],
    } as never);

    expect(members).toMatchObject([
      {
        id: "member-1",
        initials: "PM",
        name: "Pat Manager",
        role: "PM",
      },
      {
        id: "member-2",
        initials: "DE",
        name: "dev@example.com",
        role: "DEV",
      },
    ]);
  });
});
