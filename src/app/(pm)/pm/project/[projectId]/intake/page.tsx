import { ProjectIntakeWorkspace } from "@/features/intake/project-intake-workspace";

export default async function PMProjectIntakePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ProjectIntakeWorkspace projectId={projectId} role="pm" />;
}
