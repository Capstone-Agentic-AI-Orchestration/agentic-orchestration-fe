import type { ReactNode } from "react";

export type JourneyRole = "visitor" | "pm" | "client" | "dev" | "admin";

export type JourneyStage =
  | "welcome"
  | "role-workspace"
  | "project-setup"
  | "readiness"
  | "kickoff"
  | "plan-review"
  | "build-run"
  | "build-review"
  | "delivery-review"
  | "accepted";

export type JourneyHealth = "neutral" | "ready" | "attention" | "blocked" | "complete";

export interface GuidedAction {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
}

export interface BlockingIssue {
  title: string;
  description?: string;
  severity?: "info" | "warning" | "critical";
  action?: GuidedAction;
}

export interface JourneyContext {
  role: JourneyRole;
  stage: JourneyStage;
  title: string;
  description: string;
  projectName?: string;
  projectId?: string;
  statusLabel?: string;
  nextAction: string;
  waitingOn: string;
  changed?: string;
  progress?: number;
  health: JourneyHealth;
  primaryAction?: GuidedAction;
  secondaryAction?: GuidedAction;
  blockers?: BlockingIssue[];
}
