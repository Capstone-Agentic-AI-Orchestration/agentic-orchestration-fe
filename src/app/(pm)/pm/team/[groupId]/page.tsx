import { PMTeamView } from "@/features/pm/team/views/pm-team-view";

export default async function PMTeamPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <PMTeamView groupId={groupId} />;
}
