'use client';

import { PageHeader } from '@/components/PageHeader';
import { WorkspaceScreen } from '@/components/WorkspaceScreen';
import { useDashboardUser } from '@/shared/hooks';
import { canManageStudents } from '@/utils/access';

export default function BillingPage() {
  const user = useDashboardUser();
  if (!canManageStudents(user.role)) {
    return (
      <PageHeader
        title="Billing"
        description="Invoices are handled by front desk and admin."
      />
    );
  }

  return (
    <WorkspaceScreen
      title="Billing"
      description="Group tuition is a seat. Private is hours. Draft invoices do nothing until you open them. Paid invoices unlock the class or the credits."
      steps={[
        {
          title: 'Open an invoice',
          body: 'For a group seat this reserves capacity. For a package it waits for payment.',
        },
        {
          title: 'Collect in full',
          body: 'Record the full amount. Partial payments are not used in this version.',
        },
        {
          title: 'Pay later',
          body: 'Front desk may activate a group seat for up to seven days before payment.',
        },
        {
          title: 'Reminders',
          body: 'Families hear before the due date, daily when overdue, and when hours run low.',
        },
      ]}
      note="Refunds are admin only. A paid invoice is not edited in place."
      action={{ href: '/dashboard/students', label: 'Pick a student' }}
    />
  );
}
