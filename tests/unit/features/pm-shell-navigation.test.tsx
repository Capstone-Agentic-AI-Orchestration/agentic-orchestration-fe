import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockPush = jest.fn();
const mockSignOut = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/pm/clients",
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/shared/auth/auth-provider", () => ({
  useAuth: () => ({
    devFlowUser: { fullName: "Lloyd Lim", email: "lloyd@example.com" },
    signOut: mockSignOut,
  }),
}));

jest.mock("@/shared/components/ui", () => ({
  Logo: () => <div>ALPHAEXPLORA</div>,
  Button: ({
    children,
    icon,
    variant: _variant,
    size: _size,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
    variant?: string;
    size?: string;
  }) => <button {...props}>{icon}{children}</button>,
}));

import { AppShell } from "@/shared/components/layout/app-shell";
import { buildPMNav } from "@/features/pm/shared/components/pm-console-shell";
import { DevFlowNotificationList } from "@/shared/components/notifications/devflow-notification-list";

describe("PM left-panel navigation", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSignOut.mockReset();
    window.localStorage.clear();
  });

  it("leads with Inbox and folds Inquiries into Clients", () => {
    const nav = buildPMNav(2, 3);

    expect(nav.map((item) => item.id)).toEqual([
      "inbox",
      "clients",
      "projects",
      "agents",
      "groups",
      "settings",
    ]);
    expect(nav.find((item) => item.id === "inquiries")).toBeUndefined();
    // The new-inquiry count rides on Clients, which is the door you reach inquiries through.
    expect(nav.find((item) => item.id === "clients")?.badge).toBe(2);
    expect(nav.find((item) => item.id === "inbox")?.badge).toBe(3);
    // /pm/inquiries still resolves, so the old link keeps lighting the right nav item.
    expect(nav.find((item) => item.id === "clients")?.aliases).toContain("inquiries");
  });

  it("uses a hover rail, keeps the logo in the tab bar, and puts the bare profile above navigation", () => {
    render(
      <AppShell
        rootLabel="PM"
        basePath="/pm"
        rolePill="PM"
        nav={buildPMNav()}
        titles={{ clients: "Clients" }}
        defaultRoute="clients"
        searchPlaceholder="Search"
        hoverExpandSidebar
        brandInTopbar
        workspaceTabs
        accountMenuInSidebar
        accountMenuAtTop
        menuSlot={<div>Workspace choices</div>}
      >
        <div>Client content</div>
      </AppShell>,
    );

    const shell = screen.getByText("Client content").closest(".cs-shell");
    const logo = screen.getByText("ALPHAEXPLORA");
    const profileTrigger = screen.getByRole("button", { name: "Open profile and workspace menu" });
    const navigation = screen.getByRole("navigation");

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(shell).toHaveClass("cs-shell--hover-sidebar", "cs-shell--workspace-tabs");
    expect(logo.closest("header")).toBeInTheDocument();
    expect(logo.closest("aside")).not.toBeInTheDocument();
    expect(profileTrigger).toHaveClass("cs-user--bare");
    expect(profileTrigger.compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Client content")).toBeInTheDocument();

    fireEvent.click(profileTrigger);

    expect(screen.getByText("Workspace choices")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Profile & preferences/i })).toBeInTheDocument();
    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  function renderTabs() {
    return render(
      <AppShell
        rootLabel="PM"
        basePath="/pm"
        rolePill="PM"
        nav={buildPMNav()}
        titles={{ clients: "Clients" }}
        defaultRoute="clients"
        newTabTarget="inbox"
        searchPlaceholder="Search"
        hoverExpandSidebar
        brandInTopbar
        workspaceTabs
      >
        <div>Client content</div>
      </AppShell>,
    );
  }

  it("opens a new tab on the configured target rather than asking which one", () => {
    renderTabs();

    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Clients" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(screen.getByRole("button", { name: "New tab" }));

    expect(mockPush).toHaveBeenLastCalledWith("/pm/inbox");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "Inbox" })).toBeInTheDocument();
  });

  it("closes a tab", () => {
    renderTabs();
    fireEvent.click(screen.getByRole("button", { name: "New tab" }));

    fireEvent.click(screen.getByRole("button", { name: "Close Inbox tab" }));
    expect(screen.queryByRole("tab", { name: "Inbox" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(1);
  });

  it("navigates the sidebar without growing the tab strip", () => {
    renderTabs();
    expect(screen.getAllByRole("tab")).toHaveLength(1);

    // A sidebar click retargets the tab you are standing in; only + adds one.
    fireEvent.click(screen.getByText("Projects"));

    expect(mockPush).toHaveBeenLastCalledWith("/pm/projects");
    expect(screen.getAllByRole("tab")).toHaveLength(1);
  });

  it("renders the notification feed as an Inbox surface", () => {
    const state = {
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: "",
      refresh: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };

    render(
      <DevFlowNotificationList
        state={state}
        title="Inbox"
        emptyMessage="Your inbox is clear."
      />,
    );

    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Your inbox is clear.")).toBeInTheDocument();
  });
});
