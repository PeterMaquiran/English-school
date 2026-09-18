'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CefrBadge } from '@/components/CefrBadge';
import { CefrSelect } from '@/components/CefrSelect';
import { EmptyState } from '@/components/EmptyState';
import { Field, Input } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser } from '@/shared/hooks';
import {
  classesRepository,
  type Course,
  type CreateCourseInput,
} from '@/module/classes';
import { canManageStudents, isStaff } from '@/utils/access';
import { formatMoney } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/api-error-message';
import type { CefrLevel } from '@english-school/shared';

export function ClassesScreen() {
  const user = useDashboardUser();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStaff(user.role)) {
      return;
    }
    let cancelled = false;
    void classesRepository.listCourses().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.isErr()) {
        setError(getApiErrorMessage(result.error));
        return;
      }
      setCourses(result.value.data.filter((row) => row.courseType === 'group'));
    });
    return () => {
      cancelled = true;
    };
  }, [user.role]);

  if (!isStaff(user.role)) {
    return <PageHeader title="Group classes" />;
  }

  return (
    <>
      <PageHeader
        title="Group classes"
        description="A course is the product. A class is the running cohort with a teacher, a timetable, and a limited number of seats."
      />
      {error ? (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-0">
          {courses === null ? (
            <p className="p-6 text-sm text-muted">Loading…</p>
          ) : courses.length === 0 ? (
            <EmptyState
              title="No group courses yet"
              description="Create a course, then open a class with a teacher and a timetable."
            />
          ) : (
            <ul className="divide-y divide-line">
              {courses.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/dashboard/classes/${course.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa]"
                  >
                    <div>
                      <p className="text-[15px] font-medium">{course.name}</p>
                      <p className="text-sm text-muted">
                        {course.specialization} · up to {course.defaultCapacity}{' '}
                        seats ·{' '}
                        {formatMoney(course.tuitionAmount, course.currency)}
                      </p>
                    </div>
                    <CefrBadge level={course.cefrLevel} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canManageStudents(user.role) ? (
          <CreateCourseCard
            onCreated={(course) => setCourses([course, ...(courses ?? [])])}
          />
        ) : (
          <Card>
            <p className="text-[15px] text-muted">
              Front desk opens courses and seats students. You can still open a
              class to see who is in it.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}

function CreateCourseCard({
  onCreated,
}: {
  onCreated: (course: Course) => void;
}) {
  const [name, setName] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CefrLevel | string>('A2');
  const [capacity, setCapacity] = useState('12');
  const [tuition, setTuition] = useState('480');
  const [specialization, setSpecialization] = useState('General');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const input: CreateCourseInput = {
      name: name.trim(),
      courseType: 'group',
      cefrLevel: cefrLevel as CefrLevel,
      defaultCapacity: Number(capacity),
      tuitionAmount: Number(tuition),
      specialization: specialization.trim() || 'General',
    };
    const result = await classesRepository.createCourse(input);
    setPending(false);
    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return;
    }
    setError(null);
    setName('');
    onCreated(result.value.data);
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">New course</h2>
      <p className="mt-1 text-sm text-muted">
        Families buy a seat at this level, not a pool of hours.
      </p>
      <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
        <Field label="Name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="B1 Evening"
          />
        </Field>
        <Field label="Level">
          <CefrSelect value={cefrLevel} onChange={setCefrLevel} />
        </Field>
        <Field label="Specialization">
          <Input
            value={specialization}
            onChange={(event) => setSpecialization(event.target.value)}
            required
          />
        </Field>
        <Field label="Default seats">
          <Input
            type="number"
            min={1}
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            required
          />
        </Field>
        <Field label="Tuition">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={tuition}
            onChange={(event) => setTuition(event.target.value)}
            required
          />
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Create course'}
        </Button>
      </form>
    </Card>
  );
}
