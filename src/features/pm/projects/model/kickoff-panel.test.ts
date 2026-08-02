import {
  buildBackendKickoffChecklist,
  buildBackendKickoffForm,
  buildBackendKickoffInviteRows,
  buildBackendKickoffPanelModel,
  buildDocumentsCheck,
  type BackendKickoffForm,
  type KickoffDocumentState,
} from "./kickoff-panel";

function documentsForm(requiredDocuments = ""): BackendKickoffForm {
  return { ...buildBackendKickoffForm({ detail: projectDetail() }), requiredDocuments };
}

function file(extraction: KickoffDocumentState["extraction"]): KickoffDocumentState {
  return { isFile: true, extraction };
}

function projectDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: "project-1",
    brief: "Build a portal",
    stackKey: "nextjs-nestjs-supabase",
    members: [{ userId: "user-1", role: "DEV" }],
    clientInvites: [],
    kickoff: null,
    ...overrides,
  } as never;
}

describe("kickoff documents check", () => {
  it("reports nothing received rather than echoing the PM's request list as progress", () => {
    const check = buildDocumentsCheck({ form: documentsForm("Brand guide, ERD"), documents: [] });

    expect(check.body).toBe("None received yet. Requested: Brand guide, ERD");
    // Nothing has arrived, but a project may legitimately need no documents, so allow the tick.
    expect(check.blockedReason).toBeUndefined();
  });

  it("counts only extracted files as readable by the agents", () => {
    const check = buildDocumentsCheck({
      form: documentsForm(),
      documents: [file("READY"), file("READY"), { isFile: false, extraction: "NOT_APPLICABLE" }],
    });

    expect(check.body).toBe("2 of 2 received files readable by agents.");
    expect(check.blockedReason).toBeUndefined();
  });

  it("blocks confirmation while extraction is still running", () => {
    const check = buildDocumentsCheck({
      form: documentsForm(),
      documents: [file("READY"), file("EXTRACTING")],
    });

    expect(check.body).toBe("1 of 2 received files readable by agents · 1 still processing.");
    expect(check.blockedReason).toBe("Wait for text extraction to finish before confirming.");
  });

  it("blocks confirmation when a document failed extraction", () => {
    const check = buildDocumentsCheck({ form: documentsForm(), documents: [file("FAILED")] });

    expect(check.body).toBe("0 of 1 received file readable by agents · 1 failed extraction.");
    expect(check.blockedReason).toBe("Retry or replace the failed document before confirming.");
  });

  it("surfaces the documents state through the checklist row", () => {
    const detail = projectDetail();
    const checklist = buildBackendKickoffChecklist({
      detail,
      form: documentsForm(),
      tasks: [],
      workOrders: [],
      documents: [file("FAILED")],
    });

    expect(checklist.find((item) => item.key === "documentsConfirmed")).toMatchObject({
      body: "0 of 1 received file readable by agents · 1 failed extraction.",
      blockedReason: "Retry or replace the failed document before confirming.",
    });
  });
});

describe("backend kickoff panel model", () => {
  it("builds form defaults from kickoff and project detail", () => {
    const form = buildBackendKickoffForm({
      detail: projectDetail({
        kickoff: {
          scopeSummary: null,
          milestones: "M1",
          techStackNotes: null,
          scopeConfirmed: true,
          rolesConfirmed: true,
        },
      }),
    });

    expect(form).toMatchObject({
      scopeSummary: "Build a portal",
      milestones: "M1",
      techStackNotes: "nextjs-nestjs-supabase",
      scopeConfirmed: true,
      rolesConfirmed: true,
      initialTasksCreated: false,
    });
  });

  it("derives checklist rows from form, invites, tasks, and work orders", () => {
    const detail = projectDetail({
      clientInvites: [
        { status: "ACCEPTED" },
        { status: "PENDING" },
      ],
    });
    const form = buildBackendKickoffForm({ detail });
    const checklist = buildBackendKickoffChecklist({
      detail,
      form: { ...form, scopeConfirmed: true },
      tasks: [{ id: "task-1" }],
      workOrders: [{ id: "wo-1" }, { id: "wo-2" }],
    });

    expect(checklist).toHaveLength(8);
    expect(checklist[0]).toMatchObject({ key: "scopeConfirmed", checked: true, body: "Build a portal" });
    expect(checklist.find((item) => item.key === "clientAccessConfirmed")?.body).toBe("1 joined, 1 pending");
    expect(checklist.find((item) => item.key === "initialTasksCreated")?.body).toBe("1 task");
    expect(checklist.find((item) => item.key === "initialWorkOrdersCreated")?.body).toBe("2 work orders");
  });

  it("formats invite rows and ready output state", () => {
    const detail = projectDetail({
      kickoff: { status: "READY" },
      clientInvites: [
        {
          id: "invite-1",
          contactName: "Client User",
          email: "client@example.com",
          status: "ACCEPTED",
          acceptedAt: "2026-07-08T00:00:00.000Z",
          createdAt: "2026-07-07T00:00:00.000Z",
        },
      ],
    });
    const form = buildBackendKickoffForm({ detail });
    const model = buildBackendKickoffPanelModel({
      detail,
      form,
      tasks: [{ id: "task-1" }],
      workOrders: [],
    });

    expect(buildBackendKickoffInviteRows(detail)[0]).toMatchObject({
      id: "invite-1",
      contactName: "Client User",
      tone: "green",
    });
    expect(model).toMatchObject({
      ready: true,
      statusLabel: "Ready",
      statusTone: "green",
      inviteSubtitle: "1 invite",
      hasInvites: true,
      taskCount: 1,
      workOrderCount: 0,
      outputMessage: "Orchestration start is available.",
    });
    expect(model.inviteRows[0].timelineLabel).toContain("Joined");
  });

  it("marks draft state when kickoff is not ready", () => {
    const detail = projectDetail({ kickoff: { status: "DRAFT" } });
    expect(buildBackendKickoffPanelModel({
      detail,
      form: buildBackendKickoffForm({ detail }),
      tasks: [],
      workOrders: [],
    })).toMatchObject({
      ready: false,
      statusLabel: "DRAFT",
      statusTone: "yellow",
      hasInvites: false,
      outputMessage: "Orchestration start unlocks when every kickoff check is saved.",
    });
  });
});
