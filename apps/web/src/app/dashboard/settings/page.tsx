'use client';

import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { ScoreBandsScreen } from './components/ScoreBandsScreen';
import { useDashboardUser } from '@/shared/hooks';
import { canManageScoreBands } from '@/utils/access';

export default function SettingsPage() {
  const user = useDashboardUser();

  if (!canManageScoreBands(user.role)) {
    return (
      <PageHeader
        title="Settings"
        description="Only the director can change school rules."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Quiet rules the whole school runs on. Change them rarely."
      />
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[13px] font-medium text-muted">Pay later</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight">
            7 days
          </p>
          <p className="mt-1 text-sm text-muted">
            A group seat may start before tuition is collected.
          </p>
        </Card>
        <Card>
          <p className="text-[13px] font-medium text-muted">
            Certificate attendance
          </p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight">80%</p>
          <p className="mt-1 text-sm text-muted">
            Excused sessions count as attended.
          </p>
        </Card>
        <Card>
          <p className="text-[13px] font-medium text-muted">Private hours</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight">12 mo</p>
          <p className="mt-1 text-sm text-muted">
            Unused packages expire unless you extend them.
          </p>
        </Card>
      </div>
      <ScoreBandsScreen />
    </>
  );
}
