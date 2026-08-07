import { PMAgentDetailView } from "@/features/pm/agents/views/pm-agent-detail-view";

export default async function PMAgentPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;
  return <PMAgentDetailView agentId={agentId} />;
}
