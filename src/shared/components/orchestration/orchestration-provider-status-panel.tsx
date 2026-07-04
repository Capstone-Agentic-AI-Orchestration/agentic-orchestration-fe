"use client";

import { Badge, Button } from "@/shared/components/ui";
import { IconAlertTriangle, IconCheckCircle, IconCpu, IconRefresh } from "@/shared/components/icons";
import type { DevFlowAgentProviderStatus, DevFlowGithubDeliveryVerification, DevFlowLlmProviderVerification } from "@/shared/api/devflow-api";

interface OrchestrationProviderStatusPanelProps {
  status: DevFlowAgentProviderStatus | null;
  loading?: boolean;
  error?: string;
  compact?: boolean;
  githubVerification?: DevFlowGithubDeliveryVerification | null;
  githubVerificationLoading?: boolean;
  githubVerificationError?: string;
  onVerifyGithubDelivery?: () => void;
  llmVerification?: DevFlowLlmProviderVerification | null;
  llmVerificationLoading?: boolean;
  llmVerificationError?: string;
  onVerifyLlmProvider?: () => void;
}

export function OrchestrationProviderStatusPanel({
  status,
  loading = false,
  error = "",
  compact = false,
  githubVerification = null,
  githubVerificationLoading = false,
  githubVerificationError = "",
  onVerifyGithubDelivery,
  llmVerification = null,
  llmVerificationLoading = false,
  llmVerificationError = "",
  onVerifyLlmProvider,
}: OrchestrationProviderStatusPanelProps) {
  const available = Boolean(status?.available);
  const githubDelivery = status?.githubDelivery;
  const tone = loading ? "gray" : error ? "red" : available ? "green" : "amber";
  const label = loading ? "Checking" : error ? "Unavailable" : available ? "Available" : "Blocked";
  const activeProvider = status?.providers.find((provider) => provider.active);

  return (
    <div
      style={{
        padding: compact ? 12 : 14,
        borderRadius: 10,
        border: `1px solid ${available ? "rgba(16,185,129,.24)" : "rgba(245,158,11,.26)"}`,
        background: available ? "rgba(16,185,129,.07)" : "rgba(245,158,11,.07)",
        display: "grid",
        gap: compact ? 10 : 12,
      }}
    >
      <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="row gap-2" style={{ alignItems: "flex-start", minWidth: 0 }}>
          <span style={{ color: available ? "#6EE7B7" : "#FBBF24", marginTop: 1 }}>
            {available ? <IconCheckCircle size={15} /> : <IconAlertTriangle size={15} />}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Agent provider</div>
            <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 3, overflowWrap: "anywhere" }}>
              {loading
                ? "Checking backend provider capability..."
                : error
                  ? error
                  : status?.reason || `${providerLabel(status?.activeMode)} is ready for orchestration.`}
            </div>
          </div>
        </div>
        <div className="row gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
          {onVerifyLlmProvider && (
            <Button
              variant="secondary"
              size="sm"
              icon={<IconRefresh size={12} />}
              iconRight={null}
              onClick={onVerifyLlmProvider}
              style={undefined}
              disabled={llmVerificationLoading || status?.activeMode !== "llm" || !available}
            >
              {llmVerificationLoading ? "Verifying..." : "Verify LLM"}
            </Button>
          )}
          <Badge tone={tone} style={undefined}>{label}</Badge>
        </div>
      </div>

      {(llmVerification || llmVerificationError) && (
        <div
          style={{
            padding: 10,
            border: `1px solid ${llmVerification?.ok ? "rgba(16,185,129,.24)" : "rgba(245,158,11,.28)"}`,
            background: llmVerification?.ok ? "rgba(16,185,129,.07)" : "rgba(245,158,11,.08)",
            borderRadius: 8,
            display: "grid",
            gap: 8,
          }}
        >
          <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800 }}>LLM live verification</div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2, overflowWrap: "anywhere" }}>
                {llmVerificationError || llmVerification?.reason || "Selected graph LLM provider responded to a minimal JSON request."}
              </div>
            </div>
            <Badge tone={llmVerification?.ok ? "green" : "amber"} style={undefined}>{llmVerification?.ok ? "Verified" : "Check failed"}</Badge>
          </div>
          {llmVerification && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              <ProviderMiniFact label="Provider" value={llmVerification.provider} />
              <ProviderMiniFact label="Model" value={llmVerification.model} />
              <ProviderMiniFact label="Tokens" value={llmVerification.usage ? `${llmVerification.usage.inputTokens}/${llmVerification.usage.outputTokens}` : "Unknown"} />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
        <ProviderMiniFact label="Requested" value={providerLabel(status?.requestedMode)} />
        <ProviderMiniFact label="Active" value={providerLabel(status?.activeMode)} />
        <ProviderMiniFact label="Fallback" value={status?.fallbackMode ? providerLabel(status.fallbackMode) : "None"} />
        <ProviderMiniFact label="Adapter" value={activeProvider?.implemented ? "Implemented" : activeProvider ? "Pending" : "Unknown"} />
      </div>

      {githubDelivery && (
        <div
          style={{
            padding: "10px 0 0",
            borderTop: "1px solid rgba(148,163,184,.14)",
            display: "grid",
            gap: 8,
          }}
        >
          <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800 }}>GitHub delivery</div>
              <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2, overflowWrap: "anywhere" }}>
                {githubDelivery.reason || `Ready to create repositories in ${githubDelivery.owner || "configured owner"}.`}
              </div>
            </div>
            <div className="row gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
              {onVerifyGithubDelivery && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<IconRefresh size={12} />}
                  iconRight={null}
                  onClick={onVerifyGithubDelivery}
                  style={undefined}
                  disabled={githubVerificationLoading || !githubDelivery.available}
                >
                  {githubVerificationLoading ? "Verifying..." : "Verify"}
                </Button>
              )}
              <Badge tone={githubDelivery.available ? "green" : "amber"} style={undefined}>{githubDelivery.available ? "Ready" : "Setup needed"}</Badge>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
            <ProviderMiniFact label="Owner" value={githubDelivery.owner || "Not set"} />
            <ProviderMiniFact label="Source" value={githubDelivery.ownerSource || "Unknown"} />
          </div>
          {(githubVerification || githubVerificationError) && (
            <div
              style={{
                padding: 10,
                border: `1px solid ${githubVerification?.ok ? "rgba(16,185,129,.24)" : "rgba(245,158,11,.28)"}`,
                background: githubVerification?.ok ? "rgba(16,185,129,.07)" : "rgba(245,158,11,.08)",
                borderRadius: 8,
                display: "grid",
                gap: 8,
              }}
            >
              <div className="row" style={{ justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>Live verification</div>
                  <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2, overflowWrap: "anywhere" }}>
                    {githubVerificationError || githubVerification?.reason || "GitHub App installation and repository access verified."}
                  </div>
                </div>
                <Badge tone={githubVerification?.ok ? "green" : "amber"} style={undefined}>{githubVerification?.ok ? "Verified" : "Check failed"}</Badge>
              </div>
              {githubVerification && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                  <ProviderMiniFact label="Install owner" value={githubVerification.installationOwner || "Unknown"} />
                  <ProviderMiniFact label="Visible repos" value={githubVerification.repositoriesVisible === null ? "Unknown" : String(githubVerification.repositoriesVisible)} />
                </div>
              )}
            </div>
          )}
          {githubDelivery.missingRequirements?.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {githubDelivery.missingRequirements.map((requirement) => (
                <Badge key={requirement} tone="amber" style={undefined}>{requirement}</Badge>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {status?.missingRequirements?.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {status.missingRequirements.map((requirement) => (
            <Badge key={requirement} tone="amber" style={undefined}>{requirement}</Badge>
          ))}
        </div>
      ) : null}

      {!compact && status?.providers?.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {status.providers.map((provider) => (
            <div
              key={provider.mode}
              className="row"
              style={{
                justifyContent: "space-between",
                gap: 10,
                padding: "9px 0",
                borderTop: "1px solid rgba(148,163,184,.14)",
                alignItems: "flex-start",
              }}
            >
              <div className="row gap-2" style={{ minWidth: 0 }}>
                <IconCpu size={13} style={{ color: provider.active ? "#93C5FD" : "var(--text-3)", flexShrink: 0, marginTop: 2 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>{provider.displayName}</div>
                  <div style={{ color: "var(--text-3)", fontSize: 11.5, marginTop: 2, overflowWrap: "anywhere" }}>
                    {provider.reason || (provider.available ? "Ready" : "Not available")}
                  </div>
                </div>
              </div>
              <Badge tone={provider.available ? "green" : "gray"} style={undefined}>{provider.active ? "Active" : provider.available ? "Ready" : "Off"}</Badge>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProviderMiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ color: "var(--text-3)", fontSize: 11 }}>{label}</div>
      <div className="mono" style={{ color: "white", fontSize: 12, fontWeight: 800, marginTop: 3, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

function providerLabel(mode?: string | null) {
  if (!mode) return "Unknown";
  if (mode === "llm") return "LLM";
  if (mode === "mock") return "Mock";
  return mode;
}
