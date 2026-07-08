export type GateReviewKind = "gate-1" | "gate-2";

interface GateReviewProjectLike {
  status?: string | null;
  contract?: unknown;
  companyName?: string | null;
  brief?: string | null;
}

interface GateReviewStatusLike {
  status?: string | null;
  contract?: unknown;
  artifacts?: GateReviewArtifactLike[] | null;
}

export interface GateReviewArtifactLike {
  id: string;
  agentType?: string | null;
  filePath?: string | null;
  language?: string | null;
  content?: string | null;
}

interface Gate2ReviewProjectLike {
  status?: string | null;
  artifacts?: GateReviewArtifactLike[] | null;
}

export type GateArtifactTone = "neutral" | "green" | "attention" | "gray";

export interface GateArtifactGroup {
  agent: string;
  label: string;
  tone: GateArtifactTone;
  artifacts: GateReviewArtifactLike[];
}

export interface Gate1ReviewState {
  projectStatus: string;
  projectStatusLabel: string;
  isAwaiting: boolean;
  contract: any | null;
  contractTitle: string;
  contractDescription: string;
  hasRequirements: boolean;
  features: string[];
  fileManifest: string[];
  acceptanceCriteria: string[];
  nextDisabled: boolean;
}

export interface Gate2ReviewState {
  projectStatus: string;
  projectStatusLabel: string;
  isAwaiting: boolean;
  artifacts: GateReviewArtifactLike[];
  artifactGroups: GateArtifactGroup[];
  nextDisabled: boolean;
}

export const GATE_ARTIFACT_AGENT_LABELS: Record<string, { label: string; tone: GateArtifactTone }> = {
  frontend: { label: "Frontend", tone: "attention" },
  backend: { label: "Backend", tone: "green" },
  database: { label: "Database", tone: "neutral" },
  architecture: { label: "Architecture", tone: "gray" },
};

export function formatProjectStatusLabel(status: string | null | undefined): string {
  return status ? status.replace(/_/g, " ") : "unknown";
}

export function buildGate1ReviewState(input: {
  project: GateReviewProjectLike | null;
  status: GateReviewStatusLike | null;
  acting?: boolean;
}): Gate1ReviewState {
  const projectStatus = input.project?.status ?? input.status?.status ?? "PENDING";
  const contract = (input.project?.contract ?? input.status?.contract ?? null) as any | null;
  const requirements = contract?.requirements ?? null;
  const isAwaiting = projectStatus === "AWAITING_GATE_1";

  return {
    projectStatus,
    projectStatusLabel: formatProjectStatusLabel(projectStatus),
    isAwaiting,
    contract,
    contractTitle: contract?.projectName ?? input.project?.companyName ?? "",
    contractDescription: contract?.description ?? input.project?.brief ?? "",
    hasRequirements: Boolean(requirements),
    features: Array.isArray(requirements?.features) ? requirements.features : [],
    fileManifest: Array.isArray(contract?.fileManifest) ? contract.fileManifest : [],
    acceptanceCriteria: Array.isArray(contract?.acceptanceCriteria) ? contract.acceptanceCriteria : [],
    nextDisabled: !isAwaiting || Boolean(input.acting),
  };
}

export function groupGateArtifactsByAgent(
  artifacts: GateReviewArtifactLike[],
): GateArtifactGroup[] {
  const groups = artifacts.reduce<Record<string, GateReviewArtifactLike[]>>((acc, artifact) => {
    const agent = artifact.agentType ?? "other";
    if (!acc[agent]) acc[agent] = [];
    acc[agent].push(artifact);
    return acc;
  }, {});

  return Object.entries(groups).map(([agent, items]) => {
    const meta = GATE_ARTIFACT_AGENT_LABELS[agent] ?? { label: agent, tone: "gray" as const };
    return {
      agent,
      label: meta.label,
      tone: meta.tone,
      artifacts: items,
    };
  });
}

export function buildGate2ReviewState(input: {
  project: Gate2ReviewProjectLike | null;
  status: GateReviewStatusLike | null;
  acting?: boolean;
}): Gate2ReviewState {
  const projectStatus = input.project?.status ?? input.status?.status ?? "PENDING";
  const isAwaiting = projectStatus === "AWAITING_GATE_2";
  const artifacts = input.project?.artifacts ?? input.status?.artifacts ?? [];

  return {
    projectStatus,
    projectStatusLabel: formatProjectStatusLabel(projectStatus),
    isAwaiting,
    artifacts,
    artifactGroups: groupGateArtifactsByAgent(artifacts),
    nextDisabled: !isAwaiting || Boolean(input.acting),
  };
}
