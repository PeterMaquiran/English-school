'use client';

import { useCallback, useState } from 'react';
import { traceFn, type Span } from 'zentrace';
import { authRepository, type LoginInput } from '@/module/auth';
import { getApiErrorMessage } from '@/utils/api-error-message';

export function useLogin() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    traceFn(
      async (input: LoginInput, span?: Span) => {
        setPending(true);
        setError(null);
        span?.console.log('login request started', { email: input.email });

        const result = await authRepository.login(input, span);

        setPending(false);

        if (result.isErr()) {
          const message = getApiErrorMessage(result.error);
          span?.console.error('login failed', message);
          span?.recordError(result.error, message);
          setError(message);
          return null;
        }

        span?.console.info('login succeeded', {
          userId: result.value.data.user.id,
        });
        return result.value.data.user;
      },
      { name: 'useLogin.submit', module: 'auth', captureArgs: false },
    ),
    [],
  );

  return { submit, pending, error };
}
