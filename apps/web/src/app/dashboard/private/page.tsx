'use client';

import { PageHeader } from '@/components/PageHeader';
import { WorkspaceScreen } from '@/components/WorkspaceScreen';
import { useDashboardUser } from '@/shared/hooks';
import { isStaff } from '@/utils/access';

export default function PrivatePage() {
  const user = useDashboardUser();
  if (!isStaff(user.role)) {
    return <PageHeader title="Private lessons" />;
  }

  return (
    <WorkspaceScreen
      title="Private lessons"
      description="Families buy a package of hours. Each completed lesson uses those hours. Unused hours expire after 12 months unless you extend them."
      steps={[
        {
          title: 'Sell a package',
          body: 'Invoice the hours. Credits appear on the student only after the invoice is paid.',
        },
        {
          title: 'Book against the teacher',
          body: 'Match specialization, availability, and a 15-minute buffer between rooms.',
        },
        {
          title: 'Complete the lesson',
          body: 'Marking a session complete records attendance and deducts the duration.',
        },
        {
          title: 'Late cancel',
          body: 'Less than 24 hours’ notice, or a no-show, uses the hours as if the lesson ran.',
        },
      ]}
      note="You cannot book a private lesson if remaining hours are shorter than the session."
      action={{ href: '/dashboard/billing', label: 'Go to billing' }}
    />
  );
}
