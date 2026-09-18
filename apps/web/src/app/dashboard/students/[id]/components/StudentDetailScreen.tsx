'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CefrBadge } from '@/components/CefrBadge';
import { CefrSelect } from '@/components/CefrSelect';
import { EmptyState } from '@/components/EmptyState';
import { Field, Input, Textarea } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser, usePlacement, useStudents } from '@/shared/hooks';
import {
  placementRepository,
  type PlacementTest,
  type StudentLevelHistory,
} from '@/module/placement';
import { classesRepository, type Enrollment } from '@/module/classes';
import { studentsRepository, type Student } from '@/module/students';
import { canAdjustCefr, canManageStudents } from '@/utils/access';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatSeatStatus,
  optionalNumber,
  toDateTimeLocalValue,
} from '@/utils/format';
import { getApiErrorMessage } from '@/utils/api-error-message';
import type { CefrLevel } from '@english-school/shared';

export function StudentDetailScreen({ studentId }: { studentId: string }) {
  const user = useDashboardUser();
  const studentsApi = useStudents();
  const placementApi = usePlacement();
  const [student, setStudent] = useState<Student | null>(null);
  const [tests, setTests] = useState<PlacementTest[]>([]);
  const [history, setHistory] = useState<StudentLevelHistory[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function refresh() {
    const [profile, testsResult, historyResult, enrollResult] =
      await Promise.all([
        studentsRepository.getById(studentId),
        placementRepository.listTests(studentId),
        placementRepository.listLevelHistory(studentId),
        classesRepository.listStudentEnrollments(studentId),
      ]);
    if (profile.isErr()) {
      setLoadError(getApiErrorMessage(profile.error));
      return;
    }
    setLoadError(null);
    setStudent(profile.value.data);
    setTests(testsResult.isOk() ? testsResult.value.data : []);
    setHistory(historyResult.isOk() ? historyResult.value.data : []);
    setEnrollments(enrollResult.isOk() ? enrollResult.value.data : []);
  }

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      studentsRepository.getById(studentId),
      placementRepository.listTests(studentId),
      placementRepository.listLevelHistory(studentId),
      classesRepository.listStudentEnrollments(studentId),
    ]).then(([profile, testsResult, historyResult, enrollResult]) => {
      if (cancelled) {
        return;
      }
      if (profile.isErr()) {
        setLoadError(getApiErrorMessage(profile.error));
        return;
      }
      setLoadError(null);
      setStudent(profile.value.data);
      setTests(testsResult.isOk() ? testsResult.value.data : []);
      setHistory(historyResult.isOk() ? historyResult.value.data : []);
      setEnrollments(enrollResult.isOk() ? enrollResult.value.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (loadError && !student) {
    return (
      <>
        <PageHeader title="Student" />
        <Notice>{loadError}</Notice>
      </>
    );
  }

  if (!student) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Student"
        title={student.name}
        description={student.email}
      />
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
        <span>
          Level <CefrBadge level={student.cefrLevel} />
        </span>
        <span className="text-muted">
          Goal {student.targetLevel ?? 'not set'}
        </span>
        <span className="text-muted">
          Private hours {student.lessonCreditsRemaining}
        </span>
        <span className="text-muted">
          With us since {formatDate(student.createdAt)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {canManageStudents(user.role) ? (
          <TargetForm
            key={student.targetLevel ?? 'none'}
            pending={studentsApi.pending}
            error={studentsApi.error}
            current={student.targetLevel}
            onSave={async (targetLevel) => {
              const updated = await studentsApi.updateTargetLevel(student.id, {
                targetLevel,
              });
              if (updated) {
                setStudent(updated);
              }
            }}
          />
        ) : null}
        {canAdjustCefr(user.role) ? (
          <AdjustForm
            pending={studentsApi.pending}
            error={studentsApi.error}
            current={student.cefrLevel}
            onSave={async (input) => {
              const updated = await studentsApi.adminAdjustCefr(
                student.id,
                input,
              );
              if (updated) {
                setStudent(updated);
                await refresh();
              }
            }}
          />
        ) : null}
        {canManageStudents(user.role) ? (
          <RecordTestForm
            pending={placementApi.pending}
            error={placementApi.error}
            onSave={async (input) => {
              const created = await placementApi.recordTest(student.id, input);
              if (created) {
                await refresh();
              }
            }}
          />
        ) : null}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">Group seats</h2>
          {enrollments.length === 0 ? (
            <EmptyState
              title="Not in a class"
              description="After placement, seat them from Group classes."
            />
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {enrollments.map((seat) => (
                <li
                  key={seat.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/dashboard/classes/batches/${seat.batchId}`}
                      className="text-[15px] font-medium hover:underline"
                    >
                      {seat.batch?.courseName ?? 'Class'} ·{' '}
                      {seat.batch?.scheduleLabel ?? ''}
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
                              void refresh();
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
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">Diagnostics</h2>
          {tests.length === 0 ? (
            <EmptyState
              title="No diagnostic yet"
              description="Record scores, then confirm when the level should become official."
            />
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {tests.map((test) => (
                <li
                  key={test.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-[15px] font-medium">
                      Overall {test.overall} → {test.recommendedLevel}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDateTime(test.takenAt)}
                      {test.confirmedAt
                        ? ` · official since ${formatDateTime(test.confirmedAt)}`
                        : ' · waiting for confirmation'}
                    </p>
                    {test.notes ? (
                      <p className="mt-1 text-sm text-muted">{test.notes}</p>
                    ) : null}
                  </div>
                  {canManageStudents(user.role) && !test.confirmedAt ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={placementApi.pending}
                      onClick={() => {
                        void (async () => {
                          const updated = await placementApi.confirmTest(
                            test.id,
                          );
                          if (updated) {
                            await refresh();
                          }
                        })();
                      }}
                    >
                      Confirm level
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {placementApi.error ? (
            <div className="mt-3">
              <Notice>{placementApi.error}</Notice>
            </div>
          ) : null}
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Level changes
          </h2>
          {history.length === 0 ? (
            <EmptyState
              title="No changes yet"
              description="Confirmed placements and director corrections appear here."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {history.map((row) => (
                <li
                  key={row.id}
                  className="flex items-baseline justify-between gap-4"
                >
                  <p className="text-[15px]">
                    {row.fromLevel ?? '—'} → {row.toLevel}
                    <span className="ml-2 text-sm capitalize text-muted">
                      {row.source}
                    </span>
                  </p>
                  <p className="text-sm text-muted">
                    {formatDateTime(row.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function TargetForm({
  current,
  pending,
  error,
  onSave,
}: {
  current: CefrLevel | null;
  pending: boolean;
  error: string | null;
  onSave: (targetLevel: CefrLevel | null) => Promise<void>;
}) {
  const [value, setValue] = useState(current ?? '');

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">Goal</h2>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void onSave(value ? (value as CefrLevel) : null);
        }}
      >
        <Field label="Goal">
          <CefrSelect allowEmpty value={value} onChange={setValue} />
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Save goal'}
        </Button>
      </form>
    </Card>
  );
}

function AdjustForm({
  current,
  pending,
  error,
  onSave,
}: {
  current: CefrLevel | null;
  pending: boolean;
  error: string | null;
  onSave: (input: { toLevel: CefrLevel; reason: string }) => Promise<void>;
}) {
  const [toLevel, setToLevel] = useState<string>(current ?? 'A1');
  const [reason, setReason] = useState('');

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">Correct a level</h2>
      <p className="mt-1 text-sm text-muted">
        Use this only for a mistake, including a downgrade. A reason is
        required.
      </p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void onSave({ toLevel: toLevel as CefrLevel, reason });
        }}
      >
        <Field label="New level">
          <CefrSelect value={toLevel} onChange={setToLevel} />
        </Field>
        <Field label="Reason">
          <Textarea
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Apply'}
        </Button>
      </form>
    </Card>
  );
}

function RecordTestForm({
  pending,
  error,
  onSave,
}: {
  pending: boolean;
  error: string | null;
  onSave: (input: {
    takenAt: Date;
    overall: number;
    listening?: number | null;
    reading?: number | null;
    writing?: number | null;
    speaking?: number | null;
    recommendedLevel?: CefrLevel;
    notes?: string | null;
  }) => Promise<void>;
}) {
  const [takenAt, setTakenAt] = useState(toDateTimeLocalValue());
  const [overall, setOverall] = useState('');
  const [listening, setListening] = useState('');
  const [reading, setReading] = useState('');
  const [writing, setWriting] = useState('');
  const [speaking, setSpeaking] = useState('');
  const [recommendedLevel, setRecommendedLevel] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">New diagnostic</h2>
      <p className="mt-1 text-sm text-muted">
        Saving does not change their official level until you confirm.
      </p>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void onSave({
            takenAt: new Date(takenAt),
            overall: Number(overall),
            listening: optionalNumber(listening) ?? null,
            reading: optionalNumber(reading) ?? null,
            writing: optionalNumber(writing) ?? null,
            speaking: optionalNumber(speaking) ?? null,
            recommendedLevel: recommendedLevel
              ? (recommendedLevel as CefrLevel)
              : undefined,
            notes: notes.trim() || null,
          });
        }}
      >
        <Field label="Taken at">
          <Input
            type="datetime-local"
            required
            value={takenAt}
            onChange={(event) => setTakenAt(event.target.value)}
          />
        </Field>
        <Field label="Overall">
          <Input
            type="number"
            min={0}
            step="0.01"
            required
            value={overall}
            onChange={(event) => setOverall(event.target.value)}
          />
        </Field>
        <Field label="Listening">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={listening}
            onChange={(event) => setListening(event.target.value)}
          />
        </Field>
        <Field label="Reading">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={reading}
            onChange={(event) => setReading(event.target.value)}
          />
        </Field>
        <Field label="Writing">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={writing}
            onChange={(event) => setWriting(event.target.value)}
          />
        </Field>
        <Field label="Speaking">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={speaking}
            onChange={(event) => setSpeaking(event.target.value)}
          />
        </Field>
        <Field label="Recommended level">
          <CefrSelect
            allowEmpty
            emptyLabel="Use the school ranges"
            value={recommendedLevel}
            onChange={setRecommendedLevel}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
        </div>
        {error ? (
          <div className="sm:col-span-2">
            <Notice>{error}</Notice>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save diagnostic'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
