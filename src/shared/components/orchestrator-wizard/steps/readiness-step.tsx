// @ts-nocheck
"use client";

import { useState } from "react";
import {
  verifyDevFlowLlmProvider,
  verifyDevFlowGithubDelivery,
} from "@/shared/api/devflow-api";
import { Button, Badge } from "@/shared/components/ui";
import {
  IconShield,
  IconCheck,
  IconAlertTriangle,
  IconRefresh,
  IconCpu,
  IconGitHub,
  IconZap,
} from "@/shared/components/icons";
import { OrchestratorStepNav } from "@/shared/components/orchestrator-wizard/orchestrator-stepper";
import type { OrchestratorWizardContextValue } from "@/shared/components/orchestrator-wizard/orchestrator-wizard-layout";

export function ReadinessStep({ ctx }: { ctx: OrchestratorWizardContextValue }) {
  const { projectId, status } = ctx;
  const providerStatus = status?.provider;
  const [verifyingLlm, setVerifyingLlm] = useState(false);
  const [verifyingGithub, setVerifyingGithub] = useState(false);
  const [llmResult, setLlmResult] = useState<any>(null);
  const [githubResult, setGithubResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleVerifyLlm = async () => {
    setVerifyingLlm(true);
    setError("");
    try {
      const result = await verifyDevFlowLlmProvider(projectId);
      setLlmResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLlmResult({ ok: false, reason: err instanceof Error ? err.message : String(err) });
    } finally {
      setVerifyingLlm(false);
    }
  };

  const handleVerifyGithub = async () => {
    setVerifyingGithub(true);
    setError("");
    try {
      const result = await verifyDevFlowGithubDelivery(projectId);
      setGithubResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setGithubResult({ ok: false, reason: err instanceof Error ? err.message : String(err) });
    } finally {
      setVerifyingGithub(false);
    }
  };

  const llmOk = llmResult?.ok ?? providerStatus?.llmAvailable ?? false;
  const githubOk = githubResult?.ok ?? providerStatus?.githubDelivery?.ok ?? false;
  const agentMode = providerStatus?.agentProviderMode ?? "mock";
  const allReady = llmOk && githubOk;

  return (
    <div>
      <div className="wizard-step-section">
        <h3 className="wizard-step-section-title">
          <IconShield size={16} />
          Provider Readiness
        </h3>
        <p className="wizard-step-section-desc">
          Verify that the LLM provider and GitHub delivery are configured before starting orchestration.
        </p>
      </div>

      {error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {allReady && (
        <div className="wizard-info-banner success">
          <IconCheck size={16} />
          <span>All providers are ready. You can start orchestration on the next step.</span>
        </div>
      )}

      <div className="wizard-step-section">
        <div style={{ display: "grid", gap: 16 }}>
          {/* LLM Provider */}
          <div
            style={{
              padding: 20,
              background: "var(--bg-2)",
              border: `1px solid ${llmOk ? "var(--green)" : "var(--border)"}`,
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IconCpu size={20} style={{ color: llmOk ? "var(--green)" : "var(--text-3)" }} />
                <div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text)" }}>
                    LLM Provider
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                    Agent mode: <strong>{agentMode}</strong>
                    {llmResult?.model && ` · Model: ${llmResult.model}`}
                  </div>
                </div>
              </div>
              <Badge tone={llmOk ? "green" : "yellow"}>
                {llmOk ? "Ready" : "Not verified"}
              </Badge>
            </div>
            {llmResult && !llmResult.ok && llmResult.reason && (
              <div style={{ fontSize: "0.8125rem", color: "var(--amber)", marginTop: 8, lineHeight: 1.5 }}>
                {llmResult.reason}
              </div>
            )}
            {llmResult && llmResult.ok && (
              <div style={{ fontSize: "0.8125rem", color: "var(--green)", marginTop: 8 }}>
                Connection verified successfully.
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={handleVerifyLlm} disabled={verifyingLlm} style={{ marginTop: 10 }}>
              {verifyingLlm ? (
                <>
                  <IconRefresh size={14} className="spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <IconZap size={14} />
                  Verify LLM connection
                </>
              )}
            </Button>
          </div>

          {/* GitHub Delivery */}
          <div
            style={{
              padding: 20,
              background: "var(--bg-2)",
              border: `1px solid ${githubOk ? "var(--green)" : "var(--border)"}`,
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IconGitHub size={20} style={{ color: githubOk ? "var(--green)" : "var(--text-3)" }} />
                <div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text)" }}>
                    GitHub Delivery
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                    Required for committing generated code to a repository
                  </div>
                </div>
              </div>
              <Badge tone={githubOk ? "green" : "yellow"}>
                {githubOk ? "Ready" : "Not verified"}
              </Badge>
            </div>
            {githubResult && !githubResult.ok && githubResult.reason && (
              <div style={{ fontSize: "0.8125rem", color: "var(--amber)", marginTop: 8, lineHeight: 1.5 }}>
                {githubResult.reason}
              </div>
            )}
            {githubResult && githubResult.ok && (
              <div style={{ fontSize: "0.8125rem", color: "var(--green)", marginTop: 8 }}>
                GitHub delivery verified.
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={handleVerifyGithub} disabled={verifyingGithub} style={{ marginTop: 10 }}>
              {verifyingGithub ? (
                <>
                  <IconRefresh size={14} className="spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <IconGitHub size={14} />
                  Verify GitHub delivery
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {!allReady && (
        <div className="wizard-info-banner info">
          <IconAlertTriangle size={16} />
          <span>
            Providers don&apos;t need to be verified to continue, but orchestration will fail if they
            aren&apos;t configured. You can verify now or fix issues in Admin &gt; Providers.
          </span>
        </div>
      )}

      <OrchestratorStepNav
        projectId={projectId}
        currentStep="readiness"
        nextLabel="Continue to Run"
        nextDisabled={false}
      />
    </div>
  );
}
