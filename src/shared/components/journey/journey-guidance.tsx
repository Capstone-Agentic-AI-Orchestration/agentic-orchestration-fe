"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/shared/components/ui";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheckCircle,
  IconInfo,
  IconShield,
} from "@/shared/components/icons";
import { JOURNEY_ORDER, JOURNEY_STAGE_COPY, ROLE_COPY } from "@/shared/journey/copy";
import type { BlockingIssue, GuidedAction, JourneyContext, JourneyHealth, JourneyRole, JourneyStage } from "@/shared/journey/types";

const healthTone: Record<JourneyHealth, string> = {
  neutral: "gray",
  ready: "blue",
  attention: "amber",
  blocked: "red",
  complete: "green",
};

const healthLabel: Record<JourneyHealth, string> = {
  neutral: "Orienting",
  ready: "Ready",
  attention: "Needs attention",
  blocked: "Blocked",
  complete: "Complete",
};

export function JourneyStepper({ currentStage, compact = false }: { currentStage: JourneyStage; compact?: boolean }) {
  const currentIndex = JOURNEY_ORDER.indexOf(currentStage);
  return (
    <nav className={"journey-stepper" + (compact ? " is-compact" : "")} aria-label="Guided project journey">
      {JOURNEY_ORDER.slice(1).map((stage, index) => {
        const copy = JOURNEY_STAGE_COPY[stage];
        const actualIndex = index + 1;
        const state = actualIndex < currentIndex ? "done" : actualIndex === currentIndex ? "current" : "next";
        return (
          <span key={stage} className={`journey-step is-${state}`} aria-current={state === "current" ? "step" : undefined}>
            <span className="journey-step-dot">{state === "done" ? <IconCheckCircle size={12} /> : actualIndex}</span>
            <span className="journey-step-label">{compact ? copy.shortLabel : copy.label}</span>
          </span>
        );
      })}
    </nav>
  );
}

export function GuidedActionPanel({ context, compact = false }: { context: JourneyContext; compact?: boolean }) {
  return (
    <Card className={"guided-panel" + (compact ? " is-compact" : "")}>
      <div className="guided-panel-main">
        <div className="guided-panel-kicker">
          <Badge tone={healthTone[context.health]}>{healthLabel[context.health]}</Badge>
          <span>{ROLE_COPY[context.role].label}</span>
          {context.statusLabel && <span>{context.statusLabel}</span>}
        </div>
        <h2>{context.title}</h2>
        <p>{context.description}</p>
        <JourneyStepper currentStage={context.stage} compact />
      </div>
      <div className="guided-answers" aria-label="Journey guidance">
        <GuidedAnswer label="Where am I?" value={JOURNEY_STAGE_COPY[context.stage].label} />
        <GuidedAnswer label="What changed?" value={context.changed || "Status is current."} />
        <GuidedAnswer label="What should I do next?" value={context.nextAction} strong />
        <GuidedAnswer label="Who is waiting on me?" value={context.waitingOn} />
        {context.progress != null && (
          <div className="guided-progress" aria-label={`${context.progress}% complete`}>
            <span style={{ width: `${Math.min(100, Math.max(0, context.progress))}%` }} />
          </div>
        )}
        {(context.primaryAction || context.secondaryAction) && (
          <div className="guided-actions">
            {context.primaryAction && <ActionButton action={context.primaryAction} fallbackVariant="primary" />}
            {context.secondaryAction && <ActionButton action={context.secondaryAction} fallbackVariant="secondary" />}
          </div>
        )}
      </div>
    </Card>
  );
}

export function StatusExplainer({
  title,
  body,
  tone = "neutral",
  items = [],
}: {
  title: string;
  body: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  items?: string[];
}) {
  const Icon = tone === "success" ? IconCheckCircle : tone === "danger" || tone === "warning" ? IconAlertTriangle : IconInfo;
  return (
    <div className={`status-explainer tone-${tone}`}>
      <Icon size={16} />
      <div>
        <div className="status-explainer-title">{title}</div>
        <div className="status-explainer-body">{body}</div>
        {items.length > 0 && (
          <ul>
            {items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

export function RoleEmptyState({ role, action }: { role: JourneyRole; action?: GuidedAction }) {
  const copy = ROLE_COPY[role];
  return (
    <div className="role-empty-state">
      <div className="role-empty-icon"><IconShield size={20} /></div>
      <h3>{copy.emptyTitle}</h3>
      <p>{copy.emptyDescription}</p>
      {action && <ActionButton action={action} fallbackVariant="primary" />}
    </div>
  );
}

export function BlockingIssuePanel({ issues = [] }: { issues?: BlockingIssue[] }) {
  if (!issues.length) return null;
  return (
    <div className="blocking-panel" role="status" aria-live="polite">
      {issues.map((issue, index) => (
        <div key={`${issue.title}-${index}`} className={`blocking-issue severity-${issue.severity || "warning"}`}>
          <IconAlertTriangle size={15} />
          <div>
            <div className="blocking-title">{issue.title}</div>
            {issue.description && <div className="blocking-desc">{issue.description}</div>}
            {issue.action && <ActionButton action={issue.action} fallbackVariant="secondary" />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function InlineHelpDrawer({ title = "What this means", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="inline-help">
      <summary>
        <IconInfo size={14} />
        {title}
      </summary>
      <div>{children}</div>
    </details>
  );
}

function GuidedAnswer({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="guided-answer">
      <span>{label}</span>
      <strong className={strong ? "is-primary" : undefined}>{value}</strong>
    </div>
  );
}

function ActionButton({ action, fallbackVariant }: { action: GuidedAction; fallbackVariant: NonNullable<GuidedAction["variant"]> }) {
  const router = useRouter();
  const onClick = action.onClick ?? (action.href ? () => router.push(action.href!) : undefined);
  return (
    <Button
      variant={action.variant || fallbackVariant}
      size="sm"
      icon={action.icon}
      iconRight={!action.icon ? <IconArrowRight size={13} /> : undefined}
      onClick={onClick}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );
}
