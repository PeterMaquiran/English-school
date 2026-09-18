import { CourseDetailScreen } from './components/CourseDetailScreen';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return <CourseDetailScreen courseId={courseId} />;
}
