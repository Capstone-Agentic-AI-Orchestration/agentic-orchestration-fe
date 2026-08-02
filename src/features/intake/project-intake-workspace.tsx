"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/shared/components/ui";
import {
  type DevFlowClientIntakePayload,
  type DevFlowFeaturePriority,
  type DevFlowProjectIntakeResponse,
  downloadDevFlowProjectIntakeTemplate,
  getDevFlowProjectIntake,
  lockDevFlowProjectIntake,
  markDevFlowProjectIntakeReady,
  requestDevFlowProjectIntakeChanges,
  retryDevFlowProjectIntakeDocumentExtraction,
  saveDevFlowProjectIntakeDraft,
  submitDevFlowProjectIntake,
  uploadDevFlowProjectIntakeDocument,
} from "@/shared/api/devflow-api";
import { useSelectedDevFlowProject } from "@/shared/projects/selected-project-context";
import { PMProjectSubnav } from "@/features/pm/projects/components/pm-project-subnav";

type IntakeRole = "client" | "pm";
type IntakeStep = "overview" | "roles" | "features" | "workflows" | "data" | "delivery" | "documents" | "review";

const STEPS: Array<{ id: IntakeStep; label: string; why: string; example: string }> = [
  { id: "overview", label: "Project overview", why: "This anchors the business outcome and identifies who can make final decisions.", example: "Reduce manual appointment booking by 40% before the October launch." },
  { id: "roles", label: "Users and roles", why: "Permissions and responsibilities prevent us from building access that is too broad or too limited.", example: "Scheduler: creates and reschedules appointments; can edit only appointments for their branch." },
  { id: "features", label: "Scope and features", why: "A focused, testable feature list lets the PM lock a scope that can be built and verified.", example: "Customer booking: when a visitor selects a time, the system confirms it and emails the customer." },
  { id: "workflows", label: "Workflows", why: "Steps, decisions, and failures tell the team how the feature should behave in real situations.", example: "If the selected time is no longer available, show alternatives and do not create a booking." },
  { id: "data", label: "Data and integrations", why: "Knowing data ownership and external systems keeps privacy, access, and integration work visible.", example: "Appointment: customer name, service, time; staff can edit their branch only. Stripe is owned by Finance." },
  { id: "delivery", label: "Design, security, and delivery", why: "These constraints shape the right experience and make the delivery plan realistic.", example: "Must meet WCAG 2.1 AA, work on mobile, and be ready for user testing by 15 September." },
  { id: "documents", label: "Documents", why: "Source documents give the team evidence for requirements and help avoid guessing.", example: "Upload a current process map or brand guide. If none exist, explicitly mark that below." },
  { id: "review", label: "Final review", why: "A final check ensures the PM receives a complete, testable, scoped brief.", example: "Every must-have has acceptance criteria, every workflow has an outcome, and exclusions are named." },
];

function emptyPayload(): DevFlowClientIntakePayload {
  return {
    overview: { projectName: "", businessGoal: "", successMeasures: [], primaryContact: "", approver: "", targetLaunch: "" },
    roles: [{ name: "", responsibilities: [], permissions: [] }],
    features: [{ title: "", purpose: "", primaryRole: "", priority: "MUST_HAVE", workflow: "", businessRules: [], acceptanceCriteria: [] }],
    workflows: [{ title: "", startCondition: "", actor: "", steps: [], decisionPoints: [], errorCases: [], outcome: "" }],
    dataAndIntegrations: { entities: [], integrations: [], dataNotApplicable: false, integrationsNotApplicable: false },
    experienceAndDelivery: { designNotes: "", securityRequirements: [], constraints: [], milestones: [], outOfScope: [], futurePhase: [], documentsNotApplicable: false },
  };
}

const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const lineValue = (items: string[]) => items.join("\n");

function statusTone(status: string) {
  if (status === "LOCKED") return "green";
  if (status === "READY") return "blue";
  if (status === "CHANGES_REQUESTED") return "amber";
  if (status === "SUBMITTED") return "purple";
  return "gray";
}

type ExtractionStatus = "PENDING" | "EXTRACTING" | "READY" | "FAILED" | undefined;

function extractionTone(status: ExtractionStatus) {
  if (status === "READY") return "green";
  if (status === "FAILED") return "red";
  return "amber";
}

/**
 * Raw enum names read as internal jargon in the UI. Only a READY document contributes text to
 * the agent context package, so the label says what the status actually means for the build.
 */
function extractionLabel(status: ExtractionStatus) {
  if (status === "READY") return "Text extracted";
  if (status === "FAILED") return "Extraction failed";
  if (status === "EXTRACTING") return "Extracting";
  return "Queued";
}

function SectionGuide({ step }: { step: (typeof STEPS)[number] }) {
  return (
    <Card glass style={{ padding: 18, borderLeft: "3px solid var(--blue, #6EA8FF)", marginBottom: 18 }}>
      <div style={{ fontWeight: 700, marginBottom: 5 }}>Why we need this</div>
      <div style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.55 }}>{step.why}</div>
      <div style={{ marginTop: 10, color: "var(--text-3)", fontSize: 12.5 }}><strong style={{ color: "var(--text-2)" }}>Good answer:</strong> {step.example}</div>
    </Card>
  );
}

function ListField({ label, helper, values, onChange, disabled }: { label: string; helper: string; values: string[]; onChange: (items: string[]) => void; disabled: boolean }) {
  return (
    <Field label={label} helper={helper}>
      <Textarea disabled={disabled} value={lineValue(values)} onChange={(event) => onChange(lines(event.target.value))} rows={3} placeholder="One clear item per line" />
    </Field>
  );
}

function CommentList({ comments, section }: { comments: DevFlowProjectIntakeResponse["intake"]["comments"]; section?: string }) {
  const visible = comments.filter((comment) => !section || comment.section === section);
  if (!visible.length) return null;
  return (
    <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
      {visible.map((comment) => (
        <div key={comment.id} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(245, 158, 11, .09)", border: "1px solid rgba(245, 158, 11, .25)", fontSize: 13 }}>
          <strong>PM request — {comment.section}:</strong> {comment.message}
        </div>
      ))}
    </div>
  );
}

function PMReviewPanel({ projectId, response, onResult }: { projectId: string; response: DevFlowProjectIntakeResponse; onResult: (next: DevFlowProjectIntakeResponse) => void }) {
  const [notes, setNotes] = useState(response.intake.reviewNote ?? "");
  const [section, setSection] = useState<IntakeStep>("overview");
  const [changeMessage, setChangeMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (action: () => Promise<DevFlowProjectIntakeResponse>) => {
    setBusy(true); setError("");
    try { onResult(await action()); }
    catch (nextError) { setError(nextError instanceof Error ? nextError.message : String(nextError)); }
    finally { setBusy(false); }
  };

  return (
    <Card glass style={{ padding: 20, height: "fit-content" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ fontWeight: 750 }}>PM review</div>
        <Badge tone={statusTone(response.intake.status)}>{response.intake.status.replaceAll("_", " ")}</Badge>
      </div>
      <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5 }}>Lock only after the checklist is complete. A locked snapshot is the exact context used by orchestration.</p>
      {response.readiness.blockers.length > 0 && (
        <div style={{ color: "#FBBF24", fontSize: 12.5, lineHeight: 1.45, marginBottom: 14 }}>
          {response.readiness.blockers.map((blocker) => <div key={blocker}>• {blocker}</div>)}
        </div>
      )}
      <Field label="PM notes" helper="Record approval reasoning, scope decisions, or assumptions for the agents.">
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
      </Field>
      <div style={{ borderTop: "1px solid var(--border, rgba(255,255,255,.12))", marginTop: 14, paddingTop: 14 }}>
        <Field label="Request a focused change" helper="The client sees this request beside the selected intake section.">
          <Select value={section} onChange={(event) => setSection(event.target.value as IntakeStep)}>
            {STEPS.map((step) => <option key={step.id} value={step.id}>{step.label}</option>)}
          </Select>
        </Field>
        <Textarea value={changeMessage} onChange={(event) => setChangeMessage(event.target.value)} rows={3} placeholder="Describe what the client should add or clarify, and why." />
        <Button
          variant="secondary"
          style={{ marginTop: 10, width: "100%" }}
          disabled={busy || !changeMessage.trim() || !["SUBMITTED", "READY"].includes(response.intake.status)}
          onClick={() => run(async () => {
            const result = await requestDevFlowProjectIntakeChanges(projectId, { section, message: changeMessage.trim() });
            setChangeMessage("");
            return result;
          })}
        >Request changes</Button>
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        <Button disabled={busy || response.intake.status !== "SUBMITTED" || !response.readiness.readyForSubmission} onClick={() => run(() => markDevFlowProjectIntakeReady(projectId, notes))}>Approve readiness</Button>
        <Button variant="secondary" disabled={busy || response.intake.status !== "READY" || !response.readiness.readyForLock} onClick={() => run(() => lockDevFlowProjectIntake(projectId, notes))}>Lock intake version</Button>
      </div>
      {error && <div className="field-error" style={{ marginTop: 12 }}>{error}</div>}
    </Card>
  );
}

export function ProjectIntakeWorkspace({ projectId, role }: { projectId: string; role: IntakeRole }) {
  const [response, setResponse] = useState<DevFlowProjectIntakeResponse | null>(null);
  const [payload, setPayload] = useState<DevFlowClientIntakePayload>(emptyPayload);
  const [stepId, setStepId] = useState<IntakeStep>("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);

  const updateResponse = (next: DevFlowProjectIntakeResponse) => {
    setResponse((current) => ({
      intake: next.intake,
      documents: next.documents ?? current?.documents ?? [],
      readiness: next.readiness,
      templateMarkdown: next.templateMarkdown ?? current?.templateMarkdown,
    }));
    setPayload(next.intake.payload);
    setDirty(false);
  };

  const refresh = async () => {
    setLoading(true); setError("");
    try { updateResponse(await getDevFlowProjectIntake(projectId)); }
    catch (nextError) { setError(nextError instanceof Error ? nextError.message : String(nextError)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, [projectId]);

  // The intake payload stays client-owned: a PM must never silently rewrite what the client
  // stated they want. Uploading a file the client sent is a different act from authoring their
  // requirements, so the two permissions are deliberately separate rather than one `editable`.
  const editable = role === "client" && !!response && ["DRAFT", "CHANGES_REQUESTED"].includes(response.intake.status);
  // Clients attach files while their intake is open; PMs attach on the client's behalf at any
  // point, because documents often arrive by email after the intake has already been submitted.
  const canUploadDocuments = !!response && (editable || role === "pm");
  // A document added after lock is stored, but the locked snapshot the agents read is frozen,
  // so it cannot influence orchestration until a new intake version is locked.
  const uploadsBypassLockedSnapshot = role === "pm" && response?.intake.status === "LOCKED";
  const updatePayload = (next: DevFlowClientIntakePayload) => { setPayload(next); setDirty(true); };
  const save = async () => {
    if (!editable && response?.intake.status !== "LOCKED") return;
    setSaving(true); setError("");
    try { updateResponse(await saveDevFlowProjectIntakeDraft(projectId, payload)); }
    catch (nextError) { setError(nextError instanceof Error ? nextError.message : String(nextError)); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    if (!dirty || !editable) return;
    const timer = window.setTimeout(() => { void save(); }, 900);
    return () => window.clearTimeout(timer);
  }, [dirty, editable, payload]);

  const current = STEPS.find((step) => step.id === stepId) ?? STEPS[0];
  const docs = response?.documents ?? [];
  const setOverview = (key: keyof DevFlowClientIntakePayload["overview"], value: string | string[]) => updatePayload({ ...payload, overview: { ...payload.overview, [key]: value } });
  const setDelivery = (key: keyof DevFlowClientIntakePayload["experienceAndDelivery"], value: unknown) => updatePayload({ ...payload, experienceAndDelivery: { ...payload.experienceAndDelivery, [key]: value } });

  const upload = async (file: File | null) => {
    if (!file) return;
    setUploading(true); setError(""); setUploadNotice("");
    try {
      const result = await uploadDevFlowProjectIntakeDocument(projectId, file, {
        kind: "REQUIREMENT",
        // A client-uploaded file is already theirs; a PM uploading on their behalf must opt in
        // so the client sees the file listed back and knows it arrived.
        clientVisible: true,
        description: role === "pm" ? "Uploaded by the project manager on behalf of the client." : undefined,
      });
      setUploadNotice(
        result.duplicate
          ? `"${result.document.title}" is already attached to this project, so it was not added again.`
          : `"${result.document.title}" uploaded. Text extraction runs automatically.`,
      );
      await refresh();
      // Extraction is asynchronous, so re-read shortly after to pick up the terminal status.
      window.setTimeout(() => void refresh(), 1500);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : String(nextError)); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    setSaving(true); setError("");
    try { updateResponse(await submitDevFlowProjectIntake(projectId)); setStepId("review"); }
    catch (nextError) { setError(nextError instanceof Error ? nextError.message : String(nextError)); }
    finally { setSaving(false); }
  };

  const progress = useMemo(() => `${STEPS.findIndex((step) => step.id === stepId) + 1} of ${STEPS.length}`, [stepId]);
  if (loading && !response) return <Card style={{ padding: 28, color: "var(--text-2)" }}>Loading project intake…</Card>;
  if (!response) return <Card style={{ padding: 28 }}><div className="field-error">{error || "The project intake is unavailable."}</div><Button style={{ marginTop: 14 }} onClick={() => void refresh()}>Try again</Button></Card>;

  const roleFields = payload.roles.map((roleItem, index) => (
    <Card key={index} style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}><strong>User role {index + 1}</strong>{payload.roles.length > 1 && editable && <Button variant="ghost" size="sm" onClick={() => updatePayload({ ...payload, roles: payload.roles.filter((_, itemIndex) => itemIndex !== index) })}>Remove</Button>}</div>
      <Field label="Role name" helper="Name a real user group, not an internal feature."><Input disabled={!editable} value={roleItem.name} onChange={(event) => updatePayload({ ...payload, roles: payload.roles.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} placeholder="e.g. Branch scheduler" /></Field>
      <ListField disabled={!editable} label="Responsibilities" helper="One responsibility per line." values={roleItem.responsibilities} onChange={(responsibilities) => updatePayload({ ...payload, roles: payload.roles.map((item, itemIndex) => itemIndex === index ? { ...item, responsibilities } : item) })} />
      <ListField disabled={!editable} label="Permissions" helper="State what this role can view or edit." values={roleItem.permissions} onChange={(permissions) => updatePayload({ ...payload, roles: payload.roles.map((item, itemIndex) => itemIndex === index ? { ...item, permissions } : item) })} />
    </Card>
  ));

  const featureFields = payload.features.map((feature, index) => (
    <Card key={index} style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}><strong>Feature {index + 1}</strong>{payload.features.length > 1 && editable && <Button variant="ghost" size="sm" onClick={() => updatePayload({ ...payload, features: payload.features.filter((_, itemIndex) => itemIndex !== index) })}>Remove</Button>}</div>
      <Field label="Feature title"><Input disabled={!editable} value={feature.title} onChange={(event) => updatePayload({ ...payload, features: payload.features.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} placeholder="e.g. Online appointment booking" /></Field>
      <Field label="Priority" helper="A Must-have is essential for the first release."><Select disabled={!editable} value={feature.priority} onChange={(event) => updatePayload({ ...payload, features: payload.features.map((item, itemIndex) => itemIndex === index ? { ...item, priority: event.target.value as DevFlowFeaturePriority } : item) })}><option value="MUST_HAVE">Must-have</option><option value="SHOULD_HAVE">Should-have</option><option value="NICE_TO_HAVE">Nice-to-have</option></Select></Field>
      <Field label="Purpose" helper="Connect it to a user or business outcome."><Textarea disabled={!editable} value={feature.purpose} onChange={(event) => updatePayload({ ...payload, features: payload.features.map((item, itemIndex) => itemIndex === index ? { ...item, purpose: event.target.value } : item) })} rows={2} /></Field>
      <Field label="Primary user"><Input disabled={!editable} value={feature.primaryRole} onChange={(event) => updatePayload({ ...payload, features: payload.features.map((item, itemIndex) => itemIndex === index ? { ...item, primaryRole: event.target.value } : item) })} placeholder="Choose one role from the previous section" /></Field>
      <Field label="Trigger and workflow" helper="What starts this and what happens next?"><Textarea disabled={!editable} value={feature.workflow} onChange={(event) => updatePayload({ ...payload, features: payload.features.map((item, itemIndex) => itemIndex === index ? { ...item, workflow: event.target.value } : item) })} rows={3} /></Field>
      <ListField disabled={!editable} label="Business rules" helper="One rule per line, e.g. a booking cannot overlap. Write “None” if no special rule applies." values={feature.businessRules} onChange={(businessRules) => updatePayload({ ...payload, features: payload.features.map((item, itemIndex) => itemIndex === index ? { ...item, businessRules } : item) })} />
      <ListField disabled={!editable} label="Testable acceptance criteria" helper="Use observable outcomes: Given/when/then is ideal." values={feature.acceptanceCriteria} onChange={(acceptanceCriteria) => updatePayload({ ...payload, features: payload.features.map((item, itemIndex) => itemIndex === index ? { ...item, acceptanceCriteria } : item) })} />
    </Card>
  ));

  const workflowFields = payload.workflows.map((workflow, index) => (
    <Card key={index} style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}><strong>Workflow {index + 1}</strong>{payload.workflows.length > 1 && editable && <Button variant="ghost" size="sm" onClick={() => updatePayload({ ...payload, workflows: payload.workflows.filter((_, itemIndex) => itemIndex !== index) })}>Remove</Button>}</div>
      <Field label="Workflow title"><Input disabled={!editable} value={workflow.title} onChange={(event) => updatePayload({ ...payload, workflows: payload.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} /></Field>
      <Field label="Starting condition"><Input disabled={!editable} value={workflow.startCondition} onChange={(event) => updatePayload({ ...payload, workflows: payload.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, startCondition: event.target.value } : item) })} placeholder="What must be true before this begins?" /></Field>
      <Field label="Actor"><Input disabled={!editable} value={workflow.actor} onChange={(event) => updatePayload({ ...payload, workflows: payload.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, actor: event.target.value } : item) })} /></Field>
      <ListField disabled={!editable} label="Steps" helper="One ordered step per line." values={workflow.steps} onChange={(steps) => updatePayload({ ...payload, workflows: payload.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, steps } : item) })} />
      <ListField disabled={!editable} label="Decision points" helper="Include choices or approvals that change the path. Write “None” if no decision applies." values={workflow.decisionPoints} onChange={(decisionPoints) => updatePayload({ ...payload, workflows: payload.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, decisionPoints } : item) })} />
      <ListField disabled={!editable} label="Error cases" helper="What should the user see or do when something fails? Write “None” if no error case applies." values={workflow.errorCases} onChange={(errorCases) => updatePayload({ ...payload, workflows: payload.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, errorCases } : item) })} />
      <Field label="Final outcome"><Input disabled={!editable} value={workflow.outcome} onChange={(event) => updatePayload({ ...payload, workflows: payload.workflows.map((item, itemIndex) => itemIndex === index ? { ...item, outcome: event.target.value } : item) })} /></Field>
    </Card>
  ));

  let body: React.ReactNode;
  if (stepId === "overview") body = <>
    <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
      <Field label="Project name" helper="Use the name your team will recognize."><Input disabled={!editable} value={payload.overview.projectName} onChange={(event) => setOverview("projectName", event.target.value)} /></Field>
      <Field label="Desired launch period" helper="A month, quarter, or fixed date is fine."><Input disabled={!editable} value={payload.overview.targetLaunch} onChange={(event) => setOverview("targetLaunch", event.target.value)} placeholder="e.g. October 2026" /></Field>
      <Field label="Primary contact"><Input disabled={!editable} value={payload.overview.primaryContact} onChange={(event) => setOverview("primaryContact", event.target.value)} /></Field>
      <Field label="Final approver" helper="The person who can accept scope decisions."><Input disabled={!editable} value={payload.overview.approver} onChange={(event) => setOverview("approver", event.target.value)} /></Field>
    </div>
    <Field label="Business goal" error={!payload.overview.businessGoal.trim() && dirty ? "Explain the outcome you need, not only the screen or technology." : undefined}><Textarea disabled={!editable} value={payload.overview.businessGoal} onChange={(event) => setOverview("businessGoal", event.target.value)} rows={4} placeholder="What problem are we solving and what changes when the project succeeds?" /></Field>
    <ListField disabled={!editable} label="Measurable success criteria" helper="One measure per line. Make each measurable by a person, a time, or a number." values={payload.overview.successMeasures} onChange={(successMeasures) => setOverview("successMeasures", successMeasures)} />
  </>;
  else if (stepId === "roles") body = <>{roleFields}{editable && <Button variant="secondary" onClick={() => updatePayload({ ...payload, roles: [...payload.roles, { name: "", responsibilities: [], permissions: [] }] })}>Add user role</Button>}</>;
  else if (stepId === "features") body = <>{featureFields}{editable && <Button variant="secondary" onClick={() => updatePayload({ ...payload, features: [...payload.features, { title: "", purpose: "", primaryRole: "", priority: "SHOULD_HAVE", workflow: "", businessRules: [], acceptanceCriteria: [] }] })}>Add feature</Button>}</>;
  else if (stepId === "workflows") body = <>{workflowFields}{editable && <Button variant="secondary" onClick={() => updatePayload({ ...payload, workflows: [...payload.workflows, { title: "", startCondition: "", actor: "", steps: [], decisionPoints: [], errorCases: [], outcome: "" }] })}>Add workflow</Button>}</>;
  else if (stepId === "data") body = <>
    <Card style={{ padding: 16, marginBottom: 12 }}><strong>Data entities</strong><p style={{ color: "var(--text-2)", fontSize: 13 }}>List the important data the system will store or use.</p>
      {payload.dataAndIntegrations.entities.map((entity, index) => <div key={index} style={{ borderTop: index ? "1px solid var(--border, rgba(255,255,255,.1))" : undefined, marginTop: index ? 12 : 0, paddingTop: index ? 12 : 0 }}><Field label="Entity name"><Input disabled={!editable} value={entity.name} onChange={(event) => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, dataNotApplicable: false, entities: payload.dataAndIntegrations.entities.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) } })} placeholder="e.g. Appointment" /></Field><ListField disabled={!editable} label="Important fields" helper="One field per line." values={entity.fields} onChange={(fields) => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, entities: payload.dataAndIntegrations.entities.map((item, itemIndex) => itemIndex === index ? { ...item, fields } : item) } })} /><ListField disabled={!editable} label="Access rules" helper="Who owns it and who can view or edit it?" values={entity.accessRules} onChange={(accessRules) => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, entities: payload.dataAndIntegrations.entities.map((item, itemIndex) => itemIndex === index ? { ...item, accessRules } : item) } })} />{editable && <Button variant="ghost" size="sm" onClick={() => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, entities: payload.dataAndIntegrations.entities.filter((_, itemIndex) => itemIndex !== index) } })}>Remove entity</Button>}</div>)}
      {editable && <><Button variant="secondary" size="sm" onClick={() => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, dataNotApplicable: false, entities: [...payload.dataAndIntegrations.entities, { name: "", fields: [], accessRules: [] }] } })}>Add data entity</Button><label style={{ display: "block", marginTop: 12, color: "var(--text-2)", fontSize: 13 }}><input type="checkbox" checked={!!payload.dataAndIntegrations.dataNotApplicable} onChange={(event) => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, dataNotApplicable: event.target.checked, entities: event.target.checked ? [] : payload.dataAndIntegrations.entities } })} /> No project data entities apply</label></>}
    </Card>
    <Card style={{ padding: 16 }}><strong>Integrations and APIs</strong><p style={{ color: "var(--text-2)", fontSize: 13 }}>Name external services, what is exchanged, and the client owner.</p>{payload.dataAndIntegrations.integrations.map((integration, index) => <div key={index} style={{ marginTop: 10 }}><Field label="Integration name"><Input disabled={!editable} value={integration.name} onChange={(event) => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, integrationsNotApplicable: false, integrations: payload.dataAndIntegrations.integrations.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) } })} /></Field><Field label="Purpose / data exchanged"><Textarea disabled={!editable} value={integration.purpose} onChange={(event) => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, integrations: payload.dataAndIntegrations.integrations.map((item, itemIndex) => itemIndex === index ? { ...item, purpose: event.target.value } : item) } })} rows={2} /></Field><Field label="Responsible client owner"><Input disabled={!editable} value={integration.owner} onChange={(event) => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, integrations: payload.dataAndIntegrations.integrations.map((item, itemIndex) => itemIndex === index ? { ...item, owner: event.target.value } : item) } })} /></Field>{editable && <Button variant="ghost" size="sm" onClick={() => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, integrations: payload.dataAndIntegrations.integrations.filter((_, itemIndex) => itemIndex !== index) } })}>Remove integration</Button>}</div>)}{editable && <><Button variant="secondary" size="sm" onClick={() => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, integrationsNotApplicable: false, integrations: [...payload.dataAndIntegrations.integrations, { name: "", purpose: "", owner: "" }] } })}>Add integration</Button><label style={{ display: "block", marginTop: 12, color: "var(--text-2)", fontSize: 13 }}><input type="checkbox" checked={!!payload.dataAndIntegrations.integrationsNotApplicable} onChange={(event) => updatePayload({ ...payload, dataAndIntegrations: { ...payload.dataAndIntegrations, integrationsNotApplicable: event.target.checked, integrations: event.target.checked ? [] : payload.dataAndIntegrations.integrations } })} /> No integrations apply</label></>}</Card>
  </>;
  else if (stepId === "delivery") body = <>
    <Field label="Design, brand, device, accessibility, and content notes" helper="Include brand assets, preferred devices, content owner, and accessibility expectations."><Textarea disabled={!editable} value={payload.experienceAndDelivery.designNotes ?? ""} onChange={(event) => setDelivery("designNotes", event.target.value)} rows={4} /></Field>
    <ListField disabled={!editable} label="Security, privacy, compliance, availability, and performance" helper="One expectation per line. Do not share credentials or personal data." values={payload.experienceAndDelivery.securityRequirements} onChange={(securityRequirements) => setDelivery("securityRequirements", securityRequirements)} />
    <ListField disabled={!editable} label="Constraints and client dependencies" helper="Include dependencies the client must provide or approve." values={payload.experienceAndDelivery.constraints} onChange={(constraints) => setDelivery("constraints", constraints)} />
    <ListField disabled={!editable} label="Timeline and milestones" helper="Include target dates and client responsibilities." values={payload.experienceAndDelivery.milestones} onChange={(milestones) => setDelivery("milestones", milestones)} />
    <ListField disabled={!editable} label="Out of scope" helper="Name items that are explicitly excluded from this release." values={payload.experienceAndDelivery.outOfScope} onChange={(outOfScope) => setDelivery("outOfScope", outOfScope)} />
    <ListField disabled={!editable} label="Future phase" helper="Name valuable work that should not delay this first release." values={payload.experienceAndDelivery.futurePhase} onChange={(futurePhase) => setDelivery("futurePhase", futurePhase)} />
  </>;
  else if (stepId === "documents") body = (
    <div className="intake-documents-step">
      <Card style={{ padding: 16, borderColor: "rgba(245, 158, 11, .35)" }}>
        <strong>Confidentiality notice</strong>
        <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.5, margin: "6px 0 0" }}>
          Do not upload passwords, API keys, production credentials, private keys, or unnecessary
          personal data. Supported: PDF, DOCX, XLSX, TXT, PNG, JPG, JPEG. Maximum 25 MB per file,
          and 100 MB across at most 20 files per project.
        </p>
      </Card>

      {canUploadDocuments ? (
        <Card style={{ padding: 18 }}>
          <Field
            label={role === "pm" ? "Upload a document on the client's behalf" : "Upload a supporting document"}
            helper={
              role === "pm"
                ? "Attach files the client sent you. They are marked client-visible so the client can confirm receipt, and text extraction runs automatically."
                : "Upload process maps, examples, brand material, or existing requirements. Text extraction runs automatically."
            }
          >
            <Input
              type="file"
              accept=".pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg"
              disabled={uploading}
              onChange={(event) => {
                void upload(event.target.files?.[0] ?? null);
                // Clear the input so re-selecting the same file after a failure still fires onChange.
                event.target.value = "";
              }}
            />
          </Field>
          {uploading && <div style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 10 }}>Uploading and queueing extraction…</div>}
          {uploadNotice && <div style={{ color: "#6EE7B7", fontSize: 12.5, marginTop: 10 }}>{uploadNotice}</div>}
          {uploadsBypassLockedSnapshot && (
            <div style={{ color: "#FCD34D", fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>
              This intake is locked. The file will be stored on the project, but the agents read a
              frozen snapshot — lock a new intake version to include it in orchestration.
            </div>
          )}
        </Card>
      ) : (
        <Card style={{ padding: 18, color: "var(--text-2)", fontSize: 13, lineHeight: 1.55 }}>
          Uploads are closed while the intake is {response.intake.status.replaceAll("_", " ").toLowerCase()}.
          Ask your project manager to request changes if you need to attach another file.
        </Card>
      )}

      <label className="intake-na-toggle">
        <input
          disabled={!editable}
          type="checkbox"
          checked={!!payload.experienceAndDelivery.documentsNotApplicable}
          onChange={(event) => setDelivery("documentsNotApplicable", event.target.checked)}
        />
        <span>No supporting documents apply to this project</span>
      </label>

      <div className="intake-documents-list">
        {docs.length ? (
          docs.map((document) => (
            <Card key={document.id} style={{ padding: 16 }}>
              <div className="intake-document-row">
                <div className="intake-document-main">
                  <strong>{document.title}</strong>
                  <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 3 }}>
                    {[document.fileName, document.sizeBytes ? `${Math.ceil(document.sizeBytes / 1024)} KB` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {document.extraction?.error && (
                    <div className="field-error" style={{ marginTop: 6 }}>{document.extraction.error}</div>
                  )}
                </div>
                <Badge tone={extractionTone(document.extraction?.status)}>
                  {extractionLabel(document.extraction?.status)}
                </Badge>
              </div>
              {document.extraction?.status === "FAILED" && role !== "client" && (
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: 12 }}
                  onClick={async () => {
                    await retryDevFlowProjectIntakeDocumentExtraction(projectId, document.id);
                    await refresh();
                  }}
                >
                  Retry extraction
                </Button>
              )}
            </Card>
          ))
        ) : (
          <Card style={{ padding: 20, color: "var(--text-2)", fontSize: 13 }}>
            No files uploaded yet. If the project genuinely has no supporting documents, tick the
            box above so the intake can be submitted.
          </Card>
        )}
      </div>
    </div>
  );
  else body = <>
    <Card style={{ padding: 18, marginBottom: 14 }}><strong>Submission checks</strong><p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 0 }}>Requirements should be specific, testable, scoped, and linked to a user or business outcome. The PM can request targeted changes before locking.</p></Card>
    <Card style={{ padding: 18, marginBottom: 14 }}><strong>Generated summary</strong><div style={{ display: "grid", gap: 8, color: "var(--text-2)", fontSize: 13, marginTop: 10 }}><div><strong>Business goal:</strong> {payload.overview.businessGoal || "Not yet provided"}</div><div><strong>Roles:</strong> {payload.roles.map((item) => item.name).filter(Boolean).join(", ") || "Not yet provided"}</div><div><strong>Must-haves:</strong> {payload.features.filter((item) => item.priority === "MUST_HAVE").map((item) => item.title).filter(Boolean).join(", ") || "Not yet provided"}</div><div><strong>Workflows:</strong> {payload.workflows.map((item) => item.title).filter(Boolean).join(", ") || "Not yet provided"}</div><div><strong>Out of scope:</strong> {payload.experienceAndDelivery.outOfScope.join(", ") || "None recorded"}</div></div></Card>
    {response.readiness.blockers.length ? <Card style={{ padding: 18, borderColor: "rgba(245,158,11,.38)" }}><strong>Complete these before submission</strong><ul style={{ color: "#FCD34D", marginBottom: 0 }}>{response.readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></Card> : <Card style={{ padding: 18, borderColor: "rgba(16,185,129,.38)" }}><strong style={{ color: "#6EE7B7" }}>Ready for PM review</strong><p style={{ color: "var(--text-2)", marginBottom: 0 }}>Confirm that the information is accurate, then submit it to your PM.</p></Card>}
    {role === "client" && <label style={{ display: "block", marginTop: 14, fontSize: 13, color: "var(--text-2)" }}><input type="checkbox" disabled={!editable} checked={confirmedAccurate} onChange={(event) => setConfirmedAccurate(event.target.checked)} /> I confirm the summary and supporting information are accurate.</label>}
    <CommentList comments={response.intake.comments} />
  </>;

  const intakeContent = <div className="pm-intake-workspace" style={{ display: "grid", gap: 18 }}>
    <Card glass style={{ padding: 20 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap" }}><div><div style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Client requirements intake · {progress}</div><h1 style={{ fontSize: 24, margin: "5px 0 4px" }}>{payload.overview.projectName || "Project intake"}</h1><div style={{ color: "var(--text-2)", fontSize: 13 }}>Autosaves while you work. Locked versions are read-only and used as agent evidence.</div></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><Badge tone={statusTone(response.intake.status)}>{response.intake.status.replaceAll("_", " ")}</Badge>{dirty && <span style={{ color: "var(--text-3)", fontSize: 12 }}>Saving…</span>}</div></div></Card>
    <div style={{ display: "grid", gridTemplateColumns: role === "pm" ? "minmax(0, 1fr) 330px" : "minmax(190px, 240px) minmax(0, 1fr)", gap: 18, alignItems: "start" }} className="intake-workspace-grid">
      {role === "client" && <Card glass style={{ padding: 10, position: "sticky", top: 16 }}>{STEPS.map((step) => <button type="button" key={step.id} onClick={() => setStepId(step.id)} style={{ display: "block", width: "100%", textAlign: "left", border: 0, borderRadius: 8, padding: "10px 11px", marginBottom: 3, background: step.id === stepId ? "rgba(74, 112, 255, .18)" : "transparent", color: step.id === stepId ? "white" : "var(--text-2)", cursor: "pointer", fontWeight: step.id === stepId ? 650 : 500 }}>{STEPS.findIndex((item) => item.id === step.id) + 1}. {step.label}</button>)}</Card>}
      <Card style={{ padding: 22 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}><div><h2 style={{ fontSize: 18, margin: 0 }}>{current.label}</h2><div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Clear answers reduce rework and make the scope easier to approve.</div></div>{role === "client" && <Button variant="ghost" size="sm" disabled={!editable || saving} onClick={() => void save()}>Save now</Button>}</div>{role === "pm" && <div className="pm-intake-step-tabs">{STEPS.map((step) => <Button key={step.id} size="sm" variant={step.id === stepId ? "primary" : "ghost"} onClick={() => setStepId(step.id)}>{step.label}</Button>)}</div>}<SectionGuide step={current} /><CommentList comments={response.intake.comments} section={stepId} />{body}{error && <div className="field-error" style={{ marginTop: 14 }}>{error}</div>}<div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--border, rgba(255,255,255,.12))" }}><div style={{ display: "flex", gap: 8 }}>{STEPS.findIndex((step) => step.id === stepId) > 0 && <Button variant="ghost" onClick={() => setStepId(STEPS[STEPS.findIndex((step) => step.id === stepId) - 1].id)}>Back</Button>}{role === "client" && response.intake.status === "LOCKED" && <Button onClick={() => void save()}>Start a new intake version</Button>}</div>{stepId !== "review" ? <Button onClick={() => setStepId(STEPS[Math.min(STEPS.length - 1, STEPS.findIndex((step) => step.id === stepId) + 1)].id)}>Continue</Button> : role === "client" && <Button disabled={!editable || saving || !response.readiness.readyForSubmission || !confirmedAccurate} onClick={() => void submit()}>Confirm accuracy and submit to PM</Button>}</div>{stepId === "documents" && (
        <div className="intake-worksheet-downloads">
          <div className="intake-worksheet-copy">
            <strong>Prefer to draft this offline?</strong>
            <span>
              Download the requirements worksheet, fill it in with your team, then copy your
              answers into this form. The form is what your delivery team works from.
            </span>
          </div>
          <div className="intake-worksheet-actions">
            <Button variant="ghost" size="sm" onClick={() => void downloadDevFlowProjectIntakeTemplate(projectId, "printable")}>
              Printable worksheet
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void downloadDevFlowProjectIntakeTemplate(projectId, "markdown")}>
              Markdown worksheet
            </Button>
          </div>
        </div>
      )}</Card>
      {role === "pm" && <PMReviewPanel projectId={projectId} response={response} onResult={updateResponse} />}
    </div>
  </div>;

  if (role !== "pm") return intakeContent;

  return (
    <div className="pm-project-workspace" data-screen-label={`PM - Project Intake - ${projectId}`}>
      <PMProjectSubnav
        projectId={projectId}
        projectName={payload.overview.projectName || "Project intake"}
        activeItem="intake"
      />
      <section className="pm-project-workspace-content pm-project-intake-content">
        {intakeContent}
      </section>
    </div>
  );
}

export function ClientProjectIntakeView() {
  const { selectedProjectId, selectedProjectLoading } = useSelectedDevFlowProject();
  if (selectedProjectLoading) return <Card style={{ padding: 28, color: "var(--text-2)" }}>Loading your project…</Card>;
  if (!selectedProjectId) return <Card style={{ padding: 28, color: "var(--text-2)" }}>Select a project to complete its requirements intake.</Card>;
  return <ProjectIntakeWorkspace projectId={selectedProjectId} role="client" />;
}
