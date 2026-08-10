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
  useDevFlowConversations: (clientId: string) => mockUseConversations(clientId),
  useDevFlowConversationMessages: (clientId: string, conversationId: string) =>
    mockUseMessages(clientId, conversationId),
}));

import { ConversationPanel } from "@/shared/components/collaboration/project-conversation-panel";

const acmeThread = {
  id: "conversation-1",
  projectId: null,
  clientId: "client-1",
  title: "Renewal terms",
  category: "GENERAL",
  visibility: "CLIENT",
  unreadCount: 3,
  messages: [{ body: "Can you send the revised quote?" }],
  _count: { messages: 2 },
};

const otherClientThread = {
  ...acmeThread,
  id: "conversation-2",
  clientId: "client-2",
  title: "Second company planning",
  unreadCount: 0,
};

describe("ConversationPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateConversation.mockResolvedValue({ id: "created-conversation" });
    mockSendMessage.mockResolvedValue({ id: "message-2" });
    mockUseConversations.mockImplementation((clientId: string) => {
      const byClient: Record<string, unknown[]> = {
        "client-1": [acmeThread],
        "client-2": [otherClientThread],
      };
      return {
        conversations: byClient[clientId] ?? [],
        loading: false,
        error: "",
        refresh: mockRefreshConversations,
        createConversation: mockCreateConversation,
      };
    });
    mockUseMessages.mockImplementation((_clientId: string, conversationId: string) => ({
      messages: conversationId
        ? [{ id: "message-1", body: "Status update", createdAt: "2026-07-10T00:00:00.000Z", author: { fullName: "Project Manager" } }]
        : [],
      loading: false,
      error: "",
      refresh: jest.fn(),
      sendMessage: mockSendMessage,
    }));
  });

  it("creates threads and sends messages in the active client conversation", async () => {
    const user = userEvent.setup();
    render(<ConversationPanel clientId="client-1" />);

    expect(screen.getByText("3")).toBeInTheDocument();
    await waitFor(() => expect(mockUseMessages).toHaveBeenCalledWith("client-1", "conversation-1"));

    await user.click(screen.getByRole("button", { name: "New thread" }));
    await user.type(screen.getByPlaceholderText("What do you need to discuss?"), "Scope change");
    await user.type(screen.getByPlaceholderText("Add some context…"), "They want a second phase.");
    await user.click(screen.getByRole("button", { name: "Create thread" }));

    expect(mockCreateConversation).toHaveBeenCalledWith({
      title: "Scope change",
      message: "They want a second phase.",
      visibility: "CLIENT",
      category: "GENERAL",
    });

    await user.type(screen.getByPlaceholderText("Write a message..."), "Quote attached.");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(mockSendMessage).toHaveBeenCalledWith("Quote attached.");
  });

  // Switching companies must not carry a half-typed message across. These are different customers.
  it("clears a stale draft and selects the new thread when the client changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ConversationPanel clientId="client-1" />);
    await user.type(screen.getByPlaceholderText("Write a message..."), "Unsent note to Acme");

    rerender(<ConversationPanel clientId="client-2" />);

    await waitFor(() => expect(screen.getByPlaceholderText("Write a message...")).toHaveValue(""));
    expect(screen.getAllByText("Second company planning").length).toBeGreaterThan(0);
    await waitFor(() => expect(mockUseMessages).toHaveBeenCalledWith("client-2", "conversation-2"));
  });

  it("renders the no-client message instead of an empty thread list", () => {
    render(<ConversationPanel clientId={null} noClientText="No client is selected." />);

    expect(screen.getByText("No client is selected.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New thread" })).not.toBeInTheDocument();
  });
});
