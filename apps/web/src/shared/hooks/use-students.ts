'use client';

import { useCallback, useState } from 'react';
import type { ApiError } from '@/infra/http/api-error';
import type { Result } from 'neverthrow';
import type { ApiSuccess } from '@/infra/http';
import {
  studentsRepository,
  type AdminAdjustCefrBody,
  type CreateStudentInput,
  type Student,
  type UpdateStudentTargetLevelBody,
} from '@/module/students';
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

export function useStudents() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateStudentInput) => {
    setPending(true);
    const data = await unwrap(await studentsRepository.create(input), setError);
    setPending(false);
    return data;
  }, []);

  const getById = useCallback(async (studentId: string) => {
    setPending(true);
    const data = await unwrap(
      await studentsRepository.getById(studentId),
      setError,
    );
    setPending(false);
    return data;
  }, []);

  const updateTargetLevel = useCallback(
    async (studentId: string, input: UpdateStudentTargetLevelBody) => {
      setPending(true);
      const data = await unwrap(
        await studentsRepository.updateTargetLevel(studentId, input),
        setError,
      );
      setPending(false);
      return data;
    },
    [],
  );

  const adminAdjustCefr = useCallback(
    async (studentId: string, input: AdminAdjustCefrBody) => {
      setPending(true);
      const data = await unwrap(
        await studentsRepository.adminAdjustCefr(studentId, input),
        setError,
      );
      setPending(false);
      return data;
    },
    [],
  );

  return {
    create,
    getById,
    updateTargetLevel,
    adminAdjustCefr,
    pending,
    error,
  };
}

export type { Student };
