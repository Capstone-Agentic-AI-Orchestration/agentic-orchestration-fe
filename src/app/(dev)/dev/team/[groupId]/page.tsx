import { DevTeamView } from "@/features/dev/team/views/dev-team-view";

export default async function DevTeamPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <DevTeamView groupId={groupId} />;
}
