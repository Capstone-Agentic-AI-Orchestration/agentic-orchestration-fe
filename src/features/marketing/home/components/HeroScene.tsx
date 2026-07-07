"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./HeroScene.css";

type AgentType = "ceo" | "cto" | "developer" | "tester" | "ship";
type LogType = "system" | "ceo" | "cto" | "developer" | "tester" | "success";

interface LogLine {
  text: string;
  type: LogType;
}

interface WorkflowStep {
  agent: AgentType;
  title: string;
  phase: string;
  file: string;
  status: string;
  metric: string;
  code: string;
  logs: LogLine[];
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    agent: "ceo",
    title: "Ingest & Plan",
    phase: "planning",
    file: "brief.md",
    status: "planning",
    metric: "4 agents queued",
    code: `# brief.md\n\n- Add authentication with Supabase\n- Wire Stripe billing portal\n- Build real-time ticket manager\n- Deploy preview on Vercel\n- Deliver clean PR to GitHub`,
    logs: [
      { text: "$ devflow run --brief brief.md", type: "system" },
      { text: "[system] Agent plane online. Opening run context.", type: "system" },
      { text: "[planner.agent] Requirements grouped into 5 work orders.", type: "ceo" },
      { text: "[planner.agent] Build plan ready for parallel execution.", type: "success" },
    ],
  },
  {
    agent: "cto",
    title: "Architect Schemas",
    phase: "modeling",
    file: "prisma/schema.prisma",
    status: "writing",
    metric: "schema locked",
    code: `model Project {\n  id        String   @id @default(uuid())\n  name      String\n  status    String\n  tickets   Ticket[]\n  createdAt DateTime @default(now())\n}\n\nmodel Ticket {\n  id        String @id @default(uuid())\n  projectId String\n  project   Project @relation(fields: [projectId], references: [id])\n}`,
    logs: [
      { text: "[architect.agent] Drafting relational model.", type: "cto" },
      { text: "[database.agent] Checking migration impact.", type: "cto" },
      { text: "[architect.agent] Auth and billing boundaries mapped.", type: "cto" },
      { text: "[database.agent] Prisma schema emitted.", type: "success" },
    ],
  },
  {
    agent: "developer",
    title: "Write Code",
    phase: "building",
    file: "src/api/projects.ts",
    status: "writing",
    metric: "12 files touched",
    code: `export async function POST(req: Request) {\n  const body = await req.json();\n  const project = await prisma.project.create({\n    data: {\n      name: body.name,\n      status: "active",\n      ownerId: session.user.id\n    }\n  });\n\n  return NextResponse.json(project);\n}`,
    logs: [
      { text: "[frontend.agent] Generating workspace screens.", type: "developer" },
      { text: "[backend.agent] Creating project route handlers.", type: "developer" },
      { text: "[contract.agent] Syncing request and response types.", type: "developer" },
      { text: "[developer.agent] Implementation patch assembled.", type: "success" },
    ],
  },
  {
    agent: "tester",
    title: "Verify Quality",
    phase: "testing",
    file: "npm run typecheck",
    status: "testing",
    metric: "0 type errors",
    code: `$ npm run typecheck\n\nsrc/api/projects.ts      0 errors\nsrc/components/Login.tsx 0 errors\nsrc/db/schema.prisma     OK\n\nVerification complete. Typecheck passed.`,
    logs: [
      { text: "[qa.agent] Starting validation sandbox.", type: "tester" },
      { text: "[qa.agent] Running TypeScript checks.", type: "tester" },
      { text: "[qa.agent] Running unit tests for touched modules.", type: "tester" },
      { text: "[qa.agent] Build review is clean.", type: "success" },
    ],
  },
  {
    agent: "ship",
    title: "Deploy & Release",
    phase: "shipping",
    file: "git push origin feat/portal",
    status: "deploying",
    metric: "preview ready",
    code: `Pull Request #14\n  feat: client portal with auth and billing\n\nChecks\n  typecheck passed\n  unit tests passed\n  preview deployed\n\nhttps://devflow-portal-preview.vercel.app`,
    logs: [
      { text: "[system] Committing sandbox workspace.", type: "system" },
      { text: "[system] Pushing branch feat/portal.", type: "system" },
      { text: "[system] Opening GitHub pull request.", type: "system" },
      { text: "[ship.agent] Preview deployment is ready.", type: "success" },
    ],
  },
];

const AGENT_LABELS: Record<AgentType, string> = {
  ceo: "Planner",
  cto: "Architect",
  developer: "Builder",
  tester: "Reviewer",
  ship: "Release",
};

export function HeroScene() {
  const [activeStep, setActiveStep] = useState(0);
  const [typedCode, setTypedCode] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 5600);

    return () => window.clearInterval(timer);
  }, []);

  const currentStep = WORKFLOW_STEPS[activeStep];
  const progress = `${((activeStep + 1) / WORKFLOW_STEPS.length) * 100}%`;

  const agentRows = useMemo(
    () =>
      WORKFLOW_STEPS.map((step, idx) => ({
        agent: step.agent,
        label: AGENT_LABELS[step.agent],
        phase: step.phase,
        state: idx < activeStep ? "done" : idx === activeStep ? "live" : idx === activeStep + 1 ? "queued" : "standby",
      })),
    [activeStep],
  );

  useEffect(() => {
    setTypedCode("");
    let index = 0;
    const codeText = currentStep.code;
    const speed = Math.max(8, Math.floor(420 / codeText.length));

    const interval = window.setInterval(() => {
      index += 1;
      setTypedCode(codeText.slice(0, index));
      if (index >= codeText.length) {
        window.clearInterval(interval);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [activeStep, currentStep.code]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeStep, currentStep.logs]);

  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="orchestration-cockpit">
        <div className="cockpit-topbar">
          <div>
            <span className="cockpit-kicker">DevFlow live run</span>
            <strong>Orchestration cockpit</strong>
          </div>
          <div className="cockpit-live-badge">
            <span />
            {currentStep.status}
          </div>
        </div>

        <div className="cockpit-pipeline" style={{ "--pipeline-progress": progress } as React.CSSProperties}>
          {WORKFLOW_STEPS.map((step, idx) => (
            <React.Fragment key={step.title}>
              <div className={`cockpit-node ${idx === activeStep ? "active" : ""} ${idx < activeStep ? "complete" : ""}`}>
                <span className="cockpit-node-dot" />
                <span>{step.title}</span>
              </div>
              {idx < WORKFLOW_STEPS.length - 1 && <div className="cockpit-rail" />}
            </React.Fragment>
          ))}
        </div>

        <div className="cockpit-body">
          <aside className="agent-radar">
            <div className="radar-header">
              <span>Agents</span>
              <strong>{activeStep + 1}/5</strong>
            </div>
            {agentRows.map((row) => (
              <div className={`agent-radar-row agent-state-${row.state}`} key={row.agent}>
                <span className="agent-signal" />
                <div>
                  <strong>{row.label}</strong>
                  <span>{row.phase}</span>
                </div>
              </div>
            ))}
          </aside>

          <section className="cockpit-main">
            <div className="run-metrics">
              <div>
                <span>Active buffer</span>
                <strong>{currentStep.file}</strong>
              </div>
              <div>
                <span>Run state</span>
                <strong>{currentStep.metric}</strong>
              </div>
            </div>

            <div className="workspace-grid">
              <div className="stream-panel">
                <div className="panel-header">
                  <span>stream</span>
                  <strong>{currentStep.agent}.agent</strong>
                </div>
                <div className="terminal-stream">
                  {currentStep.logs.map((log, idx) => (
                    <div className={`log-line log-${log.type}`} key={`${log.text}-${idx}`}>
                      {log.text}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>

              <div className="code-panel">
                <div className="panel-header">
                  <span>patch</span>
                  <strong>{currentStep.status}</strong>
                </div>
                <pre className="code-content">
                  <code>{typedCode}</code>
                </pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default HeroScene;
