import type { DevFlowUserRole } from "@/shared/api/devflow-api";

export function homePathForRole(role: DevFlowUserRole): string {
  const paths: Record<DevFlowUserRole, string> = {
    CLIENT: "/client/dashboard",
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
    CLIENT: "/client",
    PM: "/pm",
    DEV: "/dev",
    ADMIN: "/admin",
  };

  const root = roleRoots[role];
  return nextPath === root || nextPath.startsWith(`${root}/`);
}
