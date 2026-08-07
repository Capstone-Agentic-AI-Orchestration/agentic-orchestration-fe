import { TeamWorkspaceMenuSection } from "@/shared/projects/team-workspace-switcher";

/**
 * The active team workspace belongs with the PM profile rather than with a page header.
 * Notifications intentionally do not appear here; they now have the first-class Inbox route.
 */
export function PMAccountMenu() {
  return (
    <>
      <TeamWorkspaceMenuSection />
      <div className="cs-menu-sep" />
    </>
  );
}
