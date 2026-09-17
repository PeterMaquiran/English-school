'use client';

import { useCallback, useState } from 'react';
import { authRepository, type LoginInput } from '@/module/auth';
import { getApiErrorMessage } from '@/utils/api-error-message';

export function useLogin() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: LoginInput) => {
    setPending(true);
    setError(null);

    const result = await authRepository.login(input);

    setPending(false);

    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return null;
    }

    return result.value.data.user;
  }, []);

  return { submit, pending, error };
}
