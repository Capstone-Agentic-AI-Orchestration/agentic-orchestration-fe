import type { JourneyRole, JourneyStage } from "./types";

export const JOURNEY_ORDER: JourneyStage[] = [
  "welcome",
  "role-workspace",
  "project-setup",
  "readiness",
  "kickoff",
  "plan-review",
  "build-run",
  "build-review",
  "delivery-review",
  "accepted",
];

export const JOURNEY_STAGE_COPY: Record<JourneyStage, { label: string; shortLabel: string; description: string }> = {
  welcome: {
    label: "Welcome",
    shortLabel: "Welcome",
    description: "Understand the workspace and choose the right role.",
  },
  "role-workspace": {
    label: "Role workspace",
    shortLabel: "Workspace",
    description: "Land in the right dashboard for your responsibilities.",
  },
  "project-setup": {
    label: "Project setup",
    shortLabel: "Setup",
    description: "Capture the brief, stack, members, and first deliverables.",
  },
  readiness: {
    label: "Readiness",
    shortLabel: "Ready",
    description: "Confirm providers, repository delivery, and required project inputs.",
  },
  kickoff: {
    label: "Kickoff",
    shortLabel: "Kickoff",
    description: "Lock scope, milestones, agent tasks, and team responsibilities.",
  },
  "plan-review": {
    label: "Plan review",
    shortLabel: "Plan",
    description: "Approve the architecture and contract before the build proceeds.",
  },
  "build-run": {
    label: "Build run",
    shortLabel: "Build",
    description: "Watch Eve and the agent workers create implementation deliverables.",
  },
  "build-review": {
    label: "Build review",
    shortLabel: "Review",
    description: "Inspect generated deliverables before GitHub and client handoff.",
  },
  "delivery-review": {
    label: "Delivery review",
    shortLabel: "Delivery",
    description: "Share client-visible deliverables and resolve final revisions.",
  },
  accepted: {
    label: "Accepted",
    shortLabel: "Accepted",
    description: "The client accepted delivery and the project moves into support.",
  },
};

export const ROLE_COPY: Record<JourneyRole, { label: string; emptyTitle: string; emptyDescription: string }> = {
  visitor: {
    label: "Visitor",
    emptyTitle: "Choose how you want to enter DevFlow",
    emptyDescription: "Start as a client, PM, developer, or admin so the app can show the right next step.",
  },
  pm: {
    label: "Project manager",
    emptyTitle: "Create your first project",
    emptyDescription: "Add a company, describe the product, and DevFlow will guide you through readiness, kickoff, build, and delivery.",
  },
  client: {
    label: "Client",
    emptyTitle: "No project is assigned yet",
    emptyDescription: "Once a PM adds you to a project, this workspace will show status, deliverables, reviews, and acceptance actions.",
  },
  dev: {
    label: "Developer",
    emptyTitle: "No assigned projects yet",
    emptyDescription: "Assigned agent tasks, deliverables, and handoffs will appear here after a PM adds you to a backend project.",
  },
  admin: {
    label: "Admin",
    emptyTitle: "Finish platform setup",
    emptyDescription: "Connect providers, GitHub delivery, users, and health checks so teams can run guided orchestration.",
  },
};

export const HUMAN_TERMS: Record<string, string> = {
  "Gate 1": "Plan review",
  "Gate 2": "Build review",
  "Work orders": "Agent tasks",
  "Work order": "Agent task",
  Artifact: "Deliverable",
  Artifacts: "Deliverables",
};

export function humanizeJourneyTerm(value?: string | null) {
  if (!value) return "";
  return Object.entries(HUMAN_TERMS)
    .sort(([left], [right]) => right.length - left.length)
    .reduce((text, [from, to]) => {
      const pattern = new RegExp(from, "gi");
      return text.replace(pattern, (match) => {
        const startsLower = match[0] === match[0]?.toLowerCase();
        return startsLower ? to[0].toLowerCase() + to.slice(1) : to;
      });
    }, value);
}
