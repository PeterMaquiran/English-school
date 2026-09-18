'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { traceFn, type Span } from 'zentrace';
import { Button } from '@/components/Button';
import { Field, Input } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { useLogin } from '../hooks/use-login';

export function LoginForm() {
  const router = useRouter();
  const { submit, pending, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = traceFn(
    async (event: FormEvent<HTMLFormElement>, span?: Span) => {
      event.preventDefault();

      const user = await submit({ email, password }, span);

      if (user) {
        span?.setAttribute('auth.outcome', 'success');
        span?.setAttribute('user.id', user.id);
        router.push('/dashboard');
        router.refresh();
      }
    },
    { name: 'LoginForm.onSubmit', module: 'auth', captureArgs: false },
  );

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <Field label="Email">
        <Input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Field label="Password">
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>
      {error ? <Notice>{error}</Notice> : null}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? 'Signing in…' : 'Continue'}
      </Button>
    </form>
  );
}
