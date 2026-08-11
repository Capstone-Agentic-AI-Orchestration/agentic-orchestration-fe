"use client";

import type { ReactNode } from "react";
import { Badge, Button, Card } from "@/shared/components/ui";
import type {
  DevFlowClientIntakePayload,
  DevFlowIntakeDocument,
  DevFlowIntakeInterviewTopicId,
  DevFlowIntakeReadiness,
} from "@/shared/api/devflow-api";

/** What the assistant asked, in the words a project manager would use to describe the question. */
const UNPARSED_TOPIC_LABELS: Record<DevFlowIntakeInterviewTopicId, string> = {
  goal: "What it is for, and what success looks like",
  users: "Who uses it, and what they do with it",
  musthaves: "What it must be able to do on day one",
  boundaries: "Connections, exclusions, and timing",
};

/**
 * The client's brief, as one page a project manager can read.
 *
 * The eight-step form is an authoring surface, and reading a brief through it means clicking every
 * step and holding the result in your head — past full-size empty inputs for the questions nobody
 * answered. A project with two filled fields took eight clicks to establish that.
 *
 * The rule here is that space is proportional to content. An answered section gets room to be read;
 * an unanswered one costs a single line. Nothing is an input, because none of it is editable from
 * here — the form is still one click away for the rare case where a PM needs to change a value.
 */
export function PMIntakeBrief({
  payload,
  readiness,
  documents,
  onOpenForm,
}: Readonly<{
  payload: DevFlowClientIntakePayload;
  readiness: DevFlowIntakeReadiness;
  documents: DevFlowIntakeDocument[];
  onOpenForm: () => void;
}>) {
  const { overview, roles, features, workflows, dataAndIntegrations, experienceAndDelivery } = payload;
  const mustHaves = features.filter((feature) => feature.priority === "MUST_HAVE");
  const otherFeatures = features.filter((feature) => feature.priority !== "MUST_HAVE");

  // Advisory items arrive on `suggestions`; older responses only had `blockers`. Falling back to an
  // empty list keeps this readable against a backend that has not been redeployed yet.
  const suggestions: string[] = readiness.suggestions ?? [];

  const unparsedTopics = Object.entries(payload.unparsedReplies ?? {}).filter(
    (entry): entry is [DevFlowIntakeInterviewTopicId, string] => Boolean(entry[1]?.trim()),
  );

  return (
    <div className="pm-intake-brief">
      <Card className="pm-tab-panel pm-tab-panel--padded">
        <div className="pm-intake-brief__head">
          <div>
            <h2>The brief</h2>
            <p>Everything the client has told us, on one page.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onOpenForm}>
            Open the full form
          </Button>
        </div>

        <dl className="pm-intake-brief__facts">
          <Fact label="Business goal" value={overview.businessGoal} wide />
          <Fact label="Success looks like" value={overview.successMeasures} />
          <Fact label="Signs off" value={overview.approver} />
          <Fact label="Wanted by" value={overview.targetLaunch} />
          <Fact label="Main contact" value={overview.primaryContact} />
        </dl>

        {/* First, not last. These are answers the client gave that the assistant could not file
            under a heading — a model was unavailable, or the reply did not parse. The sections
            below will look empty for those topics, and a PM who reads the gaps as "they did not
            say" would go and ask again for something already answered. */}
        {unparsedTopics.length > 0 && (
          <Section title="In the client's own words" count={unparsedTopics.length}>
            <p className="pm-intake-brief__inline">
              We could not file these under a heading automatically. They are exactly as the client
              wrote them.
            </p>
            {unparsedTopics.map(([topicId, reply]) => (
              <article key={topicId} className="pm-intake-brief__item">
                <strong>{UNPARSED_TOPIC_LABELS[topicId] ?? topicId}</strong>
                <p>{reply}</p>
              </article>
            ))}
          </Section>
        )}

        <Section title="Must-haves" count={mustHaves.length}>
          {mustHaves.map((feature, index) => (
            <article key={`${feature.title}-${index}`} className="pm-intake-brief__item">
              <strong>{feature.title || "Untitled"}</strong>
              {feature.purpose && <p>{feature.purpose}</p>}
              <Meta label="For" value={feature.primaryRole} />
              <Meta label="How it works" value={feature.workflow} />
              <Meta label="Rules" value={feature.businessRules} />
              <Meta label="Done when" value={feature.acceptanceCriteria} />
            </article>
          ))}
        </Section>

        {otherFeatures.length > 0 && (
          <Section title="Nice to have" count={otherFeatures.length}>
            <p className="pm-intake-brief__inline">
              {otherFeatures.map((feature) => feature.title).filter(Boolean).join(" · ")}
            </p>
          </Section>
        )}

        <Section title="Who uses it" count={roles.length}>
          {roles.map((role, index) => (
            <article key={`${role.name}-${index}`} className="pm-intake-brief__item">
              <strong>{role.name || "Unnamed"}</strong>
              <Meta label="Does" value={role.responsibilities} />
              <Meta label="Allowed to" value={role.permissions} />
            </article>
          ))}
        </Section>

        <Section title="Processes" count={workflows.length}>
          {workflows.map((workflow, index) => (
            <article key={`${workflow.title}-${index}`} className="pm-intake-brief__item">
              <strong>{workflow.title || "Untitled"}</strong>
              <Meta label="Starts when" value={workflow.startCondition} />
              <Meta label="Done by" value={workflow.actor} />
              <Meta label="Steps" value={workflow.steps} ordered />
              <Meta label="Decisions" value={workflow.decisionPoints} />
              <Meta label="When it goes wrong" value={workflow.errorCases} />
              <Meta label="Ends with" value={workflow.outcome} />
            </article>
          ))}
        </Section>

        <Section
          title="Information and systems"
          count={dataAndIntegrations.entities.length + dataAndIntegrations.integrations.length}
          emptyNote={
            dataAndIntegrations.dataNotApplicable || dataAndIntegrations.integrationsNotApplicable
              ? "Client confirmed none applies"
              : undefined
          }
        >
          {dataAndIntegrations.entities.map((entity, index) => (
            <article key={`${entity.name}-${index}`} className="pm-intake-brief__item">
              <strong>{entity.name || "Unnamed"}</strong>
              <Meta label="Holds" value={entity.fields} />
              <Meta label="Who can see it" value={entity.accessRules} />
            </article>
          ))}
          {dataAndIntegrations.integrations.map((integration, index) => (
            <article key={`${integration.name}-${index}`} className="pm-intake-brief__item">
              <strong>{integration.name || "Unnamed"}</strong>
              <Meta label="For" value={integration.purpose} />
              <Meta label="Owned by" value={integration.owner} />
            </article>
          ))}
        </Section>

        <Section
          title="Constraints and exclusions"
          count={
            experienceAndDelivery.securityRequirements.length +
            experienceAndDelivery.constraints.length +
            experienceAndDelivery.outOfScope.length +
            experienceAndDelivery.futurePhase.length +
            (experienceAndDelivery.designNotes ? 1 : 0)
          }
        >
          <dl className="pm-intake-brief__facts">
            <Fact label="Explicitly not included" value={experienceAndDelivery.outOfScope} wide />
            <Fact label="A later phase" value={experienceAndDelivery.futurePhase} wide />
            <Fact label="Security" value={experienceAndDelivery.securityRequirements} />
            <Fact label="Constraints" value={experienceAndDelivery.constraints} />
            <Fact label="Milestones" value={experienceAndDelivery.milestones} />
            <Fact label="Design notes" value={experienceAndDelivery.designNotes ?? ""} wide />
          </dl>
        </Section>

        <Section
          title="Documents"
          count={documents.length}
          emptyNote={experienceAndDelivery.documentsNotApplicable ? "Client confirmed they have none" : undefined}
        >
          <ul className="pm-intake-brief__docs">
            {documents.map((document) => (
              <li key={document.id}>
                <span>{document.title}</span>
                <Badge tone={document.extraction?.status === "READY" ? "green" : document.extraction?.status === "FAILED" ? "red" : "amber"}>
                  {document.extraction?.status === "READY"
                    ? "Readable"
                    : document.extraction?.status === "FAILED"
                      ? "Unreadable"
                      : "Processing"}
                </Badge>
              </li>
            ))}
          </ul>
        </Section>
      </Card>

      {/* Stated once, at the end, where a decision gets made. It used to appear twice — as an amber
          banner mid-form and again in the review rail — which made a short list look like a wall. */}
      {(readiness.blockers.length > 0 || suggestions.length > 0) && (
        <Card className="pm-tab-panel pm-tab-panel--padded" style={{ marginTop: 14 }}>
          {readiness.blockers.length > 0 && (
            <div className="pm-intake-brief__gaps" data-tone="blocking">
              <strong>Cannot be locked until these are answered</strong>
              <ul>{readiness.blockers.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="pm-intake-brief__gaps" data-tone="advisory" style={{ marginTop: readiness.blockers.length ? 14 : 0 }}>
              <strong>Thin, but you can lock over it</strong>
              <p>Your judgement — ask the client only if it matters for this build.</p>
              <ul>{suggestions.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/**
 * A section that costs one line when empty.
 *
 * The empty case is the common one on a fresh intake, and it is the whole reason this view exists:
 * eight unanswered sections should read as eight lines, not eight screens.
 */
function Section({
  title,
  count,
  emptyNote,
  children,
}: Readonly<{ title: string; count: number; emptyNote?: string; children: ReactNode }>) {
  return (
    <section className="pm-intake-brief__section">
      <h3>
        {title}
        {count > 0 && <span className="pm-intake-brief__count">{count}</span>}
      </h3>
      {count > 0 ? children : <p className="pm-intake-brief__empty">{emptyNote ?? "Not answered yet"}</p>}
    </section>
  );
}

/** One fact. Renders nothing but a muted dash when unanswered, so the eye skips it. */
function Fact({ label, value, wide }: Readonly<{ label: string; value: string | string[]; wide?: boolean }>) {
  const items = Array.isArray(value) ? value.filter((item) => item.trim()) : [];
  const text = Array.isArray(value) ? "" : value.trim();
  const answered = Array.isArray(value) ? items.length > 0 : Boolean(text);

  return (
    <div className={`pm-intake-brief__fact${wide ? " is-wide" : ""}`} data-answered={answered ? "true" : "false"}>
      <dt>{label}</dt>
      <dd>
        {!answered && "—"}
        {answered && !Array.isArray(value) && text}
        {answered && Array.isArray(value) && (
          items.length === 1 ? items[0] : <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
        )}
      </dd>
    </div>
  );
}

/** A labelled detail inside an item. Omitted entirely when empty — no dash, no row, no noise. */
function Meta({
  label,
  value,
  ordered,
}: Readonly<{ label: string; value: string | string[]; ordered?: boolean }>) {
  const items = Array.isArray(value) ? value.filter((item) => item.trim()) : [value].filter((item) => item.trim());
  if (!items.length) return null;

  return (
    <div className="pm-intake-brief__meta">
      <span>{label}</span>
      {items.length === 1 ? (
        <p>{items[0]}</p>
      ) : ordered ? (
        <ol>{items.map((item) => <li key={item}>{item}</li>)}</ol>
      ) : (
        <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      )}
    </div>
  );
}
