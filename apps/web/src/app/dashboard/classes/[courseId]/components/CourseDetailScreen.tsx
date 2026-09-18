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
  const [teacherId, setTeacherId] = useState('');
  const selectedTeacherId = teacherId || teachers[0]?.id || '';
  const [scheduleLabel, setScheduleLabel] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState(String(course.defaultCapacity));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedTeacher = teachers.find(
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
    setPending(true);
    const result = await classesRepository.createBatch(course.id, {
      teacherId: selectedTeacherId,
      scheduleLabel: scheduleLabel.trim(),
      roomNumber: roomNumber.trim() || null,
      meetingUrl: meetingUrl.trim() || undefined,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      capacity: Number(capacity),
    });
    setPending(false);
    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return;
    }
    setError(null);
    setScheduleLabel('');
    onCreated(result.value.data);
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">Open a class</h2>
      <p className="mt-1 text-sm text-muted">
        Need a teacher who teaches {course.specialization}. Fill a room, a
        meeting link, or use the teacher’s Zoom link.
      </p>
      {teachers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Hire a teacher first, then come back.{' '}
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
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Timetable">
            <Input
              value={scheduleLabel}
              onChange={(event) => setScheduleLabel(event.target.value)}
              required
              placeholder="Tue & Thu 18:00"
            />
          </Field>
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
              placeholder="https://"
            />
          </Field>
          <Field label="Starts">
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </Field>
          <Field label="Ends">
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
