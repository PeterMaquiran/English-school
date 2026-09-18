'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser } from '@/shared/hooks';
import { studentsRepository, type Student } from '@/module/students';
import { canManageStudents, isStaff } from '@/utils/access';
import { getApiErrorMessage } from '@/utils/api-error-message';

export default function PlacementPage() {
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
    return <PageHeader title="Placement" />;
  }

  const awaiting = students?.filter((row) => !row.cefrLevel) ?? [];

  return (
    <>
      <PageHeader
        title="Placement"
        description="A diagnostic recommends a level. Nothing changes until front desk confirms it. Levels never drop on their own."
      />
      {error ? (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-0">
          <div className="px-6 pt-6">
            <h2 className="text-lg font-semibold tracking-tight">
              Waiting for a first level
            </h2>
            <p className="mt-1 text-sm text-muted">
              Open the file, record scores, then confirm.
            </p>
          </div>
          {students === null ? (
            <p className="p-6 text-sm text-muted">Loading…</p>
          ) : awaiting.length === 0 ? (
            <EmptyState
              title="Everyone has a level"
              description="New enrollments will appear here until you confirm a diagnostic."
            />
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {awaiting.map((student) => (
                <li key={student.id}>
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa]"
                  >
                    <div>
                      <p className="text-[15px] font-medium">{student.name}</p>
                      <p className="text-sm text-muted">{student.email}</p>
                    </div>
                    <span className="text-[13px] text-accent">Place</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold tracking-tight">How it works</h2>
          <ol className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
            <li>Record listening, reading, writing, speaking, and overall.</li>
            <li>The overall score maps to a recommended level.</li>
            <li>Confirm only when you are ready to set the official level.</li>
            <li>
              A later test can raise the level. A downgrade needs an admin
              reason.
            </li>
          </ol>
          {canManageStudents(user.role) ? (
            <Link href="/dashboard/students" className="mt-6 inline-block">
              <Button type="button" variant="secondary">
                Enroll someone first
              </Button>
            </Link>
          ) : null}
        </Card>
      </div>
    </>
  );
}
