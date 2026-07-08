import {
  buildDevProjectDetailModel,
  buildDevProjectMemberRows,
} from "./dev-project-detail";

describe("dev project detail model", () => {
  const project = {
    id: "project-1",
    companyName: "Acme Labs",
    status: "DELIVERED",
    stackKey: "next-nest",
    brief: "Build the portal",
    runId: "run-1",
    repoUrl: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-08T00:00:00.000Z",
    _count: {
      artifacts: 3,
      eventLogs: 7,
    },
    members: [
      {
        id: "member-1",
        role: "DEV",
        user: { fullName: "Dev User", email: "dev@example.com", id: "dev-1" },
      },
      {
        id: "member-2",
        role: "PM",
        user: { fullName: "", email: "pm@example.com", id: "pm-1" },
      },
    ],
  };

  it("builds team member display rows", () => {
    expect(buildDevProjectMemberRows(project as never)).toMatchObject([
      {
        id: "member-1",
        initials: "DU",
        name: "Dev User",
        role: "DEV",
        color: "linear-gradient(135deg,#A855F7,#EC4899)",
      },
      {
        id: "member-2",
        initials: "PE",
        name: "pm@example.com",
        role: "PM",
        color: "linear-gradient(135deg,#4F8BFF,#8B5CF6)",
      },
    ]);
  });

  it("builds project detail header, stats, facts, and progress state", () => {
    const model = buildDevProjectDetailModel(project as never);

    expect(model).toMatchObject({
      screenLabel: "Dev - Backend Project - project-1",
      projectId: "project-1",
      companyName: "Acme Labs",
      initials: "AL",
      brief: "Build the portal",
      developerCountLabel: "1 developers assigned",
      hasMembers: true,
    });
    expect(model.stats).toEqual([
      { label: "Stack", value: "next-nest" },
      expect.objectContaining({ label: "Next" }),
      { label: "Artifacts", value: "3" },
      { label: "Events", value: "7" },
    ]);
    expect(model.facts).toEqual([
      expect.objectContaining({ label: "Created" }),
      expect.objectContaining({ label: "Updated" }),
      { label: "Run", value: "run-1" },
      { label: "Repo", value: "Not linked" },
    ]);
    expect(model.progress).toBeGreaterThanOrEqual(0);
    expect(model.progressColor).toEqual(expect.any(String));
  });
});
