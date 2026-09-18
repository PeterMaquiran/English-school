'use client';

import { useCallback, useState } from 'react';
import type { Span } from 'zentrace';
import { authRepository, type LoginInput } from '@/module/auth';
import { getApiErrorMessage } from '@/utils/api-error-message';

export function useLogin() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: LoginInput, span?: Span) => {
    setPending(true);
    setError(null);

    const result = await authRepository.login(input, span);

    setPending(false);

    if (result.isErr()) {
      const message = getApiErrorMessage(result.error);
      span?.setAttribute('auth.outcome', 'failure');
      span?.recordError(result.error, message);
      span?.console.error('login failed', message);
      setError(message);
      return null;
    }

    span?.setAttribute('auth.outcome', 'success');
    span?.setAttribute('user.id', result.value.data.user.id);
    return result.value.data.user;
  }, []);

  return { submit, pending, error };
}
