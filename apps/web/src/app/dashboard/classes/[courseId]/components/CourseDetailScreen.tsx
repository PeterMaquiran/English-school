'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CefrBadge } from '@/components/CefrBadge';
import { EmptyState } from '@/components/EmptyState';
import { Field, Input, Select } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser } from '@/shared/hooks';
import {
  classesRepository,
  type Batch,
  type Course,
  type Teacher,
} from '@/module/classes';
import { canManageStudents } from '@/utils/access';
import { formatDate, formatMoney } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/api-error-message';

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

export function CourseDetailScreen({ courseId }: { courseId: string }) {
  const user = useDashboardUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      classesRepository.getCourse(courseId),
      classesRepository.listBatches(courseId),
      classesRepository.listTeachers(),
    ]).then(([courseResult, batchResult, teacherResult]) => {
      if (cancelled) {
        return;
      }
      if (courseResult.isErr()) {
        setError(getApiErrorMessage(courseResult.error));
        return;
      }
      setCourse(courseResult.value.data);
      setBatches(batchResult.isOk() ? batchResult.value.data : []);
      setTeachers(teacherResult.isOk() ? teacherResult.value.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (error && !course) {
    return (
      <>
        <PageHeader title="Course" />
        <Notice>{error}</Notice>
      </>
    );
  }

  if (!course) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Group course"
        title={course.name}
        description={`${course.specialization} · ${formatMoney(course.tuitionAmount, course.currency)} a seat`}
      />
      <div className="mb-6">
        <CefrBadge level={course.cefrLevel} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-0">
          {batches.length === 0 ? (
            <EmptyState
              title="No class running"
              description="Open a cohort with a teacher, dates, and a room or Zoom link."
            />
          ) : (
            <ul className="divide-y divide-line">
              {batches.map((batch) => (
                <li key={batch.id}>
                  <Link
                    href={`/dashboard/classes/batches/${batch.id}`}
                    className="block px-6 py-4 hover:bg-[#fafafa]"
                  >
                    <p className="text-[15px] font-medium">
                      {batch.scheduleLabel}
                    </p>
                    <p className="text-sm text-muted">
                      {batch.teacherName} · {formatDate(batch.startDate)} –{' '}
                      {formatDate(batch.endDate)} · {batch.seatsTaken}/
                      {batch.capacity} seats
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canManageStudents(user.role) ? (
          <OpenBatchCard
            course={course}
            teachers={teachers}
            onCreated={(batch) => setBatches([...batches, batch])}
          />
        ) : null}
      </div>
    </>
  );
}

function OpenBatchCard({
  course,
  teachers,
  onCreated,
}: {
  course: Course;
  teachers: Teacher[];
  onCreated: (batch: Batch) => void;
}) {
  const eligibleTeachers = teachers.filter((teacher) =>
    teacher.specializations.some(
      (item) => item.toLowerCase() === course.specialization.toLowerCase(),
    ),
  );
  const [teacherId, setTeacherId] = useState('');
  const selectedTeacherId = teacherId || eligibleTeachers[0]?.id || '';
  const [weekdays, setWeekdays] = useState<number[]>([2, 4]);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [roomNumber, setRoomNumber] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState(String(course.defaultCapacity));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedTeacher = eligibleTeachers.find(
    (teacher) => teacher.id === selectedTeacherId,
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const hasPlace =
      Boolean(roomNumber.trim()) ||
      Boolean(meetingUrl.trim()) ||
      Boolean(selectedTeacher?.zoomPersonalLink);
    if (!hasPlace) {
      setError(
        'Add a room or a meeting link, or save a Zoom link on the teacher first.',
      );
      return;
    }
    if (weekdays.length === 0) {
      setError('Pick at least one weekday.');
      return;
    }
    setPending(true);
    const result = await classesRepository.createBatch(course.id, {
      teacherId: selectedTeacherId,
      weekdays,
      startTime: startTime.slice(0, 5),
      endTime: endTime.slice(0, 5),
      roomNumber: roomNumber.trim() || null,
      meetingUrl: meetingUrl.trim() || undefined,
      startDate: startDate,
      endDate: endDate,
      capacity: Number(capacity),
    });
    setPending(false);
    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return;
    }
    setError(null);
    onCreated(result.value.data);
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">Open a class</h2>
      <p className="mt-1 text-sm text-muted">
        Need a teacher who teaches {course.specialization}. Fill a room, a
        meeting link, or use the teacher’s Zoom link.
      </p>
      {eligibleTeachers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Nobody on the books teaches {course.specialization} yet.{' '}
          <Link href="/dashboard/teachers" className="text-accent">
            Teachers
          </Link>
        </p>
      ) : (
        <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
          <Field label="Teacher">
            <Select
              value={selectedTeacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              required
            >
              {eligibleTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </Select>
          </Field>
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-[13px] font-medium text-muted">Days</legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((day) => {
                const checked = weekdays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={`inline-flex h-9 cursor-pointer items-center rounded-full px-3 text-sm ${
                      checked
                        ? 'bg-accent text-white'
                        : 'bg-[#f5f5f7] text-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        setWeekdays((current) =>
                          checked
                            ? current.filter((item) => item !== day.value)
                            : [...current, day.value],
                        );
                      }}
                    />
                    {day.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <Input
                type="time"
                step={60}
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
              />
            </Field>
            <Field label="Ends">
              <Input
                type="time"
                step={60}
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                required
              />
            </Field>
          </div>
          <Field label="Room">
            <Input
              value={roomNumber}
              onChange={(event) => setRoomNumber(event.target.value)}
              placeholder="12"
            />
          </Field>
          <Field label="Meeting link">
            <Input
              type="url"
              value={meetingUrl}
              onChange={(event) => setMeetingUrl(event.target.value)}
              placeholder="https://zoom.us/…"
            />
          </Field>
          <Field label="First day">
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </Field>
          <Field label="Last day">
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </Field>
          <Field label="Seats">
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              required
            />
          </Field>
          {error ? <Notice>{error}</Notice> : null}
          <Button type="submit" disabled={pending} className="self-start">
            {pending ? 'Saving…' : 'Open class'}
          </Button>
        </form>
      )}
    </Card>
  );
}
