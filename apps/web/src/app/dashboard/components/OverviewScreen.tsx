'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser } from '@/shared/hooks';
import { studentsRepository, type Student } from '@/module/students';
import { canManageStudents, isStaff } from '@/utils/access';
import { firstName, greetingForNow } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/api-error-message';

export function OverviewScreen() {
  const user = useDashboardUser();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStaff(user.role)) {
      return;
    }
    let cancelled = false;
    void studentsRepository.list().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.isErr()) {
        setError(getApiErrorMessage(result.error));
        return;
      }
      setStudents(result.value.data);
    });
    return () => {
      cancelled = true;
    };
  }, [user.role]);

  if (!isStaff(user.role)) {
    return (
      <PageHeader
        title={`${greetingForNow()}, ${firstName(user.name)}.`}
        description="Your timetable, homework, and invoices will live here."
      />
    );
  }

  const total = students?.length ?? null;
  const awaiting = students?.filter((row) => !row.cefrLevel).length ?? null;
  const privateHours =
    students?.reduce((sum, row) => sum + row.lessonCreditsRemaining, 0) ?? null;

  return (
    <>
      <PageHeader
        title={`${greetingForNow()}, ${firstName(user.name)}.`}
        description="Enroll a family, place them on the scale, then sell a group seat or private hours."
      />
      {error ? (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          href="/dashboard/students"
          label="Students"
          value={total === null ? '—' : String(total)}
          hint="People on roll"
        />
        <Stat
          href="/dashboard/placement"
          label="Need a placement"
          value={awaiting === null ? '—' : String(awaiting)}
          hint="No confirmed level yet"
        />
        <Stat
          href="/dashboard/private"
          label="Private hours"
          value={privateHours === null ? '—' : String(privateHours)}
          hint="Credits held by families"
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-[13px] font-medium text-muted">
            New group student
          </p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight">
            From front desk to first class
          </h2>
          <ol className="mt-4 space-y-2 text-[15px] text-muted">
            <li>1. Create the student</li>
            <li>2. Record and confirm a placement</li>
            <li>3. Seat them in a matching group class</li>
            <li>4. Collect tuition, then take attendance</li>
          </ol>
          {canManageStudents(user.role) ? (
            <Link href="/dashboard/students" className="mt-6 inline-block">
              <Button type="button">Enroll a student</Button>
            </Link>
          ) : null}
        </Card>
        <Card>
          <p className="text-[13px] font-medium text-muted">Private package</p>
          <h2 className="mt-2 text-[22px] font-semibold tracking-tight">
            Sell hours, then book the teacher
          </h2>
          <ol className="mt-4 space-y-2 text-[15px] text-muted">
            <li>1. Place the student</li>
            <li>2. Invoice a package of hours</li>
            <li>3. Book sessions against availability</li>
            <li>4. Completed lessons use the hours</li>
          </ol>
          <Link href="/dashboard/classes" className="mt-6 inline-block">
            <Button type="button" variant="secondary">
              Open group classes
            </Button>
          </Link>
        </Card>
      </div>
    </>
  );
}

function Stat({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="h-full transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <p className="mt-3 text-[32px] font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </Card>
    </Link>
  );
}
