'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser } from '@/shared/hooks';
import { classesRepository, type LessonSession } from '@/module/classes';
import { isStaff } from '@/utils/access';
import { formatDateTime, formatSessionStatus } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/api-error-message';

export function CalendarScreen() {
  const user = useDashboardUser();
  const [sessions, setSessions] = useState<LessonSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStaff(user.role)) {
      return;
    }
    let cancelled = false;
    void classesRepository.listSessions().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.isErr()) {
        setError(getApiErrorMessage(result.error));
        return;
      }
      setSessions(result.value.data);
    });
    return () => {
      cancelled = true;
    };
  }, [user.role]);

  if (!isStaff(user.role)) {
    return (
      <PageHeader title="Calendar" description="Your lessons will show here." />
    );
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Each lesson is one occurrence. Open it to take attendance."
      />
      {error ? (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      ) : null}
      <Card className="p-0">
        {sessions === null ? (
          <p className="px-6 py-8 text-sm text-muted">Loading…</p>
        ) : sessions.length === 0 ? (
          <EmptyState
            title="Nothing on the next four weeks"
            description="Open a group class with weekdays and times. Lessons appear here automatically."
          />
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/dashboard/calendar/${session.id}`}
                  className="block px-6 py-4 hover:bg-[#fafafa]"
                >
                  <p className="text-[15px] font-medium">
                    {session.courseName ?? 'Lesson'} ·{' '}
                    {formatSessionStatus(session.status)}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDateTime(session.startsAt)} · {session.teacherName}
                    {session.roomNumber ? ` · Room ${session.roomNumber}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
