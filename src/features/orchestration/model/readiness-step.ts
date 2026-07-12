interface ProviderStatusLike {
  llmAvailable?: boolean | null;
  agentProviderMode?: string | null;
  available?: boolean | null;
  activeMode?: string | null;
  githubDelivery?: {
    ok?: boolean | null;
    available?: boolean | null;
  } | null;
}

export interface ProviderVerificationResult {
  ok?: boolean;
  reason?: string | null;
  model?: string | null;
}

export interface ReadinessStepState {
  llmOk: boolean;
  githubOk: boolean;
  agentMode: string;
  allReady: boolean;
  llmTone: "green" | "yellow";
  githubTone: "green" | "yellow";
  llmLabel: string;
  githubLabel: string;
}

export function buildReadinessStepState(input: {
  providerStatus: ProviderStatusLike | null | undefined;
  llmResult: ProviderVerificationResult | null;
  githubResult: ProviderVerificationResult | null;
}): ReadinessStepState {
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
    agentMode:
      input.providerStatus?.agentProviderMode
      ?? input.providerStatus?.activeMode
      ?? "mock",
    allReady: llmOk && githubOk,
    llmTone: llmOk ? "green" : "yellow",
    githubTone: githubOk ? "green" : "yellow",
    llmLabel: llmOk ? "Ready" : "Not verified",
    githubLabel: githubOk ? "Ready" : "Not verified",
  };
}
