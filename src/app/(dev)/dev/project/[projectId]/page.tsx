import { DevProjectDetailView } from "@/features/dev/projects/views/dev-projects-view";

export default async function DevProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <DevProjectDetailView projectId={projectId} />;
}

