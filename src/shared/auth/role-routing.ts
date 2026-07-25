import type { DevFlowUserRole } from "@/shared/api/devflow-api";

export function homePathForRole(role: DevFlowUserRole): string {
  const paths: Record<DevFlowUserRole, string> = {
    // Defensive only: the backend now refuses CLIENT sign-ins outright (403
    // NOT_A_TEAM_MEMBER), so no CLIENT role should ever reach the frontend. Kept mapped to
    // the terminal /no-access page because routing a CLIENT to /sign-in would loop —
    // sign-in re-routes an authenticated user by role.
    CLIENT: "/no-access",
    PM: "/pm/projects",
    DEV: "/dev/dashboard",
    ADMIN: "/admin/overview",
  };

  return paths[role];
}

export function loginPathForRole(role: DevFlowUserRole, nextPath?: string | null): string {
  if (nextPath && isNextPathForRole(role, nextPath)) return nextPath;
  return homePathForRole(role);
}

function isNextPathForRole(role: DevFlowUserRole, nextPath: string): boolean {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return false;

  const roleRoots: Record<DevFlowUserRole, string> = {
    // No /client routes exist here, so a CLIENT never has a valid `next` target.
    CLIENT: "/no-access",
    PM: "/pm",
    DEV: "/dev",
    ADMIN: "/admin",
  };

  const root = roleRoots[role];
  return nextPath === root || nextPath.startsWith(`${root}/`);
}
