import { SessionDetailScreen } from './components/SessionDetailScreen';

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <SessionDetailScreen sessionId={sessionId} />;
}
