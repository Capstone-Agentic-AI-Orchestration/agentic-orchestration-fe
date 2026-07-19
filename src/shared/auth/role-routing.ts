import type { DevFlowUserRole } from "@/shared/api/devflow-api";

export function homePathForRole(role: DevFlowUserRole): string {
  const paths: Record<DevFlowUserRole, string> = {
    // CLIENT has no workspace in this console — the client portal is a separate
    // app. /no-access is a terminal page on purpose: routing CLIENT to /sign-in
    // would loop, since sign-in re-routes an authenticated user by role.
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
