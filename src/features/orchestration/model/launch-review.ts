import type { ProviderVerificationResult } from "./readiness-step";

interface LaunchProviderStatusLike {
  llmAvailable?: boolean | null;
  available?: boolean | null;
  agentProviderMode?: string | null;
  activeMode?: string | null;
  githubDelivery?: {
    ok?: boolean | null;
    available?: boolean | null;
  } | null;
}

export interface LaunchReviewState {
  llmOk: boolean;
  githubOk: boolean;
  canStart: boolean;
  agentMode: string;
  llmLabel: string;
  githubLabel: string;
  githubNote: string;
}

export function buildLaunchReviewState(input: {
  providerStatus: LaunchProviderStatusLike | null | undefined;
  llmResult: ProviderVerificationResult | null;
  githubResult: ProviderVerificationResult | null;
}): LaunchReviewState {
  const llmOk =
    input.llmResult?.ok
    ?? input.providerStatus?.llmAvailable
    ?? input.providerStatus?.available
    ?? false;
  const githubOk =
    input.githubResult?.ok
    ?? input.providerStatus?.githubDelivery?.ok
    ?? input.providerStatus?.githubDelivery?.available
    ?? false;

  return {
    llmOk,
    githubOk,
    canStart: llmOk,
    agentMode:
      input.providerStatus?.agentProviderMode
      ?? input.providerStatus?.activeMode
      ?? "mock",
    llmLabel: llmOk ? "Ready" : "Needs attention",
    githubLabel: githubOk ? "Connected" : "Connect later",
    githubNote: githubOk
      ? "Generated work can be delivered to the connected repository."
      : "Generation can start now. Connect GitHub before final delivery.",
  };
}
