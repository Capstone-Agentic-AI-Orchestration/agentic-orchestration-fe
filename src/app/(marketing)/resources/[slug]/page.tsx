import { ResourceInfoView } from "@/features/marketing/secondary/views/marketing-secondary-views";

export default async function ResourceInfoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ResourceInfoView slug={slug} />;
}
