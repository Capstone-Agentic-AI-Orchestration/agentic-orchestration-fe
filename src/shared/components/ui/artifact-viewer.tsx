"use client";

import { useState, type ReactNode } from "react";
import { CodeBlock } from "./code-block";
import { Badge, Button, Card } from "./ui";

/**
 * Artifact viewer with syntax highlighting, copy-to-clipboard,
 * and toggle between code/raw/rendered views.
 */

interface ArtifactViewerProps {
  filePath: string;
  content: string;
  language?: string;
  agentType?: string;
  source?: string;
  className?: string;
}

const LANG_MAP: Record<string, string> = {
  ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
  prisma: "prisma", sql: "sql", md: "markdown", json: "json",
  css: "css", scss: "scss", html: "html", yml: "yaml", yaml: "yaml",
  sh: "bash", bash: "bash", dockerfile: "dockerfile",
};

function inferLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return LANG_MAP[ext] ?? "text";
}

const AGENT_COLORS: Record<string, string> = {
  frontend: "#F97316", backend: "#10B981", database: "#14B8A6", architecture: "#A78BFA",
};

export function ArtifactViewer({
  filePath,
  content,
  language,
  agentType,
  source,
  className = "",
}: ArtifactViewerProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lang = language ?? inferLanguage(filePath);
  const color = agentType ? AGENT_COLORS[agentType] ?? "#4F8BFF" : "#4F8BFF";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <Card className={`artifact-viewer ${className}`} style={{}}>
      <div className="artifact-header">
        <div className="artifact-path mono" style={{ color }}>
          {agentType && (
            <span className="artifact-agent-dot" style={{ background: color }} />
          )}
          {filePath}
        </div>
        <div className="artifact-actions">
          {source && source !== "llm" && (
            <Badge tone="gray" dot={false} style={{}}>{source}</Badge>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? "\u2713 Copied" : "Copy"}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>
      <CodeBlock
        code={content}
        language={lang}
        maxHeight={expanded ? 800 : 400}
      />
    </Card>
  );
}
