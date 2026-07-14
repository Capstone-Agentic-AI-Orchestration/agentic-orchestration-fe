import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
let mockSelectedProjectState: Record<string, unknown>;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/dev/messages",
}));

jest.mock("@/shared/projects/selected-project-context", () => ({
  useSelectedDevFlowProject: () => mockSelectedProjectState,
  SelectedProjectProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/shared/components/collaboration/project-conversation-panel", () => ({
  ProjectConversationPanel: (props: {
    projectId: string;
    defaultVisibility: string;
    title: string;
  }) => (
    <div
      data-testid="conversation-panel"
      data-project-id={props.projectId}
      data-visibility={props.defaultVisibility}
    >
      {props.title}
    </div>
  ),
}));

import { DevMessagesView } from "@/features/dev/messages/views/dev-messages-view";
import { DEV_NAV, DEV_TITLES } from "@/features/dev/shared/components/dev-console-shell";

function selectedProjectState(overrides: Record<string, unknown> = {}) {
  return {
    projects: [{ id: "project-1", companyName: "Acme" }],
    projectsLoading: false,
    projectsError: "",
    refreshProjects: jest.fn(),
    selectedProjectId: "project-1",
    setSelectedProjectId: jest.fn(),
    selectedProject: { id: "project-1", companyName: "Acme" },
    selectedProjectLoading: false,
    selectedProjectError: "",
    refreshSelectedProject: jest.fn(),
    ...overrides,
  };
}

describe("developer navigation and messages", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSelectedProjectState = selectedProjectState();
  });

  it("uses the five approved developer navigation items in order", () => {
    expect(DEV_NAV.map((item) => ({ id: item.id, label: item.label }))).toEqual([
      { id: "dashboard", label: "Dashboard" },
      { id: "projects", label: "Projects" },
      { id: "orchestrator", label: "Orchestrator" },
      { id: "messages", label: "Messages" },
      { id: "settings", label: "Settings" },
    ]);
    expect(DEV_TITLES.messages).toBe("Messages");
  });

  it("binds team conversations to the selected assigned project", () => {
    render(<DevMessagesView />);

    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText(/project manager and every developer assigned/i)).toBeInTheDocument();
    expect(screen.getByTestId("conversation-panel")).toHaveAttribute("data-project-id", "project-1");
    expect(screen.getByTestId("conversation-panel")).toHaveAttribute("data-visibility", "TEAM");
  });

  it("shows the PM-assignment empty state when the developer has no projects", () => {
    mockSelectedProjectState = selectedProjectState({
      projects: [],
      selectedProjectId: null,
      selectedProject: null,
    });

    render(<DevMessagesView />);

    expect(screen.getByText("No assigned project")).toBeInTheDocument();
    expect(screen.getByText(/project manager must add this developer account/i)).toBeInTheDocument();
    expect(screen.queryByTestId("conversation-panel")).not.toBeInTheDocument();
  });

  it("shows a compact backend error instead of the conversation UI", () => {
    mockSelectedProjectState = selectedProjectState({ projectsError: "Network unavailable" });

    render(<DevMessagesView />);

    expect(screen.getByText("Messages are unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("conversation-panel")).not.toBeInTheDocument();
  });
});
