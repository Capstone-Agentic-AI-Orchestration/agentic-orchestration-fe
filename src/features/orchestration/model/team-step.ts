export type TeamMemberRole = "DEV" | "CLIENT" | "PM" | string;
export type TeamAssignableRole = "DEV" | "CLIENT";

export interface TeamMemberProfile {
  fullName?: string | null;
  email?: string | null;
}

export interface TeamMemberLike {
  userId: string;
  role: TeamMemberRole;
  profile?: TeamMemberProfile | null;
}

export interface TeamProfileSearchResult {
  userId: string;
  fullName?: string | null;
  email?: string | null;
}

export interface TeamStepState {
  members: TeamMemberLike[];
  memberIds: Set<string>;
  visibleResults: TeamProfileSearchResult[];
  memberCount: number;
  hasMembers: boolean;
}

export function memberDisplayName(member: TeamMemberLike): string {
  return member.profile?.fullName ?? member.profile?.email ?? "Unknown";
}

export function profileDisplayName(profile: TeamProfileSearchResult): string {
  return profile.fullName ?? "Unknown";
}

export function avatarInitial(value?: string | null): string {
  return value?.[0]?.toUpperCase() ?? "";
}

export function memberRoleTone(role: TeamMemberRole): "blue" | "purple" | "gray" {
  if (role === "DEV") return "blue";
  if (role === "PM") return "purple";
  return "gray";
}

export function canRemoveMember(member: TeamMemberLike): boolean {
  return member.role !== "PM";
}

export function buildTeamStepState(input: {
  members: TeamMemberLike[];
  results: TeamProfileSearchResult[];
}): TeamStepState {
  const memberIds = new Set(input.members.map((member) => member.userId));
  return {
    members: input.members,
    memberIds,
    visibleResults: input.results.filter((profile) => !memberIds.has(profile.userId)),
    memberCount: input.members.length,
    hasMembers: input.members.length > 0,
  };
}
