'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CefrBadge } from '@/components/CefrBadge';
import { CefrSelect } from '@/components/CefrSelect';
import { EmptyState } from '@/components/EmptyState';
import { Field, Input } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { useDashboardUser, useStudents } from '@/shared/hooks';
import {
  studentsRepository,
  type EnrollStudentInput,
  type Student,
} from '@/module/students';
import { canManageStudents, isStaff } from '@/utils/access';
import { getApiErrorMessage } from '@/utils/api-error-message';

export function StudentsScreen() {
  const user = useDashboardUser();
  const router = useRouter();
  const studentsApi = useStudents();
  const [rows, setRows] = useState<Student[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

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
        setLoadError(getApiErrorMessage(result.error));
        return;
      }
      setRows(result.value.data);
    });
    return () => {
      cancelled = true;
    };
  }, [user.role]);

  const visible = useMemo(() => {
    if (!rows) {
      return [];
    }
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.email.toLowerCase().includes(needle),
    );
  }, [query, rows]);

  if (!isStaff(user.role)) {
    return (
      <PageHeader
        title="Students"
        description="Only school staff can open the roll."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Students"
        description="Everyone on roll. Open a file to place them, set a goal, and keep the family moving."
      />
      {loadError ? (
        <div className="mb-4">
          <Notice>{loadError}</Notice>
        </div>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-0">
          <div className="border-b border-line p-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email"
            />
          </div>
          {rows === null && !loadError ? (
            <p className="p-6 text-sm text-muted">Loading…</p>
          ) : visible.length === 0 ? (
            <EmptyState
              title={rows?.length ? 'No match' : 'The roll is empty'}
              description={
                rows?.length
                  ? 'Try another name.'
                  : 'Enroll the first student from the form beside this list.'
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((student) => (
                <li key={student.id}>
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa]"
                  >
                    <div>
                      <p className="text-[15px] font-medium">{student.name}</p>
                      <p className="text-sm text-muted">{student.email}</p>
                    </div>
                    <CefrBadge level={student.cefrLevel} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {canManageStudents(user.role) ? (
          <EnrollCard
            pending={studentsApi.pending}
            error={studentsApi.error}
            onEnroll={async (input) => {
              const created = await studentsApi.enroll(input);
              if (created) {
                router.push(`/dashboard/students/${created.id}`);
              }
            }}
          />
        ) : (
          <Card>
            <p className="text-[15px] text-muted">
              Open a student to see their level and diagnostics. Front desk
              enrolls new families.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}

function EnrollCard({
  pending,
  error,
  onEnroll,
}: {
  pending: boolean;
  error: string | null;
  onEnroll: (input: EnrollStudentInput) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetLevel, setTargetLevel] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await onEnroll({
      name: name.trim(),
      email: email.trim(),
      password,
      targetLevel: targetLevel
        ? (targetLevel as EnrollStudentInput['targetLevel'])
        : null,
    });
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight">Enroll a student</h2>
      <p className="mt-1 text-sm text-muted">
        Creates their login and a blank academic file. Confirm a placement
        before seating them in a class.
      </p>
      <form className="mt-4 flex flex-col gap-3" onSubmit={onSubmit}>
        <Field label="Full name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </Field>
        <Field label="Temporary password" hint="Share this with the family.">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Goal">
          <CefrSelect
            allowEmpty
            emptyLabel="Set later"
            value={targetLevel}
            onChange={setTargetLevel}
          />
        </Field>
        {error ? <Notice>{error}</Notice> : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? 'Saving…' : 'Enroll'}
        </Button>
      </form>
    </Card>
  );
}
