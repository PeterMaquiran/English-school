import { BatchDetailScreen } from './components/BatchDetailScreen';

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  return <BatchDetailScreen batchId={batchId} />;
}
