"use client";

import { useCallback, useState } from "react";
import { getApiErrorMessage } from "@/utils/api-error-message";
import type { LoginInput } from "../data/dtos";
import { login } from "../use-case/login";

export function useLogin() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: LoginInput) => {
    setPending(true);
    setError(null);

    const result = await login(input);

    setPending(false);

    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return null;
    }

    return result.value.data.user;
  }, []);

  return { submit, pending, error };
}
