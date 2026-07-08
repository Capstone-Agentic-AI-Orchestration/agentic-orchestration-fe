interface ProviderStatusLike {
  llmAvailable?: boolean | null;
  agentProviderMode?: string | null;
  githubDelivery?: {
    ok?: boolean | null;
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
  const llmOk = input.llmResult?.ok ?? input.providerStatus?.llmAvailable ?? false;
  const githubOk = input.githubResult?.ok ?? input.providerStatus?.githubDelivery?.ok ?? false;

  return {
    llmOk,
    githubOk,
    agentMode: input.providerStatus?.agentProviderMode ?? "mock",
    allReady: llmOk && githubOk,
    llmTone: llmOk ? "green" : "yellow",
    githubTone: githubOk ? "green" : "yellow",
    llmLabel: llmOk ? "Ready" : "Not verified",
    githubLabel: githubOk ? "Ready" : "Not verified",
  };
}
