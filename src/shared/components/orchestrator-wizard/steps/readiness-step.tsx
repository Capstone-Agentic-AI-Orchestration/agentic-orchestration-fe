"use client";

import { useReadinessStepViewModel } from "@/features/orchestration";
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
  const vm = useReadinessStepViewModel(ctx);

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

      {vm.error && (
        <div className="wizard-info-banner warning">
          <IconAlertTriangle size={16} />
          <span>{vm.error}</span>
        </div>
      )}

      {vm.allReady && (
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
              border: `1px solid ${vm.llmOk ? "var(--green)" : "var(--border)"}`,
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IconCpu size={20} style={{ color: vm.llmOk ? "var(--green)" : "var(--text-3)" }} />
                <div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text)" }}>
                    LLM Provider
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                    Agent mode: <strong>{vm.agentMode}</strong>
                    {vm.llmResult?.model && ` · Model: ${vm.llmResult.model}`}
                  </div>
                </div>
              </div>
              <Badge tone={vm.llmTone}>
                {vm.llmLabel}
              </Badge>
            </div>
            {vm.llmResult && !vm.llmResult.ok && vm.llmResult.reason && (
              <div style={{ fontSize: "0.8125rem", color: "var(--amber)", marginTop: 8, lineHeight: 1.5 }}>
                {vm.llmResult.reason}
              </div>
            )}
            {vm.llmResult && vm.llmResult.ok && (
              <div style={{ fontSize: "0.8125rem", color: "var(--green)", marginTop: 8 }}>
                Connection verified successfully.
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={vm.actions.verifyLlm} disabled={vm.verifyingLlm} style={{ marginTop: 10 }}>
              {vm.verifyingLlm ? (
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
              border: `1px solid ${vm.githubOk ? "var(--green)" : "var(--border)"}`,
              borderRadius: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IconGitHub size={20} style={{ color: vm.githubOk ? "var(--green)" : "var(--text-3)" }} />
                <div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text)" }}>
                    GitHub Delivery
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
                    Required for committing generated code to a repository
                  </div>
                </div>
              </div>
              <Badge tone={vm.githubTone}>
                {vm.githubLabel}
              </Badge>
            </div>
            {vm.githubResult && !vm.githubResult.ok && vm.githubResult.reason && (
              <div style={{ fontSize: "0.8125rem", color: "var(--amber)", marginTop: 8, lineHeight: 1.5 }}>
                {vm.githubResult.reason}
              </div>
            )}
            {vm.githubResult && vm.githubResult.ok && (
              <div style={{ fontSize: "0.8125rem", color: "var(--green)", marginTop: 8 }}>
                GitHub delivery verified.
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={vm.actions.verifyGithub} disabled={vm.verifyingGithub} style={{ marginTop: 10 }}>
              {vm.verifyingGithub ? (
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

      {!vm.allReady && (
        <div className="wizard-info-banner info">
          <IconAlertTriangle size={16} />
          <span>
            Providers don&apos;t need to be verified to continue, but orchestration will fail if they
            aren&apos;t configured. You can verify now or fix issues in Admin &gt; Providers.
          </span>
        </div>
      )}

      <OrchestratorStepNav
        projectId={vm.projectId}
        currentStep="readiness"
        nextLabel="Continue to Run"
        nextDisabled={false}
      />
    </div>
  );
}
