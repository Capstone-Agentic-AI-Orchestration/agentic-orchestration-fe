import type { DevFlowGroup, DevFlowGroupMember } from "@/shared/api/devflow-api";

/**
 * Whether a team contains anyone who could actually build a project.
 *
 * The developer is the only role that can prompt, run orchestration or decide the gates, and a
 * PM cannot stand in for one — the API refuses a PM profile in a DEV seat. So a project created
 * into a developer-less team is unbuildable by anybody, and nothing about it would look wrong:
 * it would sit in the project list while every build route refused every caller.
 *
 * The API enforces this at creation (ProjectsService.assertTeamHasDeveloper). This mirror exists
 * only so the console can say so *before* a PM fills in a five-step wizard, and it deliberately
 * applies the same rule — active membership, profile role DEV — so the two cannot disagree about
 * which teams are usable.
 */
export function teamHasDeveloper(members: DevFlowGroupMember[] | undefined): boolean {
  return (members ?? []).some(
    (member) => member.status === "ACTIVE" && member.user?.role === "DEV",
  );
}

/** Teams a project can actually be created in, in selector order. */
export function buildableTeams(groups: DevFlowGroup[]): DevFlowGroup[] {
  return groups.filter((group) => teamHasDeveloper(group.members));
}

/**
 * The reason a team cannot take a project, or null when it can.
 *
 * Returned as a sentence rather than a boolean because it is shown to the PM verbatim, and the
 * fix ("add a developer to the team") is not something they would infer from a disabled control.
 */
export function teamBlockedReason(group: DevFlowGroup | undefined): string | null {
  if (!group) return null;
  if (teamHasDeveloper(group.members)) return null;
  return `${group.name} has no developer, so nobody could build this project. Add a developer to the team first — project managers cannot run the build themselves.`;
}
