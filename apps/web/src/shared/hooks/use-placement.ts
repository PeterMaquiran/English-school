'use client';

import { useCallback, useState } from 'react';
import type { Result } from 'neverthrow';
import type { ApiSuccess } from '@/infra/http';
import type { ApiError } from '@/infra/http/api-error';
import {
  placementRepository,
  type RecordPlacementTestBody,
  type ReplacePlacementScoreBandsInput,
} from '@/module/placement';
import { getApiErrorMessage } from '@/utils/api-error-message';

async function unwrap<T>(
  result: Result<ApiSuccess<T>, ApiError>,
  setError: (message: string | null) => void,
): Promise<T | null> {
  if (result.isErr()) {
    setError(getApiErrorMessage(result.error));
    return null;
  }
  setError(null);
  return result.value.data;
}

export function usePlacement() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listScoreBands = useCallback(async () => {
    setPending(true);
    const data = await unwrap(
      await placementRepository.listScoreBands(),
      setError,
    );
    setPending(false);
    return data;
  }, []);

  const replaceScoreBands = useCallback(
    async (input: ReplacePlacementScoreBandsInput) => {
      setPending(true);
      const data = await unwrap(
        await placementRepository.replaceScoreBands(input),
        setError,
      );
      setPending(false);
      return data;
    },
    [],
  );

  const listTests = useCallback(async (studentId: string) => {
    setPending(true);
    const data = await unwrap(
      await placementRepository.listTests(studentId),
      setError,
    );
    setPending(false);
    return data;
  }, []);

  const recordTest = useCallback(
    async (studentId: string, input: RecordPlacementTestBody) => {
      setPending(true);
      const data = await unwrap(
        await placementRepository.recordTest(studentId, input),
        setError,
      );
      setPending(false);
      return data;
    },
    [],
  );

  const confirmTest = useCallback(async (placementTestId: string) => {
    setPending(true);
    const data = await unwrap(
      await placementRepository.confirmTest(placementTestId),
      setError,
    );
    setPending(false);
    return data;
  }, []);

  const listLevelHistory = useCallback(async (studentId: string) => {
    setPending(true);
    const data = await unwrap(
      await placementRepository.listLevelHistory(studentId),
      setError,
    );
    setPending(false);
    return data;
  }, []);

  return {
    listScoreBands,
    replaceScoreBands,
    listTests,
    recordTest,
    confirmTest,
    listLevelHistory,
    pending,
    error,
  };
}
