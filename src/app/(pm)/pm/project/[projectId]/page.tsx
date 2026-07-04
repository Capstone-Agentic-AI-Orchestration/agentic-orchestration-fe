import { PMProjectDetailView } from "@/features/pm/projects/views/pm-project-detail-view";

export default async function PMProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <PMProjectDetailView projectId={projectId} />;
}
