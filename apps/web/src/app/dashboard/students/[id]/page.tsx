import { StudentDetailScreen } from './components/StudentDetailScreen';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentDetailScreen studentId={id} />;
}
