'use client';

import { PageHeader } from '@/components/PageHeader';
import { WorkspaceScreen } from '@/components/WorkspaceScreen';
import { useDashboardUser } from '@/shared/hooks';
import { isStaff } from '@/utils/access';

export default function CalendarPage() {
  const user = useDashboardUser();
  if (!isStaff(user.role)) {
    return <PageHeader title="Calendar" />;
  }

  return (
    <WorkspaceScreen
      title="Calendar"
      description="Every lesson is one occurrence: who teaches, who attends, where it happens, and whether it ran."
      steps={[
        {
          title: 'Group timetable',
          body: 'Sessions are generated from the batch schedule, skipping school holidays.',
        },
        {
          title: 'Private bookings',
          body: 'Booked one by one against remaining hours and teacher availability.',
        },
        {
          title: 'Attendance',
          body: 'Present, absent, or excused. Unmarked rows become absent a day after class ends.',
        },
        {
          title: 'Reschedule',
          body: 'Private, with 24 hours’ notice: cancel without using hours, then book a new slot.',
        },
      ]}
      action={{ href: '/dashboard/classes', label: 'Start from group classes' }}
    />
  );
}
