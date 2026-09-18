'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Field, Input } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser } from '@/shared/hooks';
import { classesRepository, type Teacher } from '@/module/classes';
import { canManageStudents, isStaff } from '@/utils/access';
import { getApiErrorMessage } from '@/utils/api-error-message';

export default function TeachersPage() {
  const user = useDashboardUser();
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStaff(user.role)) {
      return;
    }
    let cancelled = false;
    void classesRepository.listTeachers().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.isErr()) {
        setError(getApiErrorMessage(result.error));
        return;
      }
      setTeachers(result.value.data);
    });
    return () => {
      cancelled = true;
    };
  }, [user.role]);

  if (!isStaff(user.role)) {
    return <PageHeader title="Teachers" />;
  }

  return (
    <>
      <PageHeader
        title="Teachers"
        description="A class can only be assigned to someone who teaches that specialization."
      />
      {error ? (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-0">
          {teachers === null ? (
            <p className="p-6 text-sm text-muted">Loading…</p>
          ) : teachers.length === 0 ? (
            <EmptyState
              title="No teachers yet"
              description="Hire someone before you open a class."
            />
          ) : (
            <ul className="divide-y divide-line">
              {teachers.map((teacher) => (
                <li key={teacher.id} className="px-6 py-4">
                  <p className="text-[15px] font-medium">{teacher.name}</p>
                  <p className="text-sm text-muted">
                    {teacher.specializations.join(', ')}
                    {teacher.isNative ? ' · Native' : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canManageStudents(user.role) ? (
          <HireCard
            onHired={(teacher) => setTeachers([teacher, ...(teachers ?? [])])}
          />
        ) : null}
      </div>
    </>
  );
}

function HireCard({ onHired }: { onHired: (teacher: Teacher) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specializations, setSpecializations] = useState('General');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await classesRepository.hireTeacher({
      name: name.trim(),
      email: email.trim(),
      password,
      specializations: specializations
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setPending(false);
    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return;
    }
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
    onHired(result.value.data);
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">Hire a teacher</h2>
      <p className="mt-1 text-sm text-muted">
        Creates their login. Availability and the timetable come next.
      </p>
      <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
        <Field label="Full name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Temporary password">
          <Input
            type="password"
            value={password}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <Field
          label="Specializations"
          hint="Comma separated. Must match the course."
        >
          <Input
            value={specializations}
            onChange={(event) => setSpecializations(event.target.value)}
            required
          />
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Hire'}
        </Button>
      </form>
    </Card>
  );
}
