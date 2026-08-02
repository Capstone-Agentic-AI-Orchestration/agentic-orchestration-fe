import { PMClientDetailView } from "@/features/pm/clients/views/pm-client-detail-view";

export default async function PMClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  return <PMClientDetailView clientId={clientId} />;
}
