'use client';

import { PageHeader } from '@/components/PageHeader';
import { WorkspaceScreen } from '@/components/WorkspaceScreen';
import { useDashboardUser } from '@/shared/hooks';
import { isStaff } from '@/utils/access';

export default function CertificatesPage() {
  const user = useDashboardUser();
  if (!isStaff(user.role)) {
    return <PageHeader title="Certificates" />;
  }

  return (
    <WorkspaceScreen
      title="Certificates"
      description="A certificate is earned, not printed at will. Completing a class does not change level by itself."
      steps={[
        {
          title: 'Finish the enrollment',
          body: 'Status must be completed, not dropped.',
        },
        {
          title: 'Attend enough',
          body: 'At least 80% of scheduled sessions. Excused counts as attended for this ratio.',
        },
        {
          title: 'Pass the report',
          body: 'The teacher’s end-of-term report must mark a pass.',
        },
        {
          title: 'Issue once',
          body: 'The PDF is unique. Only admin can revoke it. Families can download their copy.',
        },
      ]}
      note="A recommended next level still needs approval before the student’s official level moves."
      action={{ href: '/dashboard/students', label: 'Open a student file' }}
    />
  );
}
