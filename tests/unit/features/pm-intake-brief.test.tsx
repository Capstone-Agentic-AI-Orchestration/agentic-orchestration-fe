import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PMIntakeBrief } from "@/features/intake/pm-intake-brief";
import type {
  DevFlowClientIntakePayload,
  DevFlowIntakeReadiness,
} from "@/shared/api/devflow-api";

function payload(overrides: Partial<DevFlowClientIntakePayload> = {}): DevFlowClientIntakePayload {
  return {
    overview: {
      projectName: "Depot booking",
      businessGoal: "Stop taking depot bookings by phone",
      successMeasures: [],
      primaryContact: "casey@acme.test",
      approver: "",
      targetLaunch: "",
    },
    roles: [],
    features: [],
    workflows: [],
    dataAndIntegrations: { entities: [], integrations: [] },
    experienceAndDelivery: {
      securityRequirements: [],
      constraints: [],
      milestones: [],
      outOfScope: [],
      futurePhase: [],
    },
    ...overrides,
  } as DevFlowClientIntakePayload;
}

const readiness = (over: Partial<DevFlowIntakeReadiness> = {}): DevFlowIntakeReadiness => ({
  blockers: [],
  suggestions: [],
  readyForSubmission: true,
  readyForLock: true,
  counts: { uploaded: 0, extracting: 0, failed: 0, ready: 0 },
  ...over,
});

describe("PMIntakeBrief", () => {
  it("shows what the client answered without needing a tab click", () => {
    render(
      <PMIntakeBrief payload={payload()} readiness={readiness()} documents={[]} onOpenForm={jest.fn()} />,
    );

    expect(screen.getByText("Stop taking depot bookings by phone")).toBeInTheDocument();
    expect(screen.getByText("casey@acme.test")).toBeInTheDocument();
  });

  // The reason this view exists: eight unanswered sections should read as eight lines, not eight
  // screens of empty inputs.
  it("collapses every unanswered section to one line", () => {
    render(
      <PMIntakeBrief payload={payload()} readiness={readiness()} documents={[]} onOpenForm={jest.fn()} />,
    );

    // Must-haves, users, processes, information and systems, constraints, documents.
    expect(screen.getAllByText("Not answered yet").length).toBeGreaterThanOrEqual(5);
  });

  it("renders a must-have with its detail once there is one", () => {
    render(
      <PMIntakeBrief
        payload={payload({
          features: [{
            title: "Slot booking",
            purpose: "Let dispatchers book without phoning",
            primaryRole: "Dispatcher",
            priority: "MUST_HAVE",
            workflow: "Pick depot, pick slot, confirm",
            businessRules: ["No double booking"],
            acceptanceCriteria: ["A booked slot cannot be booked again"],
          }],
        })}
        readiness={readiness()}
        documents={[]}
        onOpenForm={jest.fn()}
      />,
    );

    expect(screen.getByText("Slot booking")).toBeInTheDocument();
    expect(screen.getByText("Let dispatchers book without phoning")).toBeInTheDocument();
    expect(screen.getByText("A booked slot cannot be booked again")).toBeInTheDocument();
  });

  // Blocking and advisory must not read alike: one stops a lock, the other is the PM's judgement.
  it("separates what blocks a lock from what is merely thin", () => {
    render(
      <PMIntakeBrief
        payload={payload()}
        readiness={readiness({
          blockers: ["Add at least one Must-have feature."],
          suggestions: ["Name the final approver."],
          readyForSubmission: false,
          readyForLock: false,
        })}
        documents={[]}
        onOpenForm={jest.fn()}
      />,
    );

    expect(screen.getByText("Cannot be locked until these are answered")).toBeInTheDocument();
    expect(screen.getByText("Add at least one Must-have feature.")).toBeInTheDocument();
    expect(screen.getByText("Thin, but you can lock over it")).toBeInTheDocument();
    expect(screen.getByText("Name the final approver.")).toBeInTheDocument();
  });

  it("says nothing about gaps when there are none", () => {
    render(
      <PMIntakeBrief payload={payload()} readiness={readiness()} documents={[]} onOpenForm={jest.fn()} />,
    );

    expect(screen.queryByText("Cannot be locked until these are answered")).not.toBeInTheDocument();
    expect(screen.queryByText("Thin, but you can lock over it")).not.toBeInTheDocument();
  });

  // A backend that has not been redeployed sends no `suggestions` at all.
  it("survives a response with no suggestions field", () => {
    const legacy = { ...readiness(), suggestions: undefined };
    render(
      <PMIntakeBrief payload={payload()} readiness={legacy} documents={[]} onOpenForm={jest.fn()} />,
    );

    expect(screen.getByText("Stop taking depot bookings by phone")).toBeInTheDocument();
  });

  it("keeps the full form one click away", () => {
    const onOpenForm = jest.fn();
    render(
      <PMIntakeBrief payload={payload()} readiness={readiness()} documents={[]} onOpenForm={onOpenForm} />,
    );

    screen.getByRole("button", { name: "Open the full form" }).click();
    expect(onOpenForm).toHaveBeenCalled();
  });
});

/**
 * Replies the assistant could not parse.
 *
 * Two things go wrong without this section, and both are silent. The rows those answers belong to
 * render as unanswered, so a project manager reads "the client did not say" and goes to ask again
 * for something already answered. And the client's words are on the record but nowhere on screen.
 */
describe("PMIntakeBrief with replies that could not be parsed", () => {
  const withUnparsed = () =>
    payload({
      unparsedReplies: {
        users: "Dispatchers book slots, drivers confirm arrival, managers see the day ahead",
      },
    } as Partial<DevFlowClientIntakePayload>);

  it("shows the client's own words when an answer could not be filed under a heading", () => {
    render(<PMIntakeBrief payload={withUnparsed()} readiness={readiness()} documents={[]} onOpenForm={jest.fn()} />);

    expect(
      screen.getByText("Dispatchers book slots, drivers confirm arrival, managers see the day ahead"),
    ).toBeInTheDocument();
  });

  it("names the question each unparsed answer was given to", () => {
    render(<PMIntakeBrief payload={withUnparsed()} readiness={readiness()} documents={[]} onOpenForm={jest.fn()} />);

    expect(screen.getByText("Who uses it, and what they do with it")).toBeInTheDocument();
  });

  // The common case. A section that appears on every brief stops being read.
  it("shows nothing at all when everything parsed", () => {
    render(<PMIntakeBrief payload={payload()} readiness={readiness()} documents={[]} onOpenForm={jest.fn()} />);

    expect(screen.queryByText("In the client's own words")).not.toBeInTheDocument();
  });

  it("ignores an empty entry rather than rendering a blank heading", () => {
    const blank = payload({ unparsedReplies: { users: "   " } } as Partial<DevFlowClientIntakePayload>);
    render(<PMIntakeBrief payload={blank} readiness={readiness()} documents={[]} onOpenForm={jest.fn()} />);

    expect(screen.queryByText("In the client's own words")).not.toBeInTheDocument();
  });
});
