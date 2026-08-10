import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { devflowClientScope, devflowProjectScope } from "@/shared/api/devflow-api";
import type { DevFlowConversationScope } from "@/shared/api/devflow-api";

const mockCreateConversation = jest.fn();
const mockRefreshConversations = jest.fn();
const mockSendMessage = jest.fn();
const mockUseConversations = jest.fn();
const mockUseMessages = jest.fn();

jest.mock("@/shared/hooks/use-devflow-collaboration", () => ({
  useDevFlowConversations: (scope: DevFlowConversationScope) => mockUseConversations(scope),
  useDevFlowConversationMessages: (scope: DevFlowConversationScope, conversationId: string) =>
    mockUseMessages(scope, conversationId),
}));

import { ConversationPanel } from "@/shared/components/collaboration/project-conversation-panel";

const projectOneConversation = {
  id: "conversation-1",
  projectId: "project-1",
  clientId: null,
  title: "Sprint coordination",
  category: "GENERAL",
  visibility: "TEAM",
  unreadCount: 3,
  messages: [{ body: "Please review the current sprint." }],
  _count: { messages: 2 },
};

const projectTwoConversation = {
  ...projectOneConversation,
  id: "conversation-2",
  projectId: "project-2",
  title: "Project two planning",
  unreadCount: 0,
};

const clientConversation = {
  ...projectOneConversation,
  id: "conversation-3",
  projectId: null,
  clientId: "client-1",
  title: "Renewal terms",
  visibility: "CLIENT",
  unreadCount: 1,
};

const scopeId = (scope?: DevFlowConversationScope | null) =>
  scope?.kind === "project" ? scope.projectId : scope?.clientId;

describe("ConversationPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateConversation.mockResolvedValue({ id: "created-conversation" });
    mockSendMessage.mockResolvedValue({ id: "message-2" });
    mockUseConversations.mockImplementation((scope: DevFlowConversationScope) => {
      const byScope: Record<string, unknown[]> = {
        "project-1": [projectOneConversation],
        "project-2": [projectTwoConversation],
        "client-1": [clientConversation],
      };
      return {
        conversations: byScope[scopeId(scope) ?? ""] ?? [],
        loading: false,
        error: "",
        refresh: mockRefreshConversations,
        createConversation: mockCreateConversation,
      };
    });
    mockUseMessages.mockImplementation((_scope: DevFlowConversationScope, conversationId: string) => ({
      messages: conversationId
        ? [{ id: "message-1", body: "Status update", createdAt: "2026-07-10T00:00:00.000Z", author: { fullName: "Project Manager" } }]
        : [],
      loading: false,
      error: "",
      refresh: jest.fn(),
      sendMessage: mockSendMessage,
    }));
  });

  it("creates TEAM threads and sends messages in the active project conversation", async () => {
    const user = userEvent.setup();
    render(<ConversationPanel scope={devflowProjectScope("project-1")} defaultVisibility="TEAM" />);

    expect(screen.getByText("3")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockUseMessages).toHaveBeenCalledWith(devflowProjectScope("project-1"), "conversation-1"),
    );

    await user.click(screen.getByRole("button", { name: "New thread" }));
    await user.type(screen.getByPlaceholderText("What do you need to discuss?"), "Backend blockers");
    await user.type(screen.getByPlaceholderText("Add some context…"), "I need PM guidance.");
    await user.click(screen.getByRole("button", { name: "Create thread" }));

    expect(mockCreateConversation).toHaveBeenCalledWith({
      title: "Backend blockers",
      message: "I need PM guidance.",
      visibility: "TEAM",
      category: "GENERAL",
    });

    await user.type(screen.getByPlaceholderText("Write a message..."), "The API task is ready.");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(mockSendMessage).toHaveBeenCalledWith("The API task is ready.");
  });

  it("clears stale drafts and selects the new thread when the scope changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ConversationPanel scope={devflowProjectScope("project-1")} defaultVisibility="TEAM" />,
    );
    const draft = screen.getByPlaceholderText("Write a message...");
    await user.type(draft, "Unsaved project one draft");

    rerender(<ConversationPanel scope={devflowProjectScope("project-2")} defaultVisibility="TEAM" />);

    await waitFor(() => expect(screen.getByPlaceholderText("Write a message...")).toHaveValue(""));
    expect(screen.getAllByText("Project two planning").length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(mockUseMessages).toHaveBeenCalledWith(devflowProjectScope("project-2"), "conversation-2"),
    );
  });

  // The panel is the same component on the client page and the developer page. If a scope object of
  // the wrong kind reached the hooks, one owner's page would render another's threads.
  it("reads a client scope without falling back to a project", async () => {
    render(<ConversationPanel scope={devflowClientScope("client-1")} />);

    expect(mockUseConversations).toHaveBeenCalledWith(devflowClientScope("client-1"));
    expect(screen.getAllByText("Renewal terms").length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(mockUseMessages).toHaveBeenCalledWith(devflowClientScope("client-1"), "conversation-3"),
    );
  });

  // Crossing owner kinds is the case a plain id could not express and a mismatched draft would leak.
  it("resets the draft when moving from a project scope to a client scope", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ConversationPanel scope={devflowProjectScope("project-1")} />);
    await user.type(screen.getByPlaceholderText("Write a message..."), "Internal build note");

    rerender(<ConversationPanel scope={devflowClientScope("client-1")} />);

    await waitFor(() => expect(screen.getByPlaceholderText("Write a message...")).toHaveValue(""));
  });

  it("renders the no-scope message instead of an empty thread list", () => {
    render(<ConversationPanel scope={null} noScopeText="No client is selected." />);

    expect(screen.getByText("No client is selected.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New thread" })).not.toBeInTheDocument();
  });
});
