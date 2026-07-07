"use client";

import React, { useState, useEffect, useRef } from "react";
import "./HeroScene.css";

interface LogLine {
  text: string;
  type: "system" | "ceo" | "cto" | "developer" | "tester" | "success";
}

interface WorkflowStep {
  agent: "ceo" | "cto" | "developer" | "tester" | "ship";
  title: string;
  file: string;
  code: string;
  logs: LogLine[];
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    agent: "ceo",
    title: "Ingest & Plan",
    file: "brief.md",
    code: `# brief.md\n\n- Add authentication (Supabase Auth)\n- Integrate Stripe billing portal\n- Build real-time ticket manager\n- Deploy preview on Vercel\n- Deliver clean PR to GitHub`,
    logs: [
      { text: "$ run orchestration --brief brief.md", type: "system" },
      { text: "[system] Initializing DevFlow agent plane...", type: "system" },
      { text: "[system] Ingested brief.md successfully.", type: "system" },
      { text: "[ceo.agent] Formulation plan locked. 4 subagents active.", type: "success" },
    ],
  },
  {
    agent: "cto",
    title: "Architect Schemas",
    file: "prisma/schema.prisma",
    code: `// prisma/schema.prisma\n\nmodel Project {\n  id        String   @id @default(uuid())\n  name      String\n  status    String\n  createdAt DateTime @default(now())\n}`,
    logs: [
      { text: "[cto.agent] Designing database relational schemas...", type: "cto" },
      { text: "[cto.agent] Created project entity data mapping.", type: "cto" },
      { text: "[cto.agent] Schema generated & locked.", type: "success" },
    ],
  },
  {
    agent: "developer",
    title: "Write Code",
    file: "src/api/projects.ts",
    code: `// src/api/projects.ts\n\nexport async function POST(req: Request) {\n  const body = await req.json();\n  const project = await prisma.project.create({\n    data: { name: body.name, status: "active" }\n  });\n  return NextResponse.json(project);\n}`,
    logs: [
      { text: "[dev.agent] Coding Next.js Route Handlers...", type: "developer" },
      { text: "[dev.agent] Generating API controllers...", type: "developer" },
      { text: "[dev.agent] Completed backend routing structures.", type: "success" },
    ],
  },
  {
    agent: "tester",
    title: "Verify Quality",
    file: "npm run typecheck",
    code: `$ tsc --noEmit --skipLibCheck\n\nsrc/api/projects.ts: 0 errors\nsrc/components/LoginForm.tsx: 0 errors\n\n✓ Verification complete. Typecheck passed.`,
    logs: [
      { text: "[qa.agent] Launching validation sandbox container...", type: "tester" },
      { text: "[qa.agent] Running: npx tsc --noEmit", type: "tester" },
      { text: "[qa.agent] Running unit tests: vitest run", type: "tester" },
      { text: "[qa.agent] 14 unit test specs passed (100% OK).", type: "success" },
    ],
  },
  {
    agent: "ship",
    title: "Deploy & Release",
    file: "git push origin feat/portal",
    code: `Pull Request #14:\n  title: "feat: client portal with DB & auth"\n  branch: feat/portal -> main\n  status: Merged\n\nDeployment ready:\n  https://devflow-portal-preview.vercel.app`,
    logs: [
      { text: "[system] Committing sandbox workspace...", type: "system" },
      { text: "[system] Pushing branch: feat/portal", type: "system" },
      { text: "[system] Opening Pull Request #14 on GitHub...", type: "system" },
      { text: "[system] PR #14 merged successfully.", type: "success" },
      { text: "[system] Preview deployed on Vercel.", type: "success" },
    ],
  },
];

export function HeroScene() {
  const [activeStep, setActiveStep] = useState(0);
  const [typedCode, setTypedCode] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  // Cycle steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentStep = WORKFLOW_STEPS[activeStep];

  // Typing effect
  useEffect(() => {
    setTypedCode("");
    let index = 0;
    const codeText = currentStep.code;
    const speed = Math.max(1, Math.floor(100 / codeText.length));

    const interval = setInterval(() => {
      setTypedCode((prev) => prev + codeText.charAt(index));
      index++;
      if (index >= codeText.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [activeStep, currentStep.code]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeStep, currentStep.logs]);

  return (
    <div className="hero-scene" aria-hidden="true">
      <div className="agent-ide-panel">
        
        {/* IDE Top Bar */}
        <div className="ide-header">
          <div className="ide-dots">
            <span className="dot dot-close" />
            <span className="dot dot-minimize" />
            <span className="dot dot-expand" />
          </div>
          <div className="ide-title-bar">DevFlow Orchestration Terminal</div>
        </div>

        {/* Horizontal Pipeline Track */}
        <div className="pipeline-track">
          {WORKFLOW_STEPS.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className={`pipeline-node ${activeStep === idx ? "active" : ""} ${activeStep > idx ? "completed" : ""}`}>
                <div className="node-icon">
                  <span className="node-dot" />
                </div>
                <span className="node-label">{step.title}</span>
              </div>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={`pipeline-connector ${activeStep > idx ? "completed" : ""}`}>
                  <div className="connector-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* IDE Workspace (Split Pane Layout) */}
        <div className="ide-body">
          
          {/* Left Side: Console Output */}
          <div className="ide-pane pane-left">
            <div className="pane-header">
              <span>CONSOLE MONITOR</span>
              <span className="agent-tag">active: {currentStep.agent}.agent</span>
            </div>
            <div className="pane-content terminal-theme">
              {currentStep.logs.map((log, idx) => (
                <div key={idx} className={`log-line log-${log.type}`}>
                  {log.text}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Right Side: Code Editor */}
          <div className="ide-pane pane-right">
            <div className="pane-header">
              <span>BUFFER: {currentStep.file}</span>
              <span className="writing-pulse">● WRITING</span>
            </div>
            <div className="pane-content editor-theme">
              <pre className="code-content">
                <code>{typedCode}</code>
              </pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default HeroScene;
