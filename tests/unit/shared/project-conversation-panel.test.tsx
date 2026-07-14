import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockCreateConversation = jest.fn();
const mockRefreshConversations = jest.fn();
const mockSendMessage = jest.fn();
const mockUseConversations = jest.fn();
const mockUseMessages = jest.fn();

jest.mock("@/shared/hooks/use-devflow-collaboration", () => ({
  useDevFlowConversations: (projectId: string) => mockUseConversations(projectId),
  useDevFlowConversationMessages: (projectId: string, conversationId: string) => mockUseMessages(projectId, conversationId),
}));

import { ProjectConversationPanel } from "@/shared/components/collaboration/project-conversation-panel";

const projectOneConversation = {
  id: "conversation-1",
  projectId: "project-1",
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

describe("ProjectConversationPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateConversation.mockResolvedValue({ id: "created-conversation" });
    mockSendMessage.mockResolvedValue({ id: "message-2" });
    mockUseConversations.mockImplementation((projectId: string) => ({
      conversations: projectId === "project-2" ? [projectTwoConversation] : [projectOneConversation],
      loading: false,
      error: "",
      refresh: mockRefreshConversations,
      createConversation: mockCreateConversation,
    }));
    mockUseMessages.mockImplementation((_projectId: string, conversationId: string) => ({
      messages: conversationId ? [{ id: "message-1", body: "Status update", createdAt: "2026-07-10T00:00:00.000Z", author: { fullName: "Project Manager" } }] : [],
      loading: false,
      error: "",
      refresh: jest.fn(),
      sendMessage: mockSendMessage,
    }));
  });

  it("creates TEAM threads and sends messages in the active project conversation", async () => {
    const user = userEvent.setup();
    render(<ProjectConversationPanel projectId="project-1" defaultVisibility="TEAM" />);

    expect(screen.getByText("3")).toBeInTheDocument();
    await waitFor(() => expect(mockUseMessages).toHaveBeenCalledWith("project-1", "conversation-1"));

    await user.type(screen.getByPlaceholderText("Thread title"), "Backend blockers");
    await user.type(screen.getByPlaceholderText("Optional first message"), "I need PM guidance.");
    await user.click(screen.getByRole("button", { name: "Create thread" }));

    expect(mockCreateConversation).toHaveBeenCalledWith({
      title: "Backend blockers",
      message: "I need PM guidance.",
      visibility: "TEAM",
      category: "GENERAL",
    });

    await user.type(screen.getByPlaceholderText("Write a project message..."), "The API task is ready.");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(mockSendMessage).toHaveBeenCalledWith("The API task is ready.");
  });

  it("clears stale drafts and selects the new project thread when the project changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ProjectConversationPanel projectId="project-1" defaultVisibility="TEAM" />);
    const draft = screen.getByPlaceholderText("Write a project message...");
    await user.type(draft, "Unsaved project one draft");

    rerender(<ProjectConversationPanel projectId="project-2" defaultVisibility="TEAM" />);

    await waitFor(() => expect(screen.getByPlaceholderText("Write a project message...")).toHaveValue(""));
    expect(screen.getAllByText("Project two planning").length).toBeGreaterThan(0);
    await waitFor(() => expect(mockUseMessages).toHaveBeenCalledWith("project-2", "conversation-2"));
  });
});
