import { DevOutputView } from "@/features/dev/orchestrator/views/dev-orchestrator-view";

export default async function DevOutputPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <DevOutputView projectId={projectId} />;
}

