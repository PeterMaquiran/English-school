'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser } from '@/shared/hooks';
import {
  classesRepository,
  type LessonSessionDetail,
  type MarkAttendanceInput,
} from '@/module/classes';
import { isStaff } from '@/utils/access';
import {
  formatAttendanceStatus,
  formatDateTime,
  formatSessionStatus,
} from '@/utils/format';
import { getApiErrorMessage } from '@/utils/api-error-message';

export function SessionDetailScreen({ sessionId }: { sessionId: string }) {
  const user = useDashboardUser();
  const [session, setSession] = useState<LessonSessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void classesRepository.getSession(sessionId).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.isErr()) {
        setError(getApiErrorMessage(result.error));
        return;
      }
      setSession(result.value.data);
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function mark(
    studentId: string,
    status: MarkAttendanceInput['status'],
  ) {
    setPending(true);
    const result = await classesRepository.markAttendance(sessionId, {
      studentId,
      status,
    });
    setPending(false);
    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return;
    }
    setError(null);
    setSession(result.value.data);
  }

  async function setStatus(status: 'completed' | 'cancelled') {
    setPending(true);
    const result = await classesRepository.updateSessionStatus(sessionId, {
      status,
    });
    setPending(false);
    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return;
    }
    setError(null);
    setSession((current) =>
      current ? { ...current, status: result.value.data.status } : current,
    );
  }

  if (error && !session) {
    return (
      <>
        <PageHeader title="Lesson" />
        <Notice>{error}</Notice>
      </>
    );
  }

  if (!session) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const canMark =
    isStaff(user.role) &&
    session.status !== 'cancelled' &&
    (!session.attendanceLocked || user.role === 'admin');

  return (
    <>
      <PageHeader
        eyebrow={session.courseName ?? 'Lesson'}
        title={formatDateTime(session.startsAt)}
        description={`${session.teacherName}${
          session.roomNumber ? ` · Room ${session.roomNumber}` : ''
        }`}
      />
      <p className="mb-6 text-sm text-muted">
        {formatSessionStatus(session.status)}
        {session.attendanceLocked ? ' · Attendance locked' : ''}
      </p>
      {session.batchId ? (
        <p className="mb-6 text-sm">
          <Link
            href={`/dashboard/classes/batches/${session.batchId}`}
            className="text-accent"
          >
            Class roster
          </Link>
        </p>
      ) : null}
      {error ? (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      ) : null}
      {session.status === 'scheduled' && isStaff(user.role) ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              void setStatus('completed');
            }}
          >
            Mark class done
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              void setStatus('cancelled');
            }}
          >
            Cancel this day
          </Button>
        </div>
      ) : null}
      <Card className="p-0">
        {session.roster.length === 0 ? (
          <EmptyState
            title="No one to mark"
            description="Seat students in the class first."
          />
        ) : (
          <ul className="divide-y divide-line">
            {session.roster.map((row) => (
              <li
                key={row.studentId}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/dashboard/students/${row.studentId}`}
                    className="text-[15px] font-medium hover:underline"
                  >
                    {row.studentName}
                  </Link>
                  <p className="text-sm text-muted">
                    {formatAttendanceStatus(row.status)}
                  </p>
                </div>
                {canMark ? (
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['present', 'Present'],
                        ['absent', 'Absent'],
                        ['excused', 'Excused'],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        type="button"
                        variant={row.status === value ? 'primary' : 'secondary'}
                        disabled={pending}
                        onClick={() => {
                          void mark(row.studentId, value);
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
