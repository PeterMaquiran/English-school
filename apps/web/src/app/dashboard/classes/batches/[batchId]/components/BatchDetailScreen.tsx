'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CefrBadge } from '@/components/CefrBadge';
import { EmptyState } from '@/components/EmptyState';
import { Field, Select, Textarea } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser } from '@/shared/hooks';
import {
  classesRepository,
  type Batch,
  type Enrollment,
} from '@/module/classes';
import { studentsRepository, type Student } from '@/module/students';
import { canManageStudents } from '@/utils/access';
import { formatDate, formatMoney, formatSeatStatus } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/api-error-message';
import { groupCourseLevelFit } from '@english-school/shared';

export function BatchDetailScreen({ batchId }: { batchId: string }) {
  const user = useDashboardUser();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [seats, setSeats] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  function applySeat(updated: Enrollment) {
    setSeats((current) => {
      const next = current.filter((row) => row.id !== updated.id);
      return [...next, updated].sort((a, b) =>
        a.studentName.localeCompare(b.studentName),
      );
    });
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      classesRepository.getBatch(batchId),
      classesRepository.listBatchEnrollments(batchId),
      studentsRepository.list(),
    ]).then(([batchResult, seatResult, studentResult]) => {
      if (cancelled) {
        return;
      }
      if (batchResult.isErr()) {
        setError(getApiErrorMessage(batchResult.error));
        return;
      }
      setBatch(batchResult.value.data);
      setSeats(seatResult.isOk() ? seatResult.value.data : []);
      setStudents(studentResult.isOk() ? studentResult.value.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  if (error && !batch) {
    return (
      <>
        <PageHeader title="Class" />
        <Notice>{error}</Notice>
      </>
    );
  }

  if (!batch) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const taken = seats.filter(
    (row) => row.status === 'pending_payment' || row.status === 'active',
  ).length;

  return (
    <>
      <PageHeader
        eyebrow={batch.courseName}
        title={batch.scheduleLabel}
        description={`${batch.teacherName} · ${formatDate(batch.startDate)} – ${formatDate(batch.endDate)}`}
      />
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
        <CefrBadge level={batch.cefrLevel} />
        <span>
          {taken}/{batch.capacity} seats
        </span>
        <span>{formatMoney(batch.tuitionAmount, batch.currency)}</span>
        {batch.roomNumber ? <span>Room {batch.roomNumber}</span> : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-0">
          {seats.length === 0 ? (
            <EmptyState
              title="No one seated yet"
              description="Place a student, then give them a seat. Tuition opens automatically."
            />
          ) : (
            <ul className="divide-y divide-line">
              {seats.map((seat) => (
                <li
                  key={seat.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/dashboard/students/${seat.studentId}`}
                      className="text-[15px] font-medium hover:underline"
                    >
                      {seat.studentName}
                    </Link>
                    <p className="text-sm text-muted">
                      {formatSeatStatus(seat.status)}
                      {seat.invoice
                        ? ` · ${formatMoney(seat.invoice.amount, seat.invoice.currency)}`
                        : ''}
                    </p>
                  </div>
                  {canManageStudents(user.role) &&
                  seat.invoice &&
                  (seat.invoice.paymentStatus === 'open' ||
                    seat.invoice.paymentStatus === 'overdue') ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        void classesRepository
                          .collectInvoice(seat.invoice!.id)
                          .then((result) => {
                            if (result.isOk()) {
                              applySeat(result.value.data);
                            } else {
                              setError(getApiErrorMessage(result.error));
                            }
                          });
                      }}
                    >
                      Collect tuition
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canManageStudents(user.role) ? (
          <SeatCard
            batch={batch}
            students={students}
            seatedIds={
              new Set(
                seats
                  .filter(
                    (row) =>
                      row.status === 'pending_payment' ||
                      row.status === 'active',
                  )
                  .map((row) => row.studentId),
              )
            }
            onSeated={(enrollment) => applySeat(enrollment)}
          />
        ) : null}
      </div>
      {error ? (
        <div className="mt-4">
          <Notice>{error}</Notice>
        </div>
      ) : null}
    </>
  );
}

function SeatCard({
  batch,
  students,
  seatedIds,
  onSeated,
}: {
  batch: Batch;
  students: Student[];
  seatedIds: Set<string>;
  onSeated: (enrollment: Enrollment) => void;
}) {
  const candidates = students.filter(
    (row) => row.cefrLevel && !seatedIds.has(row.id),
  );
  const [studentId, setStudentId] = useState('');
  const [payLater, setPayLater] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected =
    candidates.find((row) => row.id === studentId) ?? candidates[0];
  const selectedId = selected?.id ?? '';
  const fit =
    selected?.cefrLevel &&
    groupCourseLevelFit(selected.cefrLevel, batch.cefrLevel);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await classesRepository.seatStudent(batch.id, {
      studentId: selectedId,
      payLater,
      overrideReason: fit === 'one_above' ? overrideReason : undefined,
    });
    setPending(false);
    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return;
    }
    setError(null);
    onSeated(result.value.data);
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">Give a seat</h2>
      <p className="mt-1 text-sm text-muted">
        Same level, or one above with a reason. Payment activates the seat
        unless you allow seven days.
      </p>
      {candidates.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Everyone placed is already seated, or nobody has a confirmed level
          yet.
        </p>
      ) : (
        <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
          <Field label="Student">
            <Select
              value={selectedId}
              onChange={(event) => setStudentId(event.target.value)}
              required
            >
              {candidates.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.cefrLevel})
                </option>
              ))}
            </Select>
          </Field>
          {fit === 'blocked' ? (
            <Notice>
              This class is not this student’s level, and not one step above.
            </Notice>
          ) : null}
          {fit === 'one_above' ? (
            <Field label="Why one level above?">
              <Textarea
                required
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
              />
            </Field>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={payLater}
              onChange={(event) => setPayLater(event.target.checked)}
            />
            Start now, collect within 7 days
          </label>
          {error ? <Notice>{error}</Notice> : null}
          <Button
            type="submit"
            disabled={pending || fit === 'blocked'}
            className="self-start"
          >
            {pending ? 'Saving…' : 'Seat student'}
          </Button>
        </form>
      )}
    </Card>
  );
}
