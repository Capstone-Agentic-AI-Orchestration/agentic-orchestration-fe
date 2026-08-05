/**
 * The delivery build panels, shared by both staff consoles.
 *
 * These four panels drive kickoff, tasks, work orders and orchestration. They were written
 * for the PM console and still live under `features/pm/projects/` — that path is now a
 * historical accident rather than a statement of ownership, because the build belongs to the
 * developer (see the role-split note on ProjectsController).
 *
 * They are re-exported here so the developer console imports them by responsibility instead
 * of reaching into `features/pm/...`, which would read as a layering violation and invites
 * someone to "fix" it by copying the panels. There is exactly one implementation of each:
 * the PM renders the read-only ones with `readOnly`, the developer renders them writable.
 *
 * Moving the files under this directory is the tidier end state and is safe to do whenever
 * the import churn is affordable; nothing here depends on their current location.
 */
export { BackendKickoffPanel } from "@/features/pm/projects/components/backend-kickoff-panel";
export { BackendTasksPanel } from "@/features/pm/projects/components/backend-tasks-panel";
export { BackendWorkOrdersPanel } from "@/features/pm/projects/components/backend-work-orders-panel";
export { BackendOrchestrationPanel } from "@/features/pm/projects/components/backend-orchestration-panel";
